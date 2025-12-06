import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  registerBuildingInspection,
  getITECalendar,
  CreateITEParams,
} from '@/lib/services/compliance-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';


/**
 * @swagger
 * /api/compliance/inspections:
 *   get:
 *     summary: Obtener inspecciones técnicas (ITE)
 *     tags: [Cumplimiento]
 *   post:
 *     summary: Registrar nueva inspección
 *     tags: [Cumplimiento]
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');
    const companyId = searchParams.get('companyId');
    const buildingId = searchParams.get('buildingId');

    if (action === 'calendar' && companyId) {
      // Obtener calendario de ITEs
      const calendar = await getITECalendar(companyId);
      return NextResponse.json(calendar);
    }

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (buildingId) where.buildingId = buildingId;

    const inspections = await prisma.buildingInspection.findMany({
      where,
      include: {
        building: true,
      },
      orderBy: { fechaInspeccion: 'desc' },
    });

    return NextResponse.json(inspections);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener inspecciones' },
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
    const params: CreateITEParams = {
      buildingId: body.buildingId,
      companyId: body.companyId,
      fechaInspeccion: new Date(body.fechaInspeccion),
      tecnicoResponsable: body.tecnicoResponsable,
      resultado: body.resultado,
      deficienciasEncontradas: body.deficienciasEncontradas || [],
      recomendaciones: body.recomendaciones || [],
      proximaInspeccion: body.proximaInspeccion
        ? new Date(body.proximaInspeccion)
        : undefined,
    };

    const inspection = await registerBuildingInspection(params);

    return NextResponse.json(inspection, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al registrar inspección' },
      { status: 500 }
    );
  }
}
