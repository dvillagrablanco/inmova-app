/**
 * Puebla las referencias catastrales de CADA UNIDAD individual
 * extraídas de todas las escrituras procesadas con OCR.
 *
 * Uso: npx tsx scripts/populate-all-unit-refs-catastrales.ts
 */

import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const norm = (s: string) => s.replace(/[ºª°\s]/g, '').toUpperCase();

interface UnitRef {
  buildingHint: string;
  companyHint: string;
  units: { hint: string; ref: string }[];
}

const DATA: UnitRef[] = [
  // ─── CANDELARIA MORA (Viroda) - Escritura 1236 ───
  {
    buildingHint: 'Candelaria',
    companyHint: 'Viroda',
    units: [
      { hint: '1 A', ref: '1210406VK4711A0002SR' },
      { hint: '1 B', ref: '1210406VK4711A0003DT' },
      { hint: '1 C', ref: '1210406VK4711A0004FY' },
      { hint: '1 D', ref: '1210406VK4711A0005GU' },
      { hint: '1 E', ref: '1210406VK4711A0006HI' },
      { hint: '2 A', ref: '1210406VK4711A0007JO' },
      { hint: '2 B', ref: '1210406VK4711A0008KP' },
      { hint: '2 C', ref: '1210406VK4711A0009LA' },
      { hint: '3 A', ref: '1210406VK4711A0010JO' },
      { hint: '3 B', ref: '1210406VK4711A0011KP' },
      { hint: '3 C', ref: '1210406VK4711A0012LA' },
      { hint: '4 A', ref: '1210406VK4711A0013BS' },
      { hint: '4 B', ref: '1210406VK4711A0014ZD' },
      { hint: '4 C', ref: '1210406VK4711A0015XF' },
    ],
  },
  // ─── REINA 15 viviendas (Viroda) - Escritura 441 ───
  {
    buildingHint: 'Reina',
    companyHint: 'Viroda',
    units: [
      { hint: '1A', ref: '0749012VK4704H1003RZ' },
      { hint: '1B', ref: '0749012VK4704H1004TX' },
      { hint: '1C', ref: '0749012VK4704H1005YM' },
      { hint: '1D', ref: '0749012VK4704H1006UQ' },
      { hint: '2A', ref: '0749012VK4704H1007IW' },
      { hint: '2B', ref: '0749012VK4704H1008OE' },
      { hint: '2C', ref: '0749012VK4704H1009PR' },
      { hint: '2D', ref: '0749012VK4704H1010IW' },
      { hint: '3A', ref: '0749012VK4704H1011OE' },
      { hint: '3B', ref: '0749012VK4704H1012PR' },
      { hint: '3C', ref: '0749012VK4704H1013AT' },
      { hint: '3D', ref: '0749012VK4704H1014ZD' },
    ],
  },
  // ─── REINA 15 locales (Rovida) - Escritura 441 ───
  {
    buildingHint: 'Locales Reina',
    companyHint: 'Rovida',
    units: [
      { hint: 'Local 1', ref: '0749012VK4704H1001WL' },
      { hint: 'Local 2', ref: '0749012VK4704H1002EB' },
    ],
  },
  // ─── PRADO 10 (Rovida) - Escritura 3651 ───
  {
    buildingHint: 'Prado',
    companyHint: 'Rovida',
    units: [
      { hint: 'Sótano', ref: '0742703VK4704B00018D' },
      { hint: 'Local', ref: '0742703VK4704B0002DF' },
    ],
  },
  // ─── BARQUILLO 30 (Rovida) - Escritura 1584 ───
  {
    buildingHint: 'Barquillo',
    companyHint: 'Rovida',
    units: [
      { hint: 'Local 1', ref: '1151815VK4715A0002TE' },
      { hint: 'Local 2', ref: '1151815VK4715A0003YR' },
      { hint: 'Local 3', ref: '1151815VK4715A0004UT' },
    ],
  },
  // ─── PIAMONTE 23 (Rovida) - Escritura 1108 ───
  {
    buildingHint: 'Piamonte',
    companyHint: 'Rovida',
    units: [
      { hint: 'Edificio', ref: '1151510VK4715A0001HW' },
    ],
  },
  // ─── SILVELA (Viroda) - Escritura 695 ───
  {
    buildingHint: 'Silvela',
    companyHint: 'Viroda',
    units: [
      { hint: 'Local', ref: '0858104VK4705H00011G' },
    ],
  },
  // ─── MENÉNDEZ PELAYO 15 local (Rovida) - Escritura 1368 ───
  {
    buildingHint: 'Local Menéndez Pelayo',
    companyHint: 'Rovida',
    units: [
      { hint: 'Local', ref: '3023207UM7532S0001SS' },
    ],
  },
  // ─── CONSTITUCIÓN 8 (Rovida) - Escritura 1368 ───
  {
    buildingHint: 'Constitución 8',
    companyHint: 'Rovida',
    units: [
      { hint: '2', ref: '6326001UM5162E0003TI' },
    ],
  },
  // ─── CONSTITUCIÓN 5 garajes (Rovida) - Escritura 1368 ───
  {
    buildingHint: 'Constitución 5',
    companyHint: 'Rovida',
    units: [
      { hint: 'Plaza 5', ref: '6227324UM5162E0039ES' },
      { hint: 'Plaza 14', ref: '6227324UM5162E00480K' },
      { hint: 'Plaza 12', ref: '6227324UM5162E0071MO' },
      { hint: 'Plaza 13', ref: '6227324UM5162E0072QP' },
    ],
  },
  // ─── NAVES METAL 4 (Rovida) - Escritura 1368 ───
  {
    buildingHint: 'Metal',
    companyHint: 'Rovida',
    units: [
      { hint: 'Nave', ref: '5702803UM5150B0001PP' },
    ],
  },
  // ─── NAVES CUBA (Rovida) - Escritura 1368 ───
  {
    buildingHint: 'Cuba',
    companyHint: 'Rovida',
    units: [
      { hint: '48-50-52', ref: '4326610UM7542N000101' },
    ],
  },
  // ─── GEMELOS IV (Rovida) - Escritura 2275 ───
  {
    buildingHint: 'Gemelos IV',
    companyHint: 'Rovida',
    units: [
      { hint: '17', ref: '1397301YH5619N0402YJ' },
    ],
  },
  // ─── GEMELOS II (Rovida) - Escrituras 2275 + 1279 ───
  {
    buildingHint: 'Gemelos II',
    companyHint: 'Rovida',
    units: [
      { hint: '1D', ref: '1397301YH5619N0147UK' },
      { hint: '3B', ref: '1397301YH5619N0301WD' },
      { hint: '20B', ref: '1397301YH5619N0011MA' },
      { hint: '20C', ref: '1397301YH5619N00120S' },
      { hint: '3E', ref: '1397301YH5619N0304TH' },
      { hint: '1E', ref: '1397301YH5619N0292JT' },
      { hint: 'Garaje', ref: '1399102YH5619N0078FE' },
      { hint: '17C', ref: '1397301YH5619N0403UK' },
    ],
  },
  // ─── GRIJOTA (Rovida) - Escritura 1368 ───
  {
    buildingHint: 'Grijota',
    companyHint: 'Rovida',
    units: [
      { hint: 'Terreno', ref: '9961601UM6596S0001KM' },
    ],
  },
];

