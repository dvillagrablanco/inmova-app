/**
 * Seed de fondos de Private Equity de Vidaro/VIBLA SCR
 *
 * Datos extraídos del Reporting MdF Family Partners "BALDOMERO" (31/01/2026)
 * Cartera 1149.02/1149.04 - BALDOMERO PE GRUPO
 * 15 fondos PE canalizados vía VIBLA SCR
 *
 * Idempotente: no duplica si ya existen (busca por targetCompanyName + companyId)
 *
 * Uso: npx tsx scripts/seed-vidaro-pe-funds.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const COMPANY_ID = 'vidaro-inversiones';

interface PEFundData {
  nombre: string;
  anoCompromiso: number;
  compromisoTotal: number;
  valoracionActual: number;
  capitalPendiente: number;
  distribucionesAcumuladas: number;
  tvpi: number;
  capitalLlamado: number; // desembolsos acumulados
  // Rentabilidad ene-2026
  patrimonioInicioPeriodo: number;
  desembolsosPeriodo: number;
  reembolsosPeriodo: number;
  rentabilidadPeriodoEur: number;
  rentabilidadPeriodoPct: number;
}

const PE_FUNDS: PEFundData[] = [
  {
    nombre: 'HELIA III 19',
    anoCompromiso: 2019,
    compromisoTotal: 2500000,
    valoracionActual: 1916224,
    capitalPendiente: 984000,
    distribucionesAcumuladas: 89773,
    tvpi: 1.32,
    capitalLlamado: 1516000,
    patrimonioInicioPeriodo: 1916224,
    desembolsosPeriodo: 0,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: 0,
    rentabilidadPeriodoPct: 0.00,
  },
  {
    nombre: 'ASABYS 20',
    anoCompromiso: 2020,
    compromisoTotal: 4317356,
    valoracionActual: 3538394,
    capitalPendiente: 0,
    distribucionesAcumuladas: 211463,
    tvpi: 0.87,
    capitalLlamado: 4317356,
    patrimonioInicioPeriodo: 3538394,
    desembolsosPeriodo: 0,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: 0,
    rentabilidadPeriodoPct: 0.00,
  },
  {
    nombre: 'GREEN TRANS 22',
    anoCompromiso: 2020,
    compromisoTotal: 1500000,
    valoracionActual: 1035000,
    capitalPendiente: 525000,
    distribucionesAcumuladas: 0,
    tvpi: 1.06,
    capitalLlamado: 975000,
    patrimonioInicioPeriodo: 794550,
    desembolsosPeriodo: 0,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: 240450,
    rentabilidadPeriodoPct: 30.26,
  },
  {
    nombre: 'PORTOBELLO 20',
    anoCompromiso: 2020,
    compromisoTotal: 4000000,
    valoracionActual: 4706227,
    capitalPendiente: 1491905,
    distribucionesAcumuladas: 1460768,
    tvpi: 1.79,
    capitalLlamado: 3437703,
    patrimonioInicioPeriodo: 4706227,
    desembolsosPeriodo: 0,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: 0,
    rentabilidadPeriodoPct: 0.00,
  },
  {
    nombre: 'STONEHENGE 20',
    anoCompromiso: 2020,
    compromisoTotal: 2000000,
    valoracionActual: 1596288,
    capitalPendiente: 190200,
    distribucionesAcumuladas: 0,
    tvpi: 0.88,
    capitalLlamado: 1809800,
    patrimonioInicioPeriodo: 1572007,
    desembolsosPeriodo: 0,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: 24281,
    rentabilidadPeriodoPct: 1.54,
  },
  {
    nombre: 'TITAN II A 22',
    anoCompromiso: 2020,
    compromisoTotal: 2000000,
    valoracionActual: 1391600,
    capitalPendiente: 580000,
    distribucionesAcumuladas: 45999,
    tvpi: 1.01,
    capitalLlamado: 1420000,
    patrimonioInicioPeriodo: 0,
    desembolsosPeriodo: 1420000,
    reembolsosPeriodo: 45999,
    rentabilidadPeriodoEur: 17599,
    rentabilidadPeriodoPct: 1.24,
  },
  {
    nombre: 'ARTA III 23',
    anoCompromiso: 2023,
    compromisoTotal: 1000000,
    valoracionActual: 209384,
    capitalPendiente: 736061,
    distribucionesAcumuladas: 0,
    tvpi: 0.79,
    capitalLlamado: 263939,
    patrimonioInicioPeriodo: 209384,
    desembolsosPeriodo: 0,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: 0,
    rentabilidadPeriodoPct: 0.00,
  },
  {
    nombre: 'AXIOM 7 23',
    anoCompromiso: 2023,
    compromisoTotal: 848530,
    valoracionActual: 151352,
    capitalPendiente: 691925,
    distribucionesAcumuladas: 0,
    tvpi: 0.97,
    capitalLlamado: 156605,
    patrimonioInicioPeriodo: 93932,
    desembolsosPeriodo: 59067,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: -1647,
    rentabilidadPeriodoPct: -1.08,
  },
  {
    nombre: 'COLUMBUS IV 23',
    anoCompromiso: 2023,
    compromisoTotal: 300000,
    valoracionActual: 134665,
    capitalPendiente: 162000,
    distribucionesAcumuladas: 0,
    tvpi: 0.98,
    capitalLlamado: 138000,
    patrimonioInicioPeriodo: 134665,
    desembolsosPeriodo: 0,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: 0,
    rentabilidadPeriodoPct: 0.00,
  },
  {
    nombre: 'INDUSTRY V X 23',
    anoCompromiso: 2023,
    compromisoTotal: 521659,
    valoracionActual: 448248,
    capitalPendiente: 207425,
    distribucionesAcumuladas: 0,
    tvpi: 1.43,
    capitalLlamado: 314235,
    patrimonioInicioPeriodo: 452255,
    desembolsosPeriodo: 0,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: -4007,
    rentabilidadPeriodoPct: -0.89,
  },
  {
    nombre: 'N.MOUN. VII 23L',
    anoCompromiso: 2023,
    compromisoTotal: 1074334,
    valoracionActual: 428141,
    capitalPendiente: 681084,
    distribucionesAcumuladas: 299,
    tvpi: 1.09,
    capitalLlamado: 393250,
    patrimonioInicioPeriodo: 431968,
    desembolsosPeriodo: 0,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: -3827,
    rentabilidadPeriodoPct: -0.89,
  },
  {
    nombre: 'PASF V LUX 23',
    anoCompromiso: 2023,
    compromisoTotal: 1076564,
    valoracionActual: 319338,
    capitalPendiente: 833757,
    distribucionesAcumuladas: 0,
    tvpi: 1.32,
    capitalLlamado: 242807,
    patrimonioInicioPeriodo: 322192,
    desembolsosPeriodo: 0,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: -2854,
    rentabilidadPeriodoPct: -0.89,
  },
  {
    nombre: 'TB DIRECT III22',
    anoCompromiso: 2023,
    compromisoTotal: 589142,
    valoracionActual: 522011,
    capitalPendiente: 77598,
    distribucionesAcumuladas: 37167,
    tvpi: 1.09,
    capitalLlamado: 511544,
    patrimonioInicioPeriodo: 564104,
    desembolsosPeriodo: 37167,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: -4926,
    rentabilidadPeriodoPct: -0.87,
  },
  {
    nombre: 'COALESCE I 24',
    anoCompromiso: 2024,
    compromisoTotal: 877893,
    valoracionActual: 293229,
    capitalPendiente: 545855,
    distribucionesAcumuladas: 12180,
    tvpi: 0.92,
    capitalLlamado: 332038,
    patrimonioInicioPeriodo: 295851,
    desembolsosPeriodo: 0,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: -2622,
    rentabilidadPeriodoPct: -0.89,
  },
  {
    nombre: 'OVERBAY 25 D',
    anoCompromiso: 2025,
    compromisoTotal: 766610,
    valoracionActual: 759430,
    capitalPendiente: 0,
    distribucionesAcumuladas: 0,
    tvpi: 0.99,
    capitalLlamado: 766610,
    patrimonioInicioPeriodo: 766218,
    desembolsosPeriodo: 0,
    reembolsosPeriodo: 0,
    rentabilidadPeriodoEur: -6788,
    rentabilidadPeriodoPct: -0.89,
  },
];

async function main() {
  console.log('🏦 Seed de fondos PE de Vidaro/VIBLA SCR\n');
  console.log(`   Datos: Reporting MdF "BALDOMERO" 31/01/2026`);
  console.log(`   Empresa: ${COMPANY_ID}`);
  console.log(`   Fondos: ${PE_FUNDS.length}\n`);

  // Verify company exists
  const company = await prisma.company.findUnique({
    where: { id: COMPANY_ID },
    select: { id: true, nombre: true },
  });

  if (!company) {
    console.error(`❌ Empresa ${COMPANY_ID} no encontrada`);
    process.exit(1);
  }

  console.log(`✓ Empresa: ${company.nombre}\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const fund of PE_FUNDS) {
    // Check if fund already exists (by name + company)
    const existing = await prisma.participation.findFirst({
      where: {
        companyId: COMPANY_ID,
        targetCompanyName: fund.nombre,
      },
    });

    const data = {
      targetCompanyName: fund.nombre,
      targetCompanyCIF: null,
      tipo: 'pe_fund' as const,
      porcentaje: 0, // LP participation, no controlling stake
      fechaAdquisicion: new Date(fund.anoCompromiso, 0, 1),
      costeAdquisicion: fund.capitalLlamado,
      valorContable: fund.valoracionActual,
      valorEstimado: fund.valoracionActual,
      fechaValoracion: new Date(2026, 0, 31), // 31/01/2026
      compromisoTotal: fund.compromisoTotal,
      capitalLlamado: fund.capitalLlamado,
      capitalPendiente: fund.capitalPendiente,
      capitalDistribuido: fund.distribucionesAcumuladas,
      valoracionActual: fund.valoracionActual,
      tvpi: fund.tvpi,
      dpi: fund.capitalLlamado > 0
        ? Math.round((fund.distribucionesAcumuladas / fund.capitalLlamado) * 100) / 100
        : 0,
      anoCompromiso: fund.anoCompromiso,
      vehiculoInversor: 'VIBLA_SCR',
      gestora: 'MdF Gestefin',
      fechaUltimaValoracion: new Date(2026, 0, 31),
      patrimonioInicioPeriodo: fund.patrimonioInicioPeriodo,
      rentabilidadPeriodoEur: fund.rentabilidadPeriodoEur,
      rentabilidadPeriodoPct: fund.rentabilidadPeriodoPct,
      desembolsosPeriodo: fund.desembolsosPeriodo,
      reembolsosPeriodo: fund.reembolsosPeriodo,
      activa: true,
    };

    if (existing) {
      // Update with latest data
      await prisma.participation.update({
        where: { id: existing.id },
        data,
      });
      updated++;
      console.log(`  🔄 ${fund.nombre} — actualizado (€${fund.valoracionActual.toLocaleString('es-ES')})`);
    } else {
      await prisma.participation.create({
        data: {
          companyId: COMPANY_ID,
          ...data,
        },
      });
      created++;
      console.log(`  ✅ ${fund.nombre} — creado (€${fund.valoracionActual.toLocaleString('es-ES')})`);
    }
  }

  // Print summary
  const totalComprometido = PE_FUNDS.reduce((s, f) => s + f.compromisoTotal, 0);
  const totalValoracion = PE_FUNDS.reduce((s, f) => s + f.valoracionActual, 0);
  const totalPendiente = PE_FUNDS.reduce((s, f) => s + f.capitalPendiente, 0);
  const totalDistribuido = PE_FUNDS.reduce((s, f) => s + f.distribucionesAcumuladas, 0);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Creados: ${created} | Actualizados: ${updated} | Sin cambios: ${skipped}`);
  console.log(`  Total comprometido: €${totalComprometido.toLocaleString('es-ES')}`);
  console.log(`  Total valoración:   €${totalValoracion.toLocaleString('es-ES')}`);
  console.log(`  Desemb. pendientes: €${totalPendiente.toLocaleString('es-ES')}`);
  console.log(`  Distribuciones:     €${totalDistribuido.toLocaleString('es-ES')}`);
  console.log(`${'─'.repeat(60)}`);
  console.log('\n✅ Seed completado.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
