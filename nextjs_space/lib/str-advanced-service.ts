/**
 * STR Advanced Service - Fase 1: Fundamentos STR Avanzados
 * 
 * Este servicio proporciona la lógica de negocio completa para:
 * 1. Channel Manager (gestión unificada de canales)
 * 2. Revenue Management (precios dinámicos)
 * 3. Housekeeping (gestión de limpieza)
 * 4. Guest Experience (experiencia del huésped)
 * 5. Cumplimiento Legal (regulación STR)
 */

import { prisma } from './db';
import { 
  STRPricingStrategy, 
  STRSeasonType, 
  STRCleaningStatus,
  STRChannelStatus 
} from '@prisma/client';
import { 
  addDays, 
  differenceInDays, 
  startOfDay, 
  endOfDay,
  format,
  parseISO,
  isBefore,
  isAfter,
  isWithinInterval
} from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ChannelSyncConfig {
  listingId: string;
  channel: string;
  channelListingId: string;
  syncCalendar: boolean;
  syncPricing: boolean;
  syncAvailability: boolean;
  apiKey?: string;
  webhookUrl?: string;
}

export interface iCalFeedData {
  url: string;
  events: Array<{
    summary: string;
    start: Date;
    end: Date;
    uid: string;
  }>;
}

export interface DynamicPricingParams {
  basePrice: number;
  date: Date;
  occupancyRate: number;
  daysUntilCheckIn: number;
  minimumStay: number;
  seasonType?: STRSeasonType;
}

export interface PricingRuleResult {
  finalPrice: number;
  appliedRules: Array<{
    ruleName: string;
    adjustment: number;
    reason: string;
  }>;
}

export interface CleaningChecklistItem {
  area: string;
  tasks: string[];
  estimatedTime: number; // minutos
}

export interface GuestGuideSection {
  title: string;
  content: string;
  icon?: string;
  order: number;
}

// ============================================================================
// 1. CHANNEL MANAGER - BASE UNIFICADA
// ============================================================================

/**
 * Sincroniza un calendario iCal desde un canal externo
 */
export async function syncICalFeed(
  channelSyncId: string,
  iCalUrl: string
): Promise<{ success: boolean; eventsProcessed: number; errors?: string[] }> {
  try {
    // En producción, aquí se haría fetch del iCal real
    // Para demo, simulamos la respuesta
    const simulatedEvents = [
      {
        summary: 'Reserva Airbnb',
        start: addDays(new Date(), 5),
        end: addDays(new Date(), 8),
        uid: 'airbnb-12345'
      },
      {
        summary: 'Reserva Booking.com',
        start: addDays(new Date(), 10),
        end: addDays(new Date(), 15),
        uid: 'booking-67890'
      }
    ];

    const channelSync = await prisma.sTRChannelSync.findUnique({
      where: { id: channelSyncId },
      include: { listing: true }
    });

    if (!channelSync) {
      return { success: false, eventsProcessed: 0, errors: ['Channel sync no encontrado'] };
    }

    // Crear bookings desde eventos iCal
    let eventsProcessed = 0;
    const errors: string[] = [];

    for (const event of simulatedEvents) {
      try {
        // Verificar si ya existe este booking
        const existing = await prisma.sTRBooking.findFirst({
          where: {
            listingId: channelSync.listingId,
            checkIn: startOfDay(event.start),
            checkOut: startOfDay(event.end)
          }
        });

        if (!existing) {
          await prisma.sTRBooking.create({
            data: {
              listingId: channelSync.listingId,
              guestName: event.summary,
              guestEmail: `guest-${event.uid}@imported.com`,
              checkIn: startOfDay(event.start),
              checkOut: startOfDay(event.end),
              numGuests: 2,
              totalPrice: 0,
              estado: 'confirmada',
              channel: channelSync.channel,
              externalBookingId: event.uid,
              companyId: channelSync.listing.companyId
            }
          });
          eventsProcessed++;
        }
      } catch (error) {
        errors.push(`Error procesando evento ${event.uid}: ${error}`);
      }
    }

    // Actualizar timestamp de última sincronización
    await prisma.sTRChannelSync.update({
      where: { id: channelSyncId },
      data: { ultimaSincronizacion: new Date() }
    });

    return { 
      success: true, 
      eventsProcessed, 
      errors: errors.length > 0 ? errors : undefined 
    };
  } catch (error) {
    return { 
      success: false, 
      eventsProcessed: 0, 
      errors: [`Error general: ${error}`] 
    };
  }
}

