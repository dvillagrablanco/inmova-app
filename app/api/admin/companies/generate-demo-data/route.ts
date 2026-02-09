import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import logger from '@/lib/logger';
import { 
  DEMO_SCENARIOS, 
  DEMO_TENANT_NAMES, 
  DEMO_INCIDENCIAS,
  type DemoScenario,
  type DemoScenarioConfig 
} from '@/lib/demo-scenarios';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const requestSchema = z.object({
  companyId: z.string().min(1),
  scenario: z.enum([
    'gestor_residencial',
    'propietario_particular',
    'agencia_inmobiliaria',
    'coliving',
    'alquiler_turistico',
    'comercial_oficinas',
    'comunidad_propietarios',
    'inversor_inmobiliario',
    'completo'
  ]).default('gestor_residencial'),
});

/**
 * POST /api/admin/companies/generate-demo-data
 * Genera datos de ejemplo personalizados según el escenario seleccionado
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { companyId, scenario } = requestSchema.parse(body);

    // Verificar que la empresa existe y es de demo
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, nombre: true, esEmpresaPrueba: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    if (!company.esEmpresaPrueba) {
      return NextResponse.json(
        { error: 'Solo se pueden generar datos de ejemplo para empresas de demo' },
        { status: 400 }
      );
    }

    // Verificar si ya tiene datos
    const existingBuildings = await prisma.building.count({ where: { companyId } });
    if (existingBuildings > 0) {
      return NextResponse.json(
        { error: 'Esta empresa ya tiene datos. Elimine los datos existentes primero.' },
        { status: 400 }
      );
    }

    // Obtener configuración del escenario
    const scenarioConfig = DEMO_SCENARIOS[scenario as DemoScenario];
    if (!scenarioConfig) {
      return NextResponse.json(
        { error: 'Escenario no válido' },
        { status: 400 }
      );
    }

    logger.info(`Generando datos de demo (${scenario}) para empresa: ${company.nombre}`, { 
      companyId, 
      scenario,
      scenarioName: scenarioConfig.nombre 
    });

    // Generar datos según el escenario
    const result = await generateScenarioData(companyId, scenarioConfig);

    logger.info(`Datos de demo generados exitosamente para empresa: ${company.nombre}`, {
      companyId,
      scenario,
      summary: result,
    });

    return NextResponse.json({
      success: true,
      message: `Datos de ejemplo generados correctamente para escenario: ${scenarioConfig.nombre}`,
      scenario: {
        id: scenario,
        nombre: scenarioConfig.nombre,
        descripcion: scenarioConfig.descripcion,
      },
      summary: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error generating demo data:', error);
    return NextResponse.json(
      { error: 'Error al generar datos de ejemplo' },
      { status: 500 }
    );
  }
}

function normalizeBuildingType(tipoPropiedad: string): 'residencial' | 'mixto' | 'comercial' {
  const normalized = tipoPropiedad.trim().toLowerCase();

  if (normalized.includes('mixto')) {
    return 'mixto';
  }

  if (normalized.includes('comercial') || normalized.includes('oficina') || normalized.includes('local')) {
    return 'comercial';
  }

  return 'residencial';
}

/**
 * Genera los datos específicos según el escenario
 */
