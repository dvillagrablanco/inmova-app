import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando seed de la base de datos...');

  // 1. Crear o verificar empresa administradora
  let adminCompany = await prisma.company.findFirst({
    where: { email: 'admin@inmova.app' }
  });

  if (!adminCompany) {
    console.log('🏢 Creando empresa administradora...');
    adminCompany = await prisma.company.create({
      data: {
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
    console.log('✅ Empresa administradora creada');
  } else {
    console.log('✅ Empresa administradora ya existe');
  }

  // 2. Crear o verificar usuario administrador
  let adminUser = await prisma.user.findFirst({
    where: { 
      email: 'admin@inmova.app',
      role: 'super_admin'
    }
  });

  if (!adminUser) {
    console.log('👤 Creando usuario administrador...');
    const hashedPassword = await bcrypt.hash('Admin2025!', 10);
    
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@inmova.app',
        name: 'Administrador INMOVA',
        password: hashedPassword,
        role: 'super_admin',
        companyId: adminCompany.id,
        activo: true,
      },
    });
    console.log('✅ Usuario administrador creado');
    console.log('🔑 Credenciales:');
    console.log('   Email: admin@inmova.app');
    console.log('   Password: Admin2025!');
  } else {
    // Si existe pero puede tener contraseña incorrecta, actualizamos
    const hashedPassword = await bcrypt.hash('Admin2025!', 10);
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password: hashedPassword,
        activo: true,
        role: 'super_admin',
      },
    });
    console.log('✅ Usuario administrador actualizado');
    console.log('🔑 Credenciales:');
    console.log('   Email: admin@inmova.app');
    console.log('   Password: Admin2025!');
  }

  // 3. Verificar otros usuarios admin
  const allAdmins = await prisma.user.findMany({
    where: { 
      OR: [
        { role: 'super_admin' },
        { role: 'administrador' }
      ],
      activo: true 
    },
    include: { company: true },
  });

  console.log('\n📊 Resumen de usuarios administradores activos:');
  allAdmins.forEach((admin, index) => {
    console.log(`   ${index + 1}. ${admin.name} (${admin.email}) - ${admin.company.nombre}`);
  });

  console.log('\n✅ Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
