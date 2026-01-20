/**
 * API: /api/finanzas/conciliacion
 * 
 * GET - Obtiene datos de conciliación bancaria (cuentas, transacciones, pagos)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');

    // 1. Obtener cuentas bancarias conectadas
    const bankAccounts = await prisma.bankConnection.findMany({
      where: { companyId },
      select: {
        id: true,
        nombreBanco: true,
        tipoCuenta: true,
        ultimosDigitos: true,
        moneda: true,
        estado: true,
        ultimaSync: true,
        proveedor: true,
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular balance de cada cuenta (suma de transacciones)
    const accountsWithBalance = await Promise.all(
      bankAccounts.map(async (account) => {
        const balanceResult = await prisma.bankTransaction.aggregate({
          where: { connectionId: account.id },
          _sum: { monto: true }
        });

        return {
          id: account.id,
          bankName: account.nombreBanco || 'Banco',
          accountNumber: account.ultimosDigitos ? `****${account.ultimosDigitos}` : '****0000',
          iban: '', // No almacenamos IBAN completo por seguridad
          balance: balanceResult._sum.monto || 0,
          currency: account.moneda,
          lastSync: account.ultimaSync?.toISOString() || new Date().toISOString(),
          status: account.estado === 'conectado' ? 'connected' : 
                  account.estado === 'error' ? 'error' : 'pending',
          transactionCount: account._count.transactions
        };
      })
    );

    // 2. Construir filtros para transacciones
    const transactionWhere: any = { companyId };
    
    if (accountId && accountId !== 'all') {
      transactionWhere.connectionId = accountId;
    }
    
    if (status && status !== 'all') {
      const statusMap: Record<string, string> = {
        'pending': 'pendiente_revision',
        'matched': 'conciliado',
        'ignored': 'descartado'
      };
      transactionWhere.estado = statusMap[status] || status;
    }
    
    if (search) {
      transactionWhere.OR = [
        { descripcion: { contains: search, mode: 'insensitive' } },
        { referencia: { contains: search, mode: 'insensitive' } },
        { beneficiario: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 3. Obtener transacciones bancarias
    const transactions = await prisma.bankTransaction.findMany({
      where: transactionWhere,
      include: {
        connection: {
          select: {
            nombreBanco: true,
            ultimosDigitos: true
          }
        },
        payment: {
          select: {
            id: true,
            monto: true,
            periodo: true,
            estado: true,
            contract: {
              select: {
                tenant: {
                  select: { nombre: true, apellidos: true }
                },
                property: {
                  select: { nombre: true, direccion: true }
                }
              }
            }
          }
        }
      },
      orderBy: { fecha: 'desc' },
      take: limit
    });

    // Mapear transacciones al formato esperado por el frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      accountId: tx.connectionId,
      date: tx.fecha.toISOString(),
      valueDate: tx.fechaContable?.toISOString() || tx.fecha.toISOString(),
      description: tx.descripcion,
      reference: tx.referencia,
      amount: tx.monto,
      balance: 0, // Calculado en frontend
      type: tx.monto >= 0 ? 'income' : 'expense',
      category: tx.categoria,
      reconciliationStatus: tx.estado === 'conciliado' ? 'matched' : 
                           tx.estado === 'descartado' ? 'ignored' : 'pending',
      matchedDocumentId: tx.paymentId,
      matchedDocumentType: tx.paymentId ? 'payment' : undefined,
      matchConfidence: tx.matchScore,
      // Info del pago vinculado
      linkedPayment: tx.payment ? {
        id: tx.payment.id,
        amount: tx.payment.monto,
        period: tx.payment.periodo,
        status: tx.payment.estado,
        tenant: tx.payment.contract?.tenant ? 
          `${tx.payment.contract.tenant.nombre} ${tx.payment.contract.tenant.apellidos}` : undefined,
        property: tx.payment.contract?.property?.nombre || tx.payment.contract?.property?.direccion
      } : undefined
    }));

    // 4. Obtener pagos pendientes (para vincular)
    const pendingPayments = await prisma.payment.findMany({
      where: {
        contract: {
          property: { companyId }
        },
        estado: { in: ['pendiente', 'atrasado'] },
        // Solo pagos no vinculados a transacciones
        bankTransactions: { none: {} }
      },
      include: {
        contract: {
          select: {
            tenant: {
              select: { nombre: true, apellidos: true }
            },
            property: {
              select: { nombre: true, direccion: true }
            }
          }
        }
      },
      orderBy: { fechaVencimiento: 'desc' },
      take: 50
    });

    const formattedInvoices = pendingPayments.map(payment => ({
      id: payment.id,
      number: `PAG-${payment.id.slice(-8).toUpperCase()}`,
      date: payment.createdAt.toISOString(),
      dueDate: payment.fechaVencimiento.toISOString(),
      tenant: payment.contract?.tenant ? 
        `${payment.contract.tenant.nombre} ${payment.contract.tenant.apellidos}` : undefined,
      concept: `${payment.periodo} - ${payment.contract?.property?.nombre || payment.contract?.property?.direccion || 'Propiedad'}`,
      amount: payment.monto,
      status: payment.estado === 'pagado' ? 'paid' : 
              payment.estado === 'atrasado' ? 'overdue' : 'pending',
      reconciled: false,
      matchedTransactionId: undefined
    }));

    // 5. Estadísticas
    const stats = {
      pendingCount: formattedTransactions.filter(t => t.reconciliationStatus === 'pending').length,
      matchedCount: formattedTransactions.filter(t => t.reconciliationStatus === 'matched').length,
      ignoredCount: formattedTransactions.filter(t => t.reconciliationStatus === 'ignored').length,
      totalIncome: formattedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
      totalExpense: formattedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalBalance: accountsWithBalance.reduce((sum, acc) => sum + acc.balance, 0)
    };

    return NextResponse.json({
      success: true,
      bankAccounts: accountsWithBalance,
      transactions: formattedTransactions,
      invoices: formattedInvoices,
      stats
    });
  } catch (error: any) {
    logger.error('Error obteniendo datos de conciliación:', error);
    return NextResponse.json(
      { error: 'Error obteniendo datos de conciliación', details: error.message },
      { status: 500 }
    );
  }
}
