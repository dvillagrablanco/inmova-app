import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as socialService from '@/lib/services/coliving-social-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId requerido' },
        { status: 400 }
      );
    }

    const result = await socialService.getGroupsByCompany(companyId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.groups);
  } catch (error) {
    console.error('Error en GET /api/coliving/groups:', error);
    return NextResponse.json(
      { error: 'Error al obtener grupos' },
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
    const result = await socialService.createGroup(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.group, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/coliving/groups:', error);
    return NextResponse.json(
      { error: 'Error al crear grupo' },
      { status: 500 }
    );
  }
}
