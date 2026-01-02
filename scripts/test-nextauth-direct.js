/**
 * Test directo de la función authorize de NextAuth
 */

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuthorize() {
  console.log('🧪 Test directo de authorize...\n');

  const credentials = {
    email: 'admin@inmova.app',
    password: 'Admin123!',
  };

  try {
    console.log(`1️⃣ Buscando usuario: ${credentials.email}`);
    
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      include: { company: true },
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Activo: ${user.activo}`);
    console.log(`   CompanyId: ${user.companyId}`);
    console.log(`   Company: ${user.company ? user.company.nombre : 'NULL'}`);
    console.log(`   Password length: ${user.password ? user.password.length : 0}`);

    console.log(`\n2️⃣ Verificando password con bcrypt...`);
    
    if (!user.password) {
      console.log('❌ Usuario no tiene password');
      process.exit(1);
    }

    const isValid = await bcrypt.compare(credentials.password, user.password);
    console.log(`   Resultado: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);

    if (!isValid) {
      console.log('\n❌ La contraseña no coincide');
      process.exit(1);
    }

    console.log(`\n3️⃣ Verificando estado activo...`);
    if (!user.activo) {
      console.log('❌ Usuario inactivo');
      process.exit(1);
    }
    console.log('✅ Usuario activo');

    console.log(`\n4️⃣ Verificando companyId...`);
    if (!user.companyId) {
      console.log('❌ Usuario sin companyId');
      process.exit(1);
    }
    console.log('✅ CompanyId presente');

    console.log(`\n5️⃣ Verificando company...`);
    if (!user.company) {
      console.log('❌ Company no existe');
      process.exit(1);
    }
    console.log(`✅ Company: ${user.company.nombre}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ¡TODAS LAS VERIFICACIONES PASARON!');
    console.log('='.repeat(60));
    console.log('\nEl usuario DEBERÍA poder hacer login.');
    console.log('Si el login sigue fallando, el problema está en NextAuth config.');
    
    await prisma.$disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testAuthorize();
