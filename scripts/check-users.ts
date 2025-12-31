/**
 * Script para verificar usuarios en la base de datos
 */

import { prisma } from '../lib/db';

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');

    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos\n');

    // Contar usuarios
    const userCount = await prisma.user.count();
    console.log(`📊 Total de usuarios: ${userCount}\n`);

    if (userCount > 0) {
      // Obtener primeros 5 usuarios (sin passwords)
      const users = await prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          activo: true,
          createdAt: true,
        },
      });

      console.log('👥 Usuarios encontrados:\n');
      users.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email}`);
        console.log(`   Nombre: ${user.name || 'N/A'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Activo: ${user.activo ? '✅' : '❌'}`);
        console.log(`   Creado: ${user.createdAt}\n`);
      });
    } else {
      console.log('⚠️  No hay usuarios en la base de datos\n');
      console.log('💡 Necesitas crear un usuario para poder hacer login\n');
    }

    // Verificar sales representatives
    const salesCount = await prisma.salesRepresentative.count();
    console.log(`📊 Total de comerciales: ${salesCount}\n`);

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkUsers();
