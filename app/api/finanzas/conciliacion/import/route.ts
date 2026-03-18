/**
 * POST /api/finanzas/conciliacion/import
 *
 * Importa extractos bancarios para conciliación.
 * Formatos soportados:
 *   - Norma 43 (.txt, .n43, .c43) — Formato estándar español
 *   - CAMT.053 (.xml) — ISO 20022
 *   - CSV (.csv) — Formato genérico (Fecha, Concepto, Importe, Saldo)
 *
 * Requiere sesión admin/superadmin.
 *
 * FormData:
 *   file: File (obligatorio)
 *   companyId: string (opcional, usa el de la sesión)
 *   accountId: string (opcional, busca por IBAN/cuenta)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { parseNorma43, isNorma43 } from '@/lib/parsers/norma43-parser';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// ============================================================================
// CAMT.053 XML PARSER (inline, same logic as import-bank-movements-camt053.ts)
// ============================================================================

interface CamtEntry {
  amount: number;
  currency: string;
  creditDebit: 'CRDT' | 'DBIT';
  bookingDate: string;
  valueDate: string;
  description: string;
  creditorName?: string;
  debtorName?: string;
  reference?: string;
}

interface CamtStatement {
  iban: string;
  ownerName: string;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  closingBalance: number;
  entries: CamtEntry[];
}

function getTagText(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tag}[^>]*>([^<]*)<\\/(?:[a-zA-Z0-9]+:)?${tag}>`, 's');
  const m = xml.match(re);
  return m ? m[1].trim() : undefined;
}

function getNestedTagText(xml: string, parent: string, child: string): string | undefined {
  const re = new RegExp(`<(?:[a-zA-Z0-9]+:)?${parent}[^>]*>(.*?)<\\/(?:[a-zA-Z0-9]+:)?${parent}>`, 's');
  const m = xml.match(re);
  return m ? getTagText(m[1], child) : undefined;
}

function getAllBlocks(xml: string, tag: string): string[] {
  const blocks: string[] = [];
  const re = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9]+:)?${tag}>`, 'g');
  let m;
  while ((m = re.exec(xml)) !== null) blocks.push(m[0]);
  return blocks;
}

function parseCamt053(xml: string): CamtStatement {
  const stmtBlock = getAllBlocks(xml, 'Stmt')[0];
  if (!stmtBlock) throw new Error('No se encontró bloque Stmt en el XML CAMT.053');

  const acctBlock = getAllBlocks(stmtBlock, 'Acct')[0] || '';
  const iban = getTagText(acctBlock, 'IBAN') || '';
  const ownerName = getNestedTagText(acctBlock, 'Ownr', 'Nm') || '';

  const frToBlock = getAllBlocks(stmtBlock, 'FrToDt')[0] || '';
  const fromDate = getTagText(frToBlock, 'FrDtTm') || '';
  const toDate = getTagText(frToBlock, 'ToDtTm') || '';

  // Balances
  let openingBalance = 0;
  let closingBalance = 0;
  for (const bal of getAllBlocks(stmtBlock, 'Bal')) {
    const code = getNestedTagText(bal, 'CdOrPrtry', 'Cd');
    const amtM = bal.match(/Amt[^>]*>([^<]*)</);
    const amt = amtM ? parseFloat(amtM[1]) : 0;
    const sign = getTagText(bal, 'CdtDbtInd');
    const signed = sign === 'DBIT' ? -amt : amt;
    if (code === 'OPBD') openingBalance = signed;
    if (code === 'CLBD') closingBalance = signed;
  }

  // Entries
  const entries: CamtEntry[] = [];
  for (const entryXml of getAllBlocks(stmtBlock, 'Ntry')) {
    const amtM = entryXml.match(/<(?:[a-zA-Z0-9]+:)?Amt[^>]*Ccy="([^"]*)"[^>]*>([^<]*)</);
    const currency = amtM ? amtM[1] : 'EUR';
    const amount = amtM ? parseFloat(amtM[2]) : 0;

    const cdM = entryXml.match(/<(?:[a-zA-Z0-9]+:)?CdtDbtInd>([^<]*)<\//);
    const creditDebit = (cdM ? cdM[1].trim() : 'DBIT') as 'CRDT' | 'DBIT';

    const bookgBlock = getAllBlocks(entryXml, 'BookgDt')[0] || '';
    const bookingDate = getTagText(bookgBlock, 'DtTm') || getTagText(bookgBlock, 'Dt') || '';

    const valBlock = getAllBlocks(entryXml, 'ValDt')[0] || '';
    const valueDate = getTagText(valBlock, 'Dt') || getTagText(valBlock, 'DtTm') || bookingDate;

    // Description from remittance info or additional info
    const txDtls = getAllBlocks(entryXml, 'TxDtls')[0] || '';
    const rmtInf = getAllBlocks(txDtls, 'RmtInf')[0] || '';
    const ustrd = getTagText(rmtInf, 'Ustrd') || '';
    const addtlInfo = getTagText(entryXml, 'AddtlNtryInf') || '';
    const description = ustrd || addtlInfo || '';

    // Parties
    const rltdPties = getAllBlocks(txDtls, 'RltdPties')[0] || '';
    const creditorName = getNestedTagText(rltdPties, 'Cdtr', 'Nm') || undefined;
    const debtorName = getNestedTagText(rltdPties, 'Dbtr', 'Nm') || undefined;

    // Reference
    const refs = getAllBlocks(txDtls, 'Refs')[0] || '';
    const reference = getTagText(refs, 'EndToEndId') || getTagText(refs, 'AcctSvcrRef') || undefined;

    entries.push({
      amount,
      currency,
      creditDebit,
      bookingDate: bookingDate.split('T')[0],
      valueDate: valueDate.split('T')[0],
      description,
      creditorName,
      debtorName,
      reference,
    });
  }

  return { iban, ownerName, fromDate: fromDate.split('T')[0], toDate: toDate.split('T')[0], openingBalance, closingBalance, entries };
}

// ============================================================================
// CSV PARSER (simple)
// ============================================================================

interface CsvEntry {
  date: string;
  description: string;
  amount: number;
  balance?: number;
}

function parseCsvStatement(content: string): CsvEntry[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const entries: CsvEntry[] = [];
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/[;,\t]/);
    if (parts.length < 3) continue;

    const dateRaw = parts[0].trim();
    const description = parts[1].trim();
    const amountRaw = parts[2].trim().replace(/[€\s]/g, '').replace(',', '.');
    const balanceRaw = parts[3]?.trim().replace(/[€\s]/g, '').replace(',', '.');

    const amount = parseFloat(amountRaw);
    if (isNaN(amount)) continue;

    // Parse date (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
    let date = dateRaw;
    const ddmmyyyy = dateRaw.match(/^(\d{2})[/\-](\d{2})[/\-](\d{4})$/);
    if (ddmmyyyy) {
      date = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
    }

    entries.push({
      date,
      description,
      amount,
      balance: balanceRaw ? parseFloat(balanceRaw) : undefined,
    });
  }

  return entries;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const companyIdParam = formData.get('companyId') as string;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Archivo demasiado grande (máx. 10MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const content = buffer.toString('utf-8');
    const fileName = (file.name || '').toLowerCase();

    const prisma = await getPrisma();

    // Resolve company
    const companyId = companyIdParam || (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No se pudo determinar la empresa' }, { status: 400 });
    }

    logger.info('[Conciliacion Import]', {
      fileName: file.name,
      size: file.size,
      companyId,
      user: (session.user as any).email,
    });

    // ── Detect format and parse ──
    let format: 'norma43' | 'camt053' | 'csv';
    let movements: Array<{
      date: string;
      valueDate?: string;
      amount: number;
      description: string;
      creditDebit: 'CRDT' | 'DBIT';
      reference?: string;
      creditorName?: string;
      debtorName?: string;
      iban?: string;
    }> = [];
    let statementInfo: Record<string, unknown> = {};

    if (
      fileName.endsWith('.xml') ||
      content.trimStart().startsWith('<?xml') ||
      content.includes('<Document') ||
      content.includes('<Stmt>')
    ) {
      // CAMT.053 XML
      format = 'camt053';
      try {
        const stmt = parseCamt053(content);
        statementInfo = {
          format: 'CAMT.053',
          iban: stmt.iban,
          owner: stmt.ownerName,
          fromDate: stmt.fromDate,
          toDate: stmt.toDate,
          openingBalance: stmt.openingBalance,
          closingBalance: stmt.closingBalance,
          totalEntries: stmt.entries.length,
        };
        movements = stmt.entries.map((e) => ({
          date: e.bookingDate,
          valueDate: e.valueDate,
          amount: e.creditDebit === 'DBIT' ? -e.amount : e.amount,
          description: e.description,
          creditDebit: e.creditDebit,
          reference: e.reference,
          creditorName: e.creditorName,
          debtorName: e.debtorName,
          iban: stmt.iban,
        }));
      } catch (err: any) {
        return NextResponse.json(
          { error: `Error parseando CAMT.053: ${err.message}` },
          { status: 400 }
        );
      }
    } else if (
      fileName.endsWith('.n43') ||
      fileName.endsWith('.c43') ||
      (fileName.endsWith('.txt') && isNorma43(content)) ||
      isNorma43(content)
    ) {
      // Norma 43
      format = 'norma43';
      const result = parseNorma43(content);
      if (result.statements.length === 0) {
        return NextResponse.json(
          { error: 'No se encontraron extractos en el archivo Norma 43' },
          { status: 400 }
        );
      }

      const stmt = result.statements[0]; // Tomar el primer extracto
      statementInfo = {
        format: 'Norma 43',
        bankCode: stmt.bankCode,
        branchCode: stmt.branchCode,
        accountNumber: stmt.accountNumber,
        fullAccount: stmt.fullAccount,
        startDate: stmt.startDate,
        endDate: stmt.endDate,
        openingBalance: stmt.openingBalance,
        closingBalance: stmt.closingBalance,
        debitCount: stmt.debitCount,
        creditCount: stmt.creditCount,
        totalStatements: result.statements.length,
        totalMovements: result.totalMovements,
        currency: stmt.currency,
      };

      // Flatten all movements from all statements
      for (const s of result.statements) {
        for (const m of s.movements) {
          movements.push({
            date: m.date,
            valueDate: m.valueDate,
            amount: m.amount,
            description: m.description || `${m.commonConcept}/${m.ownConcept}`,
            creditDebit: m.creditDebit,
            reference: m.documentNumber || m.reference1,
          });
        }
      }
    } else if (fileName.endsWith('.csv')) {
      // CSV genérico
      format = 'csv';
      const entries = parseCsvStatement(content);
      statementInfo = {
        format: 'CSV',
        totalEntries: entries.length,
      };
      movements = entries.map((e) => ({
        date: e.date,
        amount: e.amount,
        description: e.description,
        creditDebit: (e.amount >= 0 ? 'CRDT' : 'DBIT') as 'CRDT' | 'DBIT',
      }));
    } else {
      return NextResponse.json(
        {
          error:
            'Formato no reconocido. Formatos aceptados: Norma 43 (.txt, .n43, .c43), CAMT.053 (.xml), CSV (.csv)',
        },
        { status: 400 }
      );
    }

    if (movements.length === 0) {
      return NextResponse.json({
        success: true,
        format,
        imported: 0,
        duplicates: 0,
        errors: 0,
        message: 'El archivo no contiene movimientos',
        statement: statementInfo,
      });
    }

    // ── Find or create BankConnection ──
    let connectionId: string;

    // Try to find existing connection for this company
    const existingConnection = await prisma.bankConnection.findFirst({
      where: {
        companyId,
        estado: 'conectado',
      },
      select: { id: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (existingConnection) {
      connectionId = existingConnection.id;
    } else {
      // Create a manual import connection
      const conn = await prisma.bankConnection.create({
        data: {
          companyId,
          proveedor: 'import_manual',
          provider: 'import_manual',
          nombreBanco: format === 'norma43'
            ? `Banco ${(statementInfo as any).bankCode || 'Manual'}`
            : format === 'camt053'
            ? 'Bankinter' // CAMT usually from Bankinter
            : 'Import Manual',
          tipoCuenta: 'corriente',
          moneda: 'EUR',
          estado: 'conectado',
        },
      });
      connectionId = conn.id;
    }

    // ── Insert BankTransactions ──
    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    for (const mov of movements) {
      // Generate unique proveedorTxId
      const txId = `${format}-${companyId}-${mov.date}-${Math.abs(mov.amount).toFixed(2)}-${(mov.description || '').substring(0, 30).replace(/\s+/g, '_')}-${mov.reference || imported}`;

      try {
        // Check for duplicate
        const existing = await prisma.bankTransaction.findFirst({
          where: {
            proveedorTxId: txId,
          },
          select: { id: true },
        });

        if (existing) {
          duplicates++;
          continue;
        }

        await prisma.bankTransaction.create({
          data: {
            companyId,
            connectionId,
            proveedorTxId: txId,
            fecha: new Date(mov.date),
            fechaContable: mov.valueDate ? new Date(mov.valueDate) : undefined,
            descripcion: mov.description || 'Sin descripción',
            monto: mov.amount,
            moneda: 'EUR',
            beneficiario: mov.creditorName || mov.debtorName || undefined,
            referencia: mov.reference || undefined,
            creditorName: mov.creditorName || undefined,
            debtorName: mov.debtorName || undefined,
            tipoTransaccion: mov.creditDebit === 'CRDT' ? 'ingreso' : 'gasto',
            estado: 'pendiente_revision',
          },
        });
        imported++;
      } catch (err: any) {
        errors++;
        // Duplicate proveedorTxId errors are expected
        if (err.code === 'P2002') {
          duplicates++;
        } else {
          logger.warn('[Conciliacion Import] Error inserting:', err.message);
        }
      }
    }

    logger.info('[Conciliacion Import] Result:', {
      format,
      imported,
      duplicates,
      errors,
      total: movements.length,
    });

    return NextResponse.json({
      success: true,
      format,
      imported,
      duplicates,
      errors,
      total: movements.length,
      statement: statementInfo,
      message: `Importados ${imported} movimientos (${duplicates} duplicados, ${errors} errores) de ${movements.length} total`,
    });
  } catch (error: any) {
    logger.error('[Conciliacion Import] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error importando extracto bancario' },
      { status: 500 }
    );
  }
}
