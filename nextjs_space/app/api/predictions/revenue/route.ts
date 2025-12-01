import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { predictRevenue } from '@/lib/prediction-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { monthsAhead = 3 } = await request.json();
    const companyId = session.user.companyId;

    const predictions = await predictRevenue(companyId, monthsAhead);

    return NextResponse.json({ predictions }, { status: 201 });
  } catch (error: any) {
    console.error('Error predicting revenue:', error);
    return NextResponse.json(
      { error: error.message || 'Error al predecir ingresos' },
      { status: 500 }
    );
  }
}
