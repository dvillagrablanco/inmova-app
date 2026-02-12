/**
 * Import Movimientos Bancarios desde archivos CAMT.053 (ISO 20022)
 * 
 * Parsea extractos bancarios de Bankinter en formato CAMT.053 XML y los importa
 * como BankTransactions en la base de datos para las sociedades Rovida y Vidaro (Viroda).
 * 
 * Sociedades:
 *   - ROVIDA S L (IBAN: ES5601280250590100083954) → Bankinter
 *   - VIRODA INVERSIONES SL (IBAN: ES8801280250590100081826) → Bankinter (= Vidaro)
 * 
 * Archivos fuente (CAMT.053 XML):
 *   - data/rovida/bancos/Fichero_peticion_2025-11-14_2025-12-31.xml (302 movimientos)
 *   - data/rovida/bancos/Fichero_peticion_2026-01-01_2026-02-12.xml (170 movimientos)
 *   - data/vidaro/bancos/Fichero_peticion_2025-01-01_2025-02-28.xml (276 movimientos)
 *   - data/vidaro/bancos/Fichero_peticion_2025-03-01_2025-04-30.xml (318 movimientos)
 *   - data/vidaro/bancos/Fichero_peticion_2025-05-01_2025-06-30.xml (296 movimientos)
 *   - data/vidaro/bancos/Fichero_peticion_2025-07-01_2025-08-31.xml (349 movimientos)
 *   - data/vidaro/bancos/Fichero_peticion_2025-09-01_2025-10-31.xml (338 movimientos)
 *   - data/vidaro/bancos/Fichero_peticion_2025-11-01_2025-12-31.xml (376 movimientos)
 *   - data/vidaro/bancos/Fichero_peticion_2026-01-01_2026-02-12.xml (298 movimientos)
 * 
 * Uso: npx tsx scripts/import-bank-movements-camt053.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ============================================================================
// CAMT.053 XML PARSER
// ============================================================================

// Simple XML parser for CAMT.053 - no external deps needed
interface CamtEntry {
  amount: number;
  currency: string;
  creditDebit: 'CRDT' | 'DBIT'; // Credit = income, Debit = expense
  status: string;
  bookingDate: string;
  valueDate: string;
  domainCode?: string;
  familyCode?: string;
  subFamilyCode?: string;
  debtorName?: string;
  ultimateDebtorName?: string;
  creditorName?: string;
  ultimateCreditorName?: string;
  creditorId?: string;
  debtorId?: string;
  mandateId?: string;
  remittanceInfo?: string;
  rawXml: string;
}

interface CamtStatement {
  iban: string;
  ownerName: string;
  bankName: string;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  closingBalance: number;
  entries: CamtEntry[];
}

function getTagText(xml: string, tagName: string): string | undefined {
  // Match tag considering namespace prefix
  const regex = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tagName}[^>]*>([^<]*)<\\/(?:[a-zA-Z0-9]+:)?${tagName}>`, 's');
  const match = xml.match(regex);
  return match ? match[1].trim() : undefined;
}

function getNestedTagText(xml: string, parentTag: string, childTag: string): string | undefined {
  const parentRegex = new RegExp(`<(?:[a-zA-Z0-9]+:)?${parentTag}[^>]*>(.*?)<\\/(?:[a-zA-Z0-9]+:)?${parentTag}>`, 's');
  const parentMatch = xml.match(parentRegex);
  if (!parentMatch) return undefined;
  return getTagText(parentMatch[1], childTag);
}

function getAttr(xml: string, tagName: string, attrName: string): string | undefined {
  const regex = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tagName}[^>]*${attrName}="([^"]*)"`, 's');
  const match = xml.match(regex);
  return match ? match[1].trim() : undefined;
}

function getAllBlocks(xml: string, tagName: string): string[] {
  const blocks: string[] = [];
  const regex = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9]+:)?${tagName}>`, 'g');
  let match;
  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[0]);
  }
  return blocks;
}

function parseCamt053(xmlContent: string): CamtStatement {
  // Extract statement block
  const stmtBlock = getAllBlocks(xmlContent, 'Stmt')[0];
  if (!stmtBlock) throw new Error('No Stmt block found');

  // Account info
  const acctBlock = getAllBlocks(stmtBlock, 'Acct')[0] || '';
  const iban = getTagText(acctBlock, 'IBAN') || 'UNKNOWN';
  const ownerName = getNestedTagText(acctBlock, 'Ownr', 'Nm') || 'UNKNOWN';
  
  // Bank info
  const svcrBlock = getAllBlocks(acctBlock, 'Svcr')[0] || '';
  const bankName = getTagText(svcrBlock, 'Nm') || 'UNKNOWN';

  // Date range
  const frToDtBlock = getAllBlocks(stmtBlock, 'FrToDt')[0] || '';
  const fromDate = getTagText(frToDtBlock, 'FrDtTm') || '';
  const toDate = getTagText(frToDtBlock, 'ToDtTm') || '';

  // Balances
  const balBlocks = getAllBlocks(stmtBlock, 'Bal');
  let openingBalance = 0;
  let closingBalance = 0;
  for (const bal of balBlocks) {
    const code = getNestedTagText(bal, 'CdOrPrtry', 'Cd');
    const amtMatch = bal.match(/Amt[^>]*>([^<]*)</);
    const amt = amtMatch ? parseFloat(amtMatch[1]) : 0;
    const cdtDbt = getTagText(bal, 'CdtDbtInd');
    const signedAmt = cdtDbt === 'DBIT' ? -amt : amt;
    
    if (code === 'OPBD') openingBalance = signedAmt;
    if (code === 'CLBD') closingBalance = signedAmt;
  }

  // Entries
  const entryBlocks = getAllBlocks(stmtBlock, 'Ntry');
  const entries: CamtEntry[] = [];

  for (const entryXml of entryBlocks) {
    // Amount
    const amtMatch = entryXml.match(/<(?:[a-zA-Z0-9]+:)?Amt[^>]*Ccy="([^"]*)"[^>]*>([^<]*)</);
    const currency = amtMatch ? amtMatch[1] : 'EUR';
    const amount = amtMatch ? parseFloat(amtMatch[2]) : 0;
    
    // Credit/Debit indicator (first level, not nested)
    const cdtDbtMatch = entryXml.match(/<(?:[a-zA-Z0-9]+:)?CdtDbtInd>([^<]*)<\//);
    const creditDebit = (cdtDbtMatch ? cdtDbtMatch[1].trim() : 'DBIT') as 'CRDT' | 'DBIT';
    
    // Status
    const status = getTagText(entryXml, 'Sts') || 'BOOK';
    
    // Booking Date
    const bookgDtBlock = getAllBlocks(entryXml, 'BookgDt')[0] || '';
    const bookingDate = getTagText(bookgDtBlock, 'DtTm') || getTagText(bookgDtBlock, 'Dt') || '';
    
    // Value Date
    const valDtBlock = getAllBlocks(entryXml, 'ValDt')[0] || '';
    const valueDate = getTagText(valDtBlock, 'Dt') || getTagText(valDtBlock, 'DtTm') || bookingDate;
    
    // Transaction codes
    const bkTxCdBlock = getAllBlocks(entryXml, 'BkTxCd')[0] || '';
    const domainCode = getNestedTagText(bkTxCdBlock, 'Domn', 'Cd');
    const fmlyBlock = getAllBlocks(bkTxCdBlock, 'Fmly')[0] || '';
    const familyCode = getTagText(fmlyBlock, 'Cd');
    const subFamilyCode = getTagText(fmlyBlock, 'SubFmlyCd');

    // Transaction details
    const txDtlsBlock = getAllBlocks(entryXml, 'TxDtls')[0] || '';
    const rltdPtiesBlock = getAllBlocks(txDtlsBlock, 'RltdPties')[0] || '';
    
    // Debtor
    const dbtrBlock = getAllBlocks(rltdPtiesBlock, 'Dbtr')[0] || '';
    const debtorName = getTagText(dbtrBlock, 'Nm');
    
    const ultmtDbtrBlock = getAllBlocks(rltdPtiesBlock, 'UltmtDbtr')[0] || '';
    const ultimateDebtorName = getTagText(ultmtDbtrBlock, 'Nm');
    
    // Creditor
    const cdtrBlocks = getAllBlocks(rltdPtiesBlock, 'Cdtr');
    const cdtrBlock = cdtrBlocks[0] || '';
    const creditorName = getTagText(cdtrBlock, 'Nm');
    
    const ultmtCdtrBlock = getAllBlocks(rltdPtiesBlock, 'UltmtCdtr')[0] || '';
    const ultimateCreditorName = getTagText(ultmtCdtrBlock, 'Nm');
    
    // IDs from Cdtr
    const cdtrIdBlock = getAllBlocks(cdtrBlock, 'Id')[0] || '';
    const creditorId = getTagText(cdtrIdBlock, 'Id');
    
    // IDs from UltmtDbtr
    const dbtrIdBlock = getAllBlocks(ultmtDbtrBlock, 'Id')[0] || '';
    const debtorId = getTagText(dbtrIdBlock, 'Id');
    
    // Mandate ID
    const refsBlock = getAllBlocks(txDtlsBlock, 'Refs')[0] || '';
    const mandateId = getTagText(refsBlock, 'MndtId');
    
    // Remittance info
    const rmtInfBlock = getAllBlocks(txDtlsBlock, 'RmtInf')[0] || '';
    const remittanceInfo = getTagText(rmtInfBlock, 'Ustrd');

    entries.push({
      amount,
      currency,
      creditDebit,
      status,
      bookingDate,
      valueDate,
      domainCode,
      familyCode,
      subFamilyCode,
      debtorName,
      ultimateDebtorName,
      creditorName,
      ultimateCreditorName,
      creditorId,
      debtorId,
      mandateId,
      remittanceInfo,
      rawXml: entryXml.substring(0, 2000), // Truncate for storage
    });
  }

  return {
    iban,
    ownerName,
    bankName,
    fromDate,
    toDate,
    openingBalance,
    closingBalance,
    entries,
  };
}

// ============================================================================
// CLASIFICACIÓN DE MOVIMIENTOS
// ============================================================================

function classifyBankMovement(entry: CamtEntry): {
  categoria: string;
  subcategoria: string;
  tipoTransaccion: string;
  descripcionLimpia: string;
} {
  const debtor = (entry.debtorName || '').toUpperCase();
  const creditor = (entry.creditorName || '').toUpperCase();
  const ultimateCreditor = (entry.ultimateCreditorName || '').toUpperCase();
  const remittance = (entry.remittanceInfo || '').toUpperCase();
  const creditorId = (entry.creditorId || '').toUpperCase();
  const mandateId = (entry.mandateId || '').toUpperCase();
  const allText = `${debtor} ${creditor} ${ultimateCreditor} ${remittance} ${creditorId} ${mandateId}`;
  
  let categoria = 'otros';
  let subcategoria = '';
  let tipoTransaccion = 'transfer';
  
  // Determine transaction type from family codes
  if (entry.familyCode === 'RDDT' && entry.subFamilyCode === 'BBDD') {
    tipoTransaccion = 'direct_debit';
  } else if (entry.familyCode === 'RCDT' && entry.subFamilyCode === 'ESCT') {
    tipoTransaccion = 'transfer';
  } else if (entry.familyCode === 'ICDT') {
    tipoTransaccion = 'transfer';
  } else if (entry.subFamilyCode === 'NTAV') {
    tipoTransaccion = 'internal';
  }
  
  // Income classifications
  if (entry.creditDebit === 'CRDT') {
    // Rental income
    if (allText.includes('ALQUILER') || allText.includes('RENTA') || allText.includes('RENT')
        || allText.includes('ARREND') || mandateId.includes('ARIA') || mandateId.includes('ALQUILER')) {
      categoria = 'ingreso_alquiler';
      
      if (allText.includes('GARAJE') || allText.includes('PLAZA') || allText.includes('PARKING')) {
        subcategoria = 'garaje';
      } else if (allText.includes('LOCAL')) {
        subcategoria = 'local_comercial';
      } else if (allText.includes('OFICINA')) {
        subcategoria = 'oficina';
      } else if (allText.includes('NAVE') || allText.includes('CUBA')) {
        subcategoria = 'nave';
      } else {
        subcategoria = 'vivienda';
      }
    }
    // Dividend income
    else if (allText.includes('DIVIDEND') || allText.includes('CUPÓN') || allText.includes('CUPON')) {
      categoria = 'ingreso_inversiones';
      subcategoria = 'dividendos';
    }
    // Interest
    else if (allText.includes('INTERÉS') || allText.includes('INTERES') || allText.includes('INTERESES')) {
      categoria = 'ingreso_inversiones';
      subcategoria = 'intereses';
    }
    // Transfers between own accounts
    else if (allText.includes('TRASPASO') || allText.includes('TRANSFERENCIA PROPIA') 
             || allText.includes('VIRODA') || allText.includes('ROVIDA') || allText.includes('VIDARO')) {
      categoria = 'transferencia_interna';
      subcategoria = 'traspaso_cuentas';
    }
    // Generic income
    else {
      categoria = 'ingreso_otro';
    }
  }
  // Expense classifications 
  else {
    // Community fees
    if (allText.includes('COMUNIDAD') || allText.includes('C.P.') || allText.includes('C.P ') 
        || allText.includes('CDAD') || allText.includes('CUOTA COMUNIDAD') || allText.includes('MANC')) {
      categoria = 'gasto_comunidad';
      subcategoria = 'cuota_comunidad';
    }
    // Insurance
    else if (allText.includes('SEGURO') || allText.includes('MAPFRE') || allText.includes('ASEGURADORA')
             || allText.includes('ZURICH') || allText.includes('ALLIANZ') || allText.includes('AXA')
             || allText.includes('CASER') || allText.includes('GENERALI') || allText.includes('SANITAS')
             || allText.includes('ASISA')) {
      categoria = 'gasto_seguro';
      subcategoria = 'seguro_inmueble';
    }
    // Taxes
    else if (allText.includes('IMPUESTO') || allText.includes('TRIBUTO') || allText.includes('I.B.I')
             || allText.includes('IBI') || allText.includes('BASURA') || allText.includes('TASA')
             || allText.includes('HACIENDA') || allText.includes('AEAT') || allText.includes('AGENCIA TRIBUTARIA')
             || allText.includes('AYUNTAMIENTO')) {
      categoria = 'gasto_impuesto';
      subcategoria = allText.includes('IBI') || allText.includes('I.B.I') ? 'ibi' : 'otros_impuestos';
    }
    // Utilities
    else if (allText.includes('ELECTRICIDAD') || allText.includes('ENDESA') || allText.includes('IBERDROLA')
             || allText.includes('NATURGY') || allText.includes('AGUA') || allText.includes('GAS')
             || allText.includes('LUZ') || allText.includes('SUMINISTRO') || allText.includes('REPSOL')
             || allText.includes('O2') || allText.includes('FIBRA') || allText.includes('TELEFON')
             || allText.includes('VODAFONE') || allText.includes('ORANGE') || allText.includes('MOVISTAR')) {
      categoria = 'gasto_suministros';
      subcategoria = allText.includes('O2') || allText.includes('FIBRA') || allText.includes('TELEFON') 
        ? 'telecomunicaciones' : 'servicios_basicos';
    }
    // Maintenance / Repairs
    else if (allText.includes('MANTENIMIENTO') || allText.includes('REPARACION') || allText.includes('REPARACIÓN')
             || allText.includes('REFORMA') || allText.includes('OBRA') || allText.includes('FICHET')
             || allText.includes('CUBOS') || allText.includes('SERVICIO FIJO') || allText.includes('LIMPIEZA')) {
      categoria = 'gasto_mantenimiento';
      subcategoria = 'mantenimiento_general';
    }
    // Bank fees
    else if (allText.includes('COMISIÓN') || allText.includes('COMISION') || allText.includes('BANKINTER')
             || allText.includes('GASTOS BANCARIOS') || allText.includes('SWIFT')
             || allText.includes('TRAN.EMITIDA') || allText.includes('COMISIONES')) {
      categoria = 'gasto_bancario';
      subcategoria = 'comisiones';
    }
    // Professional services
    else if (allText.includes('ASESOR') || allText.includes('NOTARI') || allText.includes('ABOGAD')
             || allText.includes('GESTOR') || allText.includes('PROFESIONAL') || allText.includes('CONSULTOR')
             || allText.includes('FAMILY OFFICE')) {
      categoria = 'gasto_profesional';
      subcategoria = 'asesorias';
    }
    // Payroll
    else if (allText.includes('NÓMINA') || allText.includes('NOMINA') || allText.includes('SUELDO')
             || allText.includes('SALARIO') || allText.includes('SEG. SOCIAL') || allText.includes('SEGURIDAD SOCIAL')
             || allText.includes('TGSS')) {
      categoria = 'gasto_personal';
      subcategoria = allText.includes('SOCIAL') || allText.includes('TGSS') ? 'seguridad_social' : 'nominas';
    }
    // Internal transfers
    else if (allText.includes('TRASPASO') || allText.includes('VIRODA') || allText.includes('ROVIDA') 
             || allText.includes('VIDARO') || allText.includes('DISFASA') || allText.includes('FACUNDO')) {
      categoria = 'transferencia_interna';
      subcategoria = 'traspaso_grupo';
    }
    // Generic expense
    else {
      categoria = 'gasto_otro';
    }
  }
  
  // Build clean description
  let descripcionLimpia = '';
  if (entry.creditDebit === 'CRDT') {
    // For credits, the creditor is usually the beneficiary
    const name = entry.creditorName || entry.debtorName || '';
    // Clean up the name - remove account numbers and codes
    descripcionLimpia = cleanName(name);
    if (entry.remittanceInfo) {
      descripcionLimpia += ` - ${entry.remittanceInfo.substring(0, 100)}`;
    }
    if (entry.creditorId && entry.creditorId.length > 5) {
      descripcionLimpia += ` (${entry.creditorId.substring(0, 60)})`;
    }
  } else {
    // For debits, the debtor usually has the payee info
    const name = entry.debtorName || entry.creditorName || '';
    descripcionLimpia = cleanName(name);
    if (entry.remittanceInfo) {
      descripcionLimpia += ` - ${entry.remittanceInfo.substring(0, 100)}`;
    }
  }
  
  if (!descripcionLimpia || descripcionLimpia.trim() === '-') {
    descripcionLimpia = `Movimiento ${entry.creditDebit === 'CRDT' ? 'ingreso' : 'gasto'} ${entry.bookingDate}`;
  }
  
  return { categoria, subcategoria, tipoTransaccion, descripcionLimpia };
}

function cleanName(name: string): string {
  if (!name) return '';
  // Remove leading numbers, codes, and whitespace patterns typical of bank data
  let cleaned = name
    .replace(/^[A-Z0-9]{2,4}\s*/, '') // Remove short prefix codes like "CORE", "MX"
    .replace(/^\d{10,}\s*/, '') // Remove long number sequences
    .replace(/\s{2,}/g, ' ') // Normalize whitespace
    .trim();
  
  // If cleaned is too short, use original
  if (cleaned.length < 3) cleaned = name.trim();
  
  return cleaned.substring(0, 200);
}

