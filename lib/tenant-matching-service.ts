/**
 * Servicio de Matching Automático Inquilino-Propiedad
 * 
 * Algoritmo híbrido: Scoring tradicional + IA (Claude) para análisis cualitativo
 * 
 * Factores de Matching:
 * 1. Ubicación (30%): Proximidad a trabajo, transporte, servicios
 * 2. Precio (25%): Ajuste entre presupuesto y precio de propiedad
 * 3. Características (20%): Features deseadas vs disponibles
 * 4. Tamaño (15%): Superficie y habitaciones adecuadas
 * 5. Disponibilidad (10%): Alineación de fechas
 * 
 * @module TenantMatchingService
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

const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

// Pesos de scoring (deben sumar 100)
const WEIGHTS = {
  LOCATION: 30,
  PRICE: 25,
  FEATURES: 20,
  SIZE: 15,
  AVAILABILITY: 10,
};

// ============================================================================
// TIPOS
// ============================================================================

export interface TenantProfile {
  id: string;
  name: string;
  email: string;
  preferences: {
    minBudget?: number;
    maxBudget?: number;
    idealBudget?: number;
    preferredCities: string[];
    preferredZones?: string[];
    needsPublicTransport: boolean;
    needsParking: boolean;
    hasCar: boolean;
    minRooms?: number;
    minBathrooms?: number;
    minSquareMeters?: number;
    needsFurnished: boolean;
    hasPets: boolean;
    needsPetFriendly: boolean;
    needsElevator: boolean;
    moveInDate?: Date;
    workAddress?: string;
    // Prioridades
    priorityLocation: number;
    priorityPrice: number;
    prioritySize: number;
    priorityFeatures: number;
  };
}

export interface PropertyInfo {
  id: string;
  address: string;
  city: string;
  zone?: string;
  price: number;
  rooms: number;
  bathrooms: number;
  squareMeters: number;
  isFurnished: boolean;
  petsAllowed: boolean;
  hasElevator: boolean;
  hasParking: boolean;
  hasMetro: boolean;
  metroBuses?: string[];
  availableFrom?: Date;
  features: string[];
}

export interface MatchResult {
  unitId: string;
  tenantId: string;
  matchScore: number;
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
 * Calcula score de ubicación (0-100)
 */
