/**
 * Servicio de Marketplace
 * 
 * Marketplace de servicios adicionales para inquilinos/propietarios:
 * - Mudanzas
 * - Seguros (hogar, vida)
 * - Limpieza
 * - Reparaciones/Mantenimiento
 * - Internet/Utilities
 * - Muebles/Decoración
 * 
 * Comisión del 10-20% por transacción
 * 
 * @module MarketplaceService
 */

import { prisma } from './db';
import logger from './logger';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// ============================================================================
// TIPOS
// ============================================================================

export interface MarketplaceService {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  provider: ServiceProvider;
  price: number;
  currency: string;
  unit: string; // 'per_hour', 'flat', 'per_m2', etc
  commission: number; // % que se queda Inmova
  rating: number;
  reviewCount: number;
  availability: boolean;
  cities: string[];
  features: string[];
}

export type ServiceCategory =
  | 'moving'
  | 'insurance'
  | 'cleaning'
  | 'maintenance'
  | 'utilities'
  | 'furniture'
  | 'legal';

export interface ServiceProvider {
  id: string;
  name: string;
  logo?: string;
  verified: boolean;
  rating: number;
  totalSales: number;
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  userId: string;
  propertyId?: string;
  scheduledDate: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  commission: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  notes?: string;
}

// ============================================================================
// SERVICIOS PREDEFINIDOS (SEED DATA)
// ============================================================================

const MARKETPLACE_SERVICES: Omit<MarketplaceService, 'id' | 'rating' | 'reviewCount'>[] = [
  // MUDANZAS
  {
    category: 'moving',
    name: 'Mudanza Local (hasta 50km)',
    description: 'Servicio completo de mudanza con embalaje y transporte',
    provider: {
      id: 'mv-001',
      name: 'MudanzasExpress',
      verified: true,
      rating: 4.7,
      totalSales: 1250,
    },
    price: 350,
    currency: 'EUR',
    unit: 'flat',
    commission: 15,
    availability: true,
    cities: ['Madrid', 'Barcelona', 'Valencia'],
    features: ['Embalaje incluido', 'Seguro', '2 operarios', 'Camión'],
  },
  {
    category: 'moving',
    name: 'Mudanza Nacional',
    description: 'Mudanza a cualquier punto de España',
    provider: {
      id: 'mv-001',
      name: 'MudanzasExpress',
      verified: true,
      rating: 4.7,
      totalSales: 1250,
    },
    price: 800,
    currency: 'EUR',
    unit: 'flat',
    commission: 12,
    availability: true,
    cities: ['Toda España'],
    features: ['Embalaje profesional', 'Seguro todo riesgo', 'Tracking', 'Montaje muebles'],
  },

  // SEGUROS
  {
    category: 'insurance',
    name: 'Seguro de Hogar Básico',
    description: 'Cobertura esencial: incendio, robo, responsabilidad civil',
    provider: {
      id: 'ins-001',
      name: 'SegurInmova',
      verified: true,
      rating: 4.5,
      totalSales: 3200,
    },
    price: 150,
    currency: 'EUR',
    unit: 'per_year',
    commission: 20,
    availability: true,
    cities: ['Toda España'],
    features: ['Incendio', 'Robo', 'RC', 'Asistencia 24/7'],
  },
  {
    category: 'insurance',
    name: 'Seguro de Hogar Premium',
    description: 'Cobertura completa con electrodomésticos y fenómenos naturales',
    provider: {
      id: 'ins-001',
      name: 'SegurInmova',
      verified: true,
      rating: 4.5,
      totalSales: 3200,
    },
    price: 280,
    currency: 'EUR',
    unit: 'per_year',
    commission: 20,
    availability: true,
    cities: ['Toda España'],
    features: ['Todo riesgo', 'Electrodomésticos', 'Fenómenos naturales', 'Cristales', 'Cerrajería'],
  },

  // LIMPIEZA
  {
    category: 'cleaning',
    name: 'Limpieza Profunda',
    description: 'Limpieza completa de vivienda (cocina, baños, dormitorios)',
    provider: {
      id: 'cln-001',
      name: 'CleanPro',
      verified: true,
      rating: 4.8,
      totalSales: 5400,
    },
    price: 60,
    currency: 'EUR',
    unit: 'per_hour',
    commission: 18,
    availability: true,
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'],
    features: ['Productos incluidos', 'Personal verificado', 'Seguro RC', 'Satisfacción garantizada'],
  },

  // MANTENIMIENTO
  {
    category: 'maintenance',
    name: 'Fontanería - Revisión y Reparación',
    description: 'Fontanero profesional con experiencia',
    provider: {
      id: 'mnt-001',
      name: 'FixIt',
      verified: true,
      rating: 4.6,
      totalSales: 2100,
    },
    price: 45,
    currency: 'EUR',
    unit: 'per_hour',
    commission: 15,
    availability: true,
    cities: ['Madrid', 'Barcelona', 'Valencia'],
    features: ['Disponibilidad inmediata', 'Garantía 6 meses', 'Presupuesto sin compromiso'],
  },
  {
    category: 'maintenance',
    name: 'Electricista Certificado',
    description: 'Instalaciones eléctricas y reparaciones',
    provider: {
      id: 'mnt-001',
      name: 'FixIt',
      verified: true,
      rating: 4.6,
      totalSales: 2100,
    },
    price: 50,
    currency: 'EUR',
    unit: 'per_hour',
    commission: 15,
    availability: true,
    cities: ['Madrid', 'Barcelona', 'Valencia'],
    features: ['Certificado', 'Boletín eléctrico', 'Emergencias 24/7'],
  },

  // UTILITIES
  {
    category: 'utilities',
    name: 'Fibra Óptica 600Mb',
    description: 'Internet de alta velocidad con instalación gratuita',
    provider: {
      id: 'util-001',
      name: 'FiberNet',
      verified: true,
      rating: 4.3,
      totalSales: 8900,
    },
    price: 35,
    currency: 'EUR',
    unit: 'per_month',
    commission: 25,
    availability: true,
    cities: ['Toda España'],
    features: ['Instalación gratis', 'Router incluido', 'Sin permanencia', 'Soporte 24/7'],
  },

  // MUEBLES
  {
    category: 'furniture',
    name: 'Pack Básico Amueblado',
    description: 'Muebles esenciales: cama, armario, mesa, sillas',
    provider: {
      id: 'furn-001',
      name: 'HomeFurniture',
      verified: true,
      rating: 4.4,
      totalSales: 650,
    },
    price: 1200,
    currency: 'EUR',
    unit: 'flat',
    commission: 10,
    availability: true,
    cities: ['Madrid', 'Barcelona', 'Valencia'],
    features: ['Montaje incluido', 'Entrega 48h', 'Garantía 2 años', 'Financiación disponible'],
  },

  // LEGAL
  {
    category: 'legal',
    name: 'Asesoría Legal Inmobiliaria',
    description: 'Consulta con abogado especializado en derecho inmobiliario',
    provider: {
      id: 'leg-001',
      name: 'LegalInmo',
      verified: true,
      rating: 4.9,
      totalSales: 320,
    },
    price: 120,
    currency: 'EUR',
    unit: 'per_hour',
    commission: 20,
    availability: true,
    cities: ['Toda España'],
    features: ['Abogado colegiado', 'Revisión contratos', 'Desahucios', 'Consulta online'],
  },
];

