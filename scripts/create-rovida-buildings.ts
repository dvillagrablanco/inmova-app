/**
 * Script: Dar de alta edificios y unidades de Rovida S.L.
 * 
 * Datos extraídos del Diario General de Contabilidad (subcuentas 211x)
 * y de la estructura de carpetas de Contratos en Google Drive.
 * 
 * Edificios identificados (del Diario General + Índice de Subcuentas):
 * 1. Garajes C/ Espronceda, 32 - Madrid (115 plazas, sótanos -2 y -3)
 * 2. Garajes C/ Hernández de Tejada, 6 - Madrid (56 plazas, sótanos -1 y -2)
 * 3. Garajes C/ Menéndez Pelayo, 17 - Palencia (21 plazas registradas)
 * 4. Local C/ Barquillo, 30 - Madrid (3 locales)
 * 5. Locales C/ Reina, 15 - Madrid (2 locales: finca 13182 + finca 13184)
 * 6. Local y Sótano C/ Menéndez Pelayo, 15 - Palencia
 * 7. Edificio C/ Piamonte, 23 - Madrid
 * 8. Naves Avda Cuba, 48-50-52 - Palencia (3 naves)
 * 9. Garajes C/ Constitución, 5 - Valladolid (4 plazas)
 * 10. Naves C/ Metal, 4 (Pg. Argales) - Valladolid
 * 11. Inmueble C/ Constitución, 8, 2ºA - Valladolid
 * 12. Aptos Benidorm Gemelos 20/II/IV (19 aptos + 2 garajes)
 * 13. Casa El Tomillar de Nagüelles, 2
 * 14. Oficinas Av Europa, 34 Bl.B 1ºIz - Madrid
 * 15. Terreno rústico Grijota (5 Ha)
 * 16. Garajes Urb. Castillo Magaz
 * 17. Local y Sótano C/ Prado, 10 - Madrid (añadido Feb 2026)
 * 
 * Fuentes: Diarios Generales 2025+2026, Índice de Subcuentas Rovida S.L.
 * 
 * Uso: npx tsx scripts/create-rovida-buildings.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface BuildingDef {
  nombre: string;
  direccion: string;
  tipo: 'residencial' | 'comercial' | 'mixto';
  anoConstructor: number;
  ascensor: boolean;
  garaje: boolean;
  etiquetas: string[];
  units: UnitDef[];
}

interface UnitDef {
  numero: string;
  tipo: 'garaje' | 'local' | 'vivienda' | 'oficina' | 'nave_industrial' | 'trastero';
  superficie: number;
  rentaMensual: number;
  planta?: number;
}

// ============================================================================
// DATOS EXTRAÍDOS DE LA CONTABILIDAD DE ROVIDA
// ============================================================================

const BUILDINGS: BuildingDef[] = [
  // ─── MADRID ───────────────────────────────────────────────
  {
    nombre: 'Garajes Espronceda 32',
    direccion: 'C/ Espronceda, 32, Madrid',
    tipo: 'comercial',
    anoConstructor: 1975,
    ascensor: false,
    garaje: true,
    etiquetas: ['garajes', 'madrid', 'espronceda'],
    units: [
      // 115 plazas en sótanos -2 y -3 según contabilidad
      // Plazas individuales identificadas en facturas: 1-7(bloque), 8, 9, 10, 13, 22, 25, 33, 38, 43, 53, 54, 55, 56, 59, 63, 64, 78
      ...Array.from({ length: 115 }, (_, i) => ({
        numero: `Plaza ${i + 1}`,
        tipo: 'garaje' as const,
        superficie: 12,
        rentaMensual: 120,
        planta: i < 60 ? -3 : -2,
      })),
    ],
  },
  {
    nombre: 'Garajes Hernández de Tejada 6',
    direccion: 'C/ Hernández de Tejada, 6, Madrid',
    tipo: 'comercial',
    anoConstructor: 1980,
    ascensor: false,
    garaje: true,
    etiquetas: ['garajes', 'madrid', 'hernandez-tejada'],
    units: [
      // 56 plazas según contabilidad. Plazas identificadas en fianzas: 04, 11, 13 (sot.-2)
      ...Array.from({ length: 56 }, (_, i) => ({
        numero: `Plaza ${String(i + 1).padStart(2, '0')}`,
        tipo: 'garaje' as const,
        superficie: 12,
        rentaMensual: 120,
        planta: -2,
      })),
    ],
  },
  {
    nombre: 'Locales Barquillo 30',
    direccion: 'C/ Barquillo, 30, Madrid',
    tipo: 'comercial',
    anoConstructor: 1960,
    ascensor: false,
    garaje: false,
    etiquetas: ['locales', 'madrid', 'barquillo'],
    units: [
      // 3 locales según cuotas comunidad: Local 1 (25,47€), Local 2 (110,17€), Local 3 (54,79€)
      { numero: 'Local 1', tipo: 'local', superficie: 50, rentaMensual: 2500, planta: 0 },
      { numero: 'Local 2', tipo: 'local', superficie: 200, rentaMensual: 5000, planta: 0 },
      { numero: 'Local 3', tipo: 'local', superficie: 100, rentaMensual: 3000, planta: 0 },
    ],
  },
  {
    nombre: 'Locales Reina 15',
    direccion: 'C/ Reina, 15, Madrid',
    tipo: 'comercial',
    anoConstructor: 1965,
    ascensor: false,
    garaje: false,
    etiquetas: ['locales', 'madrid', 'reina'],
    units: [
      // 2 locales: grande y pequeño
      { numero: 'Local 1 (Grande)', tipo: 'local', superficie: 150, rentaMensual: 4000, planta: 0 },
      { numero: 'Local 2 (Pequeño)', tipo: 'local', superficie: 60, rentaMensual: 1800, planta: 0 },
    ],
  },
  {
    nombre: 'Edificio Piamonte 23',
    direccion: 'C/ Piamonte, 23, Madrid',
    tipo: 'mixto',
    anoConstructor: 1970,
    ascensor: true,
    garaje: false,
    etiquetas: ['edificio', 'madrid', 'piamonte'],
    units: [
      // Edificio completo - sin detalle de unidades individuales en contabilidad
      { numero: 'Edificio completo', tipo: 'vivienda', superficie: 500, rentaMensual: 0, planta: 0 },
    ],
  },
  {
    nombre: 'Oficinas Av Europa 34',
    direccion: 'Av. Europa, 34, Bl.B, 1ºIz, Madrid',
    tipo: 'comercial',
    anoConstructor: 1990,
    ascensor: true,
    garaje: false,
    etiquetas: ['oficinas', 'madrid', 'europa'],
    units: [
      { numero: 'Bl.B 1ºIz', tipo: 'oficina', superficie: 100, rentaMensual: 1500, planta: 1 },
    ],
  },

  // ─── PALENCIA ─────────────────────────────────────────────
  {
    nombre: 'Garajes Menéndez Pelayo 17',
    direccion: 'C/ Menéndez Pelayo, 17, Palencia',
    tipo: 'comercial',
    anoConstructor: 1985,
    ascensor: false,
    garaje: true,
    etiquetas: ['garajes', 'palencia', 'menendez-pelayo'],
    units: [
      // Plazas sótano -1: 13,16,18,19,20,26,27,28,29,30,31,32,33,34,35,36,38,84(118),85(119)
      { numero: 'Plaza 13', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 16', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 18', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 19', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 20', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 26', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 27', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 28', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 29', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 30', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 31', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 32', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 33', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 34', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 35', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 36', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 38', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 84 (118)', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      { numero: 'Plaza 85 (119)', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -1 },
      // Plazas sótano -2: 76, 81
      { numero: 'Plaza 76', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -2 },
      { numero: 'Plaza 81', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -2 },
    ],
  },
  {
    nombre: 'Local Menéndez Pelayo 15',
    direccion: 'C/ Menéndez Pelayo, 15, Palencia',
    tipo: 'comercial',
    anoConstructor: 1985,
    ascensor: false,
    garaje: false,
    etiquetas: ['local', 'palencia', 'menendez-pelayo'],
    units: [
      { numero: 'Local y Sótano', tipo: 'local', superficie: 200, rentaMensual: 800, planta: 0 },
    ],
  },
  {
    nombre: 'Naves Avda Cuba 48-50-52',
    direccion: 'Avda. Cuba, 48-50-52, Palencia',
    tipo: 'comercial',
    anoConstructor: 1990,
    ascensor: false,
    garaje: false,
    etiquetas: ['naves', 'palencia', 'cuba'],
    units: [
      { numero: 'Nave 48', tipo: 'nave_industrial', superficie: 400, rentaMensual: 1000, planta: 0 },
      { numero: 'Nave 50', tipo: 'nave_industrial', superficie: 400, rentaMensual: 1000, planta: 0 },
      { numero: 'Nave 52', tipo: 'nave_industrial', superficie: 400, rentaMensual: 1000, planta: 0 },
    ],
  },

  // ─── VALLADOLID ───────────────────────────────────────────
  {
    nombre: 'Garajes Constitución 5',
    direccion: 'C/ Constitución, 5, Valladolid',
    tipo: 'comercial',
    anoConstructor: 1980,
    ascensor: false,
    garaje: true,
    etiquetas: ['garajes', 'valladolid', 'constitucion'],
    units: [
      { numero: 'Plaza 5 (Sot.-3)', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -3 },
      { numero: 'Plaza 14 (Sot.-3)', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -3 },
      { numero: 'Plaza 12 (Sot.-2)', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -2 },
      { numero: 'Plaza 13 (Sot.-2)', tipo: 'garaje', superficie: 12, rentaMensual: 60, planta: -2 },
    ],
  },
  {
    nombre: 'Naves Metal 4 (Pg. Argales)',
    direccion: 'C/ Metal, 4, Polígono Argales, Valladolid',
    tipo: 'comercial',
    anoConstructor: 1995,
    ascensor: false,
    garaje: false,
    etiquetas: ['naves', 'valladolid', 'argales'],
    units: [
      { numero: 'Nave Principal', tipo: 'nave_industrial', superficie: 600, rentaMensual: 1200, planta: 0 },
    ],
  },
  {
    nombre: 'Inmueble Constitución 8',
    direccion: 'C/ Constitución, 8, 2ºA, Valladolid',
    tipo: 'residencial',
    anoConstructor: 1975,
    ascensor: true,
    garaje: false,
    etiquetas: ['vivienda', 'valladolid', 'constitucion'],
    units: [
      { numero: '2ºA', tipo: 'vivienda', superficie: 90, rentaMensual: 600, planta: 2 },
    ],
  },

  // ─── BENIDORM ─────────────────────────────────────────────
  {
    nombre: 'Apartamentos Gemelos 20',
    direccion: 'Edificio Gemelos 20, Benidorm, Alicante',
    tipo: 'residencial',
    anoConstructor: 2005,
    ascensor: true,
    garaje: false,
    etiquetas: ['apartamentos', 'benidorm', 'gemelos-20'],
    units: [
      { numero: 'Pl.01 Lt.C', tipo: 'vivienda', superficie: 50, rentaMensual: 700, planta: 1 },
      { numero: 'Pl.02 Lt.C', tipo: 'vivienda', superficie: 50, rentaMensual: 700, planta: 2 },
      { numero: 'Pl.03 Lt.C', tipo: 'vivienda', superficie: 50, rentaMensual: 700, planta: 3 },
      { numero: 'Pl.03 Lt.D', tipo: 'vivienda', superficie: 50, rentaMensual: 700, planta: 3 },
      { numero: 'Pl.16 Lt.D', tipo: 'vivienda', superficie: 50, rentaMensual: 750, planta: 16 },
      { numero: 'Pl.17 Lt.D', tipo: 'vivienda', superficie: 50, rentaMensual: 750, planta: 17 },
      { numero: 'Pl.19 Lt.C', tipo: 'vivienda', superficie: 50, rentaMensual: 750, planta: 19 },
      { numero: 'Pl.20 Lt.D', tipo: 'vivienda', superficie: 50, rentaMensual: 750, planta: 20 },
      { numero: 'Pl.24 Lt.D', tipo: 'vivienda', superficie: 50, rentaMensual: 800, planta: 24 },
      { numero: 'Pl.25 Lt.D', tipo: 'vivienda', superficie: 50, rentaMensual: 800, planta: 25 },
    ],
  },
  {
    nombre: 'Apartamentos Gemelos II',
    direccion: 'Edificio Gemelos II, Benidorm, Alicante',
    tipo: 'residencial',
    anoConstructor: 2008,
    ascensor: true,
    garaje: true,
    etiquetas: ['apartamentos', 'benidorm', 'gemelos-ii'],
    units: [
      { numero: 'Pl.1 Lt.D', tipo: 'vivienda', superficie: 50, rentaMensual: 700, planta: 1 },
      { numero: 'Pl.1 Lt.E', tipo: 'vivienda', superficie: 50, rentaMensual: 700, planta: 1 },
      { numero: 'Pl.3 Lt.B', tipo: 'vivienda', superficie: 50, rentaMensual: 700, planta: 3 },
      { numero: 'Pl.3 Lt.E', tipo: 'vivienda', superficie: 50, rentaMensual: 700, planta: 3 },
      { numero: 'Pl.20 Lt.B', tipo: 'vivienda', superficie: 50, rentaMensual: 800, planta: 20 },
      { numero: 'Pl.20 Lt.C', tipo: 'vivienda', superficie: 50, rentaMensual: 800, planta: 20 },
      { numero: 'Garaje Pl.-1 Nº10', tipo: 'garaje', superficie: 12, rentaMensual: 80, planta: -1 },
      { numero: 'Garaje Pl.-1 Nº11', tipo: 'garaje', superficie: 12, rentaMensual: 80, planta: -1 },
    ],
  },
  {
    nombre: 'Apartamentos Gemelos IV',
    direccion: 'Edificio Gemelos IV, Benidorm, Alicante',
    tipo: 'residencial',
    anoConstructor: 2010,
    ascensor: true,
    garaje: false,
    etiquetas: ['apartamentos', 'benidorm', 'gemelos-iv'],
    units: [
      { numero: 'Pl.17 Lt.C', tipo: 'vivienda', superficie: 50, rentaMensual: 750, planta: 17 },
    ],
  },

  // ─── OTROS ────────────────────────────────────────────────
  {
    nombre: 'Casa El Tomillar de Nagüelles',
    direccion: 'El Tomillar de Nagüelles, 2',
    tipo: 'residencial',
    anoConstructor: 1990,
    ascensor: false,
    garaje: true,
    etiquetas: ['casa', 'naguelles'],
    units: [
      { numero: 'Casa', tipo: 'vivienda', superficie: 200, rentaMensual: 0, planta: 0 },
    ],
  },
  {
    nombre: 'Garajes Urb. Castillo Magaz',
    direccion: 'Urbanización Castillo de Magaz, Magaz de Pisuerga, Palencia',
    tipo: 'comercial',
    anoConstructor: 2000,
    ascensor: false,
    garaje: true,
    etiquetas: ['garajes', 'palencia', 'magaz'],
    units: [
      { numero: 'Garajes (bloque)', tipo: 'garaje', superficie: 100, rentaMensual: 0, planta: 0 },
    ],
  },
  {
    nombre: 'Terreno Rústico Grijota',
    direccion: 'Finca rústica de regadío, Grijota, Palencia',
    tipo: 'comercial',
    anoConstructor: 2000,
    ascensor: false,
    garaje: false,
    etiquetas: ['terreno', 'palencia', 'grijota', 'rustico'],
    units: [
      { numero: 'Parcela 5Ha', tipo: 'nave_industrial', superficie: 50000, rentaMensual: 0, planta: 0 },
    ],
  },

  // ─── MADRID (añadido Feb 2026 - del Índice de Subcuentas) ───
  {
    nombre: 'Local Prado 10',
    direccion: 'C/ Prado, 10, Madrid',
    tipo: 'comercial',
    anoConstructor: 1970,
    ascensor: false,
    garaje: false,
    etiquetas: ['local', 'madrid', 'prado'],
    units: [
      // Subcuenta 7520017000: Ingr. Arrend. Bajo y sótano C/Prado, 10, Madrid
      // Inquilino 2026: BOCA PRADO S.L. (subcuenta 4300000075) - €12.000/mes
      { numero: 'Bajo y Sótano', tipo: 'local', superficie: 250, rentaMensual: 12000, planta: 0 },
    ],
  },
];

// ============================================================================
// EJECUCIÓN
// ============================================================================

async function main() {
  console.log('====================================================================');
  console.log('  ALTA DE EDIFICIOS Y UNIDADES - ROVIDA S.L.');
  console.log('====================================================================\n');

  // 1. Buscar empresa Rovida
  const rovida = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });

  if (!rovida) {
    console.error('Empresa Rovida no encontrada');
    process.exit(1);
  }
  console.log(`Empresa: ${rovida.nombre} (${rovida.id})\n`);

  let totalBuildings = 0;
  let totalUnits = 0;
  let skippedBuildings = 0;

  for (const bDef of BUILDINGS) {
    // Verificar si ya existe
    const existing = await prisma.building.findFirst({
      where: {
        companyId: rovida.id,
        nombre: bDef.nombre,
      },
    });

    if (existing) {
      console.log(`  ⏭️  ${bDef.nombre} - ya existe (${existing.id})`);
      skippedBuildings++;

      // Aún así, verificar unidades
      const existingUnits = await prisma.unit.count({
        where: { buildingId: existing.id },
      });

      if (existingUnits < bDef.units.length) {
        // Crear unidades faltantes
        const existingUnitNumbers = (await prisma.unit.findMany({
          where: { buildingId: existing.id },
          select: { numero: true },
        })).map(u => u.numero);

        let addedUnits = 0;
        for (const uDef of bDef.units) {
          if (!existingUnitNumbers.includes(uDef.numero)) {
            await prisma.unit.create({
              data: {
                numero: uDef.numero,
                buildingId: existing.id,
                tipo: uDef.tipo,
                estado: 'disponible',
                superficie: uDef.superficie,
                habitaciones: uDef.tipo === 'vivienda' ? 2 : undefined,
                banos: uDef.tipo === 'vivienda' ? 1 : undefined,
                planta: uDef.planta,
                rentaMensual: uDef.rentaMensual,
              },
            });
            addedUnits++;
          }
        }
        if (addedUnits > 0) {
          console.log(`    ➕ ${addedUnits} unidades añadidas`);
          totalUnits += addedUnits;
        }
      }
      continue;
    }

    // Crear edificio
    const building = await prisma.building.create({
      data: {
        companyId: rovida.id,
        nombre: bDef.nombre,
        direccion: bDef.direccion,
        tipo: bDef.tipo,
        anoConstructor: bDef.anoConstructor,
        numeroUnidades: bDef.units.length,
        ascensor: bDef.ascensor,
        garaje: bDef.garaje,
        etiquetas: bDef.etiquetas,
      },
    });
    totalBuildings++;
    console.log(`  ✅ ${bDef.nombre} (${bDef.units.length} unidades)`);

    // Crear unidades
    for (const uDef of bDef.units) {
      await prisma.unit.create({
        data: {
          numero: uDef.numero,
          buildingId: building.id,
          tipo: uDef.tipo,
          estado: 'disponible',
          superficie: uDef.superficie,
          habitaciones: uDef.tipo === 'vivienda' ? 2 : undefined,
          banos: uDef.tipo === 'vivienda' ? 1 : undefined,
          planta: uDef.planta,
          rentaMensual: uDef.rentaMensual,
        },
      });
      totalUnits++;
    }
  }

  // Resumen
  const finalBuildings = await prisma.building.count({
    where: { companyId: rovida.id },
  });
  const finalUnits = await prisma.unit.count({
    where: { building: { companyId: rovida.id } },
  });

  console.log('\n====================================================================');
  console.log('  RESUMEN');
  console.log('====================================================================');
  console.log(`  Edificios creados: ${totalBuildings}`);
  console.log(`  Edificios existentes: ${skippedBuildings}`);
  console.log(`  Unidades creadas: ${totalUnits}`);
  console.log(`  Total edificios Rovida: ${finalBuildings}`);
  console.log(`  Total unidades Rovida: ${finalUnits}`);
  console.log('');
  console.log('  Distribución por ciudad:');
  console.log('  🏙️  Madrid: Espronceda(115), H.Tejada(56), Barquillo(3), Reina(2), Piamonte(1), Europa(1)');
  console.log('  🏙️  Palencia: M.Pelayo 17(21 garajes), M.Pelayo 15(1 local), Cuba(3 naves), Magaz, Grijota');
  console.log('  🏙️  Valladolid: Constitución 5(4 garajes), Metal(1 nave), Constitución 8(1 viv)');
  console.log('  🏖️  Benidorm: Gemelos 20(10 aptos), Gemelos II(8), Gemelos IV(1)');
  console.log('  🏡  Otros: El Tomillar (casa)');
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
