/**
 * Script para verificar si un hash de contraseña coincide con una contraseña en texto plano
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../lib/db';

async function verifyPasswordHash() {
  try {
    console.log('\n🔐 Verificando hash de contraseña\n');
    console.log('═'.repeat(60));

    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: 'admin@inmova.app' },
    });

    if (!user) {
      console.log('❌ Usuario no encontrado\n');
      return false;
    }

    console.log(`\n✅ Usuario encontrado:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Activo: ${user.activo ? '✅ Sí' : '❌ No'}`);
    console.log(`   Tiene password: ${user.password ? '✅ Sí' : '❌ No'}`);

    if (!user.password) {
      console.log('\n❌ Usuario no tiene contraseña configurada\n');
      return false;
    }

    // Mostrar inicio del hash
    console.log(`   Hash (inicio): ${user.password.substring(0, 20)}...`);

    // Contraseñas a probar
    const passwordsToTry = [
      'Test1234!',
      'Admin2025!',
      'admin',
      'admin123',
    ];

    console.log(`\n🔍 Probando ${passwordsToTry.length} contraseñas...\n`);

    for (const password of passwordsToTry) {
      const isValid = await bcrypt.compare(password, user.password);
      
      if (isValid) {
        console.log(`✅ ¡CONTRASEÑA CORRECTA!: "${password}"`);
        console.log('\n═'.repeat(60));
        console.log(`\n✅ RESULTADO: La contraseña correcta es: ${password}\n`);
        return true;
      } else {
        console.log(`❌ Incorrecta: "${password}"`);
      }
    }

    console.log('\n❌ Ninguna de las contraseñas probadas coincide');
    console.log('\n💡 Sugerencia: El usuario puede haber sido creado con una contraseña diferente');
    console.log('   o el hash puede estar corrupto.\n');

    return false;

  } catch (error) {
    console.error('\n❌ Error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
verifyPasswordHash()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
