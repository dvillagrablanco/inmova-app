import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const presupuestoSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['mensual', 'trimestral', 'anual', 'proyecto']),
  montoTotal: z.number().positive(),
  categorias: z.array(z.object({
    nombre: z.string(),
    montoAsignado: z.number(),
  })).optional(),
  fechaInicio: z.string(),
  fechaFin: z.string(),
  notas: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');

    try {
      const presupuestos = await prisma.presupuesto.findMany({
        where: {
          companyId: session.user.companyId,
          ...(tipo && { tipo }),
          ...(estado && { estado }),
        },
        include: {
          categorias: true,
          gastos: {
            select: { monto: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const presupuestosConGastado = presupuestos.map((p: any) => ({
        ...p,
        gastoActual: p.gastos.reduce((sum: number, g: any) => sum + g.monto, 0),
        porcentajeUsado: p.gastos.reduce((sum: number, g: any) => sum + g.monto, 0) / p.montoTotal * 100,
      }));

      return NextResponse.json({
        presupuestos: presupuestosConGastado,
        resumen: {
          total: presupuestos.length,
          montoTotalAsignado: presupuestos.reduce((sum: number, p: any) => sum + p.montoTotal, 0),
          montoTotalGastado: presupuestosConGastado.reduce((sum: number, p: any) => sum + p.gastoActual, 0),
        },
      });
    } catch {
      // Si no existe la tabla, retornar datos vacíos
      return NextResponse.json({
        presupuestos: [],
        resumen: { total: 0, montoTotalAsignado: 0, montoTotalGastado: 0 },
      });
    }
  } catch (error: any) {
    console.error('[API Presupuestos] Error:', error);
    return NextResponse.json({ error: 'Error al obtener presupuestos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = presupuestoSchema.parse(body);

    try {
      const presupuesto = await prisma.presupuesto.create({
        data: {
          nombre: validated.nombre,
          tipo: validated.tipo,
          montoTotal: validated.montoTotal,
          fechaInicio: new Date(validated.fechaInicio),
          fechaFin: new Date(validated.fechaFin),
          notas: validated.notas,
          estado: 'activo',
          companyId: session.user.companyId,
          createdBy: session.user.id,
          categorias: validated.categorias ? {
            create: validated.categorias.map(c => ({
              nombre: c.nombre,
              montoAsignado: c.montoAsignado,
            })),
          } : undefined,
        },
        include: { categorias: true },
      });

      return NextResponse.json(presupuesto, { status: 201 });
    } catch (dbError) {
      console.warn('[API Presupuestos] Error de BD:', dbError);
      return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    console.error('[API Presupuestos] Error:', error);
    return NextResponse.json({ error: 'Error al crear presupuesto' }, { status: 500 });
  }
}
