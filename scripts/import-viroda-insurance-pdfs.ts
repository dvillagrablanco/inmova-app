import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { prisma } from '@/lib/db';
import { S3Service } from '@/lib/s3-service';

type InsuranceType =
  | 'incendio'
  | 'robo'
  | 'responsabilidad_civil'
  | 'vida'
  | 'hogar'
  | 'comunidad'
  | 'impago_alquiler'
  | 'otro';

const INSURER_KEYWORDS = [
  'mapfre',
  'axa',
  'allianz',
  'generali',
  'zurich',
  'segurcaixa',
  'mutua',
  'reale',
  'liberty',
  'santalucia',
  'caser',
  'asisa',
  'fiatc',
  'occident',
];

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function parseNumber(value: string): number | null {
  const raw = value.replace(/[€$]/g, '').replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseDateString(value: string): Date | null {
  const cleaned = value.replace(/[.-]/g, '/').trim();
  const parts = cleaned.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map((p) => p.trim());
  const year = y.length === 2 ? Number(`20${y}`) : Number(y);
  const month = Number(m);
  const day = Number(d);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function findByKeywords(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();
  for (const keyword of keywords) {
    const index = lower.indexOf(keyword);
    if (index >= 0) {
      const line = text.slice(index, index + 200).split('\n')[0];
      return line;
    }
  }
  return null;
}

function extractNumberNear(text: string, keyword: string): number | null {
  const regex = new RegExp(`${keyword}[^0-9]{0,20}([0-9][0-9\\.,]+)`, 'i');
  const match = text.match(regex);
  if (!match) return null;
  return parseNumber(match[1]);
}

function normalizeInsuranceType(text: string, fallback: InsuranceType): InsuranceType {
  const normalized = text.toLowerCase();
  if (normalized.includes('hogar') || normalized.includes('vivienda')) return 'hogar';
  if (normalized.includes('comunidad') || normalized.includes('edificio')) return 'comunidad';
  if (normalized.includes('responsabilidad') || normalized.includes('rc')) return 'responsabilidad_civil';
  if (normalized.includes('impago') || normalized.includes('alquiler')) return 'impago_alquiler';
  if (normalized.includes('incendio')) return 'incendio';
  if (normalized.includes('robo')) return 'robo';
  if (normalized.includes('vida')) return 'vida';
  return fallback;
}

function normalizeStatus(text: string): string {
  const normalized = text.toLowerCase();
  if (normalized.includes('vencid')) return 'vencida';
  if (normalized.includes('cancel')) return 'cancelada';
  if (normalized.includes('pendiente') || normalized.includes('renov')) return 'pendiente_renovacion';
  return 'activa';
}

function inferDates(text: string, filename: string): { start: Date; end: Date } {
  const startMatch = text.match(/(?:fecha de efecto|fecha inicio|vigencia desde)[^0-9]*([0-9][0-9/.-]{6,})/i);
  const endMatch = text.match(/(?:fecha de vencimiento|vigencia hasta|fin de vigencia)[^0-9]*([0-9][0-9/.-]{6,})/i);
  const startDate = startMatch ? parseDateString(startMatch[1]) : null;
  const endDate = endMatch ? parseDateString(endMatch[1]) : null;

  if (startDate && endDate) return { start: startDate, end: endDate };

  const yearMatch = filename.match(/(20\\d{2})/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31),
    };
  }

  const now = new Date();
  return { start: now, end: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()) };
}

function extractPolicyNumber(text: string, filename: string): string | null {
  const match = text.match(/pol[ií]za[^0-9]*([A-Z0-9-/]{6,})/i);
  if (match) return match[1];
  const filenameMatch = filename.match(/([0-9]{6,})/);
  if (filenameMatch) return filenameMatch[1];
  return null;
}

function extractInsurer(text: string, filename: string): string | null {
  const lower = text.toLowerCase();
  for (const insurer of INSURER_KEYWORDS) {
    if (lower.includes(insurer)) {
      return insurer.charAt(0).toUpperCase() + insurer.slice(1);
    }
  }
  const lowerFile = filename.toLowerCase();
  for (const insurer of INSURER_KEYWORDS) {
    if (lowerFile.includes(insurer)) {
      return insurer.charAt(0).toUpperCase() + insurer.slice(1);
    }
  }
  return null;
}