// ============================================================================
// IMPORT LOGIC
// ============================================================================

interface SociedadConfig {
  nombre: string;
  searchName: string;  // For Prisma findFirst
  iban: string;
  dataDir: string;
}

const SOCIEDADES: SociedadConfig[] = [
  {
    nombre: 'Rovida',
    searchName: 'Rovida',
    iban: 'ES5601280250590100083954',
    dataDir: 'data/rovida/bancos',
  },
  {
    nombre: 'Viroda Inversiones',
    searchName: 'Viroda',
    iban: 'ES8801280250590100081826',
    dataDir: 'data/vidaro/bancos',
  },
];

async function importSociedad(config: SociedadConfig) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  IMPORTANDO: ${config.nombre}`);
  console.log(`  IBAN: ${config.iban}`);
  console.log(`${'='.repeat(70)}`);

  // 1. Find company
  const company = await prisma.company.findFirst({
    where: { nombre: { contains: config.searchName, mode: 'insensitive' } },
  });

  if (!company) {
    console.error(`  Empresa ${config.searchName} no encontrada en BD. Saltando.`);
    return { created: 0, skipped: 0, errors: 0 };
  }
  console.log(`  Empresa: ${company.nombre} (${company.id})`);

  // 2. Read all XML files
  const bancosDir = path.resolve(__dirname, '..', config.dataDir);
  if (!fs.existsSync(bancosDir)) {
    console.error(`  Directorio no encontrado: ${bancosDir}`);
    return { created: 0, skipped: 0, errors: 0 };
  }

  const xmlFiles = fs.readdirSync(bancosDir)
    .filter(f => f.endsWith('.xml'))
    .sort();
  
  console.log(`  Archivos XML encontrados: ${xmlFiles.length}`);

  // 3. Parse all files
  const allEntries: Array<CamtEntry & { sourceFile: string; statementIban: string }> = [];
  
  for (const file of xmlFiles) {
    const filePath = path.join(bancosDir, file);
    console.log(`\n  Parseando: ${file}`);
    
    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    const statement = parseCamt053(xmlContent);
    
    console.log(`    Owner: ${statement.ownerName}`);
    console.log(`    IBAN: ${statement.iban}`);
    console.log(`    Periodo: ${statement.fromDate} → ${statement.toDate}`);
    console.log(`    Saldo Apertura: ${statement.openingBalance.toLocaleString('es-ES')}€`);
    console.log(`    Saldo Cierre: ${statement.closingBalance.toLocaleString('es-ES')}€`);
    console.log(`    Movimientos: ${statement.entries.length}`);
    
    for (const entry of statement.entries) {
      allEntries.push({
        ...entry,
        sourceFile: file,
        statementIban: statement.iban,
      });
    }
  }

  console.log(`\n  Total movimientos parseados: ${allEntries.length}`);

  // 4. Deduplicate entries by date + amount + description
  // Sort by booking date for consistent dedup
  allEntries.sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));
  
  const seen = new Set<string>();
  const uniqueEntries: typeof allEntries = [];
  let duplicates = 0;
  
  for (const entry of allEntries) {
    // Create a unique key based on date, amount, direction, and beneficiary
    const beneficiary = entry.creditDebit === 'CRDT' 
      ? (entry.creditorName || entry.debtorName || '') 
      : (entry.debtorName || entry.creditorName || '');
    const key = `${entry.bookingDate}|${entry.amount}|${entry.creditDebit}|${beneficiary.substring(0, 30)}|${(entry.remittanceInfo || '').substring(0, 30)}`;
    
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    uniqueEntries.push(entry);
  }
  
  if (duplicates > 0) {
    console.log(`  Duplicados eliminados: ${duplicates}`);
    console.log(`  Movimientos únicos: ${uniqueEntries.length}`);
  }

  // 5. Create or find BankConnection
  let connection = await prisma.bankConnection.findFirst({
    where: {
      companyId: company.id,
      proveedor: 'bankinter_camt053',
    },
  });

  if (!connection) {
    connection = await prisma.bankConnection.create({
      data: {
        companyId: company.id,
        proveedor: 'bankinter_camt053',
        provider: 'bankinter',
        proveedorItemId: config.iban, // IBAN completo como ID del item
        nombreBanco: 'Bankinter',
        tipoCuenta: 'corriente',
        ultimosDigitos: config.iban.slice(-4),
        moneda: 'EUR',
        estado: 'conectado',
        ultimaSync: new Date(),
        autoReconciliar: true,
        notificarErrores: true,
      },
    });
    console.log(`  BankConnection creada: ${connection.id} (IBAN: ${config.iban})`);
  } else {
    // Update last sync and IBAN if missing
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        ultimaSync: new Date(),
        proveedorItemId: config.iban,
      },
    });
    console.log(`  BankConnection existente: ${connection.id}`);
  }

  // 6. Delete previous transactions for this connection
  const deleted = await prisma.bankTransaction.deleteMany({
    where: { connectionId: connection.id },
  });
  if (deleted.count > 0) {
    console.log(`  Transacciones previas eliminadas: ${deleted.count}`);
  }

  // 7. Create BankTransactions
  let created = 0;
  let errors = 0;
  const batchSize = 50;
  const transactions: any[] = [];

  for (let idx = 0; idx < uniqueEntries.length; idx++) {
    const entry = uniqueEntries[idx];
    const { categoria, subcategoria, tipoTransaccion, descripcionLimpia } = classifyBankMovement(entry);
    
    // Generate unique provider transaction ID
    const proveedorTxId = `BKT-${config.iban.slice(-4)}-${entry.bookingDate.replace(/[^0-9]/g, '').substring(0, 8)}-${idx.toString().padStart(5, '0')}`;
    
    // Determine the beneficiary/counterpart name
    let beneficiario = '';
    if (entry.creditDebit === 'CRDT') {
      beneficiario = cleanName(entry.creditorName || entry.debtorName || '');
    } else {
      beneficiario = cleanName(entry.debtorName || entry.creditorName || '');
    }
    
    // Build referencia
    let referencia = '';
    if (entry.mandateId) referencia = entry.mandateId;
    else if (entry.remittanceInfo) referencia = entry.remittanceInfo.substring(0, 200);
    
    // Signed amount: positive for income, negative for expenses
    const signedAmount = entry.creditDebit === 'CRDT' ? entry.amount : -entry.amount;
    
    transactions.push({
      companyId: company.id,
      connectionId: connection.id,
      proveedorTxId,
      fecha: new Date(entry.bookingDate),
      fechaContable: entry.valueDate ? new Date(entry.valueDate) : null,
      descripcion: descripcionLimpia.substring(0, 500),
      monto: Math.round(signedAmount * 100) / 100,
      moneda: entry.currency,
      categoria,
      subcategoria,
      beneficiario: beneficiario.substring(0, 200) || null,
      referencia: referencia.substring(0, 200) || null,
      tipoTransaccion,
      creditorName: entry.creditorName?.substring(0, 200) || null,
      debtorName: entry.debtorName?.substring(0, 200) || null,
      estado: 'pendiente_revision',
      rawData: {
        creditDebit: entry.creditDebit,
        domainCode: entry.domainCode,
        familyCode: entry.familyCode,
        subFamilyCode: entry.subFamilyCode,
        ultimateDebtorName: entry.ultimateDebtorName,
        ultimateCreditorName: entry.ultimateCreditorName,
        creditorId: entry.creditorId,
        debtorId: entry.debtorId,
        mandateId: entry.mandateId,
        remittanceInfo: entry.remittanceInfo,
        sourceFile: entry.sourceFile,
      },
    });
  }

  // Insert in batches
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    try {
      await prisma.bankTransaction.createMany({ data: batch });
      created += batch.length;
    } catch (err: any) {
      console.error(`  Error en batch ${i}: ${err.message.substring(0, 200)}`);
      // Try one by one for the failed batch
      for (const tx of batch) {
        try {
          await prisma.bankTransaction.create({ data: tx });
          created++;
        } catch (e: any) {
          errors++;
          if (errors <= 5) {
            console.error(`    Error individual: ${e.message.substring(0, 100)} | TxId: ${tx.proveedorTxId}`);
          }
        }
      }
    }
    if ((i + batchSize) % 200 === 0 || i + batchSize >= transactions.length) {
      console.log(`  Progreso: ${Math.min(i + batchSize, transactions.length)}/${transactions.length}`);
    }
  }

  // 8. Statistics
  const incomeCount = uniqueEntries.filter(e => e.creditDebit === 'CRDT').length;
  const expenseCount = uniqueEntries.filter(e => e.creditDebit === 'DBIT').length;
  const totalIncome = uniqueEntries
    .filter(e => e.creditDebit === 'CRDT')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = uniqueEntries
    .filter(e => e.creditDebit === 'DBIT')
    .reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const categoryCount = new Map<string, { count: number; total: number }>();
  for (const tx of transactions) {
    const cat = tx.categoria;
    if (!categoryCount.has(cat)) categoryCount.set(cat, { count: 0, total: 0 });
    const c = categoryCount.get(cat)!;
    c.count++;
    c.total += Math.abs(tx.monto);
  }

  console.log(`\n  RESUMEN ${config.nombre}:`);
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  Transacciones creadas: ${created}`);
  console.log(`  Errores: ${errors}`);
  console.log(`  Ingresos: ${incomeCount} movimientos → +${totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€`);
  console.log(`  Gastos: ${expenseCount} movimientos → -${totalExpense.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€`);
  console.log(`  Saldo neto: ${(totalIncome - totalExpense).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€`);
  console.log(`\n  Desglose por categoría:`);
  
  Array.from(categoryCount.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([cat, info]) => {
      console.log(`    ${cat.padEnd(30)} ${String(info.count).padStart(5)} mvtos  ${info.total.toLocaleString('es-ES', { minimumFractionDigits: 2 }).padStart(15)}€`);
    });

  return { created, skipped: duplicates, errors };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  IMPORTAR MOVIMIENTOS BANCARIOS - CAMT.053 (Bankinter)             ║');
  console.log('║  Sociedades: Rovida S.L. + Vidaro Inversiones S.L.U. (Viroda)     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  const results: Array<{ sociedad: string; created: number; skipped: number; errors: number }> = [];

  for (const config of SOCIEDADES) {
    try {
      const result = await importSociedad(config);
      results.push({ sociedad: config.nombre, ...result });
    } catch (err: any) {
      console.error(`\nError importando ${config.nombre}: ${err.message}`);
      results.push({ sociedad: config.nombre, created: 0, skipped: 0, errors: 1 });
    }
  }

  // Final summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log('  RESUMEN FINAL');
  console.log(`${'═'.repeat(70)}`);
  
  let grandTotal = 0;
  for (const r of results) {
    console.log(`  ${r.sociedad.padEnd(30)} Creadas: ${String(r.created).padStart(5)}  Duplicados: ${String(r.skipped).padStart(4)}  Errores: ${r.errors}`);
    grandTotal += r.created;
  }
  console.log(`${'─'.repeat(70)}`);
  console.log(`  TOTAL                        Creadas: ${String(grandTotal).padStart(5)}`);
  console.log(`${'═'.repeat(70)}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error fatal:', e);
  await prisma.$disconnect();
  process.exit(1);
});
