import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
interface Params {
  params: Promise<{ id: string }>;
}
/**
 * GET /api/admin-fincas/invoices/[id]
 * Obtiene una factura específica
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const invoice = await prisma.communityInvoice.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        community: true,
      },
    });
    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (error) {
    logger.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Error al obtener factura' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin-fincas/invoices/[id]
 * Actualiza una factura
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    // Verificar que la factura existe y pertenece a la compañía
    const existing = await prisma.communityInvoice.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    const invoice = await prisma.communityInvoice.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(invoice);
  } catch (error) {
    logger.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Error al actualizar factura' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin-fincas/invoices/[id]
 * Elimina una factura (solo si está en borrador)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.communityInvoice.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Solo permitir eliminar facturas en borrador
    if (existing.estado !== 'borrador') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar facturas en borrador' },
        { status: 400 }
      );
    }

    await prisma.communityInvoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Error al eliminar factura' }, { status: 500 });
  }
}
