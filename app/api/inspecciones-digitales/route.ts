import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type InspeccionTipo = 'entrada' | 'salida' | 'periodica';
type InspeccionEstado = 'programada' | 'en_proceso' | 'completada';

interface Inspeccion {
  id: string;
  propiedad: string;
  unidad: string;
  tipo: InspeccionTipo;
  fecha: string;
  inspector: string;
  estado: InspeccionEstado;
  puntuacion?: number;
  fotos?: number;
  incidencias?: number;
}

const querySchema = z.object({
  tipo: z.enum(['entrada', 'salida', 'periodica']).optional(),
  estado: z.enum(['programada', 'en_proceso', 'completada']).optional(),
});

const createSchema = z.object({
  buildingId: z.string().optional(),
  unitId: z.string().optional(),
  tipo: z.enum(['entrada', 'salida', 'periodica']),
  fecha: z.string(),
  inspectorName: z.string().min(1),
  descripcion: z.string().optional(),
});

function normalizeTipo(tipo: string): InspeccionTipo {
  if (tipo === 'entrada' || tipo === 'salida') return tipo;
  return 'periodica';
}

function normalizeEstado(estado: string): InspeccionEstado {
  if (estado === 'completada') return 'completada';
  if (estado === 'programada') return 'programada';
  return 'en_proceso';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Error desconocido';
}

// GET - Obtener inspecciones digitales
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      tipo: searchParams.get('tipo') === 'all' ? undefined : searchParams.get('tipo') ?? undefined,
      estado: searchParams.get('estado') === 'all' ? undefined : searchParams.get('estado') ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const prisma = getPrismaClient();
    const inspections = await prisma.inspection.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { fechaProgramada: 'desc' },
      take: 50,
    });

    const unitIds = inspections.map((inspection) => inspection.unitId).filter(Boolean) as string[];
    const buildingIds = inspections
      .map((inspection) => inspection.buildingId)
      .filter(Boolean) as string[];

    const [units, buildings] = await Promise.all([
      unitIds.length
        ? prisma.unit.findMany({
            where: { id: { in: unitIds }, building: { companyId: session.user.companyId } },
            select: { id: true, numero: true, building: { select: { id: true, nombre: true, direccion: true } } },
          })
        : Promise.resolve([]),
      buildingIds.length
        ? prisma.building.findMany({
            where: { id: { in: buildingIds }, companyId: session.user.companyId },
            select: { id: true, nombre: true, direccion: true },
          })
        : Promise.resolve([]),
    ]);

    const unitMap = new Map(units.map((unit) => [unit.id, unit]));
    const buildingMap = new Map(buildings.map((building) => [building.id, building]));

    let inspecciones: Inspeccion[] = inspections.map((inspection) => {
      const unit = inspection.unitId ? unitMap.get(inspection.unitId) : undefined;
      const building =
        (inspection.buildingId ? buildingMap.get(inspection.buildingId) : undefined) ??
        unit?.building;

      return {
        id: inspection.id,
        propiedad: building?.nombre || building?.direccion || 'Sin propiedad',
        unidad: unit?.numero || '',
        tipo: normalizeTipo(inspection.tipo),
        fecha: inspection.fechaProgramada.toISOString().split('T')[0],
        inspector: inspection.inspector,
        estado: normalizeEstado(inspection.estado),
        fotos: inspection.fotos?.length ?? 0,
        incidencias: 0,
      };
    });

    if (parsedQuery.data.tipo) {
      inspecciones = inspecciones.filter((inspection) => inspection.tipo === parsedQuery.data.tipo);
    }
    if (parsedQuery.data.estado) {
      inspecciones = inspecciones.filter((inspection) => inspection.estado === parsedQuery.data.estado);
    }

    // Estadísticas
    const stats = {
      total: inspecciones.length,
      programadas: inspecciones.filter((inspection) => inspection.estado === 'programada').length,
      enProceso: inspecciones.filter((inspection) => inspection.estado === 'en_proceso').length,
      completadas: inspecciones.filter((inspection) => inspection.estado === 'completada').length,
      puntuacionMedia: Math.round(
        inspecciones.filter((inspection) => inspection.puntuacion).reduce((sum, inspection) => sum + (inspection.puntuacion || 0), 0) /
        (inspecciones.filter((inspection) => inspection.puntuacion).length || 1)
      ),
    };

    return NextResponse.json({
      success: true,
      data: inspecciones,
      stats,
    });
  } catch (error: unknown) {
    logger.error('[API Inspecciones] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener inspecciones', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST - Programar nueva inspección
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const data = createSchema.parse(await request.json());

    if (!data.buildingId && !data.unitId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: buildingId o unitId' },
        { status: 400 }
      );
    }

    const fechaProgramada = new Date(data.fecha);
    if (Number.isNaN(fechaProgramada.getTime())) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 });
    }

    let unit = null;
    let building = null;

    if (data.unitId) {
      unit = await prisma.unit.findFirst({
        where: { id: data.unitId, building: { companyId: session.user.companyId } },
        select: { id: true, numero: true, building: { select: { id: true, nombre: true, direccion: true } } },
      });
      if (!unit) {
        return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
      }
      building = unit.building;
    }

    if (!building && data.buildingId) {
      building = await prisma.building.findFirst({
        where: { id: data.buildingId, companyId: session.user.companyId },
        select: { id: true, nombre: true, direccion: true },
      });
      if (!building) {
        return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
      }
    }

    const inspection = await prisma.inspection.create({
      data: {
        companyId: session.user.companyId,
        unitId: unit?.id ?? null,
        buildingId: building?.id ?? null,
        tipo: data.tipo,
        fechaProgramada,
        inspector: data.inspectorName,
        descripcion: data.descripcion ?? null,
        estado: 'programada',
      },
    });

    const response: Inspeccion = {
      id: inspection.id,
      propiedad: building?.nombre || building?.direccion || 'Sin propiedad',
      unidad: unit?.numero || '',
      tipo: normalizeTipo(inspection.tipo),
      fecha: inspection.fechaProgramada.toISOString().split('T')[0],
      inspector: inspection.inspector,
      estado: normalizeEstado(inspection.estado),
      fotos: inspection.fotos?.length ?? 0,
      incidencias: 0,
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: 'Inspección programada correctamente',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error('[API Inspecciones] Error POST:', error);
    return NextResponse.json(
      { error: 'Error al programar inspección', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
