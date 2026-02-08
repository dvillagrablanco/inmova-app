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

const toObjectRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const pickOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined;

const pickOptionalNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

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
      superficie: garden.metrosCuadrados,
      numeroParcelas: garden.parcelas.length,
      parcelasDisponibles: garden.parcelas.filter((p) => p.estado === 'disponible').length,
      tipoRiego: pickOptionalString(toObjectRecord(garden.reglas).tipoRiego),
      estado: garden.activo ? 'activo' : 'inactivo',
      fechaInauguracion: pickOptionalString(toObjectRecord(garden.reglas).fechaInauguracion),
      horario: pickOptionalString(toObjectRecord(garden.reglas).horario),
      precioMensual: pickOptionalNumber(toObjectRecord(garden.reglas).precioMensual),
      buildingId: garden.buildingId,
      buildingName: garden.building?.nombre,
      descripcion: garden.descripcion,
      cultivosPermitidos: toObjectRecord(garden.reglas).cultivosPermitidos ?? undefined,
      servicios: toObjectRecord(garden.reglas).servicios ?? undefined,
    }));

    return NextResponse.json(formattedGardens);
  } catch (error: unknown) {
    logger.error('[UrbanGardens GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al obtener huertos', details: message }, { status: 500 });
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
      tipoCultivo,
      reglas,
      fotos,
      activo,
    } = body;

    // Validaciones básicas
    if (!nombre || !ubicacion || !superficie || !buildingId) {
      return NextResponse.json(
        { error: 'Campos requeridos: nombre, ubicacion, superficie, buildingId' },
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

    const reglasBase = toObjectRecord(reglas);
    const reglasExtras: Record<string, unknown> = {};
    const numeroParcelasValue = typeof numeroParcelas !== 'undefined' ? Number(numeroParcelas) : undefined;
    if (Number.isFinite(numeroParcelasValue)) reglasExtras.numeroParcelas = numeroParcelasValue;
    const tipoRiegoValue = pickOptionalString(tipoRiego);
    if (tipoRiegoValue) reglasExtras.tipoRiego = tipoRiegoValue;
    const estadoValue = pickOptionalString(estado);
    if (estadoValue) reglasExtras.estado = estadoValue;
    const fechaInauguracionValue = fechaInauguracion ? new Date(fechaInauguracion).toISOString() : undefined;
    if (fechaInauguracionValue) reglasExtras.fechaInauguracion = fechaInauguracionValue;
    const horarioValue = pickOptionalString(horario);
    if (horarioValue) reglasExtras.horario = horarioValue;
    const precioMensualValue = typeof precioMensual !== 'undefined' ? Number(precioMensual) : undefined;
    if (Number.isFinite(precioMensualValue)) reglasExtras.precioMensual = precioMensualValue;
    if (typeof cultivosPermitidos !== 'undefined') reglasExtras.cultivosPermitidos = cultivosPermitidos;
    if (typeof servicios !== 'undefined') reglasExtras.servicios = servicios;

    const reglasMerged = {
      ...reglasBase,
      ...reglasExtras,
    };

    const fotosValue = Array.isArray(fotos) ? fotos.filter((item) => typeof item === 'string') : [];

    // Crear huerto
    const garden = await prisma.urbanGarden.create({
      data: {
        companyId: session.user.companyId,
        buildingId,
        nombre,
        ubicacion,
        metrosCuadrados: Number(superficie),
        tipoCultivo: pickOptionalString(tipoCultivo) || undefined,
        descripcion,
        reglas: Object.keys(reglasMerged).length > 0 ? reglasMerged : undefined,
        fotos: fotosValue,
        activo: typeof activo === 'boolean' ? activo : undefined,
      },
    });

    return NextResponse.json(garden, { status: 201 });
  } catch (error: unknown) {
    logger.error('[UrbanGardens POST] Error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al crear huerto', details: message }, { status: 500 });
  }
}
