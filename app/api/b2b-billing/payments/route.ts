/**
 * API para registro de pagos B2B
 * POST: Registrar pago de factura
 * GET: Obtener historial de pagos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { registerInvoicePayment } from '@/lib/b2b-billing-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Solo super-admins pueden registrar pagos
    if (user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      invoiceId, 
      monto, 
      metodoPago, 
      referencia,
      stripePaymentId,
      stripeChargeId,
      stripeFee,
    } = body;

    if (!invoiceId || !monto || !metodoPago) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const result = await registerInvoicePayment(invoiceId, {
      monto,
      metodoPago,
      referencia,
      stripePaymentId,
      stripeChargeId,
      stripeFee,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    logger.error('Error al registrar pago:', error);
    return NextResponse.json(
      { error: 'Error al registrar pago', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const isSuperAdmin = user?.role === 'super_admin';
    
    const where: any = {};
    
    if (!isSuperAdmin) {
      where.companyId = user?.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    }

    const [payments, total] = await Promise.all([
      prisma.b2BPaymentHistory.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              nombre: true,
            }
          },
        },
        orderBy: {
          fechaPago: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.b2BPaymentHistory.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    logger.error('Error al obtener pagos:', error);
    return NextResponse.json(
      { error: 'Error al obtener pagos', details: error.message },
      { status: 500 }
    );
  }
}
