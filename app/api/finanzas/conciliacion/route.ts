/**
 * API de Conciliación Bancaria
 * Datos reales: bank transactions + contabilidad + pagos/gastos
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

    const [connections, bankTransactions, accountingTransactions] = await Promise.all([
      prisma.bankConnection.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bankTransaction.findMany({
        where: { companyId },
        orderBy: { fecha: 'desc' },
        take: 200,
      }),
      prisma.accountingTransaction.findMany({
        where: { companyId },
        orderBy: { fecha: 'desc' },
        take: 200,
      }),
    ]);

    const buildingIds = Array.from(
      new Set(accountingTransactions.map((tx) => tx.buildingId).filter(Boolean))
    ) as string[];
    const unitIds = Array.from(
      new Set(accountingTransactions.map((tx) => tx.unitId).filter(Boolean))
    ) as string[];

    const [buildings, units] = await Promise.all([
      prisma.building.findMany({
        where: { id: { in: buildingIds } },
        select: { id: true, nombre: true },
      }),
      prisma.unit.findMany({
        where: { id: { in: unitIds } },
        select: { id: true, numero: true, buildingId: true },
      }),
    ]);

    const buildingMap = new Map(buildings.map((b) => [b.id, b]));
    const unitMap = new Map(units.map((u) => [u.id, u]));

    const paymentIds = accountingTransactions.map((tx) => tx.paymentId).filter(Boolean) as string[];
    const expenseIds = accountingTransactions.map((tx) => tx.expenseId).filter(Boolean) as string[];

    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({
        where: { id: { in: paymentIds } },
        include: {
          contract: {
            include: {
              tenant: { select: { nombreCompleto: true } },
              unit: { select: { numero: true, building: { select: { nombre: true } } } },
            },
          },
        },
      }),
      prisma.expense.findMany({
        where: { id: { in: expenseIds } },
        include: {
          building: { select: { nombre: true } },
          unit: { select: { numero: true, building: { select: { nombre: true } } } },
        },
      }),
    ]);

    const paymentMap = new Map(payments.map((p) => [p.id, p]));
    const expenseMap = new Map(expenses.map((e) => [e.id, e]));

    const accounts = connections.map((connection) => ({
      id: connection.id,
      bankName: connection.nombreBanco || connection.proveedor || 'Banco',
      accountNumber: connection.ultimosDigitos ? `****${connection.ultimosDigitos}` : '',
      iban: '',
      balance: 0,
      currency: connection.moneda || 'EUR',
      lastSync: connection.ultimaSync?.toISOString() || connection.updatedAt.toISOString(),
      status:
        connection.estado === 'conectado'
          ? 'connected'
          : connection.estado === 'renovacion_requerida'
            ? 'pending'
            : connection.estado === 'error'
              ? 'error'
              : 'pending',
    }));

    const transactions = bankTransactions.map((tx) => ({
      id: tx.id,
      accountId: tx.connectionId,
      date: tx.fecha.toISOString(),
      valueDate: (tx.fechaContable || tx.fecha).toISOString(),
      description: tx.descripcion,
      reference: tx.referencia || undefined,
      amount: tx.monto,
      balance: 0,
      type: tx.monto >= 0 ? 'income' : 'expense',
      category: tx.categoria || undefined,
      reconciliationStatus:
        tx.estado === 'conciliado' ? 'matched' : tx.estado === 'descartado' ? 'ignored' : 'pending',
      matchedDocumentId: tx.paymentId || tx.expenseId || undefined,
      matchedDocumentType: tx.paymentId ? 'payment' : tx.expenseId ? 'receipt' : undefined,
      matchConfidence: tx.matchScore || undefined,
    }));

    const invoices = accountingTransactions.map((tx) => {
      const payment = tx.paymentId ? paymentMap.get(tx.paymentId) : null;
      const expense = tx.expenseId ? expenseMap.get(tx.expenseId) : null;
      const unit = tx.unitId ? unitMap.get(tx.unitId) : null;
      const building = tx.buildingId ? buildingMap.get(tx.buildingId) : null;
      const tenantName = payment?.contract?.tenant?.nombreCompleto || '';
      const propertyLabel = payment?.contract?.unit
        ? `${payment.contract.unit.building.nombre} - ${payment.contract.unit.numero}`
        : expense?.unit
          ? `${expense.unit.building?.nombre || ''} - ${expense.unit.numero}`
          : expense?.building
            ? expense.building.nombre
            : building
              ? building.nombre
              : unit
                ? unit.numero
                : '';

      const isReconciled = Boolean(tx.paymentId || tx.expenseId);
      const isOverdue = !isReconciled && tx.fecha < new Date();

      return {
        id: tx.id,
        number: tx.referencia || `ACC-${tx.id.slice(-6)}`,
        date: tx.fecha.toISOString(),
        dueDate: tx.fecha.toISOString(),
        concept: tx.concepto,
        tenant: tenantName || 'N/D',
        property: propertyLabel || 'N/D',
        tenantId: payment?.contract?.tenantId || null,
        unitId: payment?.contract?.unitId || expense?.unitId || unit?.id || null,
        buildingId:
          payment?.contract?.unit?.building?.id ||
          expense?.buildingId ||
          expense?.unit?.building?.id ||
          building?.id ||
          null,
        contractId: payment?.contractId || null,
        amount: Number(tx.monto || 0),
        status: isReconciled ? 'paid' : isOverdue ? 'overdue' : 'pending',
        reconciled: isReconciled,
        matchedTransactionId: tx.paymentId || tx.expenseId || undefined,
      };
    });

    const pendingTransactions = transactions.filter((t) => t.reconciliationStatus === 'pending');
    const pendingInvoices = invoices.filter((i) => !i.reconciled);

    const suggestions = pendingTransactions.flatMap((tx) => {
      const matches = pendingInvoices
        .filter((inv) => Math.abs(inv.amount - Math.abs(tx.amount)) <= 0.01)
        .slice(0, 3);
      return matches.map((inv) => ({
        transactionId: tx.id,
        documentId: inv.id,
        documentType: 'invoice',
        confidence: 80,
        reason: 'Importe coincidente',
      }));
    });

    const stats = {
      totalTransactions: transactions.length,
      pendingTransactions: pendingTransactions.length,
      matchedTransactions: transactions.filter((t) => t.reconciliationStatus === 'matched').length,
      unmatchedTransactions: transactions.filter((t) => t.reconciliationStatus === 'ignored')
        .length,
      totalInvoices: invoices.length,
      reconciledInvoices: invoices.filter((i) => i.reconciled).length,
      pendingInvoices: invoices.filter((i) => !i.reconciled).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        transactions,
        invoices,
        stats,
        suggestions,
      },
    });
  } catch (error) {
    logger.error('Error en conciliación:', error);
    return NextResponse.json({ error: 'Error al obtener datos de conciliación' }, { status: 500 });
  }
}
