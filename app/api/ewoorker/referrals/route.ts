/**
 * API Route: /api/ewoorker/referrals
 *
 * GET: Obtener estadísticas de referidos
 * POST: Generar código de referido o enviar invitación
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { ewoorkerReferral } from '@/lib/ewoorker-referral-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sendInvitationSchema = z.object({
  email: z.string().email(),
  message: z.string().max(500).optional(),
});

/**
 * GET: Obtener estadísticas de referidos
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: { include: { ewoorkerPerfil: true } } },
    });

    if (!user?.company?.ewoorkerPerfil) {
      return NextResponse.json({ error: 'No tienes perfil eWoorker' }, { status: 404 });
    }

    const stats = await ewoorkerReferral.getReferralStats(user.company.ewoorkerPerfil.id);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('[API EwoorkerReferrals] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/**
 * POST: Generar código o enviar invitación
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: { include: { ewoorkerPerfil: true } } },
    });

    if (!user?.company?.ewoorkerPerfil) {
      return NextResponse.json({ error: 'No tienes perfil eWoorker' }, { status: 404 });
    }

    const body = await request.json();
    const perfilId = user.company.ewoorkerPerfil.id;

    // Si incluye email, enviar invitación
    if (body.email) {
      const validated = sendInvitationSchema.parse(body);
      const result = await ewoorkerReferral.sendInvitation(
        perfilId,
        validated.email,
        validated.message
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        code: result.code,
        message: 'Invitación enviada correctamente',
      });
    }

    // Si no, solo generar código
    const result = await ewoorkerReferral.generateReferralCode(perfilId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      code: result.code,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[API EwoorkerReferrals] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
