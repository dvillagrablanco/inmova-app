/**
 * API para gestión de facturas B2B
 * GET: Listar facturas
 * POST: Crear factura manual
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createB2BInvoice, generateMonthlyInvoices } from '@/lib/b2b-billing-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const estado = searchParams.get('estado') as string | null;
    const periodo = searchParams.get('periodo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Solo super-admins pueden ver todas las facturas
    const isSuperAdmin = user?.role === 'super_admin';
    
    // Construir filtros
    const where: any = {};
    
    if (!isSuperAdmin) {
      // Los usuarios normales solo ven facturas de su empresa
      where.companyId = user?.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (periodo) {
      where.periodo = periodo;
    }

    const [invoices, total] = await Promise.all([
      prisma.b2BInvoice.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              nombre: true,
              email: true,
            }
          },
          subscriptionPlan: {
            select: {
              id: true,
              nombre: true,
              tier: true,
            }
          },
        },
        orderBy: {
          fechaEmision: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.b2BInvoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    logger.error('Error al obtener facturas:', error);
    return NextResponse.json(
      { error: 'Error al obtener facturas', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Solo super-admins pueden crear facturas manualmente
    if (user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // Acción especial: generar facturas mensuales automáticas
    if (action === 'generate-monthly') {
      const { periodo } = body;
      const results = await generateMonthlyInvoices(periodo);
      return NextResponse.json(results);
    }

    // Crear factura manual simplificada
    if (action === 'create-manual') {
      const { companyId, concepto, subtotal, descuento, impuestos, total, notas, fechaVencimiento } = body;

      if (!companyId || !concepto || !subtotal) {
        return NextResponse.json(
          { error: 'Empresa, concepto y subtotal son obligatorios' },
          { status: 400 }
        );
      }

      // Generar número de factura
      const lastInvoice = await prisma.b2BInvoice.findFirst({
        orderBy: { numeroFactura: 'desc' },
        select: { numeroFactura: true },
      });

      const currentYear = new Date().getFullYear();
      let nextNumber = 1;
      if (lastInvoice?.numeroFactura) {
        const match = lastInvoice.numeroFactura.match(/INM-(\d+)-(\d+)/);
        if (match && parseInt(match[1]) === currentYear) {
          nextNumber = parseInt(match[2]) + 1;
        }
      }
      const numeroFactura = `INM-${currentYear}-${String(nextNumber).padStart(5, '0')}`;

      const fechaEmision = new Date();
      const vencimiento = fechaVencimiento 
        ? new Date(fechaVencimiento) 
        : new Date(fechaEmision.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días por defecto

      const periodo = `${fechaEmision.getFullYear()}-${String(fechaEmision.getMonth() + 1).padStart(2, '0')}`;

      const invoice = await prisma.b2BInvoice.create({
        data: {
          numeroFactura,
          companyId,
          periodo,
          subtotal: parseFloat(subtotal),
          descuento: parseFloat(descuento || '0'),
          impuestos: parseFloat(impuestos || '0'),
          total: parseFloat(total || subtotal),
          estado: 'PENDIENTE',
          fechaEmision,
          fechaVencimiento: vencimiento,
          notas: notas || concepto,
          conceptos: [{ descripcion: concepto, cantidad: 1, precioUnitario: parseFloat(subtotal) }],
        },
        include: {
          company: {
            select: { id: true, nombre: true, email: true },
          },
        },
      });

      logger.info(`Factura manual creada: ${numeroFactura} para ${invoice.company.nombre}`);
      return NextResponse.json(invoice, { status: 201 });
    }

    // Crear factura con conceptos (formato legacy)
    const { companyId, periodo, subscriptionPlanId, conceptos, descuento, notas } = body;

    if (!companyId || !periodo || !conceptos || conceptos.length === 0) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const invoice = await createB2BInvoice({
      companyId,
      periodo,
      subscriptionPlanId,
      conceptos,
      descuento,
      notas,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    logger.error('Error al crear factura:', error);
    return NextResponse.json(
      { error: 'Error al crear factura', details: error.message },
      { status: 500 }
    );
  }
}
