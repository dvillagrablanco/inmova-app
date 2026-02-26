/**
 * Vincula las escrituras 1368 (Incofasa→Rovida) y 2275 (Ampliación Capital)
 * a los edificios correspondientes y actualiza refs catastrales.
 *
 * Escritura 1368 - Incofasa → Rovida (26/05/2022) - Precio: 2.905.874,51€
 * Cubre 30 fincas:
 * 1) Naves Avda Cuba 38/38-D/38-T, Palencia (3 naves) → 731.780,98€
 * 2) Local Menéndez Pelayo 15, Palencia (baja+sótano) → 472.681,17€
 * 3-4) Garajes Menéndez Pelayo 17 planta -2 (nº76, nº81) → 7.333,48€ + 10.779,60€
 * 5) Rústica Grijota → 38.000€
 * 6-24) 19 Garajes Menéndez Pelayo 17 planta -1 → ~10.779,60€ c/u
 * 25) Naves Metal 4, Valladolid → valor en escritura
 * 26) Vivienda Constitución 8, 2ºA, Valladolid → valor en escritura
 * 27-30) 4 Garajes Constitución 5, Valladolid → valor en escritura
 *
 * Escritura 2275 - Ampliación Capital (19/12/2014)
 * Aporta a Rovida:
 * - Gemelos II: 1ºD (Ibiza 10), 3ºB (Ibiza 8), 20ºB (Ibiza 8), 20ºC (Ibiza 8)
 * - Gemelos IV: 17ºC (Ibiza 8)
 * - Gemelos II: plaza garaje + 1ºE (Ibiza 8) + 3ºE (Ibiza 8)
 *
 * Uso: npx tsx scripts/link-escrituras-incofasa-ampliacion.ts
 */

