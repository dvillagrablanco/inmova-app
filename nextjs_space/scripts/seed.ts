import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar base de datos
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.building.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Base de datos limpiada');

  // Crear usuarios
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'John Doe',
      role: 'administrador',
    },
  });

  const gestorUser = await prisma.user.create({
    data: {
      email: 'gestor@vidaro.com',
      password: hashedAdminPassword,
      name: 'María García',
      role: 'gestor',
    },
  });

  console.log('✅ Usuarios creados');

  // Crear edificios
  const building1 = await prisma.building.create({
    data: {
      nombre: 'Edificio Plaza Mayor',
      direccion: 'Calle Gran Vía, 45, 28013 Madrid',
      tipo: 'residencial',
      anoConstructor: 2018,
      numeroUnidades: 12,
    },
  });

  const building2 = await prisma.building.create({
    data: {
      nombre: 'Centro Comercial Vista',
      direccion: 'Avenida Diagonal, 123, 08029 Barcelona',
      tipo: 'mixto',
      anoConstructor: 2015,
      numeroUnidades: 8,
    },
  });

  const building3 = await prisma.building.create({
    data: {
      nombre: 'Torres del Mar',
      direccion: 'Paseo Marítimo, 89, 29640 Málaga',
      tipo: 'residencial',
      anoConstructor: 2020,
      numeroUnidades: 6,
    },
  });

  console.log('✅ Edificios creados');

  // Crear inquilinos
  const tenant1 = await prisma.tenant.create({
    data: {
      nombreCompleto: 'Carlos Rodríguez Pérez',
      dni: '12345678A',
      email: 'carlos.rodriguez@email.com',
      telefono: '+34 612 345 678',
      fechaNacimiento: new Date('1985-03-15'),
      scoring: 85,
      nivelRiesgo: 'bajo',
      notas: 'Inquilino ejemplar, siempre paga puntual',
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      nombreCompleto: 'Ana María González',
      dni: '23456789B',
      email: 'ana.gonzalez@email.com',
      telefono: '+34 623 456 789',
      fechaNacimiento: new Date('1990-07-22'),
      scoring: 70,
      nivelRiesgo: 'medio',
      notas: 'Ocasionalmente con retrasos de 5-7 días',
    },
  });

  const tenant3 = await prisma.tenant.create({
    data: {
      nombreCompleto: 'David López Martínez',
      dni: '34567890C',
      email: 'david.lopez@email.com',
      telefono: '+34 634 567 890',
      fechaNacimiento: new Date('1988-11-10'),
      scoring: 90,
      nivelRiesgo: 'bajo',
    },
  });

  const tenant4 = await prisma.tenant.create({
    data: {
      nombreCompleto: 'Laura Fernández Ruiz',
      dni: '45678901D',
      email: 'laura.fernandez@email.com',
      telefono: '+34 645 678 901',
      fechaNacimiento: new Date('1992-05-18'),
      scoring: 60,
      nivelRiesgo: 'medio',
    },
  });

  const tenant5 = await prisma.tenant.create({
    data: {
      nombreCompleto: 'Miguel Sánchez Torres',
      dni: '56789012E',
      email: 'miguel.sanchez@email.com',
      telefono: '+34 656 789 012',
      fechaNacimiento: new Date('1983-09-25'),
      scoring: 45,
      nivelRiesgo: 'alto',
      notas: 'Ha tenido varios retrasos significativos en pagos',
    },
  });

  const tenant6 = await prisma.tenant.create({
    data: {
      nombreCompleto: 'Isabel Moreno García',
      dni: '67890123F',
      email: 'isabel.moreno@email.com',
      telefono: '+34 667 890 123',
      fechaNacimiento: new Date('1995-02-14'),
      scoring: 75,
      nivelRiesgo: 'bajo',
    },
  });

  const tenant7 = await prisma.tenant.create({
    data: {
      nombreCompleto: 'Javier Romero Díaz',
      dni: '78901234G',
      email: 'javier.romero@email.com',
      telefono: '+34 678 901 234',
      fechaNacimiento: new Date('1987-12-03'),
      scoring: 80,
      nivelRiesgo: 'bajo',
    },
  });

  const tenant8 = await prisma.tenant.create({
    data: {
      nombreCompleto: 'Comercial TechStart SL',
      dni: 'B12345678',
      email: 'info@techstart.com',
      telefono: '+34 910 123 456',
      fechaNacimiento: new Date('2015-01-01'),
      scoring: 95,
      nivelRiesgo: 'bajo',
      notas: 'Empresa tecnológica con excelente historial',
    },
  });

  console.log('✅ Inquilinos creados');

  // Crear unidades
  const unit1 = await prisma.unit.create({
    data: {
      numero: '1A',
      buildingId: building1.id,
      tipo: 'vivienda',
      estado: 'ocupada',
      superficie: 85.5,
      habitaciones: 3,
      banos: 2,
      rentaMensual: 1200,
      tenantId: tenant1.id,
    },
  });

  const unit2 = await prisma.unit.create({
    data: {
      numero: '2A',
      buildingId: building1.id,
      tipo: 'vivienda',
      estado: 'ocupada',
      superficie: 75.0,
      habitaciones: 2,
      banos: 1,
      rentaMensual: 950,
      tenantId: tenant2.id,
    },
  });

  const unit3 = await prisma.unit.create({
    data: {
      numero: '3A',
      buildingId: building1.id,
      tipo: 'vivienda',
      estado: 'disponible',
      superficie: 95.0,
      habitaciones: 3,
      banos: 2,
      rentaMensual: 1350,
    },
  });

  const unit4 = await prisma.unit.create({
    data: {
      numero: '1B',
      buildingId: building1.id,
      tipo: 'vivienda',
      estado: 'ocupada',
      superficie: 110.0,
      habitaciones: 4,
      banos: 2,
      rentaMensual: 1500,
      tenantId: tenant3.id,
    },
  });

  const unit5 = await prisma.unit.create({
    data: {
      numero: 'GR-1',
      buildingId: building1.id,
      tipo: 'garaje',
      estado: 'ocupada',
      superficie: 15.0,
      rentaMensual: 80,
      tenantId: tenant1.id,
    },
  });

  const unit6 = await prisma.unit.create({
    data: {
      numero: 'Local-1',
      buildingId: building2.id,
      tipo: 'local',
      estado: 'ocupada',
      superficie: 120.0,
      rentaMensual: 2500,
      tenantId: tenant8.id,
    },
  });

  const unit7 = await prisma.unit.create({
    data: {
      numero: 'Local-2',
      buildingId: building2.id,
      tipo: 'local',
      estado: 'disponible',
      superficie: 85.0,
      rentaMensual: 1800,
    },
  });

  const unit8 = await prisma.unit.create({
    data: {
      numero: '1A',
      buildingId: building2.id,
      tipo: 'vivienda',
      estado: 'ocupada',
      superficie: 90.0,
      habitaciones: 3,
      banos: 2,
      rentaMensual: 1100,
      tenantId: tenant4.id,
    },
  });

  const unit9 = await prisma.unit.create({
    data: {
      numero: '2A',
      buildingId: building2.id,
      tipo: 'vivienda',
      estado: 'en_mantenimiento',
      superficie: 88.0,
      habitaciones: 3,
      banos: 2,
      rentaMensual: 1050,
    },
  });

  const unit10 = await prisma.unit.create({
    data: {
      numero: 'AT-1',
      buildingId: building3.id,
      tipo: 'vivienda',
      estado: 'ocupada',
      superficie: 150.0,
      habitaciones: 4,
      banos: 3,
      rentaMensual: 2200,
      tenantId: tenant5.id,
    },
  });

  const unit11 = await prisma.unit.create({
    data: {
      numero: 'AT-2',
      buildingId: building3.id,
      tipo: 'vivienda',
      estado: 'ocupada',
      superficie: 145.0,
      habitaciones: 4,
      banos: 3,
      rentaMensual: 2100,
      tenantId: tenant6.id,
    },
  });

  const unit12 = await prisma.unit.create({
    data: {
      numero: 'AT-3',
      buildingId: building3.id,
      tipo: 'vivienda',
      estado: 'disponible',
      superficie: 140.0,
      habitaciones: 3,
      banos: 2,
      rentaMensual: 1950,
    },
  });

  const unit13 = await prisma.unit.create({
    data: {
      numero: 'PH',
      buildingId: building3.id,
      tipo: 'vivienda',
      estado: 'ocupada',
      superficie: 200.0,
      habitaciones: 5,
      banos: 4,
      rentaMensual: 3500,
      tenantId: tenant7.id,
    },
  });

  const unit14 = await prisma.unit.create({
    data: {
      numero: 'GR-A',
      buildingId: building3.id,
      tipo: 'garaje',
      estado: 'disponible',
      superficie: 18.0,
      rentaMensual: 100,
    },
  });

  const unit15 = await prisma.unit.create({
    data: {
      numero: 'TR-1',
      buildingId: building1.id,
      tipo: 'trastero',
      estado: 'ocupada',
      superficie: 8.0,
      rentaMensual: 50,
      tenantId: tenant3.id,
    },
  });

  console.log('✅ Unidades creadas');

  // Crear contratos
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);
  const in60Days = new Date(now);
  in60Days.setDate(in60Days.getDate() + 60);
  const in6Months = new Date(now);
  in6Months.setMonth(in6Months.getMonth() + 6);
  const in1Year = new Date(now);
  in1Year.setFullYear(in1Year.getFullYear() + 1);
  const in2Years = new Date(now);
  in2Years.setFullYear(in2Years.getFullYear() + 2);

  const contract1 = await prisma.contract.create({
    data: {
      unitId: unit1.id,
      tenantId: tenant1.id,
      fechaInicio: oneYearAgo,
      fechaFin: in1Year,
      rentaMensual: 1200,
      deposito: 2400,
      estado: 'activo',
      tipo: 'residencial',
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      unitId: unit2.id,
      tenantId: tenant2.id,
      fechaInicio: sixMonthsAgo,
      fechaFin: in6Months,
      rentaMensual: 950,
      deposito: 1900,
      estado: 'activo',
      tipo: 'residencial',
    },
  });

  const contract3 = await prisma.contract.create({
    data: {
      unitId: unit4.id,
      tenantId: tenant3.id,
      fechaInicio: oneYearAgo,
      fechaFin: in60Days,
      rentaMensual: 1500,
      deposito: 3000,
      estado: 'activo',
      tipo: 'residencial',
    },
  });

  const contract4 = await prisma.contract.create({
    data: {
      unitId: unit5.id,
      tenantId: tenant1.id,
      fechaInicio: oneYearAgo,
      fechaFin: in1Year,
      rentaMensual: 80,
      deposito: 160,
      estado: 'activo',
      tipo: 'residencial',
    },
  });

  const contract5 = await prisma.contract.create({
    data: {
      unitId: unit6.id,
      tenantId: tenant8.id,
      fechaInicio: twoMonthsAgo,
      fechaFin: in2Years,
      rentaMensual: 2500,
      deposito: 7500,
      estado: 'activo',
      tipo: 'comercial',
    },
  });

  const contract6 = await prisma.contract.create({
    data: {
      unitId: unit8.id,
      tenantId: tenant4.id,
      fechaInicio: sixMonthsAgo,
      fechaFin: in30Days,
      rentaMensual: 1100,
      deposito: 2200,
      estado: 'activo',
      tipo: 'residencial',
    },
  });

  const contract7 = await prisma.contract.create({
    data: {
      unitId: unit10.id,
      tenantId: tenant5.id,
      fechaInicio: monthAgo,
      fechaFin: in1Year,
      rentaMensual: 2200,
      deposito: 4400,
      estado: 'activo',
      tipo: 'residencial',
    },
  });

  const contract8 = await prisma.contract.create({
    data: {
      unitId: unit11.id,
      tenantId: tenant6.id,
      fechaInicio: sixMonthsAgo,
      fechaFin: in6Months,
      rentaMensual: 2100,
      deposito: 4200,
      estado: 'activo',
      tipo: 'residencial',
    },
  });

  const contract9 = await prisma.contract.create({
    data: {
      unitId: unit13.id,
      tenantId: tenant7.id,
      fechaInicio: oneYearAgo,
      fechaFin: in1Year,
      rentaMensual: 3500,
      deposito: 7000,
      estado: 'activo',
      tipo: 'residencial',
    },
  });

  const contract10 = await prisma.contract.create({
    data: {
      unitId: unit15.id,
      tenantId: tenant3.id,
      fechaInicio: oneYearAgo,
      fechaFin: in60Days,
      rentaMensual: 50,
      deposito: 100,
      estado: 'activo',
      tipo: 'residencial',
    },
  });

  console.log('✅ Contratos creados');

  // Crear pagos
  const createPaymentsForContract = async (
    contractId: string,
    rentaMensual: number,
    startDate: Date,
    paymentPattern: ('paid' | 'pending' | 'late')[]
  ) => {
    const payments = [];
    for (let i = 0; i < paymentPattern.length; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      
      const dueDate = new Date(paymentDate);
      dueDate.setDate(5);
      
      const pattern = paymentPattern[i];
      let estado: 'pagado' | 'pendiente' | 'atrasado' = 'pendiente';
      let fechaPago: Date | undefined = undefined;
      let nivelRiesgo: 'bajo' | 'medio' | 'alto' = 'bajo';
      
      if (pattern === 'paid') {
        estado = 'pagado';
        fechaPago = new Date(dueDate);
        fechaPago.setDate(fechaPago.getDate() + Math.floor(Math.random() * 5));
      } else if (pattern === 'late') {
        estado = 'atrasado';
        const daysLate = Math.floor(Math.random() * 20) + 5;
        if (daysLate > 15) nivelRiesgo = 'alto';
        else if (daysLate > 7) nivelRiesgo = 'medio';
      } else {
        const today = new Date();
        if (dueDate < today) {
          estado = 'atrasado';
          const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLate > 15) nivelRiesgo = 'alto';
          else if (daysLate > 7) nivelRiesgo = 'medio';
        }
      }
      
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const periodo = `${monthNames[paymentDate.getMonth()]} ${paymentDate.getFullYear()}`;
      
      payments.push(
        await prisma.payment.create({
          data: {
            contractId,
            periodo,
            monto: rentaMensual,
            fechaVencimiento: dueDate,
            fechaPago,
            estado,
            metodoPago: fechaPago ? (Math.random() > 0.5 ? 'Transferencia' : 'Domiciliación') : undefined,
            nivelRiesgo,
          },
        })
      );
    }
    return payments;
  };

  // Pagos para cada contrato
  await createPaymentsForContract(contract1.id, 1200, oneYearAgo, ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid']);
  await createPaymentsForContract(contract2.id, 950, sixMonthsAgo, ['paid', 'paid', 'late', 'paid', 'paid', 'pending', 'pending']);
  await createPaymentsForContract(contract3.id, 1500, oneYearAgo, ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid']);
  await createPaymentsForContract(contract4.id, 80, oneYearAgo, ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid']);
  await createPaymentsForContract(contract5.id, 2500, twoMonthsAgo, ['paid', 'paid', 'pending']);
  await createPaymentsForContract(contract6.id, 1100, sixMonthsAgo, ['paid', 'late', 'paid', 'late', 'paid', 'pending', 'pending']);
  await createPaymentsForContract(contract7.id, 2200, monthAgo, ['paid', 'late']);
  await createPaymentsForContract(contract8.id, 2100, sixMonthsAgo, ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'pending']);
  await createPaymentsForContract(contract9.id, 3500, oneYearAgo, ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid']);
  await createPaymentsForContract(contract10.id, 50, oneYearAgo, ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid']);

  console.log('✅ Pagos creados');

  // Crear solicitudes de mantenimiento
  await prisma.maintenanceRequest.create({
    data: {
      unitId: unit2.id,
      titulo: 'Fuga de agua en baño',
      descripcion: 'Se detecta fuga en la tubería del inodoro. Requiere atención urgente.',
      prioridad: 'alta',
      estado: 'en_progreso',
      fechaSolicitud: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      fechaProgramada: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      
      costoEstimado: 250,
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      unitId: unit9.id,
      titulo: 'Renovación de pintura interior',
      descripcion: 'Pintura completa de la vivienda antes de nuevo inquilino.',
      prioridad: 'media',
      estado: 'programado',
      fechaSolicitud: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      fechaProgramada: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      
      costoEstimado: 1200,
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      unitId: unit1.id,
      titulo: 'Revisión anual de caldera',
      descripcion: 'Mantenimiento preventivo obligatorio de caldera de gas.',
      prioridad: 'media',
      estado: 'pendiente',
      fechaSolicitud: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      costoEstimado: 80,
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      unitId: unit10.id,
      titulo: 'Reparación de persianas',
      descripcion: 'Las persianas del dormitorio principal no suben correctamente.',
      prioridad: 'baja',
      estado: 'pendiente',
      fechaSolicitud: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      costoEstimado: 150,
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      unitId: unit4.id,
      titulo: 'Cambio de cerradura',
      descripcion: 'Solicitud de cambio de cerradura de la puerta principal por seguridad.',
      prioridad: 'alta',
      estado: 'completado',
      fechaSolicitud: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      fechaProgramada: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      fechaCompletada: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      
      costoEstimado: 120,
      costoReal: 135,
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      unitId: unit13.id,
      titulo: 'Instalación de aire acondicionado',
      descripcion: 'Instalar dos splits en dormitorios principales.',
      prioridad: 'media',
      estado: 'completado',
      fechaSolicitud: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      fechaProgramada: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      fechaCompletada: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
      
      costoEstimado: 2500,
      costoReal: 2650,
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      unitId: unit6.id,
      titulo: 'Revisión sistema eléctrico',
      descripcion: 'Inspección general del sistema eléctrico del local comercial.',
      prioridad: 'alta',
      estado: 'programado',
      fechaSolicitud: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      fechaProgramada: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      
      costoEstimado: 350,
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      unitId: unit11.id,
      titulo: 'Limpieza de canalones',
      descripcion: 'Limpieza y revisión de canalones y desagües de terraza.',
      prioridad: 'baja',
      estado: 'pendiente',
      fechaSolicitud: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      costoEstimado: 100,
    },
  });

  console.log('✅ Solicitudes de mantenimiento creadas');

  // Crear proveedores
  const provider1 = await prisma.provider.create({
    data: {
      nombre: 'Fontanería Rápida SL',
      tipo: 'Fontanería',
      telefono: '+34 910 123 456',
      email: 'info@fontanerirapida.com',
      direccion: 'Calle Mayor, 34, 28013 Madrid',
      rating: 4.5,
      notas: 'Servicio rápido y profesional',
    },
  });

  const provider2 = await prisma.provider.create({
    data: {
      nombre: 'ElectroServicios García',
      tipo: 'Electricidad',
      telefono: '+34 932 456 789',
      email: 'contacto@electrogarcia.com',
      direccion: 'Avenida Diagonal, 567, 08029 Barcelona',
      rating: 4.8,
      notas: 'Electricista certificado, muy recomendable',
    },
  });

  const provider3 = await prisma.provider.create({
    data: {
      nombre: 'Limpiezas del Sur',
      tipo: 'Limpieza',
      telefono: '+34 951 789 012',
      email: 'info@limpiezasdelsur.com',
      rating: 4.2,
    },
  });

  const provider4 = await prisma.provider.create({
    data: {
      nombre: 'Reformas Integrales Madrid',
      tipo: 'Reformas',
      telefono: '+34 915 678 901',
      email: 'reformas@integral.com',
      direccion: 'Calle Alcalá, 123, 28009 Madrid',
      rating: 4.6,
    },
  });

  console.log('✅ Proveedores creados');

  // Crear gastos
  const expense1 = await prisma.expense.create({
    data: {
      buildingId: building1.id,
      concepto: 'Reparación ascensor',
      categoria: 'reparaciones',
      monto: 1250.00,
      fecha: new Date('2024-10-15'),
      providerId: provider4.id,
      notas: 'Reparación urgente del ascensor principal',
    },
  });

  const expense2 = await prisma.expense.create({
    data: {
      buildingId: building1.id,
      concepto: 'IBI 2024',
      categoria: 'impuestos',
      monto: 3200.00,
      fecha: new Date('2024-09-01'),
      notas: 'Impuesto sobre Bienes Inmuebles',
    },
  });

  const expense3 = await prisma.expense.create({
    data: {
      buildingId: building2.id,
      concepto: 'Seguro del edificio',
      categoria: 'seguros',
      monto: 2800.00,
      fecha: new Date('2024-08-10'),
      notas: 'Seguro anual multirriesgo',
    },
  });

  const expense4 = await prisma.expense.create({
    data: {
      unitId: (await prisma.unit.findFirst({ where: { numero: '1A', buildingId: building1.id } }))?.id,
      concepto: 'Reparación calefacción',
      categoria: 'mantenimiento',
      monto: 450.00,
      fecha: new Date('2024-11-05'),
      providerId: provider1.id,
    },
  });

  const expense5 = await prisma.expense.create({
    data: {
      buildingId: building3.id,
      concepto: 'Limpieza zonas comunes',
      categoria: 'servicios',
      monto: 680.00,
      fecha: new Date('2024-11-01'),
      providerId: provider3.id,
      notas: 'Limpieza mensual de noviembre',
    },
  });

  const expense6 = await prisma.expense.create({
    data: {
      buildingId: building2.id,
      concepto: 'Cuota de comunidad',
      categoria: 'comunidad',
      monto: 1500.00,
      fecha: new Date('2024-10-20'),
    },
  });

  console.log('✅ Gastos creados');

  // Actualizar maintenance requests con proveedores
  const maintenanceRequests = await prisma.maintenanceRequest.findMany();
  if (maintenanceRequests.length > 0) {
    await prisma.maintenanceRequest.update({
      where: { id: maintenanceRequests[0]?.id },
      data: { providerId: provider1.id },
    });
    if (maintenanceRequests.length > 1) {
      await prisma.maintenanceRequest.update({
        where: { id: maintenanceRequests[1]?.id },
        data: { providerId: provider2.id },
      });
    }
  }

  console.log('✅ Solicitudes de mantenimiento actualizadas con proveedores');

  // Crear notificaciones
  const notification1 = await prisma.notification.create({
    data: {
      tipo: 'pago_atrasado',
      titulo: 'Pago atrasado - Unidad 2B',
      mensaje: 'El pago del mes de noviembre de la unidad 2B está atrasado 15 días',
      leida: false,
      entityType: 'payment',
    },
  });

  const notification2 = await prisma.notification.create({
    data: {
      tipo: 'contrato_vencimiento',
      titulo: 'Contrato próximo a vencer',
      mensaje: 'El contrato de la unidad 1A vence en 25 días',
      leida: false,
      entityType: 'contract',
    },
  });

  const notification3 = await prisma.notification.create({
    data: {
      tipo: 'mantenimiento_urgente',
      titulo: 'Mantenimiento urgente - Fuga de agua',
      mensaje: 'Se reportó una fuga de agua en la unidad 3C que requiere atención inmediata',
      leida: false,
      entityType: 'maintenance',
    },
  });

  const notification4 = await prisma.notification.create({
    data: {
      tipo: 'unidad_vacante',
      titulo: 'Unidad vacante prolongada',
      mensaje: 'La unidad Local 1 lleva 60 días vacante',
      leida: true,
      entityType: 'unit',
    },
  });

  const notification5 = await prisma.notification.create({
    data: {
      tipo: 'info',
      titulo: 'Actualización del sistema',
      mensaje: 'El sistema Homming Vidaro ha sido actualizado con nuevas funcionalidades',
      leida: false,
      entityType: 'system',
    },
  });

  console.log('✅ Notificaciones creadas');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📊 Resumen:');
  console.log('  - Usuarios: 2');
  console.log('  - Edificios: 3');
  console.log('  - Unidades: 15');
  console.log('  - Inquilinos: 8');
  console.log('  - Contratos: 10');
  console.log('  - Pagos: 90+');
  console.log('  - Solicitudes de mantenimiento: 8');
  console.log('  - Proveedores: 4');
  console.log('  - Gastos: 6');
  console.log('  - Notificaciones: 5');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });