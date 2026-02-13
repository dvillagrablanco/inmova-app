/**
 * Servicio de Clasificación Automática de Incidencias con IA
 * 
 * Usa Claude para clasificar incidencias de mantenimiento,
 * estimar costos, urgencia y asignar proveedores.
 * 
 * @module MaintenanceClassificationService
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from './db';
import logger from './logger';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

import { CLAUDE_MODEL_PRIMARY } from './ai-model-config';
const CLAUDE_MODEL = CLAUDE_MODEL_PRIMARY;

// ============================================================================
// TIPOS
// ============================================================================

export type MaintenanceCategory =
  | 'PLUMBING'      // Fontanería
  | 'ELECTRICAL'    // Eléctrico
  | 'HVAC'          // Climatización
  | 'STRUCTURAL'    // Estructural
  | 'APPLIANCE'     // Electrodomésticos
  | 'CLEANING'      // Limpieza
  | 'PAINTING'      // Pintura
  | 'CARPENTRY'     // Carpintería
  | 'LOCKSMITH'     // Cerrajería
  | 'PEST_CONTROL'  // Control de plagas
  | 'OTHER';        // Otro

export type MaintenanceUrgency =
  | 'LOW'       // Baja (7-30 días)
  | 'MEDIUM'    // Media (2-7 días)
  | 'HIGH'      // Alta (24-48h)
  | 'CRITICAL'; // Crítica (inmediata)

export type ProviderType =
  | 'PLUMBER'
  | 'ELECTRICIAN'
  | 'HVAC_TECH'
  | 'GENERAL_CONTRACTOR'
  | 'APPLIANCE_REPAIR'
  | 'CLEANER'
  | 'PAINTER'
  | 'CARPENTER'
  | 'LOCKSMITH'
  | 'PEST_CONTROL_SPECIALIST';

export interface IncidentClassification {
  category: MaintenanceCategory;
  urgency: MaintenanceUrgency;
  estimatedCost: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  providerType: ProviderType;
  actionRequired: string;
  timeEstimate: string;
  reasoning: string;
  recommendations: string[];
  requiresEmergencyCall: boolean;
}

export interface IncidentInput {
  description: string;
  photos?: string[];
  location?: string; // Habitación/área afectada
  reportedBy?: string;
  unitId?: string;
}

// ============================================================================
// SERVICIO DE CLASIFICACIÓN
// ============================================================================

/**
 * Clasifica una incidencia usando IA
 */
export async function classifyIncident(
  incident: IncidentInput
): Promise<IncidentClassification> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('⚠️ ANTHROPIC_API_KEY not configured, using fallback classification');
      return fallbackClassification(incident);
    }

    // 1. Construir prompt
    const prompt = buildClassificationPrompt(incident);

    // 2. Llamar a Claude
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // 3. Parsear respuesta
    if (message.content[0].type === 'text') {
      const classification = JSON.parse(message.content[0].text);

      logger.info('✅ Incident classified', {
        category: classification.category,
        urgency: classification.urgency,
        cost: classification.estimatedCost,
      });

      return classification;
    }

    throw new Error('Invalid AI response format');

  } catch (error: any) {
    logger.error('❌ Error classifying incident:', error);

    // Fallback a clasificación básica
    return fallbackClassification(incident);
  }
}

/**
 * Construye el prompt para Claude
 */
