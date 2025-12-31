#!/usr/bin/env tsx
/**
 * Script completo para resolver problemas de autenticación
 * - Verifica usuarios existentes
 * - Actualiza passwords con bcrypt correcto
 * - Activa usuarios
 * - Verifica company association
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAuth() {
  console.log('🔧 FIX COMPLETO DE AUTENTICACIÓN\n');

  try {
    // 1. Verificar usuarios existentes
    console.log('1️⃣ Verificando usuarios existentes...');
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'admin@inmova.app' },
          { email: 'test@inmova.app' },
          { email: 'superadmin@inmova.com' },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activo: true,
        companyId: true,
      },
    });

    console.log(`   Encontrados: ${users.length} usuarios`);
    users.forEach((u) => {
      console.log(`   - ${u.email}: ${u.role}, activo: ${u.activo}, companyId: ${u.companyId || 'NULL'}`);
    });

    // 2. Asegurar que exista una company
    console.log('\n2️⃣ Verificando company...');
    let company = await prisma.company.findFirst();
    
    if (!company) {
      console.log('   📝 Creando company...');
      company = await prisma.company.create({
        data: {
          name: 'Inmova Default Company',
          slug: 'inmova-default',
          status: 'active',
        },
      });
      console.log(`   ✅ Company creada: ${company.id}`);
    } else {
      console.log(`   ✅ Company existe: ${company.id}`);
    }

    // 3. Crear/actualizar admin@inmova.app
    console.log('\n3️⃣ Configurando admin@inmova.app...');
    const adminPassword = 'Admin123!';
    const adminHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@inmova.app' },
      update: {
        password: adminHash,
        role: 'super_admin',
        activo: true,
        companyId: company.id,
      },
      create: {
        email: 'admin@inmova.app',
        name: 'Admin',
        password: adminHash,
        role: 'super_admin',
        activo: true,
        companyId: company.id,
      },
    });

    console.log('   ✅ admin@inmova.app configurado');
    console.log(`      Email: admin@inmova.app`);
    console.log(`      Password: ${adminPassword}`);

    // 4. Crear/actualizar test@inmova.app
    console.log('\n4️⃣ Configurando test@inmova.app...');
    const testPassword = 'Test123456!';
    const testHash = await bcrypt.hash(testPassword, 10);

    const testUser = await prisma.user.upsert({
      where: { email: 'test@inmova.app' },
      update: {
        password: testHash,
        role: 'super_admin',
        activo: true,
        companyId: company.id,
      },
      create: {
        email: 'test@inmova.app',
        name: 'Test User',
        password: testHash,
        role: 'super_admin',
        activo: true,
        companyId: company.id,
      },
    });

    console.log('   ✅ test@inmova.app configurado');
    console.log(`      Email: test@inmova.app`);
    console.log(`      Password: ${testPassword}`);

    // 5. Verificar bcrypt
    console.log('\n5️⃣ Verificando bcrypt...');
    const testCompare = await bcrypt.compare(adminPassword, adminHash);
    console.log(`   bcrypt.compare test: ${testCompare ? '✅' : '❌'}`);

    // 6. Resumen final
    console.log('\n📋 RESUMEN:');
    console.log('   ✅ Company: ' + company.id);
    console.log('   ✅ admin@inmova.app: Admin123!');
    console.log('   ✅ test@inmova.app: Test123456!');
    console.log('   ✅ Todos activos: true');
    console.log('   ✅ Role: super_admin');
    console.log('\n✅ FIX COMPLETO - LISTO PARA HEALTH CHECK\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAuth();
