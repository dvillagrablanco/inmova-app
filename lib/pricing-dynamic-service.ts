/**
 * Dynamic Pricing Service for STR (Short-Term Rentals)
 * Pricing dinámico basado en ocupación, temporada y demanda
 */

import { logger } from './logger';
import prisma from './db';

interface PricingFactors {
  basePrice: number;
  occupancyRate: number; // 0-1
  dayOfWeek: number; // 0-6 (0 = Domingo)
  month: number; // 1-12
  daysUntilBooking: number;
  localEvents: boolean;
  weatherScore: number; // 0-1 (0 = malo, 1 = excelente)
  competitorPrices: number[];
}

interface PricingResult {
  suggestedPrice: number;
  confidence: number; // 0-1
  factors: {
    seasonal: number;
    occupancy: number;
    demand: number;
    competition: number;
    total: number;
  };
  reasoning: string[];
}

/**
 * Calcula el precio óptimo usando algoritmo de pricing dinámico
 */
export async function calculateDynamicPrice(
  unitId: string,
  factors: PricingFactors
): Promise<PricingResult> {
  try {
    logger.info('Calculating dynamic price', { unitId, factors });

    const {
      basePrice,
      occupancyRate,
      dayOfWeek,
      month,
      daysUntilBooking,
      localEvents,
      weatherScore,
      competitorPrices,
    } = factors;

    const reasoning: string[] = [];
    let finalMultiplier = 1.0;

    // 1. Factor estacional (temporada alta/baja)
    const seasonalMultiplier = getSeasonalMultiplier(month);
    finalMultiplier *= seasonalMultiplier;
    
    if (seasonalMultiplier > 1.1) {
      reasoning.push(`Temporada alta (+${((seasonalMultiplier - 1) * 100).toFixed(0)}%)`);
    } else if (seasonalMultiplier < 0.9) {
      reasoning.push(`Temporada baja (${((1 - seasonalMultiplier) * 100).toFixed(0)}%)`);
    }

    // 2. Factor de ocupación (más ocupación = mayor precio)
    const occupancyMultiplier = getOccupancyMultiplier(occupancyRate);
    finalMultiplier *= occupancyMultiplier;
    
    if (occupancyRate > 0.8) {
      reasoning.push(`Alta ocupación (+${((occupancyMultiplier - 1) * 100).toFixed(0)}%)`);
    } else if (occupancyRate < 0.3) {
      reasoning.push(`Baja ocupación (${((1 - occupancyMultiplier) * 100).toFixed(0)}%)`);
    }

    // 3. Factor día de la semana
    const dayMultiplier = getDayOfWeekMultiplier(dayOfWeek);
    finalMultiplier *= dayMultiplier;
    
    if (dayMultiplier > 1.05) {
      reasoning.push('Fin de semana (+10%)');
    }

    // 4. Factor de antelación (last-minute booking)
    const urgencyMultiplier = getUrgencyMultiplier(daysUntilBooking);
    finalMultiplier *= urgencyMultiplier;
    
    if (daysUntilBooking < 3) {
      reasoning.push(`Reserva de última hora (${daysUntilBooking < 1 ? '-20%' : '-10%'})`);
    } else if (daysUntilBooking > 60) {
      reasoning.push('Reserva anticipada (+5%)');
    }

    // 5. Factor de eventos locales
    if (localEvents) {
      finalMultiplier *= 1.25;
      reasoning.push('Eventos locales (+25%)');
    }

    // 6. Factor de clima
    const weatherMultiplier = getWeatherMultiplier(weatherScore);
    finalMultiplier *= weatherMultiplier;
    
    if (weatherScore > 0.8) {
      reasoning.push('Buen tiempo (+5%)');
    }

    // 7. Factor de competencia
    const competitionMultiplier = getCompetitionMultiplier(basePrice, competitorPrices);
    finalMultiplier *= competitionMultiplier;
    
    if (competitionMultiplier < 0.95) {
      reasoning.push('Ajuste competitivo (-5%)');
    } else if (competitionMultiplier > 1.05) {
      reasoning.push('Precio competitivo (+5%)');
    }

    // Calcular precio final
    let suggestedPrice = basePrice * finalMultiplier;

    // Aplicar límites (no más de +100% ni menos de -40% del precio base)
    const minPrice = basePrice * 0.6;
    const maxPrice = basePrice * 2.0;
    suggestedPrice = Math.max(minPrice, Math.min(maxPrice, suggestedPrice));

    // Redondear a múltiplo de 5
    suggestedPrice = Math.round(suggestedPrice / 5) * 5;

    // Calcular confianza basada en datos disponibles
    const confidence = calculateConfidence(factors, competitorPrices.length);

    const result: PricingResult = {
      suggestedPrice,
      confidence,
      factors: {
        seasonal: (seasonalMultiplier - 1) * 100,
        occupancy: (occupancyMultiplier - 1) * 100,
        demand: (dayMultiplier - 1) * 100,
        competition: (competitionMultiplier - 1) * 100,
        total: (finalMultiplier - 1) * 100,
      },
      reasoning,
    };

    logger.info('Dynamic price calculated', {
      unitId,
      basePrice,
      suggestedPrice,
      confidence,
    });

    return result;

  } catch (error) {
    logger.error('Error calculating dynamic price', {
      error: error instanceof Error ? error.message : String(error),
      unitId,
    });
    
    // Fallback: retornar precio base
    return {
      suggestedPrice: factors.basePrice,
      confidence: 0.5,
      factors: {
        seasonal: 0,
        occupancy: 0,
        demand: 0,
        competition: 0,
        total: 0,
      },
      reasoning: ['Error en cálculo, usando precio base'],
    };
  }
}

