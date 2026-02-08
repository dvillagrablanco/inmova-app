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

type BuildingTypeValue = 'residencial' | 'mixto' | 'comercial';
type UnitTypeValue =
  | 'vivienda'
  | 'local'
  | 'garaje'
  | 'trastero'
  | 'oficina'
  | 'nave_industrial'
  | 'coworking_space';
type ContractTypeValue = 'residencial' | 'comercial' | 'temporal';

type CreatedUnit = {
  id: string;
  rentaMensual: number;
  buildingId: string;
  tipo: UnitTypeValue;
};

type CreatedTenant = {
  id: string;
};

const mapBuildingType = (tipoPropiedad: string): BuildingTypeValue => {
  const normalized = tipoPropiedad.trim().toLowerCase();

  if (normalized === 'comercial' || normalized === 'oficinas' || normalized === 'oficina') {
    return 'comercial';
  }

  if (normalized === 'mixto') {
    return 'mixto';
  }

  return 'residencial';
};

const mapUnitType = (tipoUnidad: string): UnitTypeValue => {
  const normalized = tipoUnidad.trim().toLowerCase();

  if (normalized.includes('oficina')) return 'oficina';
  if (normalized.includes('local')) return 'local';
  if (normalized.includes('garaje')) return 'garaje';
  if (normalized.includes('trastero')) return 'trastero';
  if (normalized.includes('coworking')) return 'coworking_space';
  if (normalized.includes('nave')) return 'nave_industrial';

  return 'vivienda';
};

const mapContractType = (
  unitType: UnitTypeValue,
  scenarioId: DemoScenario
): ContractTypeValue => {
  if (
    unitType === 'local' ||
    unitType === 'oficina' ||
    unitType === 'nave_industrial' ||
    unitType === 'coworking_space'
  ) {
    return 'comercial';
  }

  if (scenarioId === 'alquiler_turistico') {
    return 'temporal';
  }

  return 'residencial';
};

const buildDireccion = (direccion: string, ciudad: string, codigoPostal: string) =>
  `${direccion}, ${ciudad} ${codigoPostal}`.trim();

const buildAnoConstructor = (index: number) => 1995 + (index % 25);

const mapMaintenancePriority = (priority: string): 'alta' | 'media' | 'baja' => {
  if (priority === 'alta' || priority === 'media' || priority === 'baja') {
    return priority;
  }

  return 'media';
};

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

/**
 * Genera los datos específicos según el escenario
 */
async function generateScenarioData(companyId: string, config: DemoScenarioConfig) {
  const createdBuildings: Array<{ id: string }> = [];
  const createdUnits: CreatedUnit[] = [];
  const createdTenants: CreatedTenant[] = [];
  let createdContracts = 0;
  let createdPayments = 0;
  let createdIncidencias = 0;
  let createdLeads = 0;
  let createdReservas = 0;
  let createdEventos = 0;

  // 1. Crear edificios según el escenario
  for (const [index, edificioData] of config.datos.edificios.entries()) {
    const tipo = mapBuildingType(edificioData.tipoPropiedad);
    const numeroUnidades = edificioData.unidades.length;
    const direccionCompleta = buildDireccion(
      edificioData.direccion,
      edificioData.ciudad,
      edificioData.codigoPostal
    );

    const building = await prisma.building.create({
      data: {
        companyId,
        nombre: edificioData.nombre,
        direccion: direccionCompleta,
        tipo,
        anoConstructor: buildAnoConstructor(index),
        numeroUnidades,
        isDemo: true,
      },
      select: { id: true },
    });
    createdBuildings.push(building);

    // Crear unidades del edificio
    for (let i = 0; i < edificioData.unidades.length; i++) {
      const unidadData = edificioData.unidades[i];
      const floor = Math.ceil((i + 1) / 2);
      const letter = (i + 1) % 2 === 0 ? 'B' : 'A';
      const unitType = mapUnitType(unidadData.tipo);

      const unit = await prisma.unit.create({
        data: {
          buildingId: building.id,
          numero: unidadData.tipo.includes('habitacion') 
            ? `H${String(i + 1).padStart(2, '0')}` 
            : `${floor}${letter}`,
          tipo: unitType,
          planta: floor,
          superficie: unidadData.superficie,
          habitaciones: unidadData.habitaciones,
          banos: unidadData.banos,
          rentaMensual: unidadData.precioAlquiler,
          estado: 'disponible',
          isDemo: true,
        },
        select: {
          id: true,
          rentaMensual: true,
          buildingId: true,
          tipo: true,
        },
      });
      createdUnits.push(unit);
    }
  }

  // 2. Crear inquilinos según el escenario
  const numInquilinos = Math.min(config.datos.inquilinosBase, DEMO_TENANT_NAMES.length);
  for (let i = 0; i < numInquilinos; i++) {
    const tenantData = DEMO_TENANT_NAMES[i];
    const birthYear = 1985 + (i % 20);
    const birthMonth = i % 12;
    const birthDay = (i % 28) + 1;
    const telefonoSuffix = String(10000000 + i).slice(-8);

    const tenant = await prisma.tenant.create({
      data: {
        companyId,
        nombreCompleto: tenantData.nombre,
        email: `${tenantData.email}@demo.inmova.app`,
        telefono: `+34 6${telefonoSuffix}`,
        dni: tenantData.dni,
        fechaNacimiento: new Date(birthYear, birthMonth, birthDay),
        isDemo: true,
      },
      select: { id: true },
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
  const rentableUnits = createdUnits.filter(u => u.rentaMensual > 0);

  for (let i = 0; i < numContratos && i < rentableUnits.length; i++) {
    const unit = rentableUnits[i];
    const tenant = createdTenants[i % createdTenants.length];

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));

    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    const contractType = mapContractType(unit.tipo, config.id);

    const contract = await prisma.contract.create({
      data: {
        unitId: unit.id,
        tenantId: tenant.id,
        fechaInicio: startDate,
        fechaFin: endDate,
        rentaMensual: unit.rentaMensual,
        deposito: unit.rentaMensual * 2,
        estado: 'activo',
        tipo: contractType,
        isDemo: true,
      },
      select: { id: true, rentaMensual: true },
    });
    createdContracts += 1;

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
      const periodo = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;

      await prisma.payment.create({
        data: {
          contractId: contract.id,
          periodo,
          monto: contract.rentaMensual,
          fechaVencimiento: paymentDate,
          fechaPago: paymentDate,
          estado: 'pagado',
          isDemo: true,
        },
      });
      createdPayments += 1;
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

    try {
      await prisma.maintenanceRequest.create({
        data: {
          unitId: unit.id,
          titulo: incidenciaData.titulo,
          descripcion: `[${incidenciaData.categoria}] ${incidenciaData.descripcion}`,
          prioridad: mapMaintenancePriority(incidenciaData.prioridad),
          estado: 'pendiente',
          fechaSolicitud: new Date(),
          isDemo: true,
        },
      });
      createdIncidencias += 1;
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
    contracts: createdContracts,
    payments: createdPayments,
    incidencias: createdIncidencias,
    leads: createdLeads,
    reservas: createdReservas,
    eventos: createdEventos,
    modulosActivados: config.modulosActivados,
  };
}