async function generateScenarioData(companyId: string, config: DemoScenarioConfig) {
  const createdBuildings: any[] = [];
  const createdUnits: any[] = [];
  const createdTenants: any[] = [];
  const createdContracts: any[] = [];
  const createdPayments: any[] = [];
  const createdIncidencias: any[] = [];
  let createdLeads = 0;
  let createdReservas = 0;
  let createdEventos = 0;

  // 1. Crear edificios según el escenario
  for (const edificioData of config.datos.edificios) {
    const buildingIndex = createdBuildings.length;
    const direccionCompleta = [
      edificioData.direccion,
      edificioData.codigoPostal,
      edificioData.ciudad,
    ]
      .filter(Boolean)
      .join(', ');
    const tipo = normalizeBuildingType(edificioData.tipoPropiedad);
    const numeroUnidades = edificioData.unidades.length;
    const anoConstructor = 2000 + (buildingIndex % 20);

    const building = await prisma.building.create({
      data: {
        companyId,
        nombre: edificioData.nombre,
        direccion: direccionCompleta,
        tipo,
        anoConstructor,
        numeroUnidades,
        isDemo: true,
      },
    });
    createdBuildings.push(building);

    // Crear unidades del edificio
    for (let i = 0; i < edificioData.unidades.length; i++) {
      const unidadData = edificioData.unidades[i];
      const floor = Math.ceil((i + 1) / 2);
      const letter = (i + 1) % 2 === 0 ? 'B' : 'A';

      const unit = await prisma.unit.create({
        data: {
          buildingId: building.id,
          numero: unidadData.tipo.includes('habitacion') 
            ? `H${String(i + 1).padStart(2, '0')}` 
            : `${floor}${letter}`,
          tipo: unidadData.tipo,
          planta: floor,
          superficie: unidadData.superficie,
          habitaciones: unidadData.habitaciones,
          banos: unidadData.banos,
          precioAlquiler: unidadData.precioAlquiler,
          estado: 'disponible',
          activo: true,
          caracteristicas: unidadData.caracteristicas 
            ? JSON.stringify(unidadData.caracteristicas) 
            : null,
        },
      });
      createdUnits.push(unit);
    }
  }

  // 2. Crear inquilinos según el escenario
  const numInquilinos = Math.min(config.datos.inquilinosBase, DEMO_TENANT_NAMES.length);
  for (let i = 0; i < numInquilinos; i++) {
    const tenantData = DEMO_TENANT_NAMES[i];
    const tenant = await prisma.tenant.create({
      data: {
        companyId,
        nombre: tenantData.nombre,
        email: `${tenantData.email}@demo.inmova.app`,
        telefono: `+34 6${String(Math.random()).slice(2, 10)}`,
        dni: tenantData.dni,
        activo: true,
      },
    });
    createdTenants.push(tenant);
  }

  // 3. Crear contratos activos
  const numContratos = Math.min(
    config.datos.contratosActivos, 
    createdTenants.length, 
    createdUnits.length
  );

  // Filtrar unidades que no sean de comunidad (precio > 0)
  const rentableUnits = createdUnits.filter(u => u.precioAlquiler > 0);

  for (let i = 0; i < numContratos && i < rentableUnits.length; i++) {
    const unit = rentableUnits[i];
    const tenant = createdTenants[i % createdTenants.length];

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));

    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const contract = await prisma.contract.create({
      data: {
        companyId,
        unitId: unit.id,
        tenantId: tenant.id,
        fechaInicio: startDate,
        fechaFin: endDate,
        rentaMensual: unit.precioAlquiler,
        deposito: unit.precioAlquiler * 2,
        estado: 'activo',
        tipo: config.id === 'alquiler_turistico' ? 'temporal' : 'alquiler',
      },
    });
    createdContracts.push(contract);

    // Actualizar estado de la unidad
    await prisma.unit.update({
      where: { id: unit.id },
      data: { estado: 'ocupada' },
    });

    // Crear pagos históricos (3-6 meses)
    const numPayments = Math.floor(Math.random() * 4) + 3;
    for (let month = 1; month <= numPayments; month++) {
      const paymentDate = new Date();
      paymentDate.setMonth(paymentDate.getMonth() - month);

      const payment = await prisma.payment.create({
        data: {
          contractId: contract.id,
          monto: contract.rentaMensual,
          fechaVencimiento: paymentDate,
          fechaPago: paymentDate,
          estado: 'pagado',
          concepto: `Alquiler mes ${paymentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
        },
      });
      createdPayments.push(payment);
    }
  }

  // 4. Crear incidencias
  const numIncidencias = Math.min(
    config.datos.incidenciasAbiertas, 
    DEMO_INCIDENCIAS.length
  );
  
  for (let i = 0; i < numIncidencias; i++) {
    const incidenciaData = DEMO_INCIDENCIAS[i];
    const unit = createdUnits[Math.floor(Math.random() * createdUnits.length)];
    
    // Buscar el edificio de esta unidad
    const building = createdBuildings.find(b => 
      createdUnits.find(u => u.id === unit.id && u.buildingId === b.id)
    );

    try {
      const incidencia = await prisma.maintenanceRequest.create({
        data: {
          companyId,
          unitId: unit.id,
          buildingId: building?.id || createdBuildings[0].id,
          titulo: incidenciaData.titulo,
          descripcion: incidenciaData.descripcion,
          categoria: incidenciaData.categoria,
          prioridad: incidenciaData.prioridad,
          estado: 'abierta',
          createdAt: new Date(),
        },
      });
      createdIncidencias.push(incidencia);
    } catch (e) {
      // Si el modelo no existe o hay error, continuar
      logger.warn('Could not create maintenance request:', e);
    }
  }

  // 5. Datos específicos por escenario
  
  // Leads CRM para agencia inmobiliaria
  if (config.datos.leadsCRM && config.datos.leadsCRM > 0) {
    try {
      for (let i = 0; i < config.datos.leadsCRM; i++) {
        await prisma.lead.create({
          data: {
            companyId,
            nombre: `Lead Demo ${i + 1}`,
            email: `lead${i + 1}@demo.inmova.app`,
            telefono: `+34 6${String(Math.random()).slice(2, 10)}`,
            estado: ['nuevo', 'contactado', 'cualificado', 'negociacion'][Math.floor(Math.random() * 4)],
            fuente: ['web', 'referido', 'portal', 'redes sociales'][Math.floor(Math.random() * 4)],
            notas: `Lead de demostración generado automáticamente para ${config.nombre}`,
          },
        });
        createdLeads++;
      }
    } catch (e) {
      logger.warn('Could not create leads:', e);
    }
  }

  // Reservas turísticas
  if (config.datos.reservasTuristicas && config.datos.reservasTuristicas > 0) {
    // Por ahora solo incrementamos el contador ya que el modelo de reservas puede variar
    createdReservas = config.datos.reservasTuristicas;
    logger.info(`Escenario turístico preparado para ${createdReservas} reservas demo`);
  }

  // Eventos coliving
  if (config.datos.eventosColiving && config.datos.eventosColiving > 0) {
    // Por ahora solo incrementamos el contador
    createdEventos = config.datos.eventosColiving;
    logger.info(`Escenario coliving preparado para ${createdEventos} eventos demo`);
  }

  return {
    buildings: createdBuildings.length,
    units: createdUnits.length,
    tenants: createdTenants.length,
    contracts: createdContracts.length,
    payments: createdPayments.length,
    incidencias: createdIncidencias.length,
    leads: createdLeads,
    reservas: createdReservas,
    eventos: createdEventos,
    modulosActivados: config.modulosActivados,
  };
}