/**
 * Obtener multiplicador estacional
 */
function getSeasonalMultiplier(month: number): number {
  // Temporada alta en verano (junio-septiembre) e invierno (diciembre-febrero)
  // Temporada baja en primavera y otoño
  
  const seasonalMap: Record<number, number> = {
    1: 1.1,  // Enero (invierno)
    2: 1.1,  // Febrero (invierno)
    3: 0.9,  // Marzo (primavera)
    4: 0.95, // Abril
    5: 1.0,  // Mayo
    6: 1.2,  // Junio (verano)
    7: 1.3,  // Julio (verano alto)
    8: 1.3,  // Agosto (verano alto)
    9: 1.15, // Septiembre
    10: 0.9, // Octubre (otoño)
    11: 0.85,// Noviembre (baja)
    12: 1.15,// Diciembre (festivo)
  };
  
  return seasonalMap[month] || 1.0;
}

/**
 * Obtener multiplicador de ocupación
 */
function getOccupancyMultiplier(occupancyRate: number): number {
  // Alta ocupación = aumentar precio
  // Baja ocupación = reducir precio para atraer reservas
  
  if (occupancyRate > 0.9) return 1.20; // +20%
  if (occupancyRate > 0.8) return 1.15; // +15%
  if (occupancyRate > 0.7) return 1.10; // +10%
  if (occupancyRate > 0.5) return 1.0;  // Sin cambio
  if (occupancyRate > 0.3) return 0.95; // -5%
  if (occupancyRate > 0.1) return 0.90; // -10%
  return 0.85; // -15% (muy baja ocupación)
}

/**
 * Obtener multiplicador por día de la semana
 */
function getDayOfWeekMultiplier(dayOfWeek: number): number {
  // Viernes-Sábado: premium
  // Domingo-Jueves: estándar
  
  if (dayOfWeek === 5 || dayOfWeek === 6) { // Viernes o Sábado
    return 1.15;
  }
  if (dayOfWeek === 0) { // Domingo
    return 1.05;
  }
  return 1.0; // Lunes-Jueves
}

/**
 * Obtener multiplicador de urgencia (antelación de reserva)
 */
function getUrgencyMultiplier(daysUntilBooking: number): number {
  // Last-minute: descuento para ocupar
  // Anticipado: pequeño premium por certeza
  
  if (daysUntilBooking < 1) return 0.80;  // -20% (mismo día)
  if (daysUntilBooking < 3) return 0.90;  // -10% (última hora)
  if (daysUntilBooking < 7) return 0.95;  // -5% (última semana)
  if (daysUntilBooking > 60) return 1.05; // +5% (muy anticipado)
  return 1.0; // Estándar (1-8 semanas)
}

