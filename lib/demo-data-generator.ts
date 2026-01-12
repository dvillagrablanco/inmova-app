import { type BusinessVertical } from '@/lib/onboarding-tours';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import * as bcrypt from 'bcryptjs';

interface DemoDataConfig {
  buildings?: number;
  units?: number;
  tenants?: number;
  contracts?: number;
}

// Configuraciones de datos demo por vertical
const DEMO_DATA_CONFIGS: Record<BusinessVertical, DemoDataConfig> = {
  alquiler_tradicional: {
    buildings: 2,
    units: 6,
    tenants: 4,
    contracts: 3,
  },
  coliving: {
    buildings: 1,
    units: 8,
    tenants: 6,
    contracts: 5,
  },
  str_vacacional: {
    buildings: 1,
    units: 4,
    tenants: 0, // STR no tiene inquilinos tradicionales
    contracts: 0,
  },
  flipping: {
    buildings: 2,
    units: 3,
    tenants: 0,
    contracts: 0,
  },
  construccion: {
    buildings: 1,
    units: 5,
    tenants: 0,
    contracts: 0,
  },
  servicios_profesionales: {
    buildings: 3,
    units: 8,
    tenants: 3,
    contracts: 2,
  },
  mixto: {
    buildings: 2,
    units: 6,
    tenants: 4,
    contracts: 3,
  },
};

// Datos de ejemplo para edificios
const DEMO_BUILDINGS = [
  {
    nombre: 'Residencial Sol Dorado',
    direccion: 'Calle Mayor 123',
    ciudad: 'Madrid',
    cp: '28013',
    ano_construccion: 2015,
  },
  {
    nombre: 'Torre Vista Mar',
    direccion: 'Av. del Mediterráneo 45',
    ciudad: 'Valencia',
    cp: '46023',
    ano_construccion: 2018,
  },
  {
    nombre: 'Edificio Modernista',
    direccion: 'Passeig de Gràcia 89',
    ciudad: 'Barcelona',
    cp: '08008',
    ano_construccion: 2020,
  },
];

// Datos de ejemplo para unidades
const DEMO_UNIT_TYPES = ['Piso', 'Apartamento', 'Estudio', 'Ático', 'Loft'];
const DEMO_UNIT_STATUSES = ['disponible', 'ocupada'];

// Datos de ejemplo para inquilinos
const DEMO_TENANTS = [
  { nombre: 'Carlos', apellidos: 'García Martínez', email: 'carlos.garcia@example.com', telefono: '+34612345678' },
  { nombre: 'María', apellidos: 'López Fernández', email: 'maria.lopez@example.com', telefono: '+34623456789' },
  { nombre: 'Juan', apellidos: 'Rodríguez Sánchez', email: 'juan.rodriguez@example.com', telefono: '+34634567890' },
  { nombre: 'Ana', apellidos: 'Martínez Pérez', email: 'ana.martinez@example.com', telefono: '+34645678901' },
  { nombre: 'Pedro', apellidos: 'Sánchez Gómez', email: 'pedro.sanchez@example.com', telefono: '+34656789012' },
  { nombre: 'Laura', apellidos: 'González Díaz', email: 'laura.gonzalez@example.com', telefono: '+34667890123' },
];

/**
 * Genera datos demo inteligentes basados en el vertical de negocio del usuario
 */
