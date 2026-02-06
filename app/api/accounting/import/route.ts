import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { validateFile } from '@/lib/file-validation';
import { parseCSV } from '@/lib/import-service';
import logger from '@/lib/logger';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type TransactionType = 'ingreso' | 'gasto';

const TRANSACTION_TYPES: TransactionType[] = ['ingreso', 'gasto'];
const ACCOUNTING_CATEGORIES = [
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
  'gasto_otro',
] as const;

const KEY_ALIASES = {
  fecha: ['fecha', 'date', 'fechaoperacion', 'fechavalor', 'fecha_contable', 'fechamovimiento'],
  concepto: ['concepto', 'descripcion', 'detalle', 'description', 'concept', 'asunto'],
  categoria: ['categoria', 'category', 'tipo', 'tipogasto', 'naturaleza', 'clasificacion'],
  tipo: ['tipo', 'tipo_movimiento', 'ingresogasto', 'naturaleza', 'debehaber'],
  monto: ['monto', 'importe', 'cantidad', 'amount', 'total', 'valor'],
  debe: ['debe', 'debit', 'cargo'],
  haber: ['haber', 'credit', 'abono'],
  referencia: ['referencia', 'ref', 'referencia_interna', 'id', 'documento', 'asiento'],
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

function normalizeCategory(tipo: TransactionType, rawCategory: any, rawConcept: any): string {
  const combined = `${rawCategory || ''} ${rawConcept || ''}`.toLowerCase();
  if (ACCOUNTING_CATEGORIES.includes(rawCategory as any)) {
    return rawCategory;
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

    const companyId =
      role === 'super_admin' || role === 'soporte' ? requestedCompanyId : session.user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no válida' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isCsv = fileExtension === 'csv' || file.type === 'text/csv';

    const validation = await validateFile(
      {
        name: file.name,
        type: file.type,
        size: file.size,
        buffer: fileBuffer,
      },
      isCsv ? 'csv' : 'document'
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Archivo inválido', details: validation.errors },
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
      categoria: string;
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

      const concepto = rawConcept ? String(rawConcept).trim() : 'Movimiento importado';
      const categoria = normalizeCategory(tipo, rawCategory, concepto);

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

      transactionsToCreate.push({
        companyId,
        buildingId,
        unitId,
        tipo,
        categoria,
        concepto,
        monto,
        fecha,
        referencia: rawReference ? String(rawReference).trim() : undefined,
        notas: rawNotes ? String(rawNotes).trim() : undefined,
      });
    });

    if (!transactionsToCreate.length) {
      return NextResponse.json(
        { error: 'No se encontraron filas válidas para importar', details: errors },
        { status: 400 }
      );
    }

    await prisma.accountingTransaction.createMany({
      data: transactionsToCreate,
    });

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      imported: transactionsToCreate.length,
      failed: errors.length,
      errors,
    });
  } catch (error: any) {
    logger.error('[Accounting Import] Error:', error);
    return NextResponse.json(
      { error: 'Error importando contabilidad', message: error?.message },
      { status: 500 }
    );
  }
}
