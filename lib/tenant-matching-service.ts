/**
 * Servicio de Matching Automático Inquilino-Propiedad
 * 
 * Algoritmo ML que encuentra las mejores propiedades para un inquilino
 * basado en preferencias, presupuesto y características.
 * 
 * @module TenantMatchingService
 */

import { prisma } from './db';
import Anthropic from '@anthropic-ai/sdk';
import logger from './logger';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

import { CLAUDE_MODEL_FAST } from './ai-model-config';
const CLAUDE_MODEL = CLAUDE_MODEL_FAST;

// ============================================================================
// TIPOS
// ============================================================================

export interface TenantPreferences {
  minBudget: number;
  maxBudget: number;
  idealBudget: number;
  preferredCities: string[];
  minRooms: number;
  prefersModern: boolean;
  needsPublicTransport: boolean;
  hasCar: boolean;
  hasPets: boolean;
  isSmoker: boolean;
  minSquareMeters?: number;
  preferredFloors?: number[];
  wantsElevator?: boolean;
  wantsParking?: boolean;
  wantsFurnished?: boolean;
}

export interface PropertyMatch {
  unitId: string;
  tenantId: string;
  matchScore: number; // 0-100
  locationScore: number;
  priceScore: number;
  featuresScore: number;
  sizeScore: number;
  availabilityScore: number;
  aiRecommendation?: string;
  pros: string[];
  cons: string[];
}

// ============================================================================
// ALGORITMO DE SCORING
// ============================================================================

/**
 * Encuentra los mejores matches para un inquilino
 */
export async function findBestMatches(
  tenantId: string,
  companyId: string,
  limit: number = 10,
  useAI: boolean = true
): Promise<PropertyMatch[]> {
  try {
    // 1. Obtener datos del inquilino con preferencias
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        tenantPreferences: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const prefs = tenant.tenantPreferences;

    // 2. Construir preferencias (desde TenantPreferences o defaults razonables)
    const preferences: TenantPreferences = {
      minBudget: prefs?.minBudget || 0,
      maxBudget: prefs?.maxBudget || 50000,
      idealBudget: prefs?.idealBudget || (prefs?.maxBudget ? prefs.maxBudget * 0.8 : 1500),
      preferredCities: prefs?.preferredCities || [],
      minRooms: prefs?.minRooms || 1,
      prefersModern: prefs?.prefersModern || false,
      needsPublicTransport: prefs?.needsPublicTransport || false,
      hasCar: prefs?.hasCar || false,
      hasPets: prefs?.hasPets || prefs?.needsPetFriendly || false,
      isSmoker: false,
      minSquareMeters: prefs?.minSquareMeters || undefined,
      wantsElevator: prefs?.needsElevator || false,
      wantsParking: prefs?.needsParking || false,
      wantsFurnished: prefs?.needsFurnished || false,
    };

    // 3. Obtener propiedades disponibles
    const unitWhere: any = {
      building: { companyId },
      estado: 'disponible',
    };

    // Solo filtrar por renta si hay presupuesto máximo definido y razonable
    if (preferences.maxBudget && preferences.maxBudget < 50000) {
      unitWhere.rentaMensual = { lte: preferences.maxBudget };
      if (preferences.minBudget > 0) {
        unitWhere.rentaMensual.gte = preferences.minBudget;
      }
    }

    const properties = await prisma.unit.findMany({
      where: unitWhere,
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            ciudad: true,
            codigoPostal: true,
          },
        },
      },
      take: 100,
    });

    logger.info(`📊 Evaluating ${properties.length} properties for tenant ${tenantId}`);

    // 4. Calcular scoring para cada propiedad
    const scoredMatches = properties.map((property) => {
      return scorePropertyMatch(property, tenant, preferences);
    });

    // 5. Ordenar por score y tomar top N
    const topMatches = scoredMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    // 6. Si useAI, enriquecer con análisis de Claude
    if (useAI && process.env.ANTHROPIC_API_KEY) {
      await enrichMatchesWithAI(topMatches, tenant, properties);
    }

    logger.info(`✅ Found ${topMatches.length} matches with avg score ${
      topMatches.reduce((sum, m) => sum + m.matchScore, 0) / topMatches.length
    }`);

    return topMatches;

  } catch (error: any) {
    logger.error('❌ Error finding matches:', error);
    throw new Error(`Failed to find matches: ${error.message}`);
  }
}

/**
 * Calcula el score de match entre propiedad e inquilino
 */
