/**
 * API Route: Edificio individual
 * GET /api/buildings/[id] - Obtener edificio con unidades
 * PUT /api/buildings/[id] - Actualizar edificio
 * DELETE /api/buildings/[id] - Eliminar edificio
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener edificio con sus unidades
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const buildingId = params.id;

    const building = await prisma.building.findFirst({
      where: {
        id: buildingId,
        companyId: session.user.companyId,
      },
      include: {
        units: {
          include: {
            tenant: {
              select: {
                id: true,
                nombreCompleto: true,
              },
            },
          },
          orderBy: {
            numero: 'asc',
          },
        },
      },
    });

    if (!building) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(building);
  } catch (error: any) {
    logger.error('[API Buildings GET] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener el edificio' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar edificio
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const buildingId = params.id;
    const body = await request.json();

    // Verificar que el edificio existe y pertenece a la empresa
    const existingBuilding = await prisma.building.findFirst({
      where: {
        id: buildingId,
        companyId: session.user.companyId,
      },
    });

    if (!existingBuilding) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar edificio
    const updatedBuilding = await prisma.building.update({
      where: { id: buildingId },
      data: {
        nombre: body.nombre,
        direccion: body.direccion,
        tipo: body.tipo,
        anoConstructor: body.anoConstructor,
        numeroUnidades: body.numeroUnidades,
        estadoConservacion: body.estadoConservacion,
        certificadoEnergetico: body.certificadoEnergetico,
        ascensor: body.ascensor,
        garaje: body.garaje,
        trastero: body.trastero,
        piscina: body.piscina,
        jardin: body.jardin,
        gastosComunidad: body.gastosComunidad,
        ibiAnual: body.ibiAnual,
        latitud: body.latitud,
        longitud: body.longitud,
        imagenes: body.imagenes,
        etiquetas: body.etiquetas,
      },
      include: {
        units: true,
      },
    });

    return NextResponse.json(updatedBuilding);
  } catch (error: any) {
    logger.error('[API Buildings PUT] Error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el edificio' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar edificio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const buildingId = params.id;

    // Verificar que el edificio existe y pertenece a la empresa
    const existingBuilding = await prisma.building.findFirst({
      where: {
        id: buildingId,
        companyId: session.user.companyId,
      },
      include: {
        units: true,
      },
    });

    if (!existingBuilding) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar edificio (cascade eliminará las unidades)
    await prisma.building.delete({
      where: { id: buildingId },
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BUILDING_DELETED',
        entityType: 'BUILDING',
        entityId: buildingId,
        details: {
          nombre: existingBuilding.nombre,
          direccion: existingBuilding.direccion,
          unidadesEliminadas: existingBuilding.units.length,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('[API Buildings DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el edificio' },
      { status: 500 }
    );
  }
}
