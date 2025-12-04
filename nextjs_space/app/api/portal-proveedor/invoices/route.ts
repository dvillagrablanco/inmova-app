import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireProviderAuth } from '@/lib/provider-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/portal-proveedor/invoices - Obtener facturas del proveedor
export async function GET(req: NextRequest) {
  try {
    const auth = await requireProviderAuth(req);
    if (!auth.authenticated || !auth.provider) {
      return NextResponse.json(
        { error: auth.error || 'No autenticado' },
        { status: auth.status || 401 }
      );
    }

    const invoices = await prisma.providerInvoice.findMany({
      where: {
        providerId: auth.provider.id,
      },
      include: {
        workOrder: {
          select: {
            id: true,
            titulo: true,
          },
        },
        payments: true,
      },
      orderBy: {
        fechaEmision: 'desc',
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    logger.error('Error al obtener facturas:', error);
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    );
  }
}

// POST /api/portal-proveedor/invoices - Crear nueva factura
export async function POST(req: NextRequest) {
  try {
    const auth = await requireProviderAuth(req);
    if (!auth.authenticated || !auth.provider) {
      return NextResponse.json(
        { error: auth.error || 'No autenticado' },
        { status: auth.status || 401 }
      );
    }

    const body = await req.json();
    const {
      workOrderId,
      numeroFactura,
      fechaVencimiento,
      conceptos,
      iva,
      notas,
    } = body;

    // Validaciones
    if (!numeroFactura || !fechaVencimiento || !conceptos || !Array.isArray(conceptos) || conceptos.length === 0) {
      return NextResponse.json(
        { error: 'Datos incompletos. Se requiere número de factura, fecha de vencimiento y al menos un concepto' },
        { status: 400 }
      );
    }

    // Calcular totales
    const subtotal = conceptos.reduce((sum: number, c: any) => sum + (c.total || 0), 0);
    const ivaPercentage = iva || 21.0;
    const montoIva = subtotal * (ivaPercentage / 100);
    const total = subtotal + montoIva;

    // Verificar que el número de factura no exista
    const existingInvoice = await prisma.providerInvoice.findUnique({
      where: {
        companyId_numeroFactura: {
          companyId: auth.provider.companyId,
          numeroFactura,
        },
      },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Ya existe una factura con ese número' },
        { status: 400 }
      );
    }

    // Crear factura
    const invoice = await prisma.providerInvoice.create({
      data: {
        companyId: auth.provider.companyId,
        providerId: auth.provider.id,
        workOrderId,
        numeroFactura,
        fechaEmision: new Date(),
        fechaVencimiento: new Date(fechaVencimiento),
        conceptos,
        subtotal,
        iva: ivaPercentage,
        montoIva,
        total,
        estado: 'borrador',
        notas,
      },
      include: {
        workOrder: true,
      },
    });

    logger.info(
      `Factura ${numeroFactura} creada por proveedor ${auth.provider.nombre}`
    );

    return NextResponse.json({
      success: true,
      message: 'Factura creada exitosamente',
      invoice,
    });
  } catch (error) {
    logger.error('Error al crear factura:', error);
    return NextResponse.json(
      { error: 'Error al crear factura' },
      { status: 500 }
    );
  }
}
