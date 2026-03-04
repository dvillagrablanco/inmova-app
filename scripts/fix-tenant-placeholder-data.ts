/**
 * Fix: Marcar inquilinos con datos placeholder/de desarrollo
 *
 * Problema detectado:
 * - Prácticamente todos los inquilinos tienen emails @viroda.inmova.local
 *   (dominio de desarrollo) y teléfonos "000000000".
 * - Estos son datos de prueba que no se limpiaron.
 *
 * Este script:
 * 1. Detecta inquilinos con emails de dominios de desarrollo
 * 2. Detecta inquilinos con teléfonos placeholder (000000000, 111111111, etc.)
 * 3. Marca los inquilinos como isDemo=true para excluirlos de estadísticas
 * 4. Opcionalmente, puede limpiar/eliminar datos de demo
 *
 * Uso:
 *   npx tsx scripts/fix-tenant-placeholder-data.ts              # Dry run (solo muestra)
 *   npx tsx scripts/fix-tenant-placeholder-data.ts --mark-demo  # Marca como isDemo=true
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const MARK_DEMO = process.argv.includes('--mark-demo');

// Dominios de desarrollo/test que no son reales
const DEV_EMAIL_PATTERNS = [
  '.inmova.local',
  '@test.com',
  '@example.com',
  '@localhost',
  '@demo.',
  '@prueba.',
  '@fake.',
  '@placeholder.',
];

// Teléfonos placeholder
const PLACEHOLDER_PHONES = [
  '000000000',
  '111111111',
  '123456789',
  '999999999',
  '000-000-000',
  '0000000000',
  '+00000000000',
];

async function main() {
  console.log('====================================================================');
  console.log('  FIX: DETECTAR Y MARCAR INQUILINOS CON DATOS PLACEHOLDER');
  console.log(`  Modo: ${MARK_DEMO ? 'MARCANDO COMO DEMO' : 'DRY RUN (solo muestra)'}`);
  console.log('====================================================================\n');

  // 1. Buscar inquilinos con emails de desarrollo
  const allTenants = await prisma.tenant.findMany({
    select: {
      id: true,
      nombreCompleto: true,
      email: true,
      telefono: true,
      isDemo: true,
      companyId: true,
    },
  });

  console.log(`Total inquilinos en BD: ${allTenants.length}\n`);

  const devEmailTenants: typeof allTenants = [];
  const placeholderPhoneTenants: typeof allTenants = [];
  const alreadyMarkedDemo: typeof allTenants = [];

  for (const tenant of allTenants) {
    if (tenant.isDemo) {
      alreadyMarkedDemo.push(tenant);
      continue;
    }

    const emailLower = tenant.email.toLowerCase();
    const hasDevEmail = DEV_EMAIL_PATTERNS.some(pattern => emailLower.includes(pattern));
    const hasPlaceholderPhone = PLACEHOLDER_PHONES.includes(tenant.telefono.replace(/\s+/g, ''));

    if (hasDevEmail) {
      devEmailTenants.push(tenant);
    }
    if (hasPlaceholderPhone && !hasDevEmail) {
      placeholderPhoneTenants.push(tenant);
    }
  }

  // 2. Mostrar resultados
  console.log(`Ya marcados como demo: ${alreadyMarkedDemo.length}`);
  console.log(`Emails de desarrollo detectados: ${devEmailTenants.length}`);
  console.log(`Teléfonos placeholder (sin email dev): ${placeholderPhoneTenants.length}`);
  console.log('');

  if (devEmailTenants.length > 0) {
    console.log('--- Inquilinos con emails de desarrollo ---');
    // Agrupar por dominio
    const byDomain = new Map<string, number>();
    for (const t of devEmailTenants) {
      const domain = t.email.split('@')[1] || 'desconocido';
      byDomain.set(domain, (byDomain.get(domain) || 0) + 1);
    }
    for (const [domain, count] of byDomain) {
      console.log(`  @${domain}: ${count} inquilinos`);
    }
    console.log('');

    // Mostrar primeros 10 como ejemplo
    console.log('  Ejemplos (primeros 10):');
    for (const t of devEmailTenants.slice(0, 10)) {
      console.log(`    ${t.nombreCompleto} | ${t.email} | Tel: ${t.telefono}`);
    }
    if (devEmailTenants.length > 10) {
      console.log(`    ... y ${devEmailTenants.length - 10} más`);
    }
    console.log('');
  }

  if (placeholderPhoneTenants.length > 0) {
    console.log('--- Inquilinos con teléfonos placeholder ---');
    for (const t of placeholderPhoneTenants.slice(0, 10)) {
      console.log(`  ${t.nombreCompleto} | ${t.email} | Tel: ${t.telefono}`);
    }
    if (placeholderPhoneTenants.length > 10) {
      console.log(`  ... y ${placeholderPhoneTenants.length - 10} más`);
    }
    console.log('');
  }

  // 3. Marcar como demo si se pide
  const toMark = [...devEmailTenants, ...placeholderPhoneTenants];

  if (toMark.length === 0) {
    console.log('No se encontraron inquilinos con datos placeholder.');
    await prisma.$disconnect();
    return;
  }

  if (MARK_DEMO) {
    console.log(`\nMarcando ${toMark.length} inquilinos como isDemo=true...`);
    
    const result = await prisma.tenant.updateMany({
      where: {
        id: { in: toMark.map(t => t.id) },
      },
      data: {
        isDemo: true,
      },
    });

    console.log(`✅ ${result.count} inquilinos marcados como demo.`);
    console.log('   Estos inquilinos se excluirán de las estadísticas principales.');
  }

  console.log('\n====================================================================');
  console.log('  RESUMEN');
  console.log('====================================================================');
  console.log(`  Total inquilinos: ${allTenants.length}`);
  console.log(`  Ya marcados demo: ${alreadyMarkedDemo.length}`);
  console.log(`  Detectados como placeholder: ${toMark.length}`);
  console.log(`    - Emails de desarrollo: ${devEmailTenants.length}`);
  console.log(`    - Teléfonos placeholder: ${placeholderPhoneTenants.length}`);

  if (!MARK_DEMO && toMark.length > 0) {
    console.log('\n  ⚠️  Esto fue un DRY RUN. Para marcar como demo:');
    console.log('     npx tsx scripts/fix-tenant-placeholder-data.ts --mark-demo');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
