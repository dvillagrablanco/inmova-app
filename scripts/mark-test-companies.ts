/**
 * Script para marcar empresas ficticias/de prueba
 * 
 * Identifica empresas de prueba por patrones conocidos y las marca
 * para excluirlas de las analíticas.
 * 
 * Uso: npx tsx scripts/mark-test-companies.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Patrones que identifican empresas de prueba
const TEST_PATTERNS = [
  /^test$/i,
  /^prueba$/i,
  /^demo$/i,
  /^ejemplo$/i,
  /^sample$/i,
  /^fictici[ao]/i,
  /^fake/i,
  /inmobiliaria garcía/i, // Datos mock específicos
  /gestiones martínez/i,
  /alquileres premium/i,
  /pisos centro madrid/i,
  /empresa de prueba/i,
  /company test/i,
  /dev company/i,
  /staging company/i,
  /localhost/i,
];

// Emails de prueba conocidos
const TEST_EMAIL_PATTERNS = [
  /test@/i,
  /prueba@/i,
  /demo@/i,
  /fake@/i,
  /example\./i,
  /@example\./i,
  /mailinator/i,
  /tempmail/i,
  /guerrillamail/i,
  /yopmail/i,
  /test\.com$/i,
  /@localhost/i,
];

// IDs de empresas específicas a marcar como prueba (si se conocen)
const KNOWN_TEST_COMPANY_IDS: string[] = [
  // Agregar IDs específicos si se conocen
];

async function main() {
  console.log('🔍 Buscando empresas de prueba...\n');

  // Obtener todas las empresas
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      emailContacto: true,
      estadoCliente: true,
      esEmpresaPrueba: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          buildings: true,
          tenants: true,
        },
      },
    },
  });

  console.log(`📊 Total de empresas: ${companies.length}\n`);

  const testCompanies: typeof companies = [];
  const alreadyMarked: typeof companies = [];

  for (const company of companies) {
    // Ya marcada como prueba
    if (company.esEmpresaPrueba) {
      alreadyMarked.push(company);
      continue;
    }

    // Verificar si es empresa de prueba
    let isTest = false;
    let reason = '';

    // Verificar por ID conocido
    if (KNOWN_TEST_COMPANY_IDS.includes(company.id)) {
      isTest = true;
      reason = 'ID conocido como prueba';
    }

    // Verificar por nombre
    if (!isTest && company.nombre) {
      for (const pattern of TEST_PATTERNS) {
        if (pattern.test(company.nombre)) {
          isTest = true;
          reason = `Nombre coincide con patrón: ${pattern}`;
          break;
        }
      }
    }

    // Verificar por email
    if (!isTest) {
      const emailsToCheck = [company.email, company.emailContacto].filter(Boolean);
      for (const email of emailsToCheck) {
        for (const pattern of TEST_EMAIL_PATTERNS) {
          if (email && pattern.test(email)) {
            isTest = true;
            reason = `Email coincide con patrón: ${pattern}`;
            break;
          }
        }
        if (isTest) break;
      }
    }

    // Verificar por estadoCliente = 'prueba'
    if (!isTest && company.estadoCliente === 'prueba') {
      isTest = true;
      reason = 'Estado cliente = prueba';
    }

    if (isTest) {
      testCompanies.push(company);
      console.log(`⚠️  Empresa de prueba detectada: "${company.nombre}" (${company.id})`);
      console.log(`   Razón: ${reason}`);
      console.log(`   Email: ${company.email || company.emailContacto || 'N/A'}`);
      console.log(`   Usuarios: ${company._count.users}, Edificios: ${company._count.buildings}, Inquilinos: ${company._count.tenants}`);
      console.log('');
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`   Total empresas: ${companies.length}`);
  console.log(`   Ya marcadas como prueba: ${alreadyMarked.length}`);
  console.log(`   Detectadas como prueba: ${testCompanies.length}`);
  console.log(`   Empresas reales: ${companies.length - alreadyMarked.length - testCompanies.length}`);

  if (testCompanies.length === 0) {
    console.log('\n✅ No se encontraron empresas de prueba sin marcar.');
    return;
  }

  // Preguntar confirmación (en ambiente no interactivo, marcar automáticamente)
  const args = process.argv.slice(2);
  const autoConfirm = args.includes('--yes') || args.includes('-y');

  if (!autoConfirm) {
    console.log('\n❓ ¿Desea marcar estas empresas como prueba? (usar --yes para confirmar automáticamente)');
    console.log('   Ejecute: npx tsx scripts/mark-test-companies.ts --yes');
    return;
  }

  // Marcar empresas como prueba
  console.log('\n🔄 Marcando empresas como prueba...');
  
  const result = await prisma.company.updateMany({
    where: {
      id: { in: testCompanies.map((c) => c.id) },
    },
    data: {
      esEmpresaPrueba: true,
    },
  });

  console.log(`\n✅ ${result.count} empresas marcadas como prueba.`);

  // También actualizar empresas con estadoCliente = 'prueba'
  const pruebaStateResult = await prisma.company.updateMany({
    where: {
      estadoCliente: 'prueba',
      esEmpresaPrueba: false,
    },
    data: {
      esEmpresaPrueba: true,
    },
  });

  if (pruebaStateResult.count > 0) {
    console.log(`✅ ${pruebaStateResult.count} empresas adicionales marcadas (estadoCliente = prueba).`);
  }

  console.log('\n🎉 Proceso completado. Las empresas de prueba han sido excluidas de las analíticas.');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