function extractInsuredName(text: string): string | null {
  const match = text.match(/(tomador|asegurad[oa]|titular)[:\\s]+([A-ZÁÉÍÓÚÑ0-9 .,'-]{4,})/i);
  if (match) {
    return match[2].trim();
  }
  const line = findByKeywords(text, ['tomador', 'asegurado', 'titular']);
  if (line) {
    return line.replace(/tomador|asegurado|titular/gi, '').replace(/[:]/g, '').trim();
  }
  return null;
}

async function main() {
  const companyId = process.env.COMPANY_ID || process.argv[2];
  const rootArgIndex = process.argv.indexOf('--root');
  const rootDir = rootArgIndex >= 0 ? process.argv[rootArgIndex + 1] : '/tmp/viroda-seguros';
  const dryRun = process.argv.includes('--dry-run');

  if (!companyId) {
    console.error('Uso: COMPANY_ID=... npx tsx scripts/import-viroda-insurance-pdfs.ts [--root /ruta] [--dry-run]');
    process.exit(1);
  }

  const rootPath = path.resolve(rootDir);
  if (!fs.existsSync(rootPath)) {
    console.error('No existe la carpeta:', rootPath);
    process.exit(1);
  }

  const [company, buildings, units, existingPolicies] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { nombre: true } }),
    prisma.building.findMany({ where: { companyId }, select: { id: true, nombre: true, direccion: true } }),
    prisma.unit.findMany({ where: { building: { companyId } }, select: { id: true, numero: true, buildingId: true } }),
    prisma.insurance.findMany({ where: { companyId }, select: { numeroPoliza: true } }),
  ]);

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

  const pdfFiles: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) walk(fullPath);
      else if (entry.toLowerCase().endsWith('.pdf')) pdfFiles.push(fullPath);
    }
  };
  walk(rootPath);

  console.log('PDFs encontrados:', pdfFiles.length);

  let imported = 0;
  let skipped = 0;
  const errors: Array<{ file: string; error: string }> = [];

  for (let i = 0; i < pdfFiles.length; i++) {
    const filePath = pdfFiles[i];
    const rel = path.relative(rootPath, filePath);
    const parts = rel.split(path.sep);
    const buildingFolder = parts[0] || '';
    const unitFolder = parts.length >= 3 ? parts[1] : '';
    const filename = parts[parts.length - 1];

    const buffer = fs.readFileSync(filePath);
    let text = '';
    try {
      const parsed = await pdf(buffer);
      text = parsed.text || '';
    } catch (error: any) {
      errors.push({ file: rel, error: `PDF parse error: ${error?.message || error}` });
    }

    const policyNumber =
      extractPolicyNumber(text, filename) || `AUTO-${Date.now()}-${i}`.replace(/\s+/g, '');
    const aseguradora = extractInsurer(text, filename) || 'Desconocida';
    const nombreAsegurado = extractInsuredName(text) || company?.nombre || 'Titular';
    const { start, end } = inferDates(text, filename);
    const tipo = normalizeInsuranceType(`${buildingFolder} ${unitFolder} ${filename} ${text}`, unitFolder ? 'hogar' : 'comunidad');
    const estado = normalizeStatus(text);
    const primaAnual = extractNumberNear(text, 'prima anual');
    const sumaAsegurada = extractNumberNear(text, 'suma asegurada') || extractNumberNear(text, 'capital asegurado');
    const franquicia = extractNumberNear(text, 'franquicia');

    const policyKey = policyNumber.toLowerCase();
    if (existingSet.has(policyKey)) {
      skipped++;
      continue;
    }

    let buildingId: string | undefined;
    if (buildingFolder) {
      const normalizedBuilding = normalizeKey(buildingFolder);
      const match = buildingIndex.find(
        (b) =>
          b.name.includes(normalizedBuilding) ||
          normalizedBuilding.includes(b.name) ||
          b.address.includes(normalizedBuilding)
      );
      buildingId = match?.id;
    }

    let unitId: string | undefined;
    if (unitFolder) {
      const normalizedUnit = normalizeKey(unitFolder);
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
    }

    let urlDocumento: string | undefined;
    let documentosAdjuntos: Array<{ filename: string; url: string; uploadedAt: string }> | undefined;
    try {
      const upload = await S3Service.uploadFile(buffer, filename, 'seguros');
      urlDocumento = upload.url;
      documentosAdjuntos = [{ filename, url: upload.url, uploadedAt: new Date().toISOString() }];
    } catch (error: any) {
      errors.push({ file: rel, error: `Upload error: ${error?.message || error}` });
    }

    if (!dryRun) {
      await prisma.insurance.create({
        data: {
          companyId,
          buildingId,
          unitId,
          numeroPoliza: policyNumber,
          tipo,
          aseguradora,
          nombreAsegurado,
          fechaInicio: start,
          fechaVencimiento: end,
          estado,
          primaAnual: primaAnual ?? undefined,
          sumaAsegurada: sumaAsegurada ?? undefined,
          franquicia: franquicia ?? undefined,
          urlDocumento,
          documentosAdjuntos,
        },
      });
    }

    existingSet.add(policyKey);
    imported++;
  }

  console.log('Importados:', imported);
  console.log('Omitidos (duplicados):', skipped);
  if (errors.length) {
    console.log('Errores:', errors.length);
    errors.forEach((error) => console.log(error.file, '-', error.error));
  }
}

main()
  .catch((error) => {
    console.error('Error importando seguros:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
