import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { addDays, addMonths, subDays, subMonths } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with comprehensive demo data...');

  // ==========================================
  // COMPANY & USERS
  // ==========================================
  const company = await prisma.company.upsert({
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

  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@inmova.es' },
    update: {},
    create: {
      email: 'admin@inmova.es',
      name: 'Admin INMOVA',
      password: hashedPassword,
      role: 'administrador',
      companyId: company.id,
      activo: true
    }
  });

  const gestor = await prisma.user.upsert({
    where: { email: 'gestor@inmova.es' },
    update: {},
    create: {
      email: 'gestor@inmova.es',
      name: 'Gestor INMOVA',
      password: hashedPassword,
      role: 'gestor',
      companyId: company.id,
      activo: true
    }
  });

  console.log('✅ Company & Users created');

  // ==========================================
  // BUILDINGS
  // ==========================================
  const building1 = await prisma.building.create({
    data: {
      companyId: company.id,
      nombre: 'Torre Vista Hermosa',
      direccion: 'Av. Diagonal 123',
      ciudad: 'Barcelona',
      codigoPostal: '08036',
      pais: 'España',
      numeroUnidades: 12,
      superficieConstruida: 2400,
      añoConstruccion: 2018,
      tipo: "residencial",
      certificacionEnergetica: 'B',
      ubicacion: { lat: 41.3874, lng: 2.1686 },
    }
  });

  const building2 = await prisma.building.create({
    data: {
      companyId: company.id,
      nombre: 'Residencia Coliving Madrid Centro',
      direccion: 'Calle Gran Vía 88',
      ciudad: 'Madrid',
      codigoPostal: '28013',
      pais: 'España',
      numeroUnidades: 8,
      superficieConstruida: 1600,
      añoConstruccion: 2020,
      tipo: "residencial",
      certificacionEnergetica: 'A',
      ubicacion: { lat: 40.4168, lng: -3.7038 },
    }
  });

  const building3 = await prisma.building.create({
    data: {
      companyId: company.id,
      nombre: 'Edificio Innovación STR',
      direccion: 'Rambla del Raval 30',
      ciudad: 'Barcelona',
      codigoPostal: '08001',
      pais: 'España',
      numeroUnidades: 6,
      superficieConstruida: 900,
      añoConstruccion: 2019,
      tipo: "residencial",
      certificacionEnergetica: 'B',
      ubicacion: { lat: 41.3797, lng: 2.1707 },
    }
  });

  console.log('✅ Buildings created (3)');

  // ==========================================
  // UNITS
  // ==========================================
  const units = await Promise.all([
    // Traditional units
    prisma.unit.create({
      data: {
        companyId: company.id,
        buildingId: building1.id,
        numero: '3A',
        tipo: 'vivienda',
        superficie: 85,
        habitaciones: 3,
        banos: 2,
        rentaMensual: 1200,
        estado: 'ocupada',
        descripcion: 'Piso amplio con vistas al mar, completamente amueblado'
      }
    }),
    prisma.unit.create({
      data: {
        companyId: company.id,
        buildingId: building1.id,
        numero: '5B',
        tipo: 'vivienda',
        superficie: 95,
        habitaciones: 3,
        banos: 2,
        rentaMensual: 1350,
        estado: 'disponible',
        descripcion: 'Última planta con terraza privada de 20m²'
      }
    }),
    // Coliving unit with rooms
    prisma.unit.create({
      data: {
        companyId: company.id,
        buildingId: building2.id,
        numero: 'Loft 2',
        tipo: 'vivienda',
        superficie: 200,
        habitaciones: 5,
        banos: 3,
        rentaMensual: 2500,
        estado: 'ocupada',
        descripcion: 'Coliving de 5 habitaciones con espacios comunes premium'
      }
    }),
    // STR units
    prisma.unit.create({
      data: {
        companyId: company.id,
        buildingId: building3.id,
        numero: 'Studio 1',
        tipo: 'vivienda',
        superficie: 45,
        habitaciones: 1,
        banos: 1,
        rentaMensual: 80,
        estado: 'disponible',
        descripcion: 'Estudio moderno diseñado para STR, equipado con smart home'
      }
    }),
    prisma.unit.create({
      data: {
        companyId: company.id,
        buildingId: building3.id,
        numero: 'Penthouse',
        tipo: 'vivienda',
        superficie: 120,
        habitaciones: 2,
        banos: 2,
        rentaMensual: 150,
        estado: 'ocupada',
        descripcion: 'Ático de lujo con jacuzzi y vistas panorámicas'
      }
    }),
  ]);

  console.log('✅ Units created (5)');

  // ==========================================
  // ROOMS (for Coliving)
  // ==========================================
  const colivingUnit = units[2];
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        companyId: company.id,
        unitId: colivingUnit.id,
        numero: 'R1',
        nombre: 'Habitación Premium',
        tipo: 'individual',
        superficie: 25,
        precioPorMes: 650,
        precioPorSemana: 170,
        estado: 'ocupada',
        bajoPrivado: true,
        balcon: true,
        amueblada: true,
        escritorio: true,
        armarioEmpotrado: true,
        tipoCama: 'doble',
        descripcion: 'Habitación premium con baño privado y balcón',
      }
    }),
    prisma.room.create({
      data: {
        companyId: company.id,
        unitId: colivingUnit.id,
        numero: 'R2',
        nombre: 'Habitación Estándar',
        tipo: 'individual',
        superficie: 18,
        precioPorMes: 500,
        precioPorSemana: 130,
        estado: 'ocupada',
        bajoPrivado: false,
        amueblada: true,
        escritorio: true,
        armarioEmpotrado: true,
        tipoCama: 'individual',
        descripcion: 'Habitación confortable con baño compartido',
      }
    }),
    prisma.room.create({
      data: {
        companyId: company.id,
        unitId: colivingUnit.id,
        numero: 'R3',
        nombre: 'Habitación Vista Ciudad',
        tipo: 'individual',
        superficie: 22,
        precioPorMes: 580,
        precioPorSemana: 150,
        estado: 'disponible',
        bajoPrivado: false,
        balcon: true,
        amueblada: true,
        escritorio: true,
        armarioEmpotrado: true,
        tipoCama: 'doble',
        descripcion: 'Habitación amplia con vistas a la ciudad',
      }
    }),
  ]);

  console.log('✅ Rooms created (3)');

  // ==========================================
  // TENANTS
  // ==========================================
  const tenants = await Promise.all([
    prisma.tenant.create({
      data: {
        companyId: company.id,
        nombre: 'María García',
        apellidos: 'López',
        email: 'maria.garcia@example.com',
        telefono: '+34 654 321 098',
        dni: '12345678A',
        fechaNacimiento: new Date('1990-05-15'),
        nacionalidad: 'Española',
        profesion: 'Ingeniera de Software',
        empresaActual: 'Tech Solutions SL',
        ingresosMensuales: 3500,
        estadoCivil: 'soltera',
      }
    }),
    prisma.tenant.create({
      data: {
        companyId: company.id,
        nombre: 'Carlos Martínez',
        apellidos: 'Sánchez',
        email: 'carlos.martinez@example.com',
        telefono: '+34 678 901 234',
        dni: '87654321B',
        fechaNacimiento: new Date('1988-08-22'),
        nacionalidad: 'Española',
        profesion: 'Diseñador Gráfico',
        empresaActual: 'Freelance',
        ingresosMensuales: 2800,
        estadoCivil: 'casado',
      }
    }),
    prisma.tenant.create({
      data: {
        companyId: company.id,
        nombre: 'Ana Rodríguez',
        apellidos: 'Fernández',
        email: 'ana.rodriguez@example.com',
        telefono: '+34 612 345 678',
        dni: '11223344C',
        fechaNacimiento: new Date('1995-03-10'),
        nacionalidad: 'Española',
        profesion: 'Estudiante Máster',
        empresaActual: 'Universidad Complutense',
        ingresosMensuales: 1200,
        estadoCivil: 'soltera',
      }
    }),
    prisma.tenant.create({
      data: {
        companyId: company.id,
        nombre: 'David Chen',
        apellidos: 'Wang',
        email: 'david.chen@example.com',
        telefono: '+34 645 789 012',
        dni: '55667788D',
        fechaNacimiento: new Date('1992-11-28'),
        nacionalidad: 'China',
        profesion: 'Consultor',
        empresaActual: 'McKinsey & Company',
        ingresosMensuales: 4200,
        estadoCivil: 'soltero',
      }
    }),
  ]);

  console.log('✅ Tenants created (4)');

  // ==========================================
  // CONTRACTS
  // ==========================================
  const contracts = await Promise.all([
    // Traditional contract
    prisma.contract.create({
      data: {
        companyId: company.id,
        unitId: units[0].id,
        tenantId: tenants[0].id,
        fechaInicio: subMonths(new Date(), 6),
        fechaFin: addMonths(new Date(), 6),
        rentaMensual: 1200,
        deposito: 2400,
        diaPago: 1,
        estado: 'activo',
        tipo: 'residencial',
      }
    }),
    // Another traditional contract
    prisma.contract.create({
      data: {
        companyId: company.id,
        unitId: units[4].id,
        tenantId: tenants[3].id,
        fechaInicio: subMonths(new Date(), 3),
        fechaFin: addMonths(new Date(), 9),
        rentaMensual: 1350,
        deposito: 2700,
        diaPago: 5,
        estado: 'activo',
        tipo: 'residencial',
      }
    }),
  ]);

  console.log('✅ Contracts created (2)');

  // ==========================================
  // ROOM CONTRACTS (Coliving)
  // ==========================================
  const roomContracts = await Promise.all([
    prisma.roomContract.create({
      data: {
        companyId: company.id,
        roomId: rooms[0].id,
        tenantId: tenants[1].id,
        fechaInicio: subMonths(new Date(), 4),
        fechaFin: addMonths(new Date(), 8),
        rentaMensual: 650,
        deposito: 650,
        diaPago: 1,
        estado: 'activo',
        gastosIncluidos: true,
        normasConvivencia: '# Normas de Convivencia\\n\\n1. Respeto mutuo\\n2. Limpieza común\\n3. Silencio nocturno 23:00-07:00'
      }
    }),
    prisma.roomContract.create({
      data: {
        companyId: company.id,
        roomId: rooms[1].id,
        tenantId: tenants[2].id,
        fechaInicio: subMonths(new Date(), 2),
        fechaFin: addMonths(new Date(), 10),
        rentaMensual: 500,
        deposito: 500,
        diaPago: 1,
        estado: 'activo',
        gastosIncluidos: true,
        normasConvivencia: '# Normas de Convivencia\\n\\n1. Respeto mutuo\\n2. Limpieza común\\n3. Silencio nocturno 23:00-07:00'
      }
    }),
  ]);

  console.log('✅ Room Contracts created (2)');

  // ==========================================
  // PAYMENTS
  // ==========================================
  const payments = await Promise.all([
    // Paid payment
    prisma.payment.create({
      data: {
        companyId: company.id,
        contractId: contracts[0].id,
        monto: 1200,
        concepto: 'Renta Noviembre 2025',
        fechaVencimiento: subDays(new Date(), 5),
        fechaPago: subDays(new Date(), 2),
        estado: 'pagado',
        metodoPago: 'transferencia',
      }
    }),
    // Pending payment
    prisma.payment.create({
      data: {
        companyId: company.id,
        contractId: contracts[0].id,
        monto: 1200,
        concepto: 'Renta Diciembre 2025',
        fechaVencimiento: addDays(new Date(), 2),
        estado: 'pendiente',
      }
    }),
    // Overdue payment
    prisma.payment.create({
      data: {
        companyId: company.id,
        contractId: contracts[1].id,
        monto: 1350,
        concepto: 'Renta Noviembre 2025',
        fechaVencimiento: subDays(new Date(), 10),
        estado: 'pendiente',
      }
    }),
  ]);

  console.log('✅ Payments created (3)');

  // ==========================================
  // BLOCKCHAIN TOKENS
  // ==========================================
  const propertyToken = await prisma.propertyToken.create({
    data: {
      companyId: company.id,
      buildingId: building1.id,
      nombre: 'Torre Vista Hermosa Token',
      simbolo: 'TVH',
      tokenSymbol: 'TVH',
      totalSupply: 10000,
      tokensPorPropiedad: 10000,
      valorPropiedad: 2000000,
      valorActual: 2150000,
      precioPorToken: 215,
      estado: 'active',
      blockchain: 'Polygon',
      tokenStandard: 'ERC-20',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    }
  });

  const tokenHolders = await Promise.all([
    prisma.tokenHolder.create({
      data: {
        companyId: company.id,
        tokenId: propertyToken.id,
        tenantId: tenants[0].id,
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        cantidadTokens: 500,
        inversionInicial: 100000,
        porcentajePropiedad: 5,
        rentasRecibidas: 4500,
        estado: 'active',
      }
    }),
    prisma.tokenHolder.create({
      data: {
        companyId: company.id,
        tokenId: propertyToken.id,
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2',
        cantidadTokens: 1000,
        inversionInicial: 200000,
        porcentajePropiedad: 10,
        rentasRecibidas: 9000,
        estado: 'active',
      }
    }),
  ]);

  console.log('✅ Blockchain tokens & holders created');

  // ==========================================
  // STR LISTINGS
  // ==========================================
  const strListings = await Promise.all([
    prisma.sTRListing.create({
      data: {
        companyId: company.id,
        unitId: units[3].id,
        titulo: 'Modern Studio in Barcelona Center',
        descripcion: 'Beautiful studio in the heart of Barcelona, perfect for couples or solo travelers.',
        precioNocheBajo: 65,
        precioNocheAlto: 95,
        precioNocheMedio: 80,
        numeroHuespedes: 2,
        numeroHabitaciones: 1,
        numeroBanos: 1,
        amenities: ['wifi', 'ac', 'kitchen', 'elevator', 'tv', 'workspace'],
        checkInDesde: '14:00',
        checkInHasta: '22:00',
        checkOut: '11:00',
        estado: 'activa',
        totalReservas: 45,
        tasaOcupacion: 78,
        ingresosTotales: 18500,
      }
    }),
    prisma.sTRListing.create({
      data: {
        companyId: company.id,
        unitId: units[4].id,
        titulo: 'Luxury Penthouse with Jacuzzi',
        descripcion: 'Exclusive penthouse with private jacuzzi and panoramic views of Barcelona.',
        precioNocheBajo: 120,
        precioNocheAlto: 180,
        precioNocheMedio: 150,
        numeroHuespedes: 4,
        numeroHabitaciones: 2,
        numeroBanos: 2,
        amenities: ['wifi', 'ac', 'kitchen', 'elevator', 'tv', 'workspace', 'jacuzzi', 'terrace'],
        checkInDesde: '15:00',
        checkInHasta: '23:00',
        checkOut: '12:00',
        estado: 'activa',
        totalReservas: 32,
        tasaOcupacion: 85,
        ingresosTotales: 24800,
      }
    }),
  ]);

  console.log('✅ STR Listings created (2)');

  // ==========================================
  // STR BOOKINGS
  // ==========================================
  await prisma.sTRBooking.create({
    data: {
      companyId: company.id,
      listingId: strListings[0].id,
      nombreHuesped: 'Sophie Laurent',
      emailHuesped: 'sophie.laurent@example.com',
      telefonoHuesped: '+33 6 12 34 56 78',
      fechaEntrada: addDays(new Date(), 5),
      fechaSalida: addDays(new Date(), 8),
      numNoches: 3,
      numHuespedes: 2,
      precioTotal: 270,
      comisionPlataforma: 27,
      impuestos: 20,
      ingresoNeto: 223,
      estado: 'confirmada',
      canalReserva: 'Booking.com',
    }
  });

  console.log('✅ STR Bookings created');

  // ==========================================
  // PROVIDERS
  // ==========================================
  const providers = await Promise.all([
    prisma.provider.create({
      data: {
        companyId: company.id,
        nombre: 'Fontanería Martínez',
        tipo: 'fontaneria',
        contacto: 'Juan Martínez',
        email: 'juan@fontaneria-martinez.es',
        telefono: '+34 678 123 456',
        valoracion: 4.8,
        numeroTrabajos: 45,
        activo: true,
      }
    }),
    prisma.provider.create({
      data: {
        companyId: company.id,
        nombre: 'Electricidad García',
        tipo: 'electricidad',
        contacto: 'Pedro García',
        email: 'pedro@electricidad-garcia.es',
        telefono: '+34 612 987 654',
        valoracion: 4.9,
        numeroTrabajos: 78,
        activo: true,
      }
    }),
  ]);

  console.log('✅ Providers created (2)');

  // ==========================================
  // MAINTENANCE REQUESTS
  // ==========================================
  await Promise.all([
    prisma.maintenanceRequest.create({
      data: {
        companyId: company.id,
        buildingId: building1.id,
        unitId: units[0].id,
        titulo: 'Fuga de agua en baño principal',
        descripcion: 'Se ha detectado una pequeña fuga en el grifo del lavabo',
        prioridad: 'alta',
        estado: 'pendiente',
        categoriaMantenimiento: 'fontaneria',
        reportadoPor: tenants[0].id,
      }
    }),
    prisma.maintenanceRequest.create({
      data: {
        companyId: company.id,
        buildingId: building2.id,
        titulo: 'Revisión ascensor',
        descripcion: 'Mantenimiento preventivo mensual del ascensor',
        prioridad: 'media',
        estado: 'en_progreso',
        categoriaMantenimiento: 'otros',
        asignadoA: providers[1].id,
      }
    }),
  ]);

  console.log('✅ Maintenance requests created (2)');

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  await Promise.all([
    prisma.notification.create({
      data: {
        companyId: company.id,
        userId: admin.id,
        tipo: 'payment_reminder',
        titulo: 'Pago pendiente',
        mensaje: 'Tienes 1 pago vencido que requiere atención',
        prioridad: 'alta',
        leido: false,
        entityType: 'payment',
        entityId: payments[2].id,
      }
    }),
    prisma.notification.create({
      data: {
        companyId: company.id,
        userId: admin.id,
        tipo: 'maintenance_assigned',
        titulo: 'Nueva solicitud de mantenimiento',
        mensaje: 'Se ha reportado una fuga de agua en Torre Vista Hermosa 3A',
        prioridad: 'media',
        leido: false,
        entityType: 'maintenance',
      }
    }),
  ]);

  console.log('✅ Notifications created (2)');

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n🎉 SEED COMPLETED SUCCESSFULLY!\n');
  console.log('==========================================');
  console.log('📊 DATABASE SUMMARY');
  console.log('==========================================');
  console.log('👤 Users: 2 (admin, gestor)');
  console.log('🏢 Buildings: 3');
  console.log('🏠 Units: 5 (traditional + coliving + STR)');
  console.log('🛏️ Rooms: 3 (coliving)');
  console.log('👥 Tenants: 4');
  console.log('📄 Contracts: 2 traditional + 2 room contracts');
  console.log('💳 Payments: 3 (1 paid, 1 pending, 1 overdue)');
  console.log('🔗 Blockchain: 1 token + 2 holders');
  console.log('🏖️ STR: 2 listings + 1 booking');
  console.log('🔧 Providers: 2');
  console.log('🛠️ Maintenance: 2 requests');
  console.log('🔔 Notifications: 2');
  console.log('==========================================\n');
  console.log('🔐 CREDENTIALS:');
  console.log('📧 Admin: admin@inmova.es / admin123');
  console.log('📧 Gestor: gestor@inmova.es / admin123');
  console.log('==========================================\n');
  console.log('🌐 Access at: https://homming-vidaro-6q1wdi.abacusai.app');
  console.log('==========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
