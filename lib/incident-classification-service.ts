// @ts-nocheck
/**
 * Servicio de Clasificación Automática de Incidencias
 *
 * Utiliza IA (Anthropic Claude) para:
 * - Clasificar categoría de incidencia (fontanería, electricidad, etc.)
 * - Determinar urgencia (baja, media, alta, crítica)
 * - Estimar coste y duración
 * - Sugerir proveedor apropiado
 * - Recomendar acciones inmediatas y preventivas
 *
 * @module IncidentClassificationService
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

export type IncidentCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'HVAC'
  | 'STRUCTURAL'
  | 'APPLIANCE'
  | 'CARPENTRY'
  | 'LOCKSMITH'
  | 'CLEANING'
  | 'PEST_CONTROL'
  | 'OTHER';

export type IncidentUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IncidentInput {
  title: string;
  description: string;
  location?: string; // Ubicación en la propiedad (cocina, baño, etc.)
  photos?: string[]; // URLs de fotos (opcional)
  reportedBy?: string; // Nombre del reportante
}

export interface ClassificationResult {
  category: IncidentCategory;
  urgency: IncidentUrgency;
  estimatedCost: number;
  estimatedDuration: number; // horas
  providerType: string;
  suggestedProvider?: string;
  aiAnalysis: string;
  keywords: string[];
  confidence: number; // 0-100
  immediateActions: string[];
  preventiveMeasures: string[];
}

// ============================================================================
// PROMPTS OPTIMIZADOS
// ============================================================================

function buildClassificationPrompt(incident: IncidentInput): string {
  return `Eres un experto en mantenimiento de propiedades con 20 años de experiencia.

Tu tarea: Clasificar esta incidencia de mantenimiento y proporcionar análisis completo.

INCIDENCIA:
Título: ${incident.title}
Descripción: ${incident.description}
${incident.location ? `Ubicación: ${incident.location}` : ''}
${incident.photos ? `Fotos adjuntas: ${incident.photos.length}` : ''}
${incident.reportedBy ? `Reportado por: ${incident.reportedBy}` : ''}

INSTRUCCIONES:
1. Analiza la incidencia cuidadosamente
2. Clasifica en categoría y urgencia apropiada
3. Estima coste y duración realistas
4. Sugiere tipo de proveedor necesario
5. Proporciona acciones inmediatas y preventivas

Categorías válidas:
- PLUMBING (fontanería: fugas, tuberías, desagües, grifos)
- ELECTRICAL (eléctrica: apagones, enchufes, luces, cableado)
- HVAC (climatización: calefacción, aire acondicionado, ventilación)
- STRUCTURAL (estructural: grietas, humedades, paredes, techos)
- APPLIANCE (electrodomésticos: nevera, lavadora, horno)
- CARPENTRY (carpintería: puertas, ventanas, armarios)
- LOCKSMITH (cerrajería: cerraduras, llaves, puertas)
- CLEANING (limpieza: manchas, suciedad, olores)
- PEST_CONTROL (plagas: insectos, roedores)
- OTHER (otro: no encaja en categorías anteriores)

Niveles de urgencia:
- LOW: Puede esperar 1-2 semanas, no afecta habitabilidad
- MEDIUM: Atender en 3-5 días, afecta comodidad
- HIGH: Atender en 24-48h, afecta funcionalidad importante
- CRITICAL: Inmediato, riesgo de daños mayores o seguridad

Tipos de proveedor:
- PLUMBER (fontanero)
- ELECTRICIAN (electricista)
- HVAC_TECH (técnico de climatización)
- HANDYMAN (manitas/mantenimiento general)
- GENERAL_CONTRACTOR (contratista general)
- LOCKSMITH (cerrajero)
- CLEANING_SERVICE (servicio de limpieza)
- PEST_CONTROL_SERVICE (control de plagas)

Proporciona tu análisis en formato JSON:

{
  "category": "CATEGORÍA",
  "urgency": "URGENCIA",
  "estimatedCost": número (en euros, sin IVA),
  "estimatedDuration": número (en horas),
  "providerType": "TIPO_PROVEEDOR",
  "aiAnalysis": "string con análisis detallado (100-200 palabras)",
  "keywords": ["palabra1", "palabra2", "palabra3"],
  "confidence": número (0-100, qué tan seguro estás de tu clasificación),
  "immediateActions": ["acción1", "acción2"],
  "preventiveMeasures": ["medida1", "medida2"]
}

IMPORTANTE:
- Sé realista con costes y tiempos
- Considera mercado español (precios y proveedores típicos)
- Si hay riesgo de daños mayores, marca como CRITICAL
- Las acciones inmediatas son lo que puede hacer el usuario YA
- Las medidas preventivas son para evitar futuras incidencias similares

Responde SOLO con el JSON, sin explicaciones adicionales.`;
}

// ============================================================================
// CLASIFICACIÓN CON IA
// ============================================================================

/**
 * Clasifica una incidencia usando IA
 */
export async function classifyIncident(incident: IncidentInput): Promise<ClassificationResult> {
  try {
    const prompt = buildClassificationPrompt(incident);

    logger.info('🔍 Classifying incident with AI', {
      title: incident.title,
    });

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      temperature: 0.3, // Baja para consistencia
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extraer contenido
    const content = message.content.find((block) => block.type === 'text');
    if (!content || content.type !== 'text') {
      throw new Error('No text content in AI response');
    }

    // Parsear JSON
    const responseText = content.text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error('No JSON found in AI response:', responseText);
      throw new Error('Invalid JSON response from AI');
    }

    const result: ClassificationResult = JSON.parse(jsonMatch[0]);

    // Validar resultado
    if (!result.category || !result.urgency || !result.estimatedCost || !result.providerType) {
      throw new Error('Incomplete classification result from AI');
    }

    logger.info('✅ Incident classified', {
      category: result.category,
      urgency: result.urgency,
      confidence: result.confidence,
    });

    return result;
  } catch (error) {
    logger.error('Error in incident classification:', error);
    throw new Error(`Failed to classify incident: ${error}`);
  }
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Clasifica y guarda una incidencia
 */
export async function classifyAndSaveIncident(
  incidentId: string,
  incident: IncidentInput
): Promise<any> {
  try {
    // 1. Clasificar con IA
    const classification = await classifyIncident(incident);

    // 2. Buscar proveedor sugerido (si existe en BD)
    let suggestedProvider = null;
    try {
      suggestedProvider = await prisma.serviceProvider.findFirst({
        where: {
          tipo: classification.providerType,
          disponible: true,
        },
        orderBy: {
          calificacion: 'desc',
        },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          email: true,
        },
      });
    } catch (error) {
      // No hay tabla serviceProvider, continuar sin sugerencia
      logger.warn('ServiceProvider table not found');
    }

    // 3. Guardar clasificación en BD
    const saved = await prisma.incidentClassification.create({
      data: {
        incidentId,
        category: classification.category,
        urgency: classification.urgency,
        estimatedCost: classification.estimatedCost,
        estimatedDuration: classification.estimatedDuration,
        providerType: classification.providerType,
        suggestedProvider: suggestedProvider?.id || null,
        aiAnalysis: classification.aiAnalysis,
        keywords: classification.keywords,
        confidence: classification.confidence,
        immediateActions: classification.immediateActions,
        preventiveMeasures: classification.preventiveMeasures,
        model: CLAUDE_MODEL,
      },
    });

    logger.info('💾 Classification saved', { classificationId: saved.id });

    return {
      ...saved,
      provider: suggestedProvider,
    };
  } catch (error) {
    logger.error('Error in classifyAndSaveIncident:', error);
    throw error;
  }
}

/**
 * Obtiene clasificación existente de una incidencia
 */
export async function getIncidentClassification(incidentId: string): Promise<any | null> {
  try {
    const classification = await prisma.incidentClassification.findUnique({
      where: { incidentId },
    });

    if (!classification) {
      return null;
    }

    // Intentar obtener proveedor si existe
    let provider = null;
    if (classification.suggestedProvider) {
      try {
        provider = await prisma.serviceProvider.findUnique({
          where: { id: classification.suggestedProvider },
          select: {
            id: true,
            nombre: true,
            telefono: true,
            email: true,
          },
        });
      } catch (error) {
        // Tabla no existe
      }
    }

    return {
      ...classification,
      provider,
    };
  } catch (error) {
    logger.error('Error getting classification:', error);
    throw error;
  }
}

/**
 * Reclasifica una incidencia (si la descripción cambió)
 */
export async function reclassifyIncident(
  incidentId: string,
  incident: IncidentInput
): Promise<any> {
  try {
    // Eliminar clasificación anterior
    await prisma.incidentClassification.deleteMany({
      where: { incidentId },
    });

    // Crear nueva
    return await classifyAndSaveIncident(incidentId, incident);
  } catch (error) {
    logger.error('Error reclassifying incident:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de clasificaciones
 */
export async function getClassificationStats(companyId: string): Promise<{
  totalIncidents: number;
  byCategory: Record<string, number>;
  byUrgency: Record<string, number>;
  avgCost: number;
  avgDuration: number;
  avgConfidence: number;
}> {
  try {
    // Obtener todas las clasificaciones de la empresa
    // Primero obtenemos los incident IDs de la empresa
    const incidents = await prisma.maintenanceRequest.findMany({
      where: {
        unit: {
          building: {
            companyId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    const incidentIds = incidents.map((i) => i.id);

    const classifications = await prisma.incidentClassification.findMany({
      where: {
        incidentId: { in: incidentIds },
      },
    });

    const totalIncidents = classifications.length;

    if (totalIncidents === 0) {
      return {
        totalIncidents: 0,
        byCategory: {},
        byUrgency: {},
        avgCost: 0,
        avgDuration: 0,
        avgConfidence: 0,
      };
    }

    // Agrupar por categoría
    const byCategory: Record<string, number> = {};
    classifications.forEach((c) => {
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    });

    // Agrupar por urgencia
    const byUrgency: Record<string, number> = {};
    classifications.forEach((c) => {
      byUrgency[c.urgency] = (byUrgency[c.urgency] || 0) + 1;
    });

    // Promedios
    const avgCost =
      classifications.reduce((sum, c) => sum + (c.estimatedCost || 0), 0) / totalIncidents;

    const avgDuration =
      classifications.reduce((sum, c) => sum + (c.estimatedDuration || 0), 0) / totalIncidents;

    const avgConfidence =
      classifications.reduce((sum, c) => sum + c.confidence, 0) / totalIncidents;

    return {
      totalIncidents,
      byCategory,
      byUrgency,
      avgCost: Math.round(avgCost * 100) / 100,
      avgDuration: Math.round(avgDuration * 10) / 10,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
    };
  } catch (error) {
    logger.error('Error getting classification stats:', error);
    throw error;
  }
}