export async function generateDemoData(
  userId: string,
  companyId: string,
  vertical: BusinessVertical
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const config = DEMO_DATA_CONFIGS[vertical];

    if (!config) {
      return {
        success: false,
        message: `No hay configuración de datos demo para el vertical ${vertical}`,
      };
    }

    logger.info(`Generando datos demo para vertical: ${vertical}`, { userId, companyId });

    const generatedData: any = {
      buildings: [],
      units: [],
      tenants: [],
      contracts: [],
    };

    // 1. Generar edificios
    if (config.buildings && config.buildings > 0) {
      for (let i = 0; i < config.buildings; i++) {
        const buildingData = DEMO_BUILDINGS[i % DEMO_BUILDINGS.length];
        const building = await prisma.building.create({
          data: {
            companyId,
            nombre: `${buildingData.nombre} (Demo)`,
            direccion: buildingData.direccion,
            tipo: 'residencial',
            anoConstructor: buildingData.ano_construccion,
            numeroUnidades: Math.floor(Math.random() * 10) + 5,
            isDemo: true, // Marcar como datos de demostración
          },
        });
        generatedData.buildings.push(building);
      }
    }

    // 2. Generar unidades
    if (config.units && config.units > 0 && generatedData.buildings.length > 0) {
      const unitsPerBuilding = Math.ceil(config.units / generatedData.buildings.length);

      for (const building of generatedData.buildings) {
        for (let i = 0; i < unitsPerBuilding; i++) {
          const tipo = DEMO_UNIT_TYPES[Math.floor(Math.random() * DEMO_UNIT_TYPES.length)];
          const planta = Math.floor(Math.random() * 5) + 1;
          const puerta = String.fromCharCode(65 + (i % 4)); // A, B, C, D

          const unit = await prisma.unit.create({
            data: {
              buildingId: building.id,
              numero: `${planta}${puerta}`,
              tipo: tipo as any,
              superficie: Math.floor(Math.random() * 50) + 50,
              habitaciones: Math.floor(Math.random() * 3) + 1,
              banos: Math.floor(Math.random() * 2) + 1,
              rentaMensual: Math.floor(Math.random() * 500) + 500,
              estado: DEMO_UNIT_STATUSES[Math.floor(Math.random() * DEMO_UNIT_STATUSES.length)] as any,
              isDemo: true, // Marcar como datos de demostración
            },
          });
          generatedData.units.push(unit);
        }
      }
    }

    // 3. Generar inquilinos
    if (config.tenants && config.tenants > 0) {
      for (let i = 0; i < config.tenants; i++) {
        const tenantData = DEMO_TENANTS[i % DEMO_TENANTS.length];
        const tenant = await prisma.tenant.create({
          data: {
            companyId,
            nombreCompleto: `${tenantData.nombre} ${tenantData.apellidos}`,
            email: `demo_${Date.now()}_${i}_${tenantData.email}`,
            telefono: tenantData.telefono,
            dni: `12345678${String.fromCharCode(65 + i)}`,
            fechaNacimiento: new Date(1990 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
            nacionalidad: 'Española',
            estadoCivil: 'soltero',
            situacionLaboral: 'empleado',
            isDemo: true, // Marcar como datos de demostración
          },
        });
        generatedData.tenants.push(tenant);
      }
    }

    // 4. Generar contratos (vinculando inquilinos con unidades)
    if (config.contracts && config.contracts > 0 && generatedData.units.length > 0 && generatedData.tenants.length > 0) {
      for (let i = 0; i < Math.min(config.contracts, generatedData.tenants.length, generatedData.units.length); i++) {
        const unit = generatedData.units[i];
        const tenant = generatedData.tenants[i];

        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // Contrato de 1 año

        const contract = await prisma.contract.create({
          data: {
            unitId: unit.id,
            tenantId: tenant.id,
            fechaInicio: startDate,
            fechaFin: endDate,
            rentaMensual: unit.precio_renta,
            diaPago: 5,
            deposito: unit.precio_renta * 2,
            estado: 'activo',
            tipo: 'residencial',
            isDemo: true, // Marcar como datos de demostración
          },
        });
        generatedData.contracts.push(contract);

        // Actualizar el estado de la unidad a "ocupada"
        await prisma.unit.update({
          where: { id: unit.id },
          data: { estado: 'ocupada' },
        });
      }
    }

    logger.info('Datos demo generados exitosamente', {
      buildings: generatedData.buildings.length,
      units: generatedData.units.length,
      tenants: generatedData.tenants.length,
      contracts: generatedData.contracts.length,
    });

    return {
      success: true,
      message: 'Datos demo generados exitosamente',
      data: {
        buildings: generatedData.buildings.length,
        units: generatedData.units.length,
        tenants: generatedData.tenants.length,
        contracts: generatedData.contracts.length,
      },
    };
  } catch (error) {
    logger.error('Error al generar datos demo', error);
    return {
      success: false,
      message: 'Error al generar datos demo. Por favor, inténtalo de nuevo.',
    };
  }
}

/**
 * Verifica si el usuario ya tiene datos demo generados
 */
export async function hasDemoData(companyId: string): Promise<boolean> {
  try {
    const buildingCount = await prisma.building.count({
      where: {
        companyId,
        nombre: { contains: '(Demo)' },
      },
    });

    return buildingCount > 0;
  } catch (error) {
    logger.error('Error al verificar datos demo', error);
    return false;
  }
}
