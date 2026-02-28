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

const createPositionSchema = z.object({
  accountId: z.string().min(1, 'accountId requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  isin: z.string().optional(),
  tipo: z.enum([
    'fondo_inversion',
    'sicav',
    'accion',
    'bono',
    'etf',
    'deposito',
    'cuenta_corriente',
    'plan_pensiones',
    'seguro_vida',
    'pe_fund',
    'real_estate_fund',
    'derivado',
    'divisa',
    'cripto',
    'otro_instrumento',
  ]),
  cantidad: z.number().default(0),
  precioMedio: z.number().default(0),
  valorActual: z.number().default(0),
});

/**
 * GET /api/family-office/positions
 * List all FinancialPosition for the user's company (via account.companyId).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = await getPrisma();

    const positions = await prisma.financialPosition.findMany({
      where: {
        account: { companyId: session.user.companyId },
      },
      include: {
        account: {
          select: { id: true, entidad: true, alias: true, divisa: true },
        },
      },
      orderBy: { valorActual: 'desc' },
    });

    return NextResponse.json({ success: true, data: positions });
  } catch (error: any) {
    logger.error('[Family Office Positions GET]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo posiciones' }, { status: 500 });
  }
}

/**
 * POST /api/family-office/positions
 * Create a new FinancialPosition.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createPositionSchema.parse(body);

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

    const costeTotal = validated.cantidad * validated.precioMedio;
    const pnlNoRealizado = validated.valorActual - costeTotal;
    const pnlPct = costeTotal > 0 ? (pnlNoRealizado / costeTotal) * 100 : 0;

    const position = await prisma.financialPosition.create({
      data: {
        accountId: validated.accountId,
        nombre: validated.nombre,
        isin: validated.isin,
        tipo: validated.tipo,
        cantidad: validated.cantidad,
        precioMedio: validated.precioMedio,
        valorActual: validated.valorActual,
        costeTotal: Math.round(costeTotal * 100) / 100,
        pnlNoRealizado: Math.round(pnlNoRealizado * 100) / 100,
        pnlPct: Math.round(pnlPct * 100) / 100,
      },
    });

    logger.info('[Family Office] Posición creada', {
      positionId: position.id,
      accountId: validated.accountId,
      companyId: session.user.companyId,
    });

    return NextResponse.json({ success: true, data: position }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Family Office Positions POST]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error creando posición' }, { status: 500 });
  }
}
