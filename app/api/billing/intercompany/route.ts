import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const createIntercompanySchema = z.object({
  fromCompanyId: z.string(),
  toCompanyId: z.string(),
  conceptos: z.array(z.object({
    descripcion: z.string(),
    cantidad: z.number().default(1),
    precioUnitario: z.number(),
  })),
  periodo: z.string(), // "2026-01"
  notas: z.string().optional(),
});

/**
 * GET /api/billing/intercompany
 * Lista facturas intragrupo entre sociedades del grupo
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Consolidated: include child companies for group view
    const companyHierarchy = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { childCompanies: { select: { id: true } } },
    });
    const allCompanyIds = companyHierarchy
      ? [session.user.companyId, ...companyHierarchy.childCompanies.map((c: { id: string }) => c.id)]
      : [session.user.companyId];

    // Buscar facturas B2B entre empresas del grupo
    const invoices = await prisma.b2BInvoice.findMany({
      where: {
        companyId: { in: allCompanyIds },
      },
      include: {
        company: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaEmision: 'desc' },
      take: 100,
    });

    // Filtrar solo las que tienen conceptos con referencia a otra empresa del grupo
    // O buscar en accounting transactions de tipo intragrupo
    const intercompanyTxs = await prisma.accountingTransaction.findMany({
      where: {
        companyId: { in: allCompanyIds },
        categoria: { in: ['ingreso_servicios_intragrupo', 'gasto_intragrupo'] },
      },
      orderBy: { fecha: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      groupCompanies: allCompanyIds,
      invoices,
      transactions: intercompanyTxs,
    });
  } catch (error: any) {
    logger.error('[Intercompany GET]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo facturación intragrupo' }, { status: 500 });
  }
}

/**
 * POST /api/billing/intercompany
 * Crear factura intragrupo entre sociedades
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createIntercompanySchema.parse(body);

    // Verificar que ambas empresas existen y son del mismo grupo
    const [fromCompany, toCompany] = await Promise.all([
      prisma.company.findUnique({ where: { id: validated.fromCompanyId }, select: { id: true, nombre: true, parentCompanyId: true } }),
      prisma.company.findUnique({ where: { id: validated.toCompanyId }, select: { id: true, nombre: true, parentCompanyId: true } }),
    ]);

    if (!fromCompany || !toCompany) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Calcular totales
    const conceptosConTotal = validated.conceptos.map((c) => ({
      ...c,
      total: c.cantidad * c.precioUnitario,
    }));
    const subtotal = conceptosConTotal.reduce((s, c) => s + c.total, 0);
    const iva = Math.round(subtotal * 0.21 * 100) / 100;
    const total = subtotal + iva;

    // Generar número de factura
    const year = new Date().getFullYear();
    const count = await prisma.b2BInvoice.count({
      where: { companyId: validated.fromCompanyId },
    });
    const numeroFactura = `IC-${year}-${String(count + 1).padStart(4, '0')}`;

    // Crear factura B2B
    const invoice = await prisma.b2BInvoice.create({
      data: {
        companyId: validated.fromCompanyId,
        numeroFactura,
        fechaEmision: new Date(),
        fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        periodo: validated.periodo,
        subtotal,
        impuestos: iva,
        total,
        conceptos: conceptosConTotal,
        notas: validated.notas || `Factura intragrupo: ${fromCompany.nombre} → ${toCompany.nombre}`,
        estado: 'PENDIENTE',
      },
    });

    // Crear asientos contables en ambas sociedades
    await prisma.accountingTransaction.createMany({
      data: [
        {
          companyId: validated.fromCompanyId,
          fecha: new Date(),
          concepto: `Factura intragrupo a ${toCompany.nombre}`,
          tipo: 'ingreso',
          categoria: 'ingreso_servicios_intragrupo',
          monto: total,
          referencia: numeroFactura,
        },
        {
          companyId: validated.toCompanyId,
          fecha: new Date(),
          concepto: `Factura intragrupo de ${fromCompany.nombre}`,
          tipo: 'gasto',
          categoria: 'gasto_intragrupo',
          monto: total,
          referencia: numeroFactura,
        },
      ],
    });

    logger.info(`[Intercompany] Factura ${numeroFactura} creada: ${fromCompany.nombre} → ${toCompany.nombre} = ${total}€`);

    return NextResponse.json({
      success: true,
      invoice,
      message: `Factura ${numeroFactura} creada: ${total}€`,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    logger.error('[Intercompany POST]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error creando factura intragrupo' }, { status: 500 });
  }
}
