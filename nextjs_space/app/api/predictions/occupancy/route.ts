import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { predictOccupancy } from '@/lib/prediction-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { monthsAhead = 3 } = await request.json();
    const companyId = session?.user?.companyId;

    const predictions = await predictOccupancy(companyId, monthsAhead);

    return NextResponse.json({ predictions }, { status: 201 });
  } catch (error: any) {
    logger.error('Error predicting occupancy:', error);
    return NextResponse.json(
      { error: error.message || 'Error al predecir ocupación' },
      { status: 500 }
    );
  }
}
