/**
 * Script de reclasificación de documentos.
 *
 * Busca documentos que tienen AMBOS buildingId y unitId asignados
 * y les quita el buildingId, dejándolos solo en la unidad.
 *
 * Ejecutar: npx tsx scripts/reclassify-unit-documents.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== RECLASIFICACIÓN DE DOCUMENTOS: unidades vs edificios ===\n');

  const docsWithBoth = await prisma.document.findMany({
    where: {
      buildingId: { not: null },
      unitId: { not: null },
    },
    select: {
      id: true,
      nombre: true,
      tipo: true,
      buildingId: true,
      unitId: true,
      building: { select: { nombre: true, direccion: true } },
      unit: { select: { numero: true } },
    },
  });

  console.log(`Documentos con buildingId + unitId: ${docsWithBoth.length}\n`);

  if (docsWithBoth.length === 0) {
    console.log('No hay documentos que reclasificar. Todo limpio.');
    return;
  }

  console.log('Documentos a reclasificar (se quitará buildingId):');
  for (const doc of docsWithBoth) {
    console.log(
      `  - [${doc.tipo}] "${doc.nombre}" → edificio: ${doc.building?.nombre || doc.building?.direccion || doc.buildingId}, unidad: ${doc.unit?.numero || doc.unitId}`,
    );
  }

  console.log(`\nActualizando ${docsWithBoth.length} documentos...`);

  const result = await prisma.document.updateMany({
    where: {
      buildingId: { not: null },
      unitId: { not: null },
    },
    data: {
      buildingId: null,
    },
  });

  console.log(`\n${result.count} documentos actualizados (buildingId → null).`);

  // Verificación
  const remaining = await prisma.document.count({
    where: {
      buildingId: { not: null },
      unitId: { not: null },
    },
  });

  console.log(`Verificación: ${remaining} documentos con ambos IDs (debe ser 0).`);
  console.log('\nReclasificación completada.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
