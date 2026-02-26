/**
 * Script para actualizar los análisis de rentabilidad de edificios y unidades
 * usando los datos reales extraídos de las escrituras notariales.
 *
 * Acciones:
 * 1. Crea/actualiza AssetAcquisition con precios de compra reales
 * 2. Actualiza superficies de unidades (Candelaria Mora con datos de escritura)
 * 3. Actualiza superficies de Silvela con datos del spreadsheet de compra
 * 4. Calcula y muestra yields reales de cada edificio
 *
 * Uso:
 *   npx tsx scripts/update-rentabilidad-escrituras.ts          # dry-run
 *   npx tsx scripts/update-rentabilidad-escrituras.ts --apply   # aplicar
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const DRY_RUN = !process.argv.includes('--apply');
const prisma = new PrismaClient();

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

// ============================================================
// DATOS DE ESCRITURAS (precios de compra reales)
// ============================================================

interface EdificioEscritura {
  edificio_app: string;
  empresa: 'viroda' | 'rovida' | 'ambas';
  precio_compra: number;
  fecha_compra: string;
  vendedor: string;
  numero_escritura: number;
  ref_catastral?: string;
  notas?: string;
}

const EDIFICIOS_CON_PRECIO: EdificioEscritura[] = [
  {
    edificio_app: 'Manuel Silvela 5',
    empresa: 'viroda',
    precio_compra: 9697373.26,
    fecha_compra: '2022-03-04',
    vendedor: 'Edificio Agastia SL (NIF B-78117793)',
    numero_escritura: 695,
    ref_catastral: '0858104VK4705H',
  },
  {
    edificio_app: 'Candelaria Mora',
    empresa: 'viroda',
    precio_compra: 3500000,
    fecha_compra: '2023-05-17',
    vendedor: 'Clicpiso Real Estate II SL (NIF B-88301320)',
    numero_escritura: 1236,
    ref_catastral: '1210406VK4711A',
  },
  {
    edificio_app: 'Piamonte',
    empresa: 'rovida',
    precio_compra: 12100000,
    fecha_compra: '2024-05-13',
    vendedor: 'Inversiones Inmobiliarias Calle Piamonte SL',
    numero_escritura: 1108,
    ref_catastral: '1151510VK4715A',
  },
  {
    edificio_app: 'Barquillo',
    empresa: 'rovida',
    precio_compra: 548529.86,
    fecha_compra: '2023-06-20',
    vendedor: 'Domus Capital SL',
    numero_escritura: 1584,
    ref_catastral: '1151815VK4715A',
  },
  {
    edificio_app: 'Prado',
    empresa: 'rovida',
    precio_compra: 3150000,
    fecha_compra: '2025-12-23',
    vendedor: 'Pescaderías Coruñesas SL',
    numero_escritura: 3651,
    ref_catastral: '0742703VK4704B',
  },
];

// Superficies de Candelaria Mora por unidad (de la escritura 1236)
const CANDELARIA_FINCAS = [
  { desc: '1ºA', sup_constr: 62.81, sup_util: 36.41, ref: '1210406VK4711A0002SR', valor: 232584 },
  { desc: '1ºB', sup_constr: 64.71, sup_util: 37.51, ref: '1210406VK4711A0003DT', valor: 267253 },
  { desc: '1ºC', sup_constr: 58.72, sup_util: 34.04, ref: '1210406VK4711A0004FY', valor: 236223 },
  { desc: '1ºD', sup_constr: 94.90, sup_util: 55.02, ref: '1210406VK4711A0005GU', valor: 299000 },
  { desc: '1ºE', sup_constr: 93.16, sup_util: 54.00, ref: '1210406VK4711A0006HI', valor: 299000 },
  { desc: '2ºA', sup_constr: 62.81, sup_util: 36.41, ref: '1210406VK4711A0007JO', valor: 231049 },
  { desc: '2ºB', sup_constr: 64.71, sup_util: 37.51, ref: '1210406VK4711A0008KP', valor: 240880 },
  { desc: '2ºC', sup_constr: 58.72, sup_util: 34.04, ref: '1210406VK4711A0009LA', valor: 234688 },
  { desc: '3ºA', sup_constr: 62.81, sup_util: 36.41, ref: '1210406VK4711A0010JO', valor: 231049 },
  { desc: '3ºB', sup_constr: 64.71, sup_util: 37.51, ref: '1210406VK4711A0011KP', valor: 232089 },
  { desc: '3ºC', sup_constr: 58.72, sup_util: 34.04, ref: '1210406VK4711A0012LA', valor: 234688 },
  { desc: '4ºA', sup_constr: 62.81, sup_util: 36.41, ref: '1210406VK4711A0013BS', valor: 241375 },
  { desc: '4ºB', sup_constr: 64.71, sup_util: 37.51, ref: '1210406VK4711A0014ZD', valor: 260009 },
  { desc: '4ºC', sup_constr: 58.72, sup_util: 34.04, ref: '1210406VK4711A0015XF', valor: 260113 },
];

// Superficies de Silvela por unidad (spreadsheet de compra + catastro)
const SILVELA_UNITS = [
  { numero: 'Local', superficie: 127, superficieUtil: 346 },
  { numero: 'Bajo', superficie: 33, superficieUtil: 84 },
  { numero: '1ºA', superficie: 124, superficieUtil: 204 },
  { numero: '1ºB', superficie: 71 },
  { numero: '2ºA', superficie: 124, superficieUtil: 200 },
  { numero: '2ºB', superficie: 71 },
  { numero: '3ºA', superficie: 124, superficieUtil: 200 },
  { numero: '3ºB', superficie: 71 },
  { numero: '4ºA', superficie: 124, superficieUtil: 200 },
  { numero: '4ºB', superficie: 71 },
  { numero: '5ºA', superficie: 124, superficieUtil: 204 },
  { numero: '5ºB', superficie: 71 },
  { numero: '6ºA', superficie: 82, superficieUtil: 181 },
  { numero: '6ºB', superficie: 62 },
  { numero: '6ºC', superficie: 55 },
];

// ============================================================
// FUNCIONES
// ============================================================

async function findCompany(hint: string) {
  return prisma.company.findFirst({
    where: {
      nombre: { contains: hint, mode: 'insensitive' },
    },
  });
}

async function findBuilding(name: string) {
  return prisma.building.findFirst({
    where: {
      OR: [
        { nombre: { contains: name, mode: 'insensitive' } },
        { direccion: { contains: name, mode: 'insensitive' } },
      ],
    },
    include: {
      units: {
        include: {
          contracts: { where: { estado: 'activo' }, select: { rentaMensual: true } },
        },
      },
    },
  });
}

async function upsertAssetAcquisition(
  companyId: string,
  buildingId: string,
  data: EdificioEscritura,
) {
  const existing = await prisma.assetAcquisition.findFirst({
    where: { companyId, buildingId },
  });

  const notasText = [
    `Escritura nº ${data.numero_escritura}`,
    `Vendedor: ${data.vendedor}`,
    data.ref_catastral ? `Ref catastral: ${data.ref_catastral}` : null,
    data.notas || null,
  ].filter(Boolean).join('\n');

  if (existing) {
    const changes: string[] = [];
    if (existing.precioCompra !== data.precio_compra) changes.push(`precioCompra: ${existing.precioCompra}→${data.precio_compra}`);
    if (!existing.referenciaCatastral && data.ref_catastral) changes.push(`refCatastral: ${data.ref_catastral}`);

    if (changes.length > 0) {
      if (!DRY_RUN) {
        await prisma.assetAcquisition.update({
          where: { id: existing.id },
          data: {
            precioCompra: data.precio_compra,
            inversionTotal: data.precio_compra,
            valorContableNeto: data.precio_compra,
            fechaAdquisicion: new Date(data.fecha_compra),
            ...(data.ref_catastral && { referenciaCatastral: data.ref_catastral }),
            notas: notasText,
          },
        });
      }
      console.log(`    ${DRY_RUN ? '[DRY-RUN] ' : '✓ '}AssetAcquisition actualizado: ${changes.join(', ')}`);
    } else {
      console.log(`    AssetAcquisition ya correcto: ${fmt(existing.precioCompra)}`);
    }
    return existing;
  }

  if (DRY_RUN) {
    console.log(`    [DRY-RUN] Crearía AssetAcquisition: ${fmt(data.precio_compra)}`);
    return null;
  }

  const created = await prisma.assetAcquisition.create({
    data: {
      companyId,
      buildingId,
      assetType: 'edificio',
      fechaAdquisicion: new Date(data.fecha_compra),
      precioCompra: data.precio_compra,
      inversionTotal: data.precio_compra,
      valorContableNeto: data.precio_compra,
      ...(data.ref_catastral && { referenciaCatastral: data.ref_catastral }),
      notas: notasText,
    },
  });
  console.log(`    ✓ AssetAcquisition creado: ${created.id}`);
  return created;
}

async function updateUnitSurfaces(building: any, unitData: { numero: string; superficie: number; superficieUtil?: number }[]) {
  let updated = 0;
  for (const ud of unitData) {
    const unit = building.units.find(
      (u: any) => {
        const norm = (s: string) => s.replace(/\s/g, '').replace(/[ºª°]/g, '').toUpperCase();
        return norm(u.numero) === norm(ud.numero);
      }
    );
    if (!unit) continue;

    const changes: string[] = [];
    if (unit.superficie !== ud.superficie) changes.push(`sup: ${unit.superficie}→${ud.superficie}`);
    if (ud.superficieUtil && unit.superficieUtil !== ud.superficieUtil) changes.push(`supUtil: ${unit.superficieUtil ?? 'null'}→${ud.superficieUtil}`);

    if (changes.length > 0) {
      if (!DRY_RUN) {
        await prisma.unit.update({
          where: { id: unit.id },
          data: {
            superficie: ud.superficie,
            ...(ud.superficieUtil && { superficieUtil: ud.superficieUtil }),
          },
        });
      }
      console.log(`      ${DRY_RUN ? '[DRY-RUN] ' : '✓ '}${ud.numero}: ${changes.join(', ')}`);
      updated++;
    }
  }
  return updated;
}

function calcYields(building: any, precioCompra: number) {
  const units = building.units || [];
  const totalUnits = units.length;
  const occupied = units.filter((u: any) => u.contracts?.length > 0).length;

  // Renta mensual: de contratos activos o de rentaMensual del unit
  const rentaMensual = units.reduce((s: number, u: any) => {
    if (u.contracts?.length > 0) return s + u.contracts[0].rentaMensual;
    return s + (u.rentaMensual || 0);
  }, 0);

  const rentaAnual = rentaMensual * 12;
  const superficieTotal = units.reduce((s: number, u: any) => s + (u.superficie || 0), 0);

  const yieldBruto = precioCompra > 0 ? round((rentaAnual / precioCompra) * 100) : 0;
  const precioM2 = superficieTotal > 0 ? round(precioCompra / superficieTotal) : 0;
  const rentaM2Mes = superficieTotal > 0 ? round(rentaMensual / superficieTotal) : 0;
  const per = rentaAnual > 0 ? round(precioCompra / rentaAnual) : 0;
  const ocupacion = totalUnits > 0 ? round((occupied / totalUnits) * 100) : 0;

  return {
    totalUnits, occupied, rentaMensual: round(rentaMensual),
    rentaAnual: round(rentaAnual), superficieTotal: round(superficieTotal),
    yieldBruto, precioM2, rentaM2Mes, per, ocupacion,
  };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('═'.repeat(70));
  console.log(`ACTUALIZACIÓN RENTABILIDAD DESDE ESCRITURAS ${DRY_RUN ? '(DRY-RUN)' : '(APLICANDO)'}`);
  console.log('═'.repeat(70));

  if (DRY_RUN) console.log('Modo DRY-RUN. Usa --apply para ejecutar.\n');

  const viroda = await findCompany('Viroda');
  const rovida = await findCompany('Rovida');
  if (!viroda || !rovida) {
    console.error('ERROR: No se encontraron las empresas Viroda/Rovida');
    process.exit(1);
  }
  console.log(`Viroda: ${viroda.id} | Rovida: ${rovida.id}\n`);

  // ─────────────────────────────────────────────────────
  // 1. CREAR/ACTUALIZAR AssetAcquisition POR EDIFICIO
  // ─────────────────────────────────────────────────────
  console.log('═'.repeat(70));
  console.log('FASE 1: AssetAcquisitions (precios de compra reales)');
  console.log('═'.repeat(70));

  for (const ed of EDIFICIOS_CON_PRECIO) {
    const building = await findBuilding(ed.edificio_app);
    if (!building) {
      console.log(`\n⚠ ${ed.edificio_app}: No encontrado en BD`);
      continue;
    }

    const companies = ed.empresa === 'viroda' ? [viroda] : ed.empresa === 'rovida' ? [rovida] : [rovida, viroda];
    const precioPerCompany = ed.empresa === 'ambas' ? ed.precio_compra / companies.length : ed.precio_compra;

    console.log(`\n📍 ${building.nombre} (${building.units.length} uds)`);
    console.log(`   Escritura ${ed.numero_escritura}: ${fmt(ed.precio_compra)} (${ed.fecha_compra})`);

    for (const company of companies) {
      console.log(`  → ${company.nombre}:`);
      await upsertAssetAcquisition(company.id, building.id, {
        ...ed,
        precio_compra: precioPerCompany,
      });
    }
  }

  // ─────────────────────────────────────────────────────
  // 2. ACTUALIZAR SUPERFICIES DESDE ESCRITURAS
  // ─────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  console.log('FASE 2: Superficies de unidades');
  console.log('═'.repeat(70));

  // Silvela
  const silvela = await findBuilding('Silvela');
  if (silvela) {
    console.log(`\n📍 ${silvela.nombre} (${silvela.units.length} uds)`);
    const updated = await updateUnitSurfaces(silvela, SILVELA_UNITS);
    console.log(`   ${updated} unidades actualizadas`);
  }

  // Candelaria Mora
  const candelaria = await findBuilding('Candelaria');
  if (candelaria) {
    console.log(`\n📍 ${candelaria.nombre} (${candelaria.units.length} uds)`);
    const candelariaData = CANDELARIA_FINCAS.map(f => ({
      numero: f.desc.replace(/º/g, '° ').replace('°', 'º'),
      superficie: f.sup_constr,
      superficieUtil: f.sup_util,
    }));
    const updated = await updateUnitSurfaces(candelaria, candelariaData);
    console.log(`   ${updated} unidades actualizadas`);
  }

  // ─────────────────────────────────────────────────────
  // 3. CALCULAR Y MOSTRAR YIELDS REALES
  // ─────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  console.log('FASE 3: Análisis de rentabilidad con datos reales');
  console.log('═'.repeat(70));

  console.log('\n┌─────────────────────┬───────────────┬──────────┬───────────┬────────┬───────┬──────┬─────────┐');
  console.log('│ Edificio            │ Precio compra │ Renta/mes│ Renta/año │ Yield  │ €/m²  │ PER  │ Ocup.   │');
  console.log('├─────────────────────┼───────────────┼──────────┼───────────┼────────┼───────┼──────┼─────────┤');

  let totalPrecio = 0;
  let totalRentaMes = 0;
  let totalRentaAno = 0;
  let totalSuperficie = 0;

  for (const ed of EDIFICIOS_CON_PRECIO) {
    const building = await findBuilding(ed.edificio_app);
    if (!building) continue;

    const y = calcYields(building, ed.precio_compra);
    totalPrecio += ed.precio_compra;
    totalRentaMes += y.rentaMensual;
    totalRentaAno += y.rentaAnual;
    totalSuperficie += y.superficieTotal;

    const name = ed.edificio_app.padEnd(19).substring(0, 19);
    const precio = fmt(ed.precio_compra).padStart(13);
    const rMes = fmt(y.rentaMensual).padStart(8);
    const rAno = fmt(y.rentaAnual).padStart(9);
    const yld = `${y.yieldBruto}%`.padStart(6);
    const pm2 = `${y.precioM2}`.padStart(5);
    const per = `${y.per}x`.padStart(4);
    const ocup = `${y.ocupacion}%`.padStart(5);

    console.log(`│ ${name} │ ${precio} │ ${rMes} │ ${rAno} │ ${yld} │ ${pm2} │ ${per} │ ${ocup}   │`);
  }

  const totalYield = totalPrecio > 0 ? round((totalRentaAno / totalPrecio) * 100) : 0;
  const totalPM2 = totalSuperficie > 0 ? round(totalPrecio / totalSuperficie) : 0;
  const totalPER = totalRentaAno > 0 ? round(totalPrecio / totalRentaAno) : 0;

  console.log('├─────────────────────┼───────────────┼──────────┼───────────┼────────┼───────┼──────┼─────────┤');
  const tName = 'TOTAL PORTFOLIO'.padEnd(19);
  const tPrecio = fmt(totalPrecio).padStart(13);
  const tRMes = fmt(totalRentaMes).padStart(8);
  const tRAno = fmt(totalRentaAno).padStart(9);
  const tYld = `${totalYield}%`.padStart(6);
  const tPM2 = `${totalPM2}`.padStart(5);
  const tPER = `${totalPER}x`.padStart(4);
  console.log(`│ ${tName} │ ${tPrecio} │ ${tRMes} │ ${tRAno} │ ${tYld} │ ${tPM2} │ ${tPER} │         │`);
  console.log('└─────────────────────┴───────────────┴──────────┴───────────┴────────┴───────┴──────┴─────────┘');

  console.log('\n' + '═'.repeat(70));
  console.log(`COMPLETADO ${DRY_RUN ? '(DRY-RUN)' : ''}`);
  if (DRY_RUN) console.log('Para aplicar: npx tsx scripts/update-rentabilidad-escrituras.ts --apply');
  console.log('═'.repeat(70));
}

main()
  .catch((e) => {
    console.error('Error:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
