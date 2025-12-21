/**
 * Servicio de Integración con Canales STR (Short-Term Rental)
 * 
 * Este servicio proporciona una interfaz unificada para conectar
 * y sincronizar con plataformas externas como Airbnb, Booking.com, etc.
 * 
 * MODO DEMO: Actualmente simula las integraciones. Para activar
 * integraciones reales, se requieren credenciales API de cada plataforma.
 */

import { prisma } from './db';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import logger, { logError } from '@/lib/logger';

// Definiciones de tipos inline (reemplaza imports de @prisma/client)
type ChannelType = 'AIRBNB' | 'BOOKING' | 'VRBO' | 'HOMEAWAY' | 'WEB_PROPIA' | 'OTROS';
type BookingStatus = 'PENDIENTE' | 'CONFIRMADA' | 'CHECK_IN' | 'CHECK_OUT' | 'CANCELADA' | 'NO_SHOW';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface ChannelCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  propertyId?: string;
  listingId?: string;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  errors: string[];
  warnings: string[];
  timestamp: Date;
}

export interface ExternalBooking {
  externalId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: string;
  channel: ChannelType;
}

export interface PriceUpdate {
  date: Date;
  price: number;
  minNights?: number;
  available?: boolean;
}

export interface ChannelConfig {
  name: string;
  apiUrl: string;
  authUrl?: string;
  webhookUrl?: string;
  supportedFeatures: {
    calendar: boolean;
    pricing: boolean;
    bookings: boolean;
    messaging: boolean;
    reviews: boolean;
  };
}

// ============================================
// CONFIGURACIÓN DE CANALES
// ============================================

const CHANNEL_CONFIGS: Record<ChannelType, ChannelConfig> = {
  AIRBNB: {
    name: 'Airbnb',
    apiUrl: 'https://api.airbnb.com',
    authUrl: 'https://www.airbnb.com/oauth/authorize',
    webhookUrl: '/api/webhooks/airbnb',
    supportedFeatures: {
      calendar: true,
      pricing: true,
      bookings: true,
      messaging: true,
      reviews: true,
    },
  },
  BOOKING: {
    name: 'Booking.com',
    apiUrl: 'https://distribution-xml.booking.com',
    authUrl: 'https://connect.booking.com/oauth2/authorize',
    webhookUrl: '/api/webhooks/booking',
    supportedFeatures: {
      calendar: true,
      pricing: true,
      bookings: true,
      messaging: false,
      reviews: true,
    },
  },
  VRBO: {
    name: 'VRBO',
    apiUrl: 'https://www.vrbo.com/api',
    authUrl: 'https://www.vrbo.com/oauth/authorize',
    webhookUrl: '/api/webhooks/vrbo',
    supportedFeatures: {
      calendar: true,
      pricing: true,
      bookings: true,
      messaging: true,
      reviews: true,
    },
  },
  HOMEAWAY: {
    name: 'HomeAway',
    apiUrl: 'https://ws.homeaway.com',
    authUrl: 'https://ws.homeaway.com/oauth/authorize',
    webhookUrl: '/api/webhooks/homeaway',
    supportedFeatures: {
      calendar: true,
      pricing: true,
      bookings: true,
      messaging: false,
      reviews: true,
    },
  },
  WEB_PROPIA: {
    name: 'Web Propia',
    apiUrl: '',
    supportedFeatures: {
      calendar: true,
      pricing: true,
      bookings: true,
      messaging: true,
      reviews: true,
    },
  },
  EXPEDIA: {
    name: 'Expedia',
    apiUrl: 'https://services.expediapartnercentral.com',
    authUrl: 'https://www.expediapartnercentral.com/oauth/authorize',
    webhookUrl: '/api/webhooks/expedia',
    supportedFeatures: {
      calendar: true,
      pricing: true,
      bookings: true,
      messaging: false,
      reviews: true,
    },
  },
  TRIPADVISOR: {
    name: 'TripAdvisor',
    apiUrl: 'https://api.tripadvisor.com',
    authUrl: 'https://www.tripadvisor.com/oauth/authorize',
    webhookUrl: '/api/webhooks/tripadvisor',
    supportedFeatures: {
      calendar: false,
      pricing: false,
      bookings: false,
      messaging: false,
      reviews: true,
    },
  },
  OTROS: {
    name: 'Otros',
    apiUrl: '',
    supportedFeatures: {
      calendar: true,
      pricing: true,
      bookings: true,
      messaging: false,
      reviews: false,
    },
  },
};

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Conecta un listing con un canal externo
 */
