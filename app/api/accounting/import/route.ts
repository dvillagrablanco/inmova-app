import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateFile } from '@/lib/file-validation';
import { parseCSV } from '@/lib/import-service';
import logger from '@/lib/logger';
import type { AccountingCategory } from '@/types/prisma-types';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

type TransactionType = 'ingreso' | 'gasto';

const TRANSACTION_TYPES: TransactionType[] = ['ingreso', 'gasto'];
const ACCOUNTING_CATEGORIES: AccountingCategory[] = [
  'ingreso_renta',
  'ingreso_deposito',
  'ingreso_otro',
  'gasto_mantenimiento',
  'gasto_impuesto',
  'gasto_seguro',
  'gasto_servicio',
  'gasto_reparacion',
  'gasto_comunidad',
  'gasto_administracion',
  'gasto_arrendamiento',
  'gasto_bancario',
  'gasto_personal',
  'gasto_amortizacion',
  'gasto_otro',
];

const KEY_ALIASES = {
  fecha: ['fecha', 'date', 'fechaoperacion', 'fechavalor', 'fecha_contable', 'fechamovimiento'],
  concepto: ['concepto', 'descripcion', 'detalle', 'description', 'concept', 'asunto', 'titulodesubcuenta'],
  categoria: ['categoria', 'category', 'tipogasto', 'naturaleza', 'clasificacion'],
  tipo: ['tipo', 'tipo_movimiento', 'ingresogasto', 'naturaleza'],
  monto: ['monto', 'importe', 'cantidad', 'amount', 'total', 'valor'],
  debe: ['debe', 'debit', 'cargo'],
  haber: ['haber', 'credit', 'abono'],
  referencia: ['referencia', 'ref', 'referencia_interna', 'documento'],
  // Zucchetti-specific fields
  asiento: ['asiento', 'numasiento', 'asientocontable'],
  apunte: ['apunte', 'numapunte', 'lineaapunte'],
  subcuenta: ['subcuenta', 'cuenta', 'codigosubcuenta', 'cuentacontable'],
  contrapartida: ['contrapartida', 'contapartida', 'cuentacontrapartida'],
  factura: ['factura', 'numfactura', 'nofactura', 'numerofactura'],
  edificio: ['edificio', 'building', 'inmueble', 'propiedad', 'property'],
  unidad: ['unidad', 'unit', 'piso', 'numero', 'unitnumber'],
  notas: ['notas', 'nota', 'observaciones', 'comments'],
};

const ADMIN_ROLES = new Set(['ADMIN', 'SUPERADMIN', 'administrador', 'super_admin', 'soporte']);

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function normalizeRecord(record: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    normalized[normalizeKey(key)] = value;
  }
  return normalized;
}

function getValue(record: Record<string, any>, aliases: string[]): any {
  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    if (normalizedAlias in record) {
      return record[normalizedAlias];
    }
  }
  return undefined;
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const raw = String(value).trim();
  if (!raw) return null;
  const sanitized = raw.replace(/[€$]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(sanitized);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return new Date(Date.UTC(date.y, date.m - 1, date.d));
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseSheetWithHeaderDetection(buffer: Buffer, sheetName?: string): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const targetSheetName = sheetName || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) return [];

  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
  const headerHints = [
    'fecha',
    'concepto',
    'debe',
    'haber',
    'importe',
    'monto',
    'documento',
    'asiento',
    'referencia',
  ];

  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const normalized = rows[i].map((cell) => normalizeKey(String(cell || '')));
    const matches = headerHints.filter((hint) => normalized.includes(hint));
    if (matches.length >= 3) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  }

  const headers = rows[headerRowIndex].map((cell) => String(cell || '').trim());
  const dataRows = rows.slice(headerRowIndex + 1).filter((row) =>
    row.some((cell) => String(cell || '').trim() !== '')
  );

  return dataRows.map((row) => {
    const record: Record<string, any> = {};
    headers.forEach((header, index) => {
      if (header) {
        record[header] = row[index];
      }
    });
    return record;
  });
}

