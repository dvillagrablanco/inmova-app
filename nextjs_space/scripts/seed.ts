import { PrismaClient, PaymentStatus, RiskLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar base de datos en orden correcto
  await prisma.maintenanceSchedule.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.message.deleteMany();
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
  await prisma.company.deleteMany();

  console.log('✅ Base de datos limpiada');

  // ========================================
  // CREAR EMPRESAS
  // ========================================
  const company1 = await prisma.company.create({
    data: {
      nombre: 'INMOVA',
      cif: 'B12345678',
      direccion: 'Calle de la Innovación, 25',
      telefono: '+34 910 123 456',
      email: 'info@inmova.com',
      codigoPostal: '28001',
      ciudad: 'Madrid',
      pais: 'España',
      colorPrimario: '#000000',
      colorSecundario: '#FFFFFF',
    },
  });

  const company2 = await prisma.company.create({
    data: {
      nombre: 'VIDARO INVERSIONES',
      cif: 'B87654321',
      direccion: 'Paseo de la Castellana, 120',
      telefono: '+34 911 987 654',
      email: 'contacto@vidaro.com',
      codigoPostal: '28046',
      ciudad: 'Madrid',
      pais: 'España',
      colorPrimario: '#1a56db',
      colorSecundario: '#f0f9ff',
    },
  });

  console.log('✅ Empresas creadas');

  // ========================================
  // CREAR USUARIOS - EMPRESA 1 (INMOVA)
  // ========================================
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@inmova.com',
      password: hashedPassword,
      name: 'Admin INMOVA',
      role: 'administrador',
      companyId: company1.id,
    },
  });

  // Usuario de testing (requerido para validación automática)
  const hashedTestPassword = await bcrypt.hash('johndoe123', 10);
  const testUser = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      password: hashedTestPassword,
      name: 'John Doe',
      role: 'administrador',
      companyId: company1.id,
    },
  });

  const gestor1 = await prisma.user.create({
    data: {
      email: 'gestor@inmova.com',
      password: hashedPassword,
      name: 'María García López',
      role: 'gestor',
      companyId: company1.id,
    },
  });

  const operador1 = await prisma.user.create({
    data: {
      email: 'operador@inmova.com',
      password: hashedPassword,
      name: 'Juan Martínez Ruiz',
      role: 'operador',
      companyId: company1.id,
    },
  });

  // ========================================
  // CREAR USUARIOS - EMPRESA 2 (VIDARO)
  // ========================================
  const admin2 = await prisma.user.create({
    data: {
      email: 'admin@vidaro.com',
      password: hashedPassword,
      name: 'Admin Vidaro',
      role: 'administrador',
      companyId: company2.id,
    },
  });

  const gestor2 = await prisma.user.create({
    data: {
      email: 'gestor@vidaro.com',
      password: hashedPassword,
      name: 'Laura Fernández',
      role: 'gestor',
      companyId: company2.id,
    },
  });

  console.log('✅ Usuarios creados (5 usuarios)');

  // ========================================
  // DATOS DE EMPRESA 1 - INMOVA
  // ========================================

  // Edificios INMOVA
  const building1 = await prisma.building.create({
    data: {
      companyId: company1.id,
      nombre: 'Edificio Plaza Mayor',
      direccion: 'Calle Gran Vía, 45, 28013 Madrid',
      tipo: 'residencial',
      anoConstructor: 2018,
      numeroUnidades: 6,
      ascensor: true,
      garaje: true,
      gastosComunidad: 120,
      ibiAnual: 800,
    },
  });

  const building2 = await prisma.building.create({
    data: {
      companyId: company1.id,
      nombre: 'Centro Comercial Vista',
      direccion: 'Avenida Diagonal, 123, 08029 Barcelona',
      tipo: 'mixto',
      anoConstructor: 2015,
      numeroUnidades: 4,
      ascensor: true,
      garaje: false,
    },
  });

  // Inquilinos INMOVA
  const hashedTenantPassword = await bcrypt.hash('inquilino123', 10);

  const tenant1 = await prisma.tenant.create({
    data: {
      companyId: company1.id,
      nombreCompleto: 'Carlos Rodríguez Pérez',
      dni: '12345678A',
      email: 'carlos.rodriguez@email.com',
      password: hashedTenantPassword,
      telefono: '+34 612 345 678',
      fechaNacimiento: new Date('1985-03-15'),
      situacionLaboral: 'empleado',
      ingresosMensuales: 3500,
      scoring: 85,
      nivelRiesgo: 'bajo',
      notas: 'Inquilino ejemplar',
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      companyId: company1.id,
      nombreCompleto: 'Ana Martínez Silva',
      dni: '87654321B',
      email: 'ana.martinez@email.com',
      password: hashedTenantPassword,
      telefono: '+34 623 456 789',
      fechaNacimiento: new Date('1990-07-22'),
      situacionLaboral: 'autonomo',
      ingresosMensuales: 2800,
      scoring: 72,
      nivelRiesgo: 'medio',
      notas: 'Buen inquilino',
    },
  });

  const tenant3 = await prisma.tenant.create({
    data: {
      companyId: company1.id,
      nombreCompleto: 'Pedro López García',
      dni: '11223344C',
      email: 'pedro.lopez@email.com',
      telefono: '+34 634 567 890',
      fechaNacimiento: new Date('1978-11-05'),
      situacionLaboral: 'empleado',
      ingresosMensuales: 4200,
      scoring: 90,
      nivelRiesgo: 'bajo',
      notas: 'Excelente historial',
    },
  });

  // Unidades INMOVA - Edificio 1
  const unit1 = await prisma.unit.create({
    data: {
      buildingId: building1.id,
      numero: '1A',
      tipo: 'vivienda',
      estado: 'ocupada',
      superficie: 85,
      habitaciones: 3,
      banos: 2,
      planta: 1,
      rentaMensual: 1200,
      tenantId: tenant1.id,
      aireAcondicionado: true,
      calefaccion: true,
    },
  });

  const unit2 = await prisma.unit.create({
    data: {
      buildingId: building1.id,
      numero: '2B',
      tipo: 'vivienda',
      estado: 'ocupada',
      superficie: 95,
      habitaciones: 3,
      banos: 2,
      planta: 2,
      rentaMensual: 1350,
      tenantId: tenant2.id,
      aireAcondicionado: true,
      calefaccion: true,
      terraza: true,
    },
  });

  const unit3 = await prisma.unit.create({
    data: {
      buildingId: building1.id,
      numero: '3C',
      tipo: 'vivienda',
      estado: 'disponible',
      superficie: 78,
      habitaciones: 2,
      banos: 1,
      planta: 3,
      rentaMensual: 950,
      aireAcondicionado: false,
      calefaccion: true,
    },
  });

  // Unidades INMOVA - Edificio 2
  const unit4 = await prisma.unit.create({
    data: {
      buildingId: building2.id,
      numero: 'Local-1',
      tipo: 'local',
      estado: 'ocupada',
      superficie: 120,
      planta: 0,
      rentaMensual: 2500,
      tenantId: tenant3.id,
    },
  });

  const unit5 = await prisma.unit.create({
    data: {
      buildingId: building2.id,
      numero: 'Local-2',
      tipo: 'local',
      estado: 'disponible',
      superficie: 80,
      planta: 0,
      rentaMensual: 1800,
    },
  });

  console.log('✅ Edificios, inquilinos y unidades INMOVA creados');

  // Contratos INMOVA
  const contract1 = await prisma.contract.create({
    data: {
      unitId: unit1.id,
      tenantId: tenant1.id,
      fechaInicio: new Date('2023-01-01'),
      fechaFin: new Date('2025-12-31'),
      rentaMensual: 1200,
      deposito: 1200,
      estado: 'activo',
      tipo: 'residencial',
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      unitId: unit2.id,
      tenantId: tenant2.id,
      fechaInicio: new Date('2023-06-01'),
      fechaFin: new Date('2024-05-31'),
      rentaMensual: 1350,
      deposito: 1350,
      estado: 'activo',
      tipo: 'residencial',
    },
  });

  const contract3 = await prisma.contract.create({
    data: {
      unitId: unit4.id,
      tenantId: tenant3.id,
      fechaInicio: new Date('2022-03-01'),
      fechaFin: new Date('2027-02-28'),
      rentaMensual: 2500,
      deposito: 5000,
      estado: 'activo',
      tipo: 'comercial',
    },
  });

  // Pagos INMOVA
  const now = new Date();
  const payments = [];

  // Últimos 6 meses de pagos para contrato 1
  for (let i = 0; i < 6; i++) {
    const periodo = new Date(now.getFullYear(), now.getMonth() - i, 1);
    payments.push({
      contractId: contract1.id,
      periodo: periodo.toISOString().slice(0, 7),
      monto: 1200,
      fechaVencimiento: new Date(periodo.getFullYear(), periodo.getMonth(), 5),
      fechaPago: i > 1 ? new Date(periodo.getFullYear(), periodo.getMonth(), 3) : undefined,
      estado: (i === 0 ? 'pendiente' : i === 1 ? 'atrasado' : 'pagado') as PaymentStatus,
      nivelRiesgo: (i === 0 ? 'bajo' : i === 1 ? 'alto' : 'bajo') as RiskLevel,
    });
  }

  // Últimos 6 meses de pagos para contrato 2
  for (let i = 0; i < 6; i++) {
    const periodo = new Date(now.getFullYear(), now.getMonth() - i, 1);
    payments.push({
      contractId: contract2.id,
      periodo: periodo.toISOString().slice(0, 7),
      monto: 1350,
      fechaVencimiento: new Date(periodo.getFullYear(), periodo.getMonth(), 1),
      fechaPago: i > 0 ? new Date(periodo.getFullYear(), periodo.getMonth(), 1) : undefined,
      estado: (i === 0 ? 'pendiente' : 'pagado') as PaymentStatus,
      nivelRiesgo: 'bajo' as RiskLevel,
    });
  }

  await prisma.payment.createMany({ data: payments });

  console.log('✅ Contratos y pagos INMOVA creados');

  // Proveedores INMOVA
  const provider1 = await prisma.provider.create({
    data: {
      companyId: company1.id,
      nombre: 'Fontanería Rápida SL',
      tipo: 'Fontanería',
      telefono: '+34 910 111 222',
      email: 'info@fontaneriarpida.com',
      rating: 4.5,
    },
  });

  const provider2 = await prisma.provider.create({
    data: {
      companyId: company1.id,
      nombre: 'Electricistas Madrid',
      tipo: 'Electricidad',
      telefono: '+34 911 222 333',
      email: 'contacto@electricistasmadrid.com',
      rating: 4.8,
    },
  });

  // Solicitudes de mantenimiento INMOVA
  await prisma.maintenanceRequest.create({
    data: {
      unitId: unit1.id,
      titulo: 'Fuga de agua en baño',
      descripcion: 'Se detecta fuga en grifo del baño principal',
      prioridad: 'alta',
      estado: 'en_progreso',
      providerId: provider1.id,
      costoEstimado: 150,
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      unitId: unit2.id,
      titulo: 'Revisión instalación eléctrica',
      descripcion: 'Chequeo general de cuadro eléctrico',
      prioridad: 'media',
      estado: 'pendiente',
      providerId: provider2.id,
      costoEstimado: 200,
    },
  });

  // Mantenimiento preventivo INMOVA
  await prisma.maintenanceSchedule.create({
    data: {
      titulo: 'ITE (Inspección Técnica de Edificios)',
      descripcion: 'Inspección obligatoria para edificios de más de 50 años',
      tipo: 'Inspección',
      buildingId: building1.id,
      frecuencia: 'anual',
      proximaFecha: new Date(now.getFullYear(), now.getMonth() + 2, 15),
      diasAnticipacion: 30,
      costoEstimado: 800,
    },
  });

  await prisma.maintenanceSchedule.create({
    data: {
      titulo: 'Revisión de ascensores',
      descripcion: 'Mantenimiento trimestral obligatorio',
      tipo: 'Mantenimiento',
      buildingId: building1.id,
      frecuencia: 'trimestral',
      proximaFecha: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
      providerId: provider1.id,
      diasAnticipacion: 15,
      costoEstimado: 300,
    },
  });

  // Gastos INMOVA
  await prisma.expense.create({
    data: {
      buildingId: building1.id,
      concepto: 'IBI Anual 2024',
      categoria: 'impuestos',
      monto: 800,
      fecha: new Date(now.getFullYear(), 0, 15),
    },
  });

  await prisma.expense.create({
    data: {
      unitId: unit1.id,
      providerId: provider1.id,
      concepto: 'Reparación fontanería',
      categoria: 'reparaciones',
      monto: 145,
      fecha: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
    },
  });

  // Notificaciones INMOVA
  await prisma.notification.create({
    data: {
      companyId: company1.id,
      userId: admin1.id,
      tipo: 'pago_atrasado',
      titulo: 'Pago Atrasado',
      mensaje: `El inquilino ${tenant1.nombreCompleto} tiene un pago atrasado de 1200€`,
      prioridad: 'alto',
      leida: false,
    },
  });

  await prisma.notification.create({
    data: {
      companyId: company1.id,
      userId: gestor1.id,
      tipo: 'mantenimiento_urgente',
      titulo: 'Mantenimiento Urgente',
      mensaje: 'Fuga de agua en unidad 1A - Edificio Plaza Mayor',
      prioridad: 'alto',
      leida: false,
    },
  });

  console.log('✅ Proveedores, mantenimiento y notificaciones INMOVA creados');

  // ========================================
  // DATOS DE EMPRESA 2 - VIDARO
  // ========================================

  // Edificios VIDARO
  const building3 = await prisma.building.create({
    data: {
      companyId: company2.id,
      nombre: 'Residencial Los Olivos',
      direccion: 'Calle de la Paz, 78, 28050 Madrid',
      tipo: 'residencial',
      anoConstructor: 2019,
      numeroUnidades: 4,
      ascensor: true,
      piscina: true,
      jardin: true,
      gastosComunidad: 150,
    },
  });

  // Inquilinos VIDARO
  const tenant4 = await prisma.tenant.create({
    data: {
      companyId: company2.id,
      nombreCompleto: 'Laura Sánchez Díaz',
      dni: '22334455D',
      email: 'laura.sanchez@email.com',
      password: hashedTenantPassword,
      telefono: '+34 645 678 901',
      fechaNacimiento: new Date('1992-04-18'),
      situacionLaboral: 'empleado',
      ingresosMensuales: 3200,
      scoring: 88,
      nivelRiesgo: 'bajo',
    },
  });

  // Unidades VIDARO
  const unit6 = await prisma.unit.create({
    data: {
      buildingId: building3.id,
      numero: '1A',
      tipo: 'vivienda',
      estado: 'ocupada',
      superficie: 100,
      habitaciones: 3,
      banos: 2,
      planta: 1,
      rentaMensual: 1500,
      tenantId: tenant4.id,
      aireAcondicionado: true,
      calefaccion: true,
      terraza: true,
    },
  });

  const unit7 = await prisma.unit.create({
    data: {
      buildingId: building3.id,
      numero: '2A',
      tipo: 'vivienda',
      estado: 'disponible',
      superficie: 90,
      habitaciones: 2,
      banos: 2,
      planta: 2,
      rentaMensual: 1300,
      aireAcondicionado: true,
      calefaccion: true,
    },
  });

  // Contrato VIDARO
  const contract4 = await prisma.contract.create({
    data: {
      unitId: unit6.id,
      tenantId: tenant4.id,
      fechaInicio: new Date('2024-01-01'),
      fechaFin: new Date('2026-12-31'),
      rentaMensual: 1500,
      deposito: 1500,
      estado: 'activo',
      tipo: 'residencial',
    },
  });

  // Pagos VIDARO
  const paymentsVidaro = [];
  for (let i = 0; i < 3; i++) {
    const periodo = new Date(now.getFullYear(), now.getMonth() - i, 1);
    paymentsVidaro.push({
      contractId: contract4.id,
      periodo: periodo.toISOString().slice(0, 7),
      monto: 1500,
      fechaVencimiento: new Date(periodo.getFullYear(), periodo.getMonth(), 1),
      fechaPago: i > 0 ? new Date(periodo.getFullYear(), periodo.getMonth(), 1) : undefined,
      estado: (i === 0 ? 'pendiente' : 'pagado') as PaymentStatus,
      nivelRiesgo: 'bajo' as RiskLevel,
    });
  }
  await prisma.payment.createMany({ data: paymentsVidaro });

  // Proveedores VIDARO
  const provider3 = await prisma.provider.create({
    data: {
      companyId: company2.id,
      nombre: 'Mantenimiento Integral',
      tipo: 'Mantenimiento General',
      telefono: '+34 912 333 444',
      email: 'info@mantintegral.com',
      rating: 4.7,
    },
  });

  // Notificaciones VIDARO
  await prisma.notification.create({
    data: {
      companyId: company2.id,
      userId: admin2.id,
      tipo: 'unidad_vacante',
      titulo: 'Unidad Disponible',
      mensaje: 'La unidad 2A en Residencial Los Olivos está disponible para alquiler',
      prioridad: 'medio',
      leida: false,
    },
  });

  console.log('✅ Datos VIDARO creados');

  // ========================================
  // ESPACIOS COMUNES Y RESERVAS
  // ========================================
  const commonSpace1 = await prisma.commonSpace.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      nombre: 'Sal\u00f3n de Eventos',
      tipo: 'salon_fiestas',
      capacidadMaxima: 50,
      descripcion: 'Amplio sal\u00f3n con cocina equipada y terraza',
      costoPorHora: 25.00,
      horaApertura: '09:00',
      horaCierre: '22:00',
    },
  });

  const commonSpace2 = await prisma.commonSpace.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      nombre: 'Gimnasio',
      tipo: 'gimnasio',
      capacidadMaxima: 15,
      descripcion: 'Gimnasio equipado con m\u00e1quinas de cardio y pesas',
      costoPorHora: 0.00,
      horaApertura: '06:00',
      horaCierre: '23:00',
    },
  });

  const commonSpace3 = await prisma.commonSpace.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      nombre: 'Piscina Comunitaria',
      tipo: 'piscina',
      capacidadMaxima: 30,
      descripcion: 'Piscina climatizada con zona de solarium',
      costoPorHora: 0.00,
      horaApertura: '10:00',
      horaCierre: '20:00',
    },
  });

  // Reservas
  await prisma.spaceReservation.create({
    data: {
      spaceId: commonSpace1.id,
      tenantId: tenant1.id,
      companyId: company1.id,
      fechaReserva: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
      horaInicio: '18:00',
      horaFin: '22:00',
      monto: 100.00,
      estado: 'confirmada',
      pagado: true,
      observaciones: 'Cumplea\u00f1os familiar',
    },
  });

  await prisma.spaceReservation.create({
    data: {
      spaceId: commonSpace1.id,
      tenantId: tenant2.id,
      companyId: company1.id,
      fechaReserva: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
      horaInicio: '11:00',
      horaFin: '16:00',
      monto: 125.00,
      estado: 'pendiente',
      pagado: false,
    },
  });

  console.log('\u2705 Espacios comunes y reservas creados');

  // ========================================
  // SEGUROS
  // ========================================
  await prisma.insurance.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      numeroPoliza: 'INS-2024-001',
      aseguradora: 'Mapfre',
      tipo: 'comunidad',
      nombreAsegurado: 'INMOVA',
      fechaInicio: new Date('2024-01-01'),
      fechaVencimiento: new Date('2025-01-01'),
      sumaAsegurada: 500000.00,
      primaMensual: 250.00,
      cobertura: 'Daños estructurales, Incendio, Responsabilidad civil, Robo',
      estado: 'activa',
    },
  });

  await prisma.insurance.create({
    data: {
      unitId: unit1.id,
      companyId: company1.id,
      numeroPoliza: 'INS-2024-002',
      aseguradora: 'Allianz',
      tipo: 'hogar',
      nombreAsegurado: tenant1.nombreCompleto,
      fechaInicio: new Date('2024-06-01'),
      fechaVencimiento: new Date('2025-06-01'),
      sumaAsegurada: 30000.00,
      primaMensual: 45.00,
      primaAnual: 540.00,
      cobertura: 'Contenidos, Robo, Daños por agua',
      estado: 'activa',
    },
  });

  console.log('\u2705 Seguros creados');

  // ========================================
  // CERTIFICACIONES ENERG\u00c9TICAS
  // ========================================
  await prisma.energyCertificate.create({
    data: {
      unitId: unit1.id,
      companyId: company1.id,
      calificacion: 'B',
      consumoEnergetico: 85.5,
      emisionesCO2: 15.2,
      nombreTecnico: 'Juan P\u00e9rez Mart\u00ednez',
      numeroCertificado: 'CERT-2024-MAD-001',
      fechaEmision: new Date('2024-01-15'),
      fechaVencimiento: new Date('2034-01-15'),
      vigente: true,
      recomendaciones: 'Instalar ventanas de doble acristalamiento para mejorar eficiencia',
      ahorroEstimado: 150.00,
    },
  });

  await prisma.energyCertificate.create({
    data: {
      unitId: unit2.id,
      companyId: company1.id,
      calificacion: 'C',
      consumoEnergetico: 120.3,
      emisionesCO2: 22.8,
      nombreTecnico: 'Ana L\u00f3pez Garc\u00eda',
      numeroCertificado: 'CERT-2024-MAD-002',
      fechaEmision: new Date('2024-02-10'),
      fechaVencimiento: new Date('2034-02-10'),
      vigente: true,
      recomendaciones: 'Mejorar aislamiento t\u00e9rmico de la fachada',
      ahorroEstimado: 200.00,
    },
  });

  console.log('\u2705 Certificaciones energ\u00e9ticas creadas');

  // ========================================
  // INCIDENCIAS COMUNITARIAS
  // ========================================
  await prisma.communityIncident.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      titulo: 'Ascensor averiado en portal A',
      descripcion: 'El ascensor principal no funciona desde esta ma\u00f1ana',
      tipo: 'averia_comun',
      prioridad: 'alta',
      ubicacion: 'Portal A - Ascensor Principal',
      reportedBy: admin1.id,
      reporterType: 'administrador',
      estado: 'abierta',
      fechaReporte: new Date(),
    },
  });

  await prisma.communityIncident.create({
    data: {
      buildingId: building1.id,
      unitId: unit1.id,
      companyId: company1.id,
      titulo: 'Filtraci\u00f3n de agua en garaje',
      descripcion: 'Se observa filtraci\u00f3n de agua en la plaza de garaje 15',
      tipo: 'averia_comun',
      prioridad: 'media',
      ubicacion: 'Garaje - Plaza 15',
      reportedBy: tenant1.id,
      reporterType: 'inquilino',
      estado: 'en_proceso',
      asignadoA: provider1.id,
      fechaReporte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.communityIncident.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      titulo: 'Ruidos molestos en planta 3',
      descripcion: 'Vecinos reportan ruidos excesivos durante la noche',
      tipo: 'convivencia',
      prioridad: 'baja',
      ubicacion: 'Planta 3',
      reportedBy: admin1.id,
      reporterType: 'administrador',
      estado: 'resuelta',
      fechaReporte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      fechaResolucion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      solucion: 'Se ha hablado con los vecinos y han aceptado reducir el ruido',
    },
  });

  console.log('\u2705 Incidencias comunitarias creadas');

  // ========================================
  // VOTACIONES COMUNITARIAS
  // ========================================
  const vote1 = await prisma.communityVote.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      titulo: 'Instalaci\u00f3n de placas solares en el edificio',
      descripcion: 'Propuesta para instalar paneles solares en la azotea para reducir costes energ\u00e9ticos',
      tipo: 'decision_comunidad',
      opciones: ['A favor', 'En contra', 'Abstenci\u00f3n'],
      fechaInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      fechaCierre: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      requiereQuorum: true,
      quorumNecesario: 50,
      totalElegibles: 20,
      estado: 'activa',
      creadoPor: admin1.id,
    },
  });

  // Votos emitidos
  await prisma.voteRecord.createMany({
    data: [
      {
        voteId: vote1.id,
        tenantId: tenant1.id,
        opcionSeleccionada: 'A favor',
      },
      {
        voteId: vote1.id,
        tenantId: tenant2.id,
        opcionSeleccionada: 'A favor',
      },
      {
        voteId: vote1.id,
        tenantId: tenant3.id,
        opcionSeleccionada: 'En contra',
      },
    ],
  });

  const vote2 = await prisma.communityVote.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      titulo: 'Renovaci\u00f3n del sistema de calefacci\u00f3n',
      descripcion: 'Votaci\u00f3n para aprobar la renovaci\u00f3n completa del sistema de calefacci\u00f3n central',
      tipo: 'gasto',
      opciones: ['S\u00ed', 'No'],
      fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      fechaCierre: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      requiereQuorum: true,
      quorumNecesario: 60,
      totalElegibles: 20,
      estado: 'cerrada',
      opcionGanadora: 'S\u00ed',
      creadoPor: admin1.id,
    },
  });

  console.log('\u2705 Votaciones comunitarias creadas');

  // ========================================
  // ANUNCIOS
  // ========================================
  await prisma.communityAnnouncement.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      titulo: 'Corte de agua programado',
      contenido: 'Se informa que el pr\u00f3ximo jueves 5 de diciembre habr\u00e1 un corte de agua de 9:00 a 14:00 horas por mantenimiento de las tuber\u00edas generales.',
      tipo: 'aviso',
      importante: true,
      fechaExpiracion: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      publicadoPor: admin1.id,
    },
  });

  await prisma.communityAnnouncement.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      titulo: 'Fiesta de Navidad de la Comunidad',
      contenido: 'Invitamos a todos los vecinos a la fiesta de Navidad el s\u00e1bado 21 de diciembre a las 18:00 en el sal\u00f3n de eventos.',
      tipo: 'evento',
      importante: false,
      fechaExpiracion: new Date('2025-12-22'),
      publicadoPor: admin1.id,
    },
  });

  await prisma.communityAnnouncement.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      titulo: 'Nuevas normas de uso del gimnasio',
      contenido: 'Se recuerda a todos los usuarios del gimnasio que deben traer su propia toalla y limpiar las m\u00e1quinas despu\u00e9s de su uso.',
      tipo: 'informativo',
      importante: false,
      publicadoPor: gestor1.id,
    },
  });

  console.log('\u2705 Anuncios creados');

  // ========================================
  // REUNIONES Y ACTAS
  // ========================================
  await prisma.communityMeeting.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      titulo: 'Junta Ordinaria de Propietarios',
      tipo: 'decision_comunidad',
      fechaReunion: new Date('2025-12-15T18:00:00'),
      ubicacion: 'Sal\u00f3n de Eventos - Edificio Residencial Sol',
      ordenDel: '1. Lectura y aprobaci\u00f3n del acta anterior\\n2. Estado de cuentas\\n3. Propuesta instalaci\u00f3n placas solares\\n4. Ruegos y preguntas',
      asistentes: `${tenant1.nombreCompleto}, ${tenant2.nombreCompleto}, ${tenant3.nombreCompleto}`,
      acuerdos: ['Aprobaci\u00f3n del acta anterior por unanimidad', 'Aprobaci\u00f3n del presupuesto anual'],
      estado: 'programada',
      organizadoPor: admin1.id,
    },
  });

  await prisma.communityMeeting.create({
    data: {
      buildingId: building1.id,
      companyId: company1.id,
      titulo: 'Junta Extraordinaria - Renovaci\u00f3n Calefacci\u00f3n',
      tipo: 'gasto',
      fechaReunion: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      ubicacion: 'Sal\u00f3n de Eventos',
      ordenDel: 'Aprobaci\u00f3n de la renovaci\u00f3n del sistema de calefacci\u00f3n central',
      asistentes: '15 propietarios presentes de 20 totales',
      acuerdos: ['Aprobada la renovaci\u00f3n de la calefacci\u00f3n con 12 votos a favor y 3 en contra'],
      actaFirmada: true,
      estado: 'realizada',
      organizadoPor: admin1.id,
    },
  });

  console.log('\u2705 Reuniones creadas');

  // ========================================
  // GALER\u00cdAS MULTIMEDIA
  // ========================================
  const gallery1 = await prisma.propertyGallery.create({
    data: {
      unitId: unit1.id,
      companyId: company1.id,
      portada: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      urlTourVirtual: 'https://my.matterport.com/show/?m=demo123',
      usarMarcaAgua: true,
    },
  });

  await prisma.galleryItem.createMany({
    data: [
      {
        galleryId: gallery1.id,
        tipo: 'foto',
        habitacion: 'Sal\u00f3n',
        url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0',
        titulo: 'Sal\u00f3n principal',
        orden: 1,
        destacada: true,
      },
      {
        galleryId: gallery1.id,
        tipo: 'foto',
        habitacion: 'Cocina',
        url: 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
        titulo: 'Cocina equipada',
        orden: 2,
      },
      {
        galleryId: gallery1.id,
        tipo: 'foto',
        habitacion: 'Dormitorio',
        url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0',
        titulo: 'Dormitorio principal',
        orden: 3,
      },
      {
        galleryId: gallery1.id,
        tipo: 'video',
        habitacion: 'General',
        url: 'https://www.youtube.com/watch?v=demo',
        titulo: 'Tour virtual del apartamento',
        orden: 4,
        duracion: 180,
      },
    ],
  });

  console.log('\u2705 Galer\u00edas multimedia creadas');

  // ========================================
  // \u00d3RDENES DE TRABAJO (PROVEEDOR)
  // ========================================
  await prisma.providerWorkOrder.create({
    data: {
      providerId: provider1.id,
      buildingId: building1.id,
      unitId: unit1.id,
      companyId: company1.id,
      titulo: 'Reparaci\u00f3n fuga de agua en ba\u00f1o',
      descripcion: 'Fuga de agua detectada en tuber\u00eda del ba\u00f1o principal',
      tipo: 'fontaneria',
      estado: 'asignada',
      asignadoPor: admin1.id,
    },
  });

  await prisma.providerWorkOrder.create({
    data: {
      providerId: provider2.id,
      buildingId: building1.id,
      companyId: company1.id,
      titulo: 'Revisi\u00f3n sistema el\u00e9ctrico portal B',
      descripcion: 'Revisi\u00f3n anual del cuadro el\u00e9ctrico general',
      tipo: 'electricidad',
      estado: 'en_progreso',
      fechaInicio: new Date(),
      asignadoPor: gestor1.id,
      horasTrabajadas: 2.5,
      costoManoObra: 150.00,
    },
  });

  await prisma.providerWorkOrder.create({
    data: {
      providerId: provider1.id,
      buildingId: building1.id,
      companyId: company1.id,
      titulo: 'Pintura de fachada',
      descripcion: 'Pintura completa de la fachada principal del edificio',
      tipo: 'pintura',
      estado: 'completada',
      fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      fechaCompletado: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      asignadoPor: admin1.id,
      horasTrabajadas: 40,
      costoMateriales: 1500.00,
      costoManoObra: 2000.00,
      costoTotal: 3500.00,
      valoracion: 5,
      comentarios: 'Trabajo impecable, muy profesionales',
    },
  });

  console.log('\u2705 \u00d3rdenes de trabajo creadas');

  // ========================================
  // SCREENING Y VALORACIONES
  // ========================================
  const screening1 = await prisma.screeningCandidato.create({
    data: {
      candidateId: candidate1.id,
      companyId: company1.id,
      estado: 'verificado',
      puntosIdentidad: 18,
      puntosLaboral: 16,
      puntosEconomica: 20,
      puntosReferencias: 14,
      puntosAntecedentes: 20,
      puntosTotal: 88,
      nivelRiesgoGlobal: 'bajo',
      documentosRequeridos: ['DNI', 'N\u00f3minas', 'Contrato laboral', 'Referencias'],
      documentosRecibidos: ['DNI', 'N\u00f3minas', 'Contrato laboral'],
      flagsRiesgo: [],
      recomendacion: 'RECOMENDADO - Candidato con perfil s\u00f3lido',
      revisadoPor: admin1.id,
      fechaRevision: new Date(),
    },
  });

  console.log('\u2705 Screening creado');

  // ========================================
  // VALORACIONES DE PROPIEDADES
  // ========================================
  await prisma.valoracionPropiedad.create({
    data: {
      tipo: 'confirmacion',
      variables: ['nombre', 'fecha', 'hora'],
      activa: true,
    },
  });

  await prisma.sMSLog.createMany({
    data: [
      {
        companyId: company1.id,
        tenantId: tenant1.id,
        tipo: 'recordatorio',
        mensaje: `Hola ${tenant1.nombreCompleto}, te recordamos que el pago de 1200\u20ac vence el ${new Date(now.getFullYear(), now.getMonth(), 5).toLocaleDateString()}. Gracias.`,
        numeroDestino: tenant1.telefono || '+34 600 000 001',
        estado: 'enviado',
        fechaEnvio: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        costeEuro: 0.05,
        envioProgramado: false,
        exito: true,
      },
      {
        companyId: company1.id,
        tenantId: tenant2.id,
        tipo: 'aviso',
        mensaje: 'Aviso: Corte de agua programado para el jueves de 9:00 a 14:00h por mantenimiento.',
        numeroDestino: tenant2.telefono || '+34 600 000 002',
        estado: 'enviado',
        fechaEnvio: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        costeEuro: 0.05,
        envioProgramado: false,
        exito: true,
      },
    ],
  });

  console.log('\u2705 SMS y plantillas creados');

  // ========================================
  // CHAT CONVERSACIONES
  // ========================================
  const chatConv1 = await prisma.chatConversation.create({
    data: {
      companyId: company1.id,
      tenantId: tenant1.id,
      asunto: 'Consulta sobre el contrato',
      ultimoMensaje: 'Gracias por la informaci\u00f3n',
      ultimoMensajeFecha: new Date(),
      estado: 'activa',
      tieneNoLeidosAdmin: false,
      tieneNoLeidosTenant: false,
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        conversationId: chatConv1.id,
        remitenteTipo: 'inquilino',
        mensaje: 'Hola, tengo una duda sobre la fecha de renovaci\u00f3n del contrato',
        leido: true,
      },
      {
        conversationId: chatConv1.id,
        remitenteTipo: 'administrador',
        mensaje: 'Hola, la fecha de renovaci\u00f3n es el 1 de junio de 2025. \u00bfTienes alguna duda espec\u00edfica?',
        leido: true,
      },
      {
        conversationId: chatConv1.id,
        remitenteTipo: 'inquilino',
        mensaje: 'Gracias por la informaci\u00f3n',
        leido: true,
      },
    ],
  });

  console.log('\u2705 Chat y conversaciones creados');

  // ========================================
  // CALENDARIO UNIFICADO
  // ========================================
  await prisma.calendarEvent.createMany({
    data: [
      {
        companyId: company1.id,
        buildingId: building1.id,
        tipo: 'pago',
        titulo: 'Vencimiento pago alquiler',
        descripcion: `Pago mensual de ${tenant1.nombreCompleto}`,
        fechaInicio: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        prioridad: 'alta',
        completado: false,
      },
      {
        companyId: company1.id,
        buildingId: building1.id,
        tipo: 'averia_comun',
        titulo: 'Revisi\u00f3n ascensores',
        descripcion: 'Mantenimiento preventivo de ascensores',
        fechaInicio: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 9, 0),
        fechaFin: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 12, 0),
        ubicacion: 'Todos los portales',
        prioridad: 'media',
        color: '#f59e0b',
        completado: false,
      },
      {
        companyId: company1.id,
        buildingId: building1.id,
        contractId: contract1.id,
        tipo: 'vencimiento_contrato',
        titulo: 'Renovaci\u00f3n contrato',
        descripcion: `Contrato de ${tenant1.nombreCompleto} vence pronto`,
        fechaInicio: new Date(contract1.fechaFin),
        prioridad: 'alta',
        color: '#ef4444',
        recordatorio: true,
        recordatorioDias: 30,
        completado: false,
      },
    ],
  });

  console.log('\u2705 Eventos de calendario creados');

  // ========================================
  // M\u00d3DULOS ADICIONALES
  // ========================================

  // Backup del sistema
  await prisma.systemBackup.create({
    data: {
      companyId: company1.id,
      tipo: 'manual',
      numeroRegistros: 150,
      tamanoBytes: 2500000,
      exitoso: true,
      creadoPor: admin1.id,
    },
  });

  // B\u00fasquedas guardadas
  await prisma.savedSearch.create({
    data: {
      companyId: company1.id,
      userId: admin1.id,
      nombre: 'Contratos por vencer',
      consulta: 'contratos vencimiento 30 d\u00edas',
      filtros: { estado: 'activo', diasVencimiento: 30 },
    },
  });

  // M\u00e9tricas de rendimiento
  await prisma.performanceMetric.create({
    data: {
      companyId: company1.id,
      metrica: 'tiempo_respuesta_api',
      valor: 125.5,
      unidad: 'ms',
    },
  });

  console.log('\u2705 M\u00f3dulos adicionales creados');

  console.log('\n\ud83c\udf89 Seed completado exitosamente!');
  console.log('\n📊 RESUMEN DE DATOS CARGADOS:');
  console.log('\n   🏢 CORE:');
  console.log('   • 2 Empresas');
  console.log('   • 5 Usuarios (3 INMOVA, 2 VIDARO)');
  console.log('   • 3 Edificios');
  console.log('   • 7 Unidades');
  console.log('   • 4 Inquilinos');
  console.log('   • 4 Contratos');
  console.log('   • 15+ Pagos');
  console.log('\n   🔧 MANTENIMIENTO:');
  console.log('   • 3 Proveedores');
  console.log('   • 2 Solicitudes de mantenimiento');
  console.log('   • 2 Mantenimientos preventivos');
  console.log('   • 3 Órdenes de trabajo');
  console.log('\n   🏘️ COMUNIDAD:');
  console.log('   • 3 Espacios comunes');
  console.log('   • 2 Reservas');
  console.log('   • 3 Incidencias comunitarias');
  console.log('   • 2 Votaciones');
  console.log('   • 3 Anuncios');
  console.log('   • 2 Reuniones');
  console.log('\n   📄 DOCUMENTOS Y CERTIFICACIONES:');
  console.log('   • 2 Seguros');
  console.log('   • 2 Certificaciones energéticas');
  console.log('   • 1 Galería multimedia (4 items)');
  console.log('\n   🤖 AVANZADO:');
  console.log('   • 1 Screening de candidato');
  console.log('   • 1 Valoración de propiedad');
  console.log('   • 2 Publicaciones multi-portal');
  console.log('\n   💬 COMUNICACIÓN:');
  console.log('   • 2 Plantillas SMS');
  console.log('   • 2 SMS enviados');
  console.log('   • 1 Conversación de chat (3 mensajes)');
  console.log('   • 3 Eventos de calendario');
  console.log('   • 3+ Notificaciones');
  console.log('\n   ⚙️ SISTEMA:');
  console.log('   • 1 Backup del sistema');
  console.log('   • 1 Búsqueda guardada');
  console.log('   • 1 Métrica de rendimiento');
  console.log('\n👥 CREDENCIALES DE ACCESO:');
  console.log('\n   INMOVA:');
  console.log('   • admin@inmova.com / admin123 (Administrador)');
  console.log('   • gestor@inmova.com / admin123 (Gestor)');
  console.log('   • operador@inmova.com / admin123 (Operador)');
  console.log('\n   VIDARO INVERSIONES:');
  console.log('   • admin@vidaro.com / admin123 (Administrador)');
  console.log('   • gestor@vidaro.com / admin123 (Gestor)');
  console.log('\n   Portal Inquilino:');
  console.log('   • Cualquier inquilino / inquilino123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });