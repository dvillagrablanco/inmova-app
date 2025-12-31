/**
 * Integraciones con Proveedores de Seguros
 * APIs de aseguradoras españolas para comparación y contratación
 */

export interface InsuranceQuote {
  provider: string;
  policyNumber?: string;
  coverageType: string;
  annualPremium: number;
  coverage: number;
  deductible: number;
  features: string[];
  exclusions: string[];
  validUntil: string;
  downloadUrl?: string;
}

export interface InsuranceQuoteRequest {
  propertyType: 'EDIFICIO' | 'VIVIENDA' | 'LOCAL';
  propertyValue: number;
  propertyAddress: string;
  postalCode: string;
  city: string;
  province: string;
  constructionYear: number;
  squareMeters: number;
  coverageTypes: string[];
  additionalCoverages?: string[];
}

export interface ClaimSubmission {
  provider: string;
  policyNumber: string;
  claimType: string;
  claimDate: string;
  description: string;
  estimatedAmount: number;
  photos?: File[];
  documents?: File[];
}

/**
 * Mapfre API Integration
 * https://api.mapfre.es/
 */
export class MapfreAPI {
  private apiKey: string;
  private baseURL = 'https://api.mapfre.es/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.MAPFRE_API_KEY || '';
  }

  async getQuote(request: InsuranceQuoteRequest): Promise<InsuranceQuote> {
    // Simulación - En producción usar API real
    return {
      provider: 'Mapfre',
      coverageType: request.coverageTypes[0],
      annualPremium: this.calculatePremium(request) * 0.95,
      coverage: request.propertyValue,
      deductible: 300,
      features: [
        'Daños por incendio',
        'Daños por agua',
        'Responsabilidad civil',
        'Robo y vandalismo',
        'Fenómenos atmosféricos',
      ],
      exclusions: ['Daños por guerra', 'Actos terroristas', 'Catástrofes naturales no cubiertas'],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async submitClaim(claim: ClaimSubmission): Promise<{ claimNumber: string; status: string }> {
    // Simulación
    return {
      claimNumber: `MAP-${Date.now()}`,
      status: 'EN_REVISION',
    };
  }

  async getClaimStatus(claimNumber: string): Promise<{
    status: string;
    lastUpdate: string;
    estimatedResolution: string;
  }> {
    return {
      status: 'EN_REVISION',
      lastUpdate: new Date().toISOString(),
      estimatedResolution: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  private calculatePremium(request: InsuranceQuoteRequest): number {
    let base = request.propertyValue * 0.002;

    // Ajustar por antigüedad
    const age = new Date().getFullYear() - request.constructionYear;
    if (age > 50) base *= 1.3;
    else if (age > 30) base *= 1.15;

    // Ajustar por ubicación (simulado)
    if (['Madrid', 'Barcelona', 'Valencia'].includes(request.city)) {
      base *= 1.1;
    }

    // Ajustar por coberturas adicionales
    base *= 1 + (request.additionalCoverages?.length || 0) * 0.05;

    return Math.round(base);
  }
}

/**
 * AXA API Integration
 * https://developer.axa.com/
 */
export class AXAAPI {
  private apiKey: string;
  private baseURL = 'https://api.axa.es/v2';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.AXA_API_KEY || '';
  }

  async getQuote(request: InsuranceQuoteRequest): Promise<InsuranceQuote> {
    return {
      provider: 'AXA',
      coverageType: request.coverageTypes[0],
      annualPremium: this.calculatePremium(request) * 0.98,
      coverage: request.propertyValue,
      deductible: 250,
      features: [
        'Cobertura todo riesgo',
        'Asistencia 24/7',
        'Reparaciones urgentes',
        'Responsabilidad civil ilimitada',
        'Protección jurídica',
      ],
      exclusions: ['Daños intencionados', 'Actos de guerra'],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async submitClaim(claim: ClaimSubmission): Promise<{ claimNumber: string; status: string }> {
    return {
      claimNumber: `AXA-${Date.now()}`,
      status: 'ABIERTO',
    };
  }

  private calculatePremium(request: InsuranceQuoteRequest): number {
    let base = request.propertyValue * 0.0018;
    const age = new Date().getFullYear() - request.constructionYear;
    if (age > 40) base *= 1.2;
    return Math.round(base);
  }
}

/**
 * Segurcaixa API Integration
 */
export class SegurcaixaAPI {
  private apiKey: string;
  private baseURL = 'https://api.segurcaixa.es/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SEGURCAIXA_API_KEY || '';
  }

  async getQuote(request: InsuranceQuoteRequest): Promise<InsuranceQuote> {
    return {
      provider: 'Segurcaixa',
      coverageType: request.coverageTypes[0],
      annualPremium: this.calculatePremium(request) * 0.92,
      coverage: request.propertyValue,
      deductible: 400,
      features: ['Daños estructurales', 'Contenidos', 'Responsabilidad civil', 'Gastos de realojo'],
      exclusions: ['Negligencia grave', 'Daños pre-existentes'],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  private calculatePremium(request: InsuranceQuoteRequest): number {
    return Math.round(request.propertyValue * 0.0016);
  }
}

/**
 * Mutua Madrileña API Integration
 */
export class MutuaMadrilenaAPI {
  private apiKey: string;
  private baseURL = 'https://api.mutuamadrilena.es/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.MUTUA_API_KEY || '';
  }

  async getQuote(request: InsuranceQuoteRequest): Promise<InsuranceQuote> {
    return {
      provider: 'Mutua Madrileña',
      coverageType: request.coverageTypes[0],
      annualPremium: this.calculatePremium(request),
      coverage: request.propertyValue,
      deductible: 350,
      features: [
        'Multirriesgo completo',
        'Asesor personal',
        'Peritaje rápido',
        'Red de profesionales',
      ],
      exclusions: ['Daños estéticos', 'Desgaste natural'],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  private calculatePremium(request: InsuranceQuoteRequest): number {
    return Math.round(request.propertyValue * 0.0019);
  }
}

/**
 * Allianz API Integration
 */
export class AllianzAPI {
  private apiKey: string;
  private baseURL = 'https://api.allianz.es/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ALLIANZ_API_KEY || '';
  }

  async getQuote(request: InsuranceQuoteRequest): Promise<InsuranceQuote> {
    return {
      provider: 'Allianz',
      coverageType: request.coverageTypes[0],
      annualPremium: this.calculatePremium(request) * 1.05,
      coverage: request.propertyValue * 1.2, // 20% más cobertura
      deductible: 200,
      features: [
        'Cobertura ampliada',
        'Sin carencias',
        'Servicio premium',
        'Cobertura internacional',
        'Asistencia viaje',
      ],
      exclusions: ['Daños por falta de mantenimiento'],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  private calculatePremium(request: InsuranceQuoteRequest): number {
    return Math.round(request.propertyValue * 0.0022);
  }
}

/**
 * Insurance Comparison Service
 * Compara ofertas de múltiples aseguradoras
 */
export class InsuranceComparisonService {
  private providers: Array<MapfreAPI | AXAAPI | SegurcaixaAPI | MutuaMadrilenaAPI | AllianzAPI>;

  constructor() {
    this.providers = [
      new MapfreAPI(),
      new AXAAPI(),
      new SegurcaixaAPI(),
      new MutuaMadrilenaAPI(),
      new AllianzAPI(),
    ];
  }

  async compareQuotes(request: InsuranceQuoteRequest): Promise<InsuranceQuote[]> {
    try {
      const quotes = await Promise.allSettled(
        this.providers.map((provider) => provider.getQuote(request))
      );

      return quotes
        .filter((result) => result.status === 'fulfilled')
        .map((result) => (result as PromiseFulfilledResult<InsuranceQuote>).value)
        .sort((a, b) => a.annualPremium - b.annualPremium);
    } catch (error) {
      console.error('Error comparing quotes:', error);
      throw error;
    }
  }

  async getBestQuote(request: InsuranceQuoteRequest): Promise<InsuranceQuote> {
    const quotes = await this.compareQuotes(request);
    return quotes[0]; // Retorna la más económica
  }

  async getProviderQuote(
    provider: string,
    request: InsuranceQuoteRequest
  ): Promise<InsuranceQuote | null> {
    const providerMap: Record<string, any> = {
      Mapfre: new MapfreAPI(),
      AXA: new AXAAPI(),
      Segurcaixa: new SegurcaixaAPI(),
      'Mutua Madrileña': new MutuaMadrilenaAPI(),
      Allianz: new AllianzAPI(),
    };

    const providerAPI = providerMap[provider];
    if (!providerAPI) return null;

    return await providerAPI.getQuote(request);
  }
}

/**
 * Claims Management Service
 */
export class ClaimsManagementService {
  async submitClaim(claim: ClaimSubmission): Promise<{ claimNumber: string; status: string }> {
    const providerMap: Record<string, any> = {
      Mapfre: new MapfreAPI(),
      AXA: new AXAAPI(),
    };

    const provider = providerMap[claim.provider];
    if (!provider) {
      throw new Error(`Provider ${claim.provider} not supported for claims`);
    }

    return await provider.submitClaim(claim);
  }

  async getClaimStatus(provider: string, claimNumber: string): Promise<any> {
    if (provider === 'Mapfre') {
      const mapfre = new MapfreAPI();
      return await mapfre.getClaimStatus(claimNumber);
    }

    return {
      status: 'PENDIENTE',
      lastUpdate: new Date().toISOString(),
      estimatedResolution: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}

// Export singleton instances
export const insuranceComparison = new InsuranceComparisonService();
export const claimsManagement = new ClaimsManagementService();
