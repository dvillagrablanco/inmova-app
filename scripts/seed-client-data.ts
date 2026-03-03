/**
 * Seed: Client data from DATOS_CLIENTES Excel files
 * 
 * Updates tenant records with real client data:
 * - NIF/DNI, email, teléfono
 * - IBAN, BIC
 * - Medio de pago
 * 
 * Run: npx tsx scripts/seed-client-data.ts [--execute]
 */

import { config } from 'dotenv';
config({ path: '.env.production' });

import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface ClientRow {
  subcuenta: string;
  nif: string;
  razonSocial: string;
  nombreComercial: string;
  email: string;
  telefono: string;
  personaContacto: string;
  activo: boolean;
  medioPago: string;
  iban: string;
  bic: string;
}

function parseClientExcel(filePath: string): ClientRow[] {
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️ File not found: ${filePath}`);
    return [];
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

  return rows.map((r: any) => ({
    subcuenta: String(r['SubCuenta'] || '').trim(),
    nif: String(r['NIF'] || '').trim(),
    razonSocial: String(r['Razón Social'] || '').trim(),
    nombreComercial: String(r['Nombre Comercial'] || '').trim(),
    email: String(r['E-Mail'] || '').trim(),
    telefono: String(r['Teléfono'] || '').trim(),
    personaContacto: String(r['Persona de Contacto'] || '').trim(),
    activo: String(r['Activo'] || '').toLowerCase() === 'sí',
    medioPago: String(r['Medio de Pago'] || '').trim(),
    iban: String(r['IBAN'] || '').trim(),
    bic: String(r['BIC'] || '').trim(),
  })).filter(c => c.nif && c.razonSocial);
}

async function main() {
  const dryRun = !process.argv.includes('--execute');
  console.log(dryRun ? '🔍 DRY RUN (use --execute to update DB)' : '⚡ EXECUTING');
  console.log('');

  const dataDir = path.join(process.cwd(), 'data', 'vidaro-files');

  // Parse both files
  const roviClients = parseClientExcel(path.join(dataDir, 'DATOS_CLIENTES_ROVIDA.xlsx'));
  const virClients = parseClientExcel(path.join(dataDir, 'DATOS_CLIENTES_VIRODA.xlsx'));

  console.log(`📊 Rovida clients: ${roviClients.length}`);
  console.log(`📊 Viroda clients: ${virClients.length}`);

  // Merge (deduplicate by NIF)
  const allClients = new Map<string, ClientRow>();
  for (const c of [...roviClients, ...virClients]) {
    if (!allClients.has(c.nif)) {
      allClients.set(c.nif, c);
    }
  }

  console.log(`📊 Unique clients (by NIF): ${allClients.size}\n`);

  // Stats
  const withEmail = [...allClients.values()].filter(c => c.email).length;
  const withPhone = [...allClients.values()].filter(c => c.telefono).length;
  const withIBAN = [...allClients.values()].filter(c => c.iban).length;

  console.log(`  📧 With email: ${withEmail}`);
  console.log(`  📱 With phone: ${withPhone}`);
  console.log(`  🏦 With IBAN: ${withIBAN}`);
  console.log('');

  if (dryRun) {
    // Show sample
    let count = 0;
    for (const [nif, c] of allClients) {
      if (count < 10) {
        console.log(`  ${c.nif} | ${c.razonSocial} | ${c.email || '-'} | ${c.telefono || '-'} | ${c.iban ? c.iban.substring(0, 10) + '...' : '-'}`);
        count++;
      }
    }
    if (allClients.size > 10) {
      console.log(`  ... y ${allClients.size - 10} más`);
    }
  } else {
    // Match with existing tenants by DNI/NIF and update
    let updated = 0;
    let notFound = 0;

    for (const [nif, client] of allClients) {
      // Try to find tenant by DNI
      const tenant = await prisma.tenant.findFirst({
        where: { dni: nif },
      });

      if (tenant) {
        const updateData: any = {};
        if (client.email && !tenant.email) updateData.email = client.email;
        if (client.telefono && !tenant.telefono) updateData.telefono = client.telefono;
        if (client.iban && !tenant.iban) updateData.iban = client.iban;
        if (client.bic && !tenant.bic) updateData.bic = client.bic;
        if (client.medioPago && !tenant.metodoPago) updateData.metodoPago = client.medioPago;

        if (Object.keys(updateData).length > 0) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: updateData,
          });
          updated++;
          console.log(`  ✅ Updated ${client.razonSocial} (${nif}): ${Object.keys(updateData).join(', ')}`);
        }
      } else {
        notFound++;
      }
    }

    console.log(`\n📊 Results: ${updated} updated, ${notFound} not matched in DB`);
  }

  await prisma.$disconnect();
  console.log('\n✅ Done');
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
