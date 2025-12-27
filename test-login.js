// Script para probar el login directamente
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Probando login...\n');

    const email = 'admin@inmova.app';
    const password = 'Admin2025!';

    console.log('📧 Email:', email);
    console.log('🔐 Password:', password);
    console.log('');

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log('  - Nombre:', user.name);
    console.log('  - Email:', user.email);
    console.log('  - Rol:', user.role);
    console.log('  - Activo:', user.activo);
    console.log('  - Compañía:', user.company.nombre);
    console.log('  - Password hash length:', user.password?.length || 0);
    console.log('');

    // Verificar contraseña
    if (!user.password) {
      console.log('❌ Usuario no tiene contraseña configurada');
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    console.log('🔑 Contraseña válida:', isValid ? '✅ SÍ' : '❌ NO');

    if (isValid) {
      console.log('\n✅ ¡LOGIN EXITOSO!');
      console.log('El usuario debería poder loguearse correctamente.');
    } else {
      console.log('\n❌ CONTRASEÑA INCORRECTA');
      console.log('La contraseña no coincide con el hash almacenado.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
