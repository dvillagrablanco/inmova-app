import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireProviderAuth } from '@/lib/provider-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/portal-proveedor/invoices/[id] - Obtener factura específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      include: {
        provider: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            direccion: true,
          },
        },
        company: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            email: true,
            telefono: true,
          },
        },
        workOrder: true,
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    if (invoice.providerId !== auth.provider.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver esta factura' },
        { status: 403 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    logger.error('Error al obtener factura:', error);
    return NextResponse.json(
      { error: 'Error al obtener factura' },
      { status: 500 }
    );
  }
}

// PATCH /api/portal-proveedor/invoices/[id] - Actualizar factura
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    if (invoice.providerId !== auth.provider.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar esta factura' },
        { status: 403 }
      );
    }

    // Solo permitir actualizar facturas en estado borrador
    if (invoice.estado !== 'borrador') {
      return NextResponse.json(
        { error: 'Solo se pueden modificar facturas en estado borrador' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { conceptos, fechaVencimiento, notas, iva } = body;

    let updateData: any = {};

    if (fechaVencimiento) {
      updateData.fechaVencimiento = new Date(fechaVencimiento);
    }

    if (notas !== undefined) {
      updateData.notas = notas;
    }

    if (conceptos && Array.isArray(conceptos)) {
      const subtotal = conceptos.reduce((sum: number, c: any) => sum + (c.total || 0), 0);
      const ivaPercentage = iva || invoice.iva;
      const montoIva = subtotal * (ivaPercentage / 100);
      const total = subtotal + montoIva;

      updateData = {
        ...updateData,
        conceptos,
        subtotal,
        iva: ivaPercentage,
        montoIva,
        total,
      };
    }

    const updatedInvoice = await prisma.providerInvoice.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Factura actualizada exitosamente',
      invoice: updatedInvoice,
    });
  } catch (error) {
    logger.error('Error al actualizar factura:', error);
    return NextResponse.json(
      { error: 'Error al actualizar factura' },
      { status: 500 }
    );
  }
}
