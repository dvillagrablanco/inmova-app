/**
 * Script para crear empresas demo con datos completos
 * Ejecutar: npx tsx scripts/seed-demo-companies.ts
 */

import prisma from '../lib/db';
import bcrypt from 'bcryptjs';

// Obtener plan Demo
async function getDemoPlan() {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { nombre: 'Demo' }
  });

  if (!plan) {
    throw new Error('Plan Demo no encontrado. Ejecuta primero: npx tsx scripts/seed-subscription-plans.ts');
  }

  return plan;
}

// Empresas demo según diferentes perfiles de cliente
const DEMO_COMPANIES = [
  {
    nombre: 'DEMO - Propietario Individual',
    email: 'demo-propietario@inmova.app',
    telefono: '+34 600 000 001',
    direccion: 'Calle Demo 1, Madrid',
    cif: 'B00000001',
    businessVertical: 'alquiler_tradicional',
    categoria: 'pyme',
    descripcion: 'Propietario con 3-5 propiedades. Perfil ideal para plan Basic/Professional.',
    users: [
      {
        name: 'Juan Propietario Demo',
        email: 'juan.propietario@demo.inmova.app',
        password: 'Demo123456!',
        role: 'administrador'
      }
    ],
    buildings: [
      {
        nombre: 'Edificio Salamanca',
        direccion: 'Calle Serrano 125',
        ciudad: 'Madrid',
        codigoPostal: '28006',
        properties: 3
      },
      {
        nombre: 'Piso Retiro',
        direccion: 'Calle Ibiza 45',
        ciudad: 'Madrid',
        codigoPostal: '28009',
        properties: 2
      }
    ]
  },
  {
    nombre: 'DEMO - Gestor Profesional',
    email: 'demo-gestor@inmova.app',
    telefono: '+34 600 000 002',
    direccion: 'Avenida Demo 2, Barcelona',
    cif: 'B00000002',
    businessVertical: 'alquiler_tradicional',
    categoria: 'pyme',
    descripcion: 'Gestor con 15-25 propiedades. Perfil ideal para plan Professional.',
    users: [
      {
        name: 'María Gestora Demo',
        email: 'maria.gestora@demo.inmova.app',
        password: 'Demo123456!',
        role: 'administrador'
      },
      {
        name: 'Carlos Asistente Demo',
        email: 'carlos.asistente@demo.inmova.app',
        password: 'Demo123456!',
        role: 'gestor'
      }
    ],
    buildings: [
      {
        nombre: 'Edificio Eixample',
        direccion: 'Paseo de Gracia 75',
        ciudad: 'Barcelona',
        codigoPostal: '08008',
        properties: 8
      },
      {
        nombre: 'Edificio Gracia',
        direccion: 'Calle Verdi 32',
        ciudad: 'Barcelona',
        codigoPostal: '08012',
        properties: 7
      },
      {
        nombre: 'Apartamentos Barceloneta',
        direccion: 'Paseo Marítimo 15',
        ciudad: 'Barcelona',
        codigoPostal: '08003',
        properties: 10
      }
    ]
  },
  {
    nombre: 'DEMO - Coliving Company',
    email: 'demo-coliving@inmova.app',
    telefono: '+34 600 000 003',
    direccion: 'Calle Innovación 3, Valencia',
    cif: 'B00000003',
    businessVertical: 'coliving',
    categoria: 'startup',
    descripcion: 'Empresa de coliving con múltiples espacios compartidos. Perfil Business.',
    users: [
      {
        name: 'Ana Coliving Demo',
        email: 'ana.coliving@demo.inmova.app',
        password: 'Demo123456!',
        role: 'administrador'
      },
      {
        name: 'Pedro Community Demo',
        email: 'pedro.community@demo.inmova.app',
        password: 'Demo123456!',
        role: 'community_manager'
      }
    ],
    buildings: [
      {
        nombre: 'Coliving Ruzafa',
        direccion: 'Calle Sueca 28',
        ciudad: 'Valencia',
        codigoPostal: '46006',
        properties: 12
      },
      {
        nombre: 'Coliving Benimaclet',
        direccion: 'Avenida Primado Reig 145',
        ciudad: 'Valencia',
        codigoPostal: '46020',
        properties: 15
      }
    ]
  },
  {
    nombre: 'DEMO - Alquiler Vacacional (STR)',
    email: 'demo-vacacional@inmova.app',
    telefono: '+34 600 000 004',
    direccion: 'Paseo Marítimo 4, Málaga',
    cif: 'B00000004',
    businessVertical: 'str_vacacional',
    categoria: 'pyme',
    descripcion: 'Empresa de alquiler vacacional con propiedades en costa. Perfil Professional/Business.',
    users: [
      {
        name: 'Luis Vacacional Demo',
        email: 'luis.vacacional@demo.inmova.app',
        password: 'Demo123456!',
        role: 'administrador'
      }
    ],
    buildings: [
      {
        nombre: 'Apartamentos Playa',
        direccion: 'Paseo Marítimo Antonio Machado 14',
        ciudad: 'Málaga',
        codigoPostal: '29002',
        properties: 6
      },
      {
        nombre: 'Villa Marbella',
        direccion: 'Urbanización Puerto Banús',
        ciudad: 'Marbella',
        codigoPostal: '29660',
        properties: 3
      }
    ]
  },
  {
    nombre: 'DEMO - Gestora Inmobiliaria Grande',
    email: 'demo-gestora-grande@inmova.app',
    telefono: '+34 600 000 005',
    direccion: 'Gran Vía 5, Madrid',
    cif: 'B00000005',
    businessVertical: 'mixto',
    categoria: 'enterprise',
    descripcion: 'Gestora grande con portfolio diversificado. Perfil Business/Enterprise.',
    users: [
      {
        name: 'Roberto Director Demo',
        email: 'roberto.director@demo.inmova.app',
        password: 'Demo123456!',
        role: 'administrador'
      },
      {
        name: 'Laura Gestor Demo',
        email: 'laura.gestor@demo.inmova.app',
        password: 'Demo123456!',
        role: 'gestor'
      },
      {
        name: 'David Operador Demo',
        email: 'david.operador@demo.inmova.app',
        password: 'Demo123456!',
        role: 'operador'
      }
    ],
    buildings: [
      {
        nombre: 'Edificio Oficinas Centro',
        direccion: 'Calle Alcalá 200',
        ciudad: 'Madrid',
        codigoPostal: '28028',
        properties: 20
      },
      {
        nombre: 'Residencial Las Rozas',
        direccion: 'Avenida de España 15',
        ciudad: 'Las Rozas',
        codigoPostal: '28290',
        properties: 35
      },
      {
        nombre: 'Locales Comerciales',
        direccion: 'Calle Princesa 50',
        ciudad: 'Madrid',
        codigoPostal: '28008',
        properties: 12
      }
    ]
  },
  {
    nombre: 'DEMO - Comunidad de Propietarios',
    email: 'demo-comunidad@inmova.app',
    telefono: '+34 600 000 006',
    direccion: 'Plaza Demo 6, Sevilla',
    cif: 'B00000006',
    businessVertical: 'comunidades',
    categoria: 'pyme',
    descripcion: 'Gestión de comunidades de propietarios. Perfil Professional.',
    users: [
      {
        name: 'Carmen Admin Demo',
        email: 'carmen.admin@demo.inmova.app',
        password: 'Demo123456!',
        role: 'administrador'
      }
    ],
    buildings: [
      {
        nombre: 'Comunidad Triana',
        direccion: 'Calle Betis 45',
        ciudad: 'Sevilla',
        codigoPostal: '41010',
        properties: 24
      },
      {
        nombre: 'Comunidad Nervión',
        direccion: 'Avenida Luis Montoto 98',
        ciudad: 'Sevilla',
        codigoPostal: '41018',
        properties: 18
      }
    ]
  }
];

