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
const TIPO_MAPPING: Record<string, string[]> = {
  oficinas: ['oficina_privada', 'oficina_abierta', 'coworking_office'],
  locales: ['local_comercial', 'local_centro_comercial', 'showroom'],
  naves: ['nave_industrial', 'almacen', 'taller'],
  coworking: ['coworking_hot_desk', 'coworking_dedicated', 'coworking_office', 'sala_reuniones'],
};

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
    let tipoFilter: string[] = [];
    if (categoria && TIPO_MAPPING[categoria]) {
      tipoFilter = TIPO_MAPPING[categoria];
    }

    const spaces = await prisma.commercialSpace.findMany({
      where: {
        companyId: session.user.companyId,
        ...(tipoFilter.length > 0 && { tipo: { in: tipoFilter as any } }),
        ...(estado && { estadoOcupacion: estado }),
      },
      include: {
        leases: {
          where: { estado: 'activo' },
          include: {
            tenant: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
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
      const activeLease = space.leases[0];
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
        estado: space.estadoOcupacion || (activeLease ? 'ocupada' : 'disponible'),
        rentaMensual: space.precioAlquiler,
        arrendatario: activeLease?.tenant?.nombre || null,
        arrendatarioId: activeLease?.tenant?.id || null,
        buildingId: space.buildingId,
        buildingName: space.building?.nombre,
        caracteristicas: [
          space.aireAcondicionado && 'climatizacion',
          space.parking && 'parking',
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
      reservadas: formattedSpaces.filter((s) => s.estado === 'reservada').length,
      superficieTotal: formattedSpaces.reduce((sum, s) => sum + (s.superficie || 0), 0),
      rentaMensualTotal: formattedSpaces
        .filter((s) => s.estado === 'ocupada')
        .reduce((sum, s) => sum + (s.rentaMensual || 0), 0),
    };

    return NextResponse.json({ spaces: formattedSpaces, stats });
  } catch (error: any) {
    logger.error('[CommercialSpaces GET] Error:', error);
    return NextResponse.json({ error: 'Error al obtener espacios', details: error.message }, { status: 500 });
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
      tipo,
      direccion,
      ciudad,
      codigoPostal,
      provincia,
      planta,
      superficieConstruida,
      superficieUtil,
      precioAlquiler,
      buildingId,
      descripcion,
      // Características
      aireAcondicionado,
      parking,
      fibraOptica,
      fachada,
      muelleCarga,
      plantaDiafana,
    } = body;

    // Validaciones básicas
    if (!nombre || !tipo || !direccion || !ciudad || !superficieConstruida) {
      return NextResponse.json(
        { error: 'Campos requeridos: nombre, tipo, direccion, ciudad, superficieConstruida' },
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
        codigoPostal: codigoPostal || '',
        provincia: provincia || ciudad,
        planta: planta ? Number(planta) : null,
        superficieConstruida: Number(superficieConstruida),
        superficieUtil: superficieUtil ? Number(superficieUtil) : Number(superficieConstruida) * 0.9,
        precioAlquiler: precioAlquiler ? Number(precioAlquiler) : null,
        buildingId,
        descripcion,
        aireAcondicionado: aireAcondicionado || false,
        parking: parking || false,
        fibraOptica: fibraOptica || false,
        fachada: fachada || false,
        muelleCarga: muelleCarga || false,
        plantaDiafana: plantaDiafana || false,
        estadoOcupacion: 'disponible',
      },
    });

    return NextResponse.json(space, { status: 201 });
  } catch (error: any) {
    logger.error('[CommercialSpaces POST] Error:', error);
    return NextResponse.json({ error: 'Error al crear espacio', details: error.message }, { status: 500 });
  }
}
