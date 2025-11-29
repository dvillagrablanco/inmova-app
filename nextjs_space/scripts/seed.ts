import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default company
  const company1 = await prisma.company.upsert({
    where: { id: 'inmova-default' },
    update: {},
    create: {
      id: 'inmova-default',
      nombre: 'INMOVA',
      email: 'info@inmova.es',
      telefono: '+34 900 123 456',
      direccion: 'Calle Serrano, 45',
      ciudad: 'Madrid',
      codigoPostal: '28001',
      pais: 'España',
      activo: true
    }
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@inmova.es' },
    update: {},
    create: {
      email: 'admin@inmova.es',
      name: 'Administrador INMOVA',
      password: hashedPassword,
      role: 'administrador',
      companyId: company1.id,
      activo: true
    }
  });

  console.log('✅ Seed completed successfully!');
  console.log('📧 Email: admin@inmova.es');
  console.log('🔑 Password: admin123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
