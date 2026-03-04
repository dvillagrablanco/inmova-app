import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/payments/[id]/mark-paid
 * Marca un pago como cobrado con un solo click.
 * Body opcional: { metodoPago?: string, fechaPago?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user?.companyId,
      request,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const paymentId = params.id;

    // Verify the payment exists and belongs to this company
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        contract: {
          unit: {
            building: {
              companyId: scope.activeCompanyId,
            },
          },
        },
      },
      include: {
        contract: {
          include: {
            tenant: { select: { nombreCompleto: true, email: true } },
            unit: { select: { numero: true, id: true, building: { select: { id: true, nombre: true } } } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    if (payment.estado === 'pagado') {
      return NextResponse.json({ error: 'El pago ya está marcado como pagado' }, { status: 400 });
    }

    // Parse optional body
    let metodoPago = 'transferencia';
    let fechaPago = new Date();
    try {
      const body = await request.json();
      if (body.metodoPago) metodoPago = body.metodoPago;
      if (body.fechaPago) fechaPago = new Date(body.fechaPago);
    } catch {
      // No body provided, use defaults
    }

    // Update payment
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        estado: 'pagado',
        fechaPago: fechaPago,
        metodoPago: metodoPago,
      },
    });

    logger.info('[Payment] Marked as paid', {
      paymentId,
      companyId: scope.activeCompanyId,
      userId: session.user.id,
      monto: payment.monto,
      tenant: payment.contract?.tenant?.nombreCompleto,
    });

    // Send receipt email to tenant (async, don't block response)
    const tenantEmail = payment.contract?.tenant?.email;
    if (tenantEmail) {
      try {
        const { sendEmail } = await import('@/lib/email-config');
        const monto = Number(payment.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 });
        const fecha = fechaPago.toLocaleDateString('es-ES');
        const unidad = `${payment.contract?.unit?.building?.nombre} - ${payment.contract?.unit?.numero}`;
        const inquilino = payment.contract?.tenant?.nombreCompleto || '';
        await sendEmail({
          to: tenantEmail,
          subject: `Recibo de pago - ${payment.periodo || 'Alquiler'}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#16a34a;">✓ Pago Recibido</h2>
              <p>Estimado/a <strong>${inquilino}</strong>,</p>
              <p>Confirmamos la recepción de su pago:</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Concepto</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${payment.periodo || 'Alquiler mensual'}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Unidad</td><td style="padding:8px;border-bottom:1px solid #eee;">${unidad}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Importe</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;font-size:18px;color:#16a34a;">€${monto}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Fecha</td><td style="padding:8px;border-bottom:1px solid #eee;">${fecha}</td></tr>
                <tr><td style="padding:8px;color:#666;">Método</td><td style="padding:8px;">${metodoPago}</td></tr>
              </table>
              <p style="color:#666;font-size:12px;">Este recibo se ha generado automáticamente. Conserve este email como comprobante.</p>
            </div>
          `,
        });
        logger.info('[Payment] Receipt email sent', { paymentId, tenantEmail });
      } catch (emailError) {
        logger.warn('[Payment] Failed to send receipt email', { paymentId, error: emailError });
      }
    }

    // Notify admin/gestor about payment received
    try {
      const { sendEmail } = await import('@/lib/email-config');
      const adminUsers = await prisma.user.findMany({
        where: { companyId: scope.activeCompanyId, role: 'administrador', activo: true },
        select: { email: true },
      });
      const monto = Number(payment.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 });
      const inquilino = payment.contract?.tenant?.nombreCompleto || '';
      const unidad = `${payment.contract?.unit?.building?.nombre} - ${payment.contract?.unit?.numero}`;
      for (const admin of adminUsers) {
        await sendEmail({
          to: admin.email,
          subject: `✅ Pago recibido - ${inquilino} (€${monto})`,
          html: `<p>Pago de <strong>${inquilino}</strong> por <strong>€${monto}</strong> en ${unidad} marcado como cobrado.</p>`,
        }).catch(() => {});
      }
    } catch { /* non-blocking */ }

    // Auto-create accounting transaction for Zucchetti sync
    try {
      const buildingId = payment.contract?.unit?.building?.id;
      await prisma.accountingTransaction.create({
        data: {
          companyId: scope.activeCompanyId,
          buildingId: buildingId ?? undefined,
          unitId: payment.contract?.unit?.id ?? undefined,
          tipo: 'ingreso',
          categoria: 'ingreso_renta',
          concepto: `Cobro alquiler ${payment.periodo || ''} - ${payment.contract?.tenant?.nombreCompleto || ''}`,
          monto: Number(payment.monto),
          fecha: fechaPago,
          referencia: `PAY-${paymentId}`,
          paymentId: paymentId,
        },
      });
      logger.info('[Payment] Accounting transaction created for Zucchetti sync', { paymentId });
    } catch (accErr) {
      logger.warn('[Payment] Failed to create accounting transaction', { paymentId, error: accErr });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: updated.id,
        estado: updated.estado,
        fechaPago: updated.fechaPago,
        monto: Number(updated.monto),
        inquilino: payment.contract?.tenant?.nombreCompleto,
        unidad: `${payment.contract?.unit?.building?.nombre} - ${payment.contract?.unit?.numero}`,
      },
    });
  } catch (error: any) {
    logger.error('[Payment Mark Paid Error]:', error);
    return NextResponse.json({ error: 'Error al marcar pago como cobrado' }, { status: 500 });
  }
}