async function main() {
  console.log('=== POBLANDO REFS CATASTRALES POR UNIDAD ===\n');
  let updated = 0;
  let notFound = 0;

  for (const d of DATA) {
    const company = await p.company.findFirst({
      where: { nombre: { contains: d.companyHint, mode: 'insensitive' } },
    });
    if (!company) continue;

    const building = await p.building.findFirst({
      where: { nombre: { contains: d.buildingHint, mode: 'insensitive' }, companyId: company.id },
      include: { units: true },
    });

    if (!building) {
      console.log('Building NOT FOUND: ' + d.buildingHint + ' (' + d.companyHint + ')');
      continue;
    }

    console.log(building.nombre + ' (' + building.units.length + ' uds):');

    for (const ur of d.units) {
      const unit = building.units.find(u =>
        norm(u.numero) === norm(ur.hint) ||
        norm(u.numero).includes(norm(ur.hint)) ||
        norm(ur.hint).includes(norm(u.numero))
      );

      if (unit) {
        if (unit.referenciaCatastral !== ur.ref) {
          await p.unit.update({
            where: { id: unit.id },
            data: { referenciaCatastral: ur.ref },
          });
          console.log('  ✓ ' + unit.numero + ' → ' + ur.ref);
          updated++;
        } else {
          console.log('  = ' + unit.numero + ' (ya tiene)');
        }
      } else {
        console.log('  ✗ Unit not found: ' + ur.hint);
        notFound++;
      }
    }
  }

  console.log('\n=== RESULTADO ===');
  console.log('Actualizadas: ' + updated);
  console.log('No encontradas: ' + notFound);

  // Count totals
  const totalUnits = await p.unit.count({ where: { building: { isDemo: false } } });
  const withRef = await p.unit.count({ where: { referenciaCatastral: { not: null }, building: { isDemo: false } } });
  console.log('Total units: ' + totalUnits + ' | Con ref: ' + withRef + ' | Sin ref: ' + (totalUnits - withRef));

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
