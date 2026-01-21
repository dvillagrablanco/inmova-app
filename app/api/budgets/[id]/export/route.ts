import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const escapeCsv = (value: string) => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const budget = await prisma.budget.findFirst({
      where: { id: params.id, companyId },
      include: { items: true },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    const header = ['concepto', 'cantidad', 'unidad', 'precio_unitario', 'total'];
    const rows = budget.items.map((item) => [
      item.concepto,
      item.cantidad.toString(),
      item.unidad,
      item.precioUnitario.toString(),
      item.total.toString(),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => escapeCsv(String(value))).join(','))
      .join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="presupuesto_${budget.numero}.csv"`,
      },
    });
  } catch (error) {
    logger.error('[API Error] GET /api/budgets/[id]/export:', error);
    return NextResponse.json({ error: 'Error al exportar presupuesto' }, { status: 500 });
  }
}
