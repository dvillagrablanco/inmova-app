#!/usr/bin/env tsx
/**
 * Script para crear usuarios de prueba para todos los roles
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    email: 'superadmin@test.com',
    name: 'Super Administrador',
    role: 'super_admin',
    password: 'Test1234!',
  },
  {
    email: 'admin@test.com',
    name: 'Administrador',
    role: 'administrador',
    password: 'Test1234!',
  },
  {
    email: 'gestor@test.com',
    name: 'Gestor',
    role: 'gestor',
    password: 'Test1234!',
  },
  {
    email: 'operador@test.com',
    name: 'Operador',
    role: 'operador',
    password: 'Test1234!',
  },
  {
    email: 'soporte@test.com',
    name: 'Soporte',
    role: 'soporte',
    password: 'Test1234!',
  },
  {
    email: 'community@test.com',
    name: 'Community Manager',
    role: 'community_manager',
    password: 'Test1234!',
  },
];

async function main() {
  console.log('🔧 Creando usuarios de prueba...\n');

  for (const userData of TEST_USERS) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`✓ ${userData.role}: ${userData.email} (ya existe)`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role as any,
          password: hashedPassword,
          emailVerified: new Date(),
        },
      });

      console.log(`✅ ${userData.role}: ${userData.email} creado`);
    } catch (error: any) {
      console.error(`❌ Error creando ${userData.email}:`, error.message);
    }
  }

  console.log('\n✨ Proceso completado');
  console.log('\n📋 CREDENCIALES DE ACCESO:');
  console.log('═'.repeat(60));
  TEST_USERS.forEach(user => {
    console.log(`${user.role.padEnd(20)} | ${user.email.padEnd(25)} | ${user.password}`);
  });
  console.log('═'.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
