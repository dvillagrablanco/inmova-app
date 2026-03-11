/**
 * GET /api/cron/check-insurance
 *
 * Cron job diario que:
 * 1. Detecta pólizas vencidas → auto-renueva 1 año y marca para verificar prima
 * 2. Detecta pólizas próximas a vencer (60 días) → genera notificación
 * 3. Crea recordatorio para comprobar en contabilidad la prima renovada
 *
 * Llamar diariamente via cron o Vercel Cron Jobs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api-auth-guard';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authError = requireCronSecret(request);
  if (authError) return authError;

  try {
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const now = new Date();
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const actions: string[] = [];

    // 1. Find EXPIRED policies → auto-renew +1 year
    const expired = await prisma.insurancePolicy.findMany({
      where: {
        fechaVencimiento: { lt: now },
        estado: 'activa',
      },
      include: {
        building: { select: { nombre: true, companyId: true, company: { select: { nombre: true } } } },
      },
    });

    for (const pol of expired) {
      const oldVenc = pol.fechaVencimiento;
      const newVenc = new Date(oldVenc);
      newVenc.setFullYear(newVenc.getFullYear() + 1);

      const newInicio = new Date(pol.fechaInicio);
      newInicio.setFullYear(newInicio.getFullYear() + 1);

      const newRenovacion = new Date(newVenc);

      await prisma.insurancePolicy.update({
        where: { id: pol.id },
        data: {
          fechaInicio: newInicio,
          fechaVencimiento: newVenc,
          fechaRenovacion: newRenovacion,
          notas: (pol.notas || '') + `\n\n[AUTO-RENOVACIÓN ${now.toISOString().substring(0, 10)}] Póliza renovada automáticamente +1 año. VERIFICAR: comprobar en contabilidad que el recibo de la nueva prima ha sido cargado y el importe correcto (posible subida IPC).`,
        },
      });

      const msg = `Póliza ${pol.numeroPoliza} (${pol.aseguradora}) de ${pol.building?.nombre || '?'} auto-renovada: ${oldVenc.toISOString().substring(0, 10)} → ${newVenc.toISOString().substring(0, 10)}. VERIFICAR PRIMA EN CONTABILIDAD.`;
      actions.push(msg);
      logger.info(`[Insurance Cron] ${msg}`);

      // Create notification for admins
      if (pol.building?.companyId) {
        try {
          const admins = await prisma.user.findMany({
            where: {
              companyId: pol.building.companyId,
              role: { in: ['super_admin', 'administrador'] },
              activo: true,
            },
            select: { id: true },
          });

          for (const admin of admins) {
            await prisma.notification.create({
              data: {
                companyId: pol.building.companyId,
                userId: admin.id,
                tipo: 'seguro_renovacion',
                titulo: `Seguro renovado: ${pol.building?.nombre || pol.numeroPoliza}`,
                mensaje: `La póliza ${pol.numeroPoliza} (${pol.aseguradora}) se ha renovado automáticamente hasta ${newVenc.toISOString().substring(0, 10)}. Verificar en contabilidad que la prima del nuevo periodo ha sido cargada correctamente (posible subida por IPC).`,
              },
            });
          }
          actions.push(`  → Notificaciones enviadas a ${admins.length} admins`);
        } catch {
          // Notification model might not exist, skip
        }
      }
    }

    // 2. Find policies expiring in next 60 days → notify
    const expiringSoon = await prisma.insurancePolicy.findMany({
      where: {
        fechaVencimiento: { gte: now, lte: in60Days },
        estado: 'activa',
      },
      include: {
        building: { select: { nombre: true, companyId: true } },
      },
    });

    for (const pol of expiringSoon) {
      const daysLeft = Math.round((pol.fechaVencimiento.getTime() - now.getTime()) / 86400000);
      const msg = `Póliza ${pol.numeroPoliza} (${pol.building?.nombre || '?'}) vence en ${daysLeft} días (${pol.fechaVencimiento.toISOString().substring(0, 10)}). Pedir cotización de renovación.`;
      actions.push(msg);

      if (pol.building?.companyId && (daysLeft === 60 || daysLeft === 30 || daysLeft === 15 || daysLeft === 7 || daysLeft === 1)) {
        try {
          const admins = await prisma.user.findMany({
            where: {
              companyId: pol.building.companyId,
              role: { in: ['super_admin', 'administrador'] },
              activo: true,
            },
            select: { id: true },
          });

          for (const admin of admins) {
            await prisma.notification.create({
              data: {
                companyId: pol.building.companyId,
                userId: admin.id,
                tipo: 'seguro_renovacion',
                titulo: `Seguro vence en ${daysLeft} días: ${pol.building?.nombre || pol.numeroPoliza}`,
                mensaje: `La póliza ${pol.numeroPoliza} (${pol.aseguradora}) vence el ${pol.fechaVencimiento.toISOString().substring(0, 10)}. Contactar mediador: ${pol.agente || ''} ${pol.emailAgente || ''} ${pol.telefonoAgente || ''}. Prima actual: ${pol.primaAnual || 'desconocida'}€/año.`,
              },
            });
          }
        } catch { /* Notification model might not exist */ }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      actions,
    });
  } catch (error: any) {
    logger.error('[Insurance Cron]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
