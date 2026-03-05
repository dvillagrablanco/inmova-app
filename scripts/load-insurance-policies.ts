/**
 * Cargar pólizas de seguro del Grupo Vidaro
 * 
 * Fuente: PDFs de Google Drive analizados
 * 
 * 3 pólizas:
 * 1. Allianz Comunidad Personalizada — Viroda, Hernández de Tejada 6
 * 2. AXA Seguro de Negocios — Rovida, Calle Prado 10, Madrid
 * 3. AXA Comunidad Integral — Rovida, Calle Piamonte 23, Madrid
 * 
 * Uso: npx tsx scripts/load-insurance-policies.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });
dotenv.config();

const prisma = new PrismaClient();

const POLICIES = [
  {
    companyHint: 'Viroda',
    buildingHint: 'Tejada',
    numeroPoliza: '057780547',
    tipo: 'comunidad' as const,
    aseguradora: 'Allianz Seguros y Reaseguros S.A.',
    nombreAsegurado: 'Viroda Inversiones SLU',
    telefonoAseguradora: null,
    emailAseguradora: null,
    contactoAgente: 'ROAMS INSURTECH S.L.',
    cobertura: 'Multirriesgos Comunidad Personalizada: Daños materiales (incendio, agua, robo), Responsabilidad Civil, RC por Contaminación, Asistencia 24h, Control de Plagas, Asesoramiento Jurídico, ITE/Eficiencia Energética/Accesibilidad',
    sumaAsegurada: null, // No extraída del PDF, requeriría análisis más detallado
    franquicia: 150,
    fechaInicio: new Date('2025-10-13'),
    fechaVencimiento: new Date('2026-09-30'),
    primaAnual: null,
    estado: 'activa' as const,
    notas: 'Edificio de Viviendas. Incluye garaje. Duración anual renovable desde 01/10/2026. Cobro por Bankinter (cuenta ****1826). CIF Viroda: B88595327. Dirección tomador: Av Europa 34, B, IZ, Módulo F, 28023 Madrid.',
  },
  {
    companyHint: 'Rovida',
    buildingHint: 'Prado',
    numeroPoliza: '86441815',
    tipo: 'otro' as const,
    aseguradora: 'AXA Seguros Generales S.A.',
    nombreAsegurado: 'Rovida S.L.',
    telefonoAseguradora: '979707000',
    emailAseguradora: 'cuena.vela@agencia.axa-seguros.es',
    contactoAgente: 'Cuena Vela Asociados, CL Conde Vallellano 2, 34002 Palencia',
    cobertura: 'Seguro de Negocios — Comercio Integral. Actividad: Hostelería/Restauración (Restaurante sin servicio a domicilio y sin terraza). Coberturas: daños materiales, robo, RC, asistencia en negocio.',
    sumaAsegurada: null,
    franquicia: null,
    fechaInicio: new Date('2025-12-23'),
    fechaVencimiento: new Date('2026-12-23'),
    primaAnual: null,
    estado: 'activa' as const,
    notas: 'Local comercial en Calle Prado 10, PL 00 y PL -01, 28014 Madrid. Uso: Restaurante. Mediador: Cuena Vela y Asociados (Palencia).',
  },
  {
    companyHint: 'Rovida',
    buildingHint: 'Piamonte',
    numeroPoliza: '85447715',
    tipo: 'comunidad' as const,
    aseguradora: 'AXA Seguros Generales S.A.',
    nombreAsegurado: 'Rovida S.L.',
    telefonoAseguradora: '979707000',
    emailAseguradora: 'cuena.vela@agencia.axa-seguros.es',
    contactoAgente: 'Cuena Vela y Asociados S.L.',
    cobertura: 'Comunidad Integral: Incendio/Explosión, Derrames de Agua, Localización/Reparación Averías, Responsabilidad Civil, Robo/Hurto, Daños estéticos, Rotura maquinaria, Accidentes empleados comunidad.',
    sumaAsegurada: 1968960,
    franquicia: null,
    fechaInicio: new Date('2024-05-14'),
    fechaVencimiento: new Date('2025-05-14'),
    primaAnual: null,
    estado: 'vencida' as const,
    notas: 'Calle Piamonte 23, 28004 Madrid. Edificio oficinas (único propietario). 7 locales, 4 plantas, superficie construida 2.344m², año construcción 1985, rehabilitado 2018. Capital edificio: €1.968.960. Modalidad: Único propietario. ⚠️ PÓLIZA VENCIDA 14/05/2025 — Solicitar renovación.',
  },
];

async function main() {
  console.log('====================================================================');
  console.log('  CARGAR: Pólizas de Seguro — Grupo Vidaro');
  console.log('====================================================================\n');

  let created = 0;
  let updated = 0;

  for (const policy of POLICIES) {
    // Find company
    const company = await prisma.company.findFirst({
      where: { nombre: { contains: policy.companyHint, mode: 'insensitive' } },
      select: { id: true, nombre: true },
    });

    if (!company) {
      console.log(`❌ Empresa no encontrada: ${policy.companyHint}`);
      continue;
    }

    // Find building
    let buildingId: string | null = null;
    if (policy.buildingHint) {
      const building = await prisma.building.findFirst({
        where: {
          companyId: company.id,
          OR: [
            { nombre: { contains: policy.buildingHint, mode: 'insensitive' } },
            { direccion: { contains: policy.buildingHint, mode: 'insensitive' } },
          ],
        },
        select: { id: true, nombre: true },
      });
      if (building) {
        buildingId = building.id;
        console.log(`📋 ${policy.aseguradora} — ${company.nombre} → ${building.nombre}`);
      } else {
        console.log(`📋 ${policy.aseguradora} — ${company.nombre} (edificio ${policy.buildingHint} no encontrado)`);
      }
    }

    // Check if policy exists
    const existing = await prisma.insurance.findFirst({
      where: { companyId: company.id, numeroPoliza: policy.numeroPoliza },
    });

    const data = {
      buildingId,
      tipo: policy.tipo,
      aseguradora: policy.aseguradora,
      nombreAsegurado: policy.nombreAsegurado,
      telefonoAseguradora: policy.telefonoAseguradora,
      emailAseguradora: policy.emailAseguradora,
      contactoAgente: policy.contactoAgente,
      cobertura: policy.cobertura,
      sumaAsegurada: policy.sumaAsegurada,
      franquicia: policy.franquicia,
      fechaInicio: policy.fechaInicio,
      fechaVencimiento: policy.fechaVencimiento,
      primaAnual: policy.primaAnual,
      estado: policy.estado,
      notas: policy.notas,
    };

    if (existing) {
      await prisma.insurance.update({ where: { id: existing.id }, data });
      updated++;
      console.log(`  ✏️ Actualizada: Póliza ${policy.numeroPoliza}`);
    } else {
      await prisma.insurance.create({
        data: { companyId: company.id, numeroPoliza: policy.numeroPoliza, ...data },
      });
      created++;
      console.log(`  ✅ Creada: Póliza ${policy.numeroPoliza}`);
    }

    // Show status
    const statusIcon = policy.estado === 'activa' ? '🟢' : '🔴';
    console.log(`  ${statusIcon} Estado: ${policy.estado} | Vigencia: ${policy.fechaInicio.toISOString().split('T')[0]} → ${policy.fechaVencimiento.toISOString().split('T')[0]}`);
    if (policy.sumaAsegurada) {
      console.log(`  💰 Suma asegurada: €${policy.sumaAsegurada.toLocaleString('es-ES')}`);
    }
    console.log('');
  }

  console.log('====================================================================');
  console.log('  RESUMEN');
  console.log('====================================================================');
  console.log(`  Pólizas creadas: ${created}`);
  console.log(`  Pólizas actualizadas: ${updated}`);
  console.log(`  Activas: ${POLICIES.filter(p => p.estado === 'activa').length}`);
  console.log(`  Vencidas: ${POLICIES.filter(p => p.estado === 'vencida').length}`);
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(e => { console.error('Error:', e); prisma.$disconnect(); process.exit(1); });
