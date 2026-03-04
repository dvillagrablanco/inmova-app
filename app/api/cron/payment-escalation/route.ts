import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api-auth-guard';
import { sendEmail } from '@/lib/email-config';
import logger from '@/lib/logger';
import { differenceInDays } from 'date-fns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

type EscalationLevel = 'recordatorio_amable' | 'recordatorio_firme' | 'aviso_formal' | 'accion_legal';

const NIVEL_RIESGO_MAP: Record<EscalationLevel, 'bajo' | 'medio' | 'alto' | 'critico'> = {
  recordatorio_amable: 'bajo',
  recordatorio_firme: 'medio',
  aviso_formal: 'alto',
  accion_legal: 'critico',
};

function getEscalationLevel(daysLate: number): EscalationLevel | null {
  if (daysLate >= 31) return 'accion_legal';
  if (daysLate >= 16) return 'aviso_formal';
  if (daysLate >= 8) return 'recordatorio_firme';
  if (daysLate >= 3) return 'recordatorio_amable';
  return null;
}

/**
 * GET /api/cron/payment-escalation
 * Automated payment escalation workflow by days overdue.
 */
export async function GET(request: NextRequest) {
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;

  const prisma = await getPrisma();
  const now = new Date();

  const overduePayments = await prisma.payment.findMany({
    where: {
      fechaPago: null,
      fechaVencimiento: { lt: now },
      estado: { in: ['pendiente', 'atrasado'] },
      isDemo: false,
    },
    include: {
      contract: {
        include: {
          tenant: true,
          unit: {
            include: {
              building: true,
            },
          },
        },
      },
    },
  });

  const processed = { recordatorio_amable: 0, recordatorio_firme: 0, aviso_formal: 0, accion_legal: 0 };

  for (const payment of overduePayments) {
    const daysLate = differenceInDays(now, new Date(payment.fechaVencimiento));
    const level = getEscalationLevel(daysLate);
    if (!level) continue;

    const alreadySent = await prisma.notification.findFirst({
      where: {
        entityId: payment.id,
        entityType: `Payment::${level}`,
      },
    });
    if (alreadySent) continue;

    const nivelRiesgo = NIVEL_RIESGO_MAP[level];
    await prisma.payment.update({
      where: { id: payment.id },
      data: { nivelRiesgo },
    });

    const tenant = payment.contract?.tenant;
    const building = payment.contract?.unit?.building;
    const unit = payment.contract?.unit;
    const companyId = building?.companyId;
    if (!companyId || !tenant) continue;

    const amount = parseFloat(payment.monto.toString());
    const dueDate = format(new Date(payment.fechaVencimiento), 'dd/MM/yyyy', { locale: es });
    const location = building?.nombre && unit?.numero ? `${building.nombre} - ${unit.numero}` : '';

    let subject = '';
    let html = '';

    switch (level) {
      case 'recordatorio_amable':
        subject = `Recordatorio amable: Pago pendiente - ${payment.periodo}`;
        html = `
          <p>Hola ${tenant.nombreCompleto},</p>
          <p>Le recordamos amablemente que tiene un pago pendiente:</p>
          <ul>
            <li><strong>Período:</strong> ${payment.periodo}</li>
            <li><strong>Importe:</strong> ${amount.toLocaleString('es-ES')}€</li>
            <li><strong>Vencimiento:</strong> ${dueDate}</li>
            <li><strong>Días de retraso:</strong> ${daysLate}</li>
          </ul>
          ${location ? `<p><strong>Propiedad:</strong> ${location}</p>` : ''}
          <p>Si ya realizó el pago, por favor ignore este mensaje.</p>
          <p>Saludos cordiales.</p>
        `;
        break;
      case 'recordatorio_firme':
        subject = `Recordatorio formal: Pago vencido hace ${daysLate} días - ${payment.periodo}`;
        html = `
          <p>Estimado/a ${tenant.nombreCompleto},</p>
          <p>Le informamos que su pago está vencido desde hace ${daysLate} días:</p>
          <ul>
            <li><strong>Período:</strong> ${payment.periodo}</li>
            <li><strong>Importe:</strong> ${amount.toLocaleString('es-ES')}€</li>
            <li><strong>Vencimiento:</strong> ${dueDate}</li>
          </ul>
          ${location ? `<p><strong>Propiedad:</strong> ${location}</p>` : ''}
          <p>Le solicitamos regularizar su situación lo antes posible para evitar recargos por mora.</p>
          <p>Atentamente.</p>
        `;
        break;
      case 'aviso_formal':
        subject = `Aviso formal: Pago atrasado ${daysLate} días - ${payment.periodo}`;
        html = `
          <p>Estimado/a ${tenant.nombreCompleto},</p>
          <p><strong>AVISO FORMAL:</strong> Su pago lleva ${daysLate} días de retraso:</p>
          <ul>
            <li><strong>Período:</strong> ${payment.periodo}</li>
            <li><strong>Importe:</strong> ${amount.toLocaleString('es-ES')}€</li>
            <li><strong>Vencimiento:</strong> ${dueDate}</li>
          </ul>
          ${location ? `<p><strong>Propiedad:</strong> ${location}</p>` : ''}
          <p>Debe contactar con nosotros de inmediato para evitar acciones legales. Los recargos por mora aplican según contrato.</p>
          <p>Atentamente.</p>
        `;
        break;
      case 'accion_legal':
        subject = `Aviso legal: Pago atrasado ${daysLate} días - ${payment.periodo}`;
        html = `
          <p>Estimado/a ${tenant.nombreCompleto},</p>
          <p><strong>AVISO LEGAL:</strong> Su pago lleva más de 30 días de retraso (${daysLate} días):</p>
          <ul>
            <li><strong>Período:</strong> ${payment.periodo}</li>
            <li><strong>Importe:</strong> ${amount.toLocaleString('es-ES')}€</li>
            <li><strong>Vencimiento:</strong> ${dueDate}</li>
          </ul>
          ${location ? `<p><strong>Propiedad:</strong> ${location}</p>` : ''}
          <p>Se procederá con las acciones legales correspondientes si no regulariza su situación de inmediato.</p>
          <p>Atentamente.</p>
        `;
        break;
    }

    if (tenant.email) {
      try {
        await sendEmail({
          to: tenant.email,
          subject,
          html,
        });
      } catch (err) {
        logger.error(`[Payment Escalation] Email failed for payment ${payment.id}:`, err);
      }
    }

    await prisma.notification.create({
      data: {
        companyId,
        tipo: 'pago_atrasado',
        titulo: subject,
        mensaje: html.replace(/<[^>]*>/g, ' ').slice(0, 500),
        prioridad: nivelRiesgo,
        entityId: payment.id,
        entityType: `Payment::${level}`,
      },
    });

    processed[level]++;
  }

  logger.info('[Payment Escalation] Processed:', processed);

  return NextResponse.json({
    processed: Object.values(processed).reduce((a, b) => a + b, 0),
    escalatedByLevel: processed,
  });
}

export async function POST(request: NextRequest) {
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
  return GET(request);
}