function inferTransactionType(
  rawType: any,
  amount: number | null,
  debit: number | null,
  credit: number | null
): TransactionType | null {
  if (debit && debit > 0 && (!credit || credit <= 0)) return 'gasto';
  if (credit && credit > 0 && (!debit || debit <= 0)) return 'ingreso';
  if (debit && credit && debit > 0 && credit > 0) {
    return credit >= debit ? 'ingreso' : 'gasto';
  }
  if (amount !== null) {
    if (amount < 0) return 'gasto';
    if (amount > 0) return 'ingreso';
  }
  if (rawType) {
    const normalized = String(rawType).toLowerCase();
    if (normalized.includes('gasto') || normalized.includes('debe')) return 'gasto';
    if (normalized.includes('ingreso') || normalized.includes('haber')) return 'ingreso';
  }
  return null;
}

function normalizeCategory(
  tipo: TransactionType,
  rawCategory: unknown,
  rawConcept: unknown
): AccountingCategory {
  const combined = `${rawCategory || ''} ${rawConcept || ''}`.toLowerCase();
  if (ACCOUNTING_CATEGORIES.includes(rawCategory as AccountingCategory)) {
    return rawCategory as AccountingCategory;
  }

  if (tipo === 'ingreso') {
    if (combined.includes('renta') || combined.includes('alquiler')) return 'ingreso_renta';
    if (combined.includes('deposito') || combined.includes('fianza')) return 'ingreso_deposito';
    return 'ingreso_otro';
  }

  if (combined.includes('manten')) return 'gasto_mantenimiento';
  if (combined.includes('repar')) return 'gasto_reparacion';
  if (combined.includes('impuesto') || combined.includes('iva') || combined.includes('ibi')) {
    return 'gasto_impuesto';
  }
  if (combined.includes('seguro')) return 'gasto_seguro';
  if (combined.includes('comunidad')) return 'gasto_comunidad';
  if (combined.includes('admin')) return 'gasto_administracion';
  if (
    combined.includes('servicio') ||
    combined.includes('luz') ||
    combined.includes('agua') ||
    combined.includes('gas') ||
    combined.includes('internet')
  ) {
    return 'gasto_servicio';
  }
  return 'gasto_otro';
}

/**
 * Classify transaction by PGC subcuenta code (Plan General Contable)
 * Spanish accounting chart: 4xx=Deudores/Acreedores, 6xx=Gastos, 7xx=Ingresos
 */
function classifyBySubcuenta(tipo: TransactionType, subcuenta: string, concepto: string): AccountingCategory {
  const p2 = subcuenta.substring(0, 2);
  const p3 = subcuenta.substring(0, 3);
  const p4 = subcuenta.substring(0, 4);

  // Grupo 7 = Ingresos
  if (p2 === '75') return 'ingreso_renta';
  if (p2 === '70' || p2 === '71') return 'ingreso_otro';
  if (p2 === '76') return 'ingreso_otro';
  if (p2 === '77') return 'ingreso_otro';

  // Grupo 6 = Gastos
  if (p4 === '6210') return 'gasto_arrendamiento';
  if (p4 === '6220') return 'gasto_reparacion';
  if (p4 === '6230') return 'gasto_servicio';
  if (p3 === '625' || p4 === '6280') return 'gasto_seguro';
  if (p4 === '6260') return 'gasto_bancario';
  if (p4 === '6270') return 'gasto_administracion';
  if (p2 === '63') return 'gasto_impuesto';
  if (p2 === '64') return 'gasto_personal';
  if (p2 === '66') return 'gasto_bancario';
  if (p2 === '68') return 'gasto_amortizacion';
  if (p2 === '67' || p2 === '60' || p2 === '61') return 'gasto_otro';

  // Grupo 4 = Cuentas con terceros
  if (p3 === '477' || p3 === '472' || p3 === '473' || p3 === '475') return 'gasto_impuesto';
  if (p3 === '430') return tipo === 'ingreso' ? 'ingreso_renta' : 'ingreso_otro';
  if (p3 === '410') return 'gasto_otro';

  // Grupo 5 = Cuentas financieras
  if (p2 === '57') return tipo === 'ingreso' ? 'ingreso_otro' : 'gasto_bancario';

  return normalizeCategory(tipo, undefined, concepto);
}