/**
 * Exporta calendario en formato iCal para que otros canales lo importen
 */
export async function generateICalFeed(
  listingId: string
): Promise<string> {
  const bookings = await prisma.sTRBooking.findMany({
    where: {
      listingId,
      estado: { in: ['confirmada', 'en_progreso'] }
    },
    orderBy: { checkIn: 'asc' }
  });

  // Generar formato iCal
  let icalContent = 'BEGIN:VCALENDAR\r\n';
  icalContent += 'VERSION:2.0\r\n';
  icalContent += 'PRODID:-//INMOVA//STR Calendar//ES\r\n';
  icalContent += 'CALSCALE:GREGORIAN\r\n';
  icalContent += 'METHOD:PUBLISH\r\n';
  icalContent += 'X-WR-CALNAME:INMOVA STR Bookings\r\n';
  icalContent += 'X-WR-TIMEZONE:Europe/Madrid\r\n';

  for (const booking of bookings) {
    icalContent += 'BEGIN:VEVENT\r\n';
    icalContent += `UID:${booking.id}@inmova.app\r\n`;
    icalContent += `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}\r\n`;
    icalContent += `DTSTART:${format(booking.checkIn, "yyyyMMdd")}\r\n`;
    icalContent += `DTEND:${format(booking.checkOut, "yyyyMMdd")}\r\n`;
    icalContent += `SUMMARY:Reserva - ${booking.guestName}\r\n`;
    icalContent += `DESCRIPTION:${booking.channel} - ${booking.numGuests} huéspedes\r\n`;
    icalContent += 'STATUS:CONFIRMED\r\n';
    icalContent += 'TRANSP:OPAQUE\r\n';
    icalContent += 'END:VEVENT\r\n';
  }

  icalContent += 'END:VCALENDAR\r\n';
  return icalContent;
}


/**
 * Sincroniza disponibilidad y precios hacia múltiples canales
 */
