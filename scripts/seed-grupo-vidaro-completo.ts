/**
 * Seed Maestro: Datos completos del Grupo Vidaro
 *
 * Carga desde contabilidad y reportes MdF:
 * 1. VIBLA SCR como empresa filial de Vidaro
 * 2. 9 participadas de Vidaro (sociedades del grupo)
 * 3. 22 cuentas bancarias de Vidaro con IBANs y saldos
 * 4. Facturación intragrupo (ARC)
 * 5. Top posiciones financieras LP de Vidaro
 *
 * Idempotente. Busca empresas por nombre.
 *
 * Uso: npx tsx scripts/seed-grupo-vidaro-completo.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ============================================================================
// HELPERS
// ============================================================================

async function findCompany(hint: string) {
  return prisma.company.findFirst({
    where: { nombre: { contains: hint, mode: 'insensitive' } },
    select: { id: true, nombre: true },
  });
}

async function upsertCompany(id: string, data: Record<string, unknown>) {
  return prisma.company.upsert({
    where: { id },
    update: data,
    create: { id, ...data } as never,
  });
}

// ============================================================================
// 1. VIBLA SCR como empresa
// ============================================================================

async function seedVibla(vidaroId: string) {
  console.log('\n🏦 1. Creando VIBLA Private Equity SCR S.A...');

  const vibla = await upsertCompany('vibla-pe-scr', {
    nombre: 'VIBLA Private Equity SCR S.A.',
    cif: 'A-XXXXXXXX',
    ciudad: 'Madrid',
    pais: 'España',
    activo: true,
    parentCompanyId: vidaroId,
    notasAdmin: 'SCR del grupo familiar Vidaro. Vehículo de inversión en Private Equity. Gestiona 15 fondos PE (€23.4M comprometido, €17.4M NAV). Asesorada por MdF Gestefin. Depositarios: Bankinter, CaixaBank.',
  });

  console.log(`  ✅ VIBLA SCR (${vibla.id}) — filial de Vidaro`);

  // Update PE funds to reference VIBLA SCR
  const updated = await prisma.participation.updateMany({
    where: { vehiculoInversor: 'VIBLA_SCR' },
    data: { notas: 'Inversión canalizada vía VIBLA Private Equity SCR S.A.' },
  });
  console.log(`  ✅ ${updated.count} fondos PE vinculados a VIBLA SCR`);
}

// ============================================================================
// 2. PARTICIPADAS DE VIDARO (9 sociedades)
// ============================================================================

async function seedParticipadas(vidaroId: string) {
  console.log('\n🏢 2. Registrando participadas del grupo Vidaro...');

  const participadas = [
    { nombre: 'Facundo Blanco S.A.', tipo: 'filial', porcentaje: 100, subcuenta: '2403000001' },
    { nombre: 'Industrial y Comercial Facundo SAU', tipo: 'filial', porcentaje: 100, subcuenta: '2403000002' },
    { nombre: 'Disfasa S.A.U.', tipo: 'filial', porcentaje: 100, subcuenta: '2403000003' },
    { nombre: 'Los Girasoles S.A.U.', tipo: 'filial', porcentaje: 100, subcuenta: '2403000004' },
    { nombre: 'PDV Gesfasa Desarrollo SLU', tipo: 'filial', porcentaje: 100, subcuenta: '2403000005' },
    { nombre: 'Viroda Inversiones SLU', tipo: 'filial', porcentaje: 100, subcuenta: '2403000006' },
    { nombre: 'Rovida S.L.U.', tipo: 'filial', porcentaje: 100, subcuenta: '2403000007' },
    { nombre: 'VIBLA Private Equity SCR S.A.', tipo: 'filial', porcentaje: 100, subcuenta: '2403000008' },
    { nombre: 'Disfasa S.A. (acciones adicionales)', tipo: 'filial', porcentaje: 0, subcuenta: '2405000001' },
  ];

  let created = 0;
  let skipped = 0;

  for (const p of participadas) {
    const existing = await prisma.participation.findFirst({
      where: { companyId: vidaroId, targetCompanyName: p.nombre },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.participation.create({
      data: {
        companyId: vidaroId,
        targetCompanyName: p.nombre,
        tipo: 'holding',
        porcentaje: p.porcentaje,
        fechaAdquisicion: new Date(2020, 0, 1),
        costeAdquisicion: 0,
        valorContable: 0,
        activa: true,
        notas: `Subcuenta contable: ${p.subcuenta}. Sociedad del grupo Vidaro.`,
      },
    });
    created++;
  }

  console.log(`  ✅ ${created} participadas creadas, ${skipped} ya existían`);
}

// ============================================================================
// 3. CUENTAS BANCARIAS DE VIDARO (22 cuentas)
// ============================================================================

async function seedBankAccounts(vidaroId: string) {
  console.log('\n🏦 3. Registrando cuentas bancarias de Vidaro...');

  const cuentas = [
    { entidad: 'BBVA', iban: 'ES4501820496610201685315', alias: 'BBVA Principal', saldo: 18745, divisa: 'EUR' },
    { entidad: 'Banco Santander', iban: 'ES9800750142560600679446', alias: 'Santander Principal', saldo: 188435, divisa: 'EUR' },
    { entidad: 'Bankinter', iban: 'ES5301280250500100070675', alias: 'Bankinter Principal', saldo: 7510521, divisa: 'EUR' },
    { entidad: 'BBVA', iban: 'ES1101826462710201514692', alias: 'BBVA Inversión 2', saldo: 720000, divisa: 'EUR' },
    { entidad: 'Banco Santander', iban: 'ES4500496740612416120184', alias: 'Santander Inversión', saldo: 2900, divisa: 'EUR' },
    { entidad: 'Banca March', iban: 'ES0600610377810088770119', alias: 'March Principal', saldo: 1050, divisa: 'EUR' },
    { entidad: 'AndBank', iban: 'ES8915441202436650183570', alias: 'AndBank', saldo: 78000, divisa: 'EUR' },
    { entidad: 'Inversis', iban: 'ES4102320543510038870971', alias: 'Inversis 1', saldo: 7664526, divisa: 'EUR' },
    { entidad: 'Bankinter', iban: 'ES0701280250510100088644', alias: 'Bankinter Asesorada MdF', saldo: 4597250, divisa: 'EUR' },
    { entidad: 'Pictet', iban: 'LU631980017392000100', alias: 'Pictet Luxemburgo', saldo: 5151768, divisa: 'EUR' },
    { entidad: 'Banca March', iban: 'ES1700610377860104020113', alias: 'March Inversión', saldo: 4277181, divisa: 'EUR' },
    { entidad: 'Inversis', iban: 'ES6502320543500039016185', alias: 'Inversis 2 (MdF AF)', saldo: 4146381, divisa: 'EUR' },
    { entidad: 'Inversis', iban: 'ES1602320543500043715359', alias: 'Inversis 3', saldo: 2054574, divisa: 'EUR' },
    { entidad: 'CACEIS', iban: 'ES2800385777190016147134', alias: 'CACEIS España', saldo: 6605922, divisa: 'EUR' },
    { entidad: 'Bankinter', iban: 'ES0701280250520500008031', alias: 'Bankinter Póliza Crédito', saldo: 1300001, divisa: 'EUR' },
    { entidad: 'BBVA Suiza', iban: 'CH7908270287843892001', alias: 'BBVA Suiza 1', saldo: 0, divisa: 'EUR' },
    { entidad: 'BBVA Suiza', iban: 'CH1408270287843892007', alias: 'BBVA Suiza 2', saldo: 0, divisa: 'EUR' },
    { entidad: 'UBS', iban: 'CH7100206206550611608', alias: 'UBS Suiza', saldo: 0, divisa: 'EUR' },
    { entidad: 'Bankinter Luxemburgo', iban: 'LU141770003673B00978', alias: 'Bankinter Luxemburgo', saldo: 0, divisa: 'EUR' },
  ];

  let created = 0;
  let skipped = 0;

  for (const c of cuentas) {
    const existing = await prisma.financialAccount.findFirst({
      where: { companyId: vidaroId, numeroCuenta: c.iban },
    });

    if (existing) {
      // Update saldo
      await prisma.financialAccount.update({
        where: { id: existing.id },
        data: { saldoActual: c.saldo },
      });
      skipped++;
      continue;
    }

    await prisma.financialAccount.create({
      data: {
        companyId: vidaroId,
        entidad: c.entidad,
        tipoEntidad: c.entidad.includes('Suiza') || c.entidad === 'UBS' || c.entidad === 'Pictet' ? 'banca_privada' : 'banca_comercial',
        numeroCuenta: c.iban,
        alias: c.alias,
        divisa: c.divisa,
        saldoActual: c.saldo,
        valorMercado: 0,
        conexionTipo: c.entidad.includes('Bankinter') ? 'psd2' : c.entidad.includes('March') || c.entidad.includes('CACEIS') || c.entidad.includes('Inversis') ? 'swift' : 'ocr_pdf',
        activa: true,
        apiConfig: {},
      },
    });
    created++;
  }

  console.log(`  ✅ ${created} cuentas creadas, ${skipped} actualizadas`);
}

// ============================================================================
// 4. CUENTAS BANCARIAS ROVIDA + VIRODA
// ============================================================================

async function seedBankAccountsFiliales() {
  console.log('\n🏦 4. Registrando cuentas bancarias de Rovida y Viroda...');

  const filiales = [
    {
      hint: 'Rovida',
      cuentas: [
        { entidad: 'Bankinter', iban: 'ES5601280250590100083954', alias: 'Bankinter Rovida', saldo: 0 },
        { entidad: 'BBVA', iban: 'ES2301820496680201728339', alias: 'BBVA Rovida', saldo: 0 },
      ],
    },
    {
      hint: 'Viroda',
      cuentas: [
        { entidad: 'BBVA', iban: 'ES5301820496610201744438', alias: 'BBVA Viroda', saldo: 0 },
        { entidad: 'Bankinter', iban: 'ES8801280250590100081826', alias: 'Bankinter Viroda', saldo: 0 },
      ],
    },
  ];

  for (const filial of filiales) {
    const company = await findCompany(filial.hint);
    if (!company) {
      console.log(`  ⚠️ ${filial.hint} no encontrada`);
      continue;
    }

    for (const c of filial.cuentas) {
      const existing = await prisma.financialAccount.findFirst({
        where: { companyId: company.id, numeroCuenta: c.iban },
      });
      if (existing) continue;

      await prisma.financialAccount.create({
        data: {
          companyId: company.id,
          entidad: c.entidad,
          tipoEntidad: 'banca_comercial',
          numeroCuenta: c.iban,
          alias: c.alias,
          divisa: 'EUR',
          saldoActual: c.saldo,
          valorMercado: 0,
          conexionTipo: 'psd2',
          activa: true,
          apiConfig: {},
        },
      });
      console.log(`  ✅ ${c.alias} creada`);
    }
  }
}

// ============================================================================
// 5. TOP POSICIONES FINANCIERAS (LP) DE VIDARO
// ============================================================================

async function seedFinancialPositions(vidaroId: string) {
  console.log('\n📊 5. Cargando posiciones financieras LP de Vidaro...');

  // Top 30 posiciones por saldo (extraídas de contabilidad)
  const posiciones = [
    { isin: 'ES0110053008', nombre: 'Bankinter Ahorro RF FI', valor: 1715890, tipo: 'fondo' },
    { isin: 'LU1819949089', nombre: 'BNP Paribas Sust Enhanced Bond 12M', valor: 1711097, tipo: 'fondo' },
    { isin: 'ES0109260531', nombre: 'Amper S.A. (acciones)', valor: 1574949, tipo: 'accion' },
    { isin: 'LU0335987698', nombre: 'Eurizon Fund Bond EUR Medium Z', valor: 1315971, tipo: 'fondo' },
    { isin: 'LU0360483100', nombre: 'Morgan Stanley Euro Corp Bond Z', valor: 1071479, tipo: 'fondo' },
    { isin: 'LU0094219127', nombre: 'BNPP Insticash EUR Short Term', valor: 1017542, tipo: 'fondo' },
    { isin: 'IE00BJCXFM61', nombre: 'Muzinich Global Short Duration IG', valor: 817840, tipo: 'fondo' },
    { isin: 'LU0128494944', nombre: 'Pictet Short-Term Money Market EUR', valor: 781082, tipo: 'fondo' },
    { isin: 'LU0996177720', nombre: 'Amundi Index S&P 500 IE', valor: 683349, tipo: 'etf' },
    { isin: 'IE00B4L5Y983', nombre: 'iShares Core MSCI World', valor: 634983, tipo: 'etf' },
    { isin: 'LU0113258742', nombre: 'Schroder ISF Euro Corporate Bond C', valor: 648710, tipo: 'fondo' },
    { isin: 'CH0103326762', nombre: 'ZKB Gold ETF EUR Hedged', valor: 1099616, tipo: 'etf' },
    { isin: 'LU1111643711', nombre: 'ELEVA European Selection R', valor: 1084564, tipo: 'fondo' },
    { isin: 'LU2214500949', nombre: 'Eleva Lightman European Equity I', valor: 610940, tipo: 'fondo' },
    { isin: 'LU0274209237', nombre: 'db x-trackers MSCI Europe TRN', valor: 1197457, tipo: 'etf' },
    { isin: 'IE00BM8QS764', nombre: 'Pacific North/South EM Equity', valor: 610159, tipo: 'fondo' },
    { isin: 'LU1965309831', nombre: 'Redwheel Next Gen EM Equity B', valor: 613935, tipo: 'fondo' },
    { isin: 'FR0013289535', nombre: 'BDL Convictions I', valor: 519339, tipo: 'fondo' },
    { isin: 'LU1330191385', nombre: 'Magallanes European Equity I', valor: 615496, tipo: 'fondo' },
    { isin: 'IE00B579F325', nombre: 'Invesco Physical Gold', valor: 262108, tipo: 'etf' },
    { isin: 'LU1425270227', nombre: 'JB Multipartner Gold Equity C', valor: 340949, tipo: 'fondo' },
    { isin: 'IE00BVYPNZ31', nombre: 'Guinness Global Equity Income Y', valor: 713086, tipo: 'fondo' },
    { isin: 'LU2225826366', nombre: 'EdR Fund Big Data P', valor: 716725, tipo: 'fondo' },
    { isin: 'LU1793346666', nombre: 'Bluebox Global Technology I', valor: 483604, tipo: 'fondo' },
    { isin: 'IE00B2NN6563', nombre: 'Brown Advisory US Equity Growth', valor: 124099, tipo: 'fondo' },
    { isin: 'IE000B4WLVU3', nombre: 'Polar Capital Japan Value I', valor: 470487, tipo: 'fondo' },
    { isin: 'IE00B83XD802', nombre: 'Hermes Asia ex Japan Equity F', valor: 603034, tipo: 'fondo' },
    { isin: 'LU0326949186', nombre: 'Schroder Asian Total Return C', valor: 893298, tipo: 'fondo' },
    { isin: 'LU0861897394', nombre: 'Abante Spanish Opportunities A', valor: 549223, tipo: 'fondo' },
    { isin: 'ES0167211004', nombre: 'Okavango Delta I', valor: 312402, tipo: 'fondo' },
  ];

  // Find or create Inversis account as default
  let account = await prisma.financialAccount.findFirst({
    where: { companyId: vidaroId, alias: { contains: 'Inversis' } },
  });

  if (!account) {
    console.log('  ⚠️ No se encontró cuenta Inversis, saltando posiciones');
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const p of posiciones) {
    const existing = await prisma.financialPosition.findFirst({
      where: { accountId: account.id, isin: p.isin },
    });

    if (existing) {
      await prisma.financialPosition.update({
        where: { id: existing.id },
        data: { valorActual: p.valor },
      });
      skipped++;
      continue;
    }

    await prisma.financialPosition.create({
      data: {
        accountId: account.id,
        isin: p.isin,
        nombre: p.nombre,
        tipo: p.tipo,
        cantidad: 0,
        precioCompra: 0,
        costeTotal: 0,
        precioActual: 0,
        valorActual: p.valor,
        divisa: 'EUR',
        pnlNoRealizado: 0,
        pnlRealizado: 0,
      },
    });
    created++;
  }

  console.log(`  ✅ ${created} posiciones creadas, ${skipped} actualizadas`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 Seed Maestro: Datos del Grupo Vidaro\n');
  console.log('   Fuente: Contabilidad 2025 + Reporting MdF');

  // Find Vidaro
  const vidaro = await findCompany('Vidaro');
  if (!vidaro) {
    console.error('❌ Vidaro no encontrada en BD');
    process.exit(1);
  }
  console.log(`   Vidaro: ${vidaro.nombre} (${vidaro.id})\n`);

  // 1. VIBLA SCR
  await seedVibla(vidaro.id);

  // 2. Participadas
  await seedParticipadas(vidaro.id);

  // 3. Cuentas bancarias Vidaro
  await seedBankAccounts(vidaro.id);

  // 4. Cuentas bancarias filiales
  await seedBankAccountsFiliales();

  // 5. Posiciones financieras
  await seedFinancialPositions(vidaro.id);

  // Summary
  const stats = await Promise.all([
    prisma.participation.count({ where: { companyId: vidaro.id } }),
    prisma.financialAccount.count({ where: { companyId: vidaro.id } }),
    prisma.financialPosition.count(),
    prisma.company.count({ where: { parentCompanyId: vidaro.id } }),
  ]);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  RESUMEN FINAL`);
  console.log(`  Participaciones Vidaro: ${stats[0]}`);
  console.log(`  Cuentas bancarias Vidaro: ${stats[1]}`);
  console.log(`  Posiciones financieras: ${stats[2]}`);
  console.log(`  Empresas filiales: ${stats[3]}`);
  console.log(`${'═'.repeat(60)}`);
  console.log('\n✅ Seed maestro completado.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
