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
      activo: true,
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
      activo: true,
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
      activo: true,
    },
  });

  const gestor1 = await prisma.user.create({
    data: {
      email: 'gestor@inmova.com',
      password: hashedPassword,
      name: 'María García López',
      role: 'gestor',
      companyId: company1.id,
      activo: true,
    },
  });

  const operador1 = await prisma.user.create({
    data: {
      email: 'operador@inmova.com',
      password: hashedPassword,
      name: 'Juan Martínez Ruiz',
      role: 'operador',
      companyId: company1.id,
      activo: true,
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
      activo: true,
    },
  });

  const gestor2 = await prisma.user.create({
    data: {
      email: 'gestor@vidaro.com',
      password: hashedPassword,
      name: 'Laura Fernández',
      role: 'gestor',
      companyId: company2.id,
      activo: true,
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
      activo: true,
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
      activo: true,
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

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📊 RESUMEN:');
  console.log('   • 2 Empresas');
  console.log('   • 5 Usuarios (3 INMOVA, 2 VIDARO)');
  console.log('   • 3 Edificios (2 INMOVA, 1 VIDARO)');
  console.log('   • 7 Unidades');
  console.log('   • 4 Inquilinos');
  console.log('   • 4 Contratos');
  console.log('   • 15 Pagos');
  console.log('   • 3 Proveedores');
  console.log('   • 2 Solicitudes de mantenimiento');
  console.log('   • 2 Mantenimientos preventivos');
  console.log('   • 3 Notificaciones');
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
