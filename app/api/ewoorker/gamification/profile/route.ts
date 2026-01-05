/**
 * API Route: /api/ewoorker/gamification/profile
 *
 * GET: Obtener perfil de gamificación del usuario
 * POST: Registrar login diario
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { ewoorkerGamification } from '@/lib/ewoorker-gamification-service';

export const dynamic = 'force-dynamic';

/**
 * GET: Obtener perfil de gamificación
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

    const profile = await ewoorkerGamification.getProfile(user.company.ewoorkerPerfil.id);

    if (!profile) {
      return NextResponse.json({ error: 'Error obteniendo perfil' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('[API EwoorkerGamification Profile] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/**
 * POST: Registrar login diario
 */
export async function POST() {
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

    const result = await ewoorkerGamification.registerDailyLogin(user.company.ewoorkerPerfil.id);

    return NextResponse.json({
      success: true,
      loginResult: result,
    });
  } catch (error: any) {
    console.error('[API EwoorkerGamification Login] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
