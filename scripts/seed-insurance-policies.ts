/**
 * Seed: Insurance Policies from Google Drive data
 * 
 * Inserts real insurance policy data extracted from PDF documents.
 * Run with: npx tsx scripts/seed-insurance-policies.ts
 */

import { config } from 'dotenv';
config({ path: '.env.production' });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ============================================================================
// POLICY DATA (extracted from ROVIDA_POLIZA_COMPLETA_86441815_PRADO10.pdf)
// ============================================================================

const POLICIES = [
  // ─── PÓLIZA 1: PRADO 10 (AXA Comercio Integral) ───
  {
    companyCode: 'ROV',
    building: 'Prado 10',
    data: {
      numeroPoliza: '86441815',
      aseguradora: 'AXA Seguros Generales, S.A. de Seguros y Reaseguros',
      tipoSeguro: 'Comercio Integral',
      montoCobertura: 475950,
      primaAnual: 0,
      deducible: null,
      fechaInicio: new Date('2025-12-23'),
      fechaVencimiento: new Date('2026-12-23'),
      agente: 'CUENA VELA ASOCIADOS',
      telefonoAgente: '979707000',
      emailAgente: 'cuena.vela@agencia.axa-seguros.es',
      coberturas: [
        'Incendio, Explosión, Caída del rayo (Continente)',
        'Humo, Impacto objetos, Detonaciones sónicas',
        'Actos de vandalismo',
        'Fenómenos atmosféricos, Inundación',
        'Derrames de agua',
        'Localización y reparación averías',
        'Desatasco',
        'Bomberos, Desescombro',
        'Restauración estética (3.000€)',
        'Pérdida de alquileres (máx 12 meses)',
        'Robo continente',
        'Roturas: lunas, espejos, cristales, mármoles, rótulos, sanitarios',
        'Daños eléctricos',
        'RC Inmueble (600.000€, sublímite víctima 151.000€)',
        'Protección jurídica',
        'Asistencia: profesionales, cerrajería, vigilancia, emergencia robo',
      ],
      notas: `Inmueble: CALLE Prado 10, PL 00 y PL -01, PT 1, 28014 Madrid.
Actividad: Hostelería/Restauración. Superficie: 501 m². Año: 1900. Rehabilitación: 2004.
Tomador: ROVIDA S.L. (B34125898). Mediador: CUENA VELA ASOCIADOS, Palencia.
Declaración siniestros: 900 90 90 14 / 91 807 00 55 (24h).`,
    },
  },

  // ─── PÓLIZA 2: HERNÁNDEZ DE TEJADA 6 (Allianz Comunidad) ───
  {
    companyCode: 'VIR', // Tomador: VIRODA INVERSIONES SLU
    building: 'Hernandez de Tejada',
    data: {
      numeroPoliza: '057780547',
      aseguradora: 'Allianz Seguros y Reaseguros, S.A.',
      tipoSeguro: 'Comunidad Personalizada',
      montoCobertura: 1497680, // Capital continente
      primaAnual: 0,
      deducible: null,
      fechaInicio: new Date('2025-10-13'),
      fechaVencimiento: new Date('2026-09-30'),
      fechaRenovacion: new Date('2026-10-01'),
      agente: 'ROAMS INSURTECH S.L.',
      telefonoAgente: '979920030',
      emailAgente: 'armando.garcia@piknus.com',
      coberturas: [
        'Incendio, Explosión',
        'Caída del rayo',
        'Agua: escape, desbordamiento, rotura tuberías',
        'Robo, Expoliación',
        'Actos de vandalismo',
        'Responsabilidad Civil comunidad (600.000€)',
        'RC Contaminación',
        'Asistencia: fontanería, electricidad, cerrajería, cristalería',
        'Control de plagas',
        'Protección jurídica y asesoramiento',
        'ITE (Inspección Técnica Edificios)',
        'Eficiencia energética',
        'Accesibilidad',
        'Fenómenos atmosféricos',
        'Rotura cristales, espejos, vitrocerámicas',
        'Daños eléctricos',
      ],
      notas: `Inmueble: Cl Hernández de Tejada 6 y Garaje, 28027 Madrid.
Edificio viviendas: 14 viviendas/locales, 5 plantas + 2 sótanos. Año: 2005. 1544 m².
Tomador: VIRODA INVERSIONES SLU (B88595327). Asegurado adicional: ROVIDA S.L.U. (B34125898).
Mediador: ROAMS INSURTECH S.L. (Corredor DGS J3536), Palencia.
Materiales incombustibles. Revalorización automática incluida.`,
    },
  },

  // ─── PÓLIZA 3: PIAMONTE 23 (AXA Comunidad Integral) ───
  {
    companyCode: 'ROV', // Tomador: ROVIDA S.L.
    building: 'Piamonte',
    data: {
      numeroPoliza: '85447715',
      aseguradora: 'AXA Seguros Generales, S.A. de Seguros y Reaseguros',
      tipoSeguro: 'Comunidad Integral',
      montoCobertura: 1968960, // Capital edificio
      primaAnual: 0,
      deducible: null,
      fechaInicio: new Date('2024-05-14'),
      fechaVencimiento: new Date('2025-05-14'),
      agente: 'CUENA VELA Y ASOCIADOS, S.L.',
      telefonoAgente: '979707000',
      emailAgente: 'cuena.vela@agencia.axa-seguros.es',
      coberturas: [
        'Incendio, Explosión',
        'Caída del rayo',
        'Humo',
        'Impacto de objetos, Detonaciones sónicas',
        'Derrame instalaciones anti-incendio',
        'Actos de vandalismo',
        'Bomberos, Desescombro',
        'Daños estéticos (3.000€)',
        'Pérdida de alquileres (295.344€)',
        'Desalojamiento forzoso (295.344€)',
        'Traslado y custodia bienes (295.344€)',
        'Fenómenos atmosféricos: lluvia, viento, pedrisco, nieve, inundación',
        'Extracción lodos y desembarro (78.758€)',
        'Goteras y filtraciones',
        'RC Inmobiliaria y subsidiaria (1.200.000€)',
        'RC Patronal (1.200.000€)',
        'RC Presidente/Junta directiva',
        'Fianza y Defensa',
        'Daños por agua',
        'Rotura cristales',
        'Daños eléctricos',
        'Asistencia',
        'Protección jurídica',
      ],
      notas: `Inmueble: CALLE Piamonte 23, 28004 Madrid. Edificio oficinas.
Único propietario. 7 locales, 4 plantas, 1 garaje. 2344 m². Año: 1985. Rehabilitación integral: 2018.
Calidad media. Instalaciones renovadas: calefacción, agua, gas, electricidad, refrigeración.
Tomador: ROVIDA S.L. (B34125898). Mediador: CUENA VELA Y ASOCIADOS, Palencia.
Pérdida alquileres cubierta hasta 295.344€. RC hasta 1.200.000€.`,
    },
  },
];