export async function syncToChannels(
  listingId: string,
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; channelsSynced: string[]; errors?: string[] }> {
  const channels = await prisma.sTRChannelSync.findMany({
    where: { 
      listingId,
      activo: true,
      estado: 'conectado'
    }
  });

  const channelsSynced: string[] = [];
  const errors: string[] = [];

  for (const channel of channels) {
    try {
      // En producción, aquí se harían llamadas reales a APIs de canales
      // Airbnb API, Booking.com API, etc.
      
      // Simulación de sincronización exitosa
      await prisma.sTRChannelSync.update({
        where: { id: channel.id },
        data: { ultimaSincronizacion: new Date() }
      });
      
      channelsSynced.push(channel.channel);
    } catch (error) {
      errors.push(`Error sincronizando ${channel.channel}: ${error}`);
    }
  }

  return {
    success: errors.length === 0,
    channelsSynced,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Obtiene dashboard de disponibilidad multi-canal
 */
export async function getAvailabilityDashboard(
  companyId: string,
  month: Date
) {
  const startDate = startOfDay(new Date(month.getFullYear(), month.getMonth(), 1));
  const endDate = endOfDay(new Date(month.getFullYear(), month.getMonth() + 1, 0));

  const listings = await prisma.sTRListing.findMany({
    where: { companyId },
    include: {
      bookings: {
        where: {
          OR: [
            {
              checkIn: { gte: startDate, lte: endDate }
            },
            {
              checkOut: { gte: startDate, lte: endDate }
            },
            {
              AND: [
                { checkIn: { lte: startDate } },
                { checkOut: { gte: endDate } }
              ]
            }
          ],
          estado: { in: ['confirmada', 'en_progreso'] }
        }
      },
      channels: {
        where: { activo: true }
      }
    }
  });

  const daysInMonth = differenceInDays(endDate, startDate) + 1;
  
  return listings.map(listing => {
    const occupiedDays = listing.bookings.reduce((total, booking) => {
      const bookingStart = startOfDay(booking.checkIn) < startDate ? startDate : startOfDay(booking.checkIn);
      const bookingEnd = endOfDay(booking.checkOut) > endDate ? endDate : endOfDay(booking.checkOut);
      return total + differenceInDays(bookingEnd, bookingStart);
    }, 0);

    return {
      listingId: listing.id,
      title: listing.titulo,
      occupancyRate: (occupiedDays / daysInMonth) * 100,
      bookedDays: occupiedDays,
      availableDays: daysInMonth - occupiedDays,
      totalRevenue: listing.bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      activeChannels: listing.channels.length
    };
  });
}

// ============================================================================
// 2. REVENUE MANAGEMENT - BÁSICO
// ============================================================================

/**
 * Calcula precio dinámico basado en múltiples factores
 */
export function calculateDynamicPrice(
  params: DynamicPricingParams
): PricingRuleResult {
  let finalPrice = params.basePrice;
  const appliedRules: Array<{ ruleName: string; adjustment: number; reason: string }> = [];

  // 1. Ajuste por ocupación
  if (params.occupancyRate > 80) {
    const adjustment = params.basePrice * 0.2; // +20%
    finalPrice += adjustment;
    appliedRules.push({
      ruleName: 'Alta Ocupación',
      adjustment,
      reason: 'Ocupación superior al 80%'
    });
  } else if (params.occupancyRate < 30) {
    const adjustment = params.basePrice * -0.15; // -15%
    finalPrice += adjustment;
    appliedRules.push({
      ruleName: 'Baja Ocupación',
      adjustment,
      reason: 'Ocupación inferior al 30%'
    });
  }

  // 2. Ajuste por antelación (last-minute)
  if (params.daysUntilCheckIn <= 3) {
    const adjustment = params.basePrice * -0.10; // -10% last minute
    finalPrice += adjustment;
    appliedRules.push({
      ruleName: 'Last Minute',
      adjustment,
      reason: `Reserva con ${params.daysUntilCheckIn} días de antelación`
    });
  } else if (params.daysUntilCheckIn >= 30) {
    const adjustment = params.basePrice * 0.05; // +5% early bird
    finalPrice += adjustment;
    appliedRules.push({
      ruleName: 'Early Bird',
      adjustment,
      reason: 'Reserva anticipada (30+ días)'
    });
  }

  // 3. Ajuste por temporada
  if (params.seasonType) {
    let seasonalAdjustment = 0;
    switch (params.seasonType) {
      case 'alta':
        seasonalAdjustment = params.basePrice * 0.30; // +30%
        appliedRules.push({
          ruleName: 'Temporada Alta',
          adjustment: seasonalAdjustment,
          reason: 'Período de alta demanda'
        });
        break;
      case 'media':
        seasonalAdjustment = params.basePrice * 0.10; // +10%
        appliedRules.push({
          ruleName: 'Temporada Media',
          adjustment: seasonalAdjustment,
          reason: 'Período de demanda moderada'
        });
        break;
      case 'baja':
        seasonalAdjustment = params.basePrice * -0.20; // -20%
        appliedRules.push({
          ruleName: 'Temporada Baja',
          adjustment: seasonalAdjustment,
          reason: 'Período de baja demanda'
        });
        break;
    }
    finalPrice += seasonalAdjustment;
  }

  // 4. Ajuste por estancia mínima
  if (params.minimumStay >= 7) {
    const adjustment = params.basePrice * -0.10; // -10% para estancias largas
    finalPrice += adjustment;
    appliedRules.push({
      ruleName: 'Estancia Larga',
      adjustment,
      reason: `Descuento por ${params.minimumStay} noches mínimas`
    });
  }

  // Asegurar precio mínimo (50% del precio base)
  const minimumPrice = params.basePrice * 0.5;
  if (finalPrice < minimumPrice) {
    finalPrice = minimumPrice;
    appliedRules.push({
      ruleName: 'Precio Mínimo',
      adjustment: minimumPrice - finalPrice,
      reason: 'Aplicación de precio mínimo configurado'
    });
  }

  return {
    finalPrice: Math.round(finalPrice * 100) / 100,
    appliedRules
  };
}


/**
 * Aplica reglas de pricing a un rango de fechas
 */
export async function applyPricingStrategy(
  listingId: string,
  strategyId: string,
  startDate: Date,
  endDate: Date
) {
  const listing = await prisma.sTRListing.findUnique({
    where: { id: listingId }
  });

  if (!listing) {
    throw new Error('Listing no encontrado');
  }

  const strategy = await prisma.sTRPricingRule.findUnique({
    where: { id: strategyId }
  });

  if (!strategy) {
    throw new Error('Estrategia de pricing no encontrada');
  }

  const rules: any[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Calcular ocupación para esta fecha
    const bookingsCount = await prisma.sTRBooking.count({
      where: {
        listingId,
        checkIn: { lte: currentDate },
        checkOut: { gte: currentDate },
        estado: { in: ['confirmada', 'en_progreso'] }
      }
    });

    const occupancyRate = bookingsCount > 0 ? 100 : 0;

    // Calcular precio dinámico
    const daysUntilCheckIn = differenceInDays(currentDate, new Date());
    const pricing = calculateDynamicPrice({
      basePrice: listing.precioNoche,
      date: currentDate,
      occupancyRate,
      daysUntilCheckIn,
      minimumStay: strategy.estanciaMinima || 1,
      seasonType: strategy.tipoTemporada as STRSeasonType
    });

    rules.push({
      date: currentDate,
      price: pricing.finalPrice,
      appliedRules: pricing.appliedRules
    });

    currentDate = addDays(currentDate, 1);
  }

  return rules;
}

/**
 * Genera reporte de revenue management
 */
export async function getRevenueReport(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const listings = await prisma.sTRListing.findMany({
    where: { companyId },
    include: {
      bookings: {
        where: {
          checkIn: { gte: startDate },
          checkOut: { lte: endDate },
          estado: { in: ['confirmada', 'completada'] }
        }
      }
    }
  });

  const totalRevenue = listings.reduce((sum, listing) => {
    return sum + listing.bookings.reduce((bookingSum, booking) => {
      return bookingSum + (booking.totalPrice || 0);
    }, 0);
  }, 0);

  const totalBookings = listings.reduce((sum, listing) => sum + listing.bookings.length, 0);

  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  const listingPerformance = listings.map(listing => {
    const revenue = listing.bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const bookings = listing.bookings.length;
    
    return {
      listingId: listing.id,
      title: listing.titulo,
      revenue,
      bookings,
      averageNightlyRate: bookings > 0 ? revenue / bookings : 0,
      occupancyRate: listing.tasaOcupacion
    };
  });

  return {
    period: {
      start: startDate,
      end: endDate
    },
    summary: {
      totalRevenue,
      totalBookings,
      averageBookingValue,
      activeListings: listings.length
    },
    listingPerformance
  };
}

// ============================================================================
// 3. HOUSEKEEPING - PWA RESPONSIVE
// ============================================================================

/**
 * Genera checklist de limpieza automática
 */
export function generateCleaningChecklist(
  propertyType: string,
  numBedrooms: number
): CleaningChecklistItem[] {
  const baseChecklist: CleaningChecklistItem[] = [
    {
      area: 'Entrada',
      tasks: [
        'Barrer y fregar suelo',
        'Limpiar espejo',
        'Vaciar papelera',
        'Revisar timbres y cerraduras'
      ],
      estimatedTime: 10
    },
    {
      area: 'Salón',
      tasks: [
        'Pasar aspiradora',
        'Limpiar mesas y superficies',
        'Sacudir cojines',
        'Limpiar ventanas',
        'Vaciar papeleras',
        'Revisar mandos a distancia'
      ],
      estimatedTime: 20
    },
    {
      area: 'Cocina',
      tasks: [
        'Limpiar electrodomésticos',
        'Fregar platos',
        'Limpiar horno y microondas',
        'Limpiar encimera',
        'Fregar suelo',
        'Vaciar basura',
        'Revisar inventario de menaje'
      ],
      estimatedTime: 30
    },
    {
      area: 'Baño',
      tasks: [
        'Limpiar inodoro',
        'Limpiar lavabo',
        'Limpiar ducha/bañera',
        'Limpiar espejo',
        'Fregar suelo',
        'Reponer toallas',
        'Reponer amenities'
      ],
      estimatedTime: 25
    }
  ];

  // Añadir habitaciones
  for (let i = 1; i <= numBedrooms; i++) {
    baseChecklist.push({
      area: `Habitación ${i}`,
      tasks: [
        'Cambiar ropa de cama',
        'Pasar aspiradora',
        'Limpiar superficies',
        'Vaciar papelera',
        'Revisar armarios',
        'Airear habitación'
      ],
      estimatedTime: 20
    });
  }

  return baseChecklist;
}

/**
 * Crea tarea de limpieza automática tras checkout
 */
export async function createCleaningTaskFromBooking(
  bookingId: string
) {
  const booking = await prisma.sTRBooking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        include: { unit: true }
      }
    }
  });

  if (!booking) {
    throw new Error('Booking no encontrado');
  }

  // Generar checklist
  const checklist = generateCleaningChecklist(
    'apartment',
    booking.listing.unit?.habitaciones || 2
  );

  const totalEstimatedTime = checklist.reduce((sum, item) => sum + item.estimatedTime, 0);

  // Crear tarea de limpieza
  const task = await prisma.sTRCleaningTask.create({
    data: {
      listingId: booking.listingId,
      bookingId: booking.id,
      scheduledDate: booking.checkOut,
      estado: 'pendiente',
      prioridad: 'alta',
      checklist: checklist as any,
      tiempoEstimado: totalEstimatedTime,
      companyId: booking.companyId
    }
  });

  return task;
}

