/**
 * API: Urban Garden by ID
 * GET - Obtener huerto por ID
 * PUT - Actualizar huerto
 * DELETE - Eliminar huerto
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const garden = await prisma.urbanGarden.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
          },
        },
        parcelas: true,
      },
    });

    if (!garden) {
      return NextResponse.json({ error: 'Huerto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      ...garden,
      buildingName: garden.building?.nombre,
      parcelasDisponibles: garden.parcelas.filter((p) => p.estado === 'disponible').length,
    });
  } catch (error: any) {
    logger.error('[UrbanGarden GET] Error:', error);
    return NextResponse.json({ error: 'Error al obtener huerto', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verificar que el huerto existe y pertenece a la empresa
    const existingGarden = await prisma.urbanGarden.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existingGarden) {
      return NextResponse.json({ error: 'Huerto no encontrado' }, { status: 404 });
    }

    const {
      nombre,
      ubicacion,
      superficie,
      buildingId,
      descripcion,
      tipoRiego,
      fotos,
      reglas,
      activo,
    } = body;

    const garden = await prisma.urbanGarden.update({
      where: { id },
      data: {
        nombre,
        ubicacion,
        metrosCuadrados: superficie ? Number(superficie) : undefined,
        tipoCultivo: tipoRiego,
        buildingId,
        descripcion,
        fotos,
        reglas,
        ...(typeof activo === 'boolean' ? { activo } : {}),
      },
    });

    return NextResponse.json(garden);
  } catch (error: any) {
    logger.error('[UrbanGarden PUT] Error:', error);
    return NextResponse.json({ error: 'Error al actualizar huerto', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el huerto existe y pertenece a la empresa
    const existingGarden = await prisma.urbanGarden.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existingGarden) {
      return NextResponse.json({ error: 'Huerto no encontrado' }, { status: 404 });
    }

    // Eliminar huerto (las parcelas se eliminan en cascada)
    await prisma.urbanGarden.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Huerto eliminado' });
  } catch (error: any) {
    logger.error('[UrbanGarden DELETE] Error:', error);
    return NextResponse.json({ error: 'Error al eliminar huerto', details: error.message }, { status: 500 });
  }
}
