/**
 * CRON: Informe Mensual Family Office
 * 
 * Genera y envía por email el informe consolidado del grupo:
 * - P&L por sociedad
 * - Posiciones financieras
 * - Morosidad
 * - Vencimientos de contratos próximos
 * 
 * POST /api/cron/monthly-fo-report
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { verifyCronAuth } from '@/lib/cron-auth';
import { sendEmail } from '@/lib/email-service';
import { getAccountLiquidBalance } from '@/lib/family-office-scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(request: NextRequest) {
  const authResult = await verifyCronAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error || 'No autorizado' },
      { status: authResult.status }
    );
  }

  const prisma = await getPrisma();

  try {
    const now = new Date();
    const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    // Grupo Vidaro
    const company = await prisma.company.findFirst({
      where: {
        parentCompanyId: null,
        nombre: { contains: 'Vidaro', mode: 'insensitive' },
      },
      include: { childCompanies: { select: { id: true, nombre: true } } },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const allIds = [company.id, ...company.childCompanies.map((c: any) => c.id)];

    // KPIs
    const [totalUnits, occupiedUnits, activeContracts, overduePayments, expiringContracts] = await Promise.all([
      prisma.unit.count({ where: { building: { companyId: { in: allIds }, isDemo: false } } }),
      prisma.unit.count({ where: { building: { companyId: { in: allIds }, isDemo: false }, estado: 'ocupada' } }),
      prisma.contract.count({ where: { unit: { building: { companyId: { in: allIds } } }, estado: 'activo' } }),
      prisma.payment.count({ where: { contract: { unit: { building: { companyId: { in: allIds } } } }, estado: 'pendiente', fechaVencimiento: { lt: now } } }),
      prisma.contract.count({
        where: {
          unit: { building: { companyId: { in: allIds } } },
          estado: 'activo',
          fechaFin: { lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0';

    // Patrimonio
    const [inmobAgg, finAgg, peRows, tesoRows] = await Promise.all([
      prisma.unit.aggregate({ _sum: { valorMercado: true }, where: { building: { companyId: { in: allIds }, isDemo: false } } }),
      prisma.financialPosition.aggregate({ _sum: { valorActual: true }, where: { account: { companyId: { in: allIds } } } }),
      prisma.participation.findMany({
        where: { companyId: { in: allIds }, activa: true },
        select: { valoracionActual: true, valorEstimado: true, valorContable: true },
      }),
      prisma.financialAccount.findMany({
        where: { companyId: { in: allIds }, activa: true },
        select: { saldoActual: true, positions: { select: { valorActual: true } } },
      }),
    ]);

    const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

    const inmob = inmobAgg._sum.valorMercado || 0;
    const fin = finAgg._sum.valorActual || 0;
    const pe = peRows.reduce(
      (sum, row) => sum + (row.valoracionActual || row.valorEstimado || row.valorContable || 0),
      0
    );
    const teso = tesoRows.reduce((sum, row) => sum + getAccountLiquidBalance(row), 0);

    // Generate HTML email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
          📊 Informe Mensual — Grupo Vidaro
        </h1>
        <p style="color: #666;">Periodo: ${monthName}</p>
        
        <h2 style="color: #333;">🏢 Patrimonio Consolidado</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background: #F3F4F6;">
            <td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Inmobiliario</strong></td>
            <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: right;">${fmt(inmob)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Financiero</strong></td>
            <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: right;">${fmt(fin)}</td>
          </tr>
          <tr style="background: #F3F4F6;">
            <td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Private Equity</strong></td>
            <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: right;">${fmt(pe)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Tesorería</strong></td>
            <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: right;">${fmt(teso)}</td>
          </tr>
          <tr style="background: #4F46E5; color: white;">
            <td style="padding: 10px; border: 1px solid #4F46E5;"><strong>TOTAL</strong></td>
            <td style="padding: 10px; border: 1px solid #4F46E5; text-align: right;"><strong>${fmt(inmob + fin + pe + teso)}</strong></td>
          </tr>
        </table>

        <h2 style="color: #333;">📈 KPIs Operativos</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background: #F3F4F6;">
            <td style="padding: 8px; border: 1px solid #E5E7EB;">Unidades totales</td>
            <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">${totalUnits}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #E5E7EB;">Ocupación</td>
            <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">${occupancyRate}%</td>
          </tr>
          <tr style="background: #F3F4F6;">
            <td style="padding: 8px; border: 1px solid #E5E7EB;">Contratos activos</td>
            <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">${activeContracts}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #E5E7EB; color: ${overduePayments > 0 ? '#DC2626' : '#333'};">Pagos vencidos</td>
            <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right; color: ${overduePayments > 0 ? '#DC2626' : '#333'}; font-weight: bold;">${overduePayments}</td>
          </tr>
          <tr style="background: #F3F4F6;">
            <td style="padding: 8px; border: 1px solid #E5E7EB; color: ${expiringContracts > 0 ? '#D97706' : '#333'};">Contratos vencen en 90 días</td>
            <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right; color: ${expiringContracts > 0 ? '#D97706' : '#333'}; font-weight: bold;">${expiringContracts}</td>
          </tr>
        </table>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Generado automáticamente por Inmova App — ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          <br/>
          <a href="https://inmovaapp.com/family-office/dashboard">Ver Dashboard Patrimonial 360°</a>
        </p>
      </div>
    `;

    // Send email to admin users
    const adminUsers = await prisma.user.findMany({
      where: { activo: true, role: { in: ['super_admin', 'administrador'] } },
      select: { email: true, name: true },
    });

    let sent = 0;
    for (const user of adminUsers) {
      const ok = await sendEmail({
        to: user.email,
        subject: `📊 Informe Mensual Grupo Vidaro — ${monthName}`,
        html,
      });
      if (ok) sent++;
    }

    logger.info('[Cron] Monthly FO report sent', { recipients: sent, total: adminUsers.length });

    return NextResponse.json({
      success: true,
      report: {
        patrimonio: { inmob, fin, pe, teso, total: inmob + fin + pe + teso },
        kpis: { totalUnits, occupancyRate, activeContracts, overduePayments, expiringContracts },
        emailsSent: sent,
        recipients: adminUsers.map(u => u.email),
      },
    });
  } catch (error: any) {
    logger.error('[Cron] Monthly FO report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
