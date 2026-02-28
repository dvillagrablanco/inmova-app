import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api-auth-guard';
import logger from '@/lib/logger';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/cron/daily-summary
 * Genera y envía resumen diario al gestor de cada empresa:
 * - Pagos pendientes/atrasados
 * - Contratos que vencen esta semana
 * - Incidencias abiertas
 * - Unidades vacías
 * - Acción urgente del día
 */
export async function GET(request: NextRequest) {
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;

  const prisma = await getPrisma();

  try {
    const today = new Date();
    const in7days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Obtener empresas activas (no demo)
    const companies = await prisma.company.findMany({
      where: { activo: true, esEmpresaPrueba: false },
      select: { id: true, nombre: true, emailContacto: true },
    });

    const summaries = [];

    for (const company of companies) {
      const companyId = company.id;

      const [
        pendingPayments,
        overduePayments,
        expiringContracts,
        openMaintenance,
        vacantUnits,
      ] = await Promise.all([
        prisma.payment.count({
          where: { contract: { unit: { building: { companyId } } }, estado: 'pendiente' },
        }),
        prisma.payment.findMany({
          where: { contract: { unit: { building: { companyId } } }, estado: 'atrasado' },
          include: {
            contract: {
              include: {
                tenant: { select: { nombreCompleto: true } },
                unit: { select: { numero: true, building: { select: { nombre: true } } } },
              },
            },
          },
          orderBy: { fechaVencimiento: 'asc' },
          take: 5,
        }),
        prisma.contract.findMany({
          where: {
            estado: 'activo',
            fechaFin: { gte: today, lte: in7days },
            unit: { building: { companyId } },
          },
          include: {
            tenant: { select: { nombreCompleto: true } },
            unit: { select: { numero: true, building: { select: { nombre: true } } } },
          },
        }),
        prisma.maintenanceRequest.count({
          where: { unit: { building: { companyId } }, estado: 'pendiente' },
        }),
        prisma.unit.count({
          where: { building: { companyId, isDemo: false }, estado: 'disponible' },
        }),
      ]);

      // Calcular importe total atrasado
      const importeAtrasado = overduePayments.reduce((s, p) => s + p.monto, 0);

      // Determinar acción urgente
      let accionUrgente = 'Sin acciones urgentes hoy.';
      if (overduePayments.length > 0) {
        const peor = overduePayments[0];
        const dias = differenceInDays(today, peor.fechaVencimiento);
        accionUrgente = `⚠️ Pago atrasado ${dias} días: ${peor.contract?.tenant?.nombreCompleto} (${peor.contract?.unit?.building?.nombre} ${peor.contract?.unit?.numero}) — ${peor.monto}€`;
      } else if (expiringContracts.length > 0) {
        accionUrgente = `📋 ${expiringContracts.length} contrato(s) vencen esta semana. Revisar renovaciones.`;
      } else if (openMaintenance > 0) {
        accionUrgente = `🔧 ${openMaintenance} solicitud(es) de mantenimiento pendientes.`;
      }

      const summary = {
        companyId,
        companyName: company.nombre,
        email: company.emailContacto,
        fecha: format(today, "EEEE d 'de' MMMM, yyyy", { locale: es }),
        datos: {
          pagosPendientes: pendingPayments,
          pagosAtrasados: overduePayments.length,
          importeAtrasado: Math.round(importeAtrasado * 100) / 100,
          contratosVencenSemana: expiringContracts.length,
          incidenciasPendientes: openMaintenance,
          unidadesVacias: vacantUnits,
        },
        detalle: {
          topAtrasados: overduePayments.map((p) => ({
            inquilino: p.contract?.tenant?.nombreCompleto,
            edificio: p.contract?.unit?.building?.nombre,
            unidad: p.contract?.unit?.numero,
            importe: p.monto,
            diasRetraso: differenceInDays(today, p.fechaVencimiento),
          })),
          contratosVencen: expiringContracts.map((c) => ({
            inquilino: c.tenant?.nombreCompleto,
            edificio: c.unit?.building?.nombre,
            unidad: c.unit?.numero,
            fechaFin: c.fechaFin,
          })),
        },
        accionUrgente,
      };

      summaries.push(summary);

      // Enviar email si hay nodemailer configurado
      try {
        if (company.emailContacto && process.env.SMTP_HOST) {
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            },
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM || 'INMOVA <noreply@inmovaapp.com>',
            to: company.emailContacto,
            subject: `📊 Resumen diario ${company.nombre} — ${format(today, 'dd/MM/yyyy')}`,
            html: `
              <h2>Resumen diario — ${company.nombre}</h2>
              <p>${summary.fecha}</p>
              <hr/>
              <h3>🔴 Acción urgente</h3>
              <p><strong>${accionUrgente}</strong></p>
              <h3>📊 Resumen</h3>
              <ul>
                <li>Pagos pendientes: <strong>${pendingPayments}</strong></li>
                <li>Pagos atrasados: <strong>${overduePayments.length}</strong> (${importeAtrasado.toFixed(0)}€)</li>
                <li>Contratos vencen esta semana: <strong>${expiringContracts.length}</strong></li>
                <li>Incidencias pendientes: <strong>${openMaintenance}</strong></li>
                <li>Unidades vacías: <strong>${vacantUnits}</strong></li>
              </ul>
              ${overduePayments.length > 0 ? `
                <h3>⚠️ Top impagos</h3>
                <table border="1" cellpadding="6" style="border-collapse:collapse">
                  <tr><th>Inquilino</th><th>Edificio</th><th>Importe</th><th>Días</th></tr>
                  ${overduePayments.map((p) => `
                    <tr>
                      <td>${p.contract?.tenant?.nombreCompleto}</td>
                      <td>${p.contract?.unit?.building?.nombre} ${p.contract?.unit?.numero}</td>
                      <td>${p.monto}€</td>
                      <td>${differenceInDays(today, p.fechaVencimiento)}d</td>
                    </tr>
                  `).join('')}
                </table>
              ` : ''}
              <hr/>
              <p><small>Generado por INMOVA — <a href="https://inmovaapp.com/dashboard">Ir al dashboard</a></small></p>
            `,
          });
          logger.info(`[Daily Summary] Email enviado a ${company.emailContacto}`);
        }
      } catch (emailErr: any) {
        logger.warn(`[Daily Summary] Error enviando email a ${company.emailContacto}:`, emailErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Resumen diario generado para ${summaries.length} empresas`,
      summaries,
    });
  } catch (error: any) {
    logger.error('[Daily Summary]:', error);
    return NextResponse.json({ error: 'Error generando resumen diario' }, { status: 500 });
  }
}
