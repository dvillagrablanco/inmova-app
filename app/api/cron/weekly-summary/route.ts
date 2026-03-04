import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api-auth-guard';
import logger from '@/lib/logger';
import { subDays, startOfWeek, endOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/cron/weekly-summary
 * Genera y envía resumen semanal al administrador de cada empresa:
 * - Pagos vencidos sin cobrar
 * - Contratos que vencen en 30 días
 * - Incidencias abiertas
 * - Cash-flow de la semana
 * - Ocupación actual
 */
export async function GET(request: NextRequest) {
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;

  const prisma = await getPrisma();

  try {
    const today = new Date();
    const in30days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const companies = await prisma.company.findMany({
      where: { activo: true, esEmpresaPrueba: false },
      select: { id: true, nombre: true },
    });

    const results = [];

    for (const company of companies) {
      try {
        // Find admin users for this company
        const admins = await prisma.user.findMany({
          where: { companyId: company.id, role: 'administrador', activo: true },
          select: { email: true, name: true },
        });

        if (admins.length === 0) continue;

        // Pagos vencidos
        const overduePayments = await prisma.payment.findMany({
          where: {
            contract: { unit: { building: { companyId: company.id } } },
            estado: 'pendiente',
            fechaVencimiento: { lt: today },
          },
          select: { monto: true, periodo: true },
        });

        const overdueTotal = overduePayments.reduce((s, p) => s + Number(p.monto), 0);

        // Contratos por vencer
        const expiringContracts = await prisma.contract.count({
          where: {
            unit: { building: { companyId: company.id } },
            estado: 'activo',
            fechaFin: { gte: today, lte: in30days },
          },
        });

        // Incidencias abiertas
        const openIncidents = await prisma.maintenanceRequest.count({
          where: {
            unit: { building: { companyId: company.id } },
            estado: { in: ['pendiente', 'en_progreso'] },
          },
        });

        // Pagos cobrados esta semana
        const weekPayments = await prisma.payment.aggregate({
          where: {
            contract: { unit: { building: { companyId: company.id } } },
            estado: 'pagado',
            fechaPago: { gte: weekStart, lte: weekEnd },
          },
          _sum: { monto: true },
          _count: true,
        });

        // Ocupación
        const totalUnits = await prisma.unit.count({
          where: { building: { companyId: company.id } },
        });
        const occupiedUnits = await prisma.unit.count({
          where: { building: { companyId: company.id }, estado: 'ocupada' },
        });
        const occupancy = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0';

        const fmt = (n: number) => new Intl.NumberFormat('es-ES', {
          style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
        }).format(n);

        const weekLabel = `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM yyyy', { locale: es })}`;

        // Send email to each admin
        const { sendEmail } = await import('@/lib/email-config');

        for (const admin of admins) {
          await sendEmail({
            to: admin.email,
            subject: `📊 Resumen Semanal - ${company.nombre} (${weekLabel})`,
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h2 style="border-bottom:2px solid #000;padding-bottom:10px;">Resumen Semanal</h2>
                <p style="color:#666;">${company.nombre} · ${weekLabel}</p>
                
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                  <tr style="background:#f9fafb;">
                    <td style="padding:12px;border:1px solid #e5e7eb;font-weight:bold;">💰 Cobrado esta semana</td>
                    <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;color:#16a34a;font-size:18px;">${fmt(Number(weekPayments._sum.monto) || 0)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px;border:1px solid #e5e7eb;">⚠️ Pagos vencidos</td>
                    <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;${overduePayments.length > 0 ? 'color:#dc2626;font-weight:bold;' : ''}">${overduePayments.length} (${fmt(overdueTotal)})</td>
                  </tr>
                  <tr style="background:#f9fafb;">
                    <td style="padding:12px;border:1px solid #e5e7eb;">📋 Contratos por vencer (30d)</td>
                    <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;">${expiringContracts}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px;border:1px solid #e5e7eb;">🔧 Incidencias abiertas</td>
                    <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;">${openIncidents}</td>
                  </tr>
                  <tr style="background:#f9fafb;">
                    <td style="padding:12px;border:1px solid #e5e7eb;">🏠 Ocupación</td>
                    <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;">${occupancy}% (${occupiedUnits}/${totalUnits})</td>
                  </tr>
                </table>
                
                <p style="text-align:center;margin-top:20px;">
                  <a href="https://inmovaapp.com/dashboard/ejecutivo" style="background:#000;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Ver Dashboard</a>
                </p>
                <p style="color:#999;font-size:11px;text-align:center;margin-top:20px;">Generado automáticamente por INMOVA</p>
              </div>
            `,
          });
        }

        results.push({
          company: company.nombre,
          admins: admins.length,
          overduePayments: overduePayments.length,
          expiringContracts,
          openIncidents,
        });
      } catch (companyError) {
        logger.error(`[Weekly Summary] Error for ${company.nombre}:`, companyError);
      }
    }

    return NextResponse.json({
      success: true,
      companiesProcessed: results.length,
      results,
    });
  } catch (error: any) {
    logger.error('[Weekly Summary Error]:', error);
    return NextResponse.json({ error: 'Error generando resumen semanal' }, { status: 500 });
  }
}
