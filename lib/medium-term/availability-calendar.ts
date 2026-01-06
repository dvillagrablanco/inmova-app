/**
 * CALENDARIO DE DISPONIBILIDAD PARA MEDIA ESTANCIA
 * 
 * Gestión visual de ocupación, reservas y bloqueos
 */

import { prisma } from '../db';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isWithinInterval,
  addMonths,
  differenceInDays,
  isBefore,
  isAfter,
} from 'date-fns';
import { es } from 'date-fns/locale';

// ==========================================
// TIPOS
// ==========================================

export type DayStatus = 
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'blocked'
  | 'maintenance'
  | 'checkout'
  | 'checkin'
  | 'turnover';

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number;
  isWeekend: boolean;
  status: DayStatus;
  occupancy?: {
    contractId: string;
    tenantName: string;
    startDate: Date;
    endDate: Date;
    isCheckIn: boolean;
    isCheckOut: boolean;
  };
  block?: {
    blockId: string;
    reason: string;
    notes?: string;
  };
  price?: number;
  minStay?: number;
}

export interface CalendarMonth {
  month: number;
  year: number;
  name: string;
  days: CalendarDay[];
  stats: {
    totalDays: number;
    availableDays: number;
    occupiedDays: number;
    blockedDays: number;
    occupancyRate: number;
    revenue: number;
  };
}

export interface AvailabilityBlock {
  id: string;
  propertyId: string;
  startDate: Date;
  endDate: Date;
  reason: 'owner_use' | 'maintenance' | 'renovation' | 'seasonal_close' | 'other';
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface PricingPeriod {
  id: string;
  propertyId: string;
  startDate: Date;
  endDate: Date;
  dailyPrice: number;
  monthlyPrice: number;
  minStay: number;
  maxStay: number;
  seasonType: 'low' | 'mid' | 'high' | 'peak';
  name?: string;
}

export interface GapAnalysis {
  startDate: Date;
  endDate: Date;
  gapDays: number;
  beforeContract?: { id: string; tenantName: string; endDate: Date };
  afterContract?: { id: string; tenantName: string; startDate: Date };
  recommendations: string[];
  potentialRevenue: number;
}

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Genera el calendario de disponibilidad para un inmueble
 */
export async function getAvailabilityCalendar(
  propertyId: string,
  startMonth: Date,
  numberOfMonths: number = 6
): Promise<CalendarMonth[]> {
  const months: CalendarMonth[] = [];

  // Obtener contratos activos y futuros
  const contracts = await prisma.contract.findMany({
    where: {
      unitId: propertyId,
      fechaFin: { gte: startMonth },
      status: { in: ['activo', 'pendiente', 'reservado'] },
    },
    include: {
      tenant: {
        select: { nombre: true },
      },
    },
    orderBy: { fechaInicio: 'asc' },
  });

  // Obtener bloqueos
  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      propertyId,
      endDate: { gte: startMonth },
    },
  });

  // Obtener períodos de precios
  const pricingPeriods = await prisma.pricingPeriod.findMany({
    where: {
      propertyId,
      endDate: { gte: startMonth },
    },
  });

  // Obtener precio base del inmueble
  const property = await prisma.unit.findUnique({
    where: { id: propertyId },
    select: { precioBase: true },
  });
  const basePrice = property?.precioBase || 0;

  // Generar calendario por mes
  for (let i = 0; i < numberOfMonths; i++) {
    const monthStart = addMonths(startMonth, i);
    const monthEnd = endOfMonth(monthStart);
    
    const days = eachDayOfInterval({ start: startOfMonth(monthStart), end: monthEnd });
    
    const calendarDays: CalendarDay[] = days.map(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay();
      
      // Determinar estado del día
      let status: DayStatus = 'available';
      let occupancy: CalendarDay['occupancy'] = undefined;
      let block: CalendarDay['block'] = undefined;
      
      // Verificar contratos
      for (const contract of contracts) {
        if (isWithinInterval(date, { start: contract.fechaInicio, end: contract.fechaFin })) {
          const isCheckIn = format(date, 'yyyy-MM-dd') === format(contract.fechaInicio, 'yyyy-MM-dd');
          const isCheckOut = format(date, 'yyyy-MM-dd') === format(contract.fechaFin, 'yyyy-MM-dd');
          
          if (isCheckIn && isCheckOut) {
            status = 'turnover';
          } else if (isCheckIn) {
            status = 'checkin';
          } else if (isCheckOut) {
            status = 'checkout';
          } else {
            status = 'occupied';
          }
          
          occupancy = {
            contractId: contract.id,
            tenantName: contract.tenant.nombre,
            startDate: contract.fechaInicio,
            endDate: contract.fechaFin,
            isCheckIn,
            isCheckOut,
          };
          break;
        }
      }

      // Verificar bloqueos (solo si no está ocupado)
      if (status === 'available') {
        for (const blk of blocks) {
          if (isWithinInterval(date, { start: blk.startDate, end: blk.endDate })) {
            status = blk.reason === 'maintenance' ? 'maintenance' : 'blocked';
            block = {
              blockId: blk.id,
              reason: blk.reason,
              notes: blk.notes || undefined,
            };
            break;
          }
        }
      }

      // Obtener precio del día
      let price = basePrice / 30; // Precio diario base
      let minStay = 30; // Mínimo 30 días por defecto

      for (const period of pricingPeriods) {
        if (isWithinInterval(date, { start: period.startDate, end: period.endDate })) {
          price = period.dailyPrice || period.monthlyPrice / 30;
          minStay = period.minStay;
          break;
        }
      }

      return {
        date,
        dateString,
        dayOfMonth: date.getDate(),
        dayOfWeek,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        status,
        occupancy,
        block,
        price: Math.round(price * 100) / 100,
        minStay,
      };
    });

    // Calcular estadísticas del mes
    const availableDays = calendarDays.filter(d => d.status === 'available').length;
    const occupiedDays = calendarDays.filter(d => 
      ['occupied', 'checkin', 'checkout', 'turnover'].includes(d.status)
    ).length;
    const blockedDays = calendarDays.filter(d => 
      ['blocked', 'maintenance'].includes(d.status)
    ).length;

    const revenue = calendarDays
      .filter(d => d.status === 'occupied' || d.status === 'checkin')
      .reduce((sum, d) => sum + (d.price || 0), 0);

    months.push({
      month: monthStart.getMonth() + 1,
      year: monthStart.getFullYear(),
      name: format(monthStart, 'MMMM yyyy', { locale: es }),
      days: calendarDays,
      stats: {
        totalDays: calendarDays.length,
        availableDays,
        occupiedDays,
        blockedDays,
        occupancyRate: Math.round((occupiedDays / calendarDays.length) * 100),
        revenue: Math.round(revenue),
      },
    });
  }

  return months;
}