/**
 * Obtiene tareas de limpieza pendientes
 */
export async function getCleaningSchedule(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const tasks = await prisma.sTRCleaningTask.findMany({
    where: {
      companyId,
      scheduledDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      listing: {
        include: { unit: true }
      },
      booking: true
    },
    orderBy: {
      scheduledDate: 'asc'
    }
  });

  return tasks.map(task => ({
    ...task,
    propertyAddress: task.listing.unit?.building?.direccion || 'N/A',
    estimatedDuration: task.tiempoEstimado,
    progress: task.progreso || 0
  }));
}

/**
 * Actualiza progreso de tarea de limpieza
 */
export async function updateCleaningProgress(
  taskId: string,
  completedItems: string[],
  photos?: string[]
) {
  const task = await prisma.sTRCleaningTask.findUnique({
    where: { id: taskId }
  });

  if (!task) {
    throw new Error('Tarea no encontrada');
  }

  const checklist = task.checklist as CleaningChecklistItem[];
  const totalItems = checklist.reduce((sum, area) => sum + area.tasks.length, 0);
  const progress = Math.round((completedItems.length / totalItems) * 100);

  const updateData: any = {
    progreso: progress,
    updatedAt: new Date()
  };

  if (progress === 100) {
    updateData.estado = 'completada';
    updateData.completedAt = new Date();
  } else if (progress > 0) {
    updateData.estado = 'en_progreso';
    if (!task.startedAt) {
      updateData.startedAt = new Date();
    }
  }

  if (photos && photos.length > 0) {
    updateData.fotosAntes = photos;
  }

  return prisma.sTRCleaningTask.update({
    where: { id: taskId },
    data: updateData
  });
}


