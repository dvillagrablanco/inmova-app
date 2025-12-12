import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  try {
    const partner = await prisma.partner.findUnique({
      where: { codigo: 'santander-demo' },
      include: { salesReps: true }
    });

    if (partner) {
      console.log('✅ Partner de demo ya existe:');
      console.log('');
      console.log('📋 Detalles del Partner:');
      console.log(`   ID: ${partner.id}`);
      console.log(`   Nombre: ${partner.nombre}`);
      console.log(`   Código: ${partner.codigo}`);
      console.log(`   CIF: ${partner.cif}`);
      console.log('');
      console.log('🔑 Credenciales del Partner (NO funcional - partners no se autentican):');
      console.log('   Email: demo.partner@santander.com');
      console.log('   Password: Partner123!');
      console.log('');
      console.log('👥 Representantes Comerciales (USAR ESTAS CREDENCIALES):');
      partner.salesReps.forEach((rep) => {
        console.log(`   - ${rep.nombreCompleto}`);
        console.log(`     Email: ${rep.email}`);
        console.log(`     Password: Comercial123!`);
        console.log(`     Código: ${rep.codigoReferido}`);
        console.log('');
      });
      console.log('🔐 Para acceder al portal comercial:');
      console.log('   1. Ve a https://inmova.app/login?role=comercial');
      console.log('   2. Usa el email y password de un representante comercial');
      console.log('   3. Serás redirigido a /portal-comercial');
      console.log('');
      console.log('🌐 URL de landing con branding:');
      console.log('   https://inmova.app/landing?partner=santander-demo');
    } else {
      console.log('❌ El partner de demo no existe. Creándolo...');
      // Intentar crearlo
      await prisma.$disconnect();
      process.exit(1);
    }
  } catch (e: any) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