/**
 * Verifica disponibilidad para un rango de fechas
 */
export async function checkAvailability(
  propertyId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  available: boolean;
  conflicts: { type: string; dateRange: string; details: string }[];
  gapDays?: number;
}> {
  const calendar = await getAvailabilityCalendar(propertyId, startDate, 12);
  const allDays = calendar.flatMap(m => m.days);

  const daysInRange = allDays.filter(d => 
    isWithinInterval(d.date, { start: startDate, end: endDate })
  );

  const conflicts: { type: string; dateRange: string; details: string }[] = [];

  for (const day of daysInRange) {
    if (day.status !== 'available') {
      const existingConflict = conflicts.find(c => c.details === day.occupancy?.tenantName || c.details === day.block?.reason);
      if (!existingConflict) {
        conflicts.push({
          type: day.status,
          dateRange: day.dateString,
          details: day.occupancy?.tenantName || day.block?.reason || day.status,
        });
      }
    }
  }

  return {
    available: conflicts.length === 0,
    conflicts,
    gapDays: conflicts.length === 0 ? differenceInDays(endDate, startDate) : undefined,
  };
}

/**
 * Crea un bloqueo de disponibilidad
 */
export async function createBlock(
  block: Omit<AvailabilityBlock, 'id' | 'createdAt'>
): Promise<AvailabilityBlock> {
  // Verificar que no hay contratos en el período
  const existingContracts = await prisma.contract.findMany({
    where: {
      unitId: block.propertyId,
      OR: [
        {
          fechaInicio: { lte: block.endDate },
          fechaFin: { gte: block.startDate },
        },
      ],
      status: { in: ['activo', 'pendiente', 'reservado'] },
    },
  });

  if (existingContracts.length > 0) {
    throw new Error('No se puede bloquear: hay contratos activos en este período');
  }

  const created = await prisma.availabilityBlock.create({
    data: {
      propertyId: block.propertyId,
      startDate: block.startDate,
      endDate: block.endDate,
      reason: block.reason,
      notes: block.notes,
      createdBy: block.createdBy,
    },
  });

  return created as AvailabilityBlock;
}

/**
 * Elimina un bloqueo
 */
export async function removeBlock(blockId: string): Promise<void> {
  await prisma.availabilityBlock.delete({
    where: { id: blockId },
  });
}

/**
 * Configura precios por temporada
 */
export async function setPricingPeriod(
  period: Omit<PricingPeriod, 'id'>
): Promise<PricingPeriod> {
  // Eliminar períodos superpuestos
  await prisma.pricingPeriod.deleteMany({
    where: {
      propertyId: period.propertyId,
      OR: [
        {
          startDate: { lte: period.endDate },
          endDate: { gte: period.startDate },
        },
      ],
    },
  });

  const created = await prisma.pricingPeriod.create({
    data: period,
  });

  return created as PricingPeriod;
}

/**
 * Analiza huecos entre reservas
 */