function buildClassificationPrompt(incident: IncidentInput): string {
  return `Eres un experto en mantenimiento de propiedades inmobiliarias. Clasifica esta incidencia:

DESCRIPCIÓN: ${incident.description}
${incident.location ? `UBICACIÓN: ${incident.location}` : ''}
${incident.photos ? `FOTOS: ${incident.photos.length} adjuntas` : ''}

Clasifica la incidencia en formato JSON:

{
  "category": "PLUMBING" | "ELECTRICAL" | "HVAC" | "STRUCTURAL" | "APPLIANCE" | "CLEANING" | "PAINTING" | "CARPENTRY" | "LOCKSMITH" | "PEST_CONTROL" | "OTHER",
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "estimatedCost": number (€),
  "estimatedCostMin": number (€),
  "estimatedCostMax": number (€),
  "providerType": "PLUMBER" | "ELECTRICIAN" | "HVAC_TECH" | "GENERAL_CONTRACTOR" | "APPLIANCE_REPAIR" | "CLEANER" | "PAINTER" | "CARPENTER" | "LOCKSMITH" | "PEST_CONTROL_SPECIALIST",
  "actionRequired": "string describiendo acción específica",
  "timeEstimate": "string estimando tiempo de resolución (ej: '2-4 horas', '1-2 días')",
  "reasoning": "string explicando por qué clasificaste así",
  "recommendations": ["string con recomendación 1", "string con recomendación 2"],
  "requiresEmergencyCall": boolean (true si requiere atención inmediata fuera de horario)
}

CRITERIOS DE URGENCIA:
- LOW: Problema estético o no funcional, puede esperar semanas
- MEDIUM: Funcionalidad reducida, resolver en días
- HIGH: Problema significativo, resolver en 24-48h
- CRITICAL: Emergencia (fuga grave, sin luz/agua, riesgo seguridad)

ESTIMACIÓN DE COSTOS (España):
- Fontanero: 50-80€/h, reparación típica 150-400€
- Electricista: 40-70€/h, reparación típica 100-300€
- HVAC: 60-100€/h, reparación típica 200-600€
- Electrodomésticos: 50-150€ diagnóstico + piezas
- Limpieza: 15-25€/h
- Pintura: 10-20€/m²
- Carpintería: 50-80€/h
- Cerrajería: 80-150€ apertura + cambio
- Control de plagas: 100-300€ tratamiento

Sé preciso y realista.`;
}

/**
 * Clasificación de fallback cuando IA no está disponible
 */
function fallbackClassification(incident: IncidentInput): IncidentClassification {
  const description = incident.description.toLowerCase();

  // Reglas básicas por palabras clave
  let category: MaintenanceCategory = 'OTHER';
  let providerType: ProviderType = 'GENERAL_CONTRACTOR';
  let urgency: MaintenanceUrgency = 'MEDIUM';
  let estimatedCost = 200;
  let requiresEmergencyCall = false;

  // Fontanería
  if (
    description.includes('agua') ||
    description.includes('fuga') ||
    description.includes('grifo') ||
    description.includes('ducha') ||
    description.includes('inodoro') ||
    description.includes('tubería')
  ) {
    category = 'PLUMBING';
    providerType = 'PLUMBER';
    estimatedCost = 250;

    if (description.includes('fuga') || description.includes('inundación')) {
      urgency = 'CRITICAL';
      requiresEmergencyCall = true;
      estimatedCost = 400;
    }
  }

  // Eléctrico
  else if (
    description.includes('luz') ||
    description.includes('electricidad') ||
    description.includes('enchufe') ||
    description.includes('interruptor') ||
    description.includes('cortocircuito')
  ) {
    category = 'ELECTRICAL';
    providerType = 'ELECTRICIAN';
    estimatedCost = 200;

    if (description.includes('chispa') || description.includes('quemado')) {
      urgency = 'CRITICAL';
      requiresEmergencyCall = true;
    }
  }

  // Climatización
  else if (
    description.includes('calefacción') ||
    description.includes('aire acondicionado') ||
    description.includes('radiador') ||
    description.includes('clima')
  ) {
    category = 'HVAC';
    providerType = 'HVAC_TECH';
    estimatedCost = 350;
  }

  // Cerrajería
  else if (
    description.includes('cerradura') ||
    description.includes('llave') ||
    description.includes('puerta') && description.includes('cerrar')
  ) {
    category = 'LOCKSMITH';
    providerType = 'LOCKSMITH';
    estimatedCost = 120;

    if (description.includes('cerrado') || description.includes('encerrado')) {
      urgency = 'HIGH';
    }
  }

  // Electrodomésticos
  else if (
    description.includes('lavadora') ||
    description.includes('nevera') ||
    description.includes('horno') ||
    description.includes('lavavajillas')
  ) {
    category = 'APPLIANCE';
    providerType = 'APPLIANCE_REPAIR';
    estimatedCost = 150;
  }

  // Plagas
  else if (
    description.includes('cucaracha') ||
    description.includes('rata') ||
    description.includes('insecto') ||
    description.includes('plaga')
  ) {
    category = 'PEST_CONTROL';
    providerType = 'PEST_CONTROL_SPECIALIST';
    estimatedCost = 200;
    urgency = 'HIGH';
  }

  // Limpieza
  else if (description.includes('sucio') || description.includes('limpieza')) {
    category = 'CLEANING';
    providerType = 'CLEANER';
    estimatedCost = 80;
    urgency = 'LOW';
  }

  // Pintura
  else if (description.includes('pintura') || description.includes('pared')) {
    category = 'PAINTING';
    providerType = 'PAINTER';
    estimatedCost = 150;
    urgency = 'LOW';
  }

  return {
    category,
    urgency,
    estimatedCost,
    estimatedCostMin: Math.round(estimatedCost * 0.7),
    estimatedCostMax: Math.round(estimatedCost * 1.5),
    providerType,
    actionRequired: `Contactar ${providerType} para ${category}`,
    timeEstimate: urgency === 'CRITICAL' ? 'Inmediato' : urgency === 'HIGH' ? '24-48h' : '2-7 días',
    reasoning: 'Clasificación automática basada en palabras clave',
    recommendations: [
      'Documentar el problema con fotos',
      'Contactar proveedor recomendado',
      'Informar al inquilino del progreso',
    ],
    requiresEmergencyCall,
  };
}

