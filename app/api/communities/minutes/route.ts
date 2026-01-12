import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  createCommunityMinute,
  signMinute,
  CreateMinuteParams,
} from '@/lib/services/community-management-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


/**
 * @swagger
 * /api/communities/minutes:
 *   get:
 *     summary: Obtener actas de la junta
 *     tags: [Comunidades]
 *   post:
 *     summary: Crear nueva acta de junta
 *     tags: [Comunidades]
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const buildingId = searchParams.get('buildingId');
    const companyId = searchParams.get('companyId');

    const where: any = {};
    if (buildingId) where.buildingId = buildingId;
    if (companyId) where.companyId = companyId;

    const minutes = await prisma.communityMinute.findMany({
      where,
      include: {
        building: true,
      },
      orderBy: { fecha: 'desc' },
    });

    return NextResponse.json(minutes);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener actas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const params: CreateMinuteParams = {
      buildingId: body.buildingId,
      companyId: body.companyId,
      fecha: new Date(body.fecha),
      asistentes: body.asistentes || [],
      orden: body.ordenDia || [],
      acuerdos: body.acuerdos || [],
      proximaConvocatoria: body.proximaConvocatoria
        ? new Date(body.proximaConvocatoria)
        : undefined,
      creadoPor: session.user.id!,
    };

    const minute = await createCommunityMinute(params);

    return NextResponse.json(minute, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al crear acta' },
      { status: 500 }
    );
  }
}
