import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addMonths, addDays, subDays, subMonths } from 'date-fns';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos de demostración...');

  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('❌ No se encontró ninguna empresa');
    return;
  }

  // Obtener o crear edificios
  let buildings = await prisma.building.findMany({
    where: { companyId: company.id },
    include: { units: true }
  });

  if (buildings.length === 0) {
    console.log('⚠️ Creando edificios de demostración...');
    const building1 = await prisma.building.create({
      data: {
        companyId: company.id,
        nombre: 'Residencial Plaza Mayor',
        direccion: 'Calle Gran Vía 45',
        codigoPostal: '28013',
        ciudad: 'Madrid',
        pais: 'España',
        numeroUnidades: 8
      }
    });
    buildings = [building1];
  }

  const building = buildings[0];

  // Obtener o crear unidades
  let units = await prisma.unit.findMany({
    where: { buildingId: building.id }
  });

  if (units.length === 0) {
    console.log('⚠️ Creando unidades de demostración...');
    const unitsData = [
      { numero: '1A', estado: 'ocupada' as const, rentaMensual: 850, superficie: 75 },
      { numero: '1B', estado: 'ocupada' as const, rentaMensual: 920, superficie: 82 },
      { numero: '2A', estado: 'disponible' as const, rentaMensual: 880, superficie: 78 },
      { numero: '2B', estado: 'ocupada' as const, rentaMensual: 950, superficie: 85 }
    ];

    for (const unitData of unitsData) {
      await prisma.unit.create({
        data: {
          buildingId: building.id,
          numero: unitData.numero,
          estado: unitData.estado,
          rentaMensual: unitData.rentaMensual,
          tipo: 'vivienda',
          superficie: unitData.superficie
        }
      });
    }
    units = await prisma.unit.findMany({ where: { buildingId: building.id } });
  }

  // Crear inquilinos de demostración
  console.log('👥 Creando inquilinos de demostración...');
  
  const tenantsData = [
    {
      nombreCompleto: 'Carlos García Martínez',
      email: 'carlos.garcia@example.com',
      telefono: '+34 612 345 678',
      dni: '12345678A',
      fechaNacimiento: new Date('1985-05-15')
    },
    {
      nombreCompleto: 'María López Fernández',
      email: 'maria.lopez@example.com',
      telefono: '+34 623 456 789',
      dni: '23456789B',
      fechaNacimiento: new Date('1990-08-22')
    },
    {
      nombreCompleto: 'Juan Rodríguez Sánchez',
      email: 'juan.rodriguez@example.com',
      telefono: '+34 634 567 890',
      dni: '34567890C',
      fechaNacimiento: new Date('1982-03-10')
    }
  ];

  const tenants = [];
  for (const tenantData of tenantsData) {
    const existing = await prisma.tenant.findFirst({
      where: { email: tenantData.email, companyId: company.id }
    });
    
    if (!existing) {
      const tenant = await prisma.tenant.create({
        data: {
          ...tenantData,
          companyId: company.id
        }
      });
      tenants.push(tenant);
      console.log(`  ✅ Inquilino creado: ${tenant.nombreCompleto}`);
    } else {
      tenants.push(existing);
      console.log(`  ℹ️  Inquilino existente: ${existing.nombreCompleto}`);
    }
  }

  // Crear contratos de demostración
  console.log('📄 Creando contratos de demostración...');
  
  const contractsData = [
    {
      tenantId: tenants[0].id,
      unitId: units[0].id,
      fechaInicio: subMonths(new Date(), 6),
      fechaFin: addMonths(new Date(), 6),
      rentaMensual: 850,
      deposito: 1700,
      estado: 'activo' as const
    },
    {
      tenantId: tenants[1].id,
      unitId: units[1].id,
      fechaInicio: subMonths(new Date(), 3),
      fechaFin: addMonths(new Date(), 9),
      rentaMensual: 920,
      deposito: 1840,
      estado: 'activo' as const
    },
    {
      tenantId: tenants[2].id,
      unitId: units[3].id,
      fechaInicio: subMonths(new Date(), 12),
      fechaFin: subDays(new Date(), 5),
      rentaMensual: 950,
      deposito: 1900,
      estado: 'vencido' as const
    }
  ];

  const contracts = [];
  for (const contractData of contractsData) {
    const existing = await prisma.contract.findFirst({
      where: {
        tenantId: contractData.tenantId,
        unitId: contractData.unitId
      }
    });

    if (!existing) {
      const contract = await prisma.contract.create({
        data: contractData
      });
      contracts.push(contract);
      console.log(`  ✅ Contrato creado para ${units.find(u => u.id === contract.unitId)?.numero}`);
    } else {
      contracts.push(existing);
    }
  }

  // Crear pagos de demostración
  console.log('💰 Creando pagos de demostración...');
  
  let paymentsCreated = 0;
  for (const contract of contracts) {
    if (contract.estado === 'activo') {
      // Pagos del último mes (pagado)
      const lastMonth = await prisma.payment.findFirst({
        where: {
          contractId: contract.id,
          fechaVencimiento: {
            gte: subMonths(new Date(), 1),
            lt: new Date()
          }
        }
      });

      if (!lastMonth) {
        const lastMonthDate = subMonths(new Date(), 1);
        await prisma.payment.create({
          data: {
            contractId: contract.id,
            monto: contract.rentaMensual,
            periodo: `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`,
            fechaVencimiento: subDays(new Date(), 15),
            fechaPago: subDays(new Date(), 10),
            estado: 'pagado',
            metodoPago: 'transferencia'
          }
        });
        paymentsCreated++;
      }

      // Pago del mes actual (pendiente)
      const currentMonth = await prisma.payment.findFirst({
        where: {
          contractId: contract.id,
          fechaVencimiento: {
            gte: new Date(),
            lt: addMonths(new Date(), 1)
          }
        }
      });

      if (!currentMonth) {
        const currentDate = new Date();
        await prisma.payment.create({
          data: {
            contractId: contract.id,
            monto: contract.rentaMensual,
            periodo: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
            fechaVencimiento: addDays(new Date(), 5),
            estado: 'pendiente'
          }
        });
        paymentsCreated++;
      }

      // Pago próximo mes (pendiente)
      const nextMonth = await prisma.payment.findFirst({
        where: {
          contractId: contract.id,
          fechaVencimiento: {
            gte: addMonths(new Date(), 1),
            lt: addMonths(new Date(), 2)
          }
        }
      });

      if (!nextMonth) {
        const nextMonthDate = addMonths(new Date(), 1);
        await prisma.payment.create({
          data: {
            contractId: contract.id,
            monto: contract.rentaMensual,
            periodo: `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`,
            fechaVencimiento: addDays(addMonths(new Date(), 1), 5),
            estado: 'pendiente'
          }
        });
        paymentsCreated++;
      }
    }
  }

  console.log(`  ✅ ${paymentsCreated} pagos creados`);

  console.log('\n✨ Seed de datos de demostración completado exitosamente');
  console.log(`📊 Resumen:`);
  console.log(`   - Inquilinos: ${tenants.length}`);
  console.log(`   - Contratos: ${contracts.length}`);
  console.log(`   - Pagos: ${paymentsCreated}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
