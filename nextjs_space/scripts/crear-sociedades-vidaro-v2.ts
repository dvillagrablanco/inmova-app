import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================================');
  console.log('CREACIÓN DE SOCIEDADES DEL GRUPO VIDARO EN INMOVA');
  console.log('====================================================================\n');

  // 1. Crear VIDARO como sociedad matriz
  console.log('1. Creando VIDARO INVERSIONES S.L. (Sociedad Matriz)...');
  
  const vidaro = await prisma.company.upsert({
    where: { 
      id: 'vidaro-inversiones'
    },
    update: {},
    create: {
      id: 'vidaro-inversiones',
      nombre: 'Vidaro Inversiones S.L.',
      cif: 'B-PENDIENTE',
      direccion: 'Pendiente de confirmación',
      telefono: '+34 XXX XXX XXX',
      email: 'info@vidaro.es',
      ciudad: 'Madrid',
      pais: 'España',
      codigoPostal: '28XXX',
      colorPrimario: '#1a365d',
      colorSecundario: '#2563eb',
      estadoCliente: 'activo',
      contactoPrincipal: 'Pendiente de asignar',
      emailContacto: 'contacto@vidaro.es',
      notasAdmin: 'Sociedad holding matriz del grupo Vidaro. Gestiona inversiones en participadas (Rovida y Viroda). Periodo contable 2025: Ene-Oct. Total Debe/Haber: 451M€. 981 asientos contables.',
      activo: true,
      parentCompanyId: null
    }
  });

  console.log(`   ✓ VIDARO creada con ID: ${vidaro.id}\n`);

  // 2. Crear ROVIDA como filial de VIDARO
  console.log('2. Creando ROVIDA S.L. (Filial de Vidaro)...');
  
  const rovida = await prisma.company.upsert({
    where: {
      id: 'rovida-sl'
    },
    update: {
      parentCompanyId: vidaro.id
    },
    create: {
      id: 'rovida-sl',
      nombre: 'Rovida S.L.',
      cif: 'B-PENDIENTE',
      direccion: 'Pendiente de confirmación',
      telefono: '+34 XXX XXX XXX',
      email: 'info@rovida.es',
      ciudad: 'Madrid',
      pais: 'España',
      codigoPostal: '28XXX',
      colorPrimario: '#16a34a',
      colorSecundario: '#22c55e',
      estadoCliente: 'activo',
      contactoPrincipal: 'Pendiente de asignar',
      emailContacto: 'contacto@rovida.es',
      notasAdmin: 'Sociedad filial de Vidaro Inversiones. Gestión inmobiliaria y actividad comercial. Periodo contable 2025: Ene-Oct. Total Debe/Haber: 70.9M€. 2,198 asientos contables. Incluye propiedades en Benidorm.',
      activo: true,
      parentCompanyId: vidaro.id
    }
  });

  console.log(`   ✓ ROVIDA creada con ID: ${rovida.id}\n`);

  // 3. Crear VIRODA como filial de VIDARO
  console.log('3. Creando VIRODA INVERSIONES S.L.U. (Filial de Vidaro)...');
  
  const viroda = await prisma.company.upsert({
    where: {
      id: 'viroda-inversiones'
    },
    update: {
      parentCompanyId: vidaro.id
    },
    create: {
      id: 'viroda-inversiones',
      nombre: 'VIRODA INVERSIONES S.L.U.',
      cif: 'B-PENDIENTE',
      direccion: 'Pendiente de confirmación',
      telefono: '+34 XXX XXX XXX',
      email: 'info@viroda.es',
      ciudad: 'Madrid',
      pais: 'España',
      codigoPostal: '28XXX',
      colorPrimario: '#dc2626',
      colorSecundario: '#ef4444',
      estadoCliente: 'activo',
      contactoPrincipal: 'Pendiente de asignar',
      emailContacto: 'contacto@viroda.es',
      notasAdmin: 'Sociedad unipersonal filial de Vidaro. Especializada en inversiones inmobiliarias. Portfolio: 5 edificios (M.Silvela 5, H.Tejada 6, C.Mora, Reina 15, M.Pelayo). Modelo Room Rental. Renta mensual: 93,394€. Renta anual proyectada: 1.12M€. Total Debe/Haber: 72.5M€. 2,531 asientos contables.',
      activo: true,
      parentCompanyId: vidaro.id
    }
  });

  console.log(`   ✓ VIRODA creada con ID: ${viroda.id}\n`);

  // 4. Activar módulos necesarios para cada sociedad
  console.log('4. Activando módulos necesarios...');

  // Módulos para VIDARO (sociedad holding)
  const modulosVidaro = [
    'dashboard', 'edificios', 'unidades', 'inquilinos', 'contratos', 'pagos',
    'gastos', 'documentos', 'reportes', 'facturacion', 'contabilidad',
    'b2b-billing', 'auditoria'
  ];

  for (const modulo of modulosVidaro) {
    await prisma.companyModule.upsert({
      where: {
        companyId_moduloCodigo: {
          companyId: vidaro.id,
          moduloCodigo: modulo
        }
      },
      update: { activo: true },
      create: {
        companyId: vidaro.id,
        moduloCodigo: modulo,
        activo: true,
        configuracion: {}
      }
    });
  }

  console.log(`   ✓ ${modulosVidaro.length} módulos activados para VIDARO`);

  // Módulos para ROVIDA (gestión inmobiliaria)
  const modulosRovida = [
    'dashboard', 'edificios', 'unidades', 'inquilinos', 'contratos', 'pagos',
    'gastos', 'documentos', 'mantenimiento', 'reportes', 'facturacion',
    'contabilidad', 'crm'
  ];

  for (const modulo of modulosRovida) {
    await prisma.companyModule.upsert({
      where: {
        companyId_moduloCodigo: {
          companyId: rovida.id,
          moduloCodigo: modulo
        }
      },
      update: { activo: true },
      create: {
        companyId: rovida.id,
        moduloCodigo: modulo,
        activo: true,
        configuracion: {}
      }
    });
  }

  console.log(`   ✓ ${modulosRovida.length} módulos activados para ROVIDA`);

  // Módulos para VIRODA (room rental + STR)
  const modulosViroda = [
    'dashboard', 'edificios', 'unidades', 'inquilinos', 'contratos', 'pagos',
    'gastos', 'documentos', 'mantenimiento', 'reportes', 'facturacion',
    'contabilidad', 'room-rental', 'str', 'portal-inquilino', 'crm'
  ];

  for (const modulo of modulosViroda) {
    await prisma.companyModule.upsert({
      where: {
        companyId_moduloCodigo: {
          companyId: viroda.id,
          moduloCodigo: modulo
        }
      },
      update: { activo: true },
      create: {
        companyId: viroda.id,
        moduloCodigo: modulo,
        activo: true,
        configuracion: {}
      }
    });
  }

  console.log(`   ✓ ${modulosViroda.length} módulos activados para VIRODA\n`);

  // 5. Crear usuarios administradores para cada sociedad
  console.log('5. Creando usuarios administradores...');

  const defaultPassword = await bcrypt.hash('Inmova2025!', 10);

  // Admin VIDARO
  const adminVidaro = await prisma.user.upsert({
    where: { email: 'admin@vidaro.es' },
    update: {},
    create: {
      name: 'Administrador Vidaro',
      email: 'admin@vidaro.es',
      password: defaultPassword,
      role: 'administrador',
      companyId: vidaro.id,
      activo: true
    }
  });

  console.log(`   ✓ Admin VIDARO creado: admin@vidaro.es`);

  // Admin ROVIDA
  const adminRovida = await prisma.user.upsert({
    where: { email: 'admin@rovida.es' },
    update: {},
    create: {
      name: 'Administrador Rovida',
      email: 'admin@rovida.es',
      password: defaultPassword,
      role: 'administrador',
      companyId: rovida.id,
      activo: true
    }
  });

  console.log(`   ✓ Admin ROVIDA creado: admin@rovida.es`);

  // Admin VIRODA
  const adminViroda = await prisma.user.upsert({
    where: { email: 'admin@viroda.es' },
    update: {},
    create: {
      name: 'Administrador Viroda',
      email: 'admin@viroda.es',
      password: defaultPassword,
      role: 'administrador',
      companyId: viroda.id,
      activo: true
    }
  });

  console.log(`   ✓ Admin VIRODA creado: admin@viroda.es\n`);

  console.log('====================================================================');
  console.log('RESUMEN DE CREACIÓN');
  console.log('====================================================================');
  console.log(`\n✓ Estructura de grupo empresarial creada:`);
  console.log(`  │`);
  console.log(`  ├─ VIDARO INVERSIONES S.L. (Matriz) [ID: ${vidaro.id}]`);
  console.log(`  │   ├─ ROVIDA S.L. (Filial) [ID: ${rovida.id}]`);
  console.log(`  │   └─ VIRODA INVERSIONES S.L.U. (Filial) [ID: ${viroda.id}]`);
  console.log(`\n✓ Usuarios de acceso creados:`);
  console.log(`  • admin@vidaro.es (Contraseña: Inmova2025!)`);
  console.log(`  • admin@rovida.es (Contraseña: Inmova2025!)`);
  console.log(`  • admin@viroda.es (Contraseña: Inmova2025!)`);
  console.log(`\n✓ Módulos activados según el modelo de negocio de cada sociedad`);
  console.log(`\n====================================================================\n`);
}

main()
  .catch((e) => {
    console.error('Error al crear sociedades:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

