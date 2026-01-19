import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createCuotaSchema = z.object({
  buildingId: z.string().min(1),
  unitId: z.string().optional(),
  tipo: z.enum(['ordinaria', 'extraordinaria', 'derrama']),
  periodo: z.string().min(1), // "2024-Q1", "2024-01"
  concepto: z.string().min(1),
  importeBase: z.number().positive(),
  coeficiente: z.number().default(1.0),
  fechaVencimiento: z.string().datetime(),
  gastosCorrientes: z.number().default(0),
  fondoReserva: z.number().default(0),
  seguros: z.number().default(0),
  mantenimiento: z.number().default(0),
  otros: z.number().default(0),
  notas: z.string().optional(),
});

// GET - Listar cuotas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const comunidadId = searchParams.get('comunidadId');
    const estado = searchParams.get('estado');
    const periodo = searchParams.get('periodo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const companyId = (session.user as any).companyId;

    // Obtener buildingId si se proporciona comunidadId
    let targetBuildingId = buildingId;
    if (comunidadId && !buildingId) {
      const comunidad = await prisma.communityManagement.findFirst({
        where: { id: comunidadId, companyId },
        select: { buildingId: true },
      });
      targetBuildingId = comunidad?.buildingId || null;
    }

    // Construir filtros
    const where: any = { companyId };
    if (targetBuildingId) where.buildingId = targetBuildingId;
    if (estado) where.estado = estado;
    if (periodo) where.periodo = periodo;

    const [cuotas, total] = await Promise.all([
      prisma.communityFee.findMany({
        where,
        include: {
          building: {
            select: { id: true, name: true },
          },
          unit: {
            select: { id: true, unitNumber: true, type: true },
          },
        },
        orderBy: [{ fechaVencimiento: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityFee.count({ where }),
    ]);

    // Calcular estadísticas
    const statsWhere = targetBuildingId ? { companyId, buildingId: targetBuildingId } : { companyId };
    
    const [totalPendiente, totalCobrado, morosos] = await Promise.all([
      prisma.communityFee.aggregate({
        where: { ...statsWhere, estado: 'pendiente' },
        _sum: { importeTotal: true },
        _count: { id: true },
      }),
      prisma.communityFee.aggregate({
        where: { ...statsWhere, estado: 'pagado' },
        _sum: { importeTotal: true },
        _count: { id: true },
      }),
      prisma.communityFee.groupBy({
        by: ['unitId'],
        where: { ...statsWhere, estado: 'pendiente' },
        _sum: { importeTotal: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      cuotas: cuotas.map(c => ({
        ...c,
        importeTotal: c.importeBase * c.coeficiente,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalPendiente: totalPendiente._sum.importeTotal || 0,
        cuotasPendientes: totalPendiente._count.id,
        totalCobrado: totalCobrado._sum.importeTotal || 0,
        cuotasCobradas: totalCobrado._count.id,
        unidadesMorosas: morosos.length,
      },
    });
  } catch (error: any) {
    console.error('[Cuotas GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo cuotas', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear cuota(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json();

    // Verificar si es generación masiva o individual
    if (body.generarParaTodas) {
      // Generar cuotas para todas las unidades del edificio
      const { buildingId, tipo, periodo, concepto, importeBase, fechaVencimiento } = body;

      const unidades = await prisma.unit.findMany({
        where: {
          buildingId,
          building: { companyId },
        },
        select: { id: true, squareMeters: true },
      });

      // Calcular coeficiente basado en metros cuadrados
      const totalM2 = unidades.reduce((sum, u) => sum + (u.squareMeters || 0), 0);

      const cuotasData = unidades.map(unidad => {
        const coeficiente = totalM2 > 0 ? (unidad.squareMeters || 0) / totalM2 : 1 / unidades.length;
        return {
          companyId,
          buildingId,
          unitId: unidad.id,
          tipo: tipo || 'ordinaria',
          periodo,
          concepto,
          importeBase,
          coeficiente,
          importeTotal: importeBase * coeficiente,
          fechaVencimiento: new Date(fechaVencimiento),
          estado: 'pendiente' as const,
        };
      });

      const result = await prisma.communityFee.createMany({
        data: cuotasData,
      });

      return NextResponse.json({
        message: `${result.count} cuotas generadas correctamente`,
        count: result.count,
      }, { status: 201 });
    } else {
      // Crear cuota individual
      const validated = createCuotaSchema.parse(body);

      const cuota = await prisma.communityFee.create({
        data: {
          companyId,
          buildingId: validated.buildingId,
          unitId: validated.unitId,
          tipo: validated.tipo,
          periodo: validated.periodo,
          concepto: validated.concepto,
          importeBase: validated.importeBase,
          coeficiente: validated.coeficiente,
          importeTotal: validated.importeBase * validated.coeficiente,
          fechaVencimiento: new Date(validated.fechaVencimiento),
          gastosCorrientes: validated.gastosCorrientes,
          fondoReserva: validated.fondoReserva,
          seguros: validated.seguros,
          mantenimiento: validated.mantenimiento,
          otros: validated.otros,
          notas: validated.notas,
          estado: 'pendiente',
        },
        include: {
          unit: { select: { id: true, unitNumber: true } },
          building: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({ cuota }, { status: 201 });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[Cuotas POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando cuota', details: error.message },
      { status: 500 }
    );
  }
}