// ============================================================================
// CRUD SERVICIOS
// ============================================================================

/**
 * Lista servicios del marketplace
 */
export async function getMarketplaceServices(filters?: {
  category?: ServiceCategory;
  city?: string;
  maxPrice?: number;
}): Promise<MarketplaceService[]> {
  try {
    const where: any = { active: true };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.city) {
      where.cities = { has: filters.city };
    }

    if (filters?.maxPrice) {
      where.price = { lte: filters.maxPrice };
    }

    const services = await prisma.marketplaceService.findMany({
      where,
      orderBy: { rating: 'desc' },
    });

    return services as any;
  } catch (error: any) {
    logger.error('❌ Error fetching marketplace services:', error);
    return [];
  }
}

/**
 * Seed inicial de servicios
 */
export async function seedMarketplaceServices(): Promise<void> {
  try {
    for (const service of MARKETPLACE_SERVICES) {
      await prisma.marketplaceService.upsert({
        where: { name: service.name },
        create: {
          ...service,
          provider: service.provider as any,
          rating: 4.5,
          reviewCount: 0,
          active: true,
        },
        update: {},
      });
    }

    logger.info('✅ Marketplace services seeded');
  } catch (error: any) {
    logger.error('❌ Error seeding services:', error);
  }
}

// ============================================================================
// BOOKINGS
// ============================================================================

/**
 * Crear reserva de servicio
 */
export async function createServiceBooking(data: {
  serviceId: string;
  userId: string;
  propertyId?: string;
  scheduledDate: Date;
  quantity?: number;
  notes?: string;
}): Promise<ServiceBooking> {
  try {
    // Obtener servicio
    const service = await prisma.marketplaceService.findUnique({
      where: { id: data.serviceId },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Calcular precio
    const quantity = data.quantity || 1;
    const totalPrice = service.price * quantity;
    const commission = (totalPrice * service.commission) / 100;

    // Crear booking
    const booking = await prisma.serviceBooking.create({
      data: {
        serviceId: data.serviceId,
        userId: data.userId,
        propertyId: data.propertyId,
        scheduledDate: data.scheduledDate,
        status: 'pending',
        totalPrice,
        commission,
        paymentStatus: 'pending',
        notes: data.notes,
      },
    });

    logger.info('✅ Service booking created', { bookingId: booking.id, service: service.name });

    return booking as any;
  } catch (error: any) {
    logger.error('❌ Error creating booking:', error);
    throw error;
  }
}

/**
 * Procesar pago de servicio (Stripe)
 */
export async function processServicePayment(bookingId: string): Promise<string> {
  try {
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: bookingId },
      include: { service: true, user: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Crear Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100), // centavos
      currency: 'eur',
      metadata: {
        bookingId: booking.id,
        service: booking.service.name,
        commission: booking.commission.toString(),
      },
      description: `Servicio: ${booking.service.name}`,
    });

    // Actualizar booking
    await prisma.serviceBooking.update({
      where: { id: bookingId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    logger.info('✅ Payment intent created', { bookingId, paymentIntentId: paymentIntent.id });

    return paymentIntent.client_secret!;
  } catch (error: any) {
    logger.error('❌ Error processing payment:', error);
    throw error;
  }
}

/**
 * Confirmar booking después de pago
 */
export async function confirmServiceBooking(bookingId: string): Promise<void> {
  await prisma.serviceBooking.update({
    where: { id: bookingId },
    data: {
      status: 'confirmed',
      paymentStatus: 'paid',
      confirmedAt: new Date(),
    },
  });

  logger.info('✅ Booking confirmed', { bookingId });
}

export default {
  getMarketplaceServices,
  seedMarketplaceServices,
  createServiceBooking,
  processServicePayment,
  confirmServiceBooking,
};
