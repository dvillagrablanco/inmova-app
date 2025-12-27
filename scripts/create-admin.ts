import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creando usuario administrador...');

  try {
    // 1. Crear empresa
    let company = await prisma.company.upsert({
      where: { email: 'admin@inmova.app' },
      update: {},
      create: {
        nombre: 'INMOVA Administración',
        cif: 'B12345678',
        email: 'admin@inmova.app',
        telefono: '+34 900 000 000',
        direccion: 'Calle Tecnología 1',
        ciudad: 'Madrid',
        codigoPostal: '28001',
        pais: 'España',
        activo: true,
        estadoCliente: 'activo',
        contactoPrincipal: 'Administrador',
        emailContacto: 'admin@inmova.app',
        telefonoContacto: '+34 900 000 000',
      },
    });
    console.log('✅ Empresa creada/actualizada');

    // 2. Crear usuario admin
    const hashedPassword = await bcrypt.hash('Admin2025!', 10);

    const user = await prisma.user.upsert({
      where: { email: 'admin@inmova.app' },
      update: {
        password: hashedPassword,
        activo: true,
        role: 'super_admin',
      },
      create: {
        email: 'admin@inmova.app',
        name: 'Administrador INMOVA',
        password: hashedPassword,
        role: 'super_admin',
        companyId: company.id,
        activo: true,
      },
    });

    console.log('\n✅ ¡Usuario administrador creado con éxito!');
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║     CREDENCIALES DE ACCESO          ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Email:    admin@inmova.app         ║');
    console.log('║  Password: Admin2025!               ║');
    console.log('╚══════════════════════════════════════╝\n');
    console.log('🌐 Ahora puedes loguearte en: http://localhost:3000/login');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
