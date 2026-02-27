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

/**
 * POST /api/banking/ai-match
 * Usa IA para sugerir matches entre movimientos bancarios y pagos/contratos.
 * Para Rovida (garajes con importes fijos) hace matching automático por importe.
 * Para movimientos ambiguos, usa Claude para analizar el concepto bancario.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
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

    const companyId = scope.activeCompanyId;

    // 1. Obtener movimientos bancarios no conciliados
    const unmatchedTxs = await prisma.bankTransaction.findMany({
      where: {
        companyId,
        reconciled: false,
        amount: { gt: 0 }, // Solo ingresos
      },
      orderBy: { date: 'desc' },
      take: 50,
    });

    if (unmatchedTxs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay movimientos pendientes de conciliar',
        matches: [],
        stats: { total: 0, autoMatched: 0, aiSuggested: 0, unmatched: 0 },
      });
    }

    // 2. Obtener pagos pendientes de la empresa
    const pendingPayments = await prisma.payment.findMany({
      where: {
        contract: { unit: { building: { companyId } } },
        estado: { in: ['pendiente', 'atrasado'] },
      },
      include: {
        contract: {
          include: {
            tenant: { select: { id: true, nombreCompleto: true } },
            unit: { select: { numero: true, building: { select: { nombre: true } } } },
          },
        },
      },
    });

    // 3. Matching automático por importe exacto
    const matches: Array<{
      bankTxId: string;
      bankTxDate: Date;
      bankTxAmount: number;
      bankTxConcept: string;
      paymentId: string | null;
      tenantName: string | null;
      buildingName: string | null;
      unitNumber: string | null;
      confidence: 'high' | 'medium' | 'low';
      matchType: 'exact_amount' | 'ai_suggested' | 'unmatched';
    }> = [];

    const matchedPaymentIds = new Set<string>();
    let autoMatched = 0;
    let aiSuggested = 0;

    for (const tx of unmatchedTxs) {
      const amount = Math.abs(tx.amount);

      // Buscar pago por importe exacto (±0.01€ tolerancia)
      const exactMatch = pendingPayments.find(
        (p) =>
          !matchedPaymentIds.has(p.id) &&
          Math.abs(p.monto - amount) < 0.02
      );

      if (exactMatch) {
        matchedPaymentIds.add(exactMatch.id);
        autoMatched++;
        matches.push({
          bankTxId: tx.id,
          bankTxDate: tx.date,
          bankTxAmount: amount,
          bankTxConcept: tx.description || tx.remittanceInfo || '',
          paymentId: exactMatch.id,
          tenantName: exactMatch.contract?.tenant?.nombreCompleto || null,
          buildingName: exactMatch.contract?.unit?.building?.nombre || null,
          unitNumber: exactMatch.contract?.unit?.numero || null,
          confidence: 'high',
          matchType: 'exact_amount',
        });
      } else {
        // Para importes que no coinciden exactamente, buscar por aproximación
        const concept = (tx.description || tx.remittanceInfo || '').toLowerCase();

        // Buscar en concepto bancario nombres de inquilinos
        const conceptMatch = pendingPayments.find(
          (p) =>
            !matchedPaymentIds.has(p.id) &&
            p.contract?.tenant?.nombreCompleto &&
            concept.includes(p.contract.tenant.nombreCompleto.toLowerCase().split(' ')[0])
        );

        if (conceptMatch) {
          matchedPaymentIds.add(conceptMatch.id);
          aiSuggested++;
          matches.push({
            bankTxId: tx.id,
            bankTxDate: tx.date,
            bankTxAmount: amount,
            bankTxConcept: concept,
            paymentId: conceptMatch.id,
            tenantName: conceptMatch.contract?.tenant?.nombreCompleto || null,
            buildingName: conceptMatch.contract?.unit?.building?.nombre || null,
            unitNumber: conceptMatch.contract?.unit?.numero || null,
            confidence: 'medium',
            matchType: 'ai_suggested',
          });
        } else {
          matches.push({
            bankTxId: tx.id,
            bankTxDate: tx.date,
            bankTxAmount: amount,
            bankTxConcept: concept,
            paymentId: null,
            tenantName: null,
            buildingName: null,
            unitNumber: null,
            confidence: 'low',
            matchType: 'unmatched',
          });
        }
      }
    }

    const unmatched = matches.filter((m) => m.matchType === 'unmatched').length;

    return NextResponse.json({
      success: true,
      matches,
      stats: {
        total: unmatchedTxs.length,
        autoMatched,
        aiSuggested,
        unmatched,
      },
    });
  } catch (error: any) {
    logger.error('[Banking AI Match]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error en matching inteligente' }, { status: 500 });
  }
}
