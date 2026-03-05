/**
 * Actualizar TODOS los inmuebles de Viroda desde spreadsheet multi-pestaña
 * 
 * 5 edificios:
 * 1. Manuel Silvela 5, Madrid (15 unidades)
 * 2. Hernández de Tejada 6, Madrid (12 unidades)
 * 3. Candelaria Mora, Valladolid (16 unidades + antena)
 * 4. C/Reina 15, Madrid (15 unidades)
 * 5. M. Pelayo 15, Palencia (3 unidades)
 * 
 * Uso: npx tsx scripts/update-viroda-all-buildings.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });
dotenv.config();

const prisma = new PrismaClient();

interface UnitData {
  edificioHint: string;
  numero: string;
  habitaciones: number;
  tipoContrato: string;
  inquilino: string;
  fechaInicio: string;
  fechaFin: string;
  renta: number;
  notas?: string;
}

// ALL UNITS from the 5 sheets
const ALL_UNITS: UnitData[] = [
  // === MANUEL SILVELA 5 ===
  { edificioHint: 'Silvela', numero: 'Local', habitaciones: 0, tipoContrato: 'comercial', inquilino: 'PILATES LAB SL', fechaInicio: '2024-03-24', fechaFin: '2029-03-23', renta: 6578.82 },
  { edificioHint: 'Silvela', numero: 'Bajo', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Andrew', fechaInicio: '2026-01-30', fechaFin: '2026-05-29', renta: 1350 },
  { edificioHint: 'Silvela', numero: '1ºA', habitaciones: 3, tipoContrato: 'residencial', inquilino: 'Josephine Marie', fechaInicio: '2025-08-14', fechaFin: '2026-07-14', renta: 3750 },
  { edificioHint: 'Silvela', numero: '1ºB', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Sandra Mazoy Sanchez', fechaInicio: '2019-09-16', fechaFin: '2026-09-15', renta: 1354.75 },
  { edificioHint: 'Silvela', numero: '2ºA', habitaciones: 2, tipoContrato: 'residencial', inquilino: 'Maria Luisa Maestro de las Casas', fechaInicio: '2022-06-01', fechaFin: '2029-05-31', renta: 2147.43 },
  { edificioHint: 'Silvela', numero: '2ºB', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Fernando Lunar Placer', fechaInicio: '2019-11-29', fechaFin: '2026-11-28', renta: 1746.33 },
  { edificioHint: 'Silvela', numero: '3ºA', habitaciones: 2, tipoContrato: 'residencial', inquilino: 'Emma Arango Lago', fechaInicio: '2025-05-01', fechaFin: '2026-05-01', renta: 2900 },
  { edificioHint: 'Silvela', numero: '3ºB', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Federico Pensado', fechaInicio: '2025-05-01', fechaFin: '2026-03-31', renta: 2350 },
  { edificioHint: 'Silvela', numero: '4ºA', habitaciones: 2, tipoContrato: 'residencial', inquilino: 'Ana Camila Chavez Castañeda', fechaInicio: '2024-06-27', fechaFin: '2026-06-26', renta: 3365.67 },
  { edificioHint: 'Silvela', numero: '4ºB', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Jean-Claude Khoury', fechaInicio: '2025-05-01', fechaFin: '2026-04-30', renta: 2200 },
  { edificioHint: 'Silvela', numero: '5ºA', habitaciones: 2, tipoContrato: 'residencial', inquilino: 'David Setton Katz', fechaInicio: '2025-07-01', fechaFin: '2032-06-30', renta: 3100 },
  { edificioHint: 'Silvela', numero: '5ºB', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Isaac Garza', fechaInicio: '2025-09-01', fechaFin: '2026-12-31', renta: 2350 },
  { edificioHint: 'Silvela', numero: '6ºA', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Jorge Andújar Hernandez', fechaInicio: '2020-07-15', fechaFin: '2027-07-14', renta: 1803.52 },
  { edificioHint: 'Silvela', numero: '6ºB', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Sofia Lazaro Mozo', fechaInicio: '2022-05-15', fechaFin: '2029-05-14', renta: 1449.51 },
  { edificioHint: 'Silvela', numero: '6ºC', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Julian Abou-Jaoude', fechaInicio: '2025-12-15', fechaFin: '2026-12-15', renta: 2700 },

  // === HERNANDEZ DE TEJADA 6 ===
  { edificioHint: 'Tejada', numero: '1ºA', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Tiago Miguel Marque Andrade', fechaInicio: '2020-07-08', fechaFin: '2028-07-07', renta: 985.13 },
  { edificioHint: 'Tejada', numero: '1ºB', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Marta Perales De Vivar', fechaInicio: '2016-09-30', fechaFin: '2026-09-30', renta: 946.67 },
  { edificioHint: 'Tejada', numero: '1ºC', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Pablo Coromoto Figueroa Herrrera', fechaInicio: '2024-06-07', fechaFin: '2032-06-07', renta: 1121.89 },
  { edificioHint: 'Tejada', numero: '2ºA', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'LYDIA SANCHEZ MARTIN', fechaInicio: '2024-10-31', fechaFin: '2032-10-31', renta: 1133 },
  { edificioHint: 'Tejada', numero: '2ºB', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'ROCIO CRUZ CHAVES', fechaInicio: '2016-11-07', fechaFin: '2026-11-07', renta: 1023.29 },
  { edificioHint: 'Tejada', numero: '2ºC', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'MARIA MIA', fechaInicio: '2026-01-15', fechaFin: '2026-03-31', renta: 1800 },
  { edificioHint: 'Tejada', numero: '3ºA', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'CRISTOBAL VEGA JAVIER', fechaInicio: '2023-09-04', fechaFin: '2031-09-04', renta: 1053.33 },
  { edificioHint: 'Tejada', numero: '3ºB', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Mª DE LAS NIEVES CASAIS DE LA ROSA', fechaInicio: '2025-01-16', fechaFin: '2033-01-16', renta: 1125.52 },
  { edificioHint: 'Tejada', numero: '3ºC', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'IN POST SRL', fechaInicio: '2026-02-01', fechaFin: '2026-07-31', renta: 1650 },
  { edificioHint: 'Tejada', numero: '4ºA', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'ALEJANDRA KOROVAICHUK', fechaInicio: '2026-01-09', fechaFin: '2026-03-09', renta: 1950 },
  { edificioHint: 'Tejada', numero: '4ºB', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'FRANCISCA', fechaInicio: '2026-01-15', fechaFin: '2026-12-14', renta: 1325 },
  { edificioHint: 'Tejada', numero: '4ºC', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'ARANZAZU GOMEZ GUTIERREZ', fechaInicio: '2022-05-04', fechaFin: '2030-05-04', renta: 1076.89 },

  // === CANDELARIA MORA ===
  { edificioHint: 'Candelaria', numero: '1A', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Iria Meléndez Pérez', fechaInicio: '2022-10-10', fechaFin: '2029-10-10', renta: 857.29 },
  { edificioHint: 'Candelaria', numero: '1B', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Sendula Gergely', fechaInicio: '2026-02-03', fechaFin: '2026-07-06', renta: 1350 },
  { edificioHint: 'Candelaria', numero: '1C', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Carlos Espín Hidalgo', fechaInicio: '2020-12-04', fechaFin: '2027-12-04', renta: 927 },
  { edificioHint: 'Candelaria', numero: '1D', habitaciones: 2, tipoContrato: 'residencial', inquilino: 'Claudio Enrique Ortiz Ortiz', fechaInicio: '2025-02-28', fechaFin: '2026-02-28', renta: 1600 },
  { edificioHint: 'Candelaria', numero: '1E', habitaciones: 2, tipoContrato: 'temporal', inquilino: 'Elisa Vallejo', fechaInicio: '2026-02-02', fechaFin: '2026-03-31', renta: 1900 },
  { edificioHint: 'Candelaria', numero: '2A', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'ESTEFANIA PABLOS', fechaInicio: '2026-01-01', fechaFin: '2026-03-31', renta: 1300 },
  { edificioHint: 'Candelaria', numero: '2B', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Daniel Cuesta Villegas', fechaInicio: '2020-12-04', fechaFin: '2027-12-04', renta: 900 },
  { edificioHint: 'Candelaria', numero: '2C', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'María José Nava Sacristán', fechaInicio: '2022-06-20', fechaFin: '2029-06-20', renta: 840.48 },
  { edificioHint: 'Candelaria', numero: '3A', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Yousaf', fechaInicio: '2026-03-01', fechaFin: '2026-08-31', renta: 1282.50 },
  { edificioHint: 'Candelaria', numero: '3B', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'JOSE ALFONSO GEMA', fechaInicio: '2026-01-07', fechaFin: '2026-04-07', renta: 1280 },
  { edificioHint: 'Candelaria', numero: '3C', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Jiaxiang Zhang', fechaInicio: '2021-03-18', fechaFin: '2028-03-18', renta: 900 },
  { edificioHint: 'Candelaria', numero: '4A', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Sofía Olegovna Goldakova', fechaInicio: '2024-07-04', fechaFin: '2026-06-03', renta: 1280 },
  { edificioHint: 'Candelaria', numero: '4B', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Dylan Becker', fechaInicio: '2026-07-04', fechaFin: '2026-06-01', renta: 1280 },
  { edificioHint: 'Candelaria', numero: '4C', habitaciones: 1, tipoContrato: 'residencial', inquilino: 'Salvador David Minguez Baena', fechaInicio: '2021-04-15', fechaFin: '2028-04-15', renta: 850 },

  // === C/REINA 15 ===
  { edificioHint: 'Reina', numero: '1ºA', habitaciones: 2, tipoContrato: 'temporal', inquilino: 'Pablo', fechaInicio: '2026-01-15', fechaFin: '2026-06-30', renta: 2600 },
  { edificioHint: 'Reina', numero: '1ºB', habitaciones: 2, tipoContrato: 'temporal', inquilino: 'Riccardo Roberto', fechaInicio: '2026-01-07', fechaFin: '2026-04-30', renta: 2750 },
  { edificioHint: 'Reina', numero: '1ºC', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Tallulah', fechaInicio: '2026-02-03', fechaFin: '2026-05-31', renta: 1950 },
  { edificioHint: 'Reina', numero: '1ºD', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Yi Ding', fechaInicio: '2025-09-22', fechaFin: '2026-08-24', renta: 1850 },
  { edificioHint: 'Reina', numero: '2ºA', habitaciones: 2, tipoContrato: 'temporal', inquilino: 'Vincent Leo', fechaInicio: '2025-08-15', fechaFin: '2026-05-31', renta: 2500 },
  { edificioHint: 'Reina', numero: '2ºB', habitaciones: 2, tipoContrato: 'temporal', inquilino: 'Gabriel', fechaInicio: '2025-08-25', fechaFin: '2026-05-31', renta: 2500 },
  { edificioHint: 'Reina', numero: '2ºC', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Charles', fechaInicio: '2025-08-15', fechaFin: '2026-07-31', renta: 1800 },
  { edificioHint: 'Reina', numero: '2ºD', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Raya Atanasova', fechaInicio: '2025-08-01', fechaFin: '2026-05-31', renta: 1750 },
  { edificioHint: 'Reina', numero: '3ºA', habitaciones: 2, tipoContrato: 'temporal', inquilino: 'Emma', fechaInicio: '2026-01-10', fechaFin: '2026-06-15', renta: 2700 },
  { edificioHint: 'Reina', numero: '3ºB', habitaciones: 2, tipoContrato: 'temporal', inquilino: 'Maria Antonia', fechaInicio: '2025-09-01', fechaFin: '2026-07-31', renta: 2600 },
  { edificioHint: 'Reina', numero: '3ºC', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Giovanni Inamorato', fechaInicio: '2025-07-01', fechaFin: '2026-05-31', renta: 1900 },
  { edificioHint: 'Reina', numero: '3ºD', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Clermont', fechaInicio: '2026-01-01', fechaFin: '2026-05-15', renta: 1900 },
  { edificioHint: 'Reina', numero: '4ºA', habitaciones: 3, tipoContrato: 'temporal', inquilino: 'Francisco José Batista', fechaInicio: '2025-06-01', fechaFin: '2026-04-30', renta: 4000 },
  { edificioHint: 'Reina', numero: '4ºB', habitaciones: 2, tipoContrato: 'temporal', inquilino: 'Valentina', fechaInicio: '2025-08-15', fechaFin: '2026-06-30', renta: 2500 },
  { edificioHint: 'Reina', numero: '4ºC', habitaciones: 1, tipoContrato: 'temporal', inquilino: 'Dan Sholomo', fechaInicio: '2026-02-28', fechaFin: '2026-05-30', renta: 2000 },

  // === M. PELAYO 15 ===
  { edificioHint: 'Pelayo', numero: '1ºDcha', habitaciones: 0, tipoContrato: 'uso_familiar', inquilino: 'Uso Familiar', fechaInicio: '2020-01-01', fechaFin: '2030-12-31', renta: 0 },
  { edificioHint: 'Pelayo', numero: '4ºDcha', habitaciones: 4, tipoContrato: 'residencial', inquilino: 'Beatriz Ballesteros', fechaInicio: '2024-04-15', fechaFin: '2032-04-15', renta: 713.86 },
  { edificioHint: 'Pelayo', numero: '5ºÁtico', habitaciones: 2, tipoContrato: 'residencial', inquilino: 'Roams Tic SL', fechaInicio: '2025-02-17', fechaFin: '2033-02-17', renta: 675 },
];

async function main() {
  console.log('====================================================================');
  console.log('  ACTUALIZAR: Todos los inmuebles Viroda (5 edificios)');
  console.log('====================================================================\n');

  const viroda = await prisma.company.findFirst({
    where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
    select: { id: true, nombre: true },
  });
  if (!viroda) { console.error('❌ Viroda no encontrada'); process.exit(1); }
  console.log(`✅ ${viroda.nombre}\n`);

  const buildings = await prisma.building.findMany({
    where: { companyId: viroda.id },
    select: { id: true, nombre: true, direccion: true },
  });
  console.log(`Edificios: ${buildings.length}`);
  buildings.forEach(b => console.log(`  - ${b.nombre} (${b.direccion})`));

  let totalUpdated = 0, totalCreated = 0;
  const buildingSummary: Record<string, { units: number; renta: number }> = {};

  for (const unitData of ALL_UNITS) {
    const building = buildings.find(b =>
      b.nombre.toLowerCase().includes(unitData.edificioHint.toLowerCase()) ||
      b.direccion.toLowerCase().includes(unitData.edificioHint.toLowerCase())
    );

    if (!building) {
      console.log(`  ⚠️ Edificio no encontrado: ${unitData.edificioHint}`);
      continue;
    }

    if (!buildingSummary[building.nombre]) buildingSummary[building.nombre] = { units: 0, renta: 0 };
    buildingSummary[building.nombre].units++;
    buildingSummary[building.nombre].renta += unitData.renta;

    // Find or create unit
    const normalizedNum = unitData.numero.replace(/\s/g, '');
    let unit = await prisma.unit.findFirst({
      where: {
        buildingId: building.id,
        numero: { contains: normalizedNum.substring(0, Math.min(3, normalizedNum.length)), mode: 'insensitive' },
      },
    });

    const tipo = unitData.numero.toLowerCase().includes('local') ? 'local' : 'vivienda';

    if (unit) {
      await prisma.unit.update({
        where: { id: unit.id },
        data: {
          estado: unitData.renta > 0 ? 'ocupada' : 'disponible',
          rentaMensual: unitData.renta,
          habitaciones: unitData.habitaciones || undefined,
        },
      });
      totalUpdated++;
    } else {
      unit = await prisma.unit.create({
        data: {
          buildingId: building.id,
          numero: unitData.numero,
          tipo,
          estado: unitData.renta > 0 ? 'ocupada' : 'disponible',
          superficie: tipo === 'local' ? 100 : 60,
          habitaciones: unitData.habitaciones,
          banos: unitData.habitaciones >= 2 ? 2 : 1,
          rentaMensual: unitData.renta,
        },
      });
      totalCreated++;
    }
  }

  const totalRenta = ALL_UNITS.reduce((s, u) => s + u.renta, 0);
  console.log('\n====================================================================');
  console.log('  RESUMEN');
  console.log('====================================================================');
  for (const [name, data] of Object.entries(buildingSummary)) {
    console.log(`  ${name}: ${data.units} uds, €${data.renta.toLocaleString('es-ES', { minimumFractionDigits: 2 })}/mes`);
  }
  console.log(`\n  Total unidades: ${ALL_UNITS.length}`);
  console.log(`  Actualizadas: ${totalUpdated} | Creadas: ${totalCreated}`);
  console.log(`  Renta total: €${totalRenta.toLocaleString('es-ES', { minimumFractionDigits: 2 })}/mes`);
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(e => { console.error('Error:', e); prisma.$disconnect(); process.exit(1); });
