import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Datos de ejemplo para generación automática
const DEMO_DATA = {
  edificios: [
    {
      nombre: 'Residencial Torre Vista',
      direccion: 'Av. Principal 123, Madrid',
      tipo: 'residencial' as const,
      anoConstructor: 2018,
      numeroUnidades: 24,
      estadoConservacion: 'Excelente',
      certificadoEnergetico: 'B',
      ascensor: true,
      garaje: true,
      trastero: true,
      piscina: true,
      jardin: true,
      gastosComunidad: 120,
      ibiAnual: 850,
      latitud: 40.4168,
      longitud: -3.7038,
      imagenes: [],
      etiquetas: ['residencial', 'premium', 'piscina']
    },
    {
      nombre: 'Edificio Comercial Centro',
      direccion: 'Calle Mayor 45, Barcelona',
      tipo: 'comercial' as const,
      anoConstructor: 2015,
      numeroUnidades: 12,
      estadoConservacion: 'Muy Bueno',
      certificadoEnergetico: 'A',
      ascensor: true,
      garaje: true,
      trastero: false,
      piscina: false,
      jardin: false,
      gastosComunidad: 200,
      ibiAnual: 1200,
      latitud: 41.3851,
      longitud: 2.1734,
      imagenes: [],
      etiquetas: ['comercial', 'céntrico']
    },
    {
      nombre: 'Coliving Urban Life',
      direccion: 'Paseo de la Castellana 200, Madrid',
      tipo: 'residencial' as const,
      anoConstructor: 2020,
      numeroUnidades: 18,
      estadoConservacion: 'Excelente',
      certificadoEnergetico: 'A',
      ascensor: true,
      garaje: false,
      trastero: false,
      piscina: false,
      jardin: true,
      gastosComunidad: 80,
      ibiAnual: 600,
      latitud: 40.4381,
      longitud: -3.6897,
      imagenes: [],
      etiquetas: ['coliving', 'moderno', 'jóvenes']
    }
  ],
  unidades: [
    // Torre Vista
    {
      numero: '1A',
      tipo: 'vivienda' as const,
      superficie: 85,
      habitaciones: 2,
      banos: 2,
      planta: 1,
      rentaMensual: 1200,
      estado: 'disponible' as const,
      amueblado: true,
      tieneBalcon: true,
      descripcion: 'Apartamento luminoso con vistas al parque'
    },
    {
      numero: '2A',
      tipo: 'vivienda' as const,
      superficie: 95,
      habitaciones: 3,
      banos: 2,
      planta: 2,
      rentaMensual: 1400,
      estado: 'ocupada' as const,
      amueblado: false,
      tieneBalcon: true,
      descripcion: 'Amplio apartamento de 3 dormitorios'
    },
    {
      numero: '3A',
      tipo: 'vivienda' as const,
      superficie: 75,
      habitaciones: 2,
      banos: 1,
      planta: 3,
      rentaMensual: 1100,
      estado: 'disponible' as const,
      amueblado: true,
      tieneBalcon: false,
      descripcion: 'Apartamento acogedor, ideal para parejas'
    },
    // Comercial Centro
    {
      numero: 'Local 1',
      tipo: 'local' as const,
      superficie: 120,
      habitaciones: 0,
      banos: 2,
      planta: 0,
      rentaMensual: 2000,
      estado: 'disponible' as const,
      amueblado: false,
      tieneBalcon: false,
      descripcion: 'Local comercial en zona prime'
    },
    {
      numero: 'Oficina 201',
      tipo: 'local' as const,
      superficie: 80,
      habitaciones: 3,
      banos: 1,
      planta: 2,
      rentaMensual: 1600,
      estado: 'ocupada' as const,
      amueblado: true,
      tieneBalcon: false,
      descripcion: 'Oficina equipada lista para usar'
    },
    // Coliving
    {
      numero: 'Hab 101',
      tipo: 'vivienda' as const,
      superficie: 15,
      habitaciones: 1,
      banos: 0, // Baño compartido
      planta: 1,
      rentaMensual: 450,
      estado: 'disponible' as const,
      amueblado: true,
      tieneBalcon: false,
      descripcion: 'Habitación individual en coliving'
    },
    {
      numero: 'Hab 102',
      tipo: 'vivienda' as const,
      superficie: 18,
      habitaciones: 1,
      banos: 1, // Baño privado
      planta: 1,
      rentaMensual: 550,
      estado: 'ocupada' as const,
      amueblado: true,
      tieneBalcon: false,
      descripcion: 'Habitación con baño privado'
    }
  ],
  inquilinos: [
    {
      nombreCompleto: 'Juan García Pérez',
      email: 'juan.garcia@example.com',
      telefono: '+34 612 345 678',
      dni: '12345678A',
      fechaNacimiento: new Date('1990-05-15'),
      nacionalidad: 'Española',
      ingresosMensuales: 3500,
      scoring: 850
    },
    {
      nombreCompleto: 'María Martínez López',
      email: 'maria.martinez@example.com',
      telefono: '+34 623 456 789',
      dni: '23456789B',
      fechaNacimiento: new Date('1988-08-22'),
      nacionalidad: 'Española',
      ingresosMensuales: 4200,
      scoring: 920
    },
    {
      nombreCompleto: 'Carlos Rodríguez Sánchez',
      email: 'carlos.rodriguez@example.com',
      telefono: '+34 634 567 890',
      dni: '34567890C',
      fechaNacimiento: new Date('1995-03-10'),
      nacionalidad: 'Española',
      ingresosMensuales: 2800,
      scoring: 780
    },
    {
      nombreCompleto: 'Laura Fernández Gómez',
      email: 'laura.fernandez@example.com',
      telefono: '+34 645 678 901',
      dni: '45678901D',
      fechaNacimiento: new Date('1992-11-30'),
      nacionalidad: 'Española',
      ingresosMensuales: 2500,
      scoring: 820
    }
  ]
};

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session?.user?.companyId;
    const userId = session?.user?.id

    // Verificar que no existan ya datos demo
    const existingBuildings = await prisma.building.count({
      where: { companyId }
    });

    if (existingBuildings > 0) {
      return NextResponse.json({ 
        error: 'Ya existen edificios. Los datos demo solo se pueden generar en cuentas nuevas.',
        hasData: true
      }, { status: 400 });
    }

    // Crear edificios
    const createdBuildings = [];
    for (const edificio of DEMO_DATA.edificios) {
      const building = await prisma.building.create({
        data: {
          ...edificio,
          companyId
        }
      });
      createdBuildings.push(building);
    }

    // Crear unidades
    const unidadesPorEdificio = [
      DEMO_DATA.unidades.slice(0, 3), // Torre Vista
      DEMO_DATA.unidades.slice(3, 5), // Comercial Centro
      DEMO_DATA.unidades.slice(5, 7)  // Coliving
    ];

    const createdUnits = [];
    for (let i = 0; i < createdBuildings.length; i++) {
      const building = createdBuildings[i];
      const unidades = unidadesPorEdificio[i];
      
      for (const unidad of unidades) {
        const unit = await prisma.unit.create({
          data: {
            ...unidad,
            buildingId: building.id
          }
        });
        createdUnits.push(unit);
      }
    }

    // Crear inquilinos
    const createdTenants = [];
    for (const inquilino of DEMO_DATA.inquilinos) {
      const tenant = await prisma.tenant.create({
        data: {
          ...inquilino,
          companyId
        }
      });
      createdTenants.push(tenant);
    }

    // Asignar algunos inquilinos a unidades (solo las ocupadas)
    const unidadesOcupadas = createdUnits.filter(u => u.estado === 'ocupada');
    for (let i = 0; i < Math.min(unidadesOcupadas.length, createdTenants.length); i++) {
      const unit = unidadesOcupadas[i];
      const tenant = createdTenants[i];
      
      // Crear contrato
      await prisma.contract.create({
        data: {
          tenantId: tenant.id,
          unitId: unit.id,
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
          rentaMensual: unit.rentaMensual,
          deposito: unit.rentaMensual * 2,
          mesesFianza: 2,
          diaPago: 5,
          estado: 'activo',
          tipo: 'residencial',
          gastosIncluidos: [],
          gastosExcluidos: ['agua', 'luz', 'gas']
        }
      });
    }

    logger.info(`Generated demo data for company ${companyId}`);

    return NextResponse.json({
      success: true,
      summary: {
        edificios: createdBuildings.length,
        unidades: createdUnits.length,
        inquilinos: createdTenants.length,
        contratos: unidadesOcupadas.length
      },
      message: `¡Datos demo generados exitosamente! 
${createdBuildings.length} edificios, ${createdUnits.length} unidades, ${createdTenants.length} inquilinos y ${unidadesOcupadas.length} contratos creados.`
    });
  } catch (error) {
    logger.error('Error generating demo data:', error);
    return NextResponse.json({ 
      error: 'Error al generar datos demo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
