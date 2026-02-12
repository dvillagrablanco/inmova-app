/**
 * API para Descargar Recibo de Pago
 * Genera y retorna el PDF del recibo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generatePaymentReceiptPDF } from '@/lib/pdf-generator';
import { downloadFile } from '@/lib/s3';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const paymentId = params.id;

    // Obtener el pago con todas las relaciones necesarias
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    if (!payment.fechaPago || payment.estado !== 'pagado') {
      return NextResponse.json(
        { error: 'El recibo solo está disponible para pagos completados' },
        { status: 400 }
      );
    }

    // Verificar que el usuario tenga acceso al recibo
    const userEmail = session?.user?.email
    const tenantEmail = payment.contract.tenant.email;

    // Si es el inquilino o un usuario del sistema de la misma compañía
    if (userEmail !== tenantEmail && session?.user?.companyId !== payment.contract.unit.building.company.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    let pdfBuffer: Buffer;

    // Si ya existe el PDF en S3, descargarlo
    if (payment.reciboPdfPath) {
      try {
        pdfBuffer = await downloadFile(payment.reciboPdfPath);
      } catch (error) {
        logger.info('PDF no encontrado en S3, generando nuevo...');
        // Si falla, generar nuevo PDF
        pdfBuffer = await generatePaymentReceiptPDF({
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
      }
    } else {
      // Generar PDF si no existe
      pdfBuffer = await generatePaymentReceiptPDF({
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
    }

    // Retornar el PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recibo_${payment.periodo.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Error generando recibo:', error);
    return NextResponse.json(
      { error: 'Error al generar recibo' },
      { status: 500 }
    );
  }
}
