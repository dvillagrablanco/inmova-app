/**
 * Script para crear empresa de validación con datos reales
 * Ejecutar en el servidor: npx tsx scripts/create-company-server.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏢 Creando empresa de validación con datos reales...\n');

  try {
    // 1. Verificar si ya existe
    const existing = await prisma.company.findFirst({
      where: { nombre: 'Validación PropTech S.L.' }
    });

    if (existing) {
      console.log('✅ La empresa ya existe:', existing.nombre);
      console.log('   ID:', existing.id);
      
      // Verificar datos existentes
      const buildings = await prisma.building.count({ where: { companyId: existing.id } });
      const units = await prisma.unit.count({ where: { companyId: existing.id } });
      const tenants = await prisma.tenant.count({ where: { companyId: existing.id } });
      const contracts = await prisma.contract.count({ where: { companyId: existing.id } });
      
      console.log('\n📊 Datos existentes:');
      console.log(`   - Edificios: ${buildings}`);
      console.log(`   - Unidades: ${units}`);
      console.log(`   - Inquilinos: ${tenants}`);
      console.log(`   - Contratos: ${contracts}`);
      
      return;
    }

    // 2. Obtener plan Professional
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { tier: 'PROFESSIONAL' }
    });

    console.log('📋 Plan encontrado:', plan?.nombre || 'Ninguno (se creará sin plan)');

    // 3. Crear empresa (sin esEmpresaPrueba que puede no existir en el schema actual)
    const company = await prisma.company.create({
      data: {
        nombre: 'Validación PropTech S.L.',
        cif: 'B12345678',
        direccion: 'Calle Ejemplo 123',
        ciudad: 'Madrid',
        codigoPostal: '28001',
        pais: 'España',
        telefono: '+34 912 345 678',
        email: 'info@validacion-proptech.es',
        contactoPrincipal: 'Juan García',
        emailContacto: 'juan@validacion-proptech.es',
        telefonoContacto: '+34 612 345 678',
        estadoCliente: 'activo',
        activo: true,
        maxUsuarios: 10,
        maxPropiedades: 50,
        maxEdificios: 10,
        subscriptionPlanId: plan?.id,
      }
    });

    console.log('✅ Empresa creada:', company.nombre);
    console.log('   ID:', company.id);

    // 4. Crear usuario admin
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const user = await prisma.user.create({
      data: {
        email: 'admin@validacion-proptech.es',
        password: hashedPassword,
        name: 'Admin Validación',
        role: 'administrador',
        activo: true,
        companyId: company.id,
      }
    });

    console.log('✅ Usuario creado:', user.email);

    // 5. Crear edificio
    const building = await prisma.building.create({
      data: {
        name: 'Edificio Validación',
        address: 'Av. de la Validación 100',
        city: 'Madrid',
        postalCode: '28001',
        country: 'España',
        totalUnits: 5,
        floors: 3,
        type: 'RESIDENTIAL',
        companyId: company.id,
      }
    });

    console.log('✅ Edificio creado:', building.name);

    // 6. Crear unidades
    const units = [];
    for (let i = 1; i <= 5; i++) {
      const unit = await prisma.unit.create({
        data: {
          name: `Piso ${i}`,
          type: 'APARTMENT',
          floor: Math.ceil(i / 2),
          bedrooms: 2,
          bathrooms: 1,
          squareMeters: 75 + (i * 5),
          monthlyRent: 900 + (i * 50),
          status: i <= 3 ? 'OCCUPIED' : 'AVAILABLE',
          companyId: company.id,
          buildingId: building.id,
        }
      });
      units.push(unit);
    }

    console.log('✅ Unidades creadas:', units.length);

    // 7. Crear inquilinos y contratos
    const tenantNames = [
      { firstName: 'María', lastName: 'García' },
      { firstName: 'Carlos', lastName: 'López' },
      { firstName: 'Ana', lastName: 'Martínez' }
    ];

    for (let i = 0; i < 3; i++) {
      const tenant = await prisma.tenant.create({
        data: {
          firstName: tenantNames[i].firstName,
          lastName: tenantNames[i].lastName,
          email: `${tenantNames[i].firstName.toLowerCase()}@ejemplo.com`,
          phone: `+34 6${12345678 + i}`,
          dni: `1234567${i + 1}X`,
          status: 'ACTIVE',
          companyId: company.id,
        }
      });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      await prisma.contract.create({
        data: {
          type: 'LONG_TERM',
          status: 'ACTIVE',
          startDate,
          endDate,
          monthlyRent: units[i].monthlyRent,
          deposit: units[i].monthlyRent * 2,
          tenantId: tenant.id,
          unitId: units[i].id,
          buildingId: building.id,
          companyId: company.id,
        }
      });

      console.log(`✅ Inquilino creado: ${tenant.firstName} ${tenant.lastName}`);
    }

    console.log('\n======================================');
    console.log('🎉 EMPRESA Y DATOS CREADOS EXITOSAMENTE');
    console.log('======================================');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Email: admin@validacion-proptech.es');
    console.log('   Password: Admin123!');
    console.log('\n📋 Datos creados:');
    console.log('   - 1 empresa: Validación PropTech S.L.');
    console.log('   - 1 usuario administrador');
    console.log('   - 1 edificio');
    console.log('   - 5 unidades (3 ocupadas, 2 disponibles)');
    console.log('   - 3 inquilinos con contratos activos');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