// ============================================================================
// 4. GUEST EXPERIENCE - ESENCIAL
// ============================================================================

/**
 * Genera guidebook digital automático
 */
export async function generateGuestGuide(
  listingId: string,
  customSections?: GuestGuideSection[]
): Promise<string> {
  const listing = await prisma.sTRListing.findUnique({
    where: { id: listingId },
    include: {
      unit: {
        include: { building: true }
      }
    }
  });

  if (!listing) {
    throw new Error('Listing no encontrado');
  }

  const defaultSections: GuestGuideSection[] = [
    {
      title: 'Bienvenida',
      content: `¡Bienvenido a ${listing.titulo}! Esperamos que disfrutes de tu estancia.`,
      icon: '👋',
      order: 1
    },
    {
      title: 'Check-in / Check-out',
      content: `Check-in: ${listing.horaCheckIn || '15:00'}\nCheck-out: ${listing.horaCheckOut || '11:00'}\n\nInstrucciones de acceso se envían 24h antes de la llegada.`,
      icon: '🔑',
      order: 2
    },
    {
      title: 'WiFi',
      content: 'Red: [Nombre de la red]\nContraseña: [Contraseña WiFi]',
      icon: '📶',
      order: 3
    },
    {
      title: 'Electrodomésticos',
      content: 'Calefacción/AC: [Instrucciones]\nTV: [Instrucciones]\nLavadora: [Instrucciones]',
      icon: '🏠',
      order: 4
    },
    {
      title: 'Normas de la Casa',
      content: 'No fumar\nNo fiestas\nHorario de silencio: 22:00 - 08:00\nMáximo de huéspedes: ' + listing.capacidadMaxima,
      icon: '✅',
      order: 5
    },
    {
      title: 'Emergencias',
      content: 'Emergencias: 112\nPolicía: 091\nBomberos: 080\nContacto propietario: [Teléfono]',
      icon: '🚨',
      order: 6
    },
    {
      title: 'Recomendaciones Locales',
      content: 'Restaurantes, cafeterías, supermercados y atracciones cercanas.',
      icon: '🍽️',
      order: 7
    }
  ];

  const sections = customSections || defaultSections;
  sections.sort((a, b) => a.order - b.order);

  // Guardar en base de datos
  await prisma.sTRGuestGuide.upsert({
    where: { listingId },
    update: {
      secciones: sections as any,
      updatedAt: new Date()
    },
    create: {
      listingId,
      titulo: `Guía de ${listing.titulo}`,
      secciones: sections as any,
      companyId: listing.companyId
    }
  });

  // Generar HTML/Markdown
  let guideContent = `# Guía del Huésped - ${listing.titulo}\n\n`;
  
  for (const section of sections) {
    guideContent += `## ${section.icon || ''} ${section.title}\n\n`;
    guideContent += `${section.content}\n\n`;
    guideContent += '---\n\n';
  }

  return guideContent;
}

