#!/usr/bin/env ts-node
/**
 * SCRIPT: Crear usuarios de prueba para todos los perfiles
 * 
 * Crea usuarios para cada combinación de:
 * - Rol (super_admin, administrador, gestor, operador, soporte, community_manager)
 * - Vertical de negocio (alquiler_tradicional, str_vacacional, coliving, etc.)
 * - Nivel de experiencia (principiante, intermedio, avanzado)
 * 
 * Uso:
 *   npx ts-node scripts/create-test-users-profiles.ts
 *   npx tsx scripts/create-test-users-profiles.ts
 */

import { UserRole, BusinessVertical } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getPrismaClient } from '../lib/db';

const prisma = getPrismaClient();

type ExperienceLevel = 'principiante' | 'intermedio' | 'avanzado';

interface TestUserConfig {
  email: string;
  name: string;
  role: UserRole;
  vertical: BusinessVertical;
  experience: ExperienceLevel;
  companyName: string;
}

// Password común para todos los usuarios de test
const TEST_PASSWORD = 'Test123456!';

// ===================================
// DEFINICIÓN DE USUARIOS DE PRUEBA
// ===================================

const TEST_USERS: TestUserConfig[] = [
  // ===== SUPER ADMIN =====
  {
    email: 'superadmin@inmova.app',
    name: 'Super Admin Test',
    role: 'super_admin',
    vertical: 'mixto',
    experience: 'avanzado',
    companyName: 'INMOVA Platform'
  },

  // ===== ADMINISTRADORES (uno por vertical principal) =====
  {
    email: 'admin.alquiler@inmova.app',
    name: 'Admin Alquiler Tradicional',
    role: 'administrador',
    vertical: 'alquiler_tradicional',
    experience: 'intermedio',
    companyName: 'Gestora Inmobiliaria Test'
  },
  {
    email: 'admin.str@inmova.app',
    name: 'Admin STR Vacacional',
    role: 'administrador',
    vertical: 'str_vacacional',
    experience: 'avanzado',
    companyName: 'Vacational Homes SL'
  },
  {
    email: 'admin.coliving@inmova.app',
    name: 'Admin Coliving',
    role: 'administrador',
    vertical: 'coliving',
    experience: 'intermedio',
    companyName: 'Urban Coliving Madrid'
  },
  {
    email: 'admin.construccion@inmova.app',
    name: 'Admin Construcción',
    role: 'administrador',
    vertical: 'construccion',
    experience: 'avanzado',
    companyName: 'Constructora Inmova SA'
  },
  {
    email: 'admin.flipping@inmova.app',
    name: 'Admin House Flipping',
    role: 'administrador',
    vertical: 'flipping',
    experience: 'avanzado',
    companyName: 'Inversiones Inmobiliarias 360'
  },

  // ===== GESTORES (diferentes experiencias) =====
  {
    email: 'gestor.principiante@inmova.app',
    name: 'Gestor Principiante',
    role: 'gestor',
    vertical: 'alquiler_tradicional',
    experience: 'principiante',
    companyName: 'Mi Primera Gestora'
  },
  {
    email: 'gestor.intermedio@inmova.app',
    name: 'Gestor Intermedio',
    role: 'gestor',
    vertical: 'alquiler_tradicional',
    experience: 'intermedio',
    companyName: 'Gestora Profesional SL'
  },
  {
    email: 'gestor.avanzado@inmova.app',
    name: 'Gestor Avanzado',
    role: 'gestor',
    vertical: 'alquiler_tradicional',
    experience: 'avanzado',
    companyName: 'Gestora Experta 360'
  },
  {
    email: 'gestor.str@inmova.app',
    name: 'Gestor STR',
    role: 'gestor',
    vertical: 'str_vacacional',
    experience: 'intermedio',
    companyName: 'STR Management Pro'
  },
  {
    email: 'gestor.coliving@inmova.app',
    name: 'Gestor Coliving',
    role: 'gestor',
    vertical: 'coliving',
    experience: 'intermedio',
    companyName: 'Coliving Spaces BCN'
  },

  // ===== OPERADORES =====
  {
    email: 'operador.mantenimiento@inmova.app',
    name: 'Operador Mantenimiento',
    role: 'operador',
    vertical: 'alquiler_tradicional',
    experience: 'principiante',
    companyName: 'Gestora Profesional SL'
  },
  {
    email: 'operador.inspecciones@inmova.app',
    name: 'Operador Inspecciones',
    role: 'operador',
    vertical: 'str_vacacional',
    experience: 'intermedio',
    companyName: 'STR Management Pro'
  },

  // ===== SOPORTE =====
  {
    email: 'soporte.atencion@inmova.app',
    name: 'Agente de Soporte',
    role: 'soporte',
    vertical: 'alquiler_tradicional',
    experience: 'principiante',
    companyName: 'Gestora Profesional SL'
  },
  {
    email: 'soporte.tickets@inmova.app',
    name: 'Soporte Tickets',
    role: 'soporte',
    vertical: 'coliving',
    experience: 'intermedio',
    companyName: 'Coliving Spaces BCN'
  },

  // ===== COMMUNITY MANAGERS =====
  {
    email: 'cm.comunidades@inmova.app',
    name: 'Community Manager',
    role: 'community_manager',
    vertical: 'comunidades',
    experience: 'intermedio',
    companyName: 'Administrador de Fincas Madrid'
  },
  {
    email: 'cm.juntas@inmova.app',
    name: 'Gestor de Juntas',
    role: 'community_manager',
    vertical: 'comunidades',
    experience: 'avanzado',
    companyName: 'Fincas Gestion Total'
  },

  // ===== CASOS ESPECIALES =====
  {
    email: 'gestor.mixto@inmova.app',
    name: 'Gestor Multi-Vertical',
    role: 'gestor',
    vertical: 'mixto',
    experience: 'avanzado',
    companyName: 'Gestora 360 Integral'
  },
  {
    email: 'admin.servicios@inmova.app',
    name: 'Admin Servicios Profesionales',
    role: 'administrador',
    vertical: 'servicios_profesionales',
    experience: 'avanzado',
    companyName: 'Arquitectura & Asesoría'
  }
];

