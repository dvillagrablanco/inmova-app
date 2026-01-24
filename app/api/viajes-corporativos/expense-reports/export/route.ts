import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const parsePeriod = (period: string | null) => {
  if (!period) return null;
  const [year, month] = period.split('-').map(Number);
  if (Number.isNaN(year) || Number.isNaN(month)) return null;
  return { year, month };
};

const escapeCsv = (value: string) => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period');
    const formatParam = (searchParams.get('format') || 'csv').toLowerCase();
    const format = formatParam === 'excel' ? 'csv' : formatParam;

    const parsed = parsePeriod(periodParam);
    if (!parsed) {
      return NextResponse.json({ error: 'Periodo invalido' }, { status: 400 });
    }

    const periodStart = new Date(Date.UTC(parsed.year, parsed.month - 1, 1));
    const periodEnd = new Date(Date.UTC(parsed.year, parsed.month, 1));

    const expenses = await prisma.corporateTravelExpense.findMany({
      where: {
        companyId,
        fechaGasto: { gte: periodStart, lt: periodEnd },
      },
      include: { tenant: true },
      orderBy: { fechaGasto: 'desc' },
    });

    if (format === 'json') {
      return NextResponse.json({ data: expenses });
    }

    if (format !== 'csv') {
      return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 });
    }

    const header = [
      'id',
      'empleado',
      'departamento',
      'categoria',
      'concepto',
      'monto',
      'estado',
      'fechaGasto',
    ];

    const rows = expenses.map((expense) => [
      expense.id,
      expense.tenant?.nombreCompleto || '',
      expense.departamento || '',
      expense.categoria,
      expense.concepto,
      expense.monto.toString(),
      expense.estado,
      expense.fechaGasto.toISOString(),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => escapeCsv(String(value))).join(','))
      .join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="viajes_${periodParam}.csv"`,
      },
    });
  } catch (error) {
    logger.error('[Viajes Corporativos] Error exportando reportes', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al exportar reportes' }, { status: 500 });
  }
}