import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const rovida = await p.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });
  if (!rovida) { console.error('Rovida not found'); process.exit(1); }

  console.log('=== VINCULACIÓN ESCRITURAS 1368 + 2275 ===\n');

  // ─── ESCRITURA 1368: Vincular a edificios ───
  console.log('── Escritura 1368 (Incofasa → Rovida) ──');
  console.log('Precio total: 2.905.874,51€\n');

  const links1368 = [
    { hint: 'Cuba', ref: '4326610UM7542N', label: 'Naves Avda Cuba', valor: 731780.98 },
    { hint: 'Local Menéndez Pelayo 15', ref: '3023207UM7532S', label: 'Local Menéndez Pelayo 15', valor: 472681.17 },
    { hint: 'Garajes Menéndez Pelayo', ref: '3023206UM7532S', label: 'Garajes Menéndez Pelayo 17', valor: 216091.40 },
    { hint: 'Grijota', ref: '9961601UM6596S', label: 'Terreno Rústico Grijota', valor: 38000 },
    { hint: 'Metal', ref: '5702803UM5150B', label: 'Naves Metal 4 Valladolid', valor: null },
    { hint: 'Constitución 8', ref: '6326001UM5162E', label: 'Inmueble Constitución 8 Valladolid', valor: null },
    { hint: 'Constitución 5', ref: '6227324UM5162E', label: 'Garajes Constitución 5 Valladolid', valor: null },
  ];

  for (const link of links1368) {
    const building = await p.building.findFirst({
      where: { nombre: { contains: link.hint, mode: 'insensitive' }, companyId: rovida.id },
    });

    if (building) {
      if (!building.referenciaCatastral) {
        await p.building.update({
          where: { id: building.id },
          data: { referenciaCatastral: link.ref },
        });
        console.log('  ✓ ' + building.nombre + ' → ref: ' + link.ref);
      } else {
        console.log('  ✓ ' + building.nombre + ' (ref ya existe: ' + building.referenciaCatastral + ')');
      }

      // Link document
      const doc = await p.document.findFirst({
        where: { nombre: { contains: 'Escritura_1368' } },
      });
      if (doc && !doc.buildingId) {
        await p.document.update({ where: { id: doc.id }, data: { buildingId: building.id } });
      }
    } else {
      console.log('  ⚠ ' + link.label + ' - edificio no encontrado');
    }
  }

  // Create AssetAcquisition for 1368
  const existing1368 = await p.assetAcquisition.findFirst({
    where: { companyId: rovida.id, precioCompra: 2905874.51 },
  });
  if (existing1368) {
    console.log('\n  AssetAcquisition 1368 ya existe: ' + existing1368.id);
  } else {
    // Find the unlinked one from previous import
    const unlinked = await p.assetAcquisition.findFirst({
      where: { companyId: rovida.id, buildingId: null, notas: { contains: '1368' } },
    });
    if (unlinked) {
      await p.assetAcquisition.update({
        where: { id: unlinked.id },
        data: {
          precioCompra: 2905874.51,
          inversionTotal: 2905874.51,
          valorContableNeto: 2905874.51,
          notas: 'Escritura 1368 (26/05/2022)\nIncofasa → Rovida\nPrecio: 2.905.874,51€ (750.000€ transferencia + 2.155.874,51€ aplazado 5 años)\n30 fincas: Naves Cuba, Local+Garajes M.Pelayo, Terreno Grijota, Naves Metal Valladolid, Vivienda+Garajes Constitución Valladolid',
        },
      });
      console.log('\n  AssetAcquisition 1368 actualizado: ' + unlinked.id);
    } else {
      const created = await p.assetAcquisition.create({
        data: {
          companyId: rovida.id,
          assetType: 'otro',
          fechaAdquisicion: new Date('2022-05-26'),
          precioCompra: 2905874.51,
          inversionTotal: 2905874.51,
          valorContableNeto: 2905874.51,
          notas: 'Escritura 1368 (26/05/2022)\nIncofasa → Rovida\nPrecio: 2.905.874,51€\n30 fincas en Palencia y Valladolid',
        },
      });
      console.log('\n  AssetAcquisition 1368 creado: ' + created.id);
    }
  }

  // ─── ESCRITURA 2275: Vincular Gemelos ───
  console.log('\n── Escritura 2275 (Ampliación Capital) ──');
  console.log('Aporta inmuebles Benidorm a Rovida\n');

  const gemelLinks = [
    { hint: 'Gemelos IV', ref: '1397301YH5619N0402YJ', label: 'Gemelos IV (17ºC)' },
    { hint: 'Gemelos II', ref: '1397301YH5619N', label: 'Gemelos II (1ºD, 3ºB, 3ºE, 20ºB, 20ºC, 1ºE, garaje)' },
  ];

  for (const link of gemelLinks) {
    const building = await p.building.findFirst({
      where: { nombre: { contains: link.hint, mode: 'insensitive' }, companyId: rovida.id },
    });

    if (building) {
      if (!building.referenciaCatastral) {
        await p.building.update({
          where: { id: building.id },
          data: { referenciaCatastral: link.ref },
        });
        console.log('  ✓ ' + building.nombre + ' → ref: ' + link.ref);
      } else {
        console.log('  ✓ ' + building.nombre + ' (ref ya existe)');
      }

      // Link document
      const doc = await p.document.findFirst({
        where: { nombre: { contains: 'Escritura_2275' } },
      });
      if (doc && !doc.buildingId) {
        await p.document.update({ where: { id: doc.id }, data: { buildingId: building.id } });
      }
    } else {
      console.log('  ⚠ ' + link.label + ' - edificio no encontrado');
    }
  }

  // Gemelos XX ref
  const gemelXX = await p.building.findFirst({
    where: { nombre: { contains: 'Gemelos 20', mode: 'insensitive' }, companyId: rovida.id },
  });
  if (gemelXX && !gemelXX.referenciaCatastral) {
    await p.building.update({
      where: { id: gemelXX.id },
      data: { referenciaCatastral: '1397301YH5619N' },
    });
    console.log('  ✓ ' + gemelXX.nombre + ' → ref: 1397301YH5619N');
  }

  // ─── SUMMARY ───
  console.log('\n=== VERIFICACIÓN FINAL ===');
  const allBuildings = await p.building.findMany({
    where: { companyId: rovida.id, isDemo: false },
    select: { nombre: true, referenciaCatastral: true },
    orderBy: { nombre: 'asc' },
  });

  let withRef = 0;
  let withoutRef = 0;
  for (const b of allBuildings) {
    const status = b.referenciaCatastral ? '✓ ' + b.referenciaCatastral : '✗ SIN REF';
    if (b.referenciaCatastral) withRef++; else withoutRef++;
    console.log('  ' + b.nombre.padEnd(35) + ' | ' + status);
  }
  console.log('\nCon ref catastral: ' + withRef + ' | Sin ref: ' + withoutRef);

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
