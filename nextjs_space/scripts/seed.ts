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

  // ====================
  // PARTNERS B2B SYSTEM
  // ====================
  console.log('\n🤝 Creando Partners de ejemplo...');

  // Partner 1: Banco Santander
  let partnerBanco = await prisma.partner.findFirst({
    where: { email: 'partners@bancosantander.es' }
  });

  if (!partnerBanco) {
    const hashedPasswordPartner = await bcrypt.hash('Partner2025!', 10);
    partnerBanco = await prisma.partner.create({
      data: {
        nombre: 'Banco Santander',
        razonSocial: 'Banco Santander S.A.',
        cif: 'A39000013',
        tipo: 'BANCO',
        contactoNombre: 'María González',
        contactoEmail: 'maria.gonzalez@bancosantander.es',
        contactoTelefono: '+34 912 345 678',
        email: 'partners@bancosantander.es',
        password: hashedPasswordPartner,
        estado: 'ACTIVE',
        activo: true,
        fechaActivacion: new Date(),
        comisionPorcentaje: 60.0, // 60% por tener muchos clientes
      },
    });
    console.log('✅ Partner Banco Santander creado');
  }

  // Partner 2: Multifamily Office
  let partnerOffice = await prisma.partner.findFirst({
    where: { email: 'partners@abanteasesores.com' }
  });

  if (!partnerOffice) {
    const hashedPasswordPartner = await bcrypt.hash('Partner2025!', 10);
    partnerOffice = await prisma.partner.create({
      data: {
        nombre: 'Abante Asesores',
        razonSocial: 'Abante Asesores S.L.',
        cif: 'B84200976',
        tipo: 'MULTIFAMILY_OFFICE',
        contactoNombre: 'Carlos Martínez',
        contactoEmail: 'carlos.martinez@abanteasesores.com',
        contactoTelefono: '+34 915 555 000',
        email: 'partners@abanteasesores.com',
        password: hashedPasswordPartner,
        estado: 'ACTIVE',
        activo: true,
        fechaActivacion: new Date(),
        comisionPorcentaje: 50.0,
      },
    });
    console.log('✅ Partner Abante Asesores creado');
  }

  // Partner 3: Plataforma de Membresía
  let partnerPlatform = await prisma.partner.findFirst({
    where: { email: 'partners@zona3.com' }
  });

  if (!partnerPlatform) {
    const hashedPasswordPartner = await bcrypt.hash('Partner2025!', 10);
    partnerPlatform = await prisma.partner.create({
      data: {
        nombre: 'Zona 3',
        razonSocial: 'Zona 3 Coworking S.L.',
        cif: 'B87654321',
        tipo: 'PLATAFORMA_MEMBRESIA',
        contactoNombre: 'Laura Fernández',
        contactoEmail: 'laura.fernandez@zona3.com',
        contactoTelefono: '+34 910 000 111',
        email: 'partners@zona3.com',
        password: hashedPasswordPartner,
        estado: 'ACTIVE',
        activo: true,
        fechaActivacion: new Date(),
        comisionPorcentaje: 40.0,
      },
    });
    console.log('✅ Partner Zona 3 creado');
  }

  // Partner 4: Pendiente de aprobación
  let partnerPending = await prisma.partner.findFirst({
    where: { email: 'partners@nuevoconsultor.com' }
  });

  if (!partnerPending) {
    const hashedPasswordPartner = await bcrypt.hash('Partner2025!', 10);
    partnerPending = await prisma.partner.create({
      data: {
        nombre: 'Nuevo Consultor Inmobiliario',
        razonSocial: 'Nuevo Consultor S.L.',
        cif: 'B99887766',
        tipo: 'CONSULTORA',
        contactoNombre: 'Pedro López',
        contactoEmail: 'pedro.lopez@nuevoconsultor.com',
        contactoTelefono: '+34 600 111 222',
        email: 'partners@nuevoconsultor.com',
        password: hashedPasswordPartner,
        estado: 'PENDING', // Pendiente de aprobación
        activo: false,
        comisionPorcentaje: 20.0,
      },
    });
    console.log('✅ Partner Nuevo Consultor creado (PENDIENTE)');
  }

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
