import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener estadísticas de residuos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Devolvemos estadísticas vacías - sin datos ficticios
    // Los datos reales vendrán cuando se registren actividades de reciclaje
    return NextResponse.json({
      stats: {
        totalRecycled: 0,
        recyclingRate: 0,
        co2Saved: 0,
        monthlyData: [],
        wasteByType: [],
        buildingRanking: [],
      },
      userPoints: 0,
      userBadges: [],
    });
  } catch (error: any) {
    console.error('[Circular Economy Waste Stats GET]:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
