import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireProviderAuth } from '@/lib/provider-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST /api/portal-proveedor/invoices/[id]/submit - Enviar factura (cambiar de borrador a enviada)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireProviderAuth(req);
    if (!auth.authenticated || !auth.provider) {
      return NextResponse.json(
        { error: auth.error || 'No autenticado' },
        { status: auth.status || 401 }
      );
    }

    const invoice = await prisma.providerInvoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    if (invoice.providerId !== auth.provider.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para enviar esta factura' },
        { status: 403 }
      );
    }

    if (invoice.estado !== 'borrador') {
      return NextResponse.json(
        { error: 'Solo se pueden enviar facturas en estado borrador' },
        { status: 400 }
      );
    }

    const updatedInvoice = await prisma.providerInvoice.update({
      where: { id: params.id },
      data: { estado: 'enviada' },
    });

    logger.info(`Factura ${invoice.numeroFactura} enviada por proveedor ${auth.provider.nombre}`);

    // TODO: Enviar notificación al gestor/administrador

    return NextResponse.json({
      success: true,
      message: 'Factura enviada exitosamente',
      invoice: updatedInvoice,
    });
  } catch (error) {
    logger.error('Error al enviar factura:', error);
    return NextResponse.json({ error: 'Error al enviar factura' }, { status: 500 });
  }
}
