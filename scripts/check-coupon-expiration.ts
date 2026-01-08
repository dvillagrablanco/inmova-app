/**
 * Script para verificar cupones próximos a expirar y enviar alertas
 * 
 * Alertas:
 * - 7 días antes de expirar
 * - 3 días antes de expirar
 * - 1 día antes de expirar
 * 
 * Ejecutar manualmente: npx tsx scripts/check-coupon-expiration.ts
 * O programar como cron: 0 9 * * * (cada día a las 9 AM)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function sendEmailAlert(subject: string, message: string, nivel: string) {
  // Importar nodemailer solo cuando se necesita
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

  const colorMap = {
    info: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${colorMap[nivel as keyof typeof colorMap]}; padding: 20px; color: white; text-align: center;">
        <h1 style="margin: 0;">🎟️ Alerta de Cupones</h1>
      </div>
      <div style="padding: 20px; background: #f9fafb;">
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${colorMap[nivel as keyof typeof colorMap]};">
          ${message}
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center;">
          Este es un email automático del sistema de cupones de INMOVA.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"INMOVA Admin" <inmovaapp@gmail.com>',
      to: 'inmovaapp@gmail.com', // Email del admin
      subject: `[INMOVA] ${subject}`,
      html,
    });
    console.log(`   📧 Email enviado: ${subject}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error enviando email:`, error);
    return false;
  }
}

async function checkAndAlert() {
  console.log('🔍 Verificando cupones próximos a expirar...\n');
  
  const now = new Date();
  let alertasSenviadas = 0;
  
  // Obtener todos los cupones activos
  const activeCoupons = await prisma.promoCoupon.findMany({
    where: {
      estado: 'ACTIVE',
      activo: true,
    },
    include: {
      _count: { select: { usos: true } },
    },
  });

  console.log(`📊 Cupones activos encontrados: ${activeCoupons.length}\n`);

  for (const coupon of activeCoupons) {
    const diasRestantes = Math.ceil(
      (new Date(coupon.fechaExpiracion).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`\n📋 ${coupon.codigo}`);
    console.log(`   Días restantes: ${diasRestantes}`);
    console.log(`   Usos: ${coupon._count.usos}/${coupon.usosMaximos || '∞'}`);

    // Si ya expiró, marcar como expirado
    if (diasRestantes <= 0) {
      console.log(`   🔴 EXPIRADO - Actualizando estado...`);
      await prisma.promoCoupon.update({
        where: { id: coupon.id },
        data: { estado: 'EXPIRED', activo: false },
      });

      await sendEmailAlert(
        `Cupón EXPIRADO: ${coupon.codigo}`,
        `
          <h2>${coupon.codigo} ha expirado</h2>
          <p><strong>Nombre:</strong> ${coupon.nombre}</p>
          <p><strong>Fecha de expiración:</strong> ${new Date(coupon.fechaExpiracion).toLocaleDateString('es-ES')}</p>
          <p><strong>Usos totales:</strong> ${coupon._count.usos}</p>
          <p style="color: #ef4444; font-weight: bold;">El cupón ha sido desactivado automáticamente.</p>
        `,
        'critical'
      );
      alertasSenviadas++;
      continue;
    }

    // Verificar alertas pendientes
    for (const config of ALERT_CONFIGS) {
      if (diasRestantes <= config.diasAntes && !coupon[config.campo]) {
        console.log(`   ${config.emoji} Enviando alerta de ${config.diasAntes} días...`);

        const porcentajeUso = coupon.usosMaximos 
          ? Math.round((coupon._count.usos / coupon.usosMaximos) * 100)
          : 0;

        const enviado = await sendEmailAlert(
          `${config.emoji} Cupón ${coupon.codigo} expira en ${diasRestantes} día(s)`,
          `
            <h2>${config.emoji} Alerta: ${coupon.codigo}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Nombre:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${coupon.nombre}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Días restantes:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: ${diasRestantes <= 3 ? '#ef4444' : '#f59e0b'}; font-weight: bold;">${diasRestantes}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Fecha de expiración:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(coupon.fechaExpiracion).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Usos:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${coupon._count.usos} / ${coupon.usosMaximos || '∞'} ${coupon.usosMaximos ? `(${porcentajeUso}%)` : ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Planes:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${coupon.planesPermitidos.length ? coupon.planesPermitidos.join(', ') : 'Todos'}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
              <strong>Acciones recomendadas:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Revisar si es necesario extender la promoción</li>
                <li>Comunicar a marketing sobre la finalización</li>
                <li>Preparar nueva campaña si corresponde</li>
              </ul>
            </div>
          `,
          config.nivel
        );

        if (enviado) {
          await prisma.promoCoupon.update({
            where: { id: coupon.id },
            data: {
              [config.campo]: true,
              ultimaAlertaFecha: now,
            },
          });
          alertasSenviadas++;
        }
        break; // Solo enviar la alerta más urgente
      }
    }
  }

  // Verificar cupones agotados
  const agotados = activeCoupons.filter(
    c => c.usosMaximos && c._count.usos >= c.usosMaximos
  );

  for (const coupon of agotados) {
    if (coupon.estado !== 'EXHAUSTED') {
      console.log(`\n📋 ${coupon.codigo} - AGOTADO`);
      await prisma.promoCoupon.update({
        where: { id: coupon.id },
        data: { estado: 'EXHAUSTED' },
      });

      await sendEmailAlert(
        `Cupón AGOTADO: ${coupon.codigo}`,
        `
          <h2>🎟️ ${coupon.codigo} ha alcanzado su límite de usos</h2>
          <p><strong>Usos totales:</strong> ${coupon._count.usos} / ${coupon.usosMaximos}</p>
          <p><strong>Días restantes:</strong> ${Math.ceil((new Date(coupon.fechaExpiracion).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}</p>
          <p style="color: #f59e0b; font-weight: bold;">El cupón seguirá activo pero no aceptará más usos.</p>
        `,
        'warning'
      );
      alertasSenviadas++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE VERIFICACIÓN');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Cupones verificados: ${activeCoupons.length}`);
  console.log(`Alertas enviadas: ${alertasSenviadas}`);
  console.log(`Cupones expirados: ${activeCoupons.filter(c => Math.ceil((new Date(c.fechaExpiracion).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 0).length}`);
  console.log(`Cupones agotados: ${agotados.length}`);
  console.log('\n✅ Verificación completada');
}

// Ejecutar
checkAndAlert()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
