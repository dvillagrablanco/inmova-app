import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const contractId = searchParams.get('contractId');

    const where: any = {};
    if (estado) where.estado = estado;
    if (contractId) where.contractId = contractId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        contract: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
            tenant: true,
          },
        },
      },
      orderBy: { fechaVencimiento: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    logger.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { contractId, periodo, monto, fechaVencimiento, fechaPago, estado, metodoPago, nivelRiesgo } = body;

    if (!contractId || !periodo || !monto || !fechaVencimiento) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        contractId,
        periodo,
        monto: parseFloat(monto),
        fechaVencimiento: new Date(fechaVencimiento),
        fechaPago: fechaPago ? new Date(fechaPago) : null,
        estado: estado || 'pendiente',
        metodoPago,
        nivelRiesgo: nivelRiesgo || 'bajo',
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    logger.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 });
  }
}
