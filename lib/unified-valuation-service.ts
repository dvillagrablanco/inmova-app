import type { PrismaClient } from '@prisma/client';

type CreateUnifiedValuationInput = {
  companyId: string;
  requestedBy: string;
  unitId?: string | null;
  buildingId?: string | null;
  address: string;
  city: string;
  postalCode?: string | null;
  province?: string | null;
  neighborhood?: string | null;
  squareMeters: number;
  rooms?: number | null;
  bathrooms?: number | null;
  floor?: number | null;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGarden?: boolean;
  hasPool?: boolean;
  hasTerrace?: boolean;
  hasGarage?: boolean;
  condition?: string | null;
  yearBuilt?: number | null;
  estimatedValue: number;
  minValue: number;
  maxValue: number;
  pricePerM2?: number | null;
  confidenceScore?: number | null;
  model?: string | null;
  reasoning?: string | null;
  keyFactors?: string[];
  recommendations?: string[];
  estimatedRent?: number | null;
  estimatedROI?: number | null;
  capRate?: number | null;
  avgPricePerM2?: number | null;
  marketTrend?: string | null;
  comparables?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function normalizeCondition(value?: string | null) {
  switch (value) {
    case 'NEW':
    case 'excelente':
      return 'NEW';
    case 'NEEDS_RENOVATION':
    case 'reformar':
      return 'NEEDS_RENOVATION';
    default:
      return 'GOOD';
  }
}

function normalizeMarketTrend(value?: string | null) {
  switch (value) {
    case 'UP':
    case 'alcista':
      return 'UP';
    case 'DOWN':
    case 'bajista':
      return 'DOWN';
    case 'STABLE':
    case 'estable':
    default:
      return 'STABLE';
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

export async function createUnifiedValuation(
  prisma: PrismaClient,
  input: CreateUnifiedValuationInput
) {
  const duplicateWindow = new Date(Date.now() - 30 * 60 * 1000);
  const duplicate = await prisma.propertyValuation.findFirst({
    where: {
      companyId: input.companyId,
      requestedBy: input.requestedBy,
      unitId: input.unitId || null,
      address: input.address,
      city: input.city,
      squareMeters: input.squareMeters,
      estimatedValue: input.estimatedValue,
      createdAt: { gte: duplicateWindow },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (duplicate) {
    return duplicate;
  }

  return prisma.propertyValuation.create({
    data: {
      companyId: input.companyId,
      unitId: input.unitId || null,
      requestedBy: input.requestedBy,
      ipAddress: input.ipAddress || undefined,
      userAgent: input.userAgent || undefined,
      address: input.address || 'Sin dirección',
      postalCode: input.postalCode || '',
      city: input.city || '',
      province: input.province || undefined,
      neighborhood: input.neighborhood || undefined,
      squareMeters: input.squareMeters,
      rooms: input.rooms || 0,
      bathrooms: input.bathrooms || 0,
      floor: input.floor || 0,
      hasElevator: !!input.hasElevator,
      hasParking: !!input.hasParking,
      hasGarden: !!input.hasGarden,
      hasPool: !!input.hasPool,
      hasTerrace: !!input.hasTerrace,
      hasGarage: !!input.hasGarage,
      condition: normalizeCondition(input.condition) as any,
      yearBuilt: input.yearBuilt || undefined,
      avgPricePerM2: input.avgPricePerM2 || input.pricePerM2 || undefined,
      marketTrend: normalizeMarketTrend(input.marketTrend) as any,
      comparables: input.comparables as any,
      estimatedValue: input.estimatedValue,
      minValue: input.minValue,
      maxValue: input.maxValue,
      pricePerM2: input.pricePerM2 || undefined,
      confidenceScore: input.confidenceScore || 70,
      reasoning: input.reasoning || undefined,
      keyFactors: toStringArray(input.keyFactors),
      recommendations: toStringArray(input.recommendations),
      estimatedRent: input.estimatedRent || undefined,
      estimatedROI: input.estimatedROI || undefined,
      capRate: input.capRate || undefined,
      model: input.model || 'inmova_unified',
    },
  });
}

export function normalizeLegacyValuation(record: any) {
  return {
    id: record.id,
    address: record.direccion,
    city: record.municipio,
    postalCode: record.codigoPostal,
    squareMeters: record.metrosCuadrados,
    rooms: record.habitaciones,
    bathrooms: record.banos,
    condition: record.estadoConservacion || 'GOOD',
    estimatedValue: record.valorEstimado,
    confidenceScore: record.confianzaValoracion,
    minValue: record.valorMinimo,
    maxValue: record.valorMaximo,
    pricePerM2: record.precioM2,
    estimatedRent: null,
    estimatedROI: null,
    capRate: null,
    model: 'legacy_valoraciones',
    createdAt: record.fechaValoracion || record.createdAt,
    sourceModel: 'legacy',
    reasoning: record.notas || '',
    keyFactors: Array.isArray(record.factoresPositivos) ? record.factoresPositivos : [],
    recommendations: record.recomendacionPrecio
      ? String(record.recomendacionPrecio)
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      : [],
    marketTrend: null,
    unit: record.unit
      ? {
          numero: record.unit.numero,
          building: record.building
            ? {
                nombre: record.building.nombre,
              }
            : null,
        }
      : null,
    user: null,
  };
}

export function normalizeModernValuation(record: any) {
  return {
    ...record,
    sourceModel: 'property_valuations',
  };
}
