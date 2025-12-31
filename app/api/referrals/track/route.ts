import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const trackSchema = z.object({
  referralCode: z.string(),
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
});

/**
 * API para trackear clicks en links de referido
 * Se llama cuando un usuario hace click en un link de partner
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = trackSchema.parse(body);

    // Using global prisma instance

    // Buscar partner por código
    const partner = await prisma.partner.findUnique({
      where: { referralCode: validated.referralCode },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Código de referido inválido' }, { status: 404 });
    }

    if (partner.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Partner no activo' }, { status: 403 });
    }

    // Obtener metadata de la request
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    // Crear registro de tracking (sin company aún)
    // Esto se actualizará cuando el usuario se registre
    const tracking = await prisma.referral.create({
      data: {
        partnerId: partner.id,
        companyId: 'temp-' + Date.now(), // Temporal, se actualizará al registro
        referralCode: validated.referralCode,
        clickedAt: new Date(),
        ipAddress,
        userAgent,
        source: validated.source,
        medium: validated.medium,
        campaign: validated.campaign,
        status: 'CLICKED',
      },
    });

    // Actualizar última actividad del partner
    await prisma.partner.update({
      where: { id: partner.id },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        trackingId: tracking.id,
        partnerName: partner.name,
        partnerType: partner.type,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Referral Track Error]:', error);
    return NextResponse.json({ error: 'Error registrando click' }, { status: 500 });
  }
}

/**
 * API para actualizar referral cuando el usuario se registra
 * Se llama desde el proceso de registro de nuevas companies
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingId, companyId } = body;

    if (!trackingId || !companyId) {
      return NextResponse.json({ error: 'trackingId y companyId requeridos' }, { status: 400 });
    }

    // Using global prisma instance

    // Actualizar referral con company real
    const referral = await prisma.referral.update({
      where: { id: trackingId },
      data: {
        companyId,
        signedUpAt: new Date(),
        status: 'SIGNED_UP',
      },
      include: {
        partner: true,
      },
    });

    // Actualizar contador del partner
    await prisma.partner.update({
      where: { id: referral.partnerId },
      data: {
        totalClients: { increment: 1 },
      },
    });

    // TODO: Enviar notificación al partner
    // TODO: Crear comisión de bono de alta (pending)

    return NextResponse.json({
      success: true,
      data: {
        referralId: referral.id,
        partnerName: referral.partner.name,
      },
    });
  } catch (error: any) {
    console.error('[Referral Update Error]:', error);
    return NextResponse.json({ error: 'Error actualizando referral' }, { status: 500 });
  }
}