function calculateLocationScore(
  tenant: TenantProfile,
  property: PropertyInfo
): number {
  let score = 0;

  // 1. Ciudad preferida (40 puntos)
  if (tenant.preferences.preferredCities.includes(property.city)) {
    score += 40;
  }

  // 2. Zona preferida (30 puntos)
  if (
    property.zone &&
    tenant.preferences.preferredZones?.includes(property.zone)
  ) {
    score += 30;
  }

  // 3. Transporte público (20 puntos)
  if (tenant.preferences.needsPublicTransport && property.hasMetro) {
    score += 20;
  }

  // 4. Parking si tiene coche (10 puntos)
  if (tenant.preferences.hasCar && property.hasParking) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Calcula score de precio (0-100)
 */
function calculatePriceScore(
  tenant: TenantProfile,
  property: PropertyInfo
): number {
  const { minBudget, maxBudget, idealBudget } = tenant.preferences;

  // Si no hay presupuesto definido, score neutro
  if (!minBudget || !maxBudget) {
    return 50;
  }

  // Fuera de rango = 0
  if (property.price < minBudget || property.price > maxBudget) {
    return 0;
  }

  // Calcular proximidad al precio ideal
  if (idealBudget) {
    const deviation = Math.abs(property.price - idealBudget);
    const maxDeviation = Math.max(
      idealBudget - minBudget,
      maxBudget - idealBudget
    );
    const proximityScore = 100 - (deviation / maxDeviation) * 100;
    return Math.max(0, proximityScore);
  }

  // Si no hay ideal, dar score alto si está en rango
  return 80;
}

/**
 * Calcula score de características (0-100)
 */
function calculateFeaturesScore(
  tenant: TenantProfile,
  property: PropertyInfo
): number {
  let score = 0;
  let totalChecks = 0;

  // Features obligatorias
  const requiredFeatures = [
    { need: tenant.preferences.needsFurnished, has: property.isFurnished, points: 25 },
    { need: tenant.preferences.needsPetFriendly, has: property.petsAllowed, points: 20 },
    { need: tenant.preferences.needsElevator, has: property.hasElevator, points: 15 },
    { need: tenant.preferences.needsParking, has: property.hasParking, points: 15 },
  ];

  requiredFeatures.forEach(({ need, has, points }) => {
    if (need) {
      totalChecks++;
      if (has) {
        score += points;
      }
    }
  });

  // Si no hay features requeridas, score base alto
  if (totalChecks === 0) {
    return 75;
  }

  return Math.min(score, 100);
}

/**
 * Calcula score de tamaño (0-100)
 */
function calculateSizeScore(
  tenant: TenantProfile,
  property: PropertyInfo
): number {
  let score = 0;

  // 1. Habitaciones (50 puntos)
  const minRooms = tenant.preferences.minRooms || 1;
  if (property.rooms >= minRooms) {
    score += 50;
    // Bonus si tiene habitaciones extra (hasta 10 puntos)
    const extraRooms = property.rooms - minRooms;
    score += Math.min(extraRooms * 5, 10);
  } else {
    // Penalización si faltan habitaciones
    score += Math.max(0, 50 - (minRooms - property.rooms) * 20);
  }

  // 2. Baños (20 puntos)
  const minBathrooms = tenant.preferences.minBathrooms || 1;
  if (property.bathrooms >= minBathrooms) {
    score += 20;
  }

  // 3. Superficie (30 puntos)
  const minSquareMeters = tenant.preferences.minSquareMeters || 50;
  if (property.squareMeters >= minSquareMeters) {
    score += 30;
  } else {
    // Penalización proporcional
    const ratio = property.squareMeters / minSquareMeters;
    score += 30 * ratio;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Calcula score de disponibilidad (0-100)
 */
function calculateAvailabilityScore(
  tenant: TenantProfile,
  property: PropertyInfo
): number {
  if (!tenant.preferences.moveInDate || !property.availableFrom) {
    return 50; // Score neutro si no hay fechas
  }

  const tenantDate = new Date(tenant.preferences.moveInDate);
  const propertyDate = new Date(property.availableFrom);

  // Diferencia en días
  const diffDays = Math.abs(
    (tenantDate.getTime() - propertyDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return 100; // Coincidencia perfecta
  } else if (diffDays <= 7) {
    return 90; // Menos de 1 semana
  } else if (diffDays <= 14) {
    return 80; // Menos de 2 semanas
  } else if (diffDays <= 30) {
    return 60; // Menos de 1 mes
  } else if (diffDays <= 60) {
    return 40; // Menos de 2 meses
  } else {
    return 20; // Más de 2 meses
  }
}

/**
 * Calcula score total ponderado
 */
function calculateTotalScore(
  tenant: TenantProfile,
  property: PropertyInfo
): {
  totalScore: number;
  locationScore: number;
  priceScore: number;
  featuresScore: number;
  sizeScore: number;
  availabilityScore: number;
} {
  // Calcular scores individuales
  const locationScore = calculateLocationScore(tenant, property);
  const priceScore = calculatePriceScore(tenant, property);
  const featuresScore = calculateFeaturesScore(tenant, property);
  const sizeScore = calculateSizeScore(tenant, property);
  const availabilityScore = calculateAvailabilityScore(tenant, property);

  // Aplicar pesos personalizados del tenant
  const customWeights = {
    location: tenant.preferences.priorityLocation || 8,
    price: tenant.preferences.priorityPrice || 9,
    size: tenant.preferences.prioritySize || 7,
    features: tenant.preferences.priorityFeatures || 6,
  };

  // Normalizar pesos a 100
  const totalPriority =
    customWeights.location +
    customWeights.price +
    customWeights.size +
    customWeights.features;

  const normalizedWeights = {
    location: (customWeights.location / totalPriority) * 90, // 90% para factores principales
    price: (customWeights.price / totalPriority) * 90,
    size: (customWeights.size / totalPriority) * 90,
    features: (customWeights.features / totalPriority) * 90,
    availability: 10, // 10% fijo para disponibilidad
  };

  // Score total ponderado
  const totalScore = Math.round(
    (locationScore * normalizedWeights.location) / 100 +
      (priceScore * normalizedWeights.price) / 100 +
      (featuresScore * normalizedWeights.features) / 100 +
      (sizeScore * normalizedWeights.size) / 100 +
      (availabilityScore * normalizedWeights.availability) / 100
  );

  return {
    totalScore: Math.min(totalScore, 100),
    locationScore: Math.round(locationScore),
    priceScore: Math.round(priceScore),
    featuresScore: Math.round(featuresScore),
    sizeScore: Math.round(sizeScore),
    availabilityScore: Math.round(availabilityScore),
  };
}

// ============================================================================
// ANÁLISIS CUALITATIVO CON IA
// ============================================================================

/**
 * Genera análisis cualitativo con Claude
 */
async function analyzeMatchWithAI(
  tenant: TenantProfile,
  property: PropertyInfo,
  scores: any
): Promise<{
  recommendation: string;
  pros: string[];
  cons: string[];
}> {
  try {
    const prompt = `Eres un experto en matching inmobiliario. Analiza este match entre inquilino y propiedad:

INQUILINO:
- Nombre: ${tenant.name}
- Presupuesto: ${tenant.preferences.minBudget || 'N/A'}€ - ${tenant.preferences.maxBudget || 'N/A'}€ (ideal: ${tenant.preferences.idealBudget || 'N/A'}€)
- Habitaciones mínimas: ${tenant.preferences.minRooms || 'N/A'}
- Necesita transporte público: ${tenant.preferences.needsPublicTransport ? 'Sí' : 'No'}
- Tiene coche: ${tenant.preferences.hasCar ? 'Sí' : 'No'}
- Tiene mascotas: ${tenant.preferences.hasPets ? 'Sí' : 'No'}
- Necesita amueblado: ${tenant.preferences.needsFurnished ? 'Sí' : 'No'}
- Fecha de entrada: ${tenant.preferences.moveInDate ? new Date(tenant.preferences.moveInDate).toLocaleDateString('es-ES') : 'N/A'}

PROPIEDAD:
- Dirección: ${property.address}, ${property.city}
- Precio: ${property.price}€/mes
- Habitaciones: ${property.rooms}
- Baños: ${property.bathrooms}
- Superficie: ${property.squareMeters}m²
- Amueblado: ${property.isFurnished ? 'Sí' : 'No'}
- Mascotas permitidas: ${property.petsAllowed ? 'Sí' : 'No'}
- Ascensor: ${property.hasElevator ? 'Sí' : 'No'}
- Parking: ${property.hasParking ? 'Sí' : 'No'}
- Metro cerca: ${property.hasMetro ? 'Sí' : 'No'}
- Disponible desde: ${property.availableFrom ? new Date(property.availableFrom).toLocaleDateString('es-ES') : 'N/A'}

SCORES AUTOMÁTICOS:
- Score total: ${scores.totalScore}/100
- Ubicación: ${scores.locationScore}/100
- Precio: ${scores.priceScore}/100
- Características: ${scores.featuresScore}/100
- Tamaño: ${scores.sizeScore}/100
- Disponibilidad: ${scores.availabilityScore}/100

Proporciona un análisis en formato JSON:

{
  "recommendation": "string con recomendación final (50-100 palabras)",
  "pros": ["ventaja1", "ventaja2", "ventaja3"],
  "cons": ["desventaja1", "desventaja2"]
}

Sé específico, práctico y considera factores cualitativos que el algoritmo no captura.`;

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0.5,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content.find((block) => block.type === 'text');
    if (!content || content.type !== 'text') {
      throw new Error('No text content in AI response');
    }

    // Extraer JSON
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      recommendation: result.recommendation,
      pros: result.pros || [],
      cons: result.cons || [],
    };
  } catch (error) {
    logger.error('Error in AI match analysis:', error);
    // Fallback sin IA
    return {
      recommendation: 'Análisis automático completado. Revisar manualmente.',
      pros: ['Match basado en criterios cuantitativos'],
      cons: ['Análisis cualitativo no disponible'],
    };
  }
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Encuentra mejores matches para un inquilino
 */
export async function findBestMatches(
  tenantId: string,
  companyId: string,
  limit: number = 10,
  useAI: boolean = true
): Promise<MatchResult[]> {
  try {
    logger.info('🔍 Finding best matches for tenant', { tenantId, limit });

    // 1. Obtener perfil del inquilino
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        companyId,
      },
      include: {
        preferences: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // 2. Construir filtros base
    const filters: any = {
      building: {
        companyId,
      },
      estado: 'disponible',
    };

    // Aplicar filtros de preferencias
    if (tenant.preferences?.minBudget || tenant.preferences?.maxBudget) {
      filters.rentaMensual = {};
      if (tenant.preferences.minBudget) {
        filters.rentaMensual.gte = tenant.preferences.minBudget;
      }
      if (tenant.preferences.maxBudget) {
        filters.rentaMensual.lte = tenant.preferences.maxBudget;
      }
    }

    if (tenant.preferences?.minRooms) {
      filters.habitaciones = {
        gte: tenant.preferences.minRooms,
      };
    }

    // 3. Obtener propiedades candidatas
    const properties = await prisma.unit.findMany({
      where: filters,
      include: {
        building: {
          select: {
            nombre: true,
            direccion: true,
            ciudad: true,
            codigoPostal: true,
          },
        },
      },
      take: limit * 3, // Obtener más para scoring
    });

    logger.info(`📊 Found ${properties.length} candidate properties`);

    // 4. Calcular scores para cada propiedad
    const tenantProfile: TenantProfile = {
      id: tenant.id,
      name: tenant.nombreCompleto,
      email: tenant.email,
      preferences: {
        minBudget: tenant.preferences?.minBudget || undefined,
        maxBudget: tenant.preferences?.maxBudget || undefined,
        idealBudget: tenant.preferences?.idealBudget || undefined,
        preferredCities: tenant.preferences?.preferredCities || [],
        preferredZones: tenant.preferences?.preferredZones || [],
        needsPublicTransport: tenant.preferences?.needsPublicTransport || true,
        needsParking: tenant.preferences?.needsParking || false,
        hasCar: tenant.preferences?.hasCar || false,
        minRooms: tenant.preferences?.minRooms || undefined,
        minBathrooms: tenant.preferences?.minBathrooms || undefined,
        minSquareMeters: tenant.preferences?.minSquareMeters || undefined,
        needsFurnished: tenant.preferences?.needsFurnished || false,
        hasPets: tenant.preferences?.hasPets || false,
        needsPetFriendly: tenant.preferences?.needsPetFriendly || false,
        needsElevator: tenant.preferences?.needsElevator || false,
        moveInDate: tenant.preferences?.moveInDate || undefined,
        workAddress: tenant.preferences?.workAddress || undefined,
        priorityLocation: tenant.preferences?.priorityLocation || 8,
        priorityPrice: tenant.preferences?.priorityPrice || 9,
        prioritySize: tenant.preferences?.prioritySize || 7,
        priorityFeatures: tenant.preferences?.priorityFeatures || 6,
      },
    };

    const matches: MatchResult[] = [];

    for (const property of properties) {
      const propertyInfo: PropertyInfo = {
        id: property.id,
        address: property.building.direccion,
        city: property.building.ciudad || '',
        price: Number(property.rentaMensual || 0),
        rooms: property.habitaciones || 0,
        bathrooms: property.banos || 0,
        squareMeters: Number(property.superficie || 0),
        isFurnished: property.amueblado || false,
        petsAllowed: property.mascotasPermitidas || false,
        hasElevator: property.ascensor || false,
        hasParking: property.parking || false,
        hasMetro: true, // Mock - en producción, calcular con API de Google Maps
        features: [],
      };

      const scores = calculateTotalScore(tenantProfile, propertyInfo);

      // Solo incluir matches con score > 40
      if (scores.totalScore > 40) {
        let aiAnalysis = undefined;

        // Análisis con IA solo para top matches (score > 70) y si está habilitado
        if (useAI && scores.totalScore > 70) {
          aiAnalysis = await analyzeMatchWithAI(
            tenantProfile,
            propertyInfo,
            scores
          );
        }

        matches.push({
          unitId: property.id,
          tenantId: tenant.id,
          matchScore: scores.totalScore,
          locationScore: scores.locationScore,
          priceScore: scores.priceScore,
          featuresScore: scores.featuresScore,
          sizeScore: scores.sizeScore,
          availabilityScore: scores.availabilityScore,
          aiRecommendation: aiAnalysis?.recommendation,
          pros: aiAnalysis?.pros || [],
          cons: aiAnalysis?.cons || [],
        });
      }
    }

    // 5. Ordenar por score y limitar
    matches.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = matches.slice(0, limit);

    logger.info(`✅ Found ${topMatches.length} matches for tenant`);

    return topMatches;
  } catch (error) {
    logger.error('Error finding matches:', error);
    throw error;
  }
}

/**
 * Guarda matches en base de datos
 */
export async function saveMatches(
  matches: MatchResult[],
  companyId: string
): Promise<void> {
  try {
    // Usar upsert para evitar duplicados
    for (const match of matches) {
      await prisma.tenantPropertyMatch.upsert({
        where: {
          tenantId_unitId: {
            tenantId: match.tenantId,
            unitId: match.unitId,
          },
        },
        update: {
          matchScore: match.matchScore,
          locationScore: match.locationScore,
          priceScore: match.priceScore,
          featuresScore: match.featuresScore,
          sizeScore: match.sizeScore,
          availabilityScore: match.availabilityScore,
          aiRecommendation: match.aiRecommendation || null,
          pros: match.pros,
          cons: match.cons,
          status: 'SUGGESTED',
          updatedAt: new Date(),
        },
        create: {
          companyId,
          tenantId: match.tenantId,
          unitId: match.unitId,
          matchScore: match.matchScore,
          locationScore: match.locationScore,
          priceScore: match.priceScore,
          featuresScore: match.featuresScore,
          sizeScore: match.sizeScore,
          availabilityScore: match.availabilityScore,
          aiRecommendation: match.aiRecommendation || null,
          pros: match.pros,
          cons: match.cons,
          status: 'SUGGESTED',
        },
      });
    }

    logger.info(`💾 Saved ${matches.length} matches to database`);
  } catch (error) {
    logger.error('Error saving matches:', error);
    throw error;
  }
}

/**
 * Obtiene matches guardados de un inquilino
 */
export async function getTenantMatches(
  tenantId: string,
  companyId: string
): Promise<any[]> {
  return await prisma.tenantPropertyMatch.findMany({
    where: {
      tenantId,
      companyId,
    },
    include: {
      unit: {
        include: {
          building: {
            select: {
              nombre: true,
              direccion: true,
              ciudad: true,
            },
          },
        },
      },
    },
    orderBy: {
      matchScore: 'desc',
    },
  });
}

/**
 * Actualiza estado de un match (visto, contactado, etc.)
 */
export async function updateMatchStatus(
  matchId: string,
  status: string,
  companyId: string
): Promise<void> {
  const updateData: any = { status };

  if (status === 'VIEWED') {
    updateData.viewedAt = new Date();
  } else if (status === 'CONTACTED') {
    updateData.contactedAt = new Date();
  }

  await prisma.tenantPropertyMatch.updateMany({
    where: {
      id: matchId,
      companyId,
    },
    data: updateData,
  });
}
