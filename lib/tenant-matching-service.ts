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

const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

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
    // 1. Obtener datos del inquilino
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        preferences: true, // Asume que existe relación con preferencias
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // 2. Construir preferencias (desde datos existentes o defaults)
    const preferences: TenantPreferences = {
      minBudget: tenant.presupuestoMin || 500,
      maxBudget: tenant.presupuestoMax || 2000,
      idealBudget: tenant.presupuestoIdeal || 1000,
      preferredCities: tenant.ciudadesPreferidas || [],
      minRooms: tenant.habitacionesMin || 1,
      prefersModern: tenant.prefiereModerno || false,
      needsPublicTransport: tenant.necesitaTransportePublico || false,
      hasCar: tenant.tieneCoche || false,
      hasPets: tenant.tieneMascotas || false,
      isSmoker: tenant.fumador || false,
      minSquareMeters: tenant.metrosCuadradosMin,
      preferredFloors: tenant.pisosPreferidos,
      wantsElevator: tenant.quiereAscensor,
      wantsParking: tenant.quiereParking,
      wantsFurnished: tenant.quiereAmueblado,
    };

    // 3. Obtener propiedades disponibles
    const properties = await prisma.unit.findMany({
      where: {
        building: {
          companyId,
        },
        estado: 'disponible',
        rentaMensual: {
          gte: preferences.minBudget,
          lte: preferences.maxBudget,
        },
        habitaciones: {
          gte: preferences.minRooms,
        },
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            ciudad: true,
            codigoPostal: true,
            tieneAscensor: true,
            tieneParking: true,
            cercaMetro: true,
            cercaAutobus: true,
          },
        },
      },
      take: 100, // Máximo para evaluar
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

  // Ciudad preferida
  if (preferences.preferredCities.includes(property.building.ciudad)) {
    locationScore += 10;
    pros.push(`Ciudad preferida (${property.building.ciudad})`);
  }

  // Transporte público
  if (preferences.needsPublicTransport) {
    if (property.building.cercaMetro) {
      locationScore += 10;
      pros.push('Cerca del metro');
    } else if (property.building.cercaAutobus) {
      locationScore += 5;
      pros.push('Cerca de autobús');
    } else {
      cons.push('Lejos del transporte público');
    }
  } else {
    locationScore += 5; // Bonus si no importa el transporte
  }

  // Parking
  if (preferences.hasCar) {
    if (property.building.tieneParking || property.tieneGaraje) {
      locationScore += 10;
      pros.push('Tiene parking disponible');
    } else {
      cons.push('No tiene parking (necesario para coche)');
    }
  }

  matchScore += Math.min(locationScore, 25); // Cap a 25

  // ============================================================================
  // 3. CARACTERÍSTICAS (Peso: 20%)
  // ============================================================================
  let featuresScore = 0;

  // Mascotas
  if (preferences.hasPets) {
    if (property.admiteMascotas) {
      featuresScore += 8;
      pros.push('Admite mascotas');
    } else {
      featuresScore -= 5;
      cons.push('No admite mascotas');
    }
  }

  // Fumador
  if (preferences.isSmoker && !property.permiteFumar) {
    cons.push('No se permite fumar');
    featuresScore -= 3;
  }

  // Ascensor
  if (preferences.wantsElevator) {
    if (property.building.tieneAscensor) {
      featuresScore += 5;
      pros.push('Tiene ascensor');
    } else if (property.piso && property.piso > 3) {
      cons.push(`Sin ascensor (piso ${property.piso})`);
      featuresScore -= 3;
    }
  }

  // Amueblado
  if (preferences.wantsFurnished) {
    if (property.amueblado) {
      featuresScore += 7;
      pros.push('Amueblado');
    } else {
      cons.push('No está amueblado');
    }
  }

  matchScore += Math.max(0, Math.min(featuresScore, 20)); // Entre 0 y 20

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
- Presupuesto: ${tenant.presupuestoMin}-${tenant.presupuestoMax}€
- Preferencias: ${tenant.preferencias || 'No especificadas'}

PROPIEDAD:
- Ubicación: ${property.building.direccion}, ${property.building.ciudad}
- Precio: ${property.rentaMensual}€/mes
- Tamaño: ${property.superficie}m², ${property.habitaciones} hab
- Características: ${JSON.stringify({
  amueblado: property.amueblado,
  mascotas: property.admiteMascotas,
  ascensor: property.building.tieneAscensor,
  parking: property.building.tieneParking,
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

export default {
  findBestMatches,
  saveMatches,
};
