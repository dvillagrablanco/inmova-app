/**
 * Actualizar estado inmuebles Viroda - M. Silvela 5
 * 
 * Fuente: Spreadsheet Google Drive con datos actualizados de:
 * - Inquilinos (nombre, tipo contrato)
 * - Rentas mensuales
 * - Fechas de contratos
 * - Tipo de contrato (larga estancia, temporada, vivienda)
 * 
 * Uso: npx tsx scripts/update-viroda-silvela5.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });
dotenv.config();

const prisma = new PrismaClient();

interface UnitData {
  numero: string;
  habitaciones: number;
  tipoContrato: string;
  inquilino: string;
  fechaInicio: string;
  fechaFin: string;
  renta: number;
  notas?: string;
}

const UNITS: UnitData[] = [
  { numero: 'Local', habitaciones: 0, tipoContrato: 'comercial', inquilino: 'PILATES LAB SL (Sofia)', fechaInicio: '2024-03-24', fechaFin: '2029-03-23', renta: 6578.82 },
  { numero: 'Bajo', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Andrew', fechaInicio: '2026-01-30', fechaFin: '2026-05-29', renta: 1350.00 },
  { numero: '1ºA', habitaciones: 3, tipoContrato: 'residencial', inquilino: 'Josephine Marie', fechaInicio: '2025-08-14', fechaFin: '2026-07-14', renta: 3750.00 },
  { numero: '1ºB', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Sandra Mazoy Sanchez', fechaInicio: '2019-09-16', fechaFin: '2026-09-15', renta: 1354.75, notas: 'Se renueva anualmente (avisar con 4 meses de antelación)' },
  { numero: '2ºA', habitaciones: 2, tipoContrato: 'residencial', inquilino: 'Maria Luisa Maestro de las Casas', fechaInicio: '2022-06-01', fechaFin: '2029-05-31', renta: 2147.43 },
  { numero: '2ºB', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Fernando Lunar Placer', fechaInicio: '2019-11-29', fechaFin: '2026-11-28', renta: 1746.33 },
  { numero: '3ºA', habitaciones: 2, tipoContrato: 'residencial', inquilino: 'Emma Arango Lago; Felipe Ocampo Lizarralde', fechaInicio: '2025-05-01', fechaFin: '2026-05-01', renta: 2900.00 },
  { numero: '3ºB', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Federico Pensado', fechaInicio: '2025-05-01', fechaFin: '2026-03-31', renta: 2350.00 },
  { numero: '4ºA', habitaciones: 2, tipoContrato: 'residencial', inquilino: 'Ana Camila Chavez Castañeda', fechaInicio: '2024-06-27', fechaFin: '2026-06-26', renta: 3365.67 },
  { numero: '4ºB', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Jean-Claude Khoury', fechaInicio: '2025-05-01', fechaFin: '2026-04-30', renta: 2200.00 },
  { numero: '5ºA', habitaciones: 2, tipoContrato: 'residencial', inquilino: 'David Setton Katz', fechaInicio: '2025-07-01', fechaFin: '2032-06-30', renta: 3100.00 },
  { numero: '5ºB', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Isaac Garza', fechaInicio: '2025-09-01', fechaFin: '2026-12-31', renta: 2350.00 },
  { numero: '6ºA', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Jorge Andújar Hernandez', fechaInicio: '2020-07-15', fechaFin: '2027-07-14', renta: 1803.52 },
  { numero: '6ºB', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Sofia Lazaro Mozo', fechaInicio: '2022-05-15', fechaFin: '2029-05-14', renta: 1449.51 },
  { numero: '6ºC', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Julian Abou-Jaoude', fechaInicio: '2025-12-15', fechaFin: '2026-12-15', renta: 2700.00 },
];

async function main() {
  console.log('====================================================================');
  console.log('  ACTUALIZAR: Inmuebles Viroda - M. Silvela 5, Madrid');
  console.log('====================================================================\n');

  // Find Viroda company
  const viroda = await prisma.company.findFirst({
    where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
    select: { id: true, nombre: true },
  });

  if (!viroda) {
    console.error('❌ Viroda no encontrada');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`✅ Empresa: ${viroda.nombre} (${viroda.id})\n`);

  // Find M. Silvela 5 building
  const building = await prisma.building.findFirst({
    where: {
      companyId: viroda.id,
      OR: [
        { nombre: { contains: 'Silvela', mode: 'insensitive' } },
        { direccion: { contains: 'Silvela', mode: 'insensitive' } },
      ],
    },
    select: { id: true, nombre: true, direccion: true },
  });

  if (!building) {
    console.error('❌ Edificio M. Silvela 5 no encontrado');
    console.log('   Buscando edificios de Viroda...');
    const buildings = await prisma.building.findMany({
      where: { companyId: viroda.id },
      select: { id: true, nombre: true, direccion: true },
      take: 10,
    });
    buildings.forEach((b) => console.log(`   - ${b.nombre}: ${b.direccion}`));
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`✅ Edificio: ${building.nombre} (${building.direccion})\n`);

  // Get existing units
  const existingUnits = await prisma.unit.findMany({
    where: { buildingId: building.id },
    select: { id: true, numero: true, estado: true, rentaMensual: true, habitaciones: true },
  });
  console.log(`📋 Unidades existentes: ${existingUnits.length}`);

  let updated = 0;
  let created = 0;
  let skipped = 0;

  for (const unitData of UNITS) {
    // Try to match by unit number (flexible matching)
    const normalizedNum = unitData.numero.replace(/\s/g, '').toLowerCase();
    let existing = existingUnits.find((u) => {
      const existingNum = u.numero.replace(/\s/g, '').toLowerCase();
      return existingNum === normalizedNum ||
             existingNum.includes(normalizedNum) ||
             normalizedNum.includes(existingNum);
    });

    const tipo = unitData.numero.toLowerCase().includes('local') ? 'local' : 'vivienda';

    if (existing) {
      // Update existing unit
      await prisma.unit.update({
        where: { id: existing.id },
        data: {
          estado: 'ocupada',
          rentaMensual: unitData.renta,
          habitaciones: unitData.habitaciones || undefined,
          tipo,
        },
      });
      console.log(`  ✏️ Actualizado: ${unitData.numero} → €${unitData.renta.toLocaleString('es-ES')} | ${unitData.inquilino}`);
      updated++;
    } else {
      // Create new unit
      await prisma.unit.create({
        data: {
          buildingId: building.id,
          numero: unitData.numero,
          tipo,
          estado: 'ocupada',
          superficie: tipo === 'local' ? 100 : 60, // Estimación
          habitaciones: unitData.habitaciones,
          banos: unitData.habitaciones >= 2 ? 2 : 1,
          rentaMensual: unitData.renta,
        },
      });
      console.log(`  ✅ Creado: ${unitData.numero} → €${unitData.renta.toLocaleString('es-ES')} | ${unitData.inquilino}`);
      created++;
    }

    // Update or create tenant + contract
    try {
      // Find or create tenant
      let tenant = await prisma.tenant.findFirst({
        where: {
          companyId: viroda.id,
          nombreCompleto: { contains: unitData.inquilino.split(';')[0].split('//')[0].trim(), mode: 'insensitive' },
        },
      });

      if (!tenant) {
        const nombreLimpio = unitData.inquilino.split(';')[0].split('//')[0].trim();
        tenant = await prisma.tenant.create({
          data: {
            companyId: viroda.id,
            nombreCompleto: nombreLimpio,
            dni: `PEND-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            email: `${nombreLimpio.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@viroda.inmova.app`,
            telefono: '000000000',
            fechaNacimiento: new Date('1990-01-01'),
          },
        });
        console.log(`    👤 Inquilino creado: ${nombreLimpio}`);
      }

      // Find the unit (may have just been created)
      const unit = existing || await prisma.unit.findFirst({
        where: { buildingId: building.id, numero: unitData.numero },
      });

      if (unit && tenant) {
        // Check for active contract
        const activeContract = await prisma.contract.findFirst({
          where: {
            unitId: unit.id,
            tenantId: tenant.id,
            estado: 'activo',
          },
        });

        if (!activeContract) {
          const fechaInicio = new Date(unitData.fechaInicio);
          let fechaFin: Date;
          try {
            fechaFin = new Date(unitData.fechaFin);
            if (isNaN(fechaFin.getTime())) {
              fechaFin = new Date(fechaInicio.getTime() + 365 * 24 * 60 * 60 * 1000);
            }
          } catch {
            fechaFin = new Date(fechaInicio.getTime() + 365 * 24 * 60 * 60 * 1000);
          }

          await prisma.contract.create({
            data: {
              unitId: unit.id,
              tenantId: tenant.id,
              tipo: unitData.tipoContrato === 'temporal' ? 'temporal' : 'residencial',
              fechaInicio,
              fechaFin,
              rentaMensual: unitData.renta,
              deposito: unitData.renta,
              estado: 'activo',
              incrementoType: unitData.tipoContrato === 'residencial' ? 'ipc' : 'fijo',
            },
          });
          console.log(`    📋 Contrato creado: ${unitData.fechaInicio} → ${unitData.fechaFin}`);
        }
      }
    } catch (err: any) {
      console.log(`    ⚠️ Error con inquilino/contrato: ${err.message?.substring(0, 80)}`);
    }
  }

  // Summary
  const totalRenta = UNITS.reduce((s, u) => s + u.renta, 0);
  console.log('\n====================================================================');
  console.log('  RESUMEN');
  console.log('====================================================================');
  console.log(`  Edificio: ${building.nombre}`);
  console.log(`  Unidades actualizadas: ${updated}`);
  console.log(`  Unidades creadas: ${created}`);
  console.log(`  Total unidades: ${UNITS.length}`);
  console.log(`  Renta mensual total: €${totalRenta.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`);
  console.log(`  Todas ocupadas: Sí (100% ocupación)`);
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
