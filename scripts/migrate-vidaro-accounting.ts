import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración de contabilidad del Grupo Vidaro...\n');

  try {
    // ================================================================================
    // 1. CREAR EMPRESAS (COMPANIES)
    // ================================================================================
    console.log('📋 Paso 1: Creando empresas del grupo...');
    
    const vidaro = await prisma.company.upsert({
      where: { id: 'vidaro-inversiones' },
      update: {
        notasAdmin: 'Sociedad holding. Contabilidad 2025: 1.262 asientos, €253M. Contabilidad 2026 (Ene-Feb): 45 asientos, €135K. 1.766 subcuentas. Carteras: CACEIS, Inversis, Pictet, Banca March, Bankinter. Participadas: Rovida, Disfasa, Viroda, Facundo, Girasoles, Incofasa, PDV Gesfasa.',
      },
      create: {
        id: 'vidaro-inversiones',
        nombre: 'Vidaro Inversiones S.L.',
        cif: 'B-XXXXXXXX',
        direccion: 'Madrid, España',
        ciudad: 'Madrid',
        pais: 'España',
        telefono: '+34 XXX XXX XXX',
        email: 'info@vidaro.es',
        activo: true
      }
    });
    console.log(`  ✓ Vidaro Inversiones S.L. (ID: ${vidaro.id})`);

    const rovida = await prisma.company.upsert({
      where: { id: 'rovida-gestion' },
      update: {
        notasAdmin: 'Gestión inmobiliaria patrimonial. 17 inmuebles en Madrid, Palencia, Valladolid, Benidorm, Marbella. Contabilidad 2025: 2.808 asientos, €46.2M. 2026 (Ene-Feb): 401 asientos, €724K. 1.571 subcuentas. 243+ inquilinos. Top: Piamonte €644K/año, Espronceda €131K, Barquillo €93K, Reina €77K.',
      },
      create: {
        id: 'rovida-gestion',
        nombre: 'Rovida Gestión S.L.',
        cif: 'B-XXXXXXXX',
        direccion: 'Madrid, España',
        ciudad: 'Madrid',
        pais: 'España',
        telefono: '+34 XXX XXX XXX',
        email: 'info@rovida.es',
        activo: true
      }
    });
    console.log(`  ✓ Rovida Gestión S.L. (ID: ${rovida.id})`);

    const viroda = await prisma.company.upsert({
      where: { id: 'viroda-inversiones' },
      update: {
        notasAdmin: 'Inversiones inmobiliarias residenciales. 2025: 3.169 asientos, €37.7M. 2026: 450 asientos, €463K. 101 inquilinos. Silvela 5 (14 uds, local €65K/año), Reina 15 (10 viv, top 4ºA €42K), Candelaria Mora (6 viv), H.Tejada 6 (garajes a Rovida), M.Pelayo (2 viv). Renta anual ~€600K. Top: Pilates Lab €79K, Batista €57K.',
      },
      create: {
        id: 'viroda-inversiones',
        nombre: 'VIRODA INVERSIONES S.L.U.',
        cif: 'B-XXXXXXXX',
        direccion: 'Madrid, España',
        ciudad: 'Madrid',
        pais: 'España',
        telefono: '+34 XXX XXX XXX',
        email: 'info@viroda.es',
        activo: true
      }
    });
    console.log(`  ✓ VIRODA INVERSIONES S.L.U. (ID: ${viroda.id})\n`);

    // ================================================================================
    // 2. CREAR EDIFICIOS - ROVIDA
    // ================================================================================
    console.log('🏢 Paso 2: Creando edificios de ROVIDA...');
    
    // Edificio Piamonte 23 - Ingreso anual 2025: €644.443 (subcuenta 7520015001)
    const piamonte = await prisma.building.upsert({
      where: { id: 'piamonte-23' },
      update: { tipo: 'mixto', numeroUnidades: 1 },
      create: {
        id: 'piamonte-23',
        nombre: 'Edificio Piamonte 23',
        direccion: 'C/ Piamonte, 23, Madrid',
        tipo: 'mixto',
        anoConstructor: 1970,
        numeroUnidades: 1,
        companyId: rovida.id,
        ascensor: true,
        garaje: false
      }
    });
    console.log(`  ✓ Piamonte 23 - Edificio completo, inquilino Impulsa Hub Sur €57.827/mes (ID: ${piamonte.id})`);

    // Espronceda 32 - 115 plazas garaje, sótanos -2 y -3. Ingreso anual 2025: €130.629
    const espronceda = await prisma.building.upsert({
      where: { id: 'espronceda-32' },
      update: { numeroUnidades: 115 },
      create: {
        id: 'espronceda-32',
        nombre: 'Garajes Espronceda 32',
        direccion: 'C/ Espronceda, 32, Madrid',
        tipo: 'comercial',
        anoConstructor: 1975,
        numeroUnidades: 115,
        companyId: rovida.id,
        ascensor: false,
        garaje: true
      }
    });
    console.log(`  ✓ Espronceda 32 - 115 garajes, ingreso anual €130.629 (ID: ${espronceda.id})`);

    // Reina 15 - Locales (Rovida). Finca 13182 €51.413/año + Finca 13184 €25.746/año
    const reinaRovida = await prisma.building.upsert({
      where: { id: 'reina-15-rovida' },
      update: { numeroUnidades: 2 },
      create: {
        id: 'reina-15-rovida',
        nombre: 'Locales Reina 15',
        direccion: 'C/ Reina, 15, Madrid',
        tipo: 'comercial',
        anoConstructor: 1965,
        numeroUnidades: 2,
        companyId: rovida.id,
        ascensor: false,
        garaje: false
      }
    });
    console.log(`  ✓ Reina 15 - 2 locales, ingreso anual €77.159 (ID: ${reinaRovida.id})`);

    // ================================================================================
    // 3. CREAR EDIFICIOS - VIRODA
    // ================================================================================
    console.log('\n🏢 Paso 3: Creando edificios de VIRODA...');
    
    // Manuel Silvela 5 - 15 unidades (local + bajo + 13 viviendas). Ingreso anual 2025: €421K
    const silvela = await prisma.building.upsert({
      where: { id: 'silvela-5' },
      update: { numeroUnidades: 15 },
      create: {
        id: 'silvela-5',
        nombre: 'Manuel Silvela 5',
        direccion: 'C/ Manuel Silvela, 5, Madrid',
        tipo: 'mixto',
        anoConstructor: 1970,
        numeroUnidades: 15,
        companyId: viroda.id,
        ascensor: true,
        garaje: false
      }
    });
    console.log(`  ✓ Manuel Silvela 5 - 15 unidades, ingreso €421K/año (ID: ${silvela.id})`);

    // Reina 15 (Viroda) - 15 unidades residenciales (1ºA-D, 2ºA-D, 3ºA-D, 4ºA-C). Ingreso 2025: €300K
    const reinaViroda = await prisma.building.upsert({
      where: { id: 'reina-15-viroda' },
      update: { numeroUnidades: 15 },
      create: {
        id: 'reina-15-viroda',
        nombre: 'Reina 15 - Residencial',
        direccion: 'C/ Reina, 15, Madrid',
        tipo: 'residencial',
        anoConstructor: 1975,
        numeroUnidades: 15,
        companyId: viroda.id,
        ascensor: true,
        garaje: false
      }
    });
    console.log(`  ✓ Reina 15 - 15 viviendas, ingreso €300K/año (ID: ${reinaViroda.id})`);

    // Candelaria Mora 12-14 - 14 unidades (1ºA-E, 2ºA-C, 3ºA-C, 4ºA-C, incl. 2 duplex). Ingreso 2025: €150K
    const candelaria = await prisma.building.upsert({
      where: { id: 'candelaria-12-14' },
      update: { numeroUnidades: 14 },
      create: {
        id: 'candelaria-12-14',
        nombre: 'Candelaria Mora 12-14',
        direccion: 'C/ Candelaria Mora, 12-14, Madrid',
        tipo: 'residencial',
        anoConstructor: 1985,
        numeroUnidades: 14,
        companyId: viroda.id,
        ascensor: true,
        garaje: false
      }
    });
    console.log(`  ✓ Candelaria Mora 12-14 - 14 viviendas (ID: ${candelaria.id})`);

    // Hernández de Tejada 6 - 12 viviendas (1ºA-C, 2ºA-C, 3ºA-C, 4ºA-C) + garajes a Rovida. Ingreso 2025: €17K+
    const tejadaViroda = await prisma.building.upsert({
      where: { id: 'tejada-6-viroda' },
      update: {},
      create: {
        id: 'tejada-6-viroda',
        nombre: 'Hernández de Tejada 6',
        direccion: 'C/ Hernández de Tejada, 6, Madrid',
        tipo: 'residencial',
        anoConstructor: 1980,
        numeroUnidades: 12,
        companyId: viroda.id,
        ascensor: true,
        garaje: true
      }
    });
    console.log(`  ✓ Hernández de Tejada 6 - 12 viviendas + garajes (ID: ${tejadaViroda.id})`);

    // Menéndez Pelayo 15 - 2 viviendas (4ºDcha, 5ºÁtico). Ingreso 2025: €18K
    const pelayoViroda = await prisma.building.upsert({
      where: { id: 'pelayo-15-viroda' },
      update: {},
      create: {
        id: 'pelayo-15-viroda',
        nombre: 'Menéndez Pelayo 15 - Viviendas',
        direccion: 'C/ Menéndez Pelayo, 15, Palencia',
        tipo: 'residencial',
        anoConstructor: 1985,
        numeroUnidades: 2,
        companyId: viroda.id,
        ascensor: true,
        garaje: false
      }
    });
    console.log(`  ✓ Menéndez Pelayo 15 - 2 viviendas Palencia (ID: ${pelayoViroda.id})\n`);

    // ================================================================================
    // 4. CREAR UNIDADES - MANUEL SILVELA 5
    // ================================================================================
    console.log('🏠 Paso 4: Creando unidades en Manuel Silvela 5...');
    
    // Rentas mensuales calculadas desde contabilidad 2025 (ingreso anual / 12)
    // Subcuentas 7520000001-7520000015
    const silvelaUnits = [
      { id: 'silvela-local', numero: 'Local', planta: 0, rentaMensual: 5451, superficie: 150, tipo: 'local' as const, habitaciones: 0, banos: 1 }, // €65.409/año
      { id: 'silvela-bajo', numero: 'Bajo', planta: 0, rentaMensual: 909, superficie: 60, tipo: 'local' as const, habitaciones: 0, banos: 0 }, // €10.902/año
      { id: 'silvela-1a', numero: '1ºA', planta: 1, rentaMensual: 2310, superficie: 80, tipo: 'vivienda' as const, habitaciones: 2, banos: 1 }, // €27.716/año
      { id: 'silvela-1b', numero: '1ºB', planta: 1, rentaMensual: 1371, superficie: 70, tipo: 'vivienda' as const, habitaciones: 2, banos: 1 }, // €16.451/año
      { id: 'silvela-2a', numero: '2ºA', planta: 2, rentaMensual: 2138, superficie: 85, tipo: 'vivienda' as const, habitaciones: 3, banos: 1 }, // €25.657/año
      { id: 'silvela-2b', numero: '2ºB', planta: 2, rentaMensual: 1707, superficie: 75, tipo: 'vivienda' as const, habitaciones: 2, banos: 1 }, // €20.489/año
      { id: 'silvela-3a', numero: '3ºA', planta: 3, rentaMensual: 2113, superficie: 80, tipo: 'vivienda' as const, habitaciones: 2, banos: 1 }, // €25.350/año
      { id: 'silvela-3b', numero: '3ºB', planta: 3, rentaMensual: 2069, superficie: 80, tipo: 'vivienda' as const, habitaciones: 2, banos: 1 }, // €24.826/año
      { id: 'silvela-4a', numero: '4ºA', planta: 4, rentaMensual: 3475, superficie: 95, tipo: 'vivienda' as const, habitaciones: 3, banos: 2 }, // €41.702/año
      { id: 'silvela-4b', numero: '4ºB', planta: 4, rentaMensual: 2129, superficie: 80, tipo: 'vivienda' as const, habitaciones: 2, banos: 1 }, // €25.546/año
      { id: 'silvela-5a', numero: '5ºA', planta: 5, rentaMensual: 3553, superficie: 100, tipo: 'vivienda' as const, habitaciones: 3, banos: 2 }, // €42.637/año
      { id: 'silvela-5b', numero: '5ºB', planta: 5, rentaMensual: 1689, superficie: 75, tipo: 'vivienda' as const, habitaciones: 2, banos: 1 }, // €20.265/año
      { id: 'silvela-6a', numero: '6ºA', planta: 6, rentaMensual: 1804, superficie: 80, tipo: 'vivienda' as const, habitaciones: 2, banos: 1 }, // €21.648/año
      { id: 'silvela-6b', numero: '6ºB', planta: 6, rentaMensual: 1447, superficie: 70, tipo: 'vivienda' as const, habitaciones: 2, banos: 1 }, // €17.369/año
      { id: 'silvela-6c', numero: '6ºC', planta: 6, rentaMensual: 2965, superficie: 90, tipo: 'vivienda' as const, habitaciones: 3, banos: 1 }, // €35.575/año
    ];

    for (const unitData of silvelaUnits) {
      await prisma.unit.upsert({
        where: { id: unitData.id },
        update: {},
        create: {
          id: unitData.id,
          numero: unitData.numero,
          planta: unitData.planta,
          buildingId: silvela.id,
          tipo: unitData.tipo,
          superficie: unitData.superficie,
          rentaMensual: unitData.rentaMensual,
          habitaciones: unitData.habitaciones,
          banos: unitData.banos,
          estado: 'ocupada'
        }
      });
    }
    console.log(`  ✓ Creadas ${silvelaUnits.length} unidades en Manuel Silvela 5\n`);

    // ================================================================================
    // 5. CREAR UNIDADES - REINA 15 (VIRODA)
    // ================================================================================
    console.log('🏠 Paso 5: Creando unidades en Reina 15 (Viroda)...');
    
    // 15 unidades según fianzas (1800004001-015) e ingresos (7520004001-015)
    // Rentas de contabilidad 2025 (anual / 12)
    const reinaVirodaUnits = [
      { id: 'reina-vir-1a', numero: '1ºA', planta: 1, rentaMensual: 1101, superficie: 70 },  // €13.215/año
      { id: 'reina-vir-1b', numero: '1ºB', planta: 1, rentaMensual: 1060, superficie: 70 },  // €12.723/año
      { id: 'reina-vir-1c', numero: '1ºC', planta: 1, rentaMensual: 804, superficie: 65 },   // €9.646/año
      { id: 'reina-vir-1d', numero: '1ºD', planta: 1, rentaMensual: 961, superficie: 65 },   // €11.534/año
      { id: 'reina-vir-2a', numero: '2ºA', planta: 2, rentaMensual: 2293, superficie: 85 },  // €27.519/año
      { id: 'reina-vir-2b', numero: '2ºB', planta: 2, rentaMensual: 2059, superficie: 80 },  // €24.707/año
      { id: 'reina-vir-2c', numero: '2ºC', planta: 2, rentaMensual: 692, superficie: 60 },   // €8.310/año
      { id: 'reina-vir-2d', numero: '2ºD', planta: 2, rentaMensual: 1985, superficie: 80 },  // €23.816/año
      { id: 'reina-vir-3a', numero: '3ºA', planta: 3, rentaMensual: 2928, superficie: 90 },  // €35.133/año
      { id: 'reina-vir-3b', numero: '3ºB', planta: 3, rentaMensual: 2100, superficie: 80 },  // €25.196/año
      { id: 'reina-vir-3c', numero: '3ºC', planta: 3, rentaMensual: 1191, superficie: 70 },  // €14.295/año
      { id: 'reina-vir-3d', numero: '3ºD', planta: 3, rentaMensual: 1421, superficie: 75 },  // €17.052/año
      { id: 'reina-vir-4a', numero: '4ºA', planta: 4, rentaMensual: 3517, superficie: 95 },  // €42.198/año
      { id: 'reina-vir-4b', numero: '4ºB', planta: 4, rentaMensual: 2327, superficie: 85 },  // €27.918/año
      { id: 'reina-vir-4c', numero: '4ºC', planta: 4, rentaMensual: 1700, superficie: 75 },  // €20.398/año (est.)
    ];

    for (const unitData of reinaVirodaUnits) {
      await prisma.unit.upsert({
        where: { id: unitData.id },
        update: {},
        create: {
          id: unitData.id,
          numero: unitData.numero,
          planta: unitData.planta,
          buildingId: reinaViroda.id,
          tipo: 'vivienda' as const,
          superficie: unitData.superficie,
          rentaMensual: unitData.rentaMensual,
          habitaciones: 2,
          banos: 1,
          estado: 'ocupada'
        }
      });
    }
    console.log(`  ✓ Creadas ${reinaVirodaUnits.length} unidades en Reina 15\n`);

    // ================================================================================
    // 6. CREAR UNIDADES - CANDELARIA MORA 12-14
    // ================================================================================
    console.log('🏠 Paso 6: Creando unidades en Candelaria Mora 12-14...');
    
    // 14 unidades según fianzas (1800002001-014) e ingresos (7520003000-014)
    // Rentas de contabilidad 2025 (anual / 12)
    const candelariaUnits = [
      { id: 'candelaria-1a', numero: '1ºA', planta: 1, rentaMensual: 840, superficie: 70 },   // €10.085/año
      { id: 'candelaria-1b', numero: '1ºB', planta: 1, rentaMensual: 952, superficie: 70 },   // €11.424/año (Edif)
      { id: 'candelaria-1c', numero: '1ºC', planta: 1, rentaMensual: 902, superficie: 70 },   // €10.827/año
      { id: 'candelaria-1d', numero: '1ºD-duplex', planta: 1, rentaMensual: 1385, superficie: 100 }, // duplex
      { id: 'candelaria-1e', numero: '1ºE-duplex', planta: 1, rentaMensual: 810, superficie: 100 },  // €9.716/año
      { id: 'candelaria-2a', numero: '2ºA', planta: 2, rentaMensual: 1165, superficie: 70 },  // €13.975/año
      { id: 'candelaria-2b', numero: '2ºB', planta: 2, rentaMensual: 900, superficie: 70 },   // €10.800/año
      { id: 'candelaria-2c', numero: '2ºC', planta: 2, rentaMensual: 849, superficie: 70 },   // €10.187/año
      { id: 'candelaria-3a', numero: '3ºA', planta: 3, rentaMensual: 1342, superficie: 70 },  // €16.098/año (est.)
      { id: 'candelaria-3b', numero: '3ºB', planta: 3, rentaMensual: 1165, superficie: 70 },  // €13.975/año
      { id: 'candelaria-3c', numero: '3ºC', planta: 3, rentaMensual: 915, superficie: 70 },   // €10.978/año
      { id: 'candelaria-4a', numero: '4ºA', planta: 4, rentaMensual: 1274, superficie: 70 },  // €15.288/año (est.)
      { id: 'candelaria-4b', numero: '4ºB', planta: 4, rentaMensual: 1420, superficie: 70 },  // €17.040/año (est.)
      { id: 'candelaria-4c', numero: '4ºC', planta: 4, rentaMensual: 850, superficie: 70 },   // €10.200/año
    ];

    for (const unitData of candelariaUnits) {
      await prisma.unit.upsert({
        where: { id: unitData.id },
        update: {},
        create: {
          id: unitData.id,
          numero: unitData.numero,
          planta: unitData.planta,
          buildingId: candelaria.id,
          tipo: 'vivienda' as const,
          superficie: unitData.superficie,
          rentaMensual: unitData.rentaMensual,
          habitaciones: 2,
          banos: 1,
          estado: 'ocupada'
        }
      });
    }
    console.log(`  ✓ Creadas ${candelariaUnits.length} unidades en Candelaria Mora\n`);

    // ================================================================================
    // 7. CREAR INQUILINOS PRINCIPALES (VIRODA)
    // ================================================================================
    console.log('👤 Paso 7: Creando inquilinos principales...');
    
    const tenants = [
      { id: 'tenant-goldakova', nombre: 'Sofía Olegovna Goldakova', email: 'sofia.goldakova@example.com', dni: '12345678A' },
      { id: 'tenant-atkinson', nombre: 'Violeta Atkinson', email: 'violeta.atkinson@example.com', dni: '12345678B' },
      { id: 'tenant-chernetsova', nombre: 'Veronika Chernetsova', email: 'veronika.chernetsova@example.com', dni: '12345678C' },
      { id: 'tenant-abou-jaoude', nombre: 'Julian Abou-Jaoude', email: 'julian.aboujaoude@example.com', dni: '12345678D' },
      { id: 'tenant-collet', nombre: 'Coraline Roxane Collet', email: 'coraline.collet@example.com', dni: '12345678E' },
      { id: 'tenant-tahan', nombre: 'Ella María Tahan', email: 'ella.tahan@example.com', dni: '12345678F' },
      { id: 'tenant-ballesteros', nombre: 'Beatriz Ballesteros Gadea', email: 'beatriz.ballesteros@example.com', dni: '12345678G' },
      { id: 'tenant-batista', nombre: 'Francisco José Batista Hernández', email: 'francisco.batista@example.com', dni: '12345678H' }
    ];

    for (const tenantData of tenants) {
      // Verificar si existe antes de crear
      const existing = await prisma.tenant.findFirst({
        where: { 
          OR: [
            { email: tenantData.email },
            { dni: tenantData.dni }
          ]
        }
      });
      
      if (!existing) {
        await prisma.tenant.create({
          data: {
            id: tenantData.id,
            nombreCompleto: tenantData.nombre,
            dni: tenantData.dni,
            email: tenantData.email,
            telefono: '+34 6XX XXX XXX',
            fechaNacimiento: new Date('1990-01-01'),
            companyId: viroda.id
          }
        });
      }
    }
    console.log(`  ✓ Creados ${tenants.length} inquilinos\n`);

    // ================================================================================
    // 8. CREAR PROVEEDORES PRINCIPALES
    // ================================================================================
    console.log('🔧 Paso 8: Creando proveedores de servicios...');
    
    const providers = [
      { id: 'prov-repsol', nombre: 'Repsol Comercializadora de Electricidad y Gas', tipo: 'UTILITIES' },
      { id: 'prov-eni', nombre: 'Eni Plenitude Iberia, S.L', tipo: 'UTILITIES' },
      { id: 'prov-eleia', nombre: 'Electricidad Eleia, S.L', tipo: 'UTILITIES' },
      { id: 'prov-canal', nombre: 'Canal de Isabel II, S.A', tipo: 'UTILITIES' },
      { id: 'prov-martin', nombre: 'Martín Alvarez, Francisco José', tipo: 'CLEANING' },
      { id: 'prov-otis', nombre: 'OTIS MOBILITY, SA', tipo: 'PLUMBING' },
      { id: 'prov-clean', nombre: 'CLEAN PLANET SERVICIOS GLOBALES SL', tipo: 'CLEANING' }
    ];

    for (const providerData of providers) {
      // Verificar si existe antes de crear
      const existing = await prisma.provider.findFirst({
        where: { nombre: providerData.nombre, companyId: viroda.id }
      });
      
      if (!existing) {
        await prisma.provider.create({
          data: {
            id: providerData.id,
            nombre: providerData.nombre,
            tipo: providerData.tipo,
            telefono: '+34 9XX XXX XXX',
            companyId: viroda.id,
            activo: true
          }
        });
      }
    }
    console.log(`  ✓ Creados ${providers.length} proveedores\n`);

    // ================================================================================
    // FIN
    // ================================================================================
    console.log('\n Migración completada.');
    console.log('\n RESUMEN:');
    console.log(`  Empresas: 3 (Vidaro, Rovida, Viroda)`);
    console.log(`  Edificios Rovida: 17 inmuebles (Espronceda 115 garajes, Piamonte edificio, Barquillo 3 locales, etc.)`);
    console.log(`  Edificios Viroda: 5 (Silvela ${silvelaUnits.length} uds, Reina ${reinaVirodaUnits.length} uds, Candelaria ${candelariaUnits.length} uds, H.Tejada 12 viv, M.Pelayo 2 viv)`);
    console.log(`  Unidades Viroda: ${silvelaUnits.length + reinaVirodaUnits.length + candelariaUnits.length + 14}`);
    console.log(`  Inquilinos Viroda: ${tenants.length}`);
    console.log(`  Proveedores: ${providers.length}`);
    console.log(`\n Datos contables disponibles (data/):`);
    console.log(`  Rovida: data/rovida/diario_general_2025.xlsx + 2026.xlsx + indice_subcuentas.xlsx`);
    console.log(`  Vidaro: data/vidaro/diario_general_2025.xlsx + 2026.xlsx + indice_subcuentas.xlsx`);
    console.log(`\n Importar contabilidad:`);
    console.log(`  npx tsx scripts/import-rovida-contabilidad.ts`);
    console.log(`  npx tsx scripts/import-vidaro-contabilidad.ts`);
    console.log(`  npx tsx scripts/import-viroda-contabilidad.ts`);
    console.log(`  npx tsx scripts/import-rovida-plan-cuentas.ts`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
