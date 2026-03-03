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
  {
    companyCode: 'ROV', // Rovida SL
    building: 'Prado 10',
    data: {
      numeroPoliza: '86441815',
      aseguradora: 'AXA Seguros Generales, S.A. de Seguros y Reaseguros',
      tipoSeguro: 'Comercio Integral',
      montoCobertura: 475950, // Continente: 475.950€
      primaAnual: 0, // Not visible in extracted text - to be updated
      deducible: null,
      fechaInicio: new Date('2025-12-23'),
      fechaVencimiento: new Date('2026-12-23'), // Assumed 1 year
      agente: 'CUENA VELA ASOCIADOS',
      telefonoAgente: '979707000',
      emailAgente: 'cuena.vela@agencia.axa-seguros.es',
      coberturas: [
        'Incendio, Explosión, Caída del rayo (Continente)',
        'Humo, Impacto objetos, Detonaciones sónicas (Continente)',
        'Actos de vandalismo (Continente)',
        'Fenómenos atmosféricos, Inundación (Continente)',
        'Derrames de agua (Continente)',
        'Localización y reparación averías',
        'Desatasco (Continente)',
        'Bomberos, Desescombro (Continente)',
        'Restauración estética (3.000€)',
        'Pérdida de alquileres (máx 12 meses)',
        'Robo continente',
        'Roturas: lunas, espejos, cristales, mármoles, rótulos, sanitarios',
        'Daños eléctricos (Continente)',
        'RC Inmueble (600.000€, sublímite víctima 151.000€)',
        'Protección jurídica',
        'Asistencia: profesionales, cerrajería, vigilancia, emergencia robo',
      ],
      notas: `Inmueble: CALLE Prado 10, PL 00 y PL -01, PT 1, 28014 Madrid.
Actividad: Hostelería/Restauración (restaurante sin servicio a domicilio ni terraza).
Superficie: 501 m². Año construcción: 1900. Rehabilitación: 2004.
Calidad construcción: No combustible.
Medidas protección incendios: Extintores, instalación eléctrica protegida.
Medidas protección robo: Cristal 18mm, cierres metálicos, rejas, puertas seguridad, cerraduras 3 puntos.
Carácter: Propietario uso de terceros.
Tomador: ROVIDA S.L. (B34125898), Avda Europa 34B Ezq 1ºIzq Módulo A, 28023 Madrid.
Mediador: CUENA VELA ASOCIADOS, CL Conde Vallellano 2, 34002 Palencia.
Declaración siniestros: 900 90 90 14 / 91 807 00 55 (24h).`,
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