function scorePropertyMatch(
  property: any,
  tenant: any,
  preferences: TenantPreferences
): PropertyMatch {
  let matchScore = 0;
  const pros: string[] = [];
  const cons: string[] = [];

  // ============================================================================
  // 1. PRECIO (Peso: 30%)
  // ============================================================================
  const price = Number(property.rentaMensual);
  let priceScore = 0;

  if (price <= preferences.idealBudget) {
    // Precio ideal o menor
    priceScore = 30;
    pros.push(`Precio dentro del presupuesto ideal (${price}€/mes)`);
  } else if (price <= preferences.maxBudget) {
    // Entre ideal y máximo
    const ratio = (preferences.maxBudget - price) / (preferences.maxBudget - preferences.idealBudget);
    priceScore = 15 + Math.round(ratio * 15);
    if (priceScore >= 25) {
      pros.push(`Precio aceptable (${price}€/mes)`);
    } else {
      cons.push(`Precio cercano al límite (${price}€/${preferences.maxBudget}€)`);
    }
  } else {
    // Fuera de presupuesto (no debería pasar por filtro, pero por si acaso)
    priceScore = 0;
    cons.push(`Precio excede presupuesto (${price}€ > ${preferences.maxBudget}€)`);
  }

  matchScore += priceScore;

  // ============================================================================
  // 2. UBICACIÓN Y TRANSPORTE (Peso: 25%)
  // ============================================================================
  let locationScore = 0;

  // Dirección contiene ciudad preferida
  const buildingAddress = (property.building?.direccion || '').toLowerCase();
  const buildingCity = (property.building?.ciudad || '').toLowerCase();
  if (preferences.preferredCities.length > 0) {
    const matchesCity = preferences.preferredCities.some(
      city => buildingAddress.includes(city.toLowerCase()) || buildingCity.includes(city.toLowerCase())
    );
    if (matchesCity) {
      locationScore += 15;
      pros.push(`Zona preferida`);
    }
  } else {
    locationScore += 5; // Bonus si no tiene preferencias de ubicación
  }

  // Parking / Garaje
  if (preferences.hasCar || preferences.wantsParking) {
    if (property.building?.garaje) {
      locationScore += 10;
      pros.push('Tiene garaje disponible');
    } else {
      cons.push('Sin garaje');
    }
  } else {
    locationScore += 5;
  }

  matchScore += Math.min(locationScore, 25);

  // ============================================================================
  // 3. CARACTERÍSTICAS (Peso: 20%)
  // ============================================================================
  let featuresScore = 0;

  // Ascensor
  if (preferences.wantsElevator) {
    if (property.building?.ascensor) {
      featuresScore += 7;
      pros.push('Tiene ascensor');
    } else if (property.planta && property.planta > 2) {
      cons.push(`Sin ascensor (planta ${property.planta})`);
      featuresScore -= 3;
    }
  } else {
    featuresScore += 3;
  }

  // Amueblado
  if (preferences.wantsFurnished) {
    if (property.amueblado) {
      featuresScore += 7;
      pros.push('Amueblado');
    } else {
      cons.push('No está amueblado');
    }
  } else {
    featuresScore += 3;
  }

  // Terraza / Balcón como bonus
  if (property.terraza) {
    featuresScore += 3;
    pros.push('Tiene terraza');
  }

  matchScore += Math.max(0, Math.min(featuresScore, 20));

  // ============================================================================
  // 4. TAMAÑO (Peso: 15%)
  // ============================================================================
  let sizeScore = 0;

  const squareMeters = Number(property.superficie) || 0;
  const rooms = property.habitaciones || 0;

  // Habitaciones
  if (rooms >= preferences.minRooms) {
    sizeScore += 8;
    if (rooms === preferences.minRooms) {
      pros.push(`${rooms} habitaciones (ideal)`);
    } else {
      pros.push(`${rooms} habitaciones (espacioso)`);
    }
  } else {
    cons.push(`Solo ${rooms} habitaciones (necesita ${preferences.minRooms})`);
  }

  // Metros cuadrados
  if (preferences.minSquareMeters && squareMeters > 0) {
    if (squareMeters >= preferences.minSquareMeters) {
      sizeScore += 7;
      pros.push(`${squareMeters}m² (amplio)`);
    } else {
      cons.push(`Solo ${squareMeters}m² (mínimo: ${preferences.minSquareMeters}m²)`);
      sizeScore -= 3;
    }
  } else {
    sizeScore += 3; // Bonus por tener info de tamaño
  }

  matchScore += Math.max(0, Math.min(sizeScore, 15));

  // ============================================================================
  // 5. DISPONIBILIDAD (Peso: 10%)
  // ============================================================================
  let availabilityScore = 10; // Por defecto máximo (estado = disponible)

  if (property.fechaDisponibilidad) {
    const available = new Date(property.fechaDisponibilidad);
    const now = new Date();
    const daysUntilAvailable = Math.ceil((available.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilAvailable <= 0) {
      availabilityScore = 10;
      pros.push('Disponible inmediatamente');
    } else if (daysUntilAvailable <= 30) {
      availabilityScore = 7;
      pros.push(`Disponible en ${daysUntilAvailable} días`);
    } else {
      availabilityScore = 3;
      cons.push(`No disponible hasta dentro de ${daysUntilAvailable} días`);
    }
  }

  matchScore += availabilityScore;

  // ============================================================================
  // RESULTADO FINAL
  // ============================================================================

  return {
    unitId: property.id,
    tenantId: tenant.id,
    matchScore: Math.round(matchScore),
    locationScore: Math.min(locationScore, 25),
    priceScore,
    featuresScore: Math.max(0, Math.min(featuresScore, 20)),
    sizeScore: Math.max(0, Math.min(sizeScore, 15)),
    availabilityScore,
    pros,
    cons,
  };
}

/**
 * Enriquece matches con análisis de IA (Claude)
 */
async function enrichMatchesWithAI(
  matches: PropertyMatch[],
  tenant: any,
  properties: any[]
): Promise<void> {
  try {
    // Procesar en paralelo (máximo 5 a la vez para no saturar API)
    const batches = [];
    for (let i = 0; i < Math.min(matches.length, 5); i++) {
      batches.push(enrichSingleMatch(matches[i], tenant, properties));
    }

    await Promise.all(batches);

  } catch (error: any) {
    logger.warn('⚠️ AI enrichment failed:', error.message);
    // No fallar el match si IA falla
  }
}

/**
 * Analiza un match individual con IA
 */
async function enrichSingleMatch(
  match: PropertyMatch,
  tenant: any,
  properties: any[]
): Promise<void> {
  try {
    const property = properties.find(p => p.id === match.unitId);
    if (!property) return;

    const prompt = `Eres un experto en búsqueda de vivienda. Analiza este match inquilino-propiedad:

INQUILINO:
- Nombre: ${tenant.nombreCompleto}
- Email: ${tenant.email}

PROPIEDAD:
- Ubicación: ${property.building?.direccion || 'N/A'}
- Precio: ${property.rentaMensual}€/mes
- Tamaño: ${property.superficie}m², ${property.habitaciones} hab, ${property.banos} baños
- Características: ${JSON.stringify({
  amueblado: property.amueblado,
  ascensor: property.building?.ascensor,
  garaje: property.building?.garaje,
  terraza: property.terraza,
  balcon: property.balcon,
})}

MATCH SCORE: ${match.matchScore}/100
PROS: ${match.pros.join(', ')}
CONS: ${match.cons.join(', ')}

Proporciona una recomendación concisa (2-3 frases) sobre por qué esta propiedad es buena o no para este inquilino.`;

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    if (message.content[0].type === 'text') {
      match.aiRecommendation = message.content[0].text;
    }

  } catch (error: any) {
    logger.warn(`⚠️ AI enrichment failed for match ${match.unitId}:`, error.message);
  }
}

/**
 * Guarda matches en la base de datos
 */
export async function saveMatches(
  matches: PropertyMatch[],
  companyId: string
): Promise<void> {
  try {
    // Borrar matches antiguos del mismo inquilino (más de 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (matches.length > 0) {
      await prisma.tenantPropertyMatch.deleteMany({
        where: {
          tenantId: matches[0].tenantId,
          createdAt: { lt: sevenDaysAgo },
        },
      });
    }

    // Insertar nuevos matches
    await prisma.tenantPropertyMatch.createMany({
      data: matches.map((match) => ({
        companyId,
        tenantId: match.tenantId,
        unitId: match.unitId,
        matchScore: match.matchScore,
        locationScore: match.locationScore,
        priceScore: match.priceScore,
        featuresScore: match.featuresScore,
        sizeScore: match.sizeScore,
        availabilityScore: match.availabilityScore,
        aiRecommendation: match.aiRecommendation,
        pros: match.pros,
        cons: match.cons,
        status: 'SUGGESTED',
      })),
      skipDuplicates: true,
    });

    logger.info(`💾 Saved ${matches.length} matches to database`);

  } catch (error: any) {
    logger.error('❌ Error saving matches:', error);
    // No fallar si no se puede guardar
  }
}

