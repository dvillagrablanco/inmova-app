/**
 * Cron Job para verificar cupones próximos a expirar
 * Ejecuta diariamente a las 9:00 AM
 * 
 * Configurar en vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-coupons",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { authorizeCronRequest } from '@/lib/cron-auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Verificar clave secreta para cron jobs
const CRON_SECRET = process.env.CRON_SECRET;

interface AlertConfig {
  diasAntes: number;
  campo: 'alertaEnviada7d' | 'alertaEnviada3d' | 'alertaEnviada1d';
  nivel: 'info' | 'warning' | 'critical';
  emoji: string;
}

const ALERT_CONFIGS: AlertConfig[] = [
  { diasAntes: 7, campo: 'alertaEnviada7d', nivel: 'info', emoji: '📅' },
  { diasAntes: 3, campo: 'alertaEnviada3d', nivel: 'warning', emoji: '⚠️' },
  { diasAntes: 1, campo: 'alertaEnviada1d', nivel: 'critical', emoji: '🚨' },
];

async function sendEmailAlert(subject: string, html: string) {
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"INMOVA Admin" <inmovaapp@gmail.com>',
      to: 'inmovaapp@gmail.com',
      subject: `[INMOVA] ${subject}`,
      html,
    });

    return true;
  } catch (error) {
    logger.error('[SendEmail Error]:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  // Cron auth guard (auditoria V2)
  const cronAuth = await authorizeCronRequest(request as any);
  if (!cronAuth.authorized) {
    return NextResponse.json({ error: cronAuth.error || 'No autorizado' }, { status: cronAuth.status });
  }

  try {
    // Verificar autorización
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET) {
      return NextResponse.json(
        { error: 'CRON_SECRET no configurado' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      // También permitir desde Vercel Cron
      const vercelCron = request.headers.get('x-vercel-cron');
      if (!vercelCron) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const now = new Date();
    let alertasEnviadas = 0;
    const resultados: any[] = [];

    // Obtener cupones activos
    const activeCoupons = await prisma.promoCoupon.findMany({
      where: {
        estado: 'ACTIVE',
        activo: true,
      },
      include: {
        _count: { select: { usos: true } },
      },
    });

    for (const coupon of activeCoupons) {
      const diasRestantes = Math.ceil(
        (new Date(coupon.fechaExpiracion).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Si ya expiró, marcar como expirado
      if (diasRestantes <= 0) {
        await prisma.promoCoupon.update({
          where: { id: coupon.id },
          data: { estado: 'EXPIRED', activo: false },
        });

        await sendEmailAlert(
          `🔴 Cupón EXPIRADO: ${coupon.codigo}`,
          `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>🔴 ${coupon.codigo} ha expirado</h2>
              <p><strong>Nombre:</strong> ${coupon.nombre}</p>
              <p><strong>Usos totales:</strong> ${coupon._count.usos}</p>
              <p style="color: #ef4444;">El cupón ha sido desactivado automáticamente.</p>
            </div>
          `
        );

        resultados.push({
          codigo: coupon.codigo,
          accion: 'EXPIRADO',
          diasRestantes: 0,
        });
        alertasEnviadas++;
        continue;
      }

      // Verificar alertas pendientes
      for (const config of ALERT_CONFIGS) {
        if (diasRestantes <= config.diasAntes && !coupon[config.campo]) {
          const porcentajeUso = coupon.usosMaximos 
            ? Math.round((coupon._count.usos / coupon.usosMaximos) * 100)
            : 0;

          const colorMap = {
            info: '#3b82f6',
            warning: '#f59e0b',
            critical: '#ef4444',
          };

          const enviado = await sendEmailAlert(
            `${config.emoji} Cupón ${coupon.codigo} expira en ${diasRestantes} día(s)`,
            `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="background: ${colorMap[config.nivel]}; padding: 15px; color: white; border-radius: 8px;">
                  <h2 style="margin: 0;">${config.emoji} Alerta de Expiración</h2>
                </div>
                <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px;">
                  <h3>${coupon.codigo} - ${coupon.nombre}</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Días restantes:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: ${colorMap[config.nivel]}; font-weight: bold;">${diasRestantes}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Fecha expiración:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(coupon.fechaExpiracion).toLocaleDateString('es-ES')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Usos:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${coupon._count.usos} / ${coupon.usosMaximos || '∞'} ${coupon.usosMaximos ? `(${porcentajeUso}%)` : ''}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px;"><strong>Planes:</strong></td>
                      <td style="padding: 8px;">${coupon.planesPermitidos.length ? coupon.planesPermitidos.join(', ') : 'Todos'}</td>
                    </tr>
                  </table>
                </div>
              </div>
            `
          );

          if (enviado) {
            await prisma.promoCoupon.update({
              where: { id: coupon.id },
              data: {
                [config.campo]: true,
                ultimaAlertaFecha: now,
              },
            });
            alertasEnviadas++;

            resultados.push({
              codigo: coupon.codigo,
              accion: `ALERTA_${config.diasAntes}D`,
              diasRestantes,
            });
          }
          break; // Solo una alerta por cupón
        }
      }

      // Verificar cupones agotados
      if (coupon.usosMaximos && coupon._count.usos >= coupon.usosMaximos && coupon.estado !== 'EXHAUSTED') {
        await prisma.promoCoupon.update({
          where: { id: coupon.id },
          data: { estado: 'EXHAUSTED' },
        });

        await sendEmailAlert(
          `🎟️ Cupón AGOTADO: ${coupon.codigo}`,
          `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>🎟️ ${coupon.codigo} ha alcanzado su límite</h2>
              <p><strong>Usos totales:</strong> ${coupon._count.usos} / ${coupon.usosMaximos}</p>
              <p style="color: #f59e0b;">El cupón seguirá visible pero no aceptará más usos.</p>
            </div>
          `
        );

        resultados.push({
          codigo: coupon.codigo,
          accion: 'AGOTADO',
          usos: coupon._count.usos,
        });
        alertasEnviadas++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      cuponesVerificados: activeCoupons.length,
      alertasEnviadas,
      resultados,
    });
  } catch (error: unknown) {
    logger.error('[Cron CheckCoupons Error]:', error);
    return NextResponse.json(
      { error: 'Error verificando cupones' },
      { status: 500 }
    );
  }
}
