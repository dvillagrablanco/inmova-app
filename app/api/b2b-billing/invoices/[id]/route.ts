/**
 * API para gestión de factura individual
 * GET: Obtener detalle de factura
 * PUT: Actualizar factura
 * DELETE: Cancelar factura
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const invoice = await prisma.b2BInvoice.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        subscriptionPlan: true,
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Verificar permisos
    if (user?.role !== 'super_admin' && invoice.companyId !== user?.companyId) {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    // Obtener historial de pagos relacionados
    const payments = await prisma.b2BPaymentHistory.findMany({
      where: { invoiceId: params.id },
      orderBy: { fechaPago: 'desc' },
    });

    return NextResponse.json({
      ...invoice,
      payments,
    });
  } catch (error: any) {
    logger.error('Error al obtener factura:', error);
    return NextResponse.json(
      { error: 'Error al obtener factura', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Solo super-admins pueden modificar facturas
    if (user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { notas, terminosPago, fechaVencimiento } = body;

    const invoice = await prisma.b2BInvoice.update({
      where: { id: params.id },
      data: {
        notas,
        terminosPago,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
      },
      include: {
        company: true,
        subscriptionPlan: true,
      }
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    logger.error('Error al actualizar factura:', error);
    return NextResponse.json(
      { error: 'Error al actualizar factura', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Solo super-admins pueden cancelar facturas
    if (user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    const invoice = await prisma.b2BInvoice.update({
      where: { id: params.id },
      data: {
        estado: 'CANCELADA',
      }
    });

    return NextResponse.json({ message: 'Factura cancelada', invoice });
  } catch (error: any) {
    logger.error('Error al cancelar factura:', error);
    return NextResponse.json(
      { error: 'Error al cancelar factura', details: error.message },
      { status: 500 }
    );
  }
}