// ============================================================================
// COMPANY IDS (from DB)
// ============================================================================

const COMPANY_MAP: Record<string, string> = {
  VID: 'c65159283deeaf6815f8eda95',
  ROV: 'cef19f55f7b6ce0637d5ffb53',
  VIR: 'cmkctneuh0001nokn7nvhuweq',
  VIBLA: 'vibla-pe-scr',
};

async function main() {
  console.log('🔐 Seeding insurance policies...\n');

  for (const policy of POLICIES) {
    const companyId = COMPANY_MAP[policy.companyCode];
    if (!companyId) {
      console.log(`❌ Company ${policy.companyCode} not found in map`);
      continue;
    }

    // Find building by name/address match
    let buildingId: string | null = null;
    const buildings = await prisma.building.findMany({
      where: { companyId },
      select: { id: true, nombre: true, direccion: true },
    });

    const match = buildings.find(
      (b) =>
        b.nombre?.toLowerCase().includes(policy.building.toLowerCase()) ||
        b.direccion?.toLowerCase().includes(policy.building.toLowerCase())
    );

    if (match) {
      buildingId = match.id;
      console.log(`  🏢 Matched building: ${match.nombre || match.direccion} (${match.id})`);
    } else {
      console.log(`  ⚠️ No building match for "${policy.building}" in ${policy.companyCode}`);
    }

    // Upsert policy
    const existing = await prisma.insurancePolicy.findUnique({
      where: { numeroPoliza: policy.data.numeroPoliza },
    });

    if (existing) {
      await prisma.insurancePolicy.update({
        where: { numeroPoliza: policy.data.numeroPoliza },
        data: {
          ...policy.data,
          companyId,
          buildingId,
          estado: 'activa',
        },
      });
      console.log(`  ✅ Updated policy ${policy.data.numeroPoliza}`);
    } else {
      await prisma.insurancePolicy.create({
        data: {
          ...policy.data,
          companyId,
          buildingId,
          estado: 'activa',
        },
      });
      console.log(`  ✅ Created policy ${policy.data.numeroPoliza}`);
    }
  }

  // Summary
  const total = await prisma.insurancePolicy.count();
  console.log(`\n📊 Total insurance policies in DB: ${total}`);

  await prisma.$disconnect();
  console.log('\n✅ Done');
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
