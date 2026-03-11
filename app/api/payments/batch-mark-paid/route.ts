/**
 * POST /api/payments/batch-mark-paid
 * Marca múltiples pagos como cobrados en lote.
 * Body: { paymentIds: string[], metodoPago?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import { sendEmail } from '@/lib/email-config';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const paymentIds = Array.isArray(body.paymentIds) ? body.paymentIds : [];
    const metodoPago = typeof body.metodoPago === 'string' ? body.metodoPago : 'transferencia';

    if (paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'paymentIds es requerido y debe ser un array no vacío' },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();
    const now = new Date();

    // Fetch all payments and verify they belong to the company
    const payments = await prisma.payment.findMany({
      where: {
        id: { in: paymentIds },
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
            unit: { select: { numero: true, building: { select: { nombre: true } } } },
          },
        },
      },
    });

    const validIds = new Set(payments.map((p) => p.id));
    let failed = paymentIds.filter((id: string) => !validIds.has(id)).length;

    const toUpdate = payments.filter((p) => p.estado !== 'pagado');
    let updated = 0;

    for (const payment of toUpdate) {
      try {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            estado: 'pagado',
            fechaPago: now,
            metodoPago,
          },
        });
        updated++;

        // Send receipt email (async, don't block)
        const tenantEmail = payment.contract?.tenant?.email;
        if (tenantEmail) {
          const monto = Number(payment.monto).toLocaleString('es-ES', {
            minimumFractionDigits: 2,
          });
          const fecha = now.toLocaleDateString('es-ES');
          const unidad = `${payment.contract?.unit?.building?.nombre} - ${payment.contract?.unit?.numero}`;
          const inquilino = payment.contract?.tenant?.nombreCompleto || '';
          sendEmail({
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
          }).catch((err) => {
            logger.warn('[Payment Batch] Failed to send receipt email', {
              paymentId: payment.id,
              error: err,
            });
          });
        }
      } catch (err) {
        logger.error('[Payment Batch] Error updating payment', {
          paymentId: payment.id,
          error: err,
        });
        failed++;
      }
    }

    logger.info('[Payment Batch] Mark paid completed', {
      companyId: scope.activeCompanyId,
      userId: session.user.id,
      requested: paymentIds.length,
      updated,
      failed,
    });

    return NextResponse.json({
      success: true,
      updated,
      failed,
    });
  } catch (error) {
    logger.error('[Payment Batch Mark Paid Error]:', error);
    return NextResponse.json(
      { error: 'Error al marcar pagos como cobrados' },
      { status: 500 }
    );
  }
}
