/**
 * Script para crear empresa de validación con datos reales
 * Ejecutar: npx tsx scripts/create-validation-company.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏢 Creando empresa de validación con datos reales...\n');

  try {
    // 1. Verificar/crear empresa
    let company = await prisma.company.findFirst({
      where: { nombre: 'Validación PropTech S.L.' }
    });

    if (!company) {
      console.log('📋 Creando empresa...');
      company = await prisma.company.create({
        data: {
          nombre: 'Validación PropTech S.L.',
          cif: 'B87654321',
          direccion: 'Calle Gran Vía 123, Planta 5',
          telefono: '+34 912 345 678',
          email: 'info@validacion-proptech.es',
          ciudad: 'Madrid',
          codigoPostal: '28013',
          pais: 'España',
          activo: true,
          businessVertical: 'alquiler_tradicional',
          maxUsuarios: 10,
          maxPropiedades: 50,
          subscriptionPlanId: 'plan-profesional',
        },
      });
      console.log(`  ✅ Empresa creada: ${company.id}`);
    } else {
      console.log(`  ℹ️ Empresa ya existe: ${company.id}`);
    }

    // 2. Crear usuario administrador de la empresa
    const hashedPassword = await bcrypt.hash('Validacion2026!', 10);
    let adminUser = await prisma.user.findFirst({
      where: { email: 'admin@validacion-proptech.es' }
    });

    if (!adminUser) {
      console.log('👤 Creando usuario administrador...');
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@validacion-proptech.es',
          name: 'Carlos García',
          password: hashedPassword,
          role: 'administrador',
          companyId: company.id,
          activo: true,
        },
      });
      console.log(`  ✅ Usuario creado: ${adminUser.email}`);
    } else {
      console.log(`  ℹ️ Usuario ya existe: ${adminUser.email}`);
    }

    // 3. Crear edificio
    let building = await prisma.building.findFirst({
      where: { companyId: company.id, nombre: 'Edificio Residencial Centro' }
    });

    if (!building) {
      console.log('🏗️ Creando edificio...');
      building = await prisma.building.create({
        data: {
          companyId: company.id,
          nombre: 'Edificio Residencial Centro',
          direccion: 'Calle Serrano 45, Madrid',
          tipo: 'residencial',
          anoConstructor: 2010,
          numeroUnidades: 12,
          propiedadesHorizontales: true,
          ascensor: true,
          portero: false,
          garaje: true,
          piscina: false,
          jardin: true,
          gimnasio: false,
        },
      });
      console.log(`  ✅ Edificio creado: ${building.id}`);
    } else {
      console.log(`  ℹ️ Edificio ya existe: ${building.id}`);
    }

    // 4. Crear unidades (pisos)
    const unitData = [
      { piso: '1A', metros: 85, habitaciones: 3, banos: 2, alquiler: 1200 },
      { piso: '1B', metros: 75, habitaciones: 2, banos: 1, alquiler: 1000 },
      { piso: '2A', metros: 90, habitaciones: 3, banos: 2, alquiler: 1300 },
      { piso: '2B', metros: 70, habitaciones: 2, banos: 1, alquiler: 950 },
    ];

    console.log('🏠 Creando unidades...');
    for (const unit of unitData) {
      const existingUnit = await prisma.unit.findFirst({
        where: { buildingId: building.id, piso: unit.piso }
      });

      if (!existingUnit) {
        await prisma.unit.create({
          data: {
            companyId: company.id,
            buildingId: building.id,
            codigoInterno: `SER45-${unit.piso}`,
            piso: unit.piso,
            tipo: 'vivienda',
            estado: unit.piso === '1A' ? 'ocupada' : 'disponible',
            metrosCuadrados: unit.metros,
            habitaciones: unit.habitaciones,
            banos: unit.banos,
            amueblado: true,
            exterior: true,
            tieneCalefaccion: true,
            tieneAireAcondicionado: true,
            precioAlquiler: unit.alquiler,
            depositoMeses: 2,
          },
        });
        console.log(`  ✅ Unidad ${unit.piso} creada`);
      }
    }

    // 5. Crear inquilino
    let tenant = await prisma.tenant.findFirst({
      where: { companyId: company.id, dni: '12345678A' }
    });

    if (!tenant) {
      console.log('👥 Creando inquilino...');
      tenant = await prisma.tenant.create({
        data: {
          companyId: company.id,
          nombre: 'María López',
          email: 'maria.lopez@email.com',
          telefono: '+34 666 123 456',
          dni: '12345678A',
          fechaNacimiento: new Date('1985-05-15'),
          situacionLaboral: 'empleado',
          ingresosMensuales: 2800,
          estadoCivil: 'casado',
          contactoEmergencia: 'Juan López - +34 666 789 012',
          notas: 'Inquilina responsable, pago puntual',
          riesgoMorosidad: 'bajo',
        },
      });
      console.log(`  ✅ Inquilino creado: ${tenant.id}`);
    } else {
      console.log(`  ℹ️ Inquilino ya existe: ${tenant.id}`);
    }

    // 6. Crear contrato
    const unit1A = await prisma.unit.findFirst({
      where: { buildingId: building.id, piso: '1A' }
    });

    if (unit1A && tenant) {
      const existingContract = await prisma.contract.findFirst({
        where: { unitId: unit1A.id, tenantId: tenant.id }
      });

      if (!existingContract) {
        console.log('📄 Creando contrato...');
        await prisma.contract.create({
          data: {
            companyId: company.id,
            unitId: unit1A.id,
            tenantId: tenant.id,
            tipo: 'residencial',
            estado: 'activo',
            fechaInicio: new Date('2025-01-01'),
            fechaFin: new Date('2026-12-31'),
            rentaMensual: 1200,
            depositoMeses: 2,
            depositoImporte: 2400,
            diaVencimientoPago: 5,
            incrementoAnual: 'ipc',
          },
        });
        console.log('  ✅ Contrato creado');
      } else {
        console.log('  ℹ️ Contrato ya existe');
      }
    }

    // 7. Crear pagos de ejemplo
    if (unit1A && tenant) {
      const contract = await prisma.contract.findFirst({
        where: { unitId: unit1A.id, tenantId: tenant.id }
      });

      if (contract) {
        const existingPayments = await prisma.payment.count({
          where: { contractId: contract.id }
        });

        if (existingPayments === 0) {
          console.log('💰 Creando pagos de ejemplo...');
          const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
          for (let i = 0; i < months.length; i++) {
            await prisma.payment.create({
              data: {
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
          console.log('  ✅ Pagos creados (6 meses)');
        }
      }
    }

    // 8. Crear solicitud de mantenimiento
    if (unit1A) {
      const existingRequest = await prisma.maintenanceRequest.findFirst({
        where: { unitId: unit1A.id }
      });

      if (!existingRequest) {
        console.log('🔧 Creando solicitud de mantenimiento...');
        await prisma.maintenanceRequest.create({
          data: {
            companyId: company.id,
            unitId: unit1A.id,
            titulo: 'Reparación caldera',
            descripcion: 'La caldera hace ruido extraño al encenderse. Necesita revisión.',
            prioridad: 'media',
            estado: 'pendiente',
            fechaSolicitud: new Date(),
          },
        });
        console.log('  ✅ Solicitud de mantenimiento creada');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ EMPRESA DE VALIDACIÓN CREADA CON ÉXITO');
    console.log('='.repeat(60));
    console.log('\n📋 Resumen de datos creados:');
    console.log('  • Empresa: Validación PropTech S.L.');
    console.log('  • Usuario: admin@validacion-proptech.es / Validacion2026!');
    console.log('  • Edificio: Edificio Residencial Centro (4 unidades)');
    console.log('  • Inquilino: María López');
    console.log('  • Contrato activo con pagos');
    console.log('  • Solicitud de mantenimiento');
    console.log('\n🔗 Acceso: https://inmovaapp.com/login');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
