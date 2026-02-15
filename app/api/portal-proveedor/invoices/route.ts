import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { requireSession } from '@/lib/api-auth-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/portal-proveedor/invoices
 * Obtiene las facturas del proveedor autenticado
 */
export async function GET(request: NextRequest) {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
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

    // Obtener facturas
    const invoices = await prisma.providerInvoice.findMany({
      where,
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
        payments: {
          orderBy: {
            fechaPago: 'desc',
          },
        },
      },
      orderBy: {
        fechaEmision: 'desc',
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'GET /api/portal-proveedor/invoices',
    });
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal-proveedor/invoices
 * Crea una nueva factura para una orden de trabajo
 */
export async function POST(request: NextRequest) {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;

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
      numeroFactura,
      conceptos, // Array de { descripcion, cantidad, precioUnitario }
      notas,
    } = body;

    // Validar campos requeridos
    if (!workOrderId || !numeroFactura || !conceptos || !Array.isArray(conceptos) || conceptos.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la orden de trabajo existe y pertenece al proveedor
    const workOrder = await prisma.providerWorkOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      );
    }

    if (workOrder.providerId !== providerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para facturar esta orden' },
        { status: 403 }
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

    // Calcular fecha de vencimiento (30 días por defecto)
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

    // Crear la factura
    const invoice = await prisma.providerInvoice.create({
      data: {
        numeroFactura,
        workOrderId,
        providerId,
        companyId: provider.companyId,
        conceptos: conceptos,
        subtotal,
        iva,
        montoIva,
        total,
        estado: 'borrador',
        fechaEmision: new Date(),
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

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'POST /api/portal-proveedor/invoices',
    });
    return NextResponse.json(
      { error: 'Error al crear factura' },
      { status: 500 }
    );
  }
}
