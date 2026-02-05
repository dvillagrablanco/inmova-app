/**
 * Importador de contabilidad desde XLSX/CSV
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';
import logger from '@/lib/logger';
import * as XLSX from 'xlsx';
import { AccountingCategory, TransactionType, ExpenseCategory } from '@prisma/client';

type RowRecord = Record<string, any>;

const HEADER_MAP: Record<string, string> = {
  fecha: 'fecha',
  date: 'fecha',
  fechamovimiento: 'fecha',
  fechamov: 'fecha',
  concepto: 'concepto',
  descripcion: 'concepto',
  detalle: 'concepto',
  importe: 'monto',
  monto: 'monto',
  amount: 'monto',
  debe: 'debe',
  haber: 'haber',
  tipo: 'tipo',
  categoria: 'categoria',
  categoriaa: 'categoria',
  edificio: 'edificio',
  inmueble: 'edificio',
  unidad: 'unidad',
  piso: 'unidad',
  inquilino: 'inquilino',
  tenant: 'inquilino',
  contrato: 'contrato',
  reference: 'referencia',
  referencia: 'referencia',
  notas: 'notas',
  observaciones: 'notas',
};

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const normalized = String(value)
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[€$]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed?.m && parsed?.d) {
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
  }
  const raw = String(value).trim();
  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime())) return iso;
  const match = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    return new Date(year, month, day);
  }
  return null;
}

function inferCategory(concept: string, tipo: TransactionType): AccountingCategory {
  const text = normalizeText(concept);
  if (tipo === 'ingreso') {
    if (text.includes('alquiler') || text.includes('renta')) return 'ingreso_renta';
    if (text.includes('fianza') || text.includes('deposito')) return 'ingreso_deposito';
    return 'ingreso_otro';
  }
  if (text.includes('mantenimiento')) return 'gasto_mantenimiento';
  if (text.includes('impuesto') || text.includes('ibi')) return 'gasto_impuesto';
  if (text.includes('seguro')) return 'gasto_seguro';
  if (text.includes('servicio') || text.includes('suministro')) return 'gasto_servicio';
  if (text.includes('reparacion')) return 'gasto_reparacion';
  if (text.includes('comunidad')) return 'gasto_comunidad';
  if (text.includes('administracion')) return 'gasto_administracion';
  return 'gasto_otro';
}

function mapExpenseCategory(category: AccountingCategory): ExpenseCategory {
  switch (category) {
    case 'gasto_mantenimiento':
      return 'mantenimiento';
    case 'gasto_impuesto':
      return 'impuestos';
    case 'gasto_seguro':
      return 'seguros';
    case 'gasto_servicio':
      return 'servicios';
    case 'gasto_reparacion':
      return 'reparaciones';
    case 'gasto_comunidad':
      return 'comunidad';
    default:
      return 'otro';
  }
}

function normalizeCategory(
  value: string | null,
  tipo: TransactionType,
  concept: string
): AccountingCategory {
  if (!value) return inferCategory(concept, tipo);
  const normalized = normalizeText(value);
  const mapping: Record<string, AccountingCategory> = {
    ingreso_renta: 'ingreso_renta',
    ingreso: 'ingreso_otro',
    renta: 'ingreso_renta',
    deposito: 'ingreso_deposito',
    fianza: 'ingreso_deposito',
    ingreso_otro: 'ingreso_otro',
    gasto_mantenimiento: 'gasto_mantenimiento',
    mantenimiento: 'gasto_mantenimiento',
    gasto_impuesto: 'gasto_impuesto',
    impuestos: 'gasto_impuesto',
    gasto_seguro: 'gasto_seguro',
    seguros: 'gasto_seguro',
    gasto_servicio: 'gasto_servicio',
    servicios: 'gasto_servicio',
    gasto_reparacion: 'gasto_reparacion',
    reparaciones: 'gasto_reparacion',
    gasto_comunidad: 'gasto_comunidad',
    comunidad: 'gasto_comunidad',
    gasto_administracion: 'gasto_administracion',
    administracion: 'gasto_administracion',
    gasto_otro: 'gasto_otro',
    otros: 'gasto_otro',
  };
  return mapping[normalized] || inferCategory(concept, tipo);
}

function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function guessType(rawType: string | null, amount: number): TransactionType {
  const normalized = normalizeText(rawType || '');
  if (['ingreso', 'income', 'haber'].some((v) => normalized.includes(v))) {
    return 'ingreso';
  }
  if (['gasto', 'expense', 'debe'].some((v) => normalized.includes(v))) {
    return 'gasto';
  }
  return amount < 0 ? 'gasto' : 'ingreso';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session.user.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<RowRecord>(sheet, { defval: '' });

    if (rawRows.length === 0) {
      return NextResponse.json({ error: 'No hay filas en el archivo' }, { status: 400 });
    }

    const normalizedRows = rawRows.map((row) => {
      const normalized: RowRecord = {};
      Object.entries(row).forEach(([key, value]) => {
        const mapped = HEADER_MAP[normalizeHeader(String(key))] || normalizeHeader(String(key));
        normalized[mapped] = value;
      });
      return normalized;
    });

    const companyId = session.user.companyId;

    const [buildings, units, tenants, contracts] = await Promise.all([
      prisma.building.findMany({ where: { companyId }, select: { id: true, nombre: true } }),
      prisma.unit.findMany({
        where: { building: { companyId } },
        select: { id: true, numero: true, buildingId: true },
      }),
      prisma.tenant.findMany({
        where: { companyId },
        select: { id: true, nombreCompleto: true, email: true },
      }),
      prisma.contract.findMany({
        where: { unit: { building: { companyId } } },
        select: {
          id: true,
          unitId: true,
          tenantId: true,
          fechaInicio: true,
          fechaFin: true,
          estado: true,
        },
      }),
    ]);

    const buildingMap = new Map(buildings.map((b) => [normalizeText(b.nombre), b]));
    const unitMap = new Map(units.map((u) => [`${u.buildingId}:${normalizeText(u.numero)}`, u]));
    const tenantByEmail = new Map(tenants.map((t) => [normalizeText(t.email), t]));
    const tenantByName = new Map(tenants.map((t) => [normalizeText(t.nombreCompleto), t]));

    const documentKey = await uploadFile(buffer, `contabilidad/${Date.now()}-${file.name}`);
    const document = await prisma.document.create({
      data: {
        nombre: file.name,
        tipo: 'factura',
        cloudStoragePath: documentKey,
        descripcion: 'Importación contable',
        tags: ['contabilidad', 'import'],
      },
    });
    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumero: 1,
        cloud_storage_path: documentKey,
        tamano: file.size,
        uploadedBy: session.user.id,
        comentario: 'Importación contable',
      },
    });

    const dateRange = normalizedRows.map((row) => parseDate(row.fecha)).filter(Boolean) as Date[];
    const minDate = dateRange.length
      ? new Date(Math.min(...dateRange.map((d) => d.getTime())))
      : null;
    const maxDate = dateRange.length
      ? new Date(Math.max(...dateRange.map((d) => d.getTime())))
      : null;

    const existingTransactions =
      minDate && maxDate
        ? await prisma.accountingTransaction.findMany({
            where: {
              companyId,
              fecha: { gte: minDate, lte: maxDate },
            },
            select: { fecha: true, monto: true, concepto: true, referencia: true },
          })
        : [];

    const existingKeys = new Set(
      existingTransactions.map(
        (tx) =>
          `${tx.fecha.toISOString()}|${tx.monto}|${normalizeText(tx.concepto)}|${tx.referencia || ''}`
      )
    );

    let created = 0;
    let skipped = 0;
    let paymentsCreated = 0;
    let expensesCreated = 0;

    for (const row of normalizedRows) {
      const fecha = normalizeDate(parseDate(row.fecha) || new Date());
      const montoRaw =
        parseNumber(row.monto) ??
        (parseNumber(row.haber) !== null && parseNumber(row.debe) !== null
          ? (parseNumber(row.haber) || 0) - (parseNumber(row.debe) || 0)
          : null);

      if (montoRaw === null) {
        skipped += 1;
        continue;
      }

      const tipo = guessType(row.tipo ? String(row.tipo) : null, montoRaw);
      const monto = Math.abs(montoRaw);
      const concepto = String(row.concepto || row.descripcion || 'Movimiento contable');
      const referencia = row.referencia ? String(row.referencia) : null;
      const notas = row.notas ? String(row.notas) : null;

      const key = `${fecha.toISOString()}|${monto}|${normalizeText(concepto)}|${referencia || ''}`;
      if (existingKeys.has(key)) {
        skipped += 1;
        continue;
      }

      const edificioRaw = row.edificio ? normalizeText(String(row.edificio)) : '';
      const unidadRaw = row.unidad ? normalizeText(String(row.unidad)) : '';
      const inquilinoRaw = row.inquilino ? normalizeText(String(row.inquilino)) : '';

      const building = edificioRaw
        ? buildingMap.get(edificioRaw) ||
          buildings.find((b) => normalizeText(b.nombre).includes(edificioRaw))
        : undefined;
      const unit =
        building && unidadRaw
          ? unitMap.get(`${building.id}:${unidadRaw}`) ||
            units.find(
              (u) => u.buildingId === building.id && normalizeText(u.numero).includes(unidadRaw)
            )
          : !building && unidadRaw
            ? units.find((u) => normalizeText(u.numero) === unidadRaw)
            : undefined;
      const resolvedBuilding =
        building || (unit ? buildings.find((b) => b.id === unit.buildingId) : undefined);
      const tenant =
        inquilinoRaw && inquilinoRaw.includes('@')
          ? tenantByEmail.get(inquilinoRaw)
          : tenantByName.get(inquilinoRaw) ||
            tenants.find((t) => normalizeText(t.nombreCompleto).includes(inquilinoRaw));

      let contractId: string | null = row.contrato ? String(row.contrato) : null;
      if (contractId && !contracts.some((c) => c.id === contractId)) {
        contractId = null;
      }
      if (!contractId) {
        const contractCandidates = contracts.filter((c) => {
          if (unit && c.unitId === unit.id) return true;
          if (tenant && c.tenantId === tenant.id) return true;
          return false;
        });
        if (contractCandidates.length) {
          const matched = contractCandidates.find(
            (c) => fecha >= c.fechaInicio && fecha <= c.fechaFin
          );
          contractId = (matched || contractCandidates[0]).id;
        }
      }

      const categoria = normalizeCategory(
        row.categoria ? String(row.categoria) : null,
        tipo,
        concepto
      );

      let paymentId: string | null = null;
      let expenseId: string | null = null;

      if (tipo === 'ingreso' && contractId) {
        const existingPayment = await prisma.payment.findFirst({
          where: {
            contractId,
            monto,
            fechaVencimiento: fecha,
          },
        });
        if (!existingPayment) {
          const payment = await prisma.payment.create({
            data: {
              contractId,
              periodo: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
              monto,
              fechaVencimiento: fecha,
              fechaPago: fecha,
              estado: 'pagado',
            },
          });
          paymentId = payment.id;
          paymentsCreated += 1;
        } else {
          paymentId = existingPayment.id;
        }
      }

      if (tipo === 'gasto' && (resolvedBuilding?.id || unit?.id)) {
        const expense = await prisma.expense.create({
          data: {
            buildingId: resolvedBuilding?.id,
            unitId: unit?.id,
            concepto,
            categoria: mapExpenseCategory(categoria),
            monto,
            fecha,
            facturaPdfPath: documentKey,
            notas,
          },
        });
        expenseId = expense.id;
        expensesCreated += 1;
      }

      await prisma.accountingTransaction.create({
        data: {
          companyId,
          buildingId: resolvedBuilding?.id,
          unitId: unit?.id,
          tipo,
          categoria,
          concepto,
          monto,
          fecha,
          referencia: referencia || undefined,
          paymentId,
          expenseId,
          documentoPath: documentKey,
          notas,
        },
      });
      existingKeys.add(key);
      created += 1;
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      paymentsCreated,
      expensesCreated,
      documentId: document.id,
    });
  } catch (error: any) {
    logger.error('Error importando contabilidad:', error);
    return NextResponse.json({ error: 'Error al importar contabilidad' }, { status: 500 });
  }
}