async function createDemoCompany(
  companyData: typeof DEMO_COMPANIES[0],
  demoPlanId: string
) {
  console.log(`\n📦 Creando: ${companyData.nombre}...`);

  try {
    // Crear empresa
    const company = await prisma.company.create({
      data: {
        nombre: companyData.nombre,
        email: companyData.email,
        telefono: companyData.telefono,
        direccion: companyData.direccion,
        cif: companyData.cif,
        businessVertical: companyData.businessVertical as any,
        categoria: companyData.categoria as any,
        descripcion: companyData.descripcion,
        subscriptionPlanId: demoPlanId,
        activa: true
      }
    });

    console.log(`  ✅ Empresa creada: ${company.id}`);

    // Crear usuarios
    for (const userData of companyData.users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role as any,
          companyId: company.id,
          activo: true,
          experienceLevel: 'intermedio',
          onboardingCompleted: true
        }
      });

      console.log(`  👤 Usuario creado: ${user.name} (${user.email})`);
    }

    // Crear edificios y propiedades
    for (const buildingData of companyData.buildings) {
      const building = await prisma.building.create({
        data: {
          nombre: buildingData.nombre,
          direccion: buildingData.direccion,
          ciudad: buildingData.ciudad,
          codigoPostal: buildingData.codigoPostal,
          companyId: company.id,
          tipo: 'residencial'
        }
      });

      console.log(`  🏢 Edificio creado: ${building.nombre} (${buildingData.properties} propiedades)`);

      // Crear propiedades para cada edificio
      for (let i = 1; i <= buildingData.properties; i++) {
        const property = await prisma.property.create({
          data: {
            referencia: `${building.nombre.substring(0, 3).toUpperCase()}-${i.toString().padStart(3, '0')}`,
            buildingId: building.id,
            companyId: company.id,
            tipo: i % 3 === 0 ? 'local' : 'piso',
            estado: i % 5 === 0 ? 'mantenimiento' : i % 3 === 0 ? 'alquilada' : 'disponible',
            superficie: 60 + Math.floor(Math.random() * 80),
            habitaciones: 2 + Math.floor(Math.random() * 3),
            banos: 1 + Math.floor(Math.random() * 2),
            precio: 800 + Math.floor(Math.random() * 1200),
            amueblada: Math.random() > 0.5,
            ascensor: Math.random() > 0.3
          }
        });

        // Crear inquilino demo para propiedades alquiladas
        if (property.estado === 'alquilada' && Math.random() > 0.5) {
          const tenant = await prisma.tenant.create({
            data: {
              nombre: `Inquilino Demo ${i}`,
              apellidos: `Apellido ${i}`,
              email: `inquilino${i}@demo.inmova.app`,
              telefono: `+34 600 ${String(i).padStart(6, '0')}`,
              dni: `${String(12345678 + i)}X`,
              companyId: company.id,
              activo: true
            }
          });

          // Crear contrato demo
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));
          const endDate = new Date(startDate);
          endDate.setFullYear(endDate.getFullYear() + 1);

          await prisma.contract.create({
            data: {
              propertyId: property.id,
              tenantId: tenant.id,
              companyId: company.id,
              fechaInicio: startDate,
              fechaFin: endDate,
              renaMensual: property.precio,
              fianza: property.precio * 2,
              estado: 'activo',
              tipo: 'alquiler'
            }
          });
        }
      }
    }

    console.log(`  ✅ ${companyData.nombre} completada con todos los datos`);
    return company;

  } catch (error: any) {
    console.error(`  ❌ Error creando ${companyData.nombre}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🎭 CREACIÓN DE EMPRESAS DEMO\n');
  console.log('='.repeat(60));

  try {
    // Obtener plan Demo
    const demoPlan = await getDemoPlan();
    console.log(`\n✅ Plan Demo encontrado: ${demoPlan.nombre} (ID: ${demoPlan.id})`);

    // Crear empresas demo
    console.log(`\n📋 Creando ${DEMO_COMPANIES.length} empresas demo...\n`);

    let created = 0;
    let errors = 0;

    for (const companyData of DEMO_COMPANIES) {
      try {
        await createDemoCompany(companyData, demoPlan.id);
        created++;
      } catch (error) {
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN:');
    console.log(`  • Empresas creadas: ${created}`);
    console.log(`  • Errores: ${errors}`);
    console.log(`  • Total procesadas: ${DEMO_COMPANIES.length}`);

    // Mostrar credenciales
    console.log('\n🔑 CREDENCIALES DE ACCESO DEMO:\n');
    DEMO_COMPANIES.forEach(company => {
      console.log(`📧 ${company.nombre}:`);
      company.users.forEach(user => {
        console.log(`   • ${user.email} / ${user.password} (${user.role})`);
      });
      console.log('');
    });

    console.log('✅ Empresas demo creadas exitosamente!\n');
    console.log('💡 Tip: Usa estas empresas para hacer demostraciones a clientes potenciales.');
    console.log('');

  } catch (error) {
    console.error('❌ Error en seed de empresas demo:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
