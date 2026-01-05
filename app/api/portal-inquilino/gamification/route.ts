/**
 * API de Gamificación para Inquilinos B2C
 * GET: Obtener perfil de gamificación
 * POST: Registrar login diario
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { tenantGamification } from '@/lib/tenant-gamification-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Obtener perfil de gamificación
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación del inquilino
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId || request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const profile = await tenantGamification.getGamificationProfile(tenantId);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error('[Tenant Gamification GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo perfil de gamificación' },
      { status: 500 }
    );
  }
}

// POST: Registrar login diario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId || request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await tenantGamification.registerDailyLogin(tenantId);

    return NextResponse.json({
      success: true,
      data: result,
      message:
        result.pointsAdded > 0
          ? `¡+${result.pointsAdded} puntos! Racha: ${result.streak} días`
          : 'Ya registraste tu login hoy',
    });
  } catch (error: any) {
    console.error('[Tenant Gamification POST Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error registrando login' },
      { status: 500 }
    );
  }
}
