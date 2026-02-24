/**
 * Upload contract PDFs to S3 and create Document records
 * 
 * Reads PDFs from a ZIP file or directory, uploads to S3,
 * and links each document to the corresponding contract/unit/building.
 * 
 * Usage: npx tsx scripts/upload-contract-pdfs.ts <zip-or-dir-path>
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.AWS_BUCKET || process.env.AWS_S3_BUCKET || 'inmova';

interface PDFInfo {
  filename: string;
  buffer: Buffer;
  building: string;  // CANDELARIA, HERNANDEZ TEJADA, etc.
  unit: string;      // 1ºA, 2ºB, etc.
  subfolder: string; // Full subfolder path
}

function extractPDFsFromZip(zipPath: string): PDFInfo[] {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  const pdfs: PDFInfo[] = [];

  for (const entry of entries) {
    if (entry.isDirectory || !entry.entryName.endsWith('.pdf')) continue;

    const parts = entry.entryName.split('/').filter(Boolean);
    // Structure: CONTRATOS VIRODA.../BUILDING/UNIT/[subfolder/]file.pdf
    // or: BUILDING/UNIT/[subfolder/]file.pdf
    
    let building = '';
    let unit = '';
    let startIdx = 0;

    // Skip root folder if it exists
    for (let i = 0; i < parts.length; i++) {
      if (['CANDELARIA', 'HERNANDEZ TEJADA', 'MANUEL SILVELA', 'REINA', 'MENEDEZ PELAYO',
           'HERNANDEZ', 'MANUEL', 'GARAJES ESPRONCEDA'].some(b => parts[i].toUpperCase().includes(b))) {
        building = parts[i];
        startIdx = i;
        break;
      }
    }

    if (!building && parts.length >= 2) {
      building = parts[0];
      startIdx = 0;
    }

    unit = parts[startIdx + 1] || '';

    const buffer = entry.getData();
    if (buffer.length > 0) {
      pdfs.push({
        filename: parts[parts.length - 1],
        buffer,
        building,
        unit,
        subfolder: parts.slice(startIdx, parts.length - 1).join('/'),
      });
    }
  }

  return pdfs;
}

function extractPDFsFromDir(dirPath: string): PDFInfo[] {
  const pdfs: PDFInfo[] = [];

  function walk(dir: string, relativePath: string = '') {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relPath = relativePath ? `${relativePath}/${item}` : item;
      
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath, relPath);
      } else if (item.endsWith('.pdf')) {
        const parts = relPath.split('/');
        pdfs.push({
          filename: item,
          buffer: fs.readFileSync(fullPath),
          building: parts[0] || '',
          unit: parts[1] || '',
          subfolder: parts.slice(0, parts.length - 1).join('/'),
        });
      }
    }
  }

  walk(dirPath);
  return pdfs;
}

async function uploadToS3(buffer: Buffer, key: string): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
  }));
  return key;
}

function matchBuilding(hint: string, buildings: any[]): any | null {
  const h = hint.toUpperCase();
  return buildings.find(b => {
    const n = b.nombre.toUpperCase();
    if (h.includes('CANDELARIA')) return n.includes('CANDELARIA');
    if (h.includes('TEJADA') || h.includes('HERNANDEZ')) return n.includes('TEJADA') && !n.includes('GARAJE');
    if (h.includes('SILVELA') || h.includes('MANUEL')) return n.includes('SILVELA');
    if (h.includes('REINA')) return n.includes('REINA') && !n.includes('LOCAL');
    if (h.includes('PELAYO') || h.includes('MENEDEZ') || h.includes('MENÉNDEZ')) return n.includes('PELAYO') && !n.includes('GARAJE') && !n.includes('LOCAL');
    if (h.includes('ESPRONCEDA')) return n.includes('ESPRONCEDA');
    if (h.includes('BARQUILLO')) return n.includes('BARQUILLO');
    if (h.includes('PIAMONTE')) return n.includes('PIAMONTE');
    return n.includes(h.substring(0, 6));
  }) || null;
}

function matchUnit(hint: string, units: any[]): any | null {
  const h = hint.replace(/[ºª]/g, '').toLowerCase().trim();
  return units.find(u => {
    const n = u.numero.replace(/[ºª]/g, '').toLowerCase();
    return n === h || n.includes(h) || h.includes(n.replace('plaza ', ''));
  }) || null;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: npx tsx scripts/upload-contract-pdfs.ts <zip-or-dir-path>');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  UPLOAD CONTRACT PDFs TO DOCUMENT REPOSITORY');
  console.log('═══════════════════════════════════════════════════════════');

  // Extract PDFs
  let pdfs: PDFInfo[];
  if (inputPath.endsWith('.zip') || inputPath.endsWith('.xlsx')) {
    console.log(`\n📦 Extracting from ZIP: ${inputPath}`);
    pdfs = extractPDFsFromZip(inputPath);
  } else {
    console.log(`\n📂 Reading from directory: ${inputPath}`);
    pdfs = extractPDFsFromDir(inputPath);
  }

  console.log(`   Found ${pdfs.length} PDF files`);

  // Get all buildings for both companies
  const companies = await prisma.company.findMany({
    where: { nombre: { in: ['Rovida S.L.', 'Viroda Inversiones S.L.'] } },
    include: {
      buildings: {
        include: {
          units: {
            include: {
              contracts: { where: { estado: 'activo' }, take: 1, select: { id: true, tenantId: true } },
            },
          },
        },
      },
    },
  });

  const allBuildings = companies.flatMap(c => c.buildings);
  console.log(`   ${allBuildings.length} buildings in DB`);

  let uploaded = 0, linked = 0, skipped = 0, errors = 0;

  for (const pdf of pdfs) {
    try {
      // Skip non-contract files (DNIs, photos, etc.)
      const fname = pdf.filename.toLowerCase();
      if (!fname.includes('contrato') && !fname.includes('arrendamiento') && 
          !fname.includes('adenda') && !fname.includes('anexo') && 
          !fname.includes('sepa') && !fname.includes('fianza')) {
        skipped++;
        continue;
      }

      // Check if document already exists
      const existing = await prisma.document.findFirst({
        where: { nombre: pdf.filename, tipo: 'contrato' },
      });
      if (existing) {
        skipped++;
        continue;
      }

      // Upload to S3
      const timestamp = Date.now();
      const safeName = pdf.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const s3Key = `contratos/${timestamp}-${safeName}`;
      
      await uploadToS3(pdf.buffer, s3Key);
      uploaded++;

      // Find matching building and unit
      const building = matchBuilding(pdf.building, allBuildings);
      const unit = building ? matchUnit(pdf.unit, building.units) : null;
      const contract = unit?.contracts?.[0];

      // Create Document record
      await prisma.document.create({
        data: {
          nombre: pdf.filename,
          tipo: 'contrato',
          cloudStoragePath: s3Key,
          buildingId: building?.id || null,
          unitId: unit?.id || null,
          contractId: contract?.id || null,
          tenantId: contract?.tenantId || null,
          tags: ['contrato', 'importado', pdf.building.toLowerCase()],
          descripcion: `Contrato ${pdf.building} ${pdf.unit} - Importado automáticamente`,
        },
      });

      if (contract) linked++;

      if (uploaded <= 10 || uploaded % 20 === 0) {
        console.log(`   ✅ ${pdf.building}/${pdf.unit}: ${pdf.filename} → ${building?.nombre || '?'}${contract ? ' ✓linked' : ''}`);
      }

    } catch (error: any) {
      errors++;
      if (errors <= 3) {
        console.log(`   ❌ ${pdf.filename}: ${error.message?.slice(0, 60)}`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  ✅ PDFs subidos a S3: ${uploaded}`);
  console.log(`  🔗 Vinculados a contrato: ${linked}`);
  console.log(`  ⏭️ Omitidos (ya existen o no son contratos): ${skipped}`);
  console.log(`  ❌ Errores: ${errors}`);
  console.log(`  📊 Total procesados: ${pdfs.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
