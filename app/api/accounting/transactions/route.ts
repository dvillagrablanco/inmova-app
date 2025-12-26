import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const categoria = searchParams.get('categoria');
    const buildingId = searchParams.get('buildingId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const where: any = {
      companyId: user.companyId,
    };

    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;
    if (buildingId) where.buildingId = buildingId;
    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      };
    }

    const transactions = await prisma.accountingTransaction.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: 500,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Error al obtener transacciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json();

    const transaction = await prisma.accountingTransaction.create({
      data: {
        companyId: user.companyId,
        buildingId: body.buildingId,
        unitId: body.unitId,
        tipo: body.tipo,
        categoria: body.categoria,
        concepto: body.concepto,
        monto: parseFloat(body.monto),
        fecha: new Date(body.fecha),
        referencia: body.referencia,
        notas: body.notas,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    logger.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Error al crear transacción' }, { status: 500 });
  }
}
