/**
 * STR DYNAMIC PRICING SERVICE
 * Servicio de precios dinámicos para alquileres vacacionales (STR)
 * Incluye: temporadas, precios por día de semana, eventos especiales, descuentos
 */

// Lazy Prisma loading
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
import { addDays, differenceInDays, isWeekend, format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

// ========================================
// TIPOS Y INTERFACES
// ========================================

export type SeasonType = 'low' | 'medium' | 'high' | 'peak';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 6 = Sábado

export interface Season {
  id: string;
  name: string;
  type: SeasonType;
  startDate: Date;
  endDate: Date;
  priceMultiplier: number; // 1.0 = precio base, 1.5 = +50%, 0.8 = -20%
  minStay?: number;
  description?: string;
}

export interface WeekdayPricing {
  dayOfWeek: DayOfWeek;
  priceMultiplier: number;
}

export interface SpecialEvent {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  priceMultiplier: number;
  minStay?: number;
  description?: string;
}

export interface DynamicPricingRule {
  listingId: string;
  basePrice: number;
  seasons: Season[];
  weekdayPricing: WeekdayPricing[];
  specialEvents: SpecialEvent[];
  lastMinuteDiscount?: {
    daysBeforeCheckIn: number;
    discountPercentage: number;
  };
  earlyBirdDiscount?: {
    daysBeforeCheckIn: number;
    discountPercentage: number;
  };
  longStayDiscount?: {
    minNights: number;
    discountPercentage: number;
  }[];
}

export interface PriceBreakdown {
  date: string;
  basePrice: number;
  seasonMultiplier: number;
  weekdayMultiplier: number;
  eventMultiplier: number;
  discounts: Array<{
    type: string;
    amount: number;
  }>;
  finalPrice: number;
  seasonName?: string;
  eventName?: string;
}

export interface BookingPriceCalculation {
  checkIn: Date;
  checkOut: Date;
  nights: number;
  dailyPrices: PriceBreakdown[];
  subtotal: number;
  discounts: Array<{
    type: string;
    amount: number;
  }>;
  total: number;
  averageNightlyRate: number;
}

// ========================================
// GESTIÓN DE TEMPORADAS
// ========================================

/**
 * Obtiene la temporada activa para una fecha específica
 */
export function getActiveSeason(
  date: Date,
  seasons: Season[]
): Season | null {
  const targetDate = startOfDay(date);
  
  for (const season of seasons) {
    const seasonStart = startOfDay(season.startDate);
    const seasonEnd = endOfDay(season.endDate);
    
    if (targetDate >= seasonStart && targetDate <= seasonEnd) {
      return season;
    }
  }
  
  return null;
}

/**
 * Obtiene evento especial activo para una fecha
 */
export function getActiveEvent(
  date: Date,
  events: SpecialEvent[]
): SpecialEvent | null {
  const targetDate = startOfDay(date);
  
  for (const event of events) {
    const eventStart = startOfDay(event.startDate);
    const eventEnd = endOfDay(event.endDate);
    
    if (targetDate >= eventStart && targetDate <= eventEnd) {
      return event;
    }
  }
  
  return null;
}

/**
 * Crea temporadas predefinidas típicas (España)
 */
export function createDefaultSeasons(year: number): Season[] {
  return [
    {
      id: `low-winter-${year}`,
      name: 'Temporada Baja (Invierno)',
      type: 'low',
      startDate: new Date(year, 0, 1), // 1 enero
      endDate: new Date(year, 2, 31), // 31 marzo
      priceMultiplier: 0.7,
      description: 'Invierno - Precio reducido',
    },
    {
      id: `medium-spring-${year}`,
      name: 'Temporada Media (Primavera)',
      type: 'medium',
      startDate: new Date(year, 3, 1), // 1 abril
      endDate: new Date(year, 5, 14), // 14 junio
      priceMultiplier: 1.0,
      description: 'Primavera - Precio base',
    },
    {
      id: `high-summer-${year}`,
      name: 'Temporada Alta (Verano)',
      type: 'high',
      startDate: new Date(year, 5, 15), // 15 junio
      endDate: new Date(year, 8, 15), // 15 septiembre
      priceMultiplier: 1.5,
      minStay: 3,
      description: 'Verano - Precio elevado, estancia mínima 3 noches',
    },
    {
      id: `peak-august-${year}`,
      name: 'Temporada Punta (Agosto)',
      type: 'peak',
      startDate: new Date(year, 7, 1), // 1 agosto
      endDate: new Date(year, 7, 31), // 31 agosto
      priceMultiplier: 2.0,
      minStay: 5,
      description: 'Agosto - Precio máximo, estancia mínima 5 noches',
    },
    {
      id: `medium-autumn-${year}`,
      name: 'Temporada Media (Otoño)',
      type: 'medium',
      startDate: new Date(year, 8, 16), // 16 septiembre
      endDate: new Date(year, 11, 19), // 19 diciembre
      priceMultiplier: 1.0,
      description: 'Otoño - Precio base',
    },
    {
      id: `peak-holidays-${year}`,
      name: 'Temporada Punta (Navidad)',
      type: 'peak',
      startDate: new Date(year, 11, 20), // 20 diciembre
      endDate: new Date(year, 11, 31), // 31 diciembre
      priceMultiplier: 1.8,
      minStay: 3,
      description: 'Navidad/Fin de año - Precio elevado',
    },
  ];
}

/**
 * Crea eventos especiales predefinidos (España)
 */
export function createDefaultEvents(year: number): SpecialEvent[] {
  return [
    {
      id: `semana-santa-${year}`,
      name: 'Semana Santa',
      startDate: new Date(year, 3, 1), // Aproximado
      endDate: new Date(year, 3, 10),
      priceMultiplier: 1.6,
      minStay: 2,
      description: 'Semana Santa - Alta demanda',
    },
    {
      id: `fiestas-patrias-${year}`,
      name: 'Fiestas Locales',
      startDate: new Date(year, 7, 15),
      endDate: new Date(year, 7, 16),
      priceMultiplier: 1.4,
      description: 'Fiestas locales',
    },
  ];
}

/**
 * Pricing por día de la semana (típico: fin de semana más caro)
 */
export function createDefaultWeekdayPricing(): WeekdayPricing[] {
  return [
    { dayOfWeek: 0, priceMultiplier: 1.1 }, // Domingo
    { dayOfWeek: 1, priceMultiplier: 0.9 }, // Lunes
    { dayOfWeek: 2, priceMultiplier: 0.9 }, // Martes
    { dayOfWeek: 3, priceMultiplier: 0.9 }, // Miércoles
    { dayOfWeek: 4, priceMultiplier: 1.0 }, // Jueves
    { dayOfWeek: 5, priceMultiplier: 1.2 }, // Viernes
    { dayOfWeek: 6, priceMultiplier: 1.3 }, // Sábado
  ];
}

// ========================================
// CÁLCULO DE PRECIOS
// ========================================

/**
 * Calcula el precio para una noche específica
 */
export function calculateDailyPrice(
  date: Date,
  basePrice: number,
  rules: DynamicPricingRule
): PriceBreakdown {
  let finalPrice = basePrice;
  const discounts: Array<{ type: string; amount: number }> = [];
  
  // 1. Aplicar temporada
  const season = getActiveSeason(date, rules.seasons);
  const seasonMultiplier = season?.priceMultiplier || 1.0;
  
  // 2. Aplicar evento especial (sobrescribe temporada si existe)
  const event = getActiveEvent(date, rules.specialEvents);
  const eventMultiplier = event?.priceMultiplier || 1.0;
  
  // 3. Aplicar día de la semana
  const dayOfWeek = date.getDay() as DayOfWeek;
  const weekdayRule = rules.weekdayPricing.find(w => w.dayOfWeek === dayOfWeek);
  const weekdayMultiplier = weekdayRule?.priceMultiplier || 1.0;
  
  // Calcular precio con multiplicadores
  // Si hay evento, el evento tiene prioridad sobre la temporada
  const activeMultiplier = event ? eventMultiplier : seasonMultiplier;
  finalPrice = basePrice * activeMultiplier * weekdayMultiplier;
  
  return {
    date: format(date, 'yyyy-MM-dd'),
    basePrice,
    seasonMultiplier,
    weekdayMultiplier,
    eventMultiplier,
    discounts,
    finalPrice: parseFloat(finalPrice.toFixed(2)),
    seasonName: season?.name,
    eventName: event?.name,
  };
}

/**
 * Calcula el precio total de una reserva con descuentos aplicados
 */
export function calculateBookingPrice(
  checkIn: Date,
  checkOut: Date,
  rules: DynamicPricingRule
): BookingPriceCalculation {
  const nights = differenceInDays(checkOut, checkIn);
  
  if (nights <= 0) {
    throw new Error('La fecha de checkout debe ser posterior a la de check-in');
  }
  
  // Calcular precios diarios
  const dailyPrices: PriceBreakdown[] = [];
  let currentDate = new Date(checkIn);
  
  for (let i = 0; i < nights; i++) {
    const dailyPrice = calculateDailyPrice(currentDate, rules.basePrice, rules);
    dailyPrices.push(dailyPrice);
    currentDate = addDays(currentDate, 1);
  }
  
  // Calcular subtotal
  const subtotal = dailyPrices.reduce((sum, day) => sum + day.finalPrice, 0);
  
  // Aplicar descuentos
  const discounts: Array<{ type: string; amount: number }> = [];
  let total = subtotal;
  
  // 1. Descuento por estancia larga
  if (rules.longStayDiscount) {
    // Ordenar de mayor a menor por minNights
    const sortedDiscounts = [...rules.longStayDiscount].sort((a, b) => b.minNights - a.minNights);
    
    for (const discount of sortedDiscounts) {
      if (nights >= discount.minNights) {
        const discountAmount = (subtotal * discount.discountPercentage) / 100;
        discounts.push({
          type: `Descuento estancia larga (${nights} noches)`,
          amount: parseFloat(discountAmount.toFixed(2)),
        });
        total -= discountAmount;
        break; // Solo aplicar el primer descuento que coincida
      }
    }
  }
  
  // 2. Descuento early bird (reserva anticipada)
  if (rules.earlyBirdDiscount) {
    const daysUntilCheckIn = differenceInDays(checkIn, new Date());
    if (daysUntilCheckIn >= rules.earlyBirdDiscount.daysBeforeCheckIn) {
      const discountAmount = (subtotal * rules.earlyBirdDiscount.discountPercentage) / 100;
      discounts.push({
        type: 'Descuento reserva anticipada',
        amount: parseFloat(discountAmount.toFixed(2)),
      });
      total -= discountAmount;
    }
  }
  
  // 3. Descuento last minute
  if (rules.lastMinuteDiscount) {
    const daysUntilCheckIn = differenceInDays(checkIn, new Date());
    if (daysUntilCheckIn <= rules.lastMinuteDiscount.daysBeforeCheckIn && daysUntilCheckIn > 0) {
      const discountAmount = (subtotal * rules.lastMinuteDiscount.discountPercentage) / 100;
      discounts.push({
        type: 'Descuento última hora',
        amount: parseFloat(discountAmount.toFixed(2)),
      });
      total -= discountAmount;
    }
  }
  
  const averageNightlyRate = nights > 0 ? total / nights : 0;
  
  return {
    checkIn,
    checkOut,
    nights,
    dailyPrices,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discounts,
    total: parseFloat(total.toFixed(2)),
    averageNightlyRate: parseFloat(averageNightlyRate.toFixed(2)),
  };
}

// ========================================
// GESTIÓN DE REGLAS DE PRICING
// ========================================

/**
 * Guarda reglas de pricing dinámico en la base de datos
 */
export async function saveDynamicPricingRules(
  listingId: string,
  companyId: string,
  rules: DynamicPricingRule
) {
  // Guardar en el campo JSON del listing
  await prisma.sTRListing.update({
    where: { id: listingId },
    data: {
      pricingRules: rules as any,
      updatedAt: new Date(),
    },
  });
  
  return rules;
}

/**
 * Obtiene reglas de pricing dinámico de un listing
 */
export async function getDynamicPricingRules(
  listingId: string
): Promise<DynamicPricingRule | null> {
  const listing = await prisma.sTRListing.findUnique({
    where: { id: listingId },
    select: { pricingRules: true, precioPorNoche: true },
  });
  
  if (!listing) return null;
  
  // Si no hay reglas guardadas, crear unas por defecto
  if (!listing.pricingRules) {
    const currentYear = new Date().getFullYear();
    return {
      listingId,
      basePrice: listing.precioPorNoche,
      seasons: createDefaultSeasons(currentYear),
      weekdayPricing: createDefaultWeekdayPricing(),
      specialEvents: createDefaultEvents(currentYear),
      longStayDiscount: [
        { minNights: 7, discountPercentage: 10 },
        { minNights: 14, discountPercentage: 15 },
        { minNights: 30, discountPercentage: 25 },
      ],
      earlyBirdDiscount: {
        daysBeforeCheckIn: 60,
        discountPercentage: 10,
      },
      lastMinuteDiscount: {
        daysBeforeCheckIn: 3,
        discountPercentage: 15,
      },
    };
  }
  
  return listing.pricingRules as unknown as DynamicPricingRule;
}

/**
 * Calcula calendario de precios para un rango de fechas
 */
export async function getPriceCalendar(
  listingId: string,
  startDate: Date,
  endDate: Date
): Promise<PriceBreakdown[]> {
  const rules = await getDynamicPricingRules(listingId);
  
  if (!rules) {
    throw new Error('No se encontraron reglas de pricing para este listing');
  }
  
  const calendar: PriceBreakdown[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dailyPrice = calculateDailyPrice(currentDate, rules.basePrice, rules);
    calendar.push(dailyPrice);
    currentDate = addDays(currentDate, 1);
  }
  
  return calendar;
}

/**
 * Obtiene precio óptimo sugerido basado en ocupación y demanda
 */
export async function getSuggestedPrice(
  listingId: string,
  date: Date,
  occupancyRate: number, // 0-100
  competitorPrices?: number[]
): Promise<number> {
  const rules = await getDynamicPricingRules(listingId);
  
  if (!rules) {
    throw new Error('No se encontraron reglas de pricing');
  }
  
  // Calcular precio base con temporada y día de semana
  const baseCalculation = calculateDailyPrice(date, rules.basePrice, rules);
  let suggestedPrice = baseCalculation.finalPrice;
  
  // Ajustar según tasa de ocupación
  if (occupancyRate < 30) {
    // Baja ocupación: reducir precio 10-20%
    suggestedPrice *= 0.85;
  } else if (occupancyRate > 80) {
    // Alta ocupación: aumentar precio 10-15%
    suggestedPrice *= 1.12;
  }
  
  // Ajustar según precios de competencia (opcional)
  if (competitorPrices && competitorPrices.length > 0) {
    const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    
    // Si estamos muy por debajo de la competencia, podemos subir un poco
    if (suggestedPrice < avgCompetitorPrice * 0.85) {
      suggestedPrice = avgCompetitorPrice * 0.9;
    }
    // Si estamos muy por encima, bajar un poco
    if (suggestedPrice > avgCompetitorPrice * 1.2) {
      suggestedPrice = avgCompetitorPrice * 1.1;
    }
  }
  
  return parseFloat(suggestedPrice.toFixed(2));
}

// ========================================
// UTILIDADES
// ========================================

/**
 * Formatea un breakdown de precio para mostrar
 */
export function formatPriceBreakdown(breakdown: PriceBreakdown): string {
  const parts: string[] = [];
  
  parts.push(`Fecha: ${breakdown.date}`);
  parts.push(`Precio base: €${breakdown.basePrice}`);
  
  if (breakdown.seasonName) {
    parts.push(`Temporada: ${breakdown.seasonName} (x${breakdown.seasonMultiplier})`);
  }
  
  if (breakdown.eventName) {
    parts.push(`Evento: ${breakdown.eventName} (x${breakdown.eventMultiplier})`);
  }
  
  if (breakdown.weekdayMultiplier !== 1.0) {
    parts.push(`Día de semana: x${breakdown.weekdayMultiplier}`);
  }
  
  if (breakdown.discounts.length > 0) {
    breakdown.discounts.forEach(d => {
      parts.push(`${d.type}: -€${d.amount}`);
    });
  }
  
  parts.push(`**TOTAL: €${breakdown.finalPrice}**`);
  
  return parts.join('\n');
}

/**
 * Formatea el cálculo de una reserva para mostrar
 */
export function formatBookingCalculation(calc: BookingPriceCalculation): string {
  const parts: string[] = [];
  
  parts.push(`**CÁLCULO DE RESERVA**`);
  parts.push(`Check-in: ${format(calc.checkIn, 'dd/MM/yyyy', { locale: es })}`);
  parts.push(`Check-out: ${format(calc.checkOut, 'dd/MM/yyyy', { locale: es })}`);
  parts.push(`Noches: ${calc.nights}`);
  parts.push('');
  parts.push(`Subtotal: €${calc.subtotal}`);
  
  if (calc.discounts.length > 0) {
    parts.push('');
    parts.push('**Descuentos aplicados:**');
    calc.discounts.forEach(d => {
      parts.push(`- ${d.type}: -€${d.amount}`);
    });
  }
  
  parts.push('');
  parts.push(`**TOTAL: €${calc.total}**`);
  parts.push(`Tarifa promedio por noche: €${calc.averageNightlyRate}`);
  
  return parts.join('\n');
}
