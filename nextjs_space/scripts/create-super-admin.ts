import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Obtener la primera empresa
    const company = await prisma.company.findFirst();
    
    if (!company) {
      console.error('No hay empresas en la base de datos');
      return;
    }

    // Verificar si ya existe un super_admin
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'super_admin' },
    });

    if (existingSuperAdmin) {
      console.log('✅ Ya existe un super_admin:', existingSuperAdmin.email);
      return;
    }

    // Crear super_admin
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@inmova.com',
        name: 'Super Administrador',
        password: hashedPassword,
        role: 'super_admin',
        companyId: company.id,
        activo: true,
      },
    });

    console.log('✅ Super Admin creado exitosamente:');
    console.log('   Email:', superAdmin.email);
    console.log('   Password: superadmin123');
    console.log('   Role:', superAdmin.role);
  } catch (error) {
    console.error('Error creando super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
