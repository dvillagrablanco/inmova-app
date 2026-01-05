/**
 * API de Leaderboard para Inquilinos B2C
 * GET: Obtener ranking de inquilinos
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { tenantGamification } from '@/lib/tenant-gamification-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId || request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Obtener companyId del inquilino para filtrar el leaderboard
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { companyId: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Obtener leaderboard de la misma empresa/comunidad
    const leaderboard = await tenantGamification.getLeaderboard(tenant.companyId, limit);

    // Encontrar posición del inquilino actual
    const myPosition = leaderboard.findIndex((t) => t.tenantId === tenantId);

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        myPosition: myPosition >= 0 ? myPosition + 1 : null,
        myTenantId: tenantId,
      },
    });
  } catch (error: any) {
    console.error('[Tenant Leaderboard Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo leaderboard' },
      { status: 500 }
    );
  }
}
