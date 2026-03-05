/**
 * Load insurance documents from downloaded Google Drive PDFs
 * Upload to S3 and update/create Insurance records in DB
 * 
 * Run: DATABASE_URL="..." npx tsx scripts/load-seguros-gdrive.ts
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// S3 config
const s3 = process.env.AWS_ACCESS_KEY_ID ? new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}) : null;
const S3_BUCKET = process.env.AWS_BUCKET || process.env.S3_BUCKET || 'inmova-documents';

// ============================================================================
// POLICY DATA (extracted from PDFs via pdftotext)
// ============================================================================

interface PolicyData {
  filename: string;
  numeroPoliza: string;
  aseguradora: string;
  tipo: 'comunidad' | 'hogar' | 'comercio' | 'otro';
  tomador: string;
  direccion: string;
  buildingMatch: string; // partial match for building name
  unitMatch?: string; // partial match for unit
  fechaInicio?: string;
  fechaVencimiento?: string;
  capitalEdificio?: number;
  capitalMobiliario?: number;
  numViviendas?: number;
  cobertura: string[];
}

const POLICIES: PolicyData[] = [
  {
    filename: 'Hdez_de_Tejada_SEGURO.pdf',
    numeroPoliza: '057780547',
    aseguradora: 'Allianz Seguros y Reaseguros S.A.',
    tipo: 'comunidad',
    tomador: 'VIRODA INVERSIONES SLU',
    direccion: 'Cl Hernandez De Tejada 6 y Garaje',
    buildingMatch: 'Hernandez de Tejada',
    fechaInicio: '2025-10-17',
    fechaVencimiento: '2026-10-17',
    cobertura: ['Daños materiales', 'Responsabilidad civil', 'RC Contaminación', 'Asistencia', 'Control de plagas', 'Protección jurídica', 'ITE/Eficiencia energética'],
  },
  {
    filename: 'POLIZA_85265721_VIRODA_CANDELARIA_MORA_14.pdf',
    numeroPoliza: '85265721',
    aseguradora: 'AXA Seguros Generales S.A.',
    tipo: 'comunidad',
    tomador: 'VIRODA INVERSIONES SLU',
    direccion: 'CALLE CALDELARIA MORA núm 12',
    buildingMatch: 'Candelaria Mora',
    fechaInicio: '2023-11-05',
    fechaVencimiento: '2026-11-05',
    capitalEdificio: 1696616,
    capitalMobiliario: 161241,
    numViviendas: 14,
    cobertura: ['Comunidad Integral', 'Daños materiales', 'Responsabilidad civil', 'Asistencia'],
  },
  {
    filename: 'POLIZA_85374359_VIRODA_C_REINA_15.pdf',
    numeroPoliza: '85374359',
    aseguradora: 'AXA Seguros Generales S.A.',
    tipo: 'comunidad',
    tomador: 'VIRODA INVERSIONES SLU',
    direccion: 'CALLE Reina núm 15',
    buildingMatch: 'Reina',
    fechaInicio: '2024-02-21',
    fechaVencimiento: '2027-02-21',
    capitalEdificio: 1518387,
    capitalMobiliario: 164424,
    numViviendas: 15,
    cobertura: ['Comunidad Integral', 'Daños materiales', 'Responsabilidad civil', 'Asistencia'],
  },
  {
    // NOTE: filename says 85120467 but content is poliza 85374359 (Reina 15) — this is actually another copy/mismatch
    // The actual content shows "nº 85374359" and "CALLE Reina núm 15" — skip as duplicate of above
    filename: 'POLIZA_85120467_ROVIDA_OFICINA_MENENDEZ_PELAYO_15.pdf',
    numeroPoliza: '85374359-DUP',
    aseguradora: 'AXA Seguros Generales S.A.',
    tipo: 'comunidad',
    tomador: 'VIRODA INVERSIONES SLU',
    direccion: 'CALLE Reina núm 15',
    buildingMatch: 'SKIP_DUPLICATE',
    cobertura: [],
  },
  {
    filename: 'POLIZA_85447715_ROVIDA_C_P__PIAMONTE_23.pdf',
    numeroPoliza: '85447715',
    aseguradora: 'AXA Seguros Generales S.A.',
    tipo: 'comunidad',
    tomador: 'ROVIDA S.L.',
    direccion: 'CALLE Piamonte núm 23',
    buildingMatch: 'Piamonte',
    fechaInicio: '2024-05-14',
    fechaVencimiento: '2026-05-14',
    capitalEdificio: 2008339,
    capitalMobiliario: 0,
    numViviendas: 0,
    cobertura: ['Comunidad Integral', 'Daños materiales', 'Responsabilidad civil', 'Asistencia'],
  },
  {
    filename: 'POLIZA_86523893_VIRODA_C_MANUEL_SILVERA_5.pdf',
    numeroPoliza: '86523893',
    aseguradora: 'AXA Seguros Generales S.A.',
    tipo: 'comunidad',
    tomador: 'VIRODA INVERSIONES SLU',
    direccion: 'CALLE Manuel Silvela núm 5',
    buildingMatch: 'Manuel Silvela',
    fechaInicio: '2026-03-04',
    fechaVencimiento: '2027-03-04',
    capitalEdificio: 1428000,
    capitalMobiliario: 164424,
    numViviendas: 14,
    cobertura: ['Comunidad Integral', 'Daños materiales', 'Responsabilidad civil', 'Asistencia'],
  },
  {
    filename: 'POLIZA_HOGAR_82712931_VIRODA_MENENDEZ_PELAYO_15_5_ATICO.pdf',
    numeroPoliza: '82712931',
    aseguradora: 'AXA Seguros Generales S.A.',
    tipo: 'hogar',
    tomador: 'VIRODA INVERSIONES SLU',
    direccion: 'CALLE Menéndez Pelayo núm 15 5º',
    buildingMatch: 'Menendez Pelayo',
    unitMatch: '5',
    fechaVencimiento: '2026-05-10',
    cobertura: ['Hogar Integral', 'Continente', 'Contenido', 'RC', 'Asistencia'],
  },
  {
    filename: 'POLIZA_HOGAR84844930_VIRODA_MENENDEZ_PELAYO_15_1.pdf',
    numeroPoliza: '84844930',
    aseguradora: 'AXA Seguros Generales S.A.',
    tipo: 'hogar',
    tomador: 'VIRODA INVERSIONES SLU',
    direccion: 'CALLE Menéndez Pelayo núm 15 1º',
    buildingMatch: 'Menendez Pelayo',
    unitMatch: '1',
    fechaVencimiento: '2026-06-10',
    cobertura: ['Hogar Integral', 'Continente', 'Contenido', 'RC', 'Asistencia'],
  },
  {
    filename: 'POLIZA_HOGAR_85481460_VIRODA_MENENDEZ_PELAYO_15_4_DR.pdf',
    numeroPoliza: '85481460',
    aseguradora: 'AXA Seguros Generales S.A.',
    tipo: 'hogar',
    tomador: 'VIRODA INVERSIONES SLU',
    direccion: 'CALLE Menéndez Pelayo núm 15 4º DR',
    buildingMatch: 'Menendez Pelayo',
    unitMatch: '4',
    fechaVencimiento: '2026-06-21',
    cobertura: ['Hogar Integral', 'Continente', 'Contenido', 'RC', 'Asistencia'],
  },
  {
    filename: 'ROVIDA__POLIZA_COMPLETA_86441815_PRADO_10.pdf',
    numeroPoliza: '86441815',
    aseguradora: 'AXA Seguros Generales S.A.',
    tipo: 'comercio',
    tomador: 'ROVIDA S.L.',
    direccion: 'CALLE Prado núm 10 PL 00 Y PL -01 PT 1',
    buildingMatch: 'Prado 10',
    cobertura: ['Comercio Integral', 'Daños materiales', 'RC', 'Asistencia'],
  },
];

async function main() {
  console.log('🔄 Loading insurance documents...\n');

  // Get all group companies
  const companies = await prisma.company.findMany({
    where: { OR: [
      { nombre: { contains: 'Vidaro' } },
      { nombre: { contains: 'Viroda' } },
      { nombre: { contains: 'Rovida' } },
      { nombre: { contains: 'Facundo' } },
    ]},
  });
  const companyIds = companies.map(c => c.id);
  console.log(`Companies: ${companies.map(c => c.nombre).join(', ')}`);

  // Get all buildings
  const buildings = await prisma.building.findMany({
    where: { companyId: { in: companyIds } },
    include: { units: { select: { id: true, numero: true, planta: true, tipo: true } } },
  });
  console.log(`Buildings: ${buildings.length}\n`);

  // Get existing insurances
  const existingIns = await prisma.insurance.findMany({
    where: { buildingId: { in: buildings.map(b => b.id) } },
  });
  const existingByPoliza = new Map(existingIns.map(i => [i.numeroPoliza, i]));

  let created = 0, updated = 0, skipped = 0;

  for (const pol of POLICIES) {
    if (pol.buildingMatch === 'SKIP_DUPLICATE') {
      console.log(`⏭️  SKIP duplicate: ${pol.filename}`);
      skipped++;
      continue;
    }

    // Skip Piamonte copy
    if (pol.filename === 'POLIZA_c_p_Piamonte_COPY.pdf') {
      console.log(`⏭️  SKIP copy: ${pol.filename}`);
      skipped++;
      continue;
    }

    console.log(`\n📄 Processing: ${pol.filename}`);
    console.log(`   Póliza: ${pol.numeroPoliza} | ${pol.aseguradora} | ${pol.tipo}`);

    // Find matching building
    const building = buildings.find(b => {
      const name = (b.nombre || b.direccion || '').toLowerCase();
      return name.includes(pol.buildingMatch.toLowerCase());
    });

    if (!building) {
      console.log(`   ⚠️ Building not found for: ${pol.buildingMatch}`);
      skipped++;
      continue;
    }
    console.log(`   🏢 Building: ${building.nombre || building.direccion} (${building.id.substring(0, 12)})`);

    // Find unit if applicable
    let unit = null;
    if (pol.unitMatch && building.units.length > 0) {
      unit = building.units.find(u => {
        const num = (u.numero || u.planta || '').toString();
        return num.includes(pol.unitMatch!);
      });
      if (unit) console.log(`   🏠 Unit: ${unit.numero || unit.planta} (${unit.id.substring(0, 12)})`);
    }

    // Upload PDF to S3
    let s3Url = '';
    const filePath = path.join(__dirname, '..', 'data', 'seguros', pol.filename);
    if (fs.existsSync(filePath)) {
      if (s3) {
        const fileBuffer = fs.readFileSync(filePath);
        const s3Key = `seguros/grupo-vidaro/${pol.numeroPoliza}_${pol.filename}`;
        try {
          await s3.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
            Body: fileBuffer,
            ContentType: 'application/pdf',
            Metadata: {
              poliza: pol.numeroPoliza,
              aseguradora: pol.aseguradora,
              edificio: building.nombre || building.direccion || '',
            },
          }));
          s3Url = `https://${S3_BUCKET}.s3.amazonaws.com/${s3Key}`;
          console.log(`   ☁️  S3: ${s3Url}`);
        } catch (err: any) {
          console.log(`   ⚠️ S3 upload failed: ${err.message}`);
          // Store local reference
          s3Url = `/data/seguros/${pol.filename}`;
        }
      } else {
        console.log(`   ⚠️ S3 not configured, storing local reference`);
        s3Url = `/data/seguros/${pol.filename}`;
      }
    }

    // Check if policy already exists
    const existing = existingByPoliza.get(pol.numeroPoliza);
    if (existing) {
      // Update existing: add document URL and cobertura
      console.log(`   🔄 Updating existing insurance: ${existing.id.substring(0, 12)}`);
      await prisma.insurance.update({
        where: { id: existing.id },
        data: {
          urlDocumento: s3Url || existing.urlDocumento,
          cobertura: pol.cobertura.length > 0 ? JSON.stringify(pol.cobertura) : existing.cobertura,
          ...(pol.fechaVencimiento ? { fechaVencimiento: new Date(pol.fechaVencimiento) } : {}),
          ...(pol.capitalEdificio ? { sumaAsegurada: pol.capitalEdificio } : {}),
          estado: 'activa',
        },
      });
      updated++;
    } else {
      // Create new insurance
      console.log(`   ✨ Creating new insurance`);
      const companyId = building.companyId;
      await prisma.insurance.create({
        data: {
          companyId,
          buildingId: building.id,
          ...(unit ? { unitId: unit.id } : {}),
          numeroPoliza: pol.numeroPoliza,
          aseguradora: pol.aseguradora,
          tipo: pol.tipo,
          nombreAsegurado: pol.tomador,
          cobertura: JSON.stringify(pol.cobertura),
          sumaAsegurada: pol.capitalEdificio || 0,
          fechaInicio: pol.fechaInicio ? new Date(pol.fechaInicio) : new Date('2024-01-01'),
          ...(pol.fechaVencimiento ? { fechaVencimiento: new Date(pol.fechaVencimiento) } : {}),
          estado: 'activa',
          urlDocumento: s3Url,
          notas: `Cargado desde Google Drive. Dirección: ${pol.direccion}. ${pol.numViviendas ? `Viviendas: ${pol.numViviendas}` : ''} ${pol.capitalMobiliario ? `Capital mobiliario: ${pol.capitalMobiliario}€` : ''}`.trim(),
        },
      });
      created++;
    }
  }

  // Also handle the Piamonte certificate (same poliza 85447715 but different document)
  const piamonteCert = 'POLIZA_c_p_Piamonte.pdf';
  const piamontePath = path.join(__dirname, '..', 'data', 'seguros', piamonteCert);
  if (fs.existsSync(piamontePath)) {
    const existing85447715 = existingByPoliza.get('85447715');
    if (existing85447715 && !existing85447715.documentosAdjuntos) {
      await prisma.insurance.update({
        where: { id: existing85447715.id },
        data: {
          documentosAdjuntos: JSON.stringify([{ name: piamonteCert, type: 'certificado', date: new Date().toISOString() }]),
        },
      });
      console.log(`\n📎 Added Piamonte certificate as attachment to poliza 85447715`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Done: ${created} created, ${updated} updated, ${skipped} skipped`);
  console.log(`${'='.repeat(50)}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
