import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Buscar o crear la empresa INMOVA
    let company = await prisma.company.findFirst({
      where: { nombre: 'INMOVA' },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          nombre: 'INMOVA',
          activo: true,
          estadoCliente: 'activo',
        },
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@inmova.com' },
    });

    if (existingUser) {
      console.log('⚠️  Usuario admin@inmova.com ya existe');
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Crear el usuario admin
    const user = await prisma.user.create({
      data: {
        email: 'admin@inmova.com',
        name: 'Admin INMOVA',
        password: hashedPassword,
        role: 'administrador',
        companyId: company.id,
        activo: true,
      },
    });

    console.log('✅ Usuario Admin creado exitosamente:');
    console.log('   Email: admin@inmova.com');
    console.log('   Password: admin123');
    console.log('   Role: administrador');
  } catch (error) {
    console.error('Error creando usuario admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