function normalizeAmount(
  amount: number | null,
  debit: number | null,
  credit: number | null
): number | null {
  if (debit && credit && debit > 0 && credit > 0) {
    return Math.abs(credit - debit);
  }
  if (debit && debit > 0) return debit;
  if (credit && credit > 0) return credit;
  if (amount !== null) return Math.abs(amount);
  return null;
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = session.user.role;
    if (!ADMIN_ROLES.has(role)) {
      return NextResponse.json(
        { error: 'Solo administradores pueden importar contabilidad' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sheetName = formData.get('sheetName')?.toString();
    const requestedCompanyId = formData.get('companyId')?.toString();
    const overrideTypeRaw = formData.get('tipo')?.toString().toLowerCase();
    const overrideType = TRANSACTION_TYPES.includes(overrideTypeRaw as TransactionType)
      ? (overrideTypeRaw as TransactionType)
      : undefined;

    if (!file) {
      return NextResponse.json({ error: 'Archivo no proporcionado' }, { status: 400 });
    }

    // Soportar selector de empresa para todos los roles admin
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const companyId =
      requestedCompanyId || cookieCompanyId || session.user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no válida' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isCsv = fileExtension === 'csv' || file.type === 'text/csv';

    const validation = validateFile(fileBuffer, file.name, isCsv ? 'any' : 'document');

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Archivo inválido', details: validation.error },
        { status: 400 }
      );
    }

    let rows: any[] = [];
    if (isCsv) {
      rows = await parseCSV(fileBuffer.toString('utf-8'));
    } else {
      rows = parseSheetWithHeaderDetection(fileBuffer, sheetName);
      if (!rows.length) {
        return NextResponse.json({ error: 'Hoja no encontrada en el archivo' }, { status: 400 });
      }
    }

    if (!rows.length) {
      return NextResponse.json({ error: 'El archivo no contiene datos' }, { status: 400 });
    }

    // Detect if this is a Chart of Accounts (Plan de Cuentas) instead of transactions
    const firstRow = normalizeRecord(rows[0]);
    const hasCodigoTitulo = getValue(firstRow, ['codigo', 'code']) !== undefined &&
                            getValue(firstRow, ['titulo', 'title', 'nombre']) !== undefined;
    const hasGrupo = getValue(firstRow, ['grupo', 'group']) !== undefined;
    
    if (hasCodigoTitulo && hasGrupo) {
      // This is a Plan de Cuentas (Chart of Accounts) - import as subcuentas
      let imported = 0;
      for (const row of rows) {
        const norm = normalizeRecord(row);
        const codigo = String(getValue(norm, ['codigo', 'code']) || '').trim();
        const titulo = String(getValue(norm, ['titulo', 'title', 'nombre']) || '').trim();
        if (!codigo || !titulo || codigo === '0000000000') continue;

        try {
          await prisma.accountingTransaction.create({
            data: {
              companyId,
              tipo: codigo.startsWith('7') ? 'ingreso' : 'gasto',
              categoria: codigo.startsWith('7') ? 'ingreso_renta' : 'gasto_otro',
              concepto: `[PGC] ${titulo}`,
              monto: 0,
              fecha: new Date(),
              referencia: `PGC-${codigo}`,
              notas: `Plan General Contable - Subcuenta ${codigo}`,
            },
          });
          imported++;
        } catch {
          // Duplicate or error - skip
        }
      }

      return NextResponse.json({
        success: true,
        totalRows: rows.length,
        imported,
        skipped: rows.length - imported,
        duplicates: 0,
        failed: 0,
        errors: [],
        message: `Plan de Cuentas importado: ${imported} subcuentas de ${rows.length} filas. Este archivo es un índice de subcuentas contables, no contiene asientos con importes.`,
        fileType: 'plan_de_cuentas',
      });
    }

    const buildings = await prisma.building.findMany({
      where: { companyId },
      select: { id: true, nombre: true },
    });

    const units = await prisma.unit.findMany({
      where: { building: { companyId } },
      select: { id: true, numero: true, buildingId: true },
    });

    const buildingIndex = buildings.map((building) => ({
      id: building.id,
      name: normalizeKey(building.nombre),
    }));

    const unitIndex = units.map((unit) => ({
      id: unit.id,
      numero: normalizeKey(unit.numero),
      buildingId: unit.buildingId,
    }));

    const errors: Array<{ row: number; message: string }> = [];
    const transactionsToCreate: Array<{
      companyId: string;
      buildingId?: string;
      unitId?: string;
      tipo: TransactionType;
      categoria: AccountingCategory;
      concepto: string;
      monto: number;
      fecha: Date;
      referencia?: string;
      notas?: string;
    }> = [];

    rows.forEach((row, index) => {
      const normalized = normalizeRecord(row);

      const rawDate = getValue(normalized, KEY_ALIASES.fecha);
      const rawConcept = getValue(normalized, KEY_ALIASES.concepto);
      const rawCategory = getValue(normalized, KEY_ALIASES.categoria);
      const rawType = getValue(normalized, KEY_ALIASES.tipo);
      const rawAmount = getValue(normalized, KEY_ALIASES.monto);
      const rawDebit = getValue(normalized, KEY_ALIASES.debe);
      const rawCredit = getValue(normalized, KEY_ALIASES.haber);
      const rawReference = getValue(normalized, KEY_ALIASES.referencia);
      const rawBuilding = getValue(normalized, KEY_ALIASES.edificio);
      const rawUnit = getValue(normalized, KEY_ALIASES.unidad);
      const rawNotes = getValue(normalized, KEY_ALIASES.notas);
      // Zucchetti-specific
      const rawAsiento = getValue(normalized, KEY_ALIASES.asiento);
      const rawApunte = getValue(normalized, KEY_ALIASES.apunte);
      const rawSubcuenta = getValue(normalized, KEY_ALIASES.subcuenta);
      const rawContrapartida = getValue(normalized, KEY_ALIASES.contrapartida);
      const rawFactura = getValue(normalized, KEY_ALIASES.factura);

      const debit = parseNumber(rawDebit);
      const credit = parseNumber(rawCredit);
      const amount = parseNumber(rawAmount);
      const monto = normalizeAmount(amount, debit, credit);
      let tipo = inferTransactionType(rawType, amount, debit, credit);
      if (!tipo && overrideType) {
        tipo = overrideType;
      }

      if (!monto || monto <= 0 || !tipo) {
        errors.push({
          row: index + 2,
          message: 'No se pudo determinar importe o tipo del movimiento',
        });
        return;
      }

      const fecha = parseExcelDate(rawDate);
      if (!fecha) {
        errors.push({
          row: index + 2,
          message: 'Fecha inválida o ausente',
        });
        return;
      }

      // Build concepto: prefer explicit concepto, fallback to Zucchetti titulodesubcuenta
      const concepto = rawConcept ? String(rawConcept).trim() : 'Movimiento importado';
      
      // Use subcuenta (PGC account code) to improve category classification
      const subcuentaStr = rawSubcuenta ? String(rawSubcuenta).trim() : '';
      const categoria = subcuentaStr
        ? classifyBySubcuenta(tipo, subcuentaStr, concepto)
        : normalizeCategory(tipo, rawCategory, concepto);

      let buildingId: string | undefined;
      if (rawBuilding) {
        const normalizedBuilding = normalizeKey(String(rawBuilding));
        const match = buildingIndex.find(
          (b) => b.name.includes(normalizedBuilding) || normalizedBuilding.includes(b.name)
        );
        buildingId = match?.id;
      }

      let unitId: string | undefined;
      if (rawUnit) {
        const normalizedUnit = normalizeKey(String(rawUnit));
        const match = unitIndex.find(
          (u) => u.numero === normalizedUnit && (!buildingId || u.buildingId === buildingId)
        );
        unitId = match?.id;
        if (!unitId && normalizedUnit && buildingId) {
          const fallback = unitIndex.find(
            (u) => u.buildingId === buildingId && u.numero.includes(normalizedUnit)
          );
          unitId = fallback?.id;
        }
      }

      // Build referencia: Zucchetti Asiento-Apunte is the most unique identifier
      let referencia = rawReference ? String(rawReference).trim() : undefined;
      if (rawAsiento && rawApunte) {
        referencia = `A${rawAsiento}-L${rawApunte}` + (rawFactura ? `-${String(rawFactura).trim()}` : '') + (referencia ? `-${referencia}` : '');
      } else if (rawFactura && !referencia) {
        referencia = String(rawFactura).trim();
      }

      // Build notas with extra Zucchetti context
      let notas = rawNotes ? String(rawNotes).trim() : undefined;
      if (subcuentaStr) {
        const extra = `Subcuenta: ${subcuentaStr}` + (rawContrapartida ? `, Contrapartida: ${String(rawContrapartida).trim()}` : '');
        notas = notas ? `${notas} | ${extra}` : extra;
      }

      transactionsToCreate.push({
        companyId,
        buildingId,
        unitId,
        tipo,
        categoria,
        concepto,
        monto,
        fecha,
        referencia,
        notas,
      });
    });

    if (!transactionsToCreate.length) {
      const hint = errors.length > 0 && errors.every(e => e.message.includes('importe') || e.message.includes('tipo'))
        ? ' El archivo debe contener columnas de Fecha, Concepto/Descripción, e Importe (o Debe/Haber). Si es un Plan de Cuentas o índice de subcuentas, se importó como referencia contable.'
        : '';
      return NextResponse.json(
        { 
          error: `No se encontraron movimientos contables válidos para importar.${hint}`,
          details: errors.slice(0, 10),
          expectedFormat: 'El archivo debe tener columnas: Fecha, Concepto, Importe (o Debe/Haber). Opcionalmente: Subcuenta, Referencia, Edificio.',
        },
        { status: 400 }
      );
    }

    // Deduplication: check for existing transactions with same fecha+monto+concepto+tipo
    // to prevent duplicates when re-importing the same file
    const existingTransactions = await prisma.accountingTransaction.findMany({
      where: { companyId },
      select: { fecha: true, monto: true, concepto: true, tipo: true, referencia: true },
    });

    const existingKeys = new Set(
      existingTransactions.map((t) => {
        const dateStr = t.fecha.toISOString().substring(0, 10);
        return `${dateStr}|${t.monto}|${t.tipo}|${(t.referencia || t.concepto || '').substring(0, 40)}`;
      })
    );

    const uniqueTransactions = transactionsToCreate.filter((t) => {
      const dateStr = t.fecha.toISOString().substring(0, 10);
      const key = `${dateStr}|${t.monto}|${t.tipo}|${(t.referencia || t.concepto || '').substring(0, 40)}`;
      return !existingKeys.has(key);
    });

    const skipped = transactionsToCreate.length - uniqueTransactions.length;

    if (uniqueTransactions.length > 0) {
      await prisma.accountingTransaction.createMany({
        data: uniqueTransactions,
      });
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      imported: uniqueTransactions.length,
      skipped,
      duplicates: skipped,
      failed: errors.length,
      errors: errors.slice(0, 20),
      message: skipped > 0
        ? `${uniqueTransactions.length} movimientos importados, ${skipped} duplicados omitidos`
        : `${uniqueTransactions.length} movimientos importados correctamente`,
    });
  } catch (error: any) {
    logger.error('[Accounting Import] Error:', error);
    return NextResponse.json(
      { error: 'Error importando contabilidad', message: error?.message },
      { status: 500 }
    );
  }
}
