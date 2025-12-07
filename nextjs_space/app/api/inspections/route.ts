import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const unitId = searchParams.get('unitId');
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');

    const where: any = {
      companyId: session.user.companyId,
    };

    if (buildingId) where.buildingId = buildingId;
    if (unitId) where.unitId = unitId;
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    const inspections = await prisma.legalInspection.findMany({
      where,
      orderBy: { fechaProgramada: 'desc' },
    });

    // Enriquecer con datos de edificios/unidades si existen
    const enrichedInspections = await Promise.all(
      inspections.map(async (inspection) => {
        let buildingName: string | null | undefined = null;
        let unitNumber: string | null | undefined = null;

        if (inspection.buildingId) {
          const building = await prisma.building.findUnique({
            where: { id: inspection.buildingId },
            select: { nombre: true },
          });
          buildingName = building?.nombre;
        }

        if (inspection.unitId) {
          const unit = await prisma.unit.findUnique({
            where: { id: inspection.unitId },
            select: { numero: true },
          });
          unitNumber = unit?.numero;
        }

        return {
          ...inspection,
          buildingName,
          unitNumber,
        };
      })
    );

    return NextResponse.json(enrichedInspections);
  } catch (error) {
    logger.error('Error al obtener inspecciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener inspecciones' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      tipo,
      buildingId,
      unitId,
      tenantId,
      fechaProgramada,
      inspector,
      checklist,
      observaciones,
    } = body;

    const inspection = await prisma.legalInspection.create({
      data: {
        companyId: session.user.companyId,
        tipo,
        buildingId,
        unitId,
        tenantId,
        fechaProgramada: new Date(fechaProgramada),
        inspector,
        checklist: checklist || JSON.stringify([]),
        observaciones,
        estado: 'programada',
      },
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    logger.error('Error al crear inspección:', error);
    return NextResponse.json(
      { error: 'Error al crear inspección' },
      { status: 500 }
    );
  }
}
