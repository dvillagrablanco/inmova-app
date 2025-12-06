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
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { error: 'profileId requerido' },
        { status: 400 }
      );
    }

    const result = await socialService.findMatches(profileId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.matches);
  } catch (error) {
    console.error('Error en GET /api/coliving/matches:', error);
    return NextResponse.json(
      { error: 'Error al buscar matches' },
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

    const { profile1Id, profile2Id, companyId } = await request.json();

    if (!profile1Id || !profile2Id || !companyId) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const result = await socialService.createMatch(
      profile1Id,
      profile2Id,
      companyId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.match, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/coliving/matches:', error);
    return NextResponse.json(
      { error: 'Error al crear match' },
      { status: 500 }
    );
  }
}
