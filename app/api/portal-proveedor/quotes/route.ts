import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/portal-proveedor/quotes
 * Obtiene los presupuestos del proveedor autenticado
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const providerId = request.headers.get('x-provider-id');

    if (!providerId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el proveedor existe
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { companyId: true },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Obtener filtros de query params
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const workOrderId = searchParams.get('workOrderId');

    // Construir filtros
    const where: any = {
      providerId,
      companyId: provider.companyId,
    };

    if (estado) {
      where.estado = estado;
    }

    if (workOrderId) {
      where.workOrderId = workOrderId;
    }

    // Obtener presupuestos
    const quotes = await prisma.providerQuote.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'GET /api/portal-proveedor/quotes',
    });
    return NextResponse.json(
      { error: 'Error al obtener presupuestos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal-proveedor/quotes
 * Crea un nuevo presupuesto para una orden de trabajo
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const providerId = request.headers.get('x-provider-id');

    if (!providerId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el proveedor existe
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { companyId: true },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      workOrderId,
      titulo,
      descripcion,
      conceptos, // Array de { descripcion, cantidad, precioUnitario }
      validezDias,
      notas,
    } = body;

    // Validar campos requeridos
    if (!workOrderId || !titulo || !conceptos || !Array.isArray(conceptos) || conceptos.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la orden de trabajo existe
    const workOrder = await prisma.providerWorkOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      );
    }

    // Calcular subtotal, IVA y total
    const subtotal = conceptos.reduce(
      (sum: number, item: any) => sum + (item.cantidad * item.precioUnitario),
      0
    );
    const iva = 21.0; // 21% IVA
    const montoIva = subtotal * (iva / 100);
    const total = subtotal + montoIva;

    // Calcular fecha de vencimiento
    const fechaVencimiento = new Date();
    if (validezDias) {
      fechaVencimiento.setDate(fechaVencimiento.getDate() + parseInt(validezDias));
    } else {
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30); // 30 días por defecto
    }

    // Crear el presupuesto
    const quote = await prisma.providerQuote.create({
      data: {
        workOrderId,
        providerId,
        companyId: provider.companyId,
        titulo,
        descripcion: descripcion || '',
        conceptos: conceptos,
        subtotal,
        iva,
        montoIva,
        total,
        estado: 'pendiente',
        fechaVencimiento,
        notas,
      },
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

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'POST /api/portal-proveedor/quotes',
    });
    return NextResponse.json(
      { error: 'Error al crear presupuesto' },
      { status: 500 }
    );
  }
}