export async function analyzeGaps(
  propertyId: string,
  minGapDays: number = 7
): Promise<GapAnalysis[]> {
  const contracts = await prisma.contract.findMany({
    where: {
      unitId: propertyId,
      fechaFin: { gte: new Date() },
      status: { in: ['activo', 'pendiente', 'reservado'] },
    },
    include: {
      tenant: { select: { nombre: true } },
    },
    orderBy: { fechaInicio: 'asc' },
  });

  const property = await prisma.unit.findUnique({
    where: { id: propertyId },
    select: { precioBase: true },
  });
  const monthlyPrice = property?.precioBase || 0;
  const dailyPrice = monthlyPrice / 30;

  const gaps: GapAnalysis[] = [];

  // Gap desde hoy hasta el primer contrato
  if (contracts.length > 0) {
    const firstContract = contracts[0];
    const daysUntilFirst = differenceInDays(firstContract.fechaInicio, new Date());
    
    if (daysUntilFirst >= minGapDays) {
      gaps.push({
        startDate: new Date(),
        endDate: firstContract.fechaInicio,
        gapDays: daysUntilFirst,
        afterContract: {
          id: firstContract.id,
          tenantName: firstContract.tenant.nombre,
          startDate: firstContract.fechaInicio,
        },
        recommendations: generateGapRecommendations(daysUntilFirst),
        potentialRevenue: Math.round(daysUntilFirst * dailyPrice),
      });
    }
  }

  // Gaps entre contratos
  for (let i = 0; i < contracts.length - 1; i++) {
    const current = contracts[i];
    const next = contracts[i + 1];
    
    const gapDays = differenceInDays(next.fechaInicio, current.fechaFin);
    
    if (gapDays >= minGapDays) {
      gaps.push({
        startDate: current.fechaFin,
        endDate: next.fechaInicio,
        gapDays,
        beforeContract: {
          id: current.id,
          tenantName: current.tenant.nombre,
          endDate: current.fechaFin,
        },
        afterContract: {
          id: next.id,
          tenantName: next.tenant.nombre,
          startDate: next.fechaInicio,
        },
        recommendations: generateGapRecommendations(gapDays),
        potentialRevenue: Math.round(gapDays * dailyPrice),
      });
    }
  }

  return gaps;
}

function generateGapRecommendations(gapDays: number): string[] {
  const recommendations: string[] = [];

  if (gapDays >= 30) {
    recommendations.push('Publicar como alquiler temporal de 1 mes');
    recommendations.push('Ofrecer descuento del 10-15% por reserva rápida');
  } else if (gapDays >= 14) {
    recommendations.push('Publicar en plataformas de vacacional (Airbnb, Booking)');
    recommendations.push('Ofrecer como estancia puente para nómadas digitales');
  } else if (gapDays >= 7) {
    recommendations.push('Mantener como buffer para limpieza y mantenimiento');
    recommendations.push('Ofrecer extensión al inquilino saliente');
  } else {
    recommendations.push('Reservar para limpieza profunda y preparación');
  }

  recommendations.push('Realizar mantenimiento preventivo durante el hueco');

  return recommendations;
}

/**
 * Sincroniza calendario con iCal (Airbnb, Booking, etc.)
 */
export async function syncWithICal(
  propertyId: string,
  icalUrl: string,
  direction: 'import' | 'export' = 'import'
): Promise<{ eventsProcessed: number }> {
  if (direction === 'import') {
    // TODO: Implementar importación de iCal
    // Parsear eventos del URL y crear bloqueos
    console.log(`[Calendar] Importing from ${icalUrl}`);
    return { eventsProcessed: 0 };
  } else {
    // TODO: Implementar exportación a iCal
    // Generar feed iCal con ocupación
    console.log(`[Calendar] Exporting to iCal format`);
    return { eventsProcessed: 0 };
  }
}

/**
 * Genera feed iCal del inmueble
 */
export async function generateICalFeed(propertyId: string): Promise<string> {
  const calendar = await getAvailabilityCalendar(propertyId, new Date(), 12);
  
  let ical = 'BEGIN:VCALENDAR\n';
  ical += 'VERSION:2.0\n';
  ical += 'PRODID:-//Inmova//Availability Calendar//ES\n';
  ical += 'METHOD:PUBLISH\n';

  for (const month of calendar) {
    const occupiedPeriods = new Map<string, { start: Date; end: Date; summary: string }>();

    for (const day of month.days) {
      if (day.occupancy && !occupiedPeriods.has(day.occupancy.contractId)) {
        occupiedPeriods.set(day.occupancy.contractId, {
          start: day.occupancy.startDate,
          end: day.occupancy.endDate,
          summary: `Ocupado - ${day.occupancy.tenantName}`,
        });
      }
    }

    for (const [id, period] of occupiedPeriods) {
      ical += 'BEGIN:VEVENT\n';
      ical += `UID:${id}@inmova.app\n`;
      ical += `DTSTART:${format(period.start, 'yyyyMMdd')}\n`;
      ical += `DTEND:${format(period.end, 'yyyyMMdd')}\n`;
      ical += `SUMMARY:${period.summary}\n`;
      ical += 'END:VEVENT\n';
    }
  }

  ical += 'END:VCALENDAR';

  return ical;
}

export default {
  getAvailabilityCalendar,
  checkAvailability,
  createBlock,
  removeBlock,
  setPricingPeriod,
  analyzeGaps,
  syncWithICal,
  generateICalFeed,
};
