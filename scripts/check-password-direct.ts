/**
 * Script para verificar hash de contraseña directamente
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

async function checkPassword() {
  const prisma = new PrismaClient();

  try {
    console.log('\n🔐 Verificando contraseña en la base de datos\n');

    const user = await prisma.user.findUnique({
      where: { email: 'admin@inmova.app' },
    });

    if (!user) {
      console.log('❌ Usuario no encontrado\n');
      return false;
    }

    console.log(`✅ Usuario: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Activo: ${user.activo}`);
    console.log(`   Hash: ${user.password?.substring(0, 30)}...`);

    if (!user.password) {
      console.log('❌ Sin contraseña\n');
      return false;
    }

    // Probar contraseñas
    const passwords = ['Test1234!', 'Admin2025!', 'admin', 'admin123'];

    console.log(`\n🔍 Probando ${passwords.length} contraseñas...\n`);

    for (const pwd of passwords) {
      const match = await bcrypt.compare(pwd, user.password);
      
      if (match) {
        console.log(`✅ ¡CONTRASEÑA CORRECTA!: "${pwd}"\n`);
        return true;
      } else {
        console.log(`❌ Incorrecta: "${pwd}"`);
      }
    }

    console.log('\n❌ Ninguna contraseña coincide\n');
    return false;

  } catch (error) {
    console.error('Error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword().then(success => process.exit(success ? 0 : 1));