/**
 * Busca y asigna el mejor proveedor disponible
 */
export async function assignProvider(
  providerType: ProviderType,
  city: string,
  companyId: string
): Promise<any | null> {
  try {
    // Buscar proveedores del tipo requerido en la ciudad
    const provider = await prisma.serviceProvider.findFirst({
      where: {
        companyId,
        tipo: providerType,
        ciudad: city,
        activo: true,
      },
      orderBy: [
        { calificacion: 'desc' },
        { trabajosCompletados: 'desc' },
      ],
    });

    if (provider) {
      logger.info(`✅ Provider assigned: ${provider.nombre} (${providerType})`);
    } else {
      logger.warn(`⚠️ No provider found for ${providerType} in ${city}`);
    }

    return provider;

  } catch (error: any) {
    logger.error('❌ Error assigning provider:', error);
    return null;
  }
}

/**
 * Crea una solicitud de mantenimiento con clasificación automática
 */
export async function createMaintenanceRequest(
  incident: IncidentInput & { companyId: string; propertyId: string }
): Promise<any> {
  try {
    // 1. Clasificar incidencia
    const classification = await classifyIncident(incident);

    // 2. Obtener info de la propiedad para asignar proveedor
    const property = await prisma.unit.findUnique({
      where: { id: incident.unitId },
      include: { building: true },
    });

    let assignedProviderId: string | null = null;

    if (property) {
      // 3. Asignar proveedor automáticamente
      const provider = await assignProvider(
        classification.providerType,
        property.building.ciudad,
        incident.companyId
      );

      if (provider) {
        assignedProviderId = provider.id;
      }
    }

    // 4. Crear solicitud en BD
    const request = await prisma.maintenanceRequest.create({
      data: {
        companyId: incident.companyId,
        unitId: incident.unitId!,
        // propertyId: incident.propertyId, // Si existe
        titulo: incident.description.substring(0, 100),
        descripcion: incident.description,
        ubicacion: incident.location,
        categoria: classification.category,
        urgencia: classification.urgency,
        estado: 'PENDIENTE',
        costoEstimado: classification.estimatedCost,
        costoEstimadoMin: classification.estimatedCostMin,
        costoEstimadoMax: classification.estimatedCostMax,
        tipoProveedor: classification.providerType,
        accionRequerida: classification.actionRequired,
        tiempoEstimado: classification.timeEstimate,
        razonamientoIA: classification.reasoning,
        recomendaciones: classification.recommendations,
        requiereLlamadaEmergencia: classification.requiresEmergencyCall,
        proveedorAsignadoId: assignedProviderId,
        reportadoPor: incident.reportedBy,
        // fotos: incident.photos, // Array de URLs
      },
    });

    logger.info(`✅ Maintenance request created: ${request.id}`, {
      category: classification.category,
      urgency: classification.urgency,
    });

    return {
      request,
      classification,
    };

  } catch (error: any) {
    logger.error('❌ Error creating maintenance request:', error);
    throw new Error(`Failed to create maintenance request: ${error.message}`);
  }
}

export default {
  classifyIncident,
  assignProvider,
  createMaintenanceRequest,
};