/**
 * Envía solicitud automática de reseña
 */
export async function sendReviewRequest(
  bookingId: string,
  daysAfterCheckout: number = 2
) {
  const booking = await prisma.sTRBooking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true
    }
  });

  if (!booking) {
    throw new Error('Booking no encontrado');
  }

  const daysSinceCheckout = differenceInDays(new Date(), booking.checkOut);

  if (daysSinceCheckout < daysAfterCheckout) {
    return { sent: false, reason: 'Demasiado pronto para solicitar reseña' };
  }

  // En producción, aquí se enviaría email real
  // Por ahora, solo registramos la solicitud
  
  const reviewLink = `https://inmova.app/reviews/submit/${booking.id}`;
  
  return {
    sent: true,
    recipient: booking.guestEmail,
    reviewLink,
    message: `Hola ${booking.guestName}, ¿Qué tal tu estancia en ${booking.listing.titulo}? Nos encantaría conocer tu opinión.`
  };
}

/**
 * Registra incidencia/issue reportado por huésped
 */
export async function createGuestIssue(
  bookingId: string,
  category: string,
  description: string,
  urgency: 'baja' | 'media' | 'alta' | 'urgente'
) {
  const booking = await prisma.sTRBooking.findUnique({
    where: { id: bookingId },
    include: { listing: true }
  });

  if (!booking) {
    throw new Error('Booking no encontrado');
  }

  // Crear como incidencia de mantenimiento
  const issue = await prisma.maintenanceRequest.create({
    data: {
      unitId: booking.listing.unitId,
      buildingId: booking.listing.unit?.buildingId || '',
      titulo: `[STR] ${category}`,
      descripcion: `Reportado por huésped: ${booking.guestName}\n\n${description}`,
      prioridad: urgency,
      estado: 'pendiente',
      reportadoPor: booking.guestEmail,
      companyId: booking.companyId
    }
  });

  return issue;
}

// ============================================================================
// 5. CUMPLIMIENTO LEGAL
// ============================================================================

/**
 * Valida licencia turística
 */
