/**
 * API de Diagnóstico Financiero
 * 
 * Endpoint para verificar que datos existen y son accesibles para el usuario.
 * Muestra: empresa activa, datos contables, movimientos bancarios, scope.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const user = session.user as any;

    // 1. Info del usuario
    const userInfo = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    // 2. Cookie activeCompanyId
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;

    // 3. Query param
    const queryCompanyId = new URL(request.url).searchParams.get('companyId');

    // 4. Resolver scope
    let scope = null;
    let scopeError = null;
    try {
      scope = await resolveAccountingScope(request, user);
    } catch (e: any) {
      scopeError = e.message;
    }

    // 5. Info de la empresa activa
    let companyInfo = null;
    const activeCompanyId = scope?.activeCompanyId || user.companyId;
    if (activeCompanyId) {
      companyInfo = await prisma.company.findUnique({
        where: { id: activeCompanyId },
        select: {
          id: true,
          nombre: true,
          parentCompanyId: true,
          childCompanies: { select: { id: true, nombre: true } },
        },
      });
    }

    // 6. Empresas accesibles (userCompanyAccess)
    let accessibleCompanies: any[] = [];
    try {
      const accessEntries = await prisma.userCompanyAccess.findMany({
        where: { userId: user.id, activo: true },
        include: { company: { select: { id: true, nombre: true } } },
      });
      accessibleCompanies = accessEntries.map(e => ({
        companyId: e.companyId,
        nombre: e.company?.nombre,
      }));
    } catch {
      // userCompanyAccess might not exist
    }

    // 7. Datos por empresa (para cada empresa en scope)
    const companyIds = scope?.companyIds || (activeCompanyId ? [activeCompanyId] : []);
    const dataPerCompany: any[] = [];

    for (const cid of companyIds) {
      const company = await prisma.company.findUnique({
        where: { id: cid },
        select: { id: true, nombre: true },
      });

      // AccountingTransactions
      const accountingCount = await prisma.accountingTransaction.count({
        where: { companyId: cid },
      });
      const accountingLatest = await prisma.accountingTransaction.findFirst({
        where: { companyId: cid },
        orderBy: { fecha: 'desc' },
        select: { fecha: true, tipo: true, monto: true, concepto: true },
      });
      const accountingEarliest = await prisma.accountingTransaction.findFirst({
        where: { companyId: cid },
        orderBy: { fecha: 'asc' },
        select: { fecha: true },
      });

      // BankConnections
      const bankConnections = await prisma.bankConnection.findMany({
        where: { companyId: cid },
        select: {
          id: true,
          proveedor: true,
          nombreBanco: true,
          estado: true,
          ultimaSync: true,
          proveedorItemId: true,
          _count: { select: { transactions: true } },
        },
      });

      // BankTransactions
      const bankTxCount = await prisma.bankTransaction.count({
        where: { companyId: cid },
      });
      const bankTxLatest = await prisma.bankTransaction.findFirst({
        where: { companyId: cid },
        orderBy: { fecha: 'desc' },
        select: { fecha: true, monto: true, descripcion: true },
      });

      // Contracts, Payments
      const contractCount = await prisma.contract.count({
        where: { unit: { building: { companyId: cid } }, estado: 'activo' },
      }).catch(() => 0);

      const paymentCount = await prisma.payment.count({
        where: { contract: { unit: { building: { companyId: cid } } } },
      }).catch(() => 0);

      // Buildings/Units
      const buildingCount = await prisma.building.count({
        where: { companyId: cid },
      }).catch(() => 0);

      dataPerCompany.push({
        companyId: cid,
        nombre: company?.nombre || 'Unknown',
        accounting: {
          total: accountingCount,
          earliest: accountingEarliest?.fecha || null,
          latest: accountingLatest?.fecha || null,
          lastEntry: accountingLatest || null,
        },
        bank: {
          connections: bankConnections.map(bc => ({
            id: bc.id,
            proveedor: bc.proveedor,
            banco: bc.nombreBanco,
            estado: bc.estado,
            iban: bc.proveedorItemId,
            transactions: bc._count.transactions,
            ultimaSync: bc.ultimaSync,
          })),
          totalTransactions: bankTxCount,
          latestTransaction: bankTxLatest || null,
        },
        contracts: contractCount,
        payments: paymentCount,
        buildings: buildingCount,
      });
    }

    return NextResponse.json({
      diagnostico: {
        timestamp: new Date().toISOString(),
        usuario: userInfo,
        scopeResolution: {
          queryCompanyId,
          cookieCompanyId: cookieCompanyId || null,
          sessionCompanyId: user.companyId,
          resolvedScope: scope,
          scopeError,
        },
        empresaActiva: companyInfo,
        empresasAccesibles: accessibleCompanies,
        datosPerEmpresa: dataPerCompany,
        resumen: {
          empresasEnScope: companyIds.length,
          totalAccountingTx: dataPerCompany.reduce((s, d) => s + d.accounting.total, 0),
          totalBankTx: dataPerCompany.reduce((s, d) => s + d.bank.totalTransactions, 0),
          totalBankConnections: dataPerCompany.reduce((s, d) => s + d.bank.connections.length, 0),
          totalContracts: dataPerCompany.reduce((s, d) => s + d.contracts, 0),
          totalPayments: dataPerCompany.reduce((s, d) => s + d.payments, 0),
        },
      },
    });
  } catch (error: any) {
    logger.error('[Diagnostico Error]:', error);
    return NextResponse.json(
      { error: 'Error en diagnóstico', details: error.message },
      { status: 500 }
    );
  }
}
