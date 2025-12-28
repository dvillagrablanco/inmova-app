import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando usuarios en la base de datos...');

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      take: 10,
    });

    console.log(`\n✅ Usuarios encontrados: ${users.length}`);
    users.forEach((user) => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    // Verificar si existe admin@inmova.app
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@inmova.app' },
    });

    if (!adminUser) {
      console.log('\n⚠️ Usuario admin@inmova.app NO existe. Creando...');

      const hashedPassword = await bcrypt.hash('Admin2025!', 10);

      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@inmova.app',
          name: 'Super Administrador',
          password: hashedPassword,
          role: 'SUPERADMIN',
          emailVerified: new Date(),
          experienceLevel: 'EXPERT',
          onboardingCompleted: true,
          active: true,
        },
      });

      console.log('✅ Usuario admin creado exitosamente:', newAdmin.email);
    } else {
      console.log('\n✅ Usuario admin@inmova.app YA EXISTE');
      console.log('   Email:', adminUser.email);
      console.log('   Role:', adminUser.role);
      console.log('   Name:', adminUser.name);

      // Actualizar contraseña por si acaso
      const hashedPassword = await bcrypt.hash('Admin2025!', 10);
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashedPassword },
      });
      console.log('✅ Contraseña actualizada a: Admin2025!');
    }

    console.log('\n✅ Verificación completada');
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
