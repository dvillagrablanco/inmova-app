/**
 * Puebla las referencias catastrales en Building y Unit desde los datos de escrituras.
 *
 * Datos fuente: escrituras procesadas con OCR + texto embebido.
 *
 * Uso: npx tsx scripts/populate-referencias-catastrales.ts
 */

import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

interface RefData {
  buildingHint: string;
  companyHint: string;
  refEdificio: string;
  unitsRefs?: { unitHint: string; ref: string }[];
}

const REFS: RefData[] = [
  {
    buildingHint: 'Silvela',
    companyHint: 'Viroda',
    refEdificio: '0858104VK4705H',
  },
  {
    buildingHint: 'Candelaria',
    companyHint: 'Viroda',
    refEdificio: '1210406VK4711A',
    unitsRefs: [
      { unitHint: '1 A', ref: '1210406VK4711A0002SR' },
      { unitHint: '1 B', ref: '1210406VK4711A0003DT' },
      { unitHint: '1 C', ref: '1210406VK4711A0004FY' },
      { unitHint: '1 D', ref: '1210406VK4711A0005GU' },
      { unitHint: '1 E', ref: '1210406VK4711A0006HI' },
      { unitHint: '2 A', ref: '1210406VK4711A0007JO' },
      { unitHint: '2 B', ref: '1210406VK4711A0008KP' },
      { unitHint: '2 C', ref: '1210406VK4711A0009LA' },
      { unitHint: '3 A', ref: '1210406VK4711A0010JO' },
      { unitHint: '3 B', ref: '1210406VK4711A0011KP' },
      { unitHint: '3 C', ref: '1210406VK4711A0012LA' },
      { unitHint: '4 A', ref: '1210406VK4711A0013BS' },
      { unitHint: '4 B', ref: '1210406VK4711A0014ZD' },
      { unitHint: '4 C', ref: '1210406VK4711A0015XF' },
    ],
  },
  {
    buildingHint: 'Reina',
    companyHint: 'Viroda',
    refEdificio: '0749012VK4704H',
    unitsRefs: [
      { unitHint: '1A', ref: '0749012VK4704H1003RZ' },
      { unitHint: '1B', ref: '0749012VK4704H1004TX' },
      { unitHint: '1C', ref: '0749012VK4704H1005YM' },
      { unitHint: '1D', ref: '0749012VK4704H1006UQ' },
      { unitHint: '2A', ref: '0749012VK4704H1007IW' },
      { unitHint: '2B', ref: '0749012VK4704H1008OE' },
      { unitHint: '2C', ref: '0749012VK4704H1009PR' },
      { unitHint: '2D', ref: '0749012VK4704H1010IW' },
      { unitHint: '3A', ref: '0749012VK4704H1011OE' },
      { unitHint: '3B', ref: '0749012VK4704H1012PR' },
      { unitHint: '3C', ref: '0749012VK4704H1013AT' },
      { unitHint: '3D', ref: '0749012VK4704H1014ZD' },
    ],
  },
  {
    buildingHint: 'Locales Reina',
    companyHint: 'Rovida',
    refEdificio: '0749012VK4704H',
    unitsRefs: [
      { unitHint: 'Local 1', ref: '0749012VK4704H1001WL' },
      { unitHint: 'Local 2', ref: '0749012VK4704H1002EB' },
    ],
  },
  {
    buildingHint: 'Piamonte',
    companyHint: 'Rovida',
    refEdificio: '1151510VK4715A',
  },
  {
    buildingHint: 'Barquillo',
    companyHint: 'Rovida',
    refEdificio: '1151815VK4715A',
  },
  {
    buildingHint: 'Espronceda',
    companyHint: 'Rovida',
    refEdificio: '1170903VK4717A',
  },
  {
    buildingHint: 'Prado',
    companyHint: 'Rovida',
    refEdificio: '0742703VK4704B',
    unitsRefs: [
      { unitHint: 'Sótano', ref: '0742703VK4704B00018D' },
      { unitHint: 'Local', ref: '0742703VK4704B0002DF' },
    ],
  },
  {
    buildingHint: 'Hernandez de Tejada',
    companyHint: 'Viroda',
    refEdificio: '4977209VK4747F',
  },
  {
    buildingHint: 'Garajes Hernández',
    companyHint: 'Rovida',
    refEdificio: '4977209VK4747F',
  },
  {
    buildingHint: 'Menendez Pelayo',
    companyHint: 'Viroda',
    refEdificio: '3023207UM7532S',
  },
];

const norm = (s: string) => s.replace(/[ºª°\s]/g, '').toUpperCase();

async function main() {
  console.log('=== POBLANDO REFERENCIAS CATASTRALES ===\n');

  let buildingsUpdated = 0;
  let unitsUpdated = 0;

  for (const r of REFS) {
    const company = await p.company.findFirst({
      where: { nombre: { contains: r.companyHint, mode: 'insensitive' } },
    });
    if (!company) continue;

    const building = await p.building.findFirst({
      where: {
        nombre: { contains: r.buildingHint, mode: 'insensitive' },
        companyId: company.id,
      },
      include: { units: true },
    });

    if (!building) {
      console.log('NOT FOUND: ' + r.buildingHint + ' (' + r.companyHint + ')');
      continue;
    }

    // Update building ref
    if (!building.referenciaCatastral || building.referenciaCatastral !== r.refEdificio) {
      await p.building.update({
        where: { id: building.id },
        data: { referenciaCatastral: r.refEdificio },
      });
      console.log('Building: ' + building.nombre + ' → ' + r.refEdificio);
      buildingsUpdated++;
    } else {
      console.log('Building: ' + building.nombre + ' ✓ ' + r.refEdificio);
    }

    // Update unit refs
    if (r.unitsRefs) {
      for (const ur of r.unitsRefs) {
        const unit = building.units.find(u =>
          norm(u.numero) === norm(ur.unitHint) ||
          norm(u.numero).includes(norm(ur.unitHint)) ||
          norm(ur.unitHint).includes(norm(u.numero))
        );

        if (unit) {
          if (!unit.referenciaCatastral || unit.referenciaCatastral !== ur.ref) {
            await p.unit.update({
              where: { id: unit.id },
              data: { referenciaCatastral: ur.ref },
            });
            console.log('  Unit ' + unit.numero + ' → ' + ur.ref);
            unitsUpdated++;
          }
        } else {
          console.log('  Unit NOT FOUND: ' + ur.unitHint);
        }
      }
    }
  }

  console.log('\n=== RESULTADO ===');
  console.log('Buildings actualizados: ' + buildingsUpdated);
  console.log('Units actualizadas: ' + unitsUpdated);

  // Verify
  console.log('\n=== VERIFICACIÓN ===');
  const allBuildings = await p.building.findMany({
    where: { isDemo: false, referenciaCatastral: { not: null } },
    select: { nombre: true, referenciaCatastral: true },
    orderBy: { nombre: 'asc' },
  });
  for (const b of allBuildings) {
    console.log(b.nombre.padEnd(35) + ' | ' + b.referenciaCatastral);
  }

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
