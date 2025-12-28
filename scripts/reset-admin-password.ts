/**
 * Script para resetear la contraseña del admin directamente en la base de datos
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://inmova_user:inmova_secure_pass_2024@157.180.119.236:5432/inmova?schema=public'
      }
    }
  });

  try {
    console.log('\n🔐 Reseteando contraseña del admin...\n');

    const newPassword = 'Test1234!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`Nueva contraseña: ${newPassword}`);
    console.log(`Hash generado: ${hashedPassword.substring(0, 30)}...\n`);

    // Actualizar contraseña
    const result = await prisma.user.update({
      where: { email: 'admin@inmova.app' },
      data: { password: hashedPassword },
    });

    console.log('✅ Contraseña actualizada exitosamente');
    console.log(`   Usuario: ${result.email}`);
    console.log(`   Role: ${result.role}`);
    console.log(`   Activo: ${result.activo}\n`);

    // Verificar que funciona
    console.log('🔍 Verificando hash...');
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log(`   Hash válido: ${isValid ? '✅ Sí' : '❌ No'}\n`);

    return true;

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword().then(success => process.exit(success ? 0 : 1));
