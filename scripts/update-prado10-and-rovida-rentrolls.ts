/**
 * Actualiza Prado 10 con renta estimada de la escritura y los rent rolls
 * de todos los edificios de Rovida desde el spreadsheet de gestión.
 *
 * Datos Prado 10 (de escritura 3651):
 * - Arrendatario: Boca Prado SLU (contrato 15/01/2016)
 * - Renta mensual estimada: ~12.000€/mes sin IVA (calculado del prorrateo de 8 días en dic: 3.096,77€)
 *
 * Datos de otros edificios (del spreadsheet):
 * - Oficina Av Europa: 4 inquilinos, total ~6.426€/mes
 * - Barquillo 30: Projects BC, renta escalonada desde 7.200€/mes
 * - Locales Reina 15: The Stage Ventures, 2.072€ + 4.144€ = 6.216€/mes
 * - Piamonte 23: Impulsa Hub Sur SL, 47.790,58€/mes
 * - Nave Avda Cuba: Hiper CH, 8.000€/mes
 * - Oficina Valladolid: 6 inquilinos, ~4.252€/mes
 * - Oficina Palencia: Vidaro, 711,98€/mes
 *
 * Uso: npx tsx scripts/update-prado10-and-rovida-rentrolls.ts
 */

import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const rovida = await p.company.findFirst({ where: { nombre: { contains: 'Rovida', mode: 'insensitive' } } });
  if (!rovida) { console.error('Rovida not found'); process.exit(1); }

  // === PRADO 10 ===
  console.log('=== PRADO 10 ===');
  const prado = await p.building.findFirst({
    where: { nombre: { contains: 'Prado', mode: 'insensitive' }, companyId: rovida.id },
    include: { units: true },
  });
  if (prado) {
    for (const unit of prado.units) {
      const renta = unit.numero === 'Local Comercial' ? 12000 : 0;
      if (renta > 0 && unit.rentaMensual !== renta) {
        await p.unit.update({
          where: { id: unit.id },
          data: { rentaMensual: renta, estado: 'ocupada' },
        });
        console.log('  ' + unit.numero + ': rentaMensual → ' + renta + '€');
      }
    }
  }

  // === PIAMONTE 23 ===
  console.log('\n=== PIAMONTE 23 ===');
  await updateBuildingRent(rovida.id, 'Piamonte', [
    { hint: '', renta: 47790.58 },
  ]);

  // === BARQUILLO 30 ===
  console.log('\n=== BARQUILLO 30 ===');
  const barquillo = await p.building.findFirst({
    where: { nombre: { contains: 'Barquillo', mode: 'insensitive' }, companyId: rovida.id },
    include: { units: true },
  });
  if (barquillo) {
    for (const unit of barquillo.units) {
      if (unit.rentaMensual !== 7200) {
        await p.unit.update({
          where: { id: unit.id },
          data: { rentaMensual: 7200, estado: 'ocupada' },
        });
        console.log('  ' + unit.numero + ': rentaMensual → 7.200€ (Projects BC)');
      }
    }
  }

  // === LOCALES REINA 15 (Rovida) ===
  console.log('\n=== LOCALES REINA 15 ===');
  const reinaLocales = await p.building.findFirst({
    where: { nombre: { contains: 'Locales Reina', mode: 'insensitive' }, companyId: rovida.id },
    include: { units: true },
  });
  if (reinaLocales) {
    const rentas = [2072, 4144];
    for (let i = 0; i < Math.min(reinaLocales.units.length, rentas.length); i++) {
      const unit = reinaLocales.units[i];
      if (unit.rentaMensual !== rentas[i]) {
        await p.unit.update({
          where: { id: unit.id },
          data: { rentaMensual: rentas[i], estado: 'ocupada' },
        });
        console.log('  ' + unit.numero + ': rentaMensual → ' + rentas[i] + '€ (The Stage Ventures)');
      }
    }
  }

  // === NAVE AVDA CUBA ===
  console.log('\n=== NAVE AVDA CUBA ===');
  await updateBuildingRent(rovida.id, 'Cuba', [
    { hint: '', renta: 8000 },
  ]);

  // === OFICINA AV EUROPA ===
  console.log('\n=== OFICINA AV EUROPA ===');
  await updateBuildingRent(rovida.id, 'Europa', [
    { hint: '', renta: 6426.73 },
  ]);

  // === OFICINA VALLADOLID (Constitución 8) ===
  console.log('\n=== OFICINA VALLADOLID ===');
  const valladolid = await p.building.findFirst({
    where: { nombre: { contains: 'Constitución 8', mode: 'insensitive' }, companyId: rovida.id },
    include: { units: true },
  });
  if (valladolid) {
    const modulos: Record<string, number> = {
      '1': 584.30, '2': 619.84, '3': 619.84, '4': 339.84,
      '5': 608.09, '6': 585.85, '7': 654.08, '8': 240.82,
    };
    for (const unit of valladolid.units) {
      const renta = modulos[unit.numero] || modulos[unit.numero.replace('Módulo ', '')] || 0;
      if (renta > 0 && Math.abs(unit.rentaMensual - renta) > 1) {
        await p.unit.update({
          where: { id: unit.id },
          data: { rentaMensual: renta, estado: 'ocupada' },
        });
        console.log('  ' + unit.numero + ': rentaMensual → ' + renta + '€');
      }
    }
  }

  // === SUMMARY ===
  console.log('\n=== RESUMEN RENTAS ROVIDA ===');
  const buildings = await p.building.findMany({
    where: { companyId: rovida.id, isDemo: false },
    include: { units: true },
    orderBy: { nombre: 'asc' },
  });
  let totalRenta = 0;
  for (const b of buildings) {
    const renta = b.units.reduce((s, u) => s + u.rentaMensual, 0);
    totalRenta += renta;
    if (renta > 0) {
      const ocupadas = b.units.filter(u => u.estado === 'ocupada').length;
      console.log(b.nombre.padEnd(35) + ' | ' + b.units.length + ' uds | ' +
        ocupadas + ' ocup | ' + renta.toLocaleString('es-ES') + ' €/mes');
    }
  }
  console.log('TOTAL ROVIDA: ' + totalRenta.toLocaleString('es-ES') + ' €/mes = ' +
    (totalRenta * 12).toLocaleString('es-ES') + ' €/año');

  await p.$disconnect();
}

async function updateBuildingRent(companyId: string, hint: string, units: { hint: string; renta: number }[]) {
  const building = await p.building.findFirst({
    where: { nombre: { contains: hint, mode: 'insensitive' }, companyId },
    include: { units: true },
  });
  if (!building) { console.log('  Not found: ' + hint); return; }

  if (building.units.length === 1 && units.length === 1) {
    const unit = building.units[0];
    if (Math.abs(unit.rentaMensual - units[0].renta) > 1) {
      await p.unit.update({
        where: { id: unit.id },
        data: { rentaMensual: units[0].renta, estado: 'ocupada' },
      });
      console.log('  ' + unit.numero + ': rentaMensual → ' + units[0].renta + '€');
    } else {
      console.log('  ' + unit.numero + ': ya correcto (' + unit.rentaMensual + '€)');
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