export async function connectChannel(
  companyId: string,
  listingId: string,
  channel: ChannelType,
  credentials: ChannelCredentials,
): Promise<SyncResult> {
  try {
    logger.info(`[STR] Conectando ${channel} para listing ${listingId}`);

    // En modo DEMO, validamos solo que exista el listing
    const listing = await prisma.sTRListing.findUnique({
      where: { id: listingId },
      include: { unit: { include: { building: true } } },
    });

    if (!listing || listing.companyId !== companyId) {
      throw new Error('Listing no encontrado o sin permisos');
    }

    // Verificar si ya existe una conexión
    const existingSync = await prisma.sTRChannelSync.findUnique({
      where: { listingId_canal: { listingId, canal: channel } },
    });

    if (existingSync) {
      // Actualizar credenciales
      await prisma.sTRChannelSync.update({
        where: { id: existingSync.id },
        data: {
          activo: true,
          apiKey: credentials.apiKey,
          externalId: credentials.listingId || credentials.propertyId,
          estadoSync: 'conectado',
          ultimaSync: new Date(),
        },
      });
    } else {
      // Crear nueva conexión
      await prisma.sTRChannelSync.create({
        data: {
          companyId,
          listingId,
          canal: channel,
          activo: true,
          apiKey: credentials.apiKey,
          externalId: credentials.listingId || credentials.propertyId,
          sincronizarPrecio: true,
          sincronizarCalendario: true,
          sincronizarReservas: true,
          estadoSync: 'conectado',
          ultimaSync: new Date(),
        },
      });
    }

    // En modo DEMO: simular sincronización inicial
    await simulateInitialSync(listingId, channel);

    logger.info(`[STR] Canal ${channel} conectado exitosamente`);

    return {
      success: true,
      syncedItems: 30, // Demo: 30 días de calendario
      errors: [],
      warnings: [],
      timestamp: new Date(),
    };
  } catch (error) {
    logError(error as Error, {
      context: 'connectChannel',
      channel,
      listingId,
    });
    return {
      success: false,
      syncedItems: 0,
      errors: [(error as Error).message],
      warnings: [],
      timestamp: new Date(),
    };
  }
}

/**
 * Desconecta un canal
 */
export async function disconnectChannel(
  listingId: string,
  channel: ChannelType,
): Promise<boolean> {
  try {
    await prisma.sTRChannelSync.update({
      where: { listingId_canal: { listingId, canal: channel } },
      data: {
        activo: false,
        estadoSync: 'desconectado',
      },
    });
    return true;
  } catch (error) {
    logError(error as Error, { context: 'disconnectChannel', channel });
    return false;
  }
}

/**
 * Sincroniza el calendario de un listing con un canal externo
 */
export async function syncCalendar(
  listingId: string,
  channel: ChannelType,
  startDate: Date,
  endDate: Date,
): Promise<SyncResult> {
  try {
    const channelSync = await prisma.sTRChannelSync.findUnique({
      where: { listingId_canal: { listingId, canal: channel } },
    });

    if (!channelSync || !channelSync.activo) {
      throw new Error('Canal no conectado o inactivo');
    }

    // En modo DEMO: generar calendario simulado
    const days: Date[] = [];
    let currentDate = startOfDay(startDate);
    const end = startOfDay(endDate);

    while (currentDate <= end) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    // Crear/actualizar días en el calendario
    const listing = await prisma.sTRListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new Error('Listing no encontrado');
    }

    for (const date of days) {
      await prisma.sTRCalendar.upsert({
        where: {
          listingId_fecha: {
            listingId,
            fecha: date,
          },
        },
        create: {
          listingId,
          fecha: date,
          disponible: true,
          precioPorNoche: listing.precioPorNoche,
          minimoNoches: 1,
          sincronizado: true,
          ultimaSync: new Date(),
        },
        update: {
          sincronizado: true,
          ultimaSync: new Date(),
        },
      });
    }

    // Actualizar estado de sincronización
    await prisma.sTRChannelSync.update({
      where: { id: channelSync.id },
      data: {
        ultimaSync: new Date(),
        proximaSync: addDays(new Date(), 1),
        estadoSync: 'sincronizado',
        erroresSync: 0,
      },
    });

    return {
      success: true,
      syncedItems: days.length,
      errors: [],
      warnings: [],
      timestamp: new Date(),
    };
  } catch (error) {
    logError(error as Error, { context: 'syncCalendar', channel });
    return {
      success: false,
      syncedItems: 0,
      errors: [(error as Error).message],
      warnings: [],
      timestamp: new Date(),
    };
  }
}

/**
 * Importa reservas desde un canal externo
 */
