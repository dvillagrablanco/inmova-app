/**
 * Importa los precios extraídos de las escrituras de Reina 15, H. Tejada 6 y Espronceda 32.
 *
 * Datos extraídos por reprocesamiento de escrituras:
 * - Reina 15 (Esc. 441): Total 9.150.000€ + IVA → Locales 3.450.000€ (Rovida) + Viviendas 5.700.000€ (Viroda)
 * - H. Tejada 6 (Esc. 2747): Total 4.775.000€ → Garajes 1.029.435,99€ (Rovida) + Viviendas 3.745.564,01€ (Viroda)
 * - Espronceda 32 (Esc. 3561): 2.964.500€ + IVA 622.545€ = 3.587.045€ (Rovida)
 *
 * Uso: npx tsx scripts/import-precios-reina-htejada-espronceda.ts
 */

import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const viroda = await p.company.findFirst({ where: { nombre: { contains: 'Viroda', mode: 'insensitive' } } });
  const rovida = await p.company.findFirst({ where: { nombre: { contains: 'Rovida', mode: 'insensitive' } } });
  if (!viroda || !rovida) { console.error('Companies not found'); process.exit(1); }

  const updates = [
    {
      label: 'Reina viviendas (Viroda)',
      companyId: viroda.id,
      buildingHint: 'Reina',
      buildingCompanyId: viroda.id,
      precio: 5700000,
      fecha: '2024-02-21',
      notas: 'Escritura 441 (21/02/2024)\nVendedor: Madrid Reina ES15 SL\nPrecio viviendas: 5.700.000€\nPrecio total escritura: 9.150.000€ + IVA',
    },
    {
      label: 'Reina locales (Rovida)',
      companyId: rovida.id,
      buildingHint: 'Locales Reina',
      buildingCompanyId: rovida.id,
      precio: 3450000,
      fecha: '2024-02-21',
      notas: 'Escritura 441 (21/02/2024)\nVendedor: Madrid Reina ES15 SL\nPrecio locales: 3.450.000€\nPrecio total escritura: 9.150.000€ + IVA',
    },
    {
      label: 'H. Tejada viviendas (Viroda)',
      companyId: viroda.id,
      buildingHint: 'Hernandez de Tejada',
      buildingCompanyId: viroda.id,
      precio: 3745564.01,
      fecha: '2025-10-09',
      notas: 'Escritura 2747 (09/10/2025)\nVendedor: Edificaciones Globales Penfola SL\nPrecio viviendas: 3.745.564,01€\nPrecio total escritura: 4.775.000€',
    },
    {
      label: 'H. Tejada garajes (Rovida)',
      companyId: rovida.id,
      buildingHint: 'Garajes Hernández',
      buildingCompanyId: rovida.id,
      precio: 1029435.99,
      fecha: '2025-10-09',
      notas: 'Escritura 2747 (09/10/2025)\nVendedor: Edificaciones Globales Penfola SL\nPrecio garajes: 1.029.435,99€\nPrecio total escritura: 4.775.000€',
    },
    {
      label: 'Espronceda garajes (Rovida)',
      companyId: rovida.id,
      buildingHint: 'Espronceda',
      buildingCompanyId: rovida.id,
      precio: 2964500,
      fecha: '2021-11-19',
      notas: 'Escritura 3561 (19/11/2021)\nVendedor: Arcano Value Added Operativa I SLU\nPrecio: 2.964.500€ + IVA 622.545€ = 3.587.045€',
      impuestoCompra: 622545,
      inversionTotal: 3587045,
    },
  ];

  for (const u of updates) {
    const building = await p.building.findFirst({
      where: { nombre: { contains: u.buildingHint, mode: 'insensitive' }, companyId: u.buildingCompanyId },
    });

    if (!building) {
      console.log('NOT FOUND: ' + u.label + ' (hint: ' + u.buildingHint + ')');
      continue;
    }

    const existing = await p.assetAcquisition.findFirst({
      where: { companyId: u.companyId, buildingId: building.id },
    });

    const data = {
      precioCompra: u.precio,
      inversionTotal: u.inversionTotal || u.precio,
      valorContableNeto: u.precio,
      fechaAdquisicion: new Date(u.fecha),
      notas: u.notas,
      ...(u.impuestoCompra ? { impuestoCompra: u.impuestoCompra } : {}),
    };

    if (existing) {
      await p.assetAcquisition.update({ where: { id: existing.id }, data });
      console.log('UPDATED: ' + u.label + ' -> ' + u.precio.toLocaleString('es-ES') + ' EUR');
    } else {
      await p.assetAcquisition.create({
        data: { companyId: u.companyId, buildingId: building.id, assetType: 'otro', ...data },
      });
      console.log('CREATED: ' + u.label + ' -> ' + u.precio.toLocaleString('es-ES') + ' EUR');
    }
  }

  // Print summary
  const all = await p.assetAcquisition.findMany({
    include: { company: { select: { nombre: true } }, building: { select: { nombre: true } } },
    orderBy: { precioCompra: 'desc' },
  });
  console.log('\n=== PORTFOLIO COMPLETO ===');
  let total = 0;
  for (const a of all) {
    const name = (a.building?.nombre || 'Sin edificio').padEnd(30);
    const company = a.company.nombre.padEnd(25);
    console.log(name + ' | ' + company + ' | ' + a.precioCompra.toLocaleString('es-ES') + ' EUR');
    total += a.precioCompra;
  }
  console.log('\nTOTAL: ' + total.toLocaleString('es-ES') + ' EUR');

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
