import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Configurando usuarios multi-empresa para Grupo Vidaro...\n');

  // 1. Obtener las empresas del Grupo Vidaro
  const grupoVidaro =
    (await prisma.company.findUnique({ where: { id: 'vidaro-inversiones' } })) ||
    (await prisma.company.findFirst({
      where: { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
    }));

  const rovida =
    (await prisma.company.findUnique({ where: { id: 'rovida-sl' } })) ||
    (await prisma.company.findUnique({ where: { id: 'rovida-gestion' } })) ||
    (await prisma.company.findFirst({
      where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
    }));

  const viroda =
    (await prisma.company.findUnique({ where: { id: 'viroda-inversiones' } })) ||
    (await prisma.company.findUnique({ where: { id: 'viroda-gestion' } })) ||
    (await prisma.company.findFirst({
      where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
    }));

  if (!grupoVidaro || !rovida || !viroda) {
    console.error('❌ No se encontraron todas las empresas del Grupo Vidaro');
    return;
  }

  const companyIds = [grupoVidaro.id, rovida.id, viroda.id];
  console.log('✅ Empresas encontradas:');
  console.log(`   - ${grupoVidaro.nombre} (${grupoVidaro.id})`);
  console.log(`   - ${rovida.nombre} (${rovida.id})`);
  console.log(`   - ${viroda.nombre} (${viroda.id})\n`);

  // 2. Crear/actualizar Director Financiero
  const hashedPasswordDirector = await bcrypt.hash('Director2024!', 10);
  const directorEmail = 'director.financiero@grupovidaro.com';
  
  let director = await prisma.user.findUnique({
    where: { email: directorEmail }
  });

  if (!director) {
    director = await prisma.user.create({
      data: {
        email: directorEmail,
        name: 'Director Financiero',
        password: hashedPasswordDirector,
        role: 'administrador',
        companyId: grupoVidaro.id
      }
    });
    console.log('✅ Director Financiero creado');
  } else {
    console.log('ℹ️  Director Financiero ya existe');
  }

  // Configurar acceso multi-empresa para el director
  for (const companyId of companyIds) {
    const existingAccess = await prisma.userCompanyAccess.findFirst({
      where: {
        userId: director.id,
        companyId: companyId
      }
    });

    if (!existingAccess) {
      await prisma.userCompanyAccess.create({
        data: {
          userId: director.id,
          companyId: companyId,
          roleInCompany: 'administrador',
          activo: true
        }
      });
    }
  }
  console.log(`   ✓ Acceso configurado a ${companyIds.length} empresas\n`);

  // 3. Crear/actualizar Gestor
  const hashedPasswordGestor = await bcrypt.hash('Gestor2024!', 10);
  const gestorEmail = 'gestor@grupovidaro.com';
  
  let gestor = await prisma.user.findUnique({
    where: { email: gestorEmail }
  });

  if (!gestor) {
    gestor = await prisma.user.create({
      data: {
        email: gestorEmail,
        name: 'Gestor Principal',
        password: hashedPasswordGestor,
        role: 'gestor',
        companyId: grupoVidaro.id
      }
    });
    console.log('✅ Gestor Principal creado');
  } else {
    console.log('ℹ️  Gestor Principal ya existe');
  }

  // Configurar acceso multi-empresa para el gestor
  for (const companyId of companyIds) {
    const existingAccess = await prisma.userCompanyAccess.findFirst({
      where: {
        userId: gestor.id,
        companyId: companyId
      }
    });

    if (!existingAccess) {
      await prisma.userCompanyAccess.create({
        data: {
          userId: gestor.id,
          companyId: companyId,
          roleInCompany: 'gestor',
          activo: true
        }
      });
    }
  }
  console.log(`   ✓ Acceso configurado a ${companyIds.length} empresas\n`);

  // 4. Crear/actualizar Propietarios
  const propietarios = [
    {
      email: 'propietario1@grupovidaro.com',
      name: 'Juan García (Propietario)',
      password: 'Propietario2024!'
    },
    {
      email: 'propietario2@grupovidaro.com',
      name: 'María López (Propietaria)',
      password: 'Propietario2024!'
    }
  ];

  for (const propData of propietarios) {
    const hashedPassword = await bcrypt.hash(propData.password, 10);
    
    let propietario = await prisma.user.findUnique({
      where: { email: propData.email }
    });

    if (!propietario) {
      propietario = await prisma.user.create({
        data: {
          email: propData.email,
          name: propData.name,
          password: hashedPassword,
          role: 'gestor',
          companyId: grupoVidaro.id
        }
      });
      console.log(`✅ ${propData.name} creado`);
    } else {
      console.log(`ℹ️  ${propData.name} ya existe`);
    }

    // Configurar acceso multi-empresa
    for (const companyId of companyIds) {
      const existingAccess = await prisma.userCompanyAccess.findFirst({
        where: {
          userId: propietario.id,
          companyId: companyId
        }
      });

      if (!existingAccess) {
        await prisma.userCompanyAccess.create({
          data: {
            userId: propietario.id,
            companyId: companyId,
            roleInCompany: 'gestor',
            activo: true
          }
        });
      }
    }
    console.log(`   ✓ Acceso configurado a ${companyIds.length} empresas`);
  }

  console.log('\n🏗️  Corrigiendo datos de Rovida Gestión...\n');

  // 5. Crear unidades (garajes) para Rovida
  const rovidaBuildings = await prisma.building.findMany({
    where: { companyId: rovida.id },
    include: { units: true }
  });

  console.log(`✅ Encontrados ${rovidaBuildings.length} edificios en Rovida`);

  for (const building of rovidaBuildings) {
    const existingUnits = building.units.length;
    const garajesToCreate = 3 - existingUnits;

    if (garajesToCreate > 0) {
      for (let i = 0; i < garajesToCreate; i++) {
        const numeroGaraje = existingUnits + i + 1;
        await prisma.unit.create({
          data: {
            numero: `G-${numeroGaraje}`,
            tipo: 'garaje',
            estado: i === 0 ? 'ocupada' : 'disponible',
            buildingId: building.id,
            superficie: 15,
            rentaMensual: 80
          }
        });
      }
      console.log(`   ✓ ${garajesToCreate} garajes creados en ${building.nombre}`);
    }
  }

  // 6. Crear inquilinos para garajes ocupados
  const rovidaOccupiedUnits = await prisma.unit.findMany({
    where: {
      building: {
        companyId: rovida.id
      },
      estado: 'ocupada'
    }
  });

  console.log(`\n✅ ${rovidaOccupiedUnits.length} garajes ocupados en Rovida`);

  for (const unit of rovidaOccupiedUnits) {
    const existingContract = await prisma.contract.findFirst({
      where: {
        unitId: unit.id,
        estado: 'activo'
      }
    });

    if (!existingContract) {
      const email = `inquilino.${unit.numero.toLowerCase().replace(/\s+/g, '')}@example.com`;
      const dni = `${Math.floor(10000000 + Math.random() * 90000000)}X`;
      
      // Buscar o crear tenant
      let tenant = await prisma.tenant.findUnique({
        where: { email: email }
      });
      
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            nombreCompleto: `Inquilino Garaje ${unit.numero}`,
            email: email,
            telefono: '+34600000000',
            dni: dni,
            fechaNacimiento: new Date('1990-01-01'),
            companyId: rovida.id
          }
        });
      }

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2025-12-31');
      
      await prisma.contract.create({
        data: {
          unitId: unit.id,
          tenantId: tenant.id,
          fechaInicio: startDate,
          fechaFin: endDate,
          rentaMensual: 80,
          deposito: 80,
          estado: 'activo'
        }
      });

      console.log(`   ✓ Inquilino y contrato creado para ${unit.numero}`);
    }
  }

  console.log('\n✅ ¡Configuración completada!\n');
  console.log('📋 Resumen de credenciales:\n');
  console.log('👤 Director Financiero:');
  console.log('   Email: director.financiero@grupovidaro.com');
  console.log('   Password: Director2024!');
  console.log('   Rol: Administrador\n');
  
  console.log('👤 Gestor Principal:');
  console.log('   Email: gestor@grupovidaro.com');
  console.log('   Password: Gestor2024!');
  console.log('   Rol: Gestor\n');
  
  console.log('👤 Propietarios:');
  console.log('   Email: propietario1@grupovidaro.com');
  console.log('   Password: Propietario2024!');
  console.log('   Rol: Gestor\n');
  
  console.log('   Email: propietario2@grupovidaro.com');
  console.log('   Password: Propietario2024!');
  console.log('   Rol: Gestor\n');

  const stats = await Promise.all([
    prisma.unit.count({ where: { building: { companyId: rovida.id } } }),
    prisma.tenant.count({ where: { companyId: rovida.id } }),
    prisma.contract.count({ 
      where: { 
        unit: { building: { companyId: rovida.id } },
        estado: 'activo' 
      } 
    })
  ]);

  console.log('📊 Estadísticas de Rovida Gestión:');
  console.log(`   - Unidades (garajes): ${stats[0]}`);
  console.log(`   - Inquilinos: ${stats[1]}`);
  console.log(`   - Contratos activos: ${stats[2]}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
