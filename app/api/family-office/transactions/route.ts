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

const createTransactionSchema = z.object({
  accountId: z.string().min(1, 'accountId requerido'),
  positionId: z.string().optional(),
  tipo: z.enum([
    'compra',
    'venta',
    'dividendo',
    'cupon',
    'comision',
    'transferencia_entrada',
    'transferencia_salida',
    'aportacion',
    'reembolso',
    'interes',
  ]),
  fecha: z.string().transform((s) => new Date(s)),
  concepto: z.string().min(1, 'Concepto requerido'),
  importe: z.number(),
  cantidad: z.number().optional(),
  precio: z.number().optional(),
  comision: z.number().optional(),
});

/**
 * GET /api/family-office/transactions
 * List FinancialTransaction for user's company. Supports filters: accountId, tipo, from, to.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const tipo = searchParams.get('tipo');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const prisma = await getPrisma();

    const where: any = {
      account: { companyId: session.user.companyId },
    };

    if (accountId) {
      where.accountId = accountId;
    }
    if (tipo) {
      where.tipo = tipo;
    }
    if (from || to) {
      where.fecha = {};
      if (from) where.fecha.gte = new Date(from);
      if (to) where.fecha.lte = new Date(to);
    }

    const transactions = await prisma.financialTransaction.findMany({
      where,
      include: {
        account: { select: { id: true, entidad: true, alias: true } },
        position: { select: { id: true, nombre: true, isin: true } },
      },
      orderBy: { fecha: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    logger.error('[Family Office Transactions GET]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo transacciones' }, { status: 500 });
  }
}

/**
 * POST /api/family-office/transactions
 * Create a new FinancialTransaction.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTransactionSchema.parse(body);

    const prisma = await getPrisma();

    // Verify the account belongs to the user's company
    const account = await prisma.financialAccount.findFirst({
      where: {
        id: validated.accountId,
        companyId: session.user.companyId,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada o sin acceso' }, { status: 404 });
    }

    // If positionId provided, verify it belongs to the same account
    if (validated.positionId) {
      const position = await prisma.financialPosition.findFirst({
        where: {
          id: validated.positionId,
          accountId: validated.accountId,
        },
      });
      if (!position) {
        return NextResponse.json(
          { error: 'Posición no encontrada en esta cuenta' },
          { status: 404 }
        );
      }
    }

    const transaction = await prisma.financialTransaction.create({
      data: {
        accountId: validated.accountId,
        positionId: validated.positionId,
        tipo: validated.tipo,
        fecha: validated.fecha,
        concepto: validated.concepto,
        importe: validated.importe,
        cantidad: validated.cantidad,
        precio: validated.precio,
        comision: validated.comision,
      },
    });

    logger.info('[Family Office] Transacción creada', {
      transactionId: transaction.id,
      accountId: validated.accountId,
      companyId: session.user.companyId,
    });

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Family Office Transactions POST]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error creando transacción' }, { status: 500 });
  }
}
