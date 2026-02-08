/**
 * API: Commercial Spaces
 * GET - Listar espacios comerciales filtrados por tipo
 * POST - Crear nuevo espacio comercial
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mapeo de tipos para cada categoría
const TIPO_MAPPING = {
  oficinas: ['oficina_privada', 'oficina_abierta', 'coworking_office'],
  locales: ['local_comercial', 'local_centro_comercial', 'showroom'],
  naves: ['nave_industrial', 'almacen', 'taller'],
  coworking: ['coworking_hot_desk', 'coworking_dedicated', 'coworking_office', 'sala_reuniones'],
} as const;

const isCategoriaComercial = (
  value: string
): value is keyof typeof TIPO_MAPPING => value in TIPO_MAPPING;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria'); // oficinas, locales, naves, coworking
    const estado = searchParams.get('estado');

    // Construir filtro de tipos
    type CommercialSpaceTypeValue =
      (typeof TIPO_MAPPING)[keyof typeof TIPO_MAPPING][number];

    let tipoFilter: CommercialSpaceTypeValue[] = [];
    if (categoria && isCategoriaComercial(categoria)) {
      tipoFilter = [...TIPO_MAPPING[categoria]];
    }

    const normalizedEstado = estado ? estado.toLowerCase() : null;
    type EstadoValue = 'ocupada' | 'disponible' | 'en_mantenimiento';
    const allowedEstados = new Set<EstadoValue>([
      'ocupada',
      'disponible',
      'en_mantenimiento',
    ]);
    const isUnitStatus = (value: string): value is EstadoValue =>
      allowedEstados.has(value as EstadoValue);
    const estadoValue =
      normalizedEstado && isUnitStatus(normalizedEstado) ? normalizedEstado : null;

    const spaces = await prisma.commercialSpace.findMany({
      where: {
        companyId: session.user.companyId,
        ...(tipoFilter.length > 0 && { tipo: { in: tipoFilter } }),
        ...(estadoValue && {
          estado: estadoValue,
        }),
      },
      include: {
        commercialLeases: {
          where: { estado: 'activo' },
          select: {
            id: true,
            arrendatarioNombre: true,
            arrendatarioEmail: true,
          },
          take: 1,
        },
        building: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formatear respuesta
    const formattedSpaces = spaces.map((space) => {
      const activeLease = space.commercialLeases[0];
      return {
        id: space.id,
        nombre: space.nombre,
        referencia: space.referencia,
        tipo: space.tipo,
        direccion: `${space.direccion}, ${space.ciudad}`,
        ciudad: space.ciudad,
        planta: space.planta,
        superficie: space.superficieConstruida,
        superficieUtil: space.superficieUtil,
        estado: space.estado || (activeLease ? 'ocupada' : 'disponible'),
        rentaMensual: space.rentaMensualBase,
        arrendatario: activeLease?.arrendatarioNombre || null,
        arrendatarioId: null,
        buildingId: space.buildingId,
        buildingName: space.building?.nombre,
        caracteristicas: [
          space.aireAcondicionado && 'climatizacion',
          space.plazasParking && space.plazasParking > 0 && 'parking',
          space.fibraOptica && 'fibra',
          space.fachada && 'fachada',
          space.muelleCarga && 'muelle_carga',
          space.plantaDiafana && 'diafana',
        ].filter(Boolean),
        imagen: space.imagenes?.[0] || '/api/placeholder/400/200',
        descripcion: space.descripcion,
        createdAt: space.createdAt,
      };
    });

    // Estadísticas
    const stats = {
      total: formattedSpaces.length,
      ocupadas: formattedSpaces.filter((s) => s.estado === 'ocupada').length,
      disponibles: formattedSpaces.filter((s) => s.estado === 'disponible').length,
      reservadas: 0,
      superficieTotal: formattedSpaces.reduce((sum, s) => sum + (s.superficie || 0), 0),
      rentaMensualTotal: formattedSpaces
        .filter((s) => s.estado === 'ocupada')
        .reduce((sum, s) => sum + (s.rentaMensual || 0), 0),
    };

    return NextResponse.json({ spaces: formattedSpaces, stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[CommercialSpaces GET] Error:', { message });
    return NextResponse.json({ error: 'Error al obtener espacios', details: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const getString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
    const getBoolean = (value: unknown) => value === true;
    const getNumber = (value: unknown): number | null => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const nombre = getString(body.nombre);
    const tipo = getString(body.tipo);
    const direccion = getString(body.direccion);
    const ciudad = getString(body.ciudad);
    const codigoPostal = getString(body.codigoPostal);
    const provincia = getString(body.provincia);
    const planta = getNumber(body.planta);
    const superficieConstruida = getNumber(body.superficieConstruida);
    const superficieUtil = getNumber(body.superficieUtil);
    const rentaMensualBase =
      getNumber(body.rentaMensualBase) ?? getNumber(body.precioAlquiler);
    const buildingId = getString(body.buildingId) || null;
    const descripcion = getString(body.descripcion) || null;
    const aireAcondicionado = getBoolean(body.aireAcondicionado);
    const parking = getBoolean(body.parking);
    const plazasParking = getNumber(body.plazasParking);
    const fibraOptica = getBoolean(body.fibraOptica);
    const fachada = getBoolean(body.fachada);
    const muelleCarga = getBoolean(body.muelleCarga);
    const plantaDiafana = getBoolean(body.plantaDiafana);

    // Validaciones básicas
    if (
      !nombre ||
      !tipo ||
      !direccion ||
      !ciudad ||
      !codigoPostal ||
      !provincia ||
      !superficieConstruida ||
      rentaMensualBase === null
    ) {
      return NextResponse.json(
        {
          error:
            'Campos requeridos: nombre, tipo, direccion, ciudad, codigoPostal, provincia, superficieConstruida, rentaMensualBase',
        },
        { status: 400 }
      );
    }

    const space = await prisma.commercialSpace.create({
      data: {
        companyId: session.user.companyId,
        nombre,
        tipo,
        direccion,
        ciudad,
        codigoPostal,
        provincia,
        planta,
        superficieConstruida,
        superficieUtil:
          superficieUtil ?? Math.round(superficieConstruida * 0.9 * 100) / 100,
        rentaMensualBase,
        buildingId,
        descripcion,
        aireAcondicionado,
        plazasParking: plazasParking ?? (parking ? 1 : null),
        fibraOptica,
        fachada,
        muelleCarga,
        plantaDiafana,
        estado: 'disponible',
      },
    });

    return NextResponse.json(space, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[CommercialSpaces POST] Error:', { message });
    return NextResponse.json({ error: 'Error al crear espacio', details: message }, { status: 500 });
  }
}
