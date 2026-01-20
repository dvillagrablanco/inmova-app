/**
 * API: Cotizador de Seguros para Partners Aseguradores
 * 
 * POST /api/partners/insurance/quote - Solicitar cotización de seguro
 * GET /api/partners/insurance/quote - Obtener tipos de seguros disponibles
 * 
 * Modelo de negocio:
 * - Seguro contratado: 15-25% de la prima para Inmova
 * - Renovación: 10-15% de la prima para Inmova
 * - API de scoring: €1-3 por consulta para Inmova
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tipos de seguros disponibles
const INSURANCE_TYPES = [
  {
    id: 'hogar',
    name: 'Seguro de Hogar',
    description: 'Protección completa para tu vivienda',
    coverages: ['incendio', 'robo', 'agua', 'responsabilidad_civil', 'contenido'],
    priceRange: { min: 150, max: 500 },
    commission: 20, // % para Inmova
  },
  {
    id: 'impago_alquiler',
    name: 'Seguro de Impago de Alquiler',
    description: 'Garantía de cobro de rentas',
    coverages: ['impago_rentas', 'defensa_juridica', 'actos_vandalicos', 'desahucio'],
    priceRange: { min: 200, max: 600 },
    commission: 25,
  },
  {
    id: 'comunidad',
    name: 'Seguro de Comunidad',
    description: 'Protección para comunidades de propietarios',
    coverages: ['edificio', 'responsabilidad_civil', 'defensa_juridica', 'accidentes'],
    priceRange: { min: 500, max: 3000 },
    commission: 15,
  },
  {
    id: 'alquiler_vacacional',
    name: 'Seguro Alquiler Vacacional',
    description: 'Protección para propiedades turísticas',
    coverages: ['daños_inquilinos', 'responsabilidad_civil', 'cancelacion', 'robo'],
    priceRange: { min: 250, max: 800 },
    commission: 22,
  },
  {
    id: 'responsabilidad_civil',
    name: 'RC Propietario',
    description: 'Responsabilidad civil del propietario',
    coverages: ['daños_terceros', 'defensa_juridica'],
    priceRange: { min: 80, max: 200 },
    commission: 18,
  },
];

// Schema de cotización
const quoteRequestSchema = z.object({
  // Tipo de seguro
  insuranceType: z.enum(['hogar', 'impago_alquiler', 'comunidad', 'alquiler_vacacional', 'responsabilidad_civil']),
  
  // Datos de la propiedad
  property: z.object({
    type: z.enum(['piso', 'casa', 'local', 'oficina', 'garaje']),
    squareMeters: z.number().min(10).max(2000),
    yearBuilt: z.number().min(1800).max(2030).optional(),
    floors: z.number().min(1).max(100).optional(),
    hasAlarm: z.boolean().optional(),
    hasPorter: z.boolean().optional(),
    
    // Ubicación
    postalCode: z.string(),
    city: z.string(),
    province: z.string(),
  }),
  
  // Valor asegurado
  buildingValue: z.number().min(0).optional(), // Continente
  contentsValue: z.number().min(0).optional(), // Contenido
  
  // Para seguro de impago
  monthlyRent: z.number().min(0).optional(),
  tenantSolvencyScore: z.number().min(0).max(100).optional(),
  
  // Datos del solicitante
  applicant: z.object({
    type: z.enum(['propietario', 'inquilino', 'gestor', 'comunidad']),
    name: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  
  // Opciones adicionales
  options: z.object({
    deductible: z.enum(['sin_franquicia', 'franquicia_150', 'franquicia_300']).optional(),
    paymentFrequency: z.enum(['anual', 'semestral', 'trimestral', 'mensual']).optional(),
    additionalCoverages: z.array(z.string()).optional(),
  }).optional(),
  
  // Tracking
  propertyId: z.string().optional(), // ID de propiedad en Inmova
  partnerId: z.string().optional(), // Si viene de un partner específico
});

// Calcular prima base
function calculateBasePremium(data: z.infer<typeof quoteRequestSchema>): number {
  let basePremium = 0;
  const insurance = INSURANCE_TYPES.find(i => i.id === data.insuranceType);
  
  if (!insurance) return 0;
  
  switch (data.insuranceType) {
    case 'hogar':
      // Base por m² + valor contenido
      basePremium = (data.property.squareMeters * 1.5) + 
                    ((data.contentsValue || 30000) * 0.003);
      break;
      
    case 'impago_alquiler':
      // % de la renta anual
      const annualRent = (data.monthlyRent || 800) * 12;
      basePremium = annualRent * 0.04; // 4% de la renta anual
      // Ajuste por scoring del inquilino
      if (data.tenantSolvencyScore && data.tenantSolvencyScore < 50) {
        basePremium *= 1.3; // 30% más si scoring bajo
      }
      break;
      
    case 'comunidad':
      // Por m² de zonas comunes
      basePremium = data.property.squareMeters * 3;
      break;
      
    case 'alquiler_vacacional':
      // Base + valor contenido
      basePremium = 200 + ((data.contentsValue || 10000) * 0.005);
      break;
      
    case 'responsabilidad_civil':
      basePremium = 100;
      break;
  }
  
  // Ajustes por características
  if (data.property.hasAlarm) basePremium *= 0.9; // 10% descuento
  if (data.property.hasPorter) basePremium *= 0.95; // 5% descuento
  
  // Ajuste por antigüedad
  if (data.property.yearBuilt) {
    const age = new Date().getFullYear() - data.property.yearBuilt;
    if (age > 50) basePremium *= 1.2;
    else if (age > 30) basePremium *= 1.1;
  }
  
  // Asegurar que está dentro del rango
  basePremium = Math.max(insurance.priceRange.min, 
                         Math.min(insurance.priceRange.max, basePremium));
  
  return Math.round(basePremium * 100) / 100;
}

// Generar coberturas detalladas
function generateCoverages(data: z.infer<typeof quoteRequestSchema>) {
  const coverageDetails: Record<string, { included: boolean; limit: string; description: string }> = {};
  
  const insurance = INSURANCE_TYPES.find(i => i.id === data.insuranceType);
  if (!insurance) return coverageDetails;
  
  const coverageConfig: Record<string, { limit: string; description: string }> = {
    incendio: { limit: '100% valor asegurado', description: 'Daños por incendio, rayo y explosión' },
    robo: { limit: '€15.000', description: 'Robo y expoliación' },
    agua: { limit: '€10.000', description: 'Daños por agua' },
    responsabilidad_civil: { limit: '€300.000', description: 'Responsabilidad civil familiar' },
    contenido: { limit: `€${data.contentsValue || 30000}`, description: 'Bienes muebles' },
    impago_rentas: { limit: '12 meses', description: 'Garantía de cobro de rentas' },
    defensa_juridica: { limit: '€6.000', description: 'Gastos de defensa jurídica' },
    actos_vandalicos: { limit: '€3.000', description: 'Daños por vandalismo' },
    desahucio: { limit: '€1.500', description: 'Gastos de desahucio' },
    edificio: { limit: '100% valor edificio', description: 'Estructura del edificio' },
    accidentes: { limit: '€50.000', description: 'Accidentes en zonas comunes' },
    daños_inquilinos: { limit: '€5.000', description: 'Daños causados por huéspedes' },
    cancelacion: { limit: '€2.000', description: 'Cancelaciones de última hora' },
    daños_terceros: { limit: '€150.000', description: 'Daños a terceros' },
  };
  
  insurance.coverages.forEach(coverage => {
    const config = coverageConfig[coverage];
    if (config) {
      coverageDetails[coverage] = {
        included: true,
        limit: config.limit,
        description: config.description,
      };
    }
  });
  
  return coverageDetails;
}

// POST: Solicitar cotización
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Permitir cotización sin sesión (público)
    
    const body = await request.json();
    const validationResult = quoteRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Calcular prima
    const basePremium = calculateBasePremium(data);
    
    // Ajustes por forma de pago
    const paymentMultipliers = {
      anual: 1,
      semestral: 1.02,
      trimestral: 1.04,
      mensual: 1.06,
    };
    const paymentFrequency = data.options?.paymentFrequency || 'anual';
    const adjustedPremium = basePremium * paymentMultipliers[paymentFrequency];
    
    // Generar opciones de cobertura
    const coverages = generateCoverages(data);
    
    // Generar ID de cotización
    const quoteId = `QUO-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    // Encontrar tipo de seguro
    const insuranceType = INSURANCE_TYPES.find(i => i.id === data.insuranceType);
    
    // Calcular cuotas según frecuencia
    const paymentOptions = {
      anual: {
        amount: Math.round(basePremium * 100) / 100,
        frequency: 'anual',
        totalYear: Math.round(basePremium * 100) / 100,
      },
      semestral: {
        amount: Math.round((basePremium * 1.02 / 2) * 100) / 100,
        frequency: 'semestral',
        totalYear: Math.round(basePremium * 1.02 * 100) / 100,
      },
      trimestral: {
        amount: Math.round((basePremium * 1.04 / 4) * 100) / 100,
        frequency: 'trimestral',
        totalYear: Math.round(basePremium * 1.04 * 100) / 100,
      },
      mensual: {
        amount: Math.round((basePremium * 1.06 / 12) * 100) / 100,
        frequency: 'mensual',
        totalYear: Math.round(basePremium * 1.06 * 100) / 100,
      },
    };
    
    const quote = {
      // Info de cotización
      quoteId,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
      
      // Tipo de seguro
      insurance: {
        type: data.insuranceType,
        name: insuranceType?.name,
        description: insuranceType?.description,
      },
      
      // Propiedad asegurada
      property: {
        type: data.property.type,
        location: `${data.property.city}, ${data.property.province}`,
        postalCode: data.property.postalCode,
        squareMeters: data.property.squareMeters,
      },
      
      // Valores asegurados
      insuredValues: {
        building: data.buildingValue || 0,
        contents: data.contentsValue || 0,
        total: (data.buildingValue || 0) + (data.contentsValue || 0),
      },
      
      // Prima
      premium: {
        annual: paymentOptions.anual.totalYear,
        selected: paymentOptions[paymentFrequency],
        allOptions: paymentOptions,
      },
      
      // Coberturas incluidas
      coverages,
      
      // Coberturas opcionales
      optionalCoverages: [
        { id: 'rotura_cristales', name: 'Rotura de cristales', extraPremium: 25 },
        { id: 'asistencia_hogar', name: 'Asistencia hogar 24h', extraPremium: 35 },
        { id: 'defensa_juridica_plus', name: 'Defensa jurídica ampliada', extraPremium: 45 },
        { id: 'cyber_protection', name: 'Protección cibernética', extraPremium: 30 },
      ],
      
      // Próximos pasos
      nextSteps: [
        'Revisa las coberturas incluidas',
        'Añade coberturas opcionales si lo deseas',
        'Confirma tus datos de contacto',
        'Procede al pago para activar la póliza',
      ],
      
      // Para contratación
      contractUrl: `/seguros/contratar?quote=${quoteId}`,
      
      // Tracking
      metadata: {
        partnerId: data.partnerId || null,
        propertyId: data.propertyId || null,
        userId: session?.user?.id || null,
        timestamp: new Date().toISOString(),
      },
    };
    
    // TODO: Guardar cotización en BD para seguimiento
    // await saveQuote(quote);
    
    logger.info('[InsuranceQuote] Cotización generada', {
      quoteId,
      type: data.insuranceType,
      premium: basePremium,
      partnerId: data.partnerId,
    });
    
    return NextResponse.json(quote);
    
  } catch (error: any) {
    logger.error('[InsuranceQuote] Error:', error);
    return NextResponse.json(
      { error: 'Error generando cotización' },
      { status: 500 }
    );
  }
}

// GET: Obtener tipos de seguros disponibles
export async function GET(request: NextRequest) {
  return NextResponse.json({
    insuranceTypes: INSURANCE_TYPES.map(type => ({
      id: type.id,
      name: type.name,
      description: type.description,
      priceRange: type.priceRange,
      coverages: type.coverages,
    })),
    propertyTypes: [
      { value: 'piso', label: 'Piso/Apartamento' },
      { value: 'casa', label: 'Casa/Chalet' },
      { value: 'local', label: 'Local Comercial' },
      { value: 'oficina', label: 'Oficina' },
      { value: 'garaje', label: 'Garaje' },
    ],
    applicantTypes: [
      { value: 'propietario', label: 'Propietario' },
      { value: 'inquilino', label: 'Inquilino' },
      { value: 'gestor', label: 'Gestor Inmobiliario' },
      { value: 'comunidad', label: 'Comunidad de Propietarios' },
    ],
    deductibleOptions: [
      { value: 'sin_franquicia', label: 'Sin franquicia', discount: 0 },
      { value: 'franquicia_150', label: '150€ franquicia', discount: 10 },
      { value: 'franquicia_300', label: '300€ franquicia', discount: 15 },
    ],
    paymentOptions: [
      { value: 'anual', label: 'Pago anual', surcharge: 0 },
      { value: 'semestral', label: 'Pago semestral', surcharge: 2 },
      { value: 'trimestral', label: 'Pago trimestral', surcharge: 4 },
      { value: 'mensual', label: 'Pago mensual', surcharge: 6 },
    ],
    disclaimer: 'La cotización es orientativa y está sujeta a la aceptación por parte de la aseguradora tras la verificación de los datos.',
  });
}
