import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/payments/[id]/mark-paid
 * Marca un pago como cobrado con un solo click.
 * Body opcional: { metodoPago?: string, fechaPago?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user?.companyId,
      request,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const paymentId = params.id;

    // Verify the payment exists and belongs to this company
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        contract: {
          unit: {
            building: {
              companyId: scope.activeCompanyId,
            },
          },
        },
      },
      include: {
        contract: {
          include: {
            tenant: { select: { nombreCompleto: true, email: true } },
            unit: { select: { numero: true, building: { select: { nombre: true } } } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    if (payment.estado === 'pagado') {
      return NextResponse.json({ error: 'El pago ya está marcado como pagado' }, { status: 400 });
    }

    // Parse optional body
    let metodoPago = 'transferencia';
    let fechaPago = new Date();
    try {
      const body = await request.json();
      if (body.metodoPago) metodoPago = body.metodoPago;
      if (body.fechaPago) fechaPago = new Date(body.fechaPago);
    } catch {
      // No body provided, use defaults
    }

    // Update payment
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        estado: 'pagado',
        fechaPago: fechaPago,
        metodoPago: metodoPago,
      },
    });

    logger.info('[Payment] Marked as paid', {
      paymentId,
      companyId: scope.activeCompanyId,
      userId: session.user.id,
      monto: payment.monto,
      tenant: payment.contract?.tenant?.nombreCompleto,
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: updated.id,
        estado: updated.estado,
        fechaPago: updated.fechaPago,
        monto: Number(updated.monto),
        inquilino: payment.contract?.tenant?.nombreCompleto,
        unidad: `${payment.contract?.unit?.building?.nombre} - ${payment.contract?.unit?.numero}`,
      },
    });
  } catch (error: any) {
    logger.error('[Payment Mark Paid Error]:', error);
    return NextResponse.json({ error: 'Error al marcar pago como cobrado' }, { status: 500 });
  }
}
