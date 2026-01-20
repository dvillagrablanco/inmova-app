/**
 * API: Crear Lead desde Landing Pública del Partner
 *
 * POST /api/partners/public/leads/create
 *
 * Endpoint público para capturar leads desde landings de partners.
 * No requiere autenticación pero tiene rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { trackPartnerLandingLead } from '@/lib/partner-branding-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const leadSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
  telefono: z.string().optional(),
  mensaje: z.string().max(1000).optional(),
  partnerSlug: z.string().min(1),
  origen: z.string().optional().default('landing_contacto'),
  servicioId: z.string().optional(), // Si el lead es por un servicio específico
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = leadSchema.parse(body);

    // Buscar el partner por slug
    const partner = await prisma.partner.findFirst({
      where: { slug: validatedData.partnerSlug },
      select: { id: true, nombre: true, email: true },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    // Crear el lead
    const lead = await prisma.partnerServiceLead.create({
      data: {
        partnerId: partner.id,
        nombre: validatedData.nombre,
        email: validatedData.email,
        telefono: validatedData.telefono || null,
        mensaje: validatedData.mensaje || null,
        origen: validatedData.origen,
        servicioId: validatedData.servicioId || null,
        estado: 'NUEVO',
        fechaContacto: new Date(),
      },
    });

    // Trackear el lead
    await trackPartnerLandingLead(validatedData.partnerSlug);

    // TODO: Enviar notificación al partner por email
    // await sendPartnerLeadNotification(partner.email, lead);

    return NextResponse.json({
      success: true,
      message: 'Información recibida correctamente',
      leadId: lead.id,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('[API Partners Lead Create] Error:', error);
    return NextResponse.json({ error: 'Error procesando solicitud' }, { status: 500 });
  }
}