export async function importBookings(
  companyId: string,
  listingId: string,
  channel: ChannelType,
): Promise<SyncResult> {
  try {
    const channelSync = await prisma.sTRChannelSync.findUnique({
      where: { listingId_canal: { listingId, canal: channel } },
    });

    if (!channelSync || !channelSync.activo) {
      throw new Error('Canal no conectado o inactivo');
    }

    // En modo DEMO: generar reservas simuladas
    const demoBookings = generateDemoBookings(listingId, channel);

    let imported = 0;
    for (const booking of demoBookings) {
      try {
        await createBookingFromExternal(companyId, listingId, booking);
        imported++;
      } catch (error) {
        logger.error(`Error importando reserva ${booking.externalId}`, error);
      }
    }

    return {
      success: true,
      syncedItems: imported,
      errors: [],
      warnings: imported < demoBookings.length ? ['Algunas reservas no se importaron'] : [],
      timestamp: new Date(),
    };
  } catch (error) {
    logError(error as Error, { context: 'importBookings', channel });
    return {
      success: false,
      syncedItems: 0,
      errors: [(error as Error).message],
      warnings: [],
      timestamp: new Date(),
    };
  }
}

/**
 * Actualiza precios en un canal externo
 */
export async function updateChannelPrices(
  listingId: string,
  channel: ChannelType,
  priceUpdates: PriceUpdate[],
): Promise<SyncResult> {
  try {
    const channelSync = await prisma.sTRChannelSync.findUnique({
      where: { listingId_canal: { listingId, canal: channel } },
    });

    if (!channelSync || !channelSync.activo || !channelSync.sincronizarPrecio) {
      throw new Error('Canal no configurado para sincronizar precios');
    }

    // En modo DEMO: actualizar precios en el calendario local
    for (const update of priceUpdates) {
      await prisma.sTRCalendar.upsert({
        where: {
          listingId_fecha: {
            listingId,
            fecha: update.date,
          },
        },
        create: {
          listingId,
          fecha: update.date,
          disponible: update.available ?? true,
          precioPorNoche: update.price,
          minimoNoches: update.minNights ?? 1,
          sincronizado: true,
          ultimaSync: new Date(),
        },
        update: {
          precioPorNoche: update.price,
          disponible: update.available ?? undefined,
          minimoNoches: update.minNights ?? undefined,
          sincronizado: true,
          ultimaSync: new Date(),
        },
      });
    }

    return {
      success: true,
      syncedItems: priceUpdates.length,
      errors: [],
      warnings: [],
      timestamp: new Date(),
    };
  } catch (error) {
    logError(error as Error, { context: 'updateChannelPrices', channel });
    return {
      success: false,
      syncedItems: 0,
      errors: [(error as Error).message],
      warnings: [],
      timestamp: new Date(),
    };
  }
}

/**
 * Obtiene el estado de sincronización de un canal
 */
export async function getChannelStatus(
  listingId: string,
  channel: ChannelType,
) {
  try {
    const channelSync = await prisma.sTRChannelSync.findUnique({
      where: { listingId_canal: { listingId, canal: channel } },
      include: {
        listing: {
          select: {
            titulo: true,
            activo: true,
          },
        },
      },
    });

    if (!channelSync) {
      return {
        connected: false,
        status: 'no_conectado',
        lastSync: null,
        nextSync: null,
        errors: 0,
      };
    }

    return {
      connected: channelSync.activo,
      status: channelSync.estadoSync,
      lastSync: channelSync.ultimaSync,
      nextSync: channelSync.proximaSync,
      errors: channelSync.erroresSync,
      externalId: channelSync.externalId,
      syncSettings: {
        calendar: channelSync.sincronizarCalendario,
        prices: channelSync.sincronizarPrecio,
        bookings: channelSync.sincronizarReservas,
      },
    };
  } catch (error) {
    logError(error as Error, { context: 'getChannelStatus', channel });
    return null;
  }
}

/**
 * Obtiene la configuración de un canal
 */
export function getChannelConfig(channel: ChannelType): ChannelConfig {
  return CHANNEL_CONFIGS[channel];
}

/**
 * Obtiene todos los canales soportados
 */
export function getSupportedChannels(): ChannelType[] {
  return Object.keys(CHANNEL_CONFIGS) as ChannelType[];
}

// ============================================
// FUNCIONES AUXILIARES (MODO DEMO)
// ============================================

/**
 * Simula sincronización inicial al conectar un canal
 */
async function simulateInitialSync(
  listingId: string,
  channel: ChannelType,
): Promise<void> {
  // Crear 30 días de calendario
  const startDate = startOfDay(new Date());
  const listing = await prisma.sTRListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) return;

  for (let i = 0; i < 30; i++) {
    const date = addDays(startDate, i);
    await prisma.sTRCalendar.upsert({
      where: {
        listingId_fecha: {
          listingId,
          fecha: date,
        },
      },
      create: {
        listingId,
        fecha: date,
        disponible: true,
        precioPorNoche: listing.precioPorNoche,
        minimoNoches: 1,
        sincronizado: true,
        ultimaSync: new Date(),
      },
      update: {
        sincronizado: true,
        ultimaSync: new Date(),
      },
    });
  }
}

