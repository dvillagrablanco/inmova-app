/**
 * Script para crear el usuario del socio fundador de eWoorker
 * 
 * Ejecutar: npx tsx scripts/create-ewoorker-partner-user.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SOCIO_DATA = {
  // Company
  companyId: 'company-socio-ewoorker',
  companyName: 'Socio Fundador eWoorker',
  companyCIF: 'X00000000X',
  
  // User
  userId: 'user-socio-ewoorker-001',
  email: 'socio@ewoorker.com',
  name: 'Socio Fundador eWoorker',
  password: 'Ewoorker2025!Socio',
  role: 'super_admin' as const,
};

async function main() {
  console.log('🚀 Creando usuario del socio fundador de eWoorker...\n');

  try {
    // 1. Hashear password
    const hashedPassword = await bcrypt.hash(SOCIO_DATA.password, 10);
    console.log('✅ Password hasheado correctamente');

    // 2. Buscar o crear Company
    let company = await prisma.company.findUnique({
      where: { id: SOCIO_DATA.companyId },
    });

    if (!company) {
      // Buscar plan Demo para asignarlo
      const demoPlan = await prisma.subscriptionPlan.findFirst({
        where: { nombre: 'Demo' },
      });

      if (!demoPlan) {
        throw new Error('Plan Demo no encontrado. Ejecuta seed-subscription-plans.ts primero.');
      }

      company = await prisma.company.create({
        data: {
          id: SOCIO_DATA.companyId,
          nombre: SOCIO_DATA.companyName,
          cif: SOCIO_DATA.companyCIF,
          activo: true,
          subscriptionPlanId: demoPlan.id,
        },
      });
      console.log(`✅ Company creada: ${company.nombre}`);
    } else {
      console.log(`ℹ️  Company ya existe: ${company.nombre}`);
    }

    // 3. Buscar o crear User
    let user = await prisma.user.findUnique({
      where: { email: SOCIO_DATA.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: SOCIO_DATA.userId,
          email: SOCIO_DATA.email,
          name: SOCIO_DATA.name,
          password: hashedPassword,
          role: SOCIO_DATA.role,
          companyId: company.id,
          activo: true,
          emailVerified: new Date(),
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
        },
      });
      console.log(`✅ Usuario creado: ${user.email}`);
    } else {
      // Actualizar password y rol si ya existe
      user = await prisma.user.update({
        where: { email: SOCIO_DATA.email },
        data: {
          password: hashedPassword,
          role: SOCIO_DATA.role,
          activo: true,
          onboardingCompleted: true,
        },
      });
      console.log(`ℹ️  Usuario actualizado: ${user.email}`);
    }

    // 4. Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_SOCIO_EWOORKER',
        entityType: 'User',
        entityId: user.id,
        details: { message: 'Usuario socio fundador eWoorker creado/actualizado via script' },
      },
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ USUARIO SOCIO FUNDADOR EWOORKER CREADO EXITOSAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔐 CREDENCIALES DE ACCESO:');
    console.log(`   Email:    ${SOCIO_DATA.email}`);
    console.log(`   Password: ${SOCIO_DATA.password}`);
    console.log(`   Rol:      ${SOCIO_DATA.role}`);
    console.log(`   Panel:    /ewoorker/admin-socio\n`);
    console.log('⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
