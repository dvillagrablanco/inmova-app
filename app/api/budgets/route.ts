import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const budgetTypeSchema = z.enum([
  'mantenimiento',
  'reforma',
  'servicio',
  'honorarios',
]);

const budgetItemSchema = z.object({
  concepto: z.string().min(1),
  cantidad: z.number().min(0),
  unidad: z.string().min(1),
  precioUnitario: z.number().min(0),
});

const budgetCreateSchema = z.object({
  titulo: z.string().min(1).trim(),
  descripcion: z.string().optional(),
  tipo: budgetTypeSchema.optional(),
  propiedadId: z.string().optional(),
  clienteNombre: z.string().optional(),
  proveedorNombre: z.string().optional(),
  validezDias: z.union([z.string(), z.number()]).optional(),
  items: z.array(budgetItemSchema).min(1),
  notas: z.string().optional(),
  ivaRate: z.union([z.string(), z.number()]).optional(),
});

type BudgetCreateInput = z.infer<typeof budgetCreateSchema>;

interface BudgetResponseItem {
  id: string;
  concepto: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  total: number;
}

interface BudgetResponse {
  id: string;
  numero: string;
  titulo: string;
  descripcion?: string;
  tipo: z.infer<typeof budgetTypeSchema>;
  estado: 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'facturado';
  propiedad?: { id: string; direccion: string };
  cliente?: { id: string; nombre: string };
  proveedor?: { id: string; nombre: string };
  fechaCreacion: string;
  fechaValidez: string;
  items: BudgetResponseItem[];
  subtotal: number;
  iva: number;
  total: number;
  notas?: string;
}

const mapBudgetResponse = (budget: {
  id: string;
  numero: string;
  titulo: string;
  descripcion: string | null;
  tipo: BudgetResponse['tipo'];
  estado: BudgetResponse['estado'];
  fechaCreacion: Date;
  fechaValidez: Date;
  subtotal: number;
  iva: number;
  total: number;
  notas: string | null;
  clienteNombre: string | null;
  proveedorNombre: string | null;
  unidad: { id: string; building: { direccion: string | null } } | null;
  items: Array<{
    id: string;
    concepto: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    total: number;
  }>;
}): BudgetResponse => ({
  id: budget.id,
  numero: budget.numero,
  titulo: budget.titulo,
  descripcion: budget.descripcion || undefined,
  tipo: budget.tipo,
  estado: budget.estado,
  propiedad: budget.unidad
    ? {
        id: budget.unidad.id,
        direccion: budget.unidad.building.direccion || '',
      }
    : undefined,
  cliente: budget.clienteNombre
    ? { id: budget.id, nombre: budget.clienteNombre }
    : undefined,
  proveedor: budget.proveedorNombre
    ? { id: budget.id, nombre: budget.proveedorNombre }
    : undefined,
  fechaCreacion: budget.fechaCreacion.toISOString(),
  fechaValidez: budget.fechaValidez.toISOString(),
  items: budget.items.map((item) => ({
    id: item.id,
    concepto: item.concepto,
    cantidad: Number(item.cantidad),
    unidad: item.unidad,
    precioUnitario: Number(item.precioUnitario),
    total: Number(item.total),
  })),
  subtotal: Number(budget.subtotal),
  iva: Number(budget.iva),
  total: Number(budget.total),
  notas: budget.notas || undefined,
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json({ budgets: [], total: 0, stats: {} });
    }

    const budgets = await prisma.budget.findMany({
      where: { companyId },
      include: {
        items: true,
        unidad: {
          select: {
            id: true,
            building: { select: { direccion: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = budgets.map(mapBudgetResponse);

    const stats = mapped.reduce(
      (acc, budget) => {
        acc.total += 1;
        acc.valorTotal += budget.total;
        if (budget.estado === 'borrador') acc.borradores += 1;
        if (budget.estado === 'enviado') acc.enviados += 1;
        if (budget.estado === 'aprobado') {
          acc.aprobados += 1;
          acc.valorAprobado += budget.total;
        }
        if (budget.estado === 'rechazado') acc.rechazados += 1;
        if (budget.estado === 'facturado') acc.facturados += 1;
        return acc;
      },
      {
        total: 0,
        borradores: 0,
        enviados: 0,
        aprobados: 0,
        rechazados: 0,
        facturados: 0,
        valorTotal: 0,
        valorAprobado: 0,
      }
    );

    return NextResponse.json({
      budgets: mapped,
      total: mapped.length,
      stats,
    });
  } catch (error) {
    logger.error('[API Error] GET /api/budgets:', error);
    return NextResponse.json(
      { error: 'Error al obtener presupuestos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('create');
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = (await request.json()) as BudgetCreateInput;
    const validationResult = budgetCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Datos invalidos', details: errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const ivaRate = Number(data.ivaRate ?? 21);
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.cantidad * item.precioUnitario,
      0
    );
    const ivaAmount = subtotal * (ivaRate / 100);
    const total = subtotal + ivaAmount;
    const validezDias = Number(data.validezDias ?? 30);

    let unidadId: string | undefined;
    if (data.propiedadId) {
      const unit = await prisma.unit.findUnique({
        where: { id: data.propiedadId },
        include: { building: true },
      });
      if (!unit || unit.building.companyId !== companyId) {
        return NextResponse.json(
          { error: 'Propiedad no encontrada' },
          { status: 404 }
        );
      }
      unidadId = unit.id;
    }

    const year = new Date().getFullYear();
    const budgetCount = await prisma.budget.count({ where: { companyId } });
    const budgetNumber = `PRES-${year}-${String(budgetCount + 1).padStart(4, '0')}`;

    const budget = await prisma.budget.create({
      data: {
        companyId,
        numero: budgetNumber,
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        tipo: data.tipo || 'mantenimiento',
        estado: 'borrador',
        fechaCreacion: new Date(),
        fechaValidez: new Date(Date.now() + validezDias * 24 * 60 * 60 * 1000),
        subtotal,
        iva: ivaAmount,
        total,
        notas: data.notas || null,
        clienteNombre: data.clienteNombre || null,
        proveedorNombre: data.proveedorNombre || null,
        unidadId: unidadId || null,
        createdBy: user.id,
        items: {
          create: data.items.map((item) => ({
            concepto: item.concepto,
            cantidad: item.cantidad,
            unidad: item.unidad,
            precioUnitario: item.precioUnitario,
            total: item.cantidad * item.precioUnitario,
          })),
        },
      },
      include: {
        items: true,
        unidad: {
          select: {
            id: true,
            building: { select: { direccion: true } },
          },
        },
      },
    });

    return NextResponse.json(mapBudgetResponse(budget), { status: 201 });
  } catch (error) {
    logger.error('[API Error] POST /api/budgets:', error);
    if (error instanceof Error && error.message?.includes('permiso')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al crear presupuesto' },
      { status: 500 }
    );
  }
}
