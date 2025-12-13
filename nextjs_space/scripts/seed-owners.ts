import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de propietarios de demostración...');

  // Obtener la empresa INMOVA (Vidaro)
  const company = await prisma.company.findFirst({
    where: {
      nombre: 'INMOVA',
    },
  });

  if (!company) {
    console.error('❌ No se encontró la empresa INMOVA');
    return;
  }

  console.log(`✅ Empresa encontrada: ${company.nombre} (${company.id})`);

  // Obtener edificios de la empresa
  const buildings = await prisma.building.findMany({
    where: { companyId: company.id },
    take: 5, // Tomar los primeros 5 edificios
  });

  if (buildings.length === 0) {
    console.error('❌ No se encontraron edificios en la empresa');
    return;
  }

  console.log(`✅ Se encontraron ${buildings.length} edificios`);

  // Datos de propietarios de prueba
  const ownersData = [
    {
      nombreCompleto: 'Ana Martínez Pérez',
      email: 'ana.martinez@propietarios.com',
      password: 'owner123',
      telefono: '+34 654 321 987',
      dni: '45678901X',
      direccion: 'Calle Mayor 123, Madrid',
      notificarPagos: true,
      notificarOcupacion: true,
      notificarMantenimiento: true,
      notificarVencimientos: true,
      buildings: [
        {
          buildingId: buildings[0]?.id,
          porcentajePropiedad: 100,
          verIngresos: true,
          verGastos: true,
          verOcupacion: true,
          verMantenimiento: true,
          verDocumentos: true,
        },
      ],
    },
    {
      nombreCompleto: 'Roberto García López',
      email: 'roberto.garcia@propietarios.com',
      password: 'owner123',
      telefono: '+34 665 432 876',
      dni: '56789012Y',
      direccion: 'Avenida de la Libertad 45, Barcelona',
      notificarPagos: true,
      notificarOcupacion: true,
      notificarMantenimiento: false,
      notificarVencimientos: true,
      buildings: [
        {
          buildingId: buildings[1]?.id,
          porcentajePropiedad: 100,
          verIngresos: true,
          verGastos: true,
          verOcupacion: true,
          verMantenimiento: false,
          verDocumentos: false,
        },
        {
          buildingId: buildings[2]?.id,
          porcentajePropiedad: 50,
          verIngresos: true,
          verGastos: true,
          verOcupacion: true,
          verMantenimiento: true,
          verDocumentos: true,
        },
      ],
    },
    {
      nombreCompleto: 'Carmen Fernández Ruiz',
      email: 'carmen.fernandez@propietarios.com',
      password: 'owner123',
      telefono: '+34 676 543 765',
      dni: '67890123Z',
      direccion: 'Plaza del Sol 8, Valencia',
      notificarPagos: true,
      notificarOcupacion: true,
      notificarMantenimiento: true,
      notificarVencimientos: false,
      buildings: [
        {
          buildingId: buildings[2]?.id,
          porcentajePropiedad: 50,
          verIngresos: true,
          verGastos: false,
          verOcupacion: true,
          verMantenimiento: true,
          verDocumentos: false,
        },
      ],
    },
  ];

  // Crear propietarios
  for (const ownerData of ownersData) {
    try {
      // Verificar si el propietario ya existe
      const existingOwner = await prisma.owner.findUnique({
        where: { email: ownerData.email },
      });

      if (existingOwner) {
        console.log(`⚠️  El propietario ${ownerData.email} ya existe, saltando...`);
        continue;
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(ownerData.password, 10);

      // Crear propietario
      const owner = await prisma.owner.create({
        data: {
          companyId: company.id,
          nombreCompleto: ownerData.nombreCompleto,
          email: ownerData.email,
          password: hashedPassword,
          telefono: ownerData.telefono,
          dni: ownerData.dni,
          direccion: ownerData.direccion,
          notificarPagos: ownerData.notificarPagos,
          notificarOcupacion: ownerData.notificarOcupacion,
          notificarMantenimiento: ownerData.notificarMantenimiento,
          notificarVencimientos: ownerData.notificarVencimientos,
          activo: true,
          emailVerificado: true,
        },
      });

      console.log(`✅ Propietario creado: ${owner.nombreCompleto} (${owner.email})`);

      // Asignar edificios
      for (const buildingAssignment of ownerData.buildings) {
        if (!buildingAssignment.buildingId) {
          console.log(`⚠️  No se pudo asignar edificio (no existe)`);
          continue;
        }

        const assignment = await prisma.ownerBuilding.create({
          data: {
            ownerId: owner.id,
            buildingId: buildingAssignment.buildingId,
            companyId: company.id,
            porcentajePropiedad: buildingAssignment.porcentajePropiedad,
            verIngresos: buildingAssignment.verIngresos,
            verGastos: buildingAssignment.verGastos,
            verOcupacion: buildingAssignment.verOcupacion,
            verMantenimiento: buildingAssignment.verMantenimiento,
            verDocumentos: buildingAssignment.verDocumentos,
          },
        });

        const building = buildings.find(b => b.id === buildingAssignment.buildingId);
        console.log(`  ➡️  Edificio asignado: ${building?.nombre} (${buildingAssignment.porcentajePropiedad}%)`);
      }

      // Crear notificaciones de prueba
      await prisma.ownerNotification.createMany({
        data: [
          {
            ownerId: owner.id,
            companyId: company.id,
            titulo: 'Bienvenido al Portal de Propietarios',
            mensaje: 'Ahora puedes acceder a toda la información de tus propiedades desde un solo lugar.',
            tipo: 'info',
            leida: false,
          },
          {
            ownerId: owner.id,
            companyId: company.id,
            titulo: 'Pago recibido',
            mensaje: 'Se ha recibido el pago mensual de la unidad 2B.',
            tipo: 'pago_atrasado',
            leida: true,
          },
        ],
      });

      console.log(`  ➡️  Notificaciones de prueba creadas`);
    } catch (error) {
      console.error(`❌ Error al crear propietario ${ownerData.email}:`, error);
    }
  }

  console.log('\n🎉 Seed de propietarios completado!');
  console.log('\n🔑 Credenciales de acceso:');
  ownersData.forEach(owner => {
    console.log(`   - Email: ${owner.email}`);
    console.log(`     Contraseña: ${owner.password}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
