import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getCommunityMinutes,
  createCommunityMinute,
  approveCommunityMinute,
} from '@/lib/services/community-management-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId') || undefined;
    const estado = searchParams.get('estado') as any;

    const companyId = (session.user as any).companyId;
    const actas = await getCommunityMinutes(companyId, buildingId, estado);

    return NextResponse.json(actas);
  } catch (error: any) {
    console.error('Error en GET /api/comunidades/actas:', error);
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
    const userId = (session.user as any).id;

    const acta = await createCommunityMinute({
      companyId,
      buildingId: body.buildingId,
      fecha: new Date(body.fecha),
      convocatoria: body.convocatoria,
      asistentes: body.asistentes || [],
      ordenDia: body.ordenDia || [],
      acuerdos: body.acuerdos || [],
      creadoPor: userId,
      documentos: body.documentos,
      observaciones: body.observaciones,
    });

    return NextResponse.json(acta, { status: 201 });
  } catch (error: any) {
    console.error('Error en POST /api/comunidades/actas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