/**
 * Obtiene matches existentes para un inquilino
 */
export async function getTenantMatches(
  tenantId: string,
  companyId: string,
  options?: {
    limit?: number;
    minScore?: number;
    status?: string;
  }
): Promise<PropertyMatch[]> {
  try {
    const matches = await prisma.tenantPropertyMatch.findMany({
      where: {
        tenantId,
        companyId,
        ...(options?.minScore && { matchScore: { gte: options.minScore } }),
        ...(options?.status && { status: options.status }),
      },
      orderBy: { matchScore: 'desc' },
      take: options?.limit || 10,
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
    });

    return matches.map(m => ({
      unitId: m.unitId,
      tenantId: m.tenantId,
      matchScore: m.matchScore,
      locationScore: m.locationScore || 0,
      priceScore: m.priceScore || 0,
      featuresScore: m.featuresScore || 0,
      sizeScore: m.sizeScore || 0,
      availabilityScore: m.availabilityScore || 0,
      pros: m.pros as string[],
      cons: m.cons as string[],
      aiRecommendation: m.aiRecommendation || undefined,
    }));
  } catch (error: any) {
    logger.error('Error getting tenant matches:', error);
    return [];
  }
}

export default {
  findBestMatches,
  saveMatches,
  getTenantMatches,
};
