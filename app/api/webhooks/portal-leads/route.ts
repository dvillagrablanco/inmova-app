import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/webhooks/portal-leads
 * Webhook para recibir leads de portales de media estancia (Álamo, Spotahome, etc.)
 * Los portales envían datos del candidato interesado en una propiedad.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const body = await request.json();

    // Verificar origen del webhook (por header o token)
    const portalSource = request.headers.get('x-portal-source') || body.source || 'unknown';
    const webhookSecret = request.headers.get('x-webhook-secret');

    // Validar secret si está configurado
    const expectedSecret = process.env.PORTAL_WEBHOOK_SECRET;
    if (!expectedSecret) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 503 });
      }
    } else if (webhookSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      // Datos del candidato
      candidateName,
      candidateEmail,
      candidatePhone,
      candidateNationality,
      candidateOccupation,
      candidateMessage,

      // Datos de la propiedad
      propertyId, // ID interno o referencia del portal
      externalListingId,
      requestedCheckIn,
      requestedCheckOut,
      requestedBudget,

      // Metadata
      source, // 'alamo', 'spotahome', etc.
      leadId, // ID del lead en el portal
    } = body;

    if (!candidateEmail && !candidateName) {
      return NextResponse.json({ error: 'Datos del candidato requeridos' }, { status: 400 });
    }

    // Intentar vincular con una unidad existente
    let unitId = null;
    if (propertyId) {
      const unit = await prisma.unit.findFirst({
        where: { id: propertyId },
        select: { id: true },
      });
      if (unit) unitId = unit.id;
    }

    // Crear candidato en el sistema
    let candidate = null;
    try {
      candidate = await prisma.candidate.create({
        data: {
          nombre: candidateName || 'Lead Portal',
          email: candidateEmail || null,
          telefono: candidatePhone || null,
          nacionalidad: candidateNationality || null,
          ocupacion: candidateOccupation || null,
          notas: `Lead de ${portalSource}. ${candidateMessage || ''}\n\nFechas: ${requestedCheckIn || 'N/A'} → ${requestedCheckOut || 'N/A'}\nPresupuesto: ${requestedBudget || 'N/A'}€\nLead ID portal: ${leadId || 'N/A'}`,
          estado: 'nuevo',
          origen: portalSource,
          ...(unitId && { unitId }),
        },
      });
    } catch (err: any) {
      logger.error('[Portal Lead] Error creating candidate:', err.message);
    }

    if (!candidate) {
      return NextResponse.json({ error: 'No se pudo registrar el lead' }, { status: 500 });
    }

    logger.info(
      `[Portal Lead] Nuevo lead de ${portalSource}: ${candidateName} (${candidateEmail})`,
      {
        portal: portalSource,
        leadId,
        propertyId,
      }
    );

    // Notificar al gestor (si hay email configurado)
    if (process.env.SMTP_HOST) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        });

        const adminEmail = process.env.PORTAL_LEADS_NOTIFICATION_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || 'INMOVA <noreply@inmovaapp.com>',
            to: adminEmail,
            subject: `🏠 Nuevo lead de ${portalSource}: ${candidateName}`,
            html: `
              <h2>Nuevo lead de media estancia</h2>
              <p><strong>Portal:</strong> ${portalSource}</p>
              <p><strong>Candidato:</strong> ${candidateName}</p>
              <p><strong>Email:</strong> ${candidateEmail || 'N/A'}</p>
              <p><strong>Teléfono:</strong> ${candidatePhone || 'N/A'}</p>
              <p><strong>Nacionalidad:</strong> ${candidateNationality || 'N/A'}</p>
              <p><strong>Ocupación:</strong> ${candidateOccupation || 'N/A'}</p>
              <p><strong>Fechas:</strong> ${requestedCheckIn || 'N/A'} → ${requestedCheckOut || 'N/A'}</p>
              <p><strong>Presupuesto:</strong> ${requestedBudget || 'N/A'}€</p>
              <p><strong>Mensaje:</strong> ${candidateMessage || 'Sin mensaje'}</p>
              <hr/>
              <p><a href="https://inmovaapp.com/candidatos">Ver en INMOVA</a></p>
            `,
          });
        }
      } catch {
        /* email failed, continue */
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lead recibido correctamente',
      candidateId: candidate.id,
      leadId,
    });
  } catch (error: any) {
    logger.error('[Portal Lead Webhook]:', error);
    return NextResponse.json({ error: 'Error procesando lead' }, { status: 500 });
  }
}
