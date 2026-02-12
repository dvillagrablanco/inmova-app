/**
 * API de Conciliación Bancaria
 * 
 * Endpoints para gestión de cuentas bancarias, transacciones y facturas.
 * Soporta filtrado por sociedad (companyId) y datos reales de BankTransaction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tipos para la respuesta
interface BankAccountResponse {
  id: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  balance: number;
  currency: string;
  lastSync: string;
  status: 'connected' | 'pending' | 'error';
  companyId: string;
  companyName: string;
}

interface BankTransactionResponse {
  id: string;
  accountId: string;
  date: string;
  valueDate: string;
  description: string;
  reference?: string;
  amount: number;
  balance: number;
  type: 'income' | 'expense';
  category?: string;
  subcategory?: string;
  reconciliationStatus: 'pending' | 'matched' | 'manual' | 'unmatched';
  matchedDocumentId?: string;
  matchedDocumentType?: 'invoice' | 'receipt' | 'payment';
  matchConfidence?: number;
  beneficiary?: string;
  creditorName?: string;
  debtorName?: string;
  transactionType?: string;
  companyId: string;
}

interface InvoiceResponse {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  tenant?: string;
  concept: string;
  property?: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  reconciled: boolean;
  matchedTransactionId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status'); // pending, matched, manual
    const type = searchParams.get('type'); // income, expense
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Lazy load Prisma
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Build where clause for transactions
    const txWhere: any = {};
    
    if (companyId) {
      txWhere.companyId = companyId;
    } else if ((session.user as any)?.companyId) {
      txWhere.companyId = (session.user as any).companyId;
    }

    if (status) {
      const statusMap: Record<string, string> = {
        'pending': 'pendiente_revision',
        'matched': 'conciliado',
        'manual': 'conciliado',
        'unmatched': 'descartado',
      };
      if (statusMap[status]) {
        txWhere.estado = statusMap[status];
      }
    }

    if (type === 'income') {
      txWhere.monto = { gt: 0 };
    } else if (type === 'expense') {
      txWhere.monto = { lt: 0 };
    }

    if (search) {
      txWhere.OR = [
        { descripcion: { contains: search, mode: 'insensitive' } },
        { beneficiario: { contains: search, mode: 'insensitive' } },
        { referencia: { contains: search, mode: 'insensitive' } },
        { creditorName: { contains: search, mode: 'insensitive' } },
        { debtorName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dateFrom || dateTo) {
      txWhere.fecha = {};
      if (dateFrom) txWhere.fecha.gte = new Date(dateFrom);
      if (dateTo) txWhere.fecha.lte = new Date(dateTo);
    }

    // Fetch bank connections (accounts)
    const connectionWhere: any = {};
    if (companyId) {
      connectionWhere.companyId = companyId;
    } else if ((session.user as any)?.companyId) {
      connectionWhere.companyId = (session.user as any).companyId;
    }

    const connections = await prisma.bankConnection.findMany({
      where: connectionWhere,
      include: {
        company: { select: { id: true, nombre: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { ultimaSync: 'desc' },
    });

    // Map connections to account response format
    const accounts: BankAccountResponse[] = connections.map(conn => {
      const statusMap: Record<string, 'connected' | 'pending' | 'error'> = {
        'conectado': 'connected',
        'desconectado': 'pending',
        'error': 'error',
        'renovacion_requerida': 'pending',
      };

      return {
        id: conn.id,
        bankName: conn.nombreBanco || conn.proveedor || 'Banco',
        accountNumber: conn.ultimosDigitos ? `****${conn.ultimosDigitos}` : '****0000',
        iban: `****${conn.ultimosDigitos || '0000'}`,
        balance: 0, // Will be calculated from transactions
        currency: conn.moneda || 'EUR',
        lastSync: conn.ultimaSync?.toISOString() || new Date().toISOString(),
        status: statusMap[conn.estado] || 'pending',
        companyId: conn.companyId || '',
        companyName: conn.company?.nombre || '',
      };
    });

    // Fetch transactions
    const [transactions, totalCount] = await Promise.all([
      prisma.bankTransaction.findMany({
        where: txWhere,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          connection: { select: { id: true, nombreBanco: true, ultimosDigitos: true } },
        },
      }),
      prisma.bankTransaction.count({ where: txWhere }),
    ]);

    // Map transactions to response format
    const transactionResponses: BankTransactionResponse[] = transactions.map(tx => {
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
        balance: 0, // Running balance not tracked per transaction
        type: tx.monto >= 0 ? 'income' : 'expense',
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
      };
    });

    // Compute aggregate stats
    const statsWhere = { ...txWhere };
    delete statsWhere.estado; // Remove status filter for stats

    const [totalIncome, totalExpense, pendingCount, matchedCount] = await Promise.all([
      prisma.bankTransaction.aggregate({
        where: { ...statsWhere, monto: { gt: 0 } },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.bankTransaction.aggregate({
        where: { ...statsWhere, monto: { lt: 0 } },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.bankTransaction.count({
        where: { ...statsWhere, estado: 'pendiente_revision' },
      }),
      prisma.bankTransaction.count({
        where: { ...statsWhere, estado: 'conciliado' },
      }),
    ]);

    // Get companies with bank data for the filter dropdown
    const companiesWithBankData = await prisma.bankConnection.findMany({
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

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        transactions: transactionResponses,
        invoices: [] as InvoiceResponse[], // TODO: integrate with actual invoices
        stats: {
          totalIncome: totalIncome._sum.monto || 0,
          totalExpense: Math.abs(totalExpense._sum.monto || 0),
          incomeCount: totalIncome._count || 0,
          expenseCount: totalExpense._count || 0,
          pendingCount,
          matchedCount,
          totalTransactions: totalCount,
        },
        companies,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('[API Error] Conciliación:', error);
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
    
    if (!session) {
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

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    switch (action) {
      case 'conciliar': {
        await prisma.bankTransaction.update({
          where: { id: transactionId },
          data: {
            estado: 'conciliado',
            paymentId: paymentId || null,
            expenseId: expenseId || null,
            conciliadoPor: (session.user as any)?.id || 'manual',
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
            conciliadoPor: (session.user as any)?.id || 'manual',
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
    console.error('[API Error] Conciliación POST:', error);
    return NextResponse.json(
      { error: 'Error procesando conciliación', details: error.message },
      { status: 500 }
    );
  }
}
