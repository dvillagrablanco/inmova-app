/**
 * API: Urban Gardens (Huertos Urbanos)
 * GET - Listar huertos urbanos de la empresa
 * POST - Crear nuevo huerto urbano
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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
      superficie: garden.superficie,
      numeroParcelas: garden.numeroParcelas,
      parcelasDisponibles: garden.parcelas.filter((p) => p.estado === 'DISPONIBLE').length,
      tipoRiego: garden.tipoRiego,
      estado: garden.estado,
      fechaInauguracion: garden.fechaInauguracion,
      horario: garden.horario,
      precioMensual: garden.precioMensual,
      buildingId: garden.buildingId,
      buildingName: garden.building?.nombre,
      descripcion: garden.descripcion,
      cultivosPermitidos: garden.cultivosPermitidos,
      servicios: garden.servicios,
    }));

    return NextResponse.json(formattedGardens);
  } catch (error: any) {
    logger.error('[UrbanGardens GET] Error:', error);
    return NextResponse.json({ error: 'Error al obtener huertos', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
      fechaInauguracion,
      horario,
      precioMensual,
      buildingId,
      descripcion,
      cultivosPermitidos,
      servicios,
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
    const garden = await prisma.urbanGarden.create({
      data: {
        companyId: session.user.companyId,
        buildingId,
        nombre,
        ubicacion,
        superficie: Number(superficie),
        numeroParcelas: Number(numeroParcelas),
        tipoRiego: tipoRiego || 'GOTEO',
        estado: estado || 'ACTIVO',
        fechaInauguracion: fechaInauguracion ? new Date(fechaInauguracion) : new Date(),
        horario: horario || '08:00 - 20:00',
        precioMensual: precioMensual ? Number(precioMensual) : 0,
        descripcion,
        cultivosPermitidos,
        servicios,
      },
    });

    return NextResponse.json(garden, { status: 201 });
  } catch (error: any) {
    logger.error('[UrbanGardens POST] Error:', error);
    return NextResponse.json({ error: 'Error al crear huerto', details: error.message }, { status: 500 });
  }
}
