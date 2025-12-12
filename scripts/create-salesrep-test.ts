import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Creando representante comercial de prueba...\n');

  try {
    // Buscar el partner de Banco Santander
    const partner = await prisma.partner.findFirst({
      where: { nombre: 'Banco Santander' }
    });

    if (!partner) {
      console.log('❌ No se encontró el partner Banco Santander');
      return;
    }

    console.log(`✅ Partner encontrado: ${partner.nombre}`);
    console.log(`   ID: ${partner.id}`);
    console.log('');

    // Verificar si ya existe un representante con el email
    const existingRep = await prisma.salesRepresentative.findUnique({
      where: { email: 'comercial.test@santander.com' }
    });

    if (existingRep) {
      console.log('✅ El representante comercial de prueba ya existe:');
      console.log('');
      console.log('👥 Representante Comercial:');
      console.log(`   Nombre: ${existingRep.nombreCompleto}`);
      console.log(`   Email: ${existingRep.email}`);
      console.log(`   Password: Comercial123!`);
      console.log(`   Código: ${existingRep.codigoReferido}`);
      console.log('');
      console.log('🔐 Para acceder al portal comercial:');
      console.log('   1. Ve a https://inmova.app/login?role=comercial');
      console.log('   2. Usa las credenciales:');
      console.log(`      Email: ${existingRep.email}`);
      console.log('      Password: Comercial123!');
      console.log('   3. Serás redirigido a /portal-comercial');
      return;
    }

    // Crear un nuevo representante comercial
    const hashedPassword = await bcrypt.hash('Comercial123!', 10);

    const salesRep = await prisma.salesRepresentative.create({
      data: {
        nombre: 'Carlos',
        apellidos: 'García Test',
        nombreCompleto: 'Carlos García Test',
        dni: '12345678T',
        email: 'comercial.test@santander.com',
        telefono: '+34 600 111 222',
        codigoReferido: 'SANT-TEST-001',
        password: hashedPassword,
        partnerId: partner.id,
        estado: 'ACTIVO',
        activo: true,
        comisionCaptacion: 200.0,
        comisionRecurrente: 12.0,
        bonificacionObjetivo: 600.0,
        objetivoLeadsMes: 15,
        objetivoConversionesMes: 3,
      }
    });

    console.log('✅ Representante comercial creado exitosamente:');
    console.log('');
    console.log('👥 Representante Comercial:');
    console.log(`   Nombre: ${salesRep.nombreCompleto}`);
    console.log(`   Email: ${salesRep.email}`);
    console.log(`   Password: Comercial123!`);
    console.log(`   Código: ${salesRep.codigoReferido}`);
    console.log(`   Partner: ${partner.nombre}`);
    console.log('');
    console.log('🔐 Para acceder al portal comercial:');
    console.log('   1. Ve a https://inmova.app/login?role=comercial');
    console.log('   2. Usa las credenciales:');
    console.log(`      Email: ${salesRep.email}`);
    console.log('      Password: Comercial123!');
    console.log('   3. Serás redirigido a /portal-comercial');
    console.log('');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
