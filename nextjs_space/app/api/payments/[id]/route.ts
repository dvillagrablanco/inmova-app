import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generatePaymentReceiptPDF, generatePaymentReceiptFilename } from '@/lib/pdf-generator';
import { paymentReceiptEmail } from '@/lib/email-templates';
import { sendEmail } from '@/lib/email-config';
import { uploadFile } from '@/lib/s3';
import logger, { logError } from '@/lib/logger';
import { invalidatePaymentsCache, invalidateDashboardCache } from '@/lib/api-cache-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
            tenant: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    logger.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Error al obtener pago' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { periodo, monto, fechaVencimiento, fechaPago, estado, metodoPago, nivelRiesgo } = body;

    // Obtener el pago actual antes de actualizar
    const currentPayment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          include: {
            unit: {
              include: {
                building: {
                  include: {
                    company: true,
                  },
                },
              },
            },
            tenant: true,
          },
        },
      },
    });

    if (!currentPayment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    const wasNotPaid = currentPayment.estado !== 'pagado';
    const willBePaid = estado === 'pagado';

    // Actualizar el pago
    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        periodo,
        monto: monto ? parseFloat(monto) : undefined,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
        fechaPago: fechaPago ? new Date(fechaPago) : (estado === 'pagado' && !currentPayment.fechaPago) ? new Date() : null,
        estado,
        metodoPago,
        nivelRiesgo,
      },
      include: {
        contract: {
          include: {
            unit: {
              include: {
                building: {
                  include: {
                    company: true,
                  },
                },
              },
            },
            tenant: true,
          },
        },
      },
    });

    // Si el pago se marca como "pagado" por primera vez, generar PDF y enviar email
    if (wasNotPaid && willBePaid && payment.fechaPago) {
      try {
        // Generar PDF del recibo
        const pdfBuffer = await generatePaymentReceiptPDF({
          id: payment.id,
          periodo: payment.periodo,
          monto: payment.monto,
          fechaPago: payment.fechaPago,
          metodoPago: payment.metodoPago || undefined,
          tenant: {
            nombreCompleto: payment.contract.tenant.nombreCompleto,
            dni: payment.contract.tenant.dni,
            email: payment.contract.tenant.email,
          },
          contract: {
            unit: {
              numero: payment.contract.unit.numero,
              building: {
                nombre: payment.contract.unit.building.nombre,
                direccion: payment.contract.unit.building.direccion,
              },
            },
          },
          company: {
            nombre: payment.contract.unit.building.company.nombre,
            cif: payment.contract.unit.building.company.cif || undefined,
            direccion: payment.contract.unit.building.company.direccion || undefined,
            telefono: payment.contract.unit.building.company.telefono || undefined,
            email: payment.contract.unit.building.company.email || undefined,
            logoUrl: payment.contract.unit.building.company.logoUrl || undefined,
          },
        });

        // Subir PDF a S3
        const filename = generatePaymentReceiptFilename(payment.id, payment.periodo);
        const s3Key = await uploadFile(pdfBuffer, `receipts/${filename}`);

        // Actualizar el payment con la ruta del PDF
        await prisma.payment.update({
          where: { id: payment.id },
          data: { reciboPdfPath: s3Key },
        });

        // Enviar email con el recibo adjunto
        const emailTemplate = paymentReceiptEmail({
          tenantName: payment.contract.tenant.nombreCompleto,
          periodo: payment.periodo,
          monto: payment.monto,
          fechaPago: payment.fechaPago,
          unidad: payment.contract.unit.numero,
          edificio: payment.contract.unit.building.nombre,
          company: {
            nombre: payment.contract.unit.building.company.nombre,
            email: payment.contract.unit.building.company.email || undefined,
            telefono: payment.contract.unit.building.company.telefono || undefined,
          },
        });

        await sendEmail({
          to: payment.contract.tenant.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
          attachments: [
            {
              filename,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ],
          companyName: payment.contract.unit.building.company.nombre,
        });

        logger.info(`✅ Recibo generado y enviado para pago ${payment.id}`);
      } catch (emailError) {
        logger.error('Error generando recibo o enviando email:', emailError);
        // No fallar la actualización del pago si falla el email
      }
    }

    // Invalidar cachés relacionados
    const companyId = payment.contract.unit.building.companyId;
    if (companyId) {
      invalidatePaymentsCache(companyId);
      invalidateDashboardCache(companyId);
    }

    return NextResponse.json(payment);
  } catch (error) {
    logger.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Error al actualizar pago' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;

    await prisma.payment.delete({
      where: { id: params.id },
    });

    // Invalidar cachés relacionados
    if (companyId) {
      invalidatePaymentsCache(companyId);
      invalidateDashboardCache(companyId);
    }

    return NextResponse.json({ message: 'Pago eliminado' });
  } catch (error) {
    logger.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Error al eliminar pago' }, { status: 500 });
  }
}
