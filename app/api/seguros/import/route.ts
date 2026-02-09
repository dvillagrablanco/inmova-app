import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { validateFile } from '@/lib/file-validation';
import { parseCSV } from '@/lib/import-service';
import { S3Service } from '@/lib/s3-service';
import logger from '@/lib/logger';
import type { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPERADMIN', 'administrador', 'super_admin', 'soporte']);

const FIELD_ALIASES = {
  numeroPoliza: ['numero_poliza', 'poliza', 'policy_number', 'npoliza', 'numero'],
  tipo: ['tipo', 'tipo_seguro', 'insurance_type', 'ramo'],
  aseguradora: ['aseguradora', 'compania', 'company', 'aseguradora_nombre'],
  nombreAsegurado: ['asegurado', 'tomador', 'nombre_asegurado', 'insured_name', 'titular'],
  fechaInicio: ['fecha_inicio', 'inicio', 'start_date', 'vigencia_desde', 'fecha_alta'],
  fechaVencimiento: ['fecha_vencimiento', 'vencimiento', 'end_date', 'caducidad', 'fecha_fin'],
  primaAnual: ['prima_anual', 'prima', 'annual_premium', 'importe_anual', 'cuota_anual'],
  primaMensual: ['prima_mensual', 'cuota_mensual', 'monthly_premium'],
  sumaAsegurada: ['suma_asegurada', 'capital', 'coverage_amount', 'cobertura', 'valor_asegurado'],
  franquicia: ['franquicia', 'deducible', 'exceso'],
  estado: ['estado', 'status', 'situacion'],
  renovacionAutomatica: ['renovacion_automatica', 'auto_renovacion', 'auto_renew'],
  telefonoAseguradora: ['telefono_aseguradora', 'telefono', 'phone'],
  emailAseguradora: ['email_aseguradora', 'email', 'correo'],
  contactoAgente: ['agente', 'contacto', 'agent'],
  buildingName: ['edificio', 'building', 'propiedad', 'inmueble', 'comunidad'],
  unitNumber: ['unidad', 'unit', 'piso', 'numero_unidad', 'unit_number'],
  notas: ['notas', 'observaciones', 'comments'],
  documento: ['documento', 'archivo', 'file', 'pdf', 'poliza_pdf'],
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
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

function parseBoolean(value: any): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  const raw = String(value).trim().toLowerCase();
  if (['true', 'si', 'sí', '1', 'yes'].includes(raw)) return true;
  if (['false', 'no', '0'].includes(raw)) return false;
  return null;
}

function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeInsuranceType(raw: any): string {
  const normalized = String(raw || '').toLowerCase();
  if (normalized.includes('hogar') || normalized.includes('vivienda')) return 'hogar';
  if (normalized.includes('comunidad') || normalized.includes('edificio')) return 'comunidad';
  if (normalized.includes('responsabilidad') || normalized.includes('rc')) return 'responsabilidad_civil';
  if (normalized.includes('impago') || normalized.includes('alquiler')) return 'impago_alquiler';
  if (normalized.includes('incendio')) return 'incendio';
  if (normalized.includes('robo')) return 'robo';
  if (normalized.includes('vida')) return 'vida';
  return 'otro';
}

function normalizeInsuranceStatus(raw: any): string {
  const normalized = String(raw || '').toLowerCase();
  if (normalized.includes('vencid')) return 'vencida';
  if (normalized.includes('cancel')) return 'cancelada';
  if (normalized.includes('pendiente') || normalized.includes('renov')) return 'pendiente_renovacion';
  if (normalized.includes('activa') || normalized.includes('activo')) return 'activa';
  return 'activa';
}

function parseSheet(buffer: Buffer, sheetName?: string): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const targetSheet = sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheet];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
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
        { error: 'Solo administradores pueden importar seguros' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sheetName = formData.get('sheetName')?.toString();
    const requestedCompanyId = formData.get('companyId')?.toString();

    if (!file) {
      return NextResponse.json({ error: 'Archivo no proporcionado' }, { status: 400 });
    }

    const companyId =
      role === 'super_admin' || role === 'soporte' ? requestedCompanyId : session.user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no válida' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { nombre: true },
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isZip = fileExtension === 'zip';
    const isCsv = fileExtension === 'csv' || file.type === 'text/csv';

    const validation = await validateFile(
      {
        name: file.name,
        type: file.type,
        size: file.size,
        buffer: fileBuffer,
      },
      isZip ? 'archive' : isCsv ? 'csv' : 'document'
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Archivo inválido', details: validation.errors },
        { status: 400 }
      );
    }

    let rows: any[] = [];
    const attachments = new Map<string, Buffer>();

    if (isZip) {
      const zip = new AdmZip(fileBuffer);
      const entries = zip.getEntries();
      const dataEntry =
        entries.find((entry) => entry.entryName.toLowerCase().endsWith('.xlsx')) ||
        entries.find((entry) => entry.entryName.toLowerCase().endsWith('.xls')) ||
        entries.find((entry) => entry.entryName.toLowerCase().endsWith('.csv'));

      if (!dataEntry) {
        return NextResponse.json(
          { error: 'No se encontró CSV o Excel dentro del ZIP' },
          { status: 400 }
        );
      }

      entries.forEach((entry) => {
        if (entry.entryName.toLowerCase().endsWith('.pdf')) {
          const key = entry.entryName.toLowerCase();
          attachments.set(key, entry.getData());
          const base = key.split('/').pop();
          if (base) {
            attachments.set(base, entry.getData());
          }
        }
      });

      const dataBuffer = dataEntry.getData();
      if (dataEntry.entryName.toLowerCase().endsWith('.csv')) {
        rows = await parseCSV(dataBuffer.toString('utf-8'));
      } else {
        rows = parseSheet(dataBuffer, sheetName);
      }
    } else if (isCsv) {
      rows = await parseCSV(fileBuffer.toString('utf-8'));
    } else {
      rows = parseSheet(fileBuffer, sheetName);
    }

    if (!rows.length) {
      return NextResponse.json({ error: 'El archivo no contiene datos' }, { status: 400 });
    }

    const buildings = await prisma.building.findMany({
      where: { companyId },
      select: { id: true, nombre: true, direccion: true },
    });
    const units = await prisma.unit.findMany({
      where: { building: { companyId } },
      select: { id: true, numero: true, buildingId: true },
    });
    const existingPolicies = await prisma.insurance.findMany({
      where: { companyId },
      select: { numeroPoliza: true },
    });

    const existingSet = new Set(existingPolicies.map((p) => p.numeroPoliza.toLowerCase()));
    const buildingIndex = buildings.map((building) => ({
      id: building.id,
      name: normalizeKey(building.nombre),
      address: normalizeKey(building.direccion || ''),
    }));
    const unitIndex = units.map((unit) => ({
      id: unit.id,
      numero: normalizeKey(unit.numero),
      buildingId: unit.buildingId,
    }));

    const errors: Array<{ row: number; message: string }> = [];
    const warnings: string[] = [];
    const createData: Prisma.InsuranceCreateManyInput[] = [];

    const seenPolicies = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const normalized = normalizeRecord(rows[i]);

      const numeroPoliza = String(
        getValue(normalized, FIELD_ALIASES.numeroPoliza) || ''
      ).trim();
      const aseguradora = String(getValue(normalized, FIELD_ALIASES.aseguradora) || '').trim();
      const rawTipo = getValue(normalized, FIELD_ALIASES.tipo);
      const rawEstado = getValue(normalized, FIELD_ALIASES.estado);
      const rawNombreAsegurado = getValue(normalized, FIELD_ALIASES.nombreAsegurado);
      const rawFechaInicio = getValue(normalized, FIELD_ALIASES.fechaInicio);
      const rawFechaVencimiento = getValue(normalized, FIELD_ALIASES.fechaVencimiento);

      if (!numeroPoliza) {
        errors.push({ row: i + 2, message: 'Número de póliza obligatorio' });
        continue;
      }

      const policyKey = numeroPoliza.toLowerCase();
      if (existingSet.has(policyKey) || seenPolicies.has(policyKey)) {
        warnings.push(`Fila ${i + 2}: póliza ${numeroPoliza} ya existe, se omitirá`);
        continue;
      }

      if (!aseguradora) {
        errors.push({ row: i + 2, message: 'Aseguradora obligatoria' });
        continue;
      }

      const fechaInicio = parseExcelDate(rawFechaInicio);
      const fechaVencimiento = parseExcelDate(rawFechaVencimiento);

      if (!fechaInicio || !fechaVencimiento) {
        errors.push({ row: i + 2, message: 'Fecha de inicio/vencimiento inválida' });
        continue;
      }

      const tipo = normalizeInsuranceType(rawTipo);
      const estado = normalizeInsuranceStatus(rawEstado);
      const nombreAsegurado =
        (rawNombreAsegurado ? String(rawNombreAsegurado).trim() : '') ||
        company?.nombre ||
        'Titular';

      const primaAnual = parseNumber(getValue(normalized, FIELD_ALIASES.primaAnual));
      const primaMensual = parseNumber(getValue(normalized, FIELD_ALIASES.primaMensual));
      const sumaAsegurada = parseNumber(getValue(normalized, FIELD_ALIASES.sumaAsegurada));
      const franquicia = parseNumber(getValue(normalized, FIELD_ALIASES.franquicia));
      const renovacionAutomatica = parseBoolean(
        getValue(normalized, FIELD_ALIASES.renovacionAutomatica)
      );
      const coberturaText = getValue(normalized, FIELD_ALIASES.sumaAsegurada);

      const buildingValue = getValue(normalized, FIELD_ALIASES.buildingName);
      const unitValue = getValue(normalized, FIELD_ALIASES.unitNumber);

      let buildingId: string | undefined;
      if (buildingValue) {
        const normalizedBuilding = normalizeKey(String(buildingValue));
        const match = buildingIndex.find(
          (b) =>
            b.name.includes(normalizedBuilding) ||
            normalizedBuilding.includes(b.name) ||
            b.address.includes(normalizedBuilding)
        );
        buildingId = match?.id;
        if (!buildingId) {
          warnings.push(`Fila ${i + 2}: edificio no encontrado (${buildingValue})`);
        }
      }

      let unitId: string | undefined;
      if (unitValue) {
        const normalizedUnit = normalizeKey(String(unitValue));
        const match = unitIndex.find(
          (u) => u.numero === normalizedUnit && (!buildingId || u.buildingId === buildingId)
        );
        unitId = match?.id;
        if (!unitId && buildingId) {
          const fallback = unitIndex.find(
            (u) => u.buildingId === buildingId && u.numero.includes(normalizedUnit)
          );
          unitId = fallback?.id;
        }
        if (!unitId) {
          warnings.push(`Fila ${i + 2}: unidad no encontrada (${unitValue})`);
        }
      }

      let urlDocumento: string | undefined;
      let documentosAdjuntos: Array<{ filename: string; url: string; uploadedAt: string }> | undefined;
      const documentoName = getValue(normalized, FIELD_ALIASES.documento);
      if (documentoName) {
        const normalizedDoc = String(documentoName).trim().toLowerCase();
        const attachment = attachments.get(normalizedDoc);
        if (attachment) {
          const uploadResult = await S3Service.uploadFile(attachment, documentoName, 'seguros');
          urlDocumento = uploadResult.url;
          documentosAdjuntos = [
            { filename: documentoName, url: uploadResult.url, uploadedAt: new Date().toISOString() },
          ];
        } else {
          warnings.push(`Fila ${i + 2}: documento no encontrado (${documentoName})`);
        }
      }

      createData.push({
        companyId,
        buildingId,
        unitId,
        numeroPoliza,
        tipo,
        aseguradora,
        nombreAsegurado,
        telefonoAseguradora: getValue(normalized, FIELD_ALIASES.telefonoAseguradora) || undefined,
        emailAseguradora: getValue(normalized, FIELD_ALIASES.emailAseguradora) || undefined,
        contactoAgente: getValue(normalized, FIELD_ALIASES.contactoAgente) || undefined,
        cobertura: typeof coberturaText === 'string' ? coberturaText : undefined,
        sumaAsegurada: sumaAsegurada ?? undefined,
        franquicia: franquicia ?? undefined,
        fechaInicio,
        fechaVencimiento,
        primaMensual: primaMensual ?? undefined,
        primaAnual: primaAnual ?? undefined,
        estado,
        renovacionAutomatica: renovacionAutomatica ?? undefined,
        urlDocumento,
        documentosAdjuntos,
        notas: getValue(normalized, FIELD_ALIASES.notas) || undefined,
      });

      seenPolicies.add(policyKey);
    }

    if (!createData.length) {
      return NextResponse.json(
        { error: 'No se encontraron pólizas válidas para importar', errors, warnings },
        { status: 400 }
      );
    }

    await prisma.insurance.createMany({ data: createData });

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      imported: createData.length,
      failed: errors.length,
      errors,
      warnings,
    });
  } catch (error: any) {
    logger.error('[Insurance Import] Error:', error);
    return NextResponse.json(
      { error: 'Error importando seguros', message: error?.message },
      { status: 500 }
    );
  }
}
