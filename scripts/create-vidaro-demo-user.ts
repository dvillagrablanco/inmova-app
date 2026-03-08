/**
 * Script: Crear usuario DEMO para presentación al equipo Grupo Vidaro
 * 
 * Crea un usuario administrador con acceso a las 3 sociedades del grupo,
 * configurado para mostrar todas las funcionalidades de INMOVA en modo demo.
 * 
 * Uso: npx tsx scripts/create-vidaro-demo-user.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@vidaroinversiones.com';
const DEMO_PASSWORD = 'VidaroDemo2026!';
const DEMO_NAME = 'Demo Vidaro';

async function main() {
  console.log('====================================================================');
  console.log('  🎯 CREAR USUARIO DEMO — PRESENTACIÓN GRUPO VIDARO');
  console.log('====================================================================\n');

  // 1. Buscar las empresas del grupo
  console.log('1. Buscando empresas del grupo Vidaro...\n');

  const vidaro = await prisma.company.findFirst({
    where: {
      OR: [
        { id: 'vidaro-inversiones' },
        { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
      ],
    },
  });

  if (!vidaro) {
    console.error('❌ Vidaro Inversiones no encontrada. Ejecuta primero: npx tsx scripts/setup-vidaro-group-access.ts');
    process.exit(1);
  }
  console.log(`   ✅ Vidaro Inversiones: ${vidaro.id} (${vidaro.nombre})`);

  const rovida = await prisma.company.findFirst({
    where: {
      OR: [
        { id: 'rovida-sl' },
        { id: 'rovida-gestion' },
        { nombre: { contains: 'Rovida', mode: 'insensitive' } },
      ],
    },
  });

  const viroda = await prisma.company.findFirst({
    where: {
      OR: [
        { id: 'viroda-inversiones' },
        { nombre: { contains: 'Viroda', mode: 'insensitive' } },
      ],
    },
  });

  if (rovida) console.log(`   ✅ Rovida: ${rovida.id} (${rovida.nombre})`);
  if (viroda) console.log(`   ✅ Viroda: ${viroda.id} (${viroda.nombre})`);

  // 2. Crear o actualizar usuario demo
  console.log('\n2. Creando usuario demo...\n');

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  let user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
  });

  if (user) {
    user = await prisma.user.update({
      where: { email: DEMO_EMAIL },
      data: {
        name: DEMO_NAME,
        password: hashedPassword,
        role: 'administrador',
        companyId: vidaro.id,
        activo: true,
        businessVertical: 'mixto',
        uiMode: 'advanced',
        experienceLevel: 'avanzado',
        onboardingCompleted: false,
        hasCompletedOnboarding: false,
        preferredModules: [], // Vacío = todos activos
        hiddenModules: [],
      },
    });
    console.log(`   🔄 Usuario actualizado: ${user.email}`);
  } else {
    user = await prisma.user.create({
      data: {
        email: DEMO_EMAIL,
        name: DEMO_NAME,
        password: hashedPassword,
        role: 'administrador',
        companyId: vidaro.id,
        activo: true,
        businessVertical: 'mixto',
        uiMode: 'advanced',
        experienceLevel: 'avanzado',
        onboardingCompleted: false,
        hasCompletedOnboarding: false,
        preferredModules: [],
        hiddenModules: [],
      },
    });
    console.log(`   ✅ Usuario creado: ${user.email} (ID: ${user.id})`);
  }

  // 3. Configurar accesos multi-empresa
  console.log('\n3. Configurando accesos multi-empresa...\n');

  const companies = [
    { company: vidaro, label: 'Vidaro Inversiones (Holding)' },
    ...(rovida ? [{ company: rovida, label: 'Rovida S.L. (Patrimonial)' }] : []),
    ...(viroda ? [{ company: viroda, label: 'Viroda Inversiones (Residencial)' }] : []),
  ];

  for (const { company, label } of companies) {
    const existing = await prisma.userCompanyAccess.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: company.id,
        },
      },
    });

    if (existing) {
      await prisma.userCompanyAccess.update({
        where: { id: existing.id },
        data: { roleInCompany: 'administrador', activo: true },
      });
    } else {
      await prisma.userCompanyAccess.create({
        data: {
          userId: user.id,
          companyId: company.id,
          roleInCompany: 'administrador',
          activo: true,
          grantedBy: user.id,
        },
      });
    }
    console.log(`   ✅ Acceso: ${label}`);
  }

  // 4. Limpiar onboarding previo para que el tour se active
  console.log('\n4. Reseteando estado de onboarding...\n');

  try {
    await prisma.onboardingTask.deleteMany({
      where: { userId: user.id },
    });
    console.log('   ✅ Tareas de onboarding limpiadas');
  } catch {
    console.log('   ℹ️  Sin tareas previas');
  }

  try {
    await prisma.userOnboardingProgress.deleteMany({
      where: { userId: user.id },
    });
    console.log('   ✅ Progreso de onboarding reseteado');
  } catch {
    console.log('   ℹ️  Sin progreso previo');
  }

  // 5. Resumen final
  console.log('\n====================================================================');
  console.log('  🎉 USUARIO DEMO CREADO EXITOSAMENTE');
  console.log('====================================================================');
  console.log(`  📧 Email:    ${DEMO_EMAIL}`);
  console.log(`  🔑 Password: ${DEMO_PASSWORD}`);
  console.log(`  👤 Rol:      Administrador`);
  console.log(`  🏢 Holding:  ${vidaro.nombre}`);
  console.log(`  📊 Accesos:  ${companies.length} sociedades`);
  console.log(`  🎯 Modo:     Presentación (todos los módulos visibles)`);
  console.log('');
  console.log('  Al hacer login, se activará el Tour Demo de presentación');
  console.log('  que muestra todas las funcionalidades de INMOVA.');
  console.log('');
  console.log('  URL: https://inmovaapp.com/login');
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
