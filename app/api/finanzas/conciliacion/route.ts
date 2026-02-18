/**
 * API de Conciliación Bancaria
 * 
 * Endpoints para gestión de cuentas bancarias, transacciones y facturas.
 * Soporta filtrado por sociedad (companyId) y datos reales de BankTransaction.
 * Usa resolveAccountingScope para soporte multi-empresa (holdings/filiales).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const filterCompanyId = searchParams.get('companyId'); // Specific company filter from UI
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const prisma = await getPrisma();

    // Resolve accounting scope (supports holdings, multi-company, session fallback)
    const scope = await resolveAccountingScope(request, session.user as any);
    if (!scope) {
      return NextResponse.json(
        { error: 'Sin empresa asociada' },
        { status: 403 }
      );
    }

    // Determine which companyIds to query
    // If a specific company is selected in the filter, use only that one (if authorized)
    let queryCompanyIds: string[];
    if (filterCompanyId && scope.companyIds.includes(filterCompanyId)) {
      queryCompanyIds = [filterCompanyId];
    } else {
      queryCompanyIds = scope.companyIds;
    }

    // Build where clause for transactions
    const txWhere: any = {
      companyId: { in: queryCompanyIds },
    };

    if (statusParam) {
      const statusMap: Record<string, string> = {
        'pending': 'pendiente_revision',
        'matched': 'conciliado',
        'manual': 'conciliado',
        'unmatched': 'descartado',
      };
      if (statusMap[statusParam]) {
        txWhere.estado = statusMap[statusParam];
      }
    }

    if (typeParam === 'income') {
      txWhere.monto = { gt: 0 };
    } else if (typeParam === 'expense') {
      txWhere.monto = { lt: 0 };
    }

    if (search) {
      txWhere.OR = [
        { descripcion: { contains: search, mode: 'insensitive' } },
        { beneficiario: { contains: search, mode: 'insensitive' } },
        { referencia: { contains: search, mode: 'insensitive' } },
        { creditorName: { contains: search, mode: 'insensitive' } },
        { debtorName: { contains: search, mode: 'insensitive' } },
        { categoria: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dateFrom || dateTo) {
      txWhere.fecha = {};
      if (dateFrom) txWhere.fecha.gte = new Date(dateFrom);
      if (dateTo) txWhere.fecha.lte = new Date(dateTo);
    }

    // Fetch bank connections (accounts) - restricted to accessible companies
    const connections = await prisma.bankConnection.findMany({
      where: {
        companyId: { in: queryCompanyIds },
      },
      include: {
        company: { select: { id: true, nombre: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { ultimaSync: 'desc' },
    });

    // Map connections to response, including IBAN and transaction count
    const accounts = connections.map(conn => {
      const statusMap: Record<string, 'connected' | 'pending' | 'error'> = {
        'conectado': 'connected',
        'desconectado': 'pending',
        'error': 'error',
        'renovacion_requerida': 'pending',
      };

      // Format IBAN for display (show real IBAN if stored in proveedorItemId)
      const fullIban = conn.proveedorItemId || '';
      const displayIban = fullIban.length >= 20
        ? `${fullIban.slice(0, 4)} **** **** ${fullIban.slice(-4)}`
        : conn.ultimosDigitos ? `****${conn.ultimosDigitos}` : '';

      return {
        id: conn.id,
        bankName: conn.nombreBanco || conn.proveedor || 'Banco',
        accountNumber: conn.ultimosDigitos ? `****${conn.ultimosDigitos}` : '****0000',
        iban: displayIban,
        balance: 0,
        currency: conn.moneda || 'EUR',
        lastSync: conn.ultimaSync?.toISOString() || new Date().toISOString(),
        status: statusMap[conn.estado] || 'pending',
        companyId: conn.companyId || '',
        companyName: conn.company?.nombre || '',
        transactionCount: conn._count.transactions,
      };
    });

    // Fetch transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.bankTransaction.findMany({
        where: txWhere,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          connection: {
            select: {
              id: true,
              nombreBanco: true,
              ultimosDigitos: true,
              company: { select: { id: true, nombre: true } },
            },
          },
        },
      }),
      prisma.bankTransaction.count({ where: txWhere }),
    ]);

    // Map transactions to response format
    const transactionResponses = transactions.map(tx => {
      const statusMap: Record<string, 'pending' | 'matched' | 'manual' | 'unmatched'> = {
        'pendiente_revision': 'pending',
        'conciliado': 'matched',
        'descartado': 'unmatched',
      };

      return {
        id: tx.id,
        accountId: tx.connectionId,
        date: tx.fecha.toISOString(),
        valueDate: tx.fechaContable?.toISOString() || tx.fecha.toISOString(),
        description: tx.descripcion,
        reference: tx.referencia || undefined,
        amount: tx.monto,
        balance: 0,
        type: (tx.monto >= 0 ? 'income' : 'expense') as 'income' | 'expense',
        category: tx.categoria || undefined,
        subcategory: tx.subcategoria || undefined,
        reconciliationStatus: tx.paymentId || tx.expenseId
          ? (tx.estado === 'conciliado' ? 'matched' : 'manual')
          : (statusMap[tx.estado] || 'pending'),
        matchedDocumentId: tx.paymentId || tx.expenseId || undefined,
        matchedDocumentType: tx.paymentId ? 'payment' : tx.expenseId ? 'receipt' : undefined,
        matchConfidence: tx.matchScore || undefined,
        beneficiary: tx.beneficiario || undefined,
        creditorName: tx.creditorName || undefined,
        debtorName: tx.debtorName || undefined,
        transactionType: tx.tipoTransaccion || undefined,
        companyId: tx.companyId,
        companyName: tx.connection?.company?.nombre || '',
        bankName: tx.connection?.nombreBanco || '',
      };
    });

    // Compute aggregate stats - use base company filter WITHOUT status/type filters
    // so stats always show the full picture
    const globalStatsWhere = {
      companyId: { in: queryCompanyIds },
      ...(dateFrom || dateTo ? { fecha: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      }} : {}),
      ...(search ? { OR: [
        { descripcion: { contains: search, mode: 'insensitive' as const } },
        { beneficiario: { contains: search, mode: 'insensitive' as const } },
        { referencia: { contains: search, mode: 'insensitive' as const } },
      ]} : {}),
    };

    const [totalIncome, totalExpense, pendingCount, matchedCount, discardedCount] = await Promise.all([
      prisma.bankTransaction.aggregate({
        where: { ...globalStatsWhere, monto: { gt: 0 } },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.bankTransaction.aggregate({
        where: { ...globalStatsWhere, monto: { lt: 0 } },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.bankTransaction.count({
        where: { ...globalStatsWhere, estado: 'pendiente_revision' },
      }),
      prisma.bankTransaction.count({
        where: { ...globalStatsWhere, estado: 'conciliado' },
      }),
      prisma.bankTransaction.count({
        where: { ...globalStatsWhere, estado: 'descartado' },
      }),
    ]);

    // Get ALL companies with bank data that the user has access to (for dropdown)
    const companiesWithBankData = await prisma.bankConnection.findMany({
      where: {
        companyId: { in: scope.companyIds },
      },
      select: {
        companyId: true,
        company: { select: { id: true, nombre: true } },
      },
      distinct: ['companyId'],
    });

    const companies = companiesWithBankData
      .filter(c => c.company)
      .map(c => ({
        id: c.company!.id,
        nombre: c.company!.nombre,
      }));

    const totalTransactionsGlobal = (totalIncome._count || 0) + (totalExpense._count || 0);

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        transactions: transactionResponses,
        invoices: [],
        stats: {
          totalIncome: totalIncome._sum.monto || 0,
          totalExpense: Math.abs(totalExpense._sum.monto || 0),
          incomeCount: totalIncome._count || 0,
          expenseCount: totalExpense._count || 0,
          pendingCount,
          matchedCount,
          discardedCount,
          totalTransactions: totalCount,
          totalTransactionsGlobal,
        },
        companies,
        scope: {
          activeCompanyId: scope.activeCompanyId,
          isConsolidated: scope.isConsolidated,
          companyCount: scope.companyIds.length,
        },
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    logger.error('[API Error] Conciliación:', error);
    return NextResponse.json(
      { error: 'Error obteniendo datos de conciliación', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Conciliar manualmente un movimiento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transactionId, action, paymentId, expenseId, notes } = body;

    if (!transactionId || !action) {
      return NextResponse.json(
        { error: 'transactionId y action son requeridos' },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();

    // Verify the transaction belongs to a company the user has access to
    const scope = await resolveAccountingScope(request, session.user as any);
    if (!scope) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

    const transaction = await prisma.bankTransaction.findUnique({
      where: { id: transactionId },
      select: { companyId: true },
    });

    if (!transaction || !scope.companyIds.includes(transaction.companyId)) {
      return NextResponse.json(
        { error: 'Transacción no encontrada o sin permisos' },
        { status: 404 }
      );
    }

    const userId = (session.user as any)?.id || 'manual';

    switch (action) {
      case 'conciliar': {
        await prisma.bankTransaction.update({
          where: { id: transactionId },
          data: {
            estado: 'conciliado',
            paymentId: paymentId || null,
            expenseId: expenseId || null,
            conciliadoPor: userId,
            conciliadoEn: new Date(),
            notasConciliacion: notes || 'Conciliación manual',
          },
        });
        break;
      }
      case 'descartar': {
        await prisma.bankTransaction.update({
          where: { id: transactionId },
          data: {
            estado: 'descartado',
            conciliadoPor: userId,
            conciliadoEn: new Date(),
            notasConciliacion: notes || 'Descartado manualmente',
          },
        });
        break;
      }
      case 'revertir': {
        await prisma.bankTransaction.update({
          where: { id: transactionId },
          data: {
            estado: 'pendiente_revision',
            paymentId: null,
            expenseId: null,
            conciliadoPor: null,
            conciliadoEn: null,
            notasConciliacion: null,
            matchScore: null,
          },
        });
        break;
      }
      default:
        return NextResponse.json(
          { error: `Acción no reconocida: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Transacción ${action === 'conciliar' ? 'conciliada' : action === 'descartar' ? 'descartada' : 'revertida'} correctamente`,
    });
  } catch (error: any) {
    logger.error('[API Error] Conciliación POST:', error);
    return NextResponse.json(
      { error: 'Error procesando conciliación', details: error.message },
      { status: 500 }
    );
  }
}
