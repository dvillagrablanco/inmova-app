/**
 * CRON: Check Position Alerts
 *
 * Checks financial positions for significant changes (>5%).
 * Flags valorActual vs costeTotal deviations and valorActual=0 with costeTotal>0.
 * Sends email to admin users if there are alerts.
 *
 * POST /api/cron/check-position-alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { verifyCronAuth } from '@/lib/cron-auth';
import { sendEmail } from '@/lib/email-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const THRESHOLD_PCT = 5;

export async function POST(request: NextRequest) {
  const authResult = await verifyCronAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error ?? 'No autorizado' }, { status: authResult.status });
  }

  const prisma = await getPrisma();

  try {
    const accounts = await prisma.financialAccount.findMany({
      where: { activa: true },
      include: {
        positions: {
          select: {
            id: true,
            nombre: true,
            isin: true,
            valorActual: true,
            costeTotal: true,
            divisa: true,
          },
        },
        company: { select: { nombre: true } },
      },
    });

    let emailsSent = 0;
    const alerts: Array<{
      accountName: string;
      companyName: string;
      positionName: string;
      isin: string | null;
      valorActual: number;
      costeTotal: number;
      changePct: number;
      reason: string;
    }> = [];

    for (const acc of accounts) {
      for (const pos of acc.positions) {
        const valorActual = pos.valorActual ?? 0;
        const costeTotal = pos.costeTotal ?? 0;

        if (valorActual === 0 && costeTotal > 0) {
          alerts.push({
            accountName: acc.entidad,
            companyName: acc.company?.nombre ?? 'N/A',
            positionName: pos.nombre,
            isin: pos.isin,
            valorActual,
            costeTotal,
            changePct: -100,
            reason: 'Valor actual 0 con coste total > 0 (posible error de datos)',
          });
          continue;
        }

        if (costeTotal <= 0) continue;

        const changePct = ((valorActual - costeTotal) / costeTotal) * 100;
        if (Math.abs(changePct) > THRESHOLD_PCT) {
          alerts.push({
            accountName: acc.entidad,
            companyName: acc.company?.nombre ?? 'N/A',
            positionName: pos.nombre,
            isin: pos.isin,
            valorActual,
            costeTotal,
            changePct: Math.round(changePct * 100) / 100,
            reason: `Cambio >${THRESHOLD_PCT}% (${changePct > 0 ? 'ganancia' : 'pérdida'})`,
          });
        }
      }
    }

    const fmt = (n: number) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);

    if (alerts.length > 0) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #DC2626; border-bottom: 2px solid #DC2626; padding-bottom: 10px;">
            ⚠️ Alertas de Posiciones Financieras
          </h1>
          <p style="color: #666;">Se han detectado ${alerts.length} posiciones con cambios significativos (>${THRESHOLD_PCT}%).</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background: #F3F4F6;">
              <th style="padding: 8px; border: 1px solid #E5E7EB; text-align: left;">Cuenta / Posición</th>
              <th style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">Valor Actual</th>
              <th style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">Coste Total</th>
              <th style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">Cambio %</th>
              <th style="padding: 8px; border: 1px solid #E5E7EB; text-align: left;">Motivo</th>
            </tr>
            ${alerts
              .map(
                (a) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB;">${a.accountName} — ${a.positionName}</td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">${fmt(a.valorActual)}</td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">${fmt(a.costeTotal)}</td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right; color: ${a.changePct >= 0 ? '#059669' : '#DC2626'};">${a.changePct}%</td>
              <td style="padding: 8px; border: 1px solid #E5E7EB;">${a.reason}</td>
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
          subject: `⚠️ Alertas de Posiciones Financieras — ${alerts.length} detectadas`,
          html,
        });
        if (ok) emailsSent++;
      }

      logger.info('[Cron] Position alerts sent', { alertsCount: alerts.length, recipients: emailsSent });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalAccounts: accounts.length,
        totalPositions: accounts.reduce((s, a) => s + a.positions.length, 0),
        alertsCount: alerts.length,
        emailsSent,
      },
      alerts: alerts.slice(0, 50),
    });
  } catch (error: unknown) {
    logger.error('[Cron] Check position alerts error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
