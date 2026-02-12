import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { parseNorma43, classifyTransaction, getBankName, detectCompanyFromAccount } from '@/lib/norma43-parser';
import { parseCamt053, isCamt053, isNorma43 } from '@/lib/camt053-parser';
import type { N43Account, N43Transaction } from '@/lib/norma43-parser';
import type { CAMT053Statement, CAMT053Entry } from '@/lib/camt053-parser';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/bank-import/norma43
 * 
 * Importa extractos bancarios. Detecta automáticamente el formato:
 * - CAMT.053 (ISO 20022 XML) — usado por Bankinter actualmente
 * - Norma 43 (AEB Cuaderno 43 texto plano) — formato legacy
 * 
 * Body: FormData con:
 * - file: Fichero .xml / .n43 / .txt / .aeb
 * - companyId: ID de la sociedad
 * 
 * Coste: €0
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const companyId = formData.get('companyId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Fichero requerido' }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
    }

    // Verificar acceso a la empresa
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { users: { some: { id: session.user.id } } },
          { userAccess: { some: { userId: session.user.id, activo: true } } },
        ],
      },
      select: { id: true, nombre: true, iban: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'No tienes acceso a esta empresa' }, { status: 403 });
    }

    const content = await file.text();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Fichero vacío' }, { status: 400 });
    }

    // Detectar formato automáticamente
    if (isCamt053(content)) {
      return await importCamt053(content, file.name, companyId, company.nombre);
    } else if (isNorma43(content)) {
      return await importNorma43(content, file.name, companyId, company.nombre);
    } else {
      return NextResponse.json(
        {
          error: 'Formato de fichero no reconocido',
          details: 'Se esperaba CAMT.053 (XML de Bankinter) o Norma 43 (texto plano AEB). Verifica que el fichero descargado es un extracto bancario.',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    logger.error('Error importando extracto bancario:', error);
    return NextResponse.json(
      { error: 'Error al importar fichero', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// IMPORTACIÓN CAMT.053 (ISO 20022 XML)
// ============================================================================

async function importCamt053(
  content: string,
  fileName: string,
  companyId: string,
  companyName: string
) {
  const parseResult = parseCamt053(content, fileName);

  if (parseResult.errors.length > 0 && parseResult.statements.length === 0) {
    return NextResponse.json(
      { error: 'Error parseando fichero CAMT.053', details: parseResult.errors },
      { status: 400 }
    );
  }

  let totalImported = 0;
  let totalDuplicated = 0;
  const accountsProcessed: Array<{
    iban: string;
    banco: string;
    titular: string;
    transacciones: number;
    duplicadas: number;
    saldoInicial: number;
    saldoFinal: number;
    periodo: string;
  }> = [];

  for (const stmt of parseResult.statements) {
    const { iban, ownerName, bankName } = stmt.account;
    const connectionKey = `camt053_${iban || 'unknown'}`;

    // Buscar o crear BankConnection
    let connection = await prisma.bankConnection.findFirst({
      where: { companyId, proveedorItemId: connectionKey },
    });

    if (!connection) {
      connection = await prisma.bankConnection.create({
        data: {
          companyId,
          proveedor: 'camt053_import',
          provider: 'camt053',
          proveedorItemId: connectionKey,
          nombreBanco: bankName || 'Bankinter',
          tipoCuenta: 'corriente',
          ultimosDigitos: iban.slice(-4),
          moneda: 'EUR',
          estado: 'conectado',
          ultimaSync: new Date(),
          autoReconciliar: true,
          notificarErrores: true,
        },
      });
    } else {
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: { ultimaSync: new Date() },
      });
    }

    // Saldos
    const openBal = stmt.balances.find(b => b.type === 'OPBD');
    const closeBal = stmt.balances.find(b => b.type === 'CLBD');

    // Importar movimientos
    let accountImported = 0;
    let accountDuplicated = 0;

    for (const entry of stmt.entries) {
      const txId = generateCamt053TxId(iban, entry);

      // Verificar duplicados
      const existing = await prisma.bankTransaction.findFirst({
        where: { proveedorTxId: txId },
      });

      if (existing) {
        accountDuplicated++;
        continue;
      }

      const counterparty = entry.creditDebit === 'DBIT'
        ? entry.creditorName
        : entry.debtorName;

      await prisma.bankTransaction.create({
        data: {
          companyId,
          connectionId: connection.id,
          proveedorTxId: txId,
          fecha: new Date(entry.bookingDate),
          fechaContable: entry.valueDate ? new Date(entry.valueDate) : null,
          descripcion: entry.description || 'Movimiento bancario',
          monto: entry.signedAmount,
          moneda: entry.currency,
          categoria: entry.categoriasugerida,
          tipoTransaccion: entry.tipo,
          referencia: entry.reference || undefined,
          beneficiario: counterparty || undefined,
          creditorName: entry.creditorName || undefined,
          creditorIban: undefined,
          debtorName: entry.debtorName || undefined,
          debtorIban: undefined,
          rawData: {
            format: 'camt053',
            domainCode: entry.domainCode,
            familyCode: entry.familyCode,
            subFamilyCode: entry.subFamilyCode,
            debtorId: entry.debtorId,
            creditorId: entry.creditorId,
            ultimateDebtorName: entry.ultimateDebtorName,
            ultimateCreditorName: entry.ultimateCreditorName,
            status: entry.status,
          },
          estado: 'pendiente_revision',
        },
      });

      accountImported++;
    }

    totalImported += accountImported;
    totalDuplicated += accountDuplicated;

    accountsProcessed.push({
      iban: iban ? `${iban.substring(0, 4)}****${iban.slice(-4)}` : 'Desconocida',
      banco: bankName || 'Bankinter',
      titular: ownerName,
      transacciones: accountImported,
      duplicadas: accountDuplicated,
      saldoInicial: openBal?.signedAmount ?? 0,
      saldoFinal: closeBal?.signedAmount ?? 0,
      periodo: `${stmt.periodFrom} a ${stmt.periodTo}`,
    });
  }

  logger.info(
    `📥 CAMT.053 importado: ${totalImported} movimientos para ${companyName} (${totalDuplicated} duplicados)`
  );

  return NextResponse.json({
    success: true,
    formato: 'CAMT.053 (ISO 20022)',
    resumen: {
      fichero: fileName,
      empresa: companyName,
      formato: 'CAMT.053 (ISO 20022 XML)',
      cuentas: accountsProcessed,
      totalTransacciones: totalImported,
      totalDuplicadas: totalDuplicated,
      errores: parseResult.errors,
      avisos: parseResult.warnings,
    },
    message: `${totalImported} movimientos importados desde CAMT.053${totalDuplicated > 0 ? ` (${totalDuplicated} duplicados omitidos)` : ''}`,
  });
}

// ============================================================================
// IMPORTACIÓN NORMA 43 (Legacy)
// ============================================================================

async function importNorma43(
  content: string,
  fileName: string,
  companyId: string,
  companyName: string
) {
  const parseResult = parseNorma43(content, fileName);

  if (parseResult.errors.length > 0 && parseResult.accounts.length === 0) {
    return NextResponse.json(
      { error: 'Error parseando fichero Norma 43', details: parseResult.errors },
      { status: 400 }
    );
  }

  let totalImported = 0;
  let totalDuplicated = 0;
  const accountsProcessed: Array<{
    iban: string;
    banco: string;
    titular: string;
    transacciones: number;
    duplicadas: number;
    saldoInicial: number;
    saldoFinal: number;
    periodo: string;
  }> = [];

  for (const account of parseResult.accounts) {
    const bankName = getBankName(account.bankCode);
    const connectionKey = `n43_${account.bankCode}_${account.branchCode}_${account.accountNumber}`;

    let connection = await prisma.bankConnection.findFirst({
      where: { companyId, proveedorItemId: connectionKey },
    });

    if (!connection) {
      connection = await prisma.bankConnection.create({
        data: {
          companyId,
          proveedor: 'norma43_import',
          provider: 'norma43',
          proveedorItemId: connectionKey,
          nombreBanco: bankName,
          tipoCuenta: 'corriente',
          ultimosDigitos: account.accountNumber.slice(-4),
          moneda: account.currency,
          estado: 'conectado',
          ultimaSync: new Date(),
          autoReconciliar: true,
          notificarErrores: true,
        },
      });
    } else {
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: { ultimaSync: new Date() },
      });
    }

    let accountImported = 0;
    let accountDuplicated = 0;

    for (const tx of account.transactions) {
      const txId = generateN43TxId(account, tx);

      const existing = await prisma.bankTransaction.findFirst({
        where: { proveedorTxId: txId },
      });

      if (existing) {
        accountDuplicated++;
        continue;
      }

      const classification = classifyTransaction(tx);

      await prisma.bankTransaction.create({
        data: {
          companyId,
          connectionId: connection.id,
          proveedorTxId: txId,
          fecha: tx.transactionDate,
          fechaContable: tx.valueDate,
          descripcion: tx.description || `Movimiento ${tx.commonConcept}`,
          monto: tx.signedAmount,
          moneda: account.currency,
          categoria: classification.categoriasugerida,
          tipoTransaccion: classification.tipo,
          referencia: tx.reference1 || tx.documentNumber || undefined,
          beneficiario: tx.conceptLines[0]?.trim() || undefined,
          rawData: {
            format: 'norma43',
            commonConcept: tx.commonConcept,
            ownConcept: tx.ownConcept,
            debitCredit: tx.debitCredit,
            conceptLines: tx.conceptLines,
          },
          estado: 'pendiente_revision',
        },
      });

      accountImported++;
    }

    totalImported += accountImported;
    totalDuplicated += accountDuplicated;

    const detected = detectCompanyFromAccount(account.bankCode, account.branchCode, account.accountNumber);

    accountsProcessed.push({
      iban: account.iban || `****${account.accountNumber.slice(-4)}`,
      banco: bankName,
      titular: detected?.companyName || companyName,
      transacciones: accountImported,
      duplicadas: accountDuplicated,
      saldoInicial: account.initialBalance,
      saldoFinal: account.finalBalance,
      periodo: `${account.startDate.toISOString().split('T')[0]} a ${account.endDate.toISOString().split('T')[0]}`,
    });
  }

  logger.info(
    `📥 Norma 43 importado: ${totalImported} movimientos para ${companyName} (${totalDuplicated} duplicados)`
  );

  return NextResponse.json({
    success: true,
    formato: 'Norma 43 (AEB Cuaderno 43)',
    resumen: {
      fichero: fileName,
      empresa: companyName,
      formato: 'Norma 43 (AEB Cuaderno 43)',
      cuentas: accountsProcessed,
      totalTransacciones: totalImported,
      totalDuplicadas: totalDuplicated,
      errores: parseResult.errors,
      avisos: parseResult.warnings,
    },
    message: `${totalImported} movimientos importados desde Norma 43${totalDuplicated > 0 ? ` (${totalDuplicated} duplicados omitidos)` : ''}`,
  });
}

// ============================================================================
// UTILIDADES
// ============================================================================

function generateCamt053TxId(iban: string, entry: CAMT053Entry): string {
  return [
    'camt053',
    iban.slice(-8),
    entry.bookingDate,
    entry.valueDate,
    entry.signedAmount.toFixed(2),
    (entry.reference || entry.description || '').substring(0, 30).replace(/[^a-zA-Z0-9]/g, ''),
  ].join('_');
}

function generateN43TxId(account: N43Account, tx: N43Transaction): string {
  return [
    'n43',
    account.bankCode,
    account.accountNumber,
    tx.transactionDate.toISOString().split('T')[0],
    tx.valueDate.toISOString().split('T')[0],
    tx.signedAmount.toFixed(2),
    tx.documentNumber || '',
    tx.reference1 || '',
  ].join('_');
}

// ============================================================================
// GET - Estadísticas
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
    }

    const connections = await prisma.bankConnection.findMany({
      where: {
        companyId,
        proveedor: { in: ['norma43_import', 'camt053_import'] },
      },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { ultimaSync: 'desc' },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentTransactions, pendingReview, reconciled] = await Promise.all([
      prisma.bankTransaction.count({
        where: {
          companyId,
          connection: { proveedor: { in: ['norma43_import', 'camt053_import'] } },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.bankTransaction.count({
        where: {
          companyId,
          connection: { proveedor: { in: ['norma43_import', 'camt053_import'] } },
          estado: 'pendiente_revision',
        },
      }),
      prisma.bankTransaction.count({
        where: {
          companyId,
          connection: { proveedor: { in: ['norma43_import', 'camt053_import'] } },
          estado: 'conciliado',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      cuentas: connections.map((c) => ({
        id: c.id,
        banco: c.nombreBanco,
        formato: c.proveedor === 'camt053_import' ? 'CAMT.053' : 'Norma 43',
        ultimosDigitos: c.ultimosDigitos,
        ultimaSync: c.ultimaSync,
        totalTransacciones: c._count.transactions,
      })),
      estadisticas: {
        transaccionesRecientes: recentTransactions,
        pendientesRevision: pendingReview,
        conciliadas: reconciled,
      },
    });
  } catch (error: any) {
    logger.error('Error obteniendo datos bancarios:', error);
    return NextResponse.json(
      { error: 'Error obteniendo datos', details: error.message },
      { status: 500 }
    );
  }
}
