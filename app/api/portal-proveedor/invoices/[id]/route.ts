import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal-proveedor/invoices/[id]
 * Obtiene los detalles de una factura específica
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const providerId = request.headers.get('x-provider-id');

    if (!providerId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const invoice = await prisma.providerInvoice.findUnique({
      where: { id: params.id },
      include: {
        workOrder: {
          select: {
            id: true,
            titulo: true,
            descripcion: true,
            building: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
              },
            },
          },
        },
        payments: {
          orderBy: {
            fechaPago: 'desc',
          },
        },
        provider: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            tipo: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Verificar que la factura pertenece al proveedor
    if (invoice.providerId !== providerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta factura' },
        { status: 403 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'GET /api/portal-proveedor/invoices/[id]',
    });
    return NextResponse.json({ error: 'Error al obtener factura' }, { status: 500 });
  }
}

/**
 * PATCH /api/portal-proveedor/invoices/[id]
 * Actualiza una factura (enviarla, por ejemplo)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const providerId = request.headers.get('x-provider-id');

    if (!providerId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que la factura existe y pertenece al proveedor
    const invoice = await prisma.providerInvoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    if (invoice.providerId !== providerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta factura' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { estado, notas } = body;

    // Validar transición de estados
    if (estado && estado !== 'enviada' && invoice.estado === 'borrador') {
      return NextResponse.json(
        { error: 'Solo puedes enviar facturas en borrador' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (estado === 'enviada' && invoice.estado === 'borrador') {
      updateData.estado = 'enviada';
      updateData.fechaEnvio = new Date();
    }

    if (notas !== undefined) {
      updateData.notas = notas;
    }

    const updatedInvoice = await prisma.providerInvoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        workOrder: {
          select: {
            id: true,
            titulo: true,
            building: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'PATCH /api/portal-proveedor/invoices/[id]',
    });
    return NextResponse.json({ error: 'Error al actualizar factura' }, { status: 500 });
  }
}
