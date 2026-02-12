/**
 * Document Parametrization Service
 * 
 * Aplica los datos extraídos de documentos al sistema de Inmova.
 * Crea o actualiza entidades (propiedades, inquilinos, contratos, etc.)
 * basándose en los datos validados.
 * 
 * @module lib/document-parametrization-service
 */

import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { ExtractedDataType } from '@/types/prisma-types';

// ============================================================================
// TIPOS
// ============================================================================

export interface ParametrizationResult {
  success: boolean;
  entitiesCreated: EntityResult[];
  entitiesUpdated: EntityResult[];
  errors: ParametrizationError[];
  summary: {
    buildings: { created: number; updated: number };
    units: { created: number; updated: number };
    tenants: { created: number; updated: number };
    contracts: { created: number; updated: number };
    providers: { created: number; updated: number };
    insurances: { created: number; updated: number };
  };
}

export interface EntityResult {
  entityType: string;
  entityId: string;
  action: 'created' | 'updated';
  fields: string[];
  sourceDocumentId: string;
}

export interface ParametrizationError {
  entityType: string;
  field: string;
  error: string;
  sourceDocumentId: string;
}

export interface ExtractedDataGroup {
  documentId: string;
  category: string;
  data: Array<{
    id: string;
    dataType: ExtractedDataType;
    fieldName: string;
    fieldValue: string;
    targetEntity: string | null;
    targetField: string | null;
    confidence: number;
  }>;
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Aplica todos los datos validados de un batch
 */
export async function applyBatchParametrization(
  batchId: string,
  companyId: string,
  userId: string
): Promise<ParametrizationResult> {
  const result: ParametrizationResult = {
    success: true,
    entitiesCreated: [],
    entitiesUpdated: [],
    errors: [],
    summary: {
      buildings: { created: 0, updated: 0 },
      units: { created: 0, updated: 0 },
      tenants: { created: 0, updated: 0 },
      contracts: { created: 0, updated: 0 },
      providers: { created: 0, updated: 0 },
      insurances: { created: 0, updated: 0 },
    },
  };

  try {
    logger.info('🚀 Iniciando parametrización de batch', { batchId });

    // Obtener todos los documentos aprobados con sus datos validados
    const documents = await prisma.documentImport.findMany({
      where: {
        batchId,
        status: 'approved',
      },
      include: {
        extractedData: {
          where: {
            isValidated: true,
            wasApplied: false,
          },
        },
      },
    });

    if (documents.length === 0) {
      logger.warn('No hay documentos aprobados para parametrizar');
      return result;
    }

    // Agrupar datos por documento y tipo
    for (const doc of documents) {
      const groupedData = groupDataByEntity(doc.extractedData as any);
      
      // Procesar cada grupo de entidad
      for (const [entityType, fields] of Object.entries(groupedData)) {
        try {
          const entityResult = await processEntityData(
            entityType,
            fields,
            doc.id,
            companyId,
            userId
          );

          if (entityResult.action === 'created') {
            result.entitiesCreated.push(entityResult);
            incrementSummary(result.summary, entityType, 'created');
          } else {
            result.entitiesUpdated.push(entityResult);
            incrementSummary(result.summary, entityType, 'updated');
          }

          // Marcar datos como aplicados
          const appliedIds = fields.map(f => f.id);
          await prisma.extractedDocumentData.updateMany({
            where: { id: { in: appliedIds } },
            data: {
              wasApplied: true,
              appliedAt: new Date(),
            },
          });

        } catch (error: any) {
          result.errors.push({
            entityType,
            field: 'general',
            error: error.message,
            sourceDocumentId: doc.id,
          });
        }
      }
    }

    // Actualizar estado del batch si todo fue exitoso
    if (result.errors.length === 0) {
      await prisma.documentImportBatch.update({
        where: { id: batchId },
        data: {
          status: 'approved',
          appliedChanges: result.summary,
          extractedEntities: {
            created: result.entitiesCreated.length,
            updated: result.entitiesUpdated.length,
          },
        },
      });
    }

    logger.info('✅ Parametrización completada', {
      batchId,
      created: result.entitiesCreated.length,
      updated: result.entitiesUpdated.length,
      errors: result.errors.length,
    });

    return result;

  } catch (error: any) {
    logger.error('❌ Error en parametrización:', error);
    result.success = false;
    result.errors.push({
      entityType: 'batch',
      field: 'general',
      error: error.message,
      sourceDocumentId: batchId,
    });
    return result;
  }
}

/**
 * Vista previa de cambios antes de aplicar
 */
export async function previewParametrization(
  batchId: string,
  companyId: string
): Promise<{
  willCreate: Array<{ type: string; data: any }>;
  willUpdate: Array<{ type: string; id: string; changes: any }>;
  conflicts: Array<{ type: string; issue: string }>;
}> {
  const preview = {
    willCreate: [] as Array<{ type: string; data: any }>,
    willUpdate: [] as Array<{ type: string; id: string; changes: any }>,
    conflicts: [] as Array<{ type: string; issue: string }>,
  };

  try {
    const documents = await prisma.documentImport.findMany({
      where: {
        batchId,
        status: { in: ['approved', 'awaiting_review'] },
      },
      include: {
        extractedData: {
          where: { isValidated: true },
        },
      },
    });

    for (const doc of documents) {
      const groupedData = groupDataByEntity(doc.extractedData as any);

      for (const [entityType, fields] of Object.entries(groupedData)) {
        const existingEntity = await findMatchingEntity(entityType, fields, companyId);

        if (existingEntity) {
          preview.willUpdate.push({
            type: entityType,
            id: existingEntity.id,
            changes: fields.reduce((acc, f) => {
              acc[f.fieldName] = f.fieldValue;
              return acc;
            }, {} as any),
          });
        } else {
          preview.willCreate.push({
            type: entityType,
            data: fields.reduce((acc, f) => {
              acc[f.fieldName] = f.fieldValue;
              return acc;
            }, {} as any),
          });
        }

        // Detectar conflictos
        const conflicts = detectConflicts(entityType, fields, existingEntity);
        preview.conflicts.push(...conflicts);
      }
    }

    return preview;
  } catch (error: any) {
    logger.error('Error generando preview:', error);
    throw error;
  }
}

// ============================================================================
// PROCESADORES POR ENTIDAD
// ============================================================================

/**
 * Procesa datos para crear/actualizar una entidad
 */
async function processEntityData(
  entityType: string,
  fields: Array<{ id: string; fieldName: string; fieldValue: string; confidence: number }>,
  documentId: string,
  companyId: string,
  userId: string
): Promise<EntityResult> {
  const fieldMap = fields.reduce((acc, f) => {
    acc[f.fieldName] = f.fieldValue;
    return acc;
  }, {} as Record<string, string>);

  switch (entityType) {
    case 'Building':
      return processBuilding(fieldMap, documentId, companyId);
    case 'Unit':
      return processUnit(fieldMap, documentId, companyId);
    case 'Tenant':
      return processTenant(fieldMap, documentId, companyId);
    case 'Contract':
      return processContract(fieldMap, documentId, companyId);
    case 'Provider':
      return processProvider(fieldMap, documentId, companyId);
    case 'Insurance':
      return processInsurance(fieldMap, documentId, companyId);
    default:
      throw new Error(`Tipo de entidad no soportado: ${entityType}`);
  }
}

/**
 * Procesa datos de edificio/propiedad
 */
async function processBuilding(
  fields: Record<string, string>,
  documentId: string,
  companyId: string
): Promise<EntityResult> {
  // Buscar edificio existente por dirección
  const existingBuilding = await prisma.building.findFirst({
    where: {
      companyId,
      direccion: {
        contains: fields.property_address || fields.direccion || '',
        mode: 'insensitive',
      },
    },
  });

  const buildingData = {
    nombre: fields.property_name || fields.nombre || `Propiedad ${new Date().toLocaleDateString()}`,
    direccion: fields.property_address || fields.direccion || 'Sin dirección',
    tipo: 'residencial' as const,
    anoConstructor: parseInt(fields.year_built || fields.ano_construccion) || 2000,
    numeroUnidades: parseInt(fields.unit_count || fields.numero_unidades) || 1,
    estadoConservacion: fields.condition || fields.estado || null,
    certificadoEnergetico: fields.energy_rating || fields.certificado_energetico || null,
    gastosComunidad: parseFloat(fields.community_fees || fields.gastos_comunidad) || null,
    ibiAnual: parseFloat(fields.ibi || fields.ibi_anual) || null,
  };

  if (existingBuilding) {
    // Actualizar edificio existente
    await prisma.building.update({
      where: { id: existingBuilding.id },
      data: buildingData,
    });

    return {
      entityType: 'Building',
      entityId: existingBuilding.id,
      action: 'updated',
      fields: Object.keys(buildingData),
      sourceDocumentId: documentId,
    };
  } else {
    // Crear nuevo edificio
    const newBuilding = await prisma.building.create({
      data: {
        ...buildingData,
        companyId,
      },
    });

    return {
      entityType: 'Building',
      entityId: newBuilding.id,
      action: 'created',
      fields: Object.keys(buildingData),
      sourceDocumentId: documentId,
    };
  }
}

/**
 * Procesa datos de unidad/vivienda
 */
async function processUnit(
  fields: Record<string, string>,
  documentId: string,
  companyId: string
): Promise<EntityResult> {
  // Necesitamos un building para la unidad
  let buildingId = fields.building_id;

  if (!buildingId) {
    // Buscar building por dirección
    const building = await prisma.building.findFirst({
      where: {
        companyId,
        direccion: {
          contains: fields.property_address || fields.direccion || '',
          mode: 'insensitive',
        },
      },
    });

    if (building) {
      buildingId = building.id;
    } else {
      // Crear building básico
      const newBuilding = await prisma.building.create({
        data: {
          companyId,
          nombre: fields.property_name || 'Propiedad importada',
          direccion: fields.property_address || fields.direccion || 'Sin dirección',
          tipo: 'residencial',
          anoConstructor: 2000,
          numeroUnidades: 1,
        },
      });
      buildingId = newBuilding.id;
    }
  }

  const unitData = {
    numero: fields.unit_number || fields.numero || '1',
    tipo: 'vivienda' as const,
    estado: 'disponible' as const,
    superficie: parseFloat(fields.surface_area || fields.superficie) || 0,
    superficieUtil: parseFloat(fields.useful_area || fields.superficie_util) || null,
    habitaciones: parseInt(fields.bedrooms || fields.habitaciones) || null,
    banos: parseInt(fields.bathrooms || fields.banos) || null,
    planta: parseInt(fields.floor || fields.planta) || null,
    rentaMensual: parseFloat(fields.monthly_rent || fields.renta_mensual) || 0,
    amueblado: fields.furnished === 'true' || fields.amueblado === 'si',
  };

  // Buscar unidad existente
  const existingUnit = await prisma.unit.findFirst({
    where: {
      buildingId,
      numero: unitData.numero,
    },
  });

  if (existingUnit) {
    await prisma.unit.update({
      where: { id: existingUnit.id },
      data: unitData,
    });

    return {
      entityType: 'Unit',
      entityId: existingUnit.id,
      action: 'updated',
      fields: Object.keys(unitData),
      sourceDocumentId: documentId,
    };
  } else {
    const newUnit = await prisma.unit.create({
      data: {
        ...unitData,
        buildingId,
      },
    });

    return {
      entityType: 'Unit',
      entityId: newUnit.id,
      action: 'created',
      fields: Object.keys(unitData),
      sourceDocumentId: documentId,
    };
  }
}

/**
 * Procesa datos de inquilino
 */
async function processTenant(
  fields: Record<string, string>,
  documentId: string,
  companyId: string
): Promise<EntityResult> {
  const dni = fields.dni || fields.document_number || fields.id_number;
  const email = fields.email || fields.email_address;

  const tenantData = {
    nombreCompleto: fields.full_name || fields.nombre_completo || fields.name || 'Sin nombre',
    dni: dni || `TEMP-${Date.now()}`,
    email: email || `temp-${Date.now()}@placeholder.com`,
    telefono: fields.phone || fields.telefono || '',
    fechaNacimiento: fields.birth_date || fields.fecha_nacimiento 
      ? new Date(fields.birth_date || fields.fecha_nacimiento) 
      : new Date('1990-01-01'),
    nacionalidad: fields.nationality || fields.nacionalidad || null,
    direccionActual: fields.current_address || fields.direccion_actual || null,
    situacionLaboral: null as any,
    empresa: fields.employer || fields.empresa || null,
    puesto: fields.job_title || fields.puesto || null,
    ingresosMensuales: parseFloat(fields.monthly_income || fields.ingresos) || null,
  };

  // Buscar inquilino existente por DNI o email
  const existingTenant = await prisma.tenant.findFirst({
    where: {
      companyId,
      OR: [
        { dni: tenantData.dni },
        { email: tenantData.email },
      ],
    },
  });

  if (existingTenant) {
    await prisma.tenant.update({
      where: { id: existingTenant.id },
      data: tenantData,
    });

    return {
      entityType: 'Tenant',
      entityId: existingTenant.id,
      action: 'updated',
      fields: Object.keys(tenantData),
      sourceDocumentId: documentId,
    };
  } else {
    const newTenant = await prisma.tenant.create({
      data: {
        ...tenantData,
        companyId,
      },
    });

    return {
      entityType: 'Tenant',
      entityId: newTenant.id,
      action: 'created',
      fields: Object.keys(tenantData),
      sourceDocumentId: documentId,
    };
  }
}

/**
 * Procesa datos de contrato
 */
async function processContract(
  fields: Record<string, string>,
  documentId: string,
  companyId: string
): Promise<EntityResult> {
  // Buscar o crear tenant
  let tenantId = fields.tenant_id;
  if (!tenantId && (fields.tenant_dni || fields.tenant_name)) {
    const tenant = await prisma.tenant.findFirst({
      where: {
        companyId,
        OR: [
          { dni: fields.tenant_dni },
          { nombreCompleto: { contains: fields.tenant_name, mode: 'insensitive' } },
        ],
      },
    });
    tenantId = tenant?.id;
  }

  // Buscar unit por dirección
  let unitId = fields.unit_id;
  if (!unitId && fields.property_address) {
    const unit = await prisma.unit.findFirst({
      where: {
        building: {
          companyId,
          direccion: { contains: fields.property_address, mode: 'insensitive' },
        },
      },
    });
    unitId = unit?.id;
  }

  if (!unitId) {
    throw new Error('No se pudo identificar la unidad para el contrato');
  }

  const contractData = {
    fechaInicio: fields.start_date || fields.fecha_inicio
      ? new Date(fields.start_date || fields.fecha_inicio)
      : new Date(),
    fechaFin: fields.end_date || fields.fecha_fin
      ? new Date(fields.end_date || fields.fecha_fin)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 año
    rentaMensual: parseFloat(fields.monthly_rent || fields.renta_mensual) || 0,
    fianza: parseFloat(fields.deposit || fields.fianza) || 0,
    diaVencimiento: parseInt(fields.payment_day || fields.dia_pago) || 1,
    estado: 'activo' as const,
    tipo: 'residencial' as const,
    actualizacionAnual: fields.annual_update || fields.actualizacion || 'IPC',
    clausulasEspeciales: fields.special_clauses || fields.clausulas || null,
  };

  // Verificar si existe contrato para esta unidad
  const existingContract = await prisma.contract.findFirst({
    where: {
      unitId,
      estado: 'activo',
    },
  });

  if (existingContract) {
    await prisma.contract.update({
      where: { id: existingContract.id },
      data: {
        ...contractData,
        tenantId: tenantId || existingContract.tenantId,
      },
    });

    return {
      entityType: 'Contract',
      entityId: existingContract.id,
      action: 'updated',
      fields: Object.keys(contractData),
      sourceDocumentId: documentId,
    };
  } else {
    const newContract = await prisma.contract.create({
      data: {
        ...contractData,
        unitId,
        tenantId: tenantId || '',
      },
    });

    return {
      entityType: 'Contract',
      entityId: newContract.id,
      action: 'created',
      fields: Object.keys(contractData),
      sourceDocumentId: documentId,
    };
  }
}

/**
 * Procesa datos de proveedor
 */
async function processProvider(
  fields: Record<string, string>,
  documentId: string,
  companyId: string
): Promise<EntityResult> {
  const providerData = {
    nombre: fields.provider_name || fields.nombre || 'Proveedor importado',
    cif: fields.provider_cif || fields.cif || null,
    email: fields.provider_email || fields.email || null,
    telefono: fields.provider_phone || fields.telefono || null,
    direccion: fields.provider_address || fields.direccion || null,
    especialidad: fields.specialty || fields.especialidad || 'general',
    activo: true,
  };

  // Buscar proveedor existente
  const existingProvider = await prisma.provider.findFirst({
    where: {
      companyId,
      OR: [
        { cif: providerData.cif },
        { nombre: { contains: providerData.nombre, mode: 'insensitive' } },
      ],
    },
  });

  if (existingProvider) {
    await prisma.provider.update({
      where: { id: existingProvider.id },
      data: providerData,
    });

    return {
      entityType: 'Provider',
      entityId: existingProvider.id,
      action: 'updated',
      fields: Object.keys(providerData),
      sourceDocumentId: documentId,
    };
  } else {
    const newProvider = await prisma.provider.create({
      data: {
        ...providerData,
        companyId,
      },
    });

    return {
      entityType: 'Provider',
      entityId: newProvider.id,
      action: 'created',
      fields: Object.keys(providerData),
      sourceDocumentId: documentId,
    };
  }
}

/**
 * Procesa datos de seguro
 */
async function processInsurance(
  fields: Record<string, string>,
  documentId: string,
  companyId: string
): Promise<EntityResult> {
  // Buscar building relacionado
  let buildingId = fields.building_id;
  if (!buildingId && fields.property_address) {
    const building = await prisma.building.findFirst({
      where: {
        companyId,
        direccion: { contains: fields.property_address, mode: 'insensitive' },
      },
    });
    buildingId = building?.id;
  }

  const insuranceData = {
    tipo: fields.insurance_type || fields.tipo || 'multirriesgo',
    aseguradora: fields.insurer || fields.aseguradora || 'Sin especificar',
    numeroPoliza: fields.policy_number || fields.numero_poliza || `POL-${Date.now()}`,
    primaAnual: parseFloat(fields.annual_premium || fields.prima) || 0,
    fechaInicio: fields.start_date 
      ? new Date(fields.start_date) 
      : new Date(),
    fechaVencimiento: fields.expiry_date || fields.fecha_vencimiento
      ? new Date(fields.expiry_date || fields.fecha_vencimiento)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    coberturas: fields.coverages || fields.coberturas || null,
    activo: true,
  };

  // Buscar seguro existente
  const existingInsurance = await prisma.insurance.findFirst({
    where: {
      companyId,
      numeroPoliza: insuranceData.numeroPoliza,
    },
  });

  if (existingInsurance) {
    await prisma.insurance.update({
      where: { id: existingInsurance.id },
      data: insuranceData,
    });

    return {
      entityType: 'Insurance',
      entityId: existingInsurance.id,
      action: 'updated',
      fields: Object.keys(insuranceData),
      sourceDocumentId: documentId,
    };
  } else {
    const newInsurance = await prisma.insurance.create({
      data: {
        ...insuranceData,
        companyId,
        buildingId: buildingId || null,
      },
    });

    return {
      entityType: 'Insurance',
      entityId: newInsurance.id,
      action: 'created',
      fields: Object.keys(insuranceData),
      sourceDocumentId: documentId,
    };
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Agrupa datos extraídos por tipo de entidad
 */
function groupDataByEntity(
  data: Array<{
    id: string;
    fieldName: string;
    fieldValue: string;
    targetEntity: string | null;
    confidence: number;
  }>
): Record<string, Array<{ id: string; fieldName: string; fieldValue: string; confidence: number }>> {
  const grouped: Record<string, any[]> = {};

  for (const item of data) {
    const entity = item.targetEntity || inferEntityFromField(item.fieldName);
    if (!grouped[entity]) {
      grouped[entity] = [];
    }
    grouped[entity].push(item);
  }

  return grouped;
}

/**
 * Infiere la entidad basándose en el nombre del campo
 */
function inferEntityFromField(fieldName: string): string {
  const fieldToEntity: Record<string, string> = {
    property_address: 'Building',
    direccion: 'Building',
    superficie: 'Unit',
    habitaciones: 'Unit',
    tenant_name: 'Tenant',
    dni: 'Tenant',
    fecha_inicio: 'Contract',
    renta_mensual: 'Contract',
    provider_name: 'Provider',
    aseguradora: 'Insurance',
    numero_poliza: 'Insurance',
  };

  for (const [pattern, entity] of Object.entries(fieldToEntity)) {
    if (fieldName.toLowerCase().includes(pattern)) {
      return entity;
    }
  }

  return 'Building'; // Default
}

/**
 * Busca entidad existente que coincida
 */
async function findMatchingEntity(
  entityType: string,
  fields: Array<{ fieldName: string; fieldValue: string }>,
  companyId: string
): Promise<{ id: string } | null> {
  const fieldMap = fields.reduce((acc, f) => {
    acc[f.fieldName] = f.fieldValue;
    return acc;
  }, {} as Record<string, string>);

  switch (entityType) {
    case 'Building':
      return prisma.building.findFirst({
        where: {
          companyId,
          direccion: { contains: fieldMap.property_address || fieldMap.direccion || '', mode: 'insensitive' },
        },
        select: { id: true },
      });
    case 'Tenant':
      return prisma.tenant.findFirst({
        where: {
          companyId,
          OR: [
            { dni: fieldMap.dni || fieldMap.document_number },
            { email: fieldMap.email },
          ],
        },
        select: { id: true },
      });
    default:
      return null;
  }
}

/**
 * Detecta conflictos potenciales
 */
function detectConflicts(
  entityType: string,
  fields: Array<{ fieldName: string; fieldValue: string }>,
  existingEntity: { id: string } | null
): Array<{ type: string; issue: string }> {
  const conflicts: Array<{ type: string; issue: string }> = [];

  // Detectar campos requeridos faltantes
  const requiredFields: Record<string, string[]> = {
    Building: ['direccion'],
    Tenant: ['dni', 'email'],
    Contract: ['renta_mensual', 'fecha_inicio'],
  };

  const required = requiredFields[entityType] || [];
  const fieldNames = fields.map(f => f.fieldName);

  for (const req of required) {
    if (!fieldNames.some(f => f.includes(req))) {
      conflicts.push({
        type: entityType,
        issue: `Campo requerido faltante: ${req}`,
      });
    }
  }

  return conflicts;
}

/**
 * Incrementa contador en summary
 */
function incrementSummary(
  summary: ParametrizationResult['summary'],
  entityType: string,
  action: 'created' | 'updated'
) {
  const key = entityType.toLowerCase() + 's' as keyof typeof summary;
  if (summary[key]) {
    summary[key][action]++;
  }
}

export default {
  applyBatchParametrization,
  previewParametrization,
};
