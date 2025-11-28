import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAnalyticsTrends } from '@/lib/analytics-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');

    const companyId = session.user.companyId;
    const trends = await getAnalyticsTrends(companyId, months);

    return NextResponse.json({ trends });
  } catch (error: any) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar tendencias' },
      { status: 500 }
    );
  }
}
