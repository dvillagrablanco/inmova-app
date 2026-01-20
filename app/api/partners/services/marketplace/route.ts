/**
 * API: Marketplace de Servicios para Partners de Mantenimiento
 * 
 * GET /api/partners/services/marketplace - Listar servicios disponibles
 * POST /api/partners/services/marketplace - Registrar proveedor de servicios
 * 
 * Modelo de negocio:
 * - Comisión por trabajo: 10-15% del importe para Inmova
 * - Suscripción Premium: €49-199/mes para mejor posicionamiento
 * - Urgencias: 20% adicional para Inmova
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Categorías de servicios
const SERVICE_CATEGORIES = [
  { id: 'fontaneria', name: 'Fontanería', icon: '🔧', commission: 12 },
  { id: 'electricidad', name: 'Electricidad', icon: '⚡', commission: 12 },
  { id: 'climatizacion', name: 'Climatización', icon: '❄️', commission: 12 },
  { id: 'cerrajeria', name: 'Cerrajería', icon: '🔑', commission: 15 },
  { id: 'limpieza', name: 'Limpieza', icon: '🧹', commission: 10 },
  { id: 'reformas', name: 'Reformas', icon: '🏗️', commission: 8 },
  { id: 'pintura', name: 'Pintura', icon: '🎨', commission: 10 },
  { id: 'jardineria', name: 'Jardinería', icon: '🌿', commission: 10 },
  { id: 'mudanzas', name: 'Mudanzas', icon: '📦', commission: 10 },
  { id: 'plagas', name: 'Control de Plagas', icon: '🐜', commission: 15 },
  { id: 'electrodomesticos', name: 'Electrodomésticos', icon: '🔌', commission: 12 },
  { id: 'seguridad', name: 'Seguridad', icon: '🔒', commission: 12 },
  { id: 'otros', name: 'Otros', icon: '🛠️', commission: 10 },
];

// Schema para búsqueda
const searchSchema = z.object({
  category: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  urgent: z.boolean().optional(),
  minRating: z.number().min(1).max(5).optional(),
  maxPrice: z.number().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Schema para registrar proveedor
const providerSchema = z.object({
  businessName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(9),
  nif: z.string().min(9),
  categories: z.array(z.string()).min(1),
  
  // Ubicación y cobertura
  address: z.string(),
  city: z.string(),
  province: z.string(),
  postalCode: z.string(),
  coverageRadius: z.number().min(1).max(100).default(20), // km
  coveragePostalCodes: z.array(z.string()).optional(),
  
  // Capacidad
  availableUrgent: z.boolean().default(false),
  urgentSurcharge: z.number().min(0).max(100).default(50), // % extra urgencias
  averageResponseTime: z.number().min(1).max(72).default(24), // horas
  
  // Precios orientativos
  hourlyRate: z.number().min(0).optional(),
  minimumCharge: z.number().min(0).optional(),
  
  // Documentación
  insurancePolicy: z.string().optional(),
  professionalLicense: z.string().optional(),
  
  // Plan
  subscriptionTier: z.enum(['basic', 'professional', 'premium']).default('basic'),
});

// GET: Buscar proveedores de servicios
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    
    const params = searchSchema.parse({
      category: searchParams.get('category') || undefined,
      city: searchParams.get('city') || undefined,
      postalCode: searchParams.get('postalCode') || undefined,
      urgent: searchParams.get('urgent') === 'true',
      minRating: searchParams.get('minRating') 
        ? parseFloat(searchParams.get('minRating')!) 
        : undefined,
      maxPrice: searchParams.get('maxPrice') 
        ? parseFloat(searchParams.get('maxPrice')!) 
        : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    });
    
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    
    // Construir filtro
    const where: any = {
      activo: true,
      estado: 'ACTIVE',
    };
    
    if (params.category) {
      where.categoria = params.category;
    }
    
    if (params.urgent) {
      where.availableUrgent = true;
    }
    
    // Buscar proveedores (usando PartnerService como modelo)
    const services = await prisma.partnerService.findMany({
      where,
      orderBy: [
        { destacado: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: {
        partner: {
          select: {
            id: true,
            nombre: true,
            logo: true,
            estado: true,
          },
        },
      },
    });
    
    const total = await prisma.partnerService.count({ where });
    
    // Enriquecer datos
    const enrichedServices = services.map(service => ({
      id: service.id,
      provider: {
        id: service.partner.id,
        name: service.partner.nombre,
        logo: service.partner.logo,
        verified: service.partner.estado === 'ACTIVE',
      },
      category: SERVICE_CATEGORIES.find(c => c.id === service.categoria) || {
        id: service.categoria,
        name: service.categoria,
        icon: '🛠️',
        commission: 10,
      },
      name: service.nombre,
      description: service.descripcion,
      pricing: {
        type: service.precioTipo,
        amount: service.precioBase,
        currency: 'EUR',
        minimumCharge: service.precioMinimo,
      },
      rating: service.rating || 0,
      reviewCount: service.reviewCount || 0,
      responseTime: service.tiempoRespuesta || 24,
      availableUrgent: service.urgenciaDisponible || false,
      coverageAreas: service.zonasCobertura || [],
      badges: [
        service.destacado ? 'destacado' : null,
        service.verificado ? 'verificado' : null,
        service.urgenciaDisponible ? 'urgencias' : null,
      ].filter(Boolean),
      contact: {
        canMessage: true,
        canCall: true,
        canBook: true,
      },
    }));
    
    return NextResponse.json({
      services: enrichedServices,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
      categories: SERVICE_CATEGORIES,
      filters: {
        applied: params,
      },
    });
    
  } catch (error: any) {
    logger.error('[ServiceMarketplace] Error:', error);
    return NextResponse.json(
      { error: 'Error buscando servicios' },
      { status: 500 }
    );
  }
}

// POST: Registrar nuevo proveedor de servicios
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos
    const validationResult = providerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    
    // Verificar que no existe ya
    const existing = await prisma.partner.findFirst({
      where: {
        OR: [
          { email: data.email },
          { nif: data.nif },
        ],
      },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese email o NIF' },
        { status: 409 }
      );
    }
    
    // Calcular comisión según tier
    const commissionRates = {
      basic: 15,
      professional: 12,
      premium: 10,
    };
    
    // Crear partner
    const partner = await prisma.partner.create({
      data: {
        nombre: data.businessName,
        razonSocial: data.businessName,
        email: data.email,
        telefono: data.phone,
        nif: data.nif,
        direccion: data.address,
        ciudad: data.city,
        provincia: data.province,
        codigoPostal: data.postalCode,
        tipo: 'SERVICIOS',
        comisionPorcentaje: commissionRates[data.subscriptionTier],
        estado: 'PENDING', // Requiere aprobación
        configuracion: {
          contactName: data.contactName,
          coverageRadius: data.coverageRadius,
          coveragePostalCodes: data.coveragePostalCodes,
          availableUrgent: data.availableUrgent,
          urgentSurcharge: data.urgentSurcharge,
          averageResponseTime: data.averageResponseTime,
          hourlyRate: data.hourlyRate,
          minimumCharge: data.minimumCharge,
          insurancePolicy: data.insurancePolicy,
          professionalLicense: data.professionalLicense,
          subscriptionTier: data.subscriptionTier,
        },
      },
    });
    
    // Crear servicios para cada categoría
    const services = await Promise.all(
      data.categories.map(category => 
        prisma.partnerService.create({
          data: {
            partnerId: partner.id,
            nombre: `${data.businessName} - ${SERVICE_CATEGORIES.find(c => c.id === category)?.name || category}`,
            descripcion: `Servicio de ${category} profesional`,
            categoria: category,
            slug: `${data.businessName.toLowerCase().replace(/\s+/g, '-')}-${category}`,
            activo: false, // Hasta aprobación
            precioTipo: 'hora',
            precioBase: data.hourlyRate || 30,
            precioMinimo: data.minimumCharge || 50,
            tiempoRespuesta: data.averageResponseTime,
            urgenciaDisponible: data.availableUrgent,
            zonasCobertura: data.coveragePostalCodes || [data.postalCode],
          },
        })
      )
    );
    
    logger.info('[ServiceMarketplace] Nuevo proveedor registrado', {
      partnerId: partner.id,
      businessName: data.businessName,
      categories: data.categories,
      tier: data.subscriptionTier,
    });
    
    // TODO: Enviar email de confirmación y notificar a admin
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud recibida. Te contactaremos en 24-48h para verificar tu cuenta.',
      provider: {
        id: partner.id,
        name: partner.nombre,
        status: partner.estado,
        services: services.length,
      },
      nextSteps: [
        'Recibirás un email de confirmación',
        'Verificaremos tu documentación (seguro, licencias)',
        'Una vez aprobado, tus servicios estarán visibles',
        'Podrás gestionar todo desde tu panel de partner',
      ],
      pricing: {
        tier: data.subscriptionTier,
        commission: commissionRates[data.subscriptionTier],
        urgentCommission: commissionRates[data.subscriptionTier] + 5,
        monthlyFee: data.subscriptionTier === 'basic' ? 0 : 
                    data.subscriptionTier === 'professional' ? 49 : 199,
      },
    }, { status: 201 });
    
  } catch (error: any) {
    logger.error('[ServiceMarketplace] Error registrando proveedor:', error);
    return NextResponse.json(
      { error: 'Error registrando proveedor' },
      { status: 500 }
    );
  }
}
