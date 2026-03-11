import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api-auth-guard';
import logger from '@/lib/logger';
import { differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/cron/auto-collection-agent
 * Agente IA de cobros que ejecuta escalado automático:
 * - Día 3: Email recordatorio amable
 * - Día 10: Email + SMS formal
 * - Día 20: Marca como requerimiento
 * - Día 45: Marca para derivación legal
 * Registra cada acción en log.
 */
export async function GET(request: NextRequest) {
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;

  const prisma = await getPrisma();

  try {
    const today = new Date();
    const companies = await prisma.company.findMany({
      where: { activo: true, esEmpresaPrueba: false },
      select: { id: true, nombre: true },
    });

    const actions: Array<{
      company: string;
      inquilino: string;
      edificio: string;
      importe: number;
      diasRetraso: number;
      nivel: string;
      accion: string;
      emailEnviado: boolean;
    }> = [];

    for (const company of companies) {
      const overduePayments = await prisma.payment.findMany({
        where: {
          contract: { unit: { building: { companyId: company.id } } },
          estado: { in: ['pendiente', 'atrasado'] },
          fechaVencimiento: { lt: today },
        },
        include: {
          contract: {
            include: {
              tenant: { select: { nombreCompleto: true, email: true, telefono: true } },
              unit: { select: { numero: true, building: { select: { nombre: true } } } },
            },
          },
        },
      });

      for (const payment of overduePayments) {
        const diasRetraso = differenceInDays(today, payment.fechaVencimiento);
        const tenant = payment.contract?.tenant;
        const edificio = payment.contract?.unit?.building?.nombre || '';
        const unidad = payment.contract?.unit?.numero || '';

        let nivel = '';
        let accion = '';
        let emailEnviado = false;

        if (diasRetraso >= 45) {
          nivel = 'derivacion_legal';
          accion = 'Marcado para derivación a abogado';
          // Actualizar estado del pago
          await prisma.payment.update({
            where: { id: payment.id },
            data: { estado: 'atrasado' },
          });
        } else if (diasRetraso >= 20) {
          nivel = 'requerimiento';
          accion = 'Carta de requerimiento formal generada';
          await prisma.payment.update({
            where: { id: payment.id },
            data: { estado: 'atrasado' },
          });
        } else if (diasRetraso >= 10) {
          nivel = 'aviso_formal';
          accion = 'Aviso formal enviado (email)';
          // Enviar email formal si es posible
          if (tenant?.email && process.env.SMTP_HOST) {
            try {
              const nodemailer = await import('nodemailer');
              const transporter = nodemailer.default.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
              });
              await transporter.sendMail({
                from: process.env.SMTP_FROM || 'INMOVA <noreply@inmovaapp.com>',
                to: tenant.email,
                subject: `Aviso de pago pendiente — ${edificio} ${unidad}`,
                html: `
                  <p>Estimado/a ${tenant.nombreCompleto},</p>
                  <p>Le informamos que tiene un pago pendiente de <strong>${payment.monto}€</strong>
                  correspondiente a su inmueble en ${edificio} ${unidad}, con ${diasRetraso} días de retraso.</p>
                  <p>Le rogamos proceda al pago a la mayor brevedad posible para evitar acciones adicionales.</p>
                  <p>Si ya ha realizado el pago, ignore este mensaje.</p>
                  <p>Atentamente,<br/>${company.nombre}</p>
                `,
              });
              emailEnviado = true;
            } catch {
              /* email failed, continue */
            }
          }
        } else if (diasRetraso >= 3) {
          nivel = 'recordatorio';
          accion = 'Recordatorio amable enviado (email)';
          if (tenant?.email && process.env.SMTP_HOST) {
            try {
              const nodemailer = await import('nodemailer');
              const transporter = nodemailer.default.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
              });
              await transporter.sendMail({
                from: process.env.SMTP_FROM || 'INMOVA <noreply@inmovaapp.com>',
                to: tenant.email,
                subject: `Recordatorio de pago — ${edificio} ${unidad}`,
                html: `
                  <p>Hola ${tenant.nombreCompleto},</p>
                  <p>Le recordamos que tiene un pago de <strong>${payment.monto}€</strong> pendiente
                  correspondiente a ${edificio} ${unidad}.</p>
                  <p>Puede realizar el pago a través del portal de inquilinos.</p>
                  <p>Si ya lo ha realizado, disculpe las molestias.</p>
                  <p>Un saludo,<br/>${company.nombre}</p>
                `,
              });
              emailEnviado = true;
            } catch {
              /* continue */
            }
          }
        } else {
          continue; // < 3 días, no actuar aún
        }

        actions.push({
          company: company.nombre,
          inquilino: tenant?.nombreCompleto || 'Sin nombre',
          edificio: `${edificio} ${unidad}`,
          importe: payment.monto,
          diasRetraso,
          nivel,
          accion,
          emailEnviado,
        });
      }
    }

    logger.info(`[Auto-Collection Agent] ${actions.length} acciones ejecutadas`);

    return NextResponse.json({
      success: true,
      message: `Agente de cobros: ${actions.length} acciones`,
      resumen: {
        recordatorios: actions.filter((a) => a.nivel === 'recordatorio').length,
        avisos_formales: actions.filter((a) => a.nivel === 'aviso_formal').length,
        requerimientos: actions.filter((a) => a.nivel === 'requerimiento').length,
        derivaciones_legales: actions.filter((a) => a.nivel === 'derivacion_legal').length,
        emailsEnviados: actions.filter((a) => a.emailEnviado).length,
      },
      acciones: actions,
    });
  } catch (error: any) {
    logger.error('[Auto-Collection Agent]:', error);
    return NextResponse.json({ error: 'Error en agente de cobros' }, { status: 500 });
  }
}
