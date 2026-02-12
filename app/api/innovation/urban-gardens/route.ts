/**
 * API: Urban Gardens (Huertos Urbanos)
 * GET - Listar huertos urbanos de la empresa
 * POST - Crear nuevo huerto urbano
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const gardens = await prisma.urbanGarden.findMany({
      where: {
        companyId: session.user.companyId,
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
          },
        },
        parcelas: {
          select: {
            id: true,
            estado: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formatear respuesta con estadísticas de parcelas
    const formattedGardens = gardens.map((garden) => ({
      id: garden.id,
      nombre: garden.nombre,
      ubicacion: garden.ubicacion,
      superficie: garden.metrosCuadrados,
      numeroParcelas: garden.parcelas.length,
      parcelasDisponibles: garden.parcelas.filter((p) => p.estado === 'disponible').length,
      tipoRiego: garden.tipoCultivo,
      estado: garden.activo ? 'activo' : 'inactivo',
      buildingId: garden.buildingId,
      buildingName: garden.building?.nombre,
      descripcion: garden.descripcion,
    }));

    return NextResponse.json(formattedGardens);
  } catch (error: any) {
    logger.error('[UrbanGardens GET] Error:', error);
    return NextResponse.json({ error: 'Error al obtener huertos', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      nombre,
      ubicacion,
      superficie,
      numeroParcelas,
      tipoRiego,
      estado,
      buildingId,
      descripcion,
    } = body;

    // Validaciones básicas
    if (!nombre || !ubicacion || !superficie || !numeroParcelas || !buildingId) {
      return NextResponse.json(
        { error: 'Campos requeridos: nombre, ubicacion, superficie, numeroParcelas, buildingId' },
        { status: 400 }
      );
    }

    // Verificar que el edificio pertenece a la empresa
    const building = await prisma.building.findFirst({
      where: {
        id: buildingId,
        companyId: session.user.companyId,
      },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    // Crear huerto
    const metrosCuadrados = Number(superficie);
    const totalParcelas = Number(numeroParcelas);
    const activo =
      typeof estado === 'boolean'
        ? estado
        : estado
          ? String(estado).toLowerCase() !== 'inactivo'
          : true;

    const garden = await prisma.urbanGarden.create({
      data: {
        companyId: session.user.companyId,
        buildingId,
        nombre,
        ubicacion,
        metrosCuadrados,
        tipoCultivo: tipoRiego || 'organico',
        activo,
        descripcion,
      },
    });

    if (Number.isFinite(totalParcelas) && totalParcelas > 0) {
      const metrosPorParcela =
        Number.isFinite(metrosCuadrados) && totalParcelas > 0
          ? metrosCuadrados / totalParcelas
          : 0;
      const parcelas = Array.from({ length: totalParcelas }, (_, index) => ({
        gardenId: garden.id,
        numeroParcela: `${index + 1}`,
        metrosCuadrados: metrosPorParcela,
        estado: 'disponible',
      }));

      await prisma.gardenPlot.createMany({
        data: parcelas,
      });
    }

    return NextResponse.json(garden, { status: 201 });
  } catch (error: any) {
    logger.error('[UrbanGardens POST] Error:', error);
    return NextResponse.json({ error: 'Error al crear huerto', details: error.message }, { status: 500 });
  }
}