/**
 * Obtener multiplicador de clima
 */
function getWeatherMultiplier(weatherScore: number): number {
  // Clima excelente: pequeño aumento
  // Clima malo: pequeña reducción
  
  if (weatherScore > 0.8) return 1.05;
  if (weatherScore < 0.3) return 0.95;
  return 1.0;
}

/**
 * Obtener multiplicador de competencia
 */
function getCompetitionMultiplier(basePrice: number, competitorPrices: number[]): number {
  if (competitorPrices.length === 0) return 1.0;
  
  const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
  
  // Si nuestro precio es significativamente más alto, reducir
  // Si es más bajo, podemos aumentar un poco
  
  const priceDifference = (basePrice - avgCompetitorPrice) / avgCompetitorPrice;
  
  if (priceDifference > 0.15) return 0.95;  // Somos 15% más caros, reducir
  if (priceDifference < -0.15) return 1.05; // Somos 15% más baratos, aumentar
  return 1.0;
}

/**
 * Calcular nivel de confianza
 */
function calculateConfidence(factors: PricingFactors, competitorDataCount: number): number {
  let confidence = 0.5; // Base
  
  // Más datos de competencia = más confianza
  if (competitorDataCount > 10) confidence += 0.2;
  else if (competitorDataCount > 5) confidence += 0.1;
  
  // Datos de ocupación confiables = más confianza
  if (factors.occupancyRate > 0) confidence += 0.15;
  
  // Eventos locales conocidos = más confianza
  if (factors.localEvents) confidence += 0.1;
  
  // Datos de clima = más confianza
  if (factors.weatherScore > 0) confidence += 0.05;
  
  return Math.min(confidence, 1.0);
}

/**
 * Aplicar precio dinámico a una unidad STR
 */
export async function applyDynamicPricing(
  unitId: string,
  date: Date
): Promise<void> {
  try {
    // Obtener datos de la unidad
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        building: true,
      },
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    // Calcular factores
    const factors: PricingFactors = {
      basePrice: unit.precioDiario || 100,
      occupancyRate: await calculateOccupancyRate(unitId),
      dayOfWeek: date.getDay(),
      month: date.getMonth() + 1,
      daysUntilBooking: Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      localEvents: await checkLocalEvents(unit.building.ciudad, date),
      weatherScore: await getWeatherScore(unit.building.ciudad, date),
      competitorPrices: await getCompetitorPrices(unit.building.ciudad),
    };

    // Calcular precio dinámico
    const pricing = await calculateDynamicPrice(unitId, factors);

    // Guardar precio sugerido (opcional: aplicar automáticamente)
    logger.info('Dynamic pricing applied', {
      unitId,
      date: date.toISOString(),
      basePrice: factors.basePrice,
      suggestedPrice: pricing.suggestedPrice,
      confidence: pricing.confidence,
    });

    // TODO: Guardar en base de datos o aplicar directamente
    // await prisma.strPricing.create({
    //   data: {
    //     unitId,
    //     date,
    //     suggestedPrice: pricing.suggestedPrice,
    //     confidence: pricing.confidence,
    //     factors: pricing.factors,
    //   },
    // });

  } catch (error) {
    logger.error('Error applying dynamic pricing', {
      error: error instanceof Error ? error.message : String(error),
      unitId,
      date,
    });
  }
}

// Funciones auxiliares (implementación básica, mejorar con datos reales)

async function calculateOccupancyRate(unitId: string): Promise<number> {
  // TODO: Calcular basado en reservas reales
  return 0.65; // Placeholder: 65% ocupación
}

async function checkLocalEvents(city: string, date: Date): Promise<boolean> {
  // TODO: Integrar con API de eventos (Eventbrite, Meetup, etc.)
  return false; // Placeholder
}

async function getWeatherScore(city: string, date: Date): Promise<number> {
  // TODO: Integrar con API de clima (OpenWeatherMap, etc.)
  return 0.7; // Placeholder: clima bueno
}

async function getCompetitorPrices(city: string): Promise<number[]> {
  // TODO: Scraping de Airbnb/Booking (usar APIs si disponible)
  return [80, 90, 95, 100, 110]; // Placeholder
}
