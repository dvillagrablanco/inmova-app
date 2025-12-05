import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getContractRenewals,
  createContractRenewal,
  checkUpcomingRenewals,
} from '@/lib/services/renewal-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || undefined;
    const accion = searchParams.get('accion');

    const companyId = (session.user as any).companyId;

    if (accion === 'check_upcoming') {
      const renovaciones = await checkUpcomingRenewals(companyId, 90);
      return NextResponse.json(renovaciones);
    }

    const renovaciones = await getContractRenewals(companyId, estado);
    return NextResponse.json(renovaciones);
  } catch (error: any) {
    console.error('Error en GET /api/renovaciones/contratos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const renovacion = await createContractRenewal(body.contractId);

    return NextResponse.json(renovacion, { status: 201 });
  } catch (error: any) {
    console.error('Error en POST /api/renovaciones/contratos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
