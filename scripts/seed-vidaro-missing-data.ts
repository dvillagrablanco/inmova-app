/**
 * Seed datos faltantes para Grupo Vidaro:
 * - Proveedores (electricista, fontanero, etc.)
 * - Incidencias de ejemplo
 * - Hipotecas de los edificios
 *
 * Run: npx tsx scripts/seed-vidaro-missing-data.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const VIDARO_COMPANY_ID = 'c65159283deeaf6815f8eda95';

async function seedProviders() {
  console.log('\n--- PROVEEDORES ---');

  const existing = await prisma.provider.count({ where: { companyId: VIDARO_COMPANY_ID } });
  if (existing > 0) {
    console.log(`  Ya existen ${existing} proveedores. Saltando.`);
    return;
  }

  const providers = [
    {
      nombre: 'Fontanería Martínez',
      tipo: 'fontaneria',
      telefono: '612345678',
      email: 'martinez@fontaneria.es',
      direccion: 'C/ Fontaneros 12, Madrid',
    },
    {
      nombre: 'Electricidad Ramos S.L.',
      tipo: 'electricidad',
      telefono: '623456789',
      email: 'info@ramos-electricidad.es',
      direccion: 'Av. de la Industria 45, Madrid',
    },
    {
      nombre: 'Cerrajería 24h Madrid',
      tipo: 'cerrajeria',
      telefono: '634567890',
      email: 'urgencias@cerrajeria24h.es',
      direccion: 'C/ Cerrajeros 3, Madrid',
    },
    {
      nombre: 'Pinturas López',
      tipo: 'pintura',
      telefono: '645678901',
      email: 'presupuestos@pinturaslopez.es',
      direccion: 'C/ Pintores 78, Madrid',
    },
    {
      nombre: 'Limpieza Integral Madrid',
      tipo: 'limpieza',
      telefono: '656789012',
      email: 'info@limpiezaintegral.es',
      direccion: 'C/ Limpiadores 5, Madrid',
    },
    {
      nombre: 'Ascensores TK',
      tipo: 'ascensores',
      telefono: '667890123',
      email: 'mantenimiento@tkascensores.es',
      direccion: 'Pol. Industrial Sur, Madrid',
    },
    {
      nombre: 'Climatización Frio-Calor',
      tipo: 'climatizacion',
      telefono: '678901234',
      email: 'servicio@friocalor.es',
      direccion: 'C/ Industria 22, Madrid',
    },
    {
      nombre: 'Reformas Integrales García',
      tipo: 'reformas',
      telefono: '689012345',
      email: 'obras@reformasgarcia.es',
      direccion: 'C/ Albañiles 9, Madrid',
    },
  ];

  for (const p of providers) {
    await prisma.provider.create({
      data: {
        companyId: VIDARO_COMPANY_ID,
        nombre: p.nombre,
        tipo: p.tipo,
        telefono: p.telefono,
        email: p.email,
        direccion: p.direccion,
        activo: true,
      },
    });
  }
  console.log(`  Creados ${providers.length} proveedores.`);
}

async function seedIncidencias() {
  console.log('\n--- INCIDENCIAS ---');

  const existing = await prisma.maintenanceRequest.count({
    where: { unit: { building: { companyId: VIDARO_COMPANY_ID } } },
  });
  if (existing > 0) {
    console.log(`  Ya existen ${existing} incidencias. Saltando.`);
    return;
  }

  const units = await prisma.unit.findMany({
    where: { building: { companyId: VIDARO_COMPANY_ID } },
    take: 5,
    select: { id: true, nombre: true },
  });

  if (units.length === 0) {
    console.log('  No hay unidades. Saltando incidencias.');
    return;
  }

  const incidencias = [
    {
      titulo: 'Fuga de agua en cocina',
      descripcion: 'El grifo de la cocina gotea constantemente. Se necesita fontanero.',
      prioridad: 'alta' as const,
    },
    {
      titulo: 'Caldera no enciende',
      descripcion: 'La caldera de gas no arranca. Sin agua caliente desde ayer.',
      prioridad: 'alta' as const,
    },
    {
      titulo: 'Bombilla fundida en portal',
      descripcion: 'La bombilla del portal del 2º piso está fundida. Zona oscura.',
      prioridad: 'baja' as const,
    },
    {
      titulo: 'Persiana atascada dormitorio',
      descripcion: 'La persiana del dormitorio principal no sube. Posible cinta rota.',
      prioridad: 'media' as const,
    },
    {
      titulo: 'Humedad en pared salón',
      descripcion: 'Mancha de humedad creciente en la pared del salón. Posible filtración.',
      prioridad: 'alta' as const,
    },
  ];

  for (let i = 0; i < incidencias.length; i++) {
    const unit = units[i % units.length];
    await prisma.maintenanceRequest.create({
      data: {
        unitId: unit.id,
        titulo: incidencias[i].titulo,
        descripcion: incidencias[i].descripcion,
        prioridad: incidencias[i].prioridad,
        estado: i < 2 ? 'pendiente' : i < 4 ? 'en_progreso' : 'completado',
      },
    });
  }
  console.log(`  Creadas ${incidencias.length} incidencias.`);
}

async function seedHipotecas() {
  console.log('\n--- HIPOTECAS ---');

  const existing = await prisma.mortgage.count({ where: { companyId: VIDARO_COMPANY_ID } });
  if (existing > 0) {
    console.log(`  Ya existen ${existing} hipotecas. Saltando.`);
    return;
  }

  const assets = await prisma.asset.findMany({
    where: { companyId: VIDARO_COMPANY_ID },
    take: 3,
    select: { id: true, nombre: true },
  });

  if (assets.length === 0) {
    console.log('  No hay assets. Saltando hipotecas.');
    return;
  }

  const hipotecas = [
    {
      entidadFinanciera: 'Bankinter',
      capitalInicial: 1200000,
      capitalPendiente: 850000,
      tipoInteres: 4.1,
      diferencial: 0.85,
      indiceReferencia: 'euribor_12m',
      tipoHipoteca: 'variable' as const,
      plazoAnos: 25,
      cuotaMensual: 5200,
      fechaConstitucion: new Date('2019-06-15'),
      fechaVencimiento: new Date('2044-06-15'),
    },
    {
      entidadFinanciera: 'CaixaBank',
      capitalInicial: 800000,
      capitalPendiente: 620000,
      tipoInteres: 2.5,
      tipoHipoteca: 'fijo' as const,
      plazoAnos: 20,
      cuotaMensual: 4250,
      fechaConstitucion: new Date('2021-03-01'),
      fechaVencimiento: new Date('2041-03-01'),
    },
    {
      entidadFinanciera: 'BBVA',
      capitalInicial: 500000,
      capitalPendiente: 410000,
      tipoInteres: 4.2,
      diferencial: 0.95,
      indiceReferencia: 'euribor_12m',
      tipoHipoteca: 'variable' as const,
      plazoAnos: 15,
      cuotaMensual: 3800,
      fechaConstitucion: new Date('2022-09-01'),
      fechaVencimiento: new Date('2037-09-01'),
    },
  ];

  for (let i = 0; i < Math.min(hipotecas.length, assets.length); i++) {
    const h = hipotecas[i];
    await prisma.mortgage.create({
      data: {
        assetId: assets[i].id,
        companyId: VIDARO_COMPANY_ID,
        entidadFinanciera: h.entidadFinanciera,
        capitalInicial: h.capitalInicial,
        capitalPendiente: h.capitalPendiente,
        tipoInteres: h.tipoInteres,
        diferencial: h.diferencial,
        indiceReferencia: h.indiceReferencia,
        tipoHipoteca: h.tipoHipoteca,
        plazoAnos: h.plazoAnos,
        cuotaMensual: h.cuotaMensual,
        fechaConstitucion: h.fechaConstitucion,
        fechaVencimiento: h.fechaVencimiento,
        estado: 'activa',
      },
    });
  }
  console.log(`  Creadas ${Math.min(hipotecas.length, assets.length)} hipotecas.`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('  SEED DATOS FALTANTES - GRUPO VIDARO');
  console.log('='.repeat(60));

  const company = await prisma.company.findUnique({ where: { id: VIDARO_COMPANY_ID } });
  if (!company) {
    console.log(`ERROR: Empresa ${VIDARO_COMPANY_ID} no encontrada.`);
    return;
  }
  console.log(`Empresa: ${company.nombre}`);

  await seedProviders();
  await seedIncidencias();
  await seedHipotecas();

  console.log('\n' + '='.repeat(60));
  console.log('  SEED COMPLETADO');
  console.log('='.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