// ===================================
// FUNCIONES AUXILIARES
// ===================================

async function createCompany(name: string, vertical: BusinessVertical) {
  try {
    // Verificar si ya existe
    const existing = await prisma.company.findFirst({
      where: { name }
    });

    if (existing) {
      console.log(`  ↪ Empresa "${name}" ya existe, reutilizando...`);
      return existing;
    }

    // Crear nueva empresa
    const company = await prisma.company.create({
      data: {
        name,
        businessVertical: vertical,
        activo: true,
        onboardingCompleted: false,
        configuracionInicial: {
          setupStep: 'pending',
          preferredModules: []
        }
      }
    });

    console.log(`  ✅ Empresa "${name}" creada`);
    return company;
  } catch (error: any) {
    console.error(`  ❌ Error creando empresa "${name}":`, error.message);
    throw error;
  }
}

async function createUser(config: TestUserConfig) {
  try {
    console.log(`\n📝 Creando usuario: ${config.email}`);
    
    // 1. Crear/obtener empresa
    console.log(`  📁 Verificando empresa: ${config.companyName}`);
    const company = await createCompany(config.companyName, config.vertical);

    // 2. Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: config.email }
    });

    if (existingUser) {
      console.log(`  ⚠️ Usuario ya existe: ${config.email}`);
      
      // Actualizar datos si es necesario
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: config.role,
          companyId: company.id,
          activo: true,
          onboardingCompleted: false,
          preferences: {
            experienceLevel: config.experience,
            vertical: config.vertical
          }
        }
      });
      
      console.log(`  ✅ Usuario actualizado`);
      return existingUser;
    }

    // 3. Hashear password
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    // 4. Crear usuario
    const user = await prisma.user.create({
      data: {
        email: config.email,
        name: config.name,
        password: hashedPassword,
        role: config.role,
        companyId: company.id,
        activo: true,
        emailVerified: new Date(), // Pre-verificado para testing
        onboardingCompleted: false,
        onboardingCompletedAt: null,
        preferences: {
          experienceLevel: config.experience,
          vertical: config.vertical,
          theme: 'light',
          language: 'es'
        }
      }
    });

    console.log(`  ✅ Usuario creado: ${user.email}`);
    console.log(`     - Rol: ${user.role}`);
    console.log(`     - Empresa: ${company.name}`);
    console.log(`     - Vertical: ${config.vertical}`);
    console.log(`     - Experiencia: ${config.experience}`);
    
    return user;
  } catch (error: any) {
    console.error(`  ❌ Error creando usuario ${config.email}:`, error.message);
    throw error;
  }
}

// ===================================
// MAIN
// ===================================

async function main() {
  console.log('\n🚀 CREACIÓN DE USUARIOS DE PRUEBA - TODOS LOS PERFILES\n');
  console.log('=' .repeat(70));
  console.log('Password común para todos: Test123456!');
  console.log('=' .repeat(70));

  let successCount = 0;
  let errorCount = 0;

  for (const config of TEST_USERS) {
    try {
      await createUser(config);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`Error con ${config.email}:`, error);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE CREACIÓN');
  console.log('='.repeat(70));
  console.log(`✅ Usuarios creados/actualizados: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📋 Total intentados: ${TEST_USERS.length}`);

  console.log('\n📋 TABLA DE USUARIOS CREADOS:\n');
  console.log('| Email                              | Rol               | Vertical              | Experiencia  | Empresa                        |');
  console.log('|------------------------------------|-------------------|-----------------------|--------------|--------------------------------|');
  
  for (const config of TEST_USERS) {
    const email = config.email.padEnd(36);
    const role = config.role.padEnd(17);
    const vertical = config.vertical.padEnd(21);
    const exp = config.experience.padEnd(12);
    const company = config.companyName.padEnd(30);
    console.log(`| ${email} | ${role} | ${vertical} | ${exp} | ${company} |`);
  }

  console.log('\n✅ LISTO PARA PROBAR ONBOARDING\n');
  console.log('🔐 Credenciales de acceso:');
  console.log('   Email: <cualquiera de la tabla>');
  console.log('   Password: Test123456!\n');
  console.log('💡 Cada usuario verá un onboarding adaptado a:');
  console.log('   - Su rol (permisos y tareas relevantes)');
  console.log('   - Su vertical de negocio (workflow específico)');
  console.log('   - Su nivel de experiencia (tiempo, videos, tooltips)\n');
}

main()
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