/**
 * Genera reservas demo para simular importación
 */
function generateDemoBookings(
  listingId: string,
  channel: ChannelType,
): ExternalBooking[] {
  const bookings: ExternalBooking[] = [];
  const today = new Date();

  // Generar 2-3 reservas demo futuras
  const numBookings = Math.floor(Math.random() * 2) + 2;

  for (let i = 0; i < numBookings; i++) {
    const checkIn = addDays(today, 7 + i * 7);
    const checkOut = addDays(checkIn, 3 + Math.floor(Math.random() * 4));
    const guests = Math.floor(Math.random() * 4) + 1;

    bookings.push({
      externalId: `${channel}_${Date.now()}_${i}`,
      guestName: `Demo Guest ${i + 1}`,
      guestEmail: `guest${i + 1}@example.com`,
      guestPhone: '+34 600 000 000',
      checkIn,
      checkOut,
      guests,
      totalPrice: 100 + Math.random() * 200,
      status: 'confirmed',
      channel,
    });
  }

  return bookings;
}

/**
 * Crea una reserva local desde datos externos
 */
async function createBookingFromExternal(
  companyId: string,
  listingId: string,
  externalBooking: ExternalBooking,
): Promise<void> {
  const { checkIn, checkOut, totalPrice, channel } = externalBooking;

  // Calcular número de noches
  const diffTime = checkOut.getTime() - checkIn.getTime();
  const numNoches = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Obtener info del listing
  const listing = await prisma.sTRListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) return;

  // Calcular tarifas
  const tarifaNocturna = totalPrice / numNoches;
  const tarifaLimpieza = listing.tarifaLimpieza;
  const comisionCanal = totalPrice * (listing.comisionPlataforma / 100);
  const ingresoNeto = totalPrice - comisionCanal;

  // Verificar que no exista ya
  const existing = await prisma.sTRBooking.findFirst({
    where: {
      listingId,
      canal: channel,
      reservaExternaId: externalBooking.externalId,
    },
  });

  if (existing) {
    return; // Ya existe
  }

  // Crear reserva
  await prisma.sTRBooking.create({
    data: {
      companyId,
      listingId,
      canal: channel,
      reservaExternaId: externalBooking.externalId,
      guestNombre: externalBooking.guestName,
      guestEmail: externalBooking.guestEmail,
      guestTelefono: externalBooking.guestPhone,
      numHuespedes: externalBooking.guests,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numNoches,
      precioTotal: totalPrice,
      tarifaNocturna,
      tarifaLimpieza,
      comisionCanal,
      ingresoNeto,
      estado: 'CONFIRMADA',
      pagado: true,
      estadoPago: 'pagado',
    },
  });

  // Bloquear fechas en el calendario
  let currentDate = startOfDay(checkIn);
  const endDate = startOfDay(checkOut);

  while (currentDate < endDate) {
    await prisma.sTRCalendar.upsert({
      where: {
        listingId_fecha: {
          listingId,
          fecha: currentDate,
        },
      },
      create: {
        listingId,
        fecha: currentDate,
        disponible: false,
        precioPorNoche: tarifaNocturna,
        minimoNoches: 1,
      },
      update: {
        disponible: false,
      },
    });

    currentDate = addDays(currentDate, 1);
  }

  // Actualizar estadísticas del listing
  await prisma.sTRListing.update({
    where: { id: listingId },
    data: {
      totalReservas: {
        increment: 1,
      },
    },
  });
}

/**
 * Verifica si las credenciales de un canal están configuradas
 */
export function isChannelConfigured(channel: ChannelType): boolean {
  // En modo DEMO, todos los canales están "configurados"
  // En producción, esto verificaría variables de entorno específicas
  const envVars: Record<ChannelType, string[]> = {
    AIRBNB: ['AIRBNB_CLIENT_ID', 'AIRBNB_CLIENT_SECRET'],
    BOOKING: ['BOOKING_API_KEY', 'BOOKING_HOTEL_ID'],
    VRBO: ['VRBO_API_KEY'],
    HOMEAWAY: ['HOMEAWAY_API_KEY'],
    WEB_PROPIA: [],
    EXPEDIA: ['EXPEDIA_API_KEY'],
    TRIPADVISOR: ['TRIPADVISOR_API_KEY'],
    OTROS: [],
  };

  const requiredVars = envVars[channel];
  if (requiredVars.length === 0) return true;

  // En DEMO mode, simulamos que están configurados
  return false; // Cambiar a true para simular que sí están configurados
}

export default {
  connectChannel,
  disconnectChannel,
  syncCalendar,
  importBookings,
  updateChannelPrices,
  getChannelStatus,
  getChannelConfig,
  getSupportedChannels,
  isChannelConfigured,
};
