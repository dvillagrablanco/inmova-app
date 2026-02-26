/**
 * Script: Migrar keys de S3 al formato companies/{companyId}/...
 * 
 * El nuevo formato de seguridad requiere que cada archivo esté bajo
 * el prefijo companies/{companyId}/ para verificar ownership.
 * 
 * Este script:
 * 1. Lista todos los documentos en BD que tienen URL de S3
 * 2. Copia cada archivo al nuevo path con prefijo de empresa
 * 3. Actualiza la URL en BD
 * 4. Opcionalmente borra el archivo viejo
 * 
 * Uso: npx tsx scripts/migrate-s3-keys.ts [--dry-run] [--delete-old]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');
const DELETE_OLD = process.argv.includes('--delete-old');

// S3 config
const BUCKET = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME || process.env.AWS_BUCKET || '';
const REGION = process.env.AWS_REGION || 'eu-north-1';

async function getS3Client() {
  const { S3Client, CopyObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  return {
    client: new S3Client({ region: REGION }),
    CopyObjectCommand,
    DeleteObjectCommand,
  };
}

/**
 * Extrae la key de S3 desde una URL completa
 */
function extractS3Key(url: string): string | null {
  if (!url) return null;
  
  // https://bucket.s3.region.amazonaws.com/key
  const match1 = url.match(/amazonaws\.com\/(.+)$/);
  if (match1) return decodeURIComponent(match1[1]);
  
  // https://s3.region.amazonaws.com/bucket/key
  const match2 = url.match(/amazonaws\.com\/[^/]+\/(.+)$/);
  if (match2) return decodeURIComponent(match2[1]);
  
  // Already a key (no https://)
  if (!url.startsWith('http')) return url;
  
  return null;
}

/**
 * Construye la nueva key con prefijo de empresa
 */
function buildNewKey(oldKey: string, companyId: string): string {
  // Si ya tiene el prefijo, no cambiar
  if (oldKey.startsWith(`companies/${companyId}/`)) return oldKey;
  if (oldKey.startsWith('companies/')) return oldKey; // Ya migrado a otra empresa
  
  return `companies/${companyId}/${oldKey}`;
}

/**
 * Construye URL de S3 desde key
 */
function buildS3Url(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

async function migrateDocuments() {
  console.log('📄 Migrando documentos...');
  
  const documents = await prisma.document.findMany({
    where: {
      url: { not: null, contains: 'amazonaws.com' },
    },
    select: {
      id: true,
      url: true,
      companyId: true,
    },
  });

  console.log(`  Encontrados: ${documents.length} documentos con URL de S3`);
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of documents) {
    if (!doc.url || !doc.companyId) { skipped++; continue; }
    
    const oldKey = extractS3Key(doc.url);
    if (!oldKey) { skipped++; continue; }
    
    const newKey = buildNewKey(oldKey, doc.companyId);
    if (newKey === oldKey) { skipped++; continue; } // Ya migrado
    
    if (DRY_RUN) {
      console.log(`  [DRY] ${oldKey} → ${newKey}`);
      migrated++;
      continue;
    }

    try {
      const { client, CopyObjectCommand, DeleteObjectCommand } = await getS3Client();
      
      // Copy to new location
      await client.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${oldKey}`,
        Key: newKey,
      }));
      
      // Update DB
      await prisma.document.update({
        where: { id: doc.id },
        data: { url: buildS3Url(newKey) },
      });
      
      // Delete old
      if (DELETE_OLD) {
        await client.send(new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: oldKey,
        }));
      }
      
      migrated++;
    } catch (err: any) {
      console.error(`  ❌ Error migrando ${oldKey}: ${err.message}`);
      errors++;
    }
  }

  return { migrated, skipped, errors };
}

async function migrateUnitImages() {
  console.log('🏠 Migrando imágenes de unidades...');
  
  const units = await prisma.unit.findMany({
    where: {
      imagenes: { isEmpty: false },
    },
    select: {
      id: true,
      imagenes: true,
      building: {
        select: { companyId: true },
      },
    },
  });

  console.log(`  Encontradas: ${units.length} unidades con imágenes`);
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const unit of units) {
    const companyId = unit.building?.companyId;
    if (!companyId || !unit.imagenes?.length) { skipped++; continue; }
    
    const newImagenes: string[] = [];
    let changed = false;
    
    for (const imgUrl of unit.imagenes) {
      const oldKey = extractS3Key(imgUrl);
      if (!oldKey) { newImagenes.push(imgUrl); continue; }
      
      const newKey = buildNewKey(oldKey, companyId);
      if (newKey === oldKey) { newImagenes.push(imgUrl); continue; }
      
      changed = true;
      
      if (DRY_RUN) {
        console.log(`  [DRY] ${oldKey} → ${newKey}`);
        newImagenes.push(buildS3Url(newKey));
        migrated++;
        continue;
      }

      try {
        const { client, CopyObjectCommand, DeleteObjectCommand } = await getS3Client();
        
        await client.send(new CopyObjectCommand({
          Bucket: BUCKET,
          CopySource: `${BUCKET}/${oldKey}`,
          Key: newKey,
        }));
        
        newImagenes.push(buildS3Url(newKey));
        
        if (DELETE_OLD) {
          await client.send(new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: oldKey,
          }));
        }
        
        migrated++;
      } catch (err: any) {
        console.error(`  ❌ Error migrando imagen ${oldKey}: ${err.message}`);
        newImagenes.push(imgUrl); // Keep old URL on error
        errors++;
      }
    }
    
    if (changed && !DRY_RUN) {
      await prisma.unit.update({
        where: { id: unit.id },
        data: { imagenes: newImagenes },
      });
    }
  }

  return { migrated, skipped, errors };
}

async function main() {
  console.log('═'.repeat(60));
  console.log('🔄 MIGRACIÓN DE KEYS S3 → companies/{companyId}/...');
  console.log('═'.repeat(60));
  if (DRY_RUN) console.log('⚠️  MODO DRY-RUN: no se realizarán cambios\n');
  if (DELETE_OLD) console.log('⚠️  DELETE-OLD: se borrarán archivos originales\n');
  if (!BUCKET) {
    console.error('❌ AWS_S3_BUCKET / AWS_BUCKET_NAME no configurado');
    process.exit(1);
  }
  console.log(`  Bucket: ${BUCKET}`);
  console.log(`  Región: ${REGION}\n`);

  const docResult = await migrateDocuments();
  console.log(`  Documentos: ${docResult.migrated} migrados, ${docResult.skipped} omitidos, ${docResult.errors} errores\n`);

  const imgResult = await migrateUnitImages();
  console.log(`  Imágenes: ${imgResult.migrated} migradas, ${imgResult.skipped} omitidas, ${imgResult.errors} errores\n`);

  const total = docResult.migrated + imgResult.migrated;
  const totalErrors = docResult.errors + imgResult.errors;
  
  console.log('═'.repeat(60));
  console.log(`✅ Total migrado: ${total} archivos`);
  console.log(`❌ Errores: ${totalErrors}`);
  if (DRY_RUN) console.log('\n⚠️  Ejecutar sin --dry-run para aplicar cambios');
  console.log('═'.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
