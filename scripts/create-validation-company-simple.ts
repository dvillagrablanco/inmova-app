/**
 * Script simplificado para crear empresa de validación
 * Usa solo campos básicos que existen en la BD
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  console.log('🏢 Creando empresa de validación...\n');

  try {
    // 1. Crear empresa con campos mínimos
    console.log('📋 Creando/actualizando empresa...');
    const company = await prisma.company.upsert({
      where: { id: 'validacion-proptech' },
      update: {},
      create: {
        id: 'validacion-proptech',
        nombre: 'Validación PropTech S.L.',
        cif: 'B87654321',
        direccion: 'Calle Gran Vía 123',
        telefono: '+34 912 345 678',
        email: 'info@validacion-proptech.es',
        ciudad: 'Madrid',
        codigoPostal: '28013',
        pais: 'España',
        activo: true,
        maxUsuarios: 10,
        maxPropiedades: 50,
        maxEdificios: 10,
      },
    });
    console.log(`  ✅ Empresa: ${company.id}`);

    // 2. Crear usuario
    const hashedPassword = await bcrypt.hash('Validacion2026!', 10);
    const user = await prisma.user.upsert({
      where: { email: 'admin@validacion-proptech.es' },
      update: {},
      create: {
        email: 'admin@validacion-proptech.es',
        name: 'Carlos García',
        password: hashedPassword,
        role: 'administrador',
        companyId: company.id,
        activo: true,
      },
    });
    console.log(`  ✅ Usuario: ${user.email}`);

    // 3. Crear edificio
    const building = await prisma.building.upsert({
      where: { id: 'edificio-centro' },
      update: {},
      create: {
        id: 'edificio-centro',
        companyId: company.id,
        nombre: 'Edificio Residencial Centro',
        direccion: 'Calle Serrano 45, Madrid',
        tipo: 'residencial',
        anoConstructor: 2010,
        numeroUnidades: 4,
      },
    });
    console.log(`  ✅ Edificio: ${building.nombre}`);

    // 4. Crear unidades
    const unitsData = [
      { id: 'unit-1a', piso: '1A', metros: 85, habs: 3, banos: 2, precio: 1200, estado: 'ocupada' as const },
      { id: 'unit-1b', piso: '1B', metros: 75, habs: 2, banos: 1, precio: 1000, estado: 'disponible' as const },
      { id: 'unit-2a', piso: '2A', metros: 90, habs: 3, banos: 2, precio: 1300, estado: 'disponible' as const },
      { id: 'unit-2b', piso: '2B', metros: 70, habs: 2, banos: 1, precio: 950, estado: 'disponible' as const },
    ];

    console.log('  📦 Creando unidades...');
    for (const u of unitsData) {
      await prisma.unit.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          companyId: company.id,
          buildingId: building.id,
          codigoInterno: `SER45-${u.piso}`,
          piso: u.piso,
          tipo: 'vivienda',
          estado: u.estado,
          metrosCuadrados: u.metros,
          habitaciones: u.habs,
          banos: u.banos,
          precioAlquiler: u.precio,
        },
      });
    }
    console.log('    ✅ 4 unidades creadas');

    // 5. Crear inquilino
    const tenant = await prisma.tenant.upsert({
      where: { id: 'tenant-maria' },
      update: {},
      create: {
        id: 'tenant-maria',
        companyId: company.id,
        nombre: 'María López',
        email: 'maria.lopez@email.com',
        telefono: '+34 666 123 456',
        dni: '12345678A',
      },
    });
    console.log(`  ✅ Inquilino: ${tenant.nombre}`);

    // 6. Crear contrato
    const contract = await prisma.contract.upsert({
      where: { id: 'contract-maria-1a' },
      update: {},
      create: {
        id: 'contract-maria-1a',
        companyId: company.id,
        unitId: 'unit-1a',
        tenantId: tenant.id,
        tipo: 'residencial',
        estado: 'activo',
        fechaInicio: new Date('2025-01-01'),
        fechaFin: new Date('2026-12-31'),
        rentaMensual: 1200,
        depositoMeses: 2,
        depositoImporte: 2400,
        diaVencimientoPago: 5,
      },
    });
    console.log(`  ✅ Contrato creado`);

    // 7. Crear pagos
    console.log('  💰 Creando pagos...');
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
    for (let i = 0; i < months.length; i++) {
      await prisma.payment.upsert({
        where: { id: `payment-2025-${i+1}` },
        update: {},
        create: {
          id: `payment-2025-${i+1}`,
          contractId: contract.id,
          concepto: `Alquiler ${months[i]} 2025`,
          monto: 1200,
          fechaVencimiento: new Date(2025, i, 5),
          fechaPago: new Date(2025, i, 3),
          estado: 'pagado',
          metodoPago: 'transferencia',
        },
      });
    }
    console.log('    ✅ 6 pagos creados');

    // 8. Crear solicitud de mantenimiento
    await prisma.maintenanceRequest.upsert({
      where: { id: 'maint-caldera' },
      update: {},
      create: {
        id: 'maint-caldera',
        companyId: company.id,
        unitId: 'unit-1a',
        titulo: 'Reparación caldera',
        descripcion: 'La caldera hace ruido extraño. Necesita revisión.',
        prioridad: 'media',
        estado: 'pendiente',
        fechaSolicitud: new Date(),
      },
    });
    console.log('  ✅ Solicitud de mantenimiento creada');

    console.log('\n' + '='.repeat(60));
    console.log('✅ EMPRESA DE VALIDACIÓN CREADA CON ÉXITO');
    console.log('='.repeat(60));
    console.log('\n📋 Resumen:');
    console.log('  • Empresa: Validación PropTech S.L.');
    console.log('  • Usuario: admin@validacion-proptech.es / Validacion2026!');
    console.log('  • Edificio con 4 unidades');
    console.log('  • 1 inquilino con contrato activo');
    console.log('  • 6 pagos registrados');
    console.log('  • 1 solicitud de mantenimiento');
    console.log('\n🔗 Acceso: https://inmovaapp.com/login\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
