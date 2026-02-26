/**
 * Script para actualizar las dimensiones de las viviendas de Manuel Silvela 5
 * Datos obtenidos del spreadsheet de compra con m2 reales y m2 catastrales.
 *
 * Uso: npx tsx scripts/update-silvela-dimensions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UnitUpdate {
  numero: string;
  superficie: number;
  superficieUtil?: number;
  habitaciones: number;
  banos: number;
  tipo: 'vivienda' | 'local';
  terraza: boolean;
  descripcionTipo: string;
}

const SILVELA_UNITS: UnitUpdate[] = [
  { numero: 'Local',  superficie: 127, superficieUtil: 346, habitaciones: 0, banos: 1, tipo: 'local',    terraza: false, descripcionTipo: 'Local grande bajo+sótano' },
  { numero: 'Bajo',   superficie: 33,  superficieUtil: 84,  habitaciones: 1, banos: 1, tipo: 'vivienda', terraza: false, descripcionTipo: 'Estudio 1 Hab. - Bajo' },
  { numero: '1ºA',    superficie: 124, superficieUtil: 204, habitaciones: 2, banos: 1, tipo: 'vivienda', terraza: false, descripcionTipo: 'Piso 2 Hab.' },
  { numero: '1ºB',    superficie: 71,                       habitaciones: 1, banos: 1, tipo: 'vivienda', terraza: false, descripcionTipo: 'Estudio 1 Hab.' },
  { numero: '2ºA',    superficie: 124, superficieUtil: 200, habitaciones: 2, banos: 1, tipo: 'vivienda', terraza: false, descripcionTipo: 'Piso 2 Hab.' },
  { numero: '2ºB',    superficie: 71,                       habitaciones: 1, banos: 1, tipo: 'vivienda', terraza: false, descripcionTipo: 'Estudio 1 Hab.' },
  { numero: '3ºA',    superficie: 124, superficieUtil: 200, habitaciones: 2, banos: 1, tipo: 'vivienda', terraza: false, descripcionTipo: 'Piso 2 Hab.' },
  { numero: '3ºB',    superficie: 71,                       habitaciones: 1, banos: 1, tipo: 'vivienda', terraza: false, descripcionTipo: 'Estudio 1 Hab.' },
  { numero: '4ºA',    superficie: 124, superficieUtil: 200, habitaciones: 2, banos: 1, tipo: 'vivienda', terraza: false, descripcionTipo: 'Piso 2 Hab.' },
  { numero: '4ºB',    superficie: 71,                       habitaciones: 1, banos: 1, tipo: 'vivienda', terraza: false, descripcionTipo: 'Estudio 1 Hab.' },
  { numero: '5ºA',    superficie: 124, superficieUtil: 204, habitaciones: 2, banos: 1, tipo: 'vivienda', terraza: false, descripcionTipo: 'Piso 2 Hab.' },
  { numero: '5ºB',    superficie: 71,                       habitaciones: 1, banos: 1, tipo: 'vivienda', terraza: false, descripcionTipo: 'Estudio 1 Hab.' },
  { numero: '6ºA',    superficie: 82,  superficieUtil: 181, habitaciones: 1, banos: 1, tipo: 'vivienda', terraza: true,  descripcionTipo: 'Duplex 1 Hab.+Terraza' },
  { numero: '6ºB',    superficie: 62,                       habitaciones: 1, banos: 1, tipo: 'vivienda', terraza: false, descripcionTipo: 'Estudio 1 Hab.' },
  { numero: '6ºC',    superficie: 55,                       habitaciones: 1, banos: 1, tipo: 'vivienda', terraza: true,  descripcionTipo: 'Estudio 1 Hab.+Terraza' },
];

async function main() {
  console.log('='.repeat(70));
  console.log('ACTUALIZACIÓN DIMENSIONES - MANUEL SILVELA 5');
  console.log('Fuente: Spreadsheet de datos de compra + catastro 2024');
  console.log('='.repeat(70));

  const building = await prisma.building.findFirst({
    where: {
      OR: [
        { nombre: { contains: 'Silvela', mode: 'insensitive' } },
        { direccion: { contains: 'Silvela', mode: 'insensitive' } },
      ],
    },
    include: { units: true },
  });

  if (!building) {
    console.error('ERROR: No se encontró el edificio Manuel Silvela 5');
    process.exit(1);
  }

  console.log(`\nEdificio encontrado: ${building.nombre} (ID: ${building.id})`);
  console.log(`Unidades existentes: ${building.units.length}\n`);

  let updated = 0;
  let notFound = 0;

  for (const unitData of SILVELA_UNITS) {
    const existing = building.units.find(
      (u) => u.numero === unitData.numero || u.numero.replace(/\s/g, '') === unitData.numero.replace(/\s/g, '')
    );

    if (!existing) {
      console.log(`  ⚠ No encontrada unidad "${unitData.numero}" - saltando`);
      notFound++;
      continue;
    }

    const changes: string[] = [];
    if (existing.superficie !== unitData.superficie)
      changes.push(`superficie: ${existing.superficie}→${unitData.superficie}`);
    if (unitData.superficieUtil && existing.superficieUtil !== unitData.superficieUtil)
      changes.push(`superficieUtil: ${existing.superficieUtil ?? 'null'}→${unitData.superficieUtil}`);
    if (existing.habitaciones !== unitData.habitaciones)
      changes.push(`habitaciones: ${existing.habitaciones}→${unitData.habitaciones}`);
    if (existing.banos !== unitData.banos)
      changes.push(`baños: ${existing.banos}→${unitData.banos}`);
    if (existing.tipo !== unitData.tipo)
      changes.push(`tipo: ${existing.tipo}→${unitData.tipo}`);
    if (unitData.terraza && !existing.terraza)
      changes.push(`terraza: false→true`);

    if (changes.length === 0) {
      console.log(`  ✓ ${unitData.numero} - sin cambios`);
      continue;
    }

    await prisma.unit.update({
      where: { id: existing.id },
      data: {
        superficie: unitData.superficie,
        ...(unitData.superficieUtil && { superficieUtil: unitData.superficieUtil }),
        habitaciones: unitData.habitaciones,
        banos: unitData.banos,
        tipo: unitData.tipo,
        ...(unitData.terraza && { terraza: true }),
      },
    });

    console.log(`  ✓ ${unitData.numero} (${unitData.descripcionTipo}): ${changes.join(', ')}`);
    updated++;
  }

  console.log('\n' + '='.repeat(70));
  console.log(`Resultado: ${updated} actualizadas, ${notFound} no encontradas, ${SILVELA_UNITS.length - updated - notFound} sin cambios`);
  console.log('='.repeat(70));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
