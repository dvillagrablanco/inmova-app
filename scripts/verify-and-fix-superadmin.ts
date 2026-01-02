#!/usr/bin/env ts-node

/**
 * Script para verificar y corregir credenciales de superadministrador
 * 
 * Credenciales:
 * - Email: admin@inmova.app
 * - Password: Admin123!
 * 
 * Este script asegura que:
 * 1. El superadmin existe
 * 2. Tiene la contraseña correcta (hasheada con bcrypt)
 * 3. Está activo
 * 4. Tiene el rol correcto (SUPERADMIN)
 * 5. Tiene una companyId válida
 */

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SUPERADMIN_CREDENTIALS = {
  email: 'admin@inmova.app',
  password: 'Admin123!', // Plain text - se hasheará
  name: 'Administrador Principal',
  role: 'SUPERADMIN' as UserRole,
};

const TEST_CREDENTIALS = {
  email: 'test@inmova.app',
  password: 'Test123456!',
  name: 'Usuario de Prueba',
  role: 'ADMIN' as UserRole,
};

async function main() {
  console.log('🔧 Verificando y corrigiendo credenciales de superadministrador...\n');

  try {
    // 1. Verificar/crear compañía principal
    console.log('1️⃣ Verificando compañía principal...');
    let company = await prisma.company.findFirst({
      where: { nombre: 'Inmova Principal' },
    });

    if (!company) {
      console.log('  📝 Creando compañía principal...');
      company = await prisma.company.create({
        data: {
          nombre: 'Inmova Principal',
          nif: 'B12345678',
          activo: true,
          plan: 'ENTERPRISE',
        },
      });
      console.log(`  ✅ Compañía creada: ${company.nombre} (ID: ${company.id})`);
    } else {
      console.log(`  ✅ Compañía existe: ${company.nombre} (ID: ${company.id})`);
    }

    // 2. Verificar/crear superadmin
    console.log('\n2️⃣ Verificando superadministrador...');
    let superAdmin = await prisma.user.findUnique({
      where: { email: SUPERADMIN_CREDENTIALS.email },
      include: { company: true },
    });

    const hashedPassword = await bcrypt.hash(SUPERADMIN_CREDENTIALS.password, 10);

    if (!superAdmin) {
      console.log('  📝 Creando superadministrador...');
      superAdmin = await prisma.user.create({
        data: {
          email: SUPERADMIN_CREDENTIALS.email,
          password: hashedPassword,
          name: SUPERADMIN_CREDENTIALS.name,
          role: SUPERADMIN_CREDENTIALS.role,
          companyId: company.id,
          activo: true,
          emailVerified: new Date(),
        },
        include: { company: true },
      });
      console.log(`  ✅ Superadmin creado: ${superAdmin.email}`);
    } else {
      console.log('  ♻️  Actualizando superadministrador...');
      superAdmin = await prisma.user.update({
        where: { id: superAdmin.id },
        data: {
          password: hashedPassword,
          name: SUPERADMIN_CREDENTIALS.name,
          role: SUPERADMIN_CREDENTIALS.role,
          companyId: company.id,
          activo: true,
          emailVerified: new Date(),
        },
        include: { company: true },
      });
      console.log(`  ✅ Superadmin actualizado: ${superAdmin.email}`);
    }

    // 3. Verificar/crear usuario de prueba
    console.log('\n3️⃣ Verificando usuario de prueba...');
    let testUser = await prisma.user.findUnique({
      where: { email: TEST_CREDENTIALS.email },
    });

    const hashedTestPassword = await bcrypt.hash(TEST_CREDENTIALS.password, 10);

    if (!testUser) {
      console.log('  📝 Creando usuario de prueba...');
      testUser = await prisma.user.create({
        data: {
          email: TEST_CREDENTIALS.email,
          password: hashedTestPassword,
          name: TEST_CREDENTIALS.name,
          role: TEST_CREDENTIALS.role,
          companyId: company.id,
          activo: true,
          emailVerified: new Date(),
        },
      });
      console.log(`  ✅ Usuario de prueba creado: ${testUser.email}`);
    } else {
      console.log('  ♻️  Actualizando usuario de prueba...');
      testUser = await prisma.user.update({
        where: { id: testUser.id },
        data: {
          password: hashedTestPassword,
          name: TEST_CREDENTIALS.name,
          role: TEST_CREDENTIALS.role,
          companyId: company.id,
          activo: true,
          emailVerified: new Date(),
        },
      });
      console.log(`  ✅ Usuario de prueba actualizado: ${testUser.email}`);
    }

    // 4. Verificar que las contraseñas funcionan
    console.log('\n4️⃣ Verificando contraseñas...');
    
    const superAdminPasswordWorks = await bcrypt.compare(
      SUPERADMIN_CREDENTIALS.password,
      superAdmin.password!
    );
    console.log(`  Superadmin password: ${superAdminPasswordWorks ? '✅ OK' : '❌ ERROR'}`);

    const testUserPasswordWorks = await bcrypt.compare(
      TEST_CREDENTIALS.password,
      testUser.password!
    );
    console.log(`  Test user password: ${testUserPasswordWorks ? '✅ OK' : '❌ ERROR'}`);

    // 5. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('✅ CREDENCIALES VERIFICADAS Y CORREGIDAS');
    console.log('='.repeat(60));
    console.log('\n📋 CREDENCIALES DE ACCESO:\n');
    
    console.log('🔐 SUPERADMINISTRADOR:');
    console.log(`   Email: ${SUPERADMIN_CREDENTIALS.email}`);
    console.log(`   Password: ${SUPERADMIN_CREDENTIALS.password}`);
    console.log(`   Rol: ${superAdmin.role}`);
    console.log(`   Estado: ${superAdmin.activo ? 'Activo ✅' : 'Inactivo ❌'}`);
    console.log(`   Compañía: ${superAdmin.company.nombre}`);

    console.log('\n🧪 USUARIO DE PRUEBA:');
    console.log(`   Email: ${TEST_CREDENTIALS.email}`);
    console.log(`   Password: ${TEST_CREDENTIALS.password}`);
    console.log(`   Rol: ${testUser.role}`);
    console.log(`   Estado: ${testUser.activo ? 'Activo ✅' : 'Inactivo ❌'}`);

    console.log('\n🌐 URLs DE PRUEBA:');
    console.log('   http://157.180.119.236/login');
    console.log('   https://inmovaapp.com/login');

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
