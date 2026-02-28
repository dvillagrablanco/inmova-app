import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api-auth-guard';
import logger from '@/lib/logger';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/cron/monthly-board-report
 * Genera informe mensual para consejo de administración.
 * KPIs consolidados, alertas, comparativa sociedades, acciones recomendadas.
 */
export async function GET(request: NextRequest) {
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;

  const prisma = await getPrisma();

  try {
    const today = new Date();
    const lastMonth = subMonths(today, 1);
    const periodo = format(lastMonth, 'MMMM yyyy', { locale: es });

    // Obtener todas las empresas del grupo (no demo)
    const companies = await prisma.company.findMany({
      where: { activo: true, esEmpresaPrueba: false },
      select: { id: true, nombre: true, parentCompanyId: true, emailContacto: true },
    });

    // KPIs por sociedad
    const sociedades = [];
    let totalRenta = 0;
    let totalUnidades = 0;
    let totalOcupadas = 0;
    let totalAtrasados = 0;
    let importeAtrasado = 0;

    for (const company of companies) {
      const [units, contracts, overdue, expenses] = await Promise.all([
        prisma.unit.count({ where: { building: { companyId: company.id, isDemo: false } } }),
        prisma.contract.findMany({
          where: { unit: { building: { companyId: company.id } }, estado: 'activo' },
          select: { rentaMensual: true },
        }),
        prisma.payment.aggregate({
          where: { contract: { unit: { building: { companyId: company.id } } }, estado: 'atrasado' },
          _sum: { monto: true },
          _count: true,
        }),
        prisma.expense.aggregate({
          where: { building: { companyId: company.id }, isDemo: false },
          _sum: { monto: true },
        }),
      ]);

      const ocupadas = contracts.length;
      const renta = contracts.reduce((s, c) => s + c.rentaMensual, 0);
      const ocupacion = units > 0 ? (ocupadas / units) * 100 : 0;

      totalRenta += renta;
      totalUnidades += units;
      totalOcupadas += ocupadas;
      totalAtrasados += overdue._count || 0;
      importeAtrasado += overdue._sum?.monto || 0;

      sociedades.push({
        nombre: company.nombre,
        unidades: units,
        ocupadas,
        ocupacion: Math.round(ocupacion * 10) / 10,
        rentaMensual: Math.round(renta),
        rentaAnual: Math.round(renta * 12),
        atrasados: overdue._count || 0,
        importeAtrasado: Math.round(overdue._sum?.monto || 0),
        gastosTotales: Math.round(expenses._sum?.monto || 0),
      });
    }

    const ocupacionGlobal = totalUnidades > 0 ? (totalOcupadas / totalUnidades) * 100 : 0;

    // Generar resumen con IA si está disponible
    let resumenIA = '';
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
        const anthropic = new Anthropic({ apiKey });

        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL_PRIMARY,
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `Genera un resumen ejecutivo de 5-6 líneas para el consejo de administración del grupo Vidaro.

Datos del periodo ${periodo}:
${sociedades.map(s => `- ${s.nombre}: ${s.unidades} uds, ${s.ocupacion}% ocupación, ${s.rentaMensual}€/mes renta, ${s.atrasados} impagos (${s.importeAtrasado}€)`).join('\n')}

Consolidado: ${totalUnidades} uds, ${ocupacionGlobal.toFixed(1)}% ocupación, ${Math.round(totalRenta)}€/mes, ${totalAtrasados} impagos (${Math.round(importeAtrasado)}€)

Sé directo, profesional, con recomendaciones accionables.`,
          }],
        });
        resumenIA = response.content[0].type === 'text' ? response.content[0].text : '';
      } catch { /* continue without AI summary */ }
    }

    const report = {
      titulo: `Informe Mensual del Grupo — ${periodo}`,
      periodo,
      generado: today.toISOString(),
      resumenEjecutivo: resumenIA || `Periodo ${periodo}: ${totalUnidades} unidades, ${ocupacionGlobal.toFixed(1)}% ocupación, ${Math.round(totalRenta)}€/mes renta total.`,
      consolidado: {
        totalUnidades,
        totalOcupadas,
        ocupacion: Math.round(ocupacionGlobal * 10) / 10,
        rentaMensual: Math.round(totalRenta),
        rentaAnual: Math.round(totalRenta * 12),
        totalAtrasados,
        importeAtrasado: Math.round(importeAtrasado),
      },
      sociedades,
    };

    // Enviar email al contacto del holding
    const holding = companies.find(c => !c.parentCompanyId && c.emailContacto);
    if (holding?.emailContacto && process.env.SMTP_HOST) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'INMOVA <noreply@inmovaapp.com>',
          to: holding.emailContacto,
          subject: `📊 Informe Mensual Grupo Vidaro — ${periodo}`,
          html: `
            <h2>Informe Mensual — ${periodo}</h2>
            <p>${resumenIA || report.resumenEjecutivo}</p>
            <h3>Consolidado</h3>
            <table border="1" cellpadding="6" style="border-collapse:collapse">
              <tr><th>Sociedad</th><th>Uds</th><th>Ocupación</th><th>Renta/mes</th><th>Impagos</th></tr>
              ${sociedades.map(s => `
                <tr><td>${s.nombre}</td><td>${s.unidades}</td><td>${s.ocupacion}%</td><td>${s.rentaMensual}€</td><td>${s.atrasados} (${s.importeAtrasado}€)</td></tr>
              `).join('')}
              <tr style="font-weight:bold"><td>TOTAL</td><td>${totalUnidades}</td><td>${ocupacionGlobal.toFixed(1)}%</td><td>${Math.round(totalRenta)}€</td><td>${totalAtrasados} (${Math.round(importeAtrasado)}€)</td></tr>
            </table>
            <p><a href="https://inmovaapp.com/inversiones">Ver Dashboard Completo</a></p>
          `,
        });
        logger.info(`[Board Report] Email enviado a ${holding.emailContacto}`);
      } catch (e: any) {
        logger.warn('[Board Report] Error email:', e.message);
      }
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    logger.error('[Board Report]:', error);
    return NextResponse.json({ error: 'Error generando informe' }, { status: 500 });
  }
}