export async function validateTouristLicense(
  listingId: string
): Promise<{ valid: boolean; daysUntilExpiration?: number; warnings: string[] }> {
  const listing = await prisma.sTRListing.findUnique({
    where: { id: listingId },
    include: {
      legalCompliance: true
    }
  });

  if (!listing) {
    return { valid: false, warnings: ['Listing no encontrado'] };
  }

  const warnings: string[] = [];

  if (!listing.legalCompliance || listing.legalCompliance.length === 0) {
    warnings.push('No hay datos de cumplimiento legal registrados');
    return { valid: false, warnings };
  }

  const compliance = listing.legalCompliance[0];

  // Validar licencia
  if (!compliance.numeroLicencia) {
    warnings.push('Número de licencia no registrado');
  }

  // Validar fecha de caducidad
  if (compliance.fechaCaducidad) {
    const daysUntilExpiration = differenceInDays(compliance.fechaCaducidad, new Date());
    
    if (daysUntilExpiration < 0) {
      warnings.push('¡LICENCIA CADUCADA!');
      return { valid: false, daysUntilExpiration, warnings };
    } else if (daysUntilExpiration <= 30) {
      warnings.push(`La licencia caduca en ${daysUntilExpiration} días`);
    }

    return {
      valid: warnings.length === 0,
      daysUntilExpiration,
      warnings
    };
  }

  warnings.push('Fecha de caducidad no registrada');
  return { valid: false, warnings };
}

/**
 * Genera hoja de registro de viajeros (Parte de Entrada)
 */
export async function generateTravelerRegistration(
  bookingId: string,
  travelers: Array<{
    nombre: string;
    apellidos: string;
    tipoDocumento: string;
    numeroDocumento: string;
    fechaNacimiento: Date;
    nacionalidad: string;
  }>
) {
  const booking = await prisma.sTRBooking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        include: {
          unit: {
            include: { building: true }
          },
          legalCompliance: true
        }
      }
    }
  });

  if (!booking) {
    throw new Error('Booking no encontrado');
  }

  // Generar documento de parte de entrada
  const registration = {
    bookingId: booking.id,
    propertyDetails: {
      name: booking.listing.titulo,
      address: booking.listing.unit?.building?.direccion || 'N/A',
      license: booking.listing.legalCompliance?.[0]?.numeroLicencia || 'N/A'
    },
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    travelers,
    generatedAt: new Date()
  };

  // En producción, esto se enviaría a las autoridades locales
  // Por ahora, lo guardamos en la base de datos
  
  await prisma.sTRLegalCompliance.updateMany({
    where: { listingId: booking.listingId },
    data: {
      ultimoParteEnviado: new Date(),
      partesPendientes: 0
    }
  });

  return registration;
}

/**
 * Calcula tasa turística
 */
export function calculateTouristTax(
  numGuests: number,
  numNights: number,
  city: string
): { totalTax: number; taxPerNight: number; breakdown: string } {
  // Tarifas ejemplo (varían según ciudad)
  const cityRates: Record<string, number> = {
    'Barcelona': 2.25,
    'Madrid': 3.50,
    'Valencia': 2.00,
    'Sevilla': 2.50,
    'Málaga': 1.50,
    'default': 1.00
  };

  const taxPerNight = cityRates[city] || cityRates['default'];
  const totalTax = numGuests * numNights * taxPerNight;

  return {
    totalTax,
    taxPerNight,
    breakdown: `${numGuests} huéspedes × ${numNights} noches × €${taxPerNight} = €${totalTax.toFixed(2)}`
  };
}

/**
 * Obtiene resumen de cumplimiento legal
 */
export async function getLegalComplianceSummary(companyId: string) {
  const listings = await prisma.sTRListing.findMany({
    where: { companyId },
    include: {
      legalCompliance: true
    }
  });

  const total = listings.length;
  let withLicense = 0;
  let expiringSoon = 0;
  let expired = 0;
  let pendingRegistrations = 0;

  for (const listing of listings) {
    if (listing.legalCompliance && listing.legalCompliance.length > 0) {
      const compliance = listing.legalCompliance[0];
      
      if (compliance.numeroLicencia) {
        withLicense++;
      }

      if (compliance.fechaCaducidad) {
        const daysUntil = differenceInDays(compliance.fechaCaducidad, new Date());
        if (daysUntil < 0) {
          expired++;
        } else if (daysUntil <= 30) {
          expiringSoon++;
        }
      }

      if (compliance.partesPendientes && compliance.partesPendientes > 0) {
        pendingRegistrations += compliance.partesPendientes;
      }
    }
  }

  return {
    total,
    withLicense,
    withoutLicense: total - withLicense,
    expiringSoon,
    expired,
    pendingRegistrations,
    complianceRate: total > 0 ? Math.round((withLicense / total) * 100) : 0
  };
}

