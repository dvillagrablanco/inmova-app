import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getCommunityFees,
  createCommunityFee,
  generateMonthlyFees,
} from '@/lib/services/community-management-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId') || undefined;
    const unitId = searchParams.get('unitId') || undefined;
    const periodo = searchParams.get('periodo') || undefined;
    const estado = searchParams.get('estado') as any;

    const companyId = (session.user as any).companyId;
    const cuotas = await getCommunityFees(companyId, {
      buildingId,
      unitId,
      periodo,
      estado,
    });

    return NextResponse.json(cuotas);
  } catch (error: any) {
    console.error('Error en GET /api/comunidades/cuotas:', error);
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
    const companyId = (session.user as any).companyId;

    if (body.accion === 'generar_mensual') {
      const cuotas = await generateMonthlyFees(
        companyId,
        body.buildingId,
        body.periodo
      );
      return NextResponse.json(cuotas, { status: 201 });
    }

    const cuota = await createCommunityFee({
      companyId,
      buildingId: body.buildingId,
      unitId: body.unitId,
      tipo: body.tipo,
      periodo: body.periodo,
      concepto: body.concepto,
      importeBase: body.importeBase,
      coeficiente: body.coeficiente,
      fechaVencimiento: new Date(body.fechaVencimiento),
      gastosCorrientes: body.gastosCorrientes,
      fondoReserva: body.fondoReserva,
      seguros: body.seguros,
      mantenimiento: body.mantenimiento,
      otros: body.otros,
      notas: body.notas,
    });

    return NextResponse.json(cuota, { status: 201 });
  } catch (error: any) {
    console.error('Error en POST /api/comunidades/cuotas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
