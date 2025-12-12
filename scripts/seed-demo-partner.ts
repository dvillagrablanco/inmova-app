/**
 * Script para crear un partner de demostración
 * Ejecutar con: yarn tsx scripts/seed-demo-partner.ts
 */

import { PrismaClient, PartnerType, PartnerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n\ud83c\udf31 Creando partner de demostración...\n');

  // Verificar si ya existe
  const existingPartner = await prisma.partner.findUnique({
    where: { codigo: 'santander-demo' },
  });

  if (existingPartner) {
    console.log('\u2705 El partner de demo ya existe');
    console.log('\n\ud83d\udd11 Credenciales del Partner:');
    console.log('   Email: demo.partner@santander.com');
    console.log('   Password: Partner123!');
    console.log('\n\ud83c\udf10 URL de landing con branding:');
    console.log('   https://inmova.app/landing?partner=santander-demo');
    return;
  }

  const hashedPassword = await bcrypt.hash('Partner123!', 10);

  const partner = await prisma.partner.create({
    data: {
      // Información básica
      nombre: 'Banco Santander',
      razonSocial: 'Banco Santander S.A.',
      cif: 'A39000013',
      codigo: 'santander-demo',
      tipo: PartnerType.BANCO,
      
      // Contacto
      contactoNombre: 'Juan Pérez',
      contactoEmail: 'juan.perez@santander.com',
      contactoTelefono: '+34 912 345 678',
      sitioWeb: 'https://www.santander.com',
      
      // Autenticación
      email: 'demo.partner@santander.com',
      password: hashedPassword,
      
      // Branding personalizado
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Banco_Santander_Logotipo.svg/2560px-Banco_Santander_Logotipo.svg.png',
      logoHeader: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Banco_Santander_Logotipo.svg/2560px-Banco_Santander_Logotipo.svg.png',
      logoFooter: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Banco_Santander_Logotipo.svg/2560px-Banco_Santander_Logotipo.svg.png',
      coloresPrimarios: {
        primary: '#EC0000',
        secondary: '#F5F5F5',
        accent: '#666666',
      },
      mensajeBienvenida: 'Bienvenido a la plataforma de gestión inmobiliaria INMOVA, proporcionada en colaboración con Banco Santander. Soluciones tecnológicas avanzadas para optimizar la gestión de tu patrimonio inmobiliario.',
      
      // Configuración comercial
      comisionPorcentaje: 15.0,
      comisionRecurrente: 8.0,
      umbralComision: 3,
      
      // Estado
      estado: PartnerStatus.ACTIVE,
      activo: true,
      fechaActivacion: new Date(),
    },
  });

  console.log('\u2705 Partner creado exitosamente');
  console.log('\n\ud83d\udcca Detalles del Partner:');
  console.log(`   ID: ${partner.id}`);
  console.log(`   Nombre: ${partner.nombre}`);
  console.log(`   Código: ${partner.codigo}`);
  console.log(`   CIF: ${partner.cif}`);
  
  console.log('\n\ud83d\udd11 Credenciales del Partner:');
  console.log('   Email: demo.partner@santander.com');
  console.log('   Password: Partner123!');
  
  console.log('\n\ud83c\udf10 URL de landing con branding:');
  console.log('   https://inmova.app/landing?partner=santander-demo');
  console.log('   http://localhost:3000/landing?partner=santander-demo (local)');
  
  console.log('\n\u2728 Branding personalizado configurado:');
  console.log(`   Color primario: ${(partner.coloresPrimarios as any).primary}`);
  console.log(`   Mensaje: ${partner.mensajeBienvenida?.substring(0, 80)}...`);
  
  // Crear un representante comercial asociado al partner
  const hashedSalesPassword = await bcrypt.hash('Comercial123!', 10);
  
  const salesRep = await prisma.salesRepresentative.create({
    data: {
      nombre: 'Carlos',
      apellidos: 'García López',
      nombreCompleto: 'Carlos García López',
      dni: '12345678A',
      email: 'carlos.garcia@santander.com',
      telefono: '+34 600 123 456',
      codigoReferido: 'SANT-CARLOS-001',
      password: hashedSalesPassword,
      partnerId: partner.id,
      estado: 'ACTIVO',
      comisionCaptacion: 200.0,
      comisionRecurrente: 12.0,
    },
  });
  
  console.log('\n\ud83d\udc65 Representante comercial creado:');
  console.log(`   Nombre: ${salesRep.nombreCompleto}`);
  console.log(`   Email: ${salesRep.email}`);
  console.log(`   Password: Comercial123!`);
  console.log(`   Código referido: ${salesRep.codigoReferido}`);
  
  console.log('\n\u2705 Seed completado exitosamente\n');
}

main()
  .catch((e) => {
    console.error('\u274c Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
