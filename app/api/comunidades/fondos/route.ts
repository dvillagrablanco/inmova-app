import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createFondoSchema = z.object({
  buildingId: z.string().min(1),
  tipo: z.enum(['reserva', 'obras', 'mejoras', 'emergencia', 'otro']),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  saldoObjetivo: z.number().optional(),
  aportacionMensual: z.number().default(0),
});

const movimientoSchema = z.object({
  fondoId: z.string().min(1),
  tipo: z.enum(['aportacion', 'gasto', 'transferencia']),
  concepto: z.string().min(1),
  importe: z.number(),
  fecha: z.string().datetime().optional(),
  referencia: z.string().optional(),
});

// GET - Listar fondos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const comunidadId = searchParams.get('comunidadId');
    const tipo = searchParams.get('tipo');
    const activo = searchParams.get('activo');

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
    if (tipo) where.tipo = tipo;
    if (activo !== null && activo !== undefined) {
      where.activo = activo === 'true';
    }

    const fondos = await prisma.communityFund.findMany({
      where,
      include: {
        building: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular estadísticas
    const totales = fondos.reduce(
      (acc, fondo) => ({
        saldoTotal: acc.saldoTotal + fondo.saldoActual,
        objetivoTotal: acc.objetivoTotal + (fondo.saldoObjetivo || 0),
        aportacionesMensuales: acc.aportacionesMensuales + fondo.aportacionMensual,
      }),
      { saldoTotal: 0, objetivoTotal: 0, aportacionesMensuales: 0 }
    );

    return NextResponse.json({
      fondos: fondos.map(f => ({
        ...f,
        movimientos: f.movimientos as any[],
        porcentajeObjetivo: f.saldoObjetivo 
          ? Math.round((f.saldoActual / f.saldoObjetivo) * 100)
          : null,
      })),
      stats: {
        totalFondos: fondos.length,
        ...totales,
        porcentajeGlobal: totales.objetivoTotal > 0
          ? Math.round((totales.saldoTotal / totales.objetivoTotal) * 100)
          : 100,
      },
    });
  } catch (error: any) {
    console.error('[Fondos GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo fondos', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear fondo o registrar movimiento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json();

    // Verificar si es un movimiento o crear fondo
    if (body.fondoId) {
      // Registrar movimiento
      const validated = movimientoSchema.parse(body);

      const fondo = await prisma.communityFund.findFirst({
        where: { id: validated.fondoId, companyId },
      });

      if (!fondo) {
        return NextResponse.json({ error: 'Fondo no encontrado' }, { status: 404 });
      }

      // Calcular nuevo saldo
      const importeAjustado = validated.tipo === 'gasto' 
        ? -Math.abs(validated.importe)
        : Math.abs(validated.importe);

      const nuevoSaldo = fondo.saldoActual + importeAjustado;

      if (nuevoSaldo < 0) {
        return NextResponse.json(
          { error: 'El movimiento dejaría el fondo en negativo' },
          { status: 400 }
        );
      }

      // Agregar movimiento al historial
      const movimientos = (fondo.movimientos as any[]) || [];
      movimientos.push({
        id: `mov_${Date.now()}`,
        tipo: validated.tipo,
        concepto: validated.concepto,
        importe: importeAjustado,
        fecha: validated.fecha || new Date().toISOString(),
        referencia: validated.referencia,
        saldoAnterior: fondo.saldoActual,
        saldoNuevo: nuevoSaldo,
      });

      const updated = await prisma.communityFund.update({
        where: { id: validated.fondoId },
        data: {
          saldoActual: nuevoSaldo,
          movimientos,
          totalAportaciones: validated.tipo === 'aportacion'
            ? fondo.totalAportaciones + Math.abs(validated.importe)
            : fondo.totalAportaciones,
          totalGastos: validated.tipo === 'gasto'
            ? fondo.totalGastos + Math.abs(validated.importe)
            : fondo.totalGastos,
        },
      });

      return NextResponse.json({
        fondo: updated,
        message: 'Movimiento registrado correctamente',
      });
    } else {
      // Crear nuevo fondo
      const validated = createFondoSchema.parse(body);

      // Verificar que el edificio existe
      const building = await prisma.building.findFirst({
        where: { id: validated.buildingId, companyId },
      });

      if (!building) {
        return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
      }

      const fondo = await prisma.communityFund.create({
        data: {
          companyId,
          buildingId: validated.buildingId,
          tipo: validated.tipo,
          nombre: validated.nombre,
          descripcion: validated.descripcion,
          saldoObjetivo: validated.saldoObjetivo,
          aportacionMensual: validated.aportacionMensual,
          saldoActual: 0,
          movimientos: [],
          activo: true,
        },
        include: {
          building: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({ fondo }, { status: 201 });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[Fondos POST Error]:', error);
    return NextResponse.json(
      { error: 'Error procesando fondo', details: error.message },
      { status: 500 }
    );
  }
}
