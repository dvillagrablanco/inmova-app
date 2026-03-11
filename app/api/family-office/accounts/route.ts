import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { resolveFamilyOfficeScope } from '@/lib/family-office-scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const createAccountSchema = z.object({
  entidad: z.string().min(1, 'Entidad requerida'),
  tipoEntidad: z.enum([
    'banca_privada',
    'gestora_fondos',
    'custodio',
    'banca_comercial',
    'broker',
    'aseguradora',
    'otro_financiero',
  ]),
  numeroCuenta: z.string().optional(),
  alias: z.string().optional(),
  divisa: z.string().default('EUR'),
  conexionTipo: z.string().default('manual'),
});

/**
 * GET /api/family-office/accounts
 * List all FinancialAccount for the user's company, including positions count and total value.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const scope = await resolveFamilyOfficeScope(request, {
      id: session.user.id,
      role: session.user.role,
      companyId: session.user.companyId,
    });

    const accounts = await prisma.financialAccount.findMany({
      where: { companyId: { in: scope.groupCompanyIds } },
      include: {
        _count: { select: { positions: true, transactions: true } },
        positions: {
          select: { valorActual: true, pnlNoRealizado: true },
        },
      },
      orderBy: { entidad: 'asc' },
    });

    const data = accounts.map((acc: any) => {
      const totalValor = acc.positions.reduce(
        (sum: number, p: any) => sum + (p.valorActual || 0),
        0
      );
      const totalPnl = acc.positions.reduce(
        (sum: number, p: any) => sum + (p.pnlNoRealizado || 0),
        0
      );
      const { positions, ...rest } = acc;
      return {
        ...rest,
        totalValor: Math.round(totalValor * 100) / 100,
        totalPnl: Math.round(totalPnl * 100) / 100,
        positionsCount: acc._count.positions,
        transactionsCount: acc._count.transactions,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    logger.error('[Family Office Accounts GET]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo cuentas' }, { status: 500 });
  }
}

/**
 * POST /api/family-office/accounts
 * Create a new FinancialAccount.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createAccountSchema.parse(body);

    const prisma = await getPrisma();

    const account = await prisma.financialAccount.create({
      data: {
        companyId: session.user.companyId,
        entidad: validated.entidad,
        tipoEntidad: validated.tipoEntidad,
        numeroCuenta: validated.numeroCuenta,
        alias: validated.alias,
        divisa: validated.divisa,
        conexionTipo: validated.conexionTipo,
      },
    });

    logger.info('[Family Office] Cuenta creada', {
      accountId: account.id,
      companyId: session.user.companyId,
    });

    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Family Office Accounts POST]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error creando cuenta' }, { status: 500 });
  }
}
