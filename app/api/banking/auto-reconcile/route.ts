import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

function parseDate(s: string): Date | null {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function daysDiff(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function computeScore(
  movementAmount: number,
  movementDate: Date,
  paymentAmount: number,
  paymentDate: Date
): number {
  const amountTolerance = 0.05;
  const dateToleranceDays = 3;

  const amountDiff = Math.abs(movementAmount - paymentAmount);
  const amountOk = paymentAmount === 0 ? amountDiff < 0.02 : amountDiff / paymentAmount <= amountTolerance;
  const amountExact = Math.abs(movementAmount - paymentAmount) < 0.02;

  const days = daysDiff(movementDate, paymentDate);
  const dateOk = days <= dateToleranceDays;
  const dateExact = days === 0;

  if (amountExact && dateExact) return 100;
  if (amountOk && dateOk) {
    const denom = Math.max(paymentAmount * amountTolerance, 0.01);
    const amountScore = amountExact ? 50 : Math.max(0, 50 * (1 - amountDiff / denom));
    const dateScore = dateExact ? 50 : Math.max(0, 50 * (1 - days / dateToleranceDays));
    return Math.round(amountScore + dateScore);
  }
  return 0;
}

/**
 * POST /api/banking/auto-reconcile
 * Auto-reconciliation: match bank movements to pending payments.
 * Body: { movements: Array<{ fecha: string, concepto: string, importe: number }> }
 * Returns matches with score; autoMatched: true when score > 90%.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user?.companyId,
      request,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const body = await request.json();
    const movements = body?.movements;
    if (!Array.isArray(movements)) {
      return NextResponse.json({ error: 'movements debe ser un array' }, { status: 400 });
    }

    const prisma = await getPrisma();
    const scopeCompanyIds = scope.scopeCompanyIds?.length ? scope.scopeCompanyIds : [scope.activeCompanyId];

    const pendingPayments = await prisma.payment.findMany({
      where: {
        contract: { unit: { building: { companyId: { in: scopeCompanyIds } } } },
        estado: { in: ['pendiente', 'atrasado'] },
      },
      include: {
        contract: {
          include: {
            tenant: { select: { id: true, nombreCompleto: true } },
          },
        },
      },
    });

    const matches: Array<{
      movementIndex: number;
      paymentId: string | null;
      paymentTenant: string | null;
      paymentAmount: number;
      movementAmount: number;
      score: number;
      autoMatched: boolean;
    }> = [];

    const usedPaymentIds = new Set<string>();

    for (let i = 0; i < movements.length; i++) {
      const mov = movements[i];
      const importe = typeof mov.importe === 'number' ? mov.importe : parseFloat(mov.importe) || 0;
      const fecha = parseDate(mov.fecha || mov.date);

      if (importe <= 0 || !fecha) {
        matches.push({
          movementIndex: i,
          paymentId: null,
          paymentTenant: null,
          paymentAmount: 0,
          movementAmount: importe,
          score: 0,
          autoMatched: false,
        });
        continue;
      }

      let bestPayment: (typeof pendingPayments)[0] | null = null;
      let bestScore = 0;

      for (const pay of pendingPayments) {
        if (usedPaymentIds.has(pay.id)) continue;

        const score = computeScore(importe, fecha, pay.monto, pay.fechaVencimiento);
        if (score > bestScore) {
          bestScore = score;
          bestPayment = pay;
        }
      }

      if (bestPayment && bestScore > 0) {
        usedPaymentIds.add(bestPayment.id);
        matches.push({
          movementIndex: i,
          paymentId: bestPayment.id,
          paymentTenant: bestPayment.contract?.tenant?.nombreCompleto ?? null,
          paymentAmount: bestPayment.monto,
          movementAmount: importe,
          score: bestScore,
          autoMatched: bestScore > 90,
        });
      } else {
        matches.push({
          movementIndex: i,
          paymentId: null,
          paymentTenant: null,
          paymentAmount: 0,
          movementAmount: importe,
          score: 0,
          autoMatched: false,
        });
      }
    }

    const unmatched = matches.filter((m) => m.paymentId === null).length;

    return NextResponse.json({
      matches,
      unmatched,
    });
  } catch (error: any) {
    logger.error('[Banking Auto-Reconcile]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error en auto-conciliación' }, { status: 500 });
  }
}
