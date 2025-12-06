import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as conciergeService from '@/lib/services/coliving-concierge-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const categoria = searchParams.get('categoria') || undefined;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId requerido' },
        { status: 400 }
      );
    }

    const result = await conciergeService.getServicesByCategory(
      companyId,
      categoria
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.services);
  } catch (error) {
    console.error('Error en GET /api/coliving/services:', error);
    return NextResponse.json(
      { error: 'Error al obtener servicios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const result = await conciergeService.createService(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.service, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/coliving/services:', error);
    return NextResponse.json(
      { error: 'Error al crear servicio' },
      { status: 500 }
    );
  }
}
