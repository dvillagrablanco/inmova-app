/**
 * Setup: Vincular cuentas bancarias del grupo con Nordigen/GoCardless Bank Account Data
 *
 * Prepara las cuentas bancarias existentes con los institution IDs de Nordigen
 * para que al autorizar via PSD2, la sincronización sea automática.
 *
 * Bancos soportados por Nordigen PSD2 (España):
 * - Bankinter: BANKINTER_BKBKESMMXXX
 * - BBVA: BBVA_BBVAESMMXXX  
 * - Santander: SANTANDER_ES_BSCHESMMXXX
 * - CaixaBank: CAIXABANK_CAIXESBBXXX
 *
 * NO soportados (requieren SWIFT/PDF):
 * - Banca March, Inversis, Pictet, CACEIS, UBS, AndBank, BBVA Suiza
 *
 * Uso: npx tsx scripts/setup-nordigen-accounts.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const NORDIGEN_INSTITUTIONS: Record<string, {
  institutionId: string;
  bic: string;
  name: string;
  psd2: boolean;
}> = {
  'Bankinter': { institutionId: 'BANKINTER_BKBKESMMXXX', bic: 'BKBKESMMXXX', name: 'Bankinter', psd2: true },
  'BBVA': { institutionId: 'BBVA_BBVAESMMXXX', bic: 'BBVAESMMXXX', name: 'BBVA', psd2: true },
  'Banco Santander': { institutionId: 'SANTANDER_ES_BSCHESMMXXX', bic: 'BSCHESMMXXX', name: 'Banco Santander', psd2: true },
  'CaixaBank': { institutionId: 'CAIXABANK_CAIXESBBXXX', bic: 'CAIXESBBXXX', name: 'CaixaBank', psd2: true },
  // Not PSD2
  'Banca March': { institutionId: '', bic: 'BMARES2MXXX', name: 'Banca March', psd2: false },
  'Inversis': { institutionId: '', bic: 'INVLESMMXXX', name: 'Inversis', psd2: false },
  'Pictet': { institutionId: '', bic: 'PICTCHGGXXX', name: 'Pictet & Cie', psd2: false },
  'CACEIS': { institutionId: '', bic: 'CACABORJXXX', name: 'CACEIS Bank', psd2: false },
  'UBS': { institutionId: '', bic: 'UBSWCHZH80A', name: 'UBS', psd2: false },
  'AndBank': { institutionId: '', bic: '', name: 'AndBank', psd2: false },
  'BBVA Suiza': { institutionId: '', bic: '', name: 'BBVA Suiza', psd2: false },
  'Bankinter Luxemburgo': { institutionId: '', bic: '', name: 'Bankinter Luxemburgo', psd2: false },
};

async function main() {
  console.log('🔗 Setup Nordigen/GoCardless Bank Account Data\n');

  // Check Nordigen config
  const secretId = process.env.NORDIGEN_SECRET_ID;
  const secretKey = process.env.NORDIGEN_SECRET_KEY;
  console.log(`  Nordigen SECRET_ID: ${secretId ? '✅ configurado' : '❌ FALTA'}`);
  console.log(`  Nordigen SECRET_KEY: ${secretKey ? '✅ configurado' : '❌ FALTA'}`);

  // List all financial accounts
  const accounts = await prisma.financialAccount.findMany({
    where: { activa: true },
    include: { company: { select: { nombre: true } } },
  });

  console.log(`\n  Cuentas bancarias activas: ${accounts.length}\n`);

  let psd2Ready = 0;
  let swiftOnly = 0;
  let updated = 0;

  for (const account of accounts) {
    const entidad = account.entidad;

    // Find matching Nordigen institution
    let match = NORDIGEN_INSTITUTIONS[entidad];
    if (!match) {
      // Try partial match
      for (const [key, inst] of Object.entries(NORDIGEN_INSTITUTIONS)) {
        if (entidad.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
          match = inst;
          break;
        }
      }
    }

    if (!match) {
      console.log(`  ⚠️ ${entidad} (${account.alias}): sin configuración Nordigen`);
      continue;
    }

    // Update apiConfig with Nordigen data
    const currentConfig = (account.apiConfig as Record<string, unknown>) || {};
    const newConfig = {
      ...currentConfig,
      nordigenInstitutionId: match.institutionId || null,
      swiftBIC: match.bic || null,
      psd2Supported: match.psd2,
      nordigenName: match.name,
    };

    // Update connection type
    const newConexionTipo = match.psd2 ? 'psd2' : 'swift';

    await prisma.financialAccount.update({
      where: { id: account.id },
      data: {
        conexionTipo: newConexionTipo,
        apiConfig: newConfig,
      },
    });

    if (match.psd2) {
      psd2Ready++;
      console.log(`  ✅ ${entidad} (${account.alias}): PSD2 ready → ${match.institutionId}`);
    } else {
      swiftOnly++;
      console.log(`  📄 ${entidad} (${account.alias}): SWIFT/manual → ${match.bic}`);
    }
    updated++;
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  Actualizadas: ${updated}`);
  console.log(`  PSD2 ready: ${psd2Ready} (requieren autorización del titular)`);
  console.log(`  SWIFT/manual: ${swiftOnly}`);
  console.log(`${'─'.repeat(50)}`);

  if (!secretId || !secretKey) {
    console.log(`\n⚠️  IMPORTANTE: Para activar PSD2, configura en .env.production:`);
    console.log(`  NORDIGEN_SECRET_ID=<tu_secret_id>`);
    console.log(`  NORDIGEN_SECRET_KEY=<tu_secret_key>`);
    console.log(`  Obtener en: https://bankaccountdata.gocardless.com/user-secrets/`);
    console.log(`\n  Una vez configurado, el DF puede autorizar cada banco desde:`);
    console.log(`  https://inmovaapp.com/family-office/cuentas → Conectar banco`);
  } else {
    console.log(`\n✅ Nordigen configurado. Listo para autorizar bancos.`);
  }

  console.log('\n✅ Setup completado.');
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
