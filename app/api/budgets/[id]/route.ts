import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  tipo: string;
  estado: string;
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
  tipo: string;
  estado: string;
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
  cliente: budget.clienteNombre ? { id: budget.id, nombre: budget.clienteNombre } : undefined,
  proveedor: budget.proveedorNombre ? { id: budget.id, nombre: budget.proveedorNombre } : undefined,
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const budget = await prisma.budget.findFirst({
      where: { id: params.id, companyId },
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

    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(mapBudgetResponse(budget));
  } catch (error) {
    logger.error('[API Error] GET /api/budgets/[id]:', error);
    return NextResponse.json({ error: 'Error al obtener presupuesto' }, { status: 500 });
  }
}
