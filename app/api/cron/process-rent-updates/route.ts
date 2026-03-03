/**
 * CRON: Process Rent Updates (IPC)
 *
 * Detects contracts with anniversary in the next 30 days and reports
 * pending IPC rent updates. Sends email summary to admins.
 *
 * POST /api/cron/process-rent-updates
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { verifyCronAuth } from '@/lib/cron-auth';
import { sendEmail } from '@/lib/email-service';
import { detectPendingRentUpdates } from '@/lib/rent-ipc-update-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(request: NextRequest) {
  const authResult = await verifyCronAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error ?? 'No autorizado' }, { status: authResult.status });
  }

  const prisma = await getPrisma();

  try {
    // Vidaro group: holding + child companies
    const holdingId = 'c65159283deeaf6815f8eda95';
    const company = await prisma.company.findUnique({
      where: { id: holdingId },
      include: { childCompanies: { select: { id: true } } },
    });

    const companyIds = company
      ? [company.id, ...company.childCompanies.map((c: { id: string }) => c.id)]
      : await prisma.company.findMany({ select: { id: true } }).then((cs) => cs.map((c) => c.id));

    const pending = await detectPendingRentUpdates(companyIds);

    const fmt = (n: number) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);

    let emailsSent = 0;
    if (pending.length > 0) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
            📋 Actualizaciones de Renta por IPC Pendientes
          </h1>
          <p style="color: #666;">Se han detectado ${pending.length} contratos con aniversario en los próximos 30 días.</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background: #F3F4F6;">
              <th style="padding: 8px; border: 1px solid #E5E7EB; text-align: left;">Inquilino / Unidad</th>
              <th style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">Renta Actual</th>
              <th style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">Nueva Renta</th>
              <th style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">Incremento %</th>
              <th style="padding: 8px; border: 1px solid #E5E7EB; text-align: left;">Aniversario</th>
            </tr>
            ${pending
              .map(
                (p) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB;">${p.tenantName} — ${p.buildingName} ${p.unitNumber}</td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">${fmt(p.currentRent)}</td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">${fmt(p.newRent)}</td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">${p.increasePercent}%</td>
              <td style="padding: 8px; border: 1px solid #E5E7EB;">${p.anniversaryDate.toLocaleDateString('es-ES')}</td>
            </tr>
            `
              )
              .join('')}
          </table>

          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Generado automáticamente por Inmova App — ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      `;

      const adminUsers = await prisma.user.findMany({
        where: { activo: true, role: { in: ['super_admin', 'administrador'] } },
        select: { email: true },
      });

      for (const user of adminUsers) {
        const ok = await sendEmail({
          to: user.email,
          subject: `📋 Actualizaciones de Renta IPC — ${pending.length} contratos pendientes`,
          html,
        });
        if (ok) emailsSent++;
      }

      logger.info('[Cron] Rent updates report sent', { pendingCount: pending.length, recipients: emailsSent });
    }

    return NextResponse.json({
      success: true,
      summary: {
        pendingCount: pending.length,
        emailsSent,
      },
      pending,
    });
  } catch (error: unknown) {
    logger.error('[Cron] Process rent updates error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
