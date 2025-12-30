#!/usr/bin/env tsx
/**
 * Script para crear usuario de test válido
 * Usa bcrypt como NextAuth para garantizar compatibilidad
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('🔧 Creando usuario de test...\n');

  const email = 'test@inmova.app';
  const password = 'Test123456!';
  const name = 'Test User';

  try {
    // Verificar si ya existe
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('⚠️  Usuario ya existe. Actualizando password...');
      
      // Hash password con bcrypt (mismo que NextAuth)
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'super_admin',
        },
      });
      
      console.log('✅ Password actualizado');
    } else {
      console.log('📝 Creando nuevo usuario con company...');
      
      // Hash password con bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Buscar una company existente o crear una
      let company = await prisma.company.findFirst();
      
      if (!company) {
        console.log('📝 Creando company de test...');
        company = await prisma.company.create({
          data: {
            name: 'Test Company',
            slug: 'test-company',
            status: 'active',
          },
        });
        console.log('✅ Company creada');
      }
      
      await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'super_admin',
          companyId: company.id,
        },
      });
      
      console.log('✅ Usuario creado');
    }

    console.log('\n📋 Credenciales de test:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('\n✅ Listo para health check!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
