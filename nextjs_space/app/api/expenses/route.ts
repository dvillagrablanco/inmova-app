import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get('buildingId');
  const unitId = searchParams.get('unitId');
  const categoria = searchParams.get('categoria');
  const fechaDesde = searchParams.get('fechaDesde');
  const fechaHasta = searchParams.get('fechaHasta');

  try {
    const where: any = {};
    if (buildingId) where.buildingId = buildingId;
    if (unitId) where.unitId = unitId;
    if (categoria) where.categoria = categoria;
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        building: { select: { nombre: true } },
        unit: { select: { numero: true } },
        provider: { select: { nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Error al obtener gastos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { buildingId, unitId, providerId, concepto, categoria, monto, fecha, facturaPdfPath, notas } = body;

    if (!concepto || !categoria || !monto || !fecha) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        buildingId: buildingId || null,
        unitId: unitId || null,
        providerId: providerId || null,
        concepto,
        categoria,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
        facturaPdfPath: facturaPdfPath || null,
        notas: notas || null,
      },
      include: {
        building: { select: { nombre: true } },
        unit: { select: { numero: true } },
        provider: { select: { nombre: true } },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Error al crear gasto' }, { status: 500 });
  }
}