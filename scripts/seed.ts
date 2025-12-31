import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  // 1. Crear empresa demo
  console.log('📦 Creando empresa demo...');
  const company = await prisma.company.upsert({
    where: { email: 'demo@inmova.app' },
    update: {},
    create: {
      nombre: 'Inmova Demo',
      email: 'demo@inmova.app',
      telefono: '+34 900 000 000',
      activo: true,
    },
  });
  console.log(`✅ Empresa creada: ${company.nombre} (ID: ${company.id})\n`);

  // 2. Crear usuario admin
  console.log('👤 Creando usuario administrador...');
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@inmova.app' },
    update: {},
    create: {
      email: 'admin@inmova.app',
      name: 'Admin Demo',
      password: hashedPassword,
      role: 'SUPERADMIN',
      companyId: company.id,
      activo: true,
    },
  });
  console.log(`✅ Usuario creado: ${user.email} (ID: ${user.id})\n`);

  // 3. Mostrar credenciales
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 SEED COMPLETADO EXITOSAMENTE');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🔐 CREDENCIALES DE ACCESO:\n');
  console.log('   Email: admin@inmova.app');
  console.log('   Password: demo123\n');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
