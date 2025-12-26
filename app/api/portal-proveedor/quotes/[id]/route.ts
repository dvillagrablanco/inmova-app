import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal-proveedor/quotes/[id]
 * Obtiene los detalles de un presupuesto específico
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const providerId = request.headers.get('x-provider-id');

    if (!providerId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const quote = await prisma.providerQuote.findUnique({
      where: { id: params.id },
      include: {
        workOrder: {
          select: {
            id: true,
            titulo: true,
            descripcion: true,
            prioridad: true,
            building: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
              },
            },
            unit: {
              select: {
                id: true,
                numero: true,
              },
            },
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

    if (!quote) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    // Verificar que el presupuesto pertenece al proveedor
    if (quote.providerId !== providerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este presupuesto' },
        { status: 403 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'GET /api/portal-proveedor/quotes/[id]',
    });
    return NextResponse.json({ error: 'Error al obtener presupuesto' }, { status: 500 });
  }
}

/**
 * PATCH /api/portal-proveedor/quotes/[id]
 * Actualiza un presupuesto (editar, enviar, retirar)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const providerId = request.headers.get('x-provider-id');

    if (!providerId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que el presupuesto existe y pertenece al proveedor
    const quote = await prisma.providerQuote.findUnique({
      where: { id: params.id },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    if (quote.providerId !== providerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este presupuesto' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { conceptos, notas, tiempoEjecucion, condicionesPago } = body;

    const updateData: any = {};

    // Si se actualizan conceptos, recalcular totales
    if (conceptos && Array.isArray(conceptos)) {
      const subtotal = conceptos.reduce(
        (sum: number, item: any) => sum + item.cantidad * item.precioUnitario,
        0
      );
      const iva = subtotal * 0.21;
      const total = subtotal + iva;

      updateData.conceptos = conceptos;
      updateData.subtotal = subtotal;
      updateData.iva = iva;
      updateData.total = total;
    }

    if (notas !== undefined) {
      updateData.notas = notas;
    }

    if (tiempoEjecucion !== undefined) {
      updateData.tiempoEjecucion = tiempoEjecucion;
    }

    if (condicionesPago !== undefined) {
      updateData.condicionesPago = condicionesPago;
    }

    const updatedQuote = await prisma.providerQuote.update({
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
      },
    });

    return NextResponse.json(updatedQuote);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'PATCH /api/portal-proveedor/quotes/[id]',
    });
    return NextResponse.json({ error: 'Error al actualizar presupuesto' }, { status: 500 });
  }
}
