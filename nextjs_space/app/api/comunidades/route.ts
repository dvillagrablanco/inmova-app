import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCommunityStats } from '@/lib/services/community-management-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');

    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId requerido' }, { status: 400 });
    }

    const companyId = (session.user as any).companyId;
    const stats = await getCommunityStats(companyId, buildingId);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error en GET /api/comunidades:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
