import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando estado completo del usuario admin...\n');

  const user = await prisma.users.findUnique({
    where: { email: 'admin@inmova.app' },
    include: { company: true },
  });

  if (user) {
    console.log('✅ Usuario encontrado:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Activo:', user.activo);
    console.log('   CompanyId:', user.companyId);
    console.log('   Company Name:', user.company?.nombre);
    console.log('   Password Hash:', user.password?.substring(0, 20) + '...');
    console.log('   Created:', user.createdAt);
    console.log('   Updated:', user.updatedAt);
  } else {
    console.log('❌ Usuario no encontrado');
  }

  await prisma.$disconnect();
}

main();
