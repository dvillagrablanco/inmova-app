import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api-auth-guard';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/cron/fiscal-alerts
 * Verifica vencimientos fiscales y crea notificaciones para los usuarios.
 * Ejecutar diariamente.
 */
export async function POST(request: NextRequest) {
  const authError = requireCronSecret(request);
  if (authError) return authError;

  try {
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const { getFiscalAlerts } = await import('@/lib/fiscal-alerts-service');

    // Obtener todas las empresas activas con sociedades patrimoniales
    const companies = await prisma.company.findMany({
      where: { activo: true, parentCompanyId: null }, // Solo holdings/matrices
      select: { id: true, nombre: true },
    });

    let totalAlerts = 0;
    let notificationsCreated = 0;

    for (const company of companies) {
      const alerts = await getFiscalAlerts(company.id);
      totalAlerts += alerts.length;

      // Crear notificaciones solo para alertas urgentes (alta/critica)
      const urgentAlerts = alerts.filter(a => a.urgencia === 'alta' || a.urgencia === 'critica');

      for (const alert of urgentAlerts) {
        // Obtener admins de la empresa
        const admins = await prisma.user.findMany({
          where: { companyId: alert.companyId, role: { in: ['administrador', 'super_admin'] }, activo: true },
          select: { id: true },
        });

        for (const admin of admins) {
          // Evitar duplicados: verificar si ya existe notificación similar
          const existing = await prisma.notification.findFirst({
            where: {
              userId: admin.id,
              tipo: 'alerta_sistema',
              titulo: { contains: alert.titulo },
              createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // últimos 7 días
            },
          });

          if (!existing) {
            await prisma.notification.create({
              data: {
                companyId: alert.companyId,
                userId: admin.id,
                tipo: 'alerta_sistema',
                titulo: alert.titulo,
                mensaje: `${alert.descripcion}. Faltan ${alert.diasRestantes} días (fecha límite: ${alert.fechaLimite.toLocaleDateString('es-ES')})`,
                prioridad: alert.urgencia === 'critica' ? 'alto' : 'alto',
                leida: false,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }

    logger.info(`[Fiscal Alerts Cron] ${totalAlerts} alerts found, ${notificationsCreated} notifications created`);

    return NextResponse.json({
      success: true,
      companiesChecked: companies.length,
      totalAlerts,
      notificationsCreated,
    });
  } catch (error: any) {
    logger.error('[Fiscal Alerts Cron]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
