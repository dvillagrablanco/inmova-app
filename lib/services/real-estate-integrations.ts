/**
 * Servicio de Integraciones con Portales Inmobiliarios
 * - Idealista
 * - Pisos.com
 * - Fotocasa
 * - Habitaclia
 */

export interface PropertyData {
  externalId: string;
  portal: 'idealista' | 'pisos' | 'fotocasa' | 'habitaclia';
  url: string;
  title: string;
  description: string;
  price: number;
  propertyType: string;
  address: {
    street?: string;
    city: string;
    province: string;
    postalCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  features: {
    bedrooms?: number;
    bathrooms?: number;
    squareMeters?: number;
    floor?: string;
    hasElevator?: boolean;
    hasParking?: boolean;
    hasGarden?: boolean;
    hasPool?: boolean;
    hasAirConditioning?: boolean;
    hasHeating?: boolean;
    energyRating?: string;
    constructionYear?: number;
  };
  images: string[];
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  listingDate: Date;
  lastUpdate: Date;
}

export interface MarketAnalysis {
  averagePrice: number;
  medianPrice: number;
  pricePerSqm: number;
  marketTrend: 'growing' | 'stable' | 'declining';
  competingListings: number;
  averageDaysOnMarket: number;
  priceComparison: 'above_market' | 'at_market' | 'below_market';
  similarProperties: PropertyData[];
}

export class RealEstateIntegrations {
  private static readonly IDEALISTA_API_URL = process.env.IDEALISTA_API_URL || 'https://api.idealista.com';
  private static readonly PISOS_API_URL = process.env.PISOS_API_URL || 'https://api.pisos.com';
  private static readonly IDEALISTA_API_KEY = process.env.IDEALISTA_API_KEY;
  private static readonly PISOS_API_KEY = process.env.PISOS_API_KEY;

  /**
   * Importa propiedad desde Idealista
   */
  static async importFromIdealista(propertyUrl: string): Promise<PropertyData> {
    try {
      // Extraer ID de la URL
      const unitId = this.extractIdealistaId(propertyUrl);
      
      // Opción 1: API oficial (requiere cuenta premium)
      if (this.IDEALISTA_API_KEY) {
        return await this.fetchFromIdealistaAPI(unitId);
      }
      
      // Opción 2: Web scraping (alternativa sin API)
      return await this.scrapeIdealista(propertyUrl);
    } catch (error) {
      console.error('Error importando desde Idealista:', error);
      throw new Error('No se pudo importar la propiedad desde Idealista');
    }
  }

  /**
   * Importa propiedad desde Pisos.com
   */
  static async importFromPisos(propertyUrl: string): Promise<PropertyData> {
    try {
      const unitId = this.extractPisosId(propertyUrl);
      
      if (this.PISOS_API_KEY) {
        return await this.fetchFromPisosAPI(unitId);
      }
      
      return await this.scrapePisos(propertyUrl);
    } catch (error) {
      console.error('Error importando desde Pisos.com:', error);
      throw new Error('No se pudo importar la propiedad desde Pisos.com');
    }
  }

  /**
   * Scraping de Idealista
   */
  private static async scrapeIdealista(url: string): Promise<PropertyData> {
    const cheerio = require('cheerio');
    const axios = require('axios');

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    // Extraer datos de la página
    const title = $('h1.main-info__title-main').text().trim();
    const description = $('.comment').text().trim();
    const priceText = $('.info-data-price span').first().text().trim();
    const price = parseFloat(priceText.replace(/[€.,\s]/g, ''));

    // Características
    const features: any = {};
    $('.info-features li').each((i: number, el: any) => {
      const text = $(el).text().trim();
      
      if (text.includes('hab.') || text.includes('habitación')) {
        features.bedrooms = parseInt(text.match(/\d+/)?.[0] || '0');
      }
      if (text.includes('baño')) {
        features.bathrooms = parseInt(text.match(/\d+/)?.[0] || '0');
      }
      if (text.includes('m²')) {
        features.squareMeters = parseInt(text.match(/\d+/)?.[0] || '0');
      }
    });

    // Dirección
    const addressText = $('.main-info__title-minor').text().trim();
    const [street, ...rest] = addressText.split(',');
    const city = rest.join(',').trim();

    // Imágenes
    const images: string[] = [];
    $('.detail-multimedia-gallery img').each((i: number, el: any) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !src.includes('placeholder')) {
        images.push(src);
      }
    });

    // Fecha de publicación
    const listingDateText = $('.stats-text').text();
    const listingDate = this.parseSpanishDate(listingDateText);

    return {
      externalId: this.extractIdealistaId(url),
      portal: 'idealista',
      url,
      title,
      description,
      price,
      propertyType: this.inferPropertyType(title),
      address: {
        street,
        city,
        province: '', // Extraer de la dirección
      },
      features,
      images,
      listingDate,
      lastUpdate: new Date(),
    };
  }

  /**
   * Scraping de Pisos.com
   */
  private static async scrapePisos(url: string): Promise<PropertyData> {
    const cheerio = require('cheerio');
    const axios = require('axios');

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    const title = $('h1').first().text().trim();
    const description = $('.description-text').text().trim();
    const priceText = $('.price').first().text().trim();
    const price = parseFloat(priceText.replace(/[€.,\s]/g, ''));

    const features: any = {};
    $('.characteristics-list li').each((i: number, el: any) => {
      const text = $(el).text().trim();
      
      if (text.includes('dormitorio')) {
        features.bedrooms = parseInt(text.match(/\d+/)?.[0] || '0');
      }
      if (text.includes('baño')) {
        features.bathrooms = parseInt(text.match(/\d+/)?.[0] || '0');
      }
      if (text.includes('m²') || text.includes('m2')) {
        features.squareMeters = parseInt(text.match(/\d+/)?.[0] || '0');
      }
    });

    const addressText = $('.location').text().trim();
    const [city, province] = addressText.split(',').map(s => s.trim());

    const images: string[] = [];
    $('.gallery-image img').each((i: number, el: any) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) images.push(src);
    });

    return {
      externalId: this.extractPisosId(url),
      portal: 'pisos',
      url,
      title,
      description,
      price,
      propertyType: this.inferPropertyType(title),
      address: {
        city: city || '',
        province: province || '',
      },
      features,
      images,
      listingDate: new Date(),
      lastUpdate: new Date(),
    };
  }

  /**
   * Análisis de mercado para una propiedad
   */
  static async analyzeMarket(property: {
    city: string;
    propertyType: string;
    squareMeters?: number;
    bedrooms?: number;
  }): Promise<MarketAnalysis> {
    try {
      // Buscar propiedades similares
      const similarProperties = await this.searchSimilarProperties(property);

      if (similarProperties.length === 0) {
        throw new Error('No se encontraron propiedades similares');
      }

      // Calcular estadísticas
      const prices = similarProperties.map(p => p.price).filter(p => p > 0);
      const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const medianPrice = this.calculateMedian(prices);
      
      const pricesPerSqm = similarProperties
        .filter(p => p.features.squareMeters && p.features.squareMeters > 0)
        .map(p => p.price / p.features.squareMeters!);
      const pricePerSqm = pricesPerSqm.length > 0
        ? pricesPerSqm.reduce((sum, p) => sum + p, 0) / pricesPerSqm.length
        : 0;

      // Determinar tendencia (simplificado)
      const marketTrend: 'growing' | 'stable' | 'declining' = 'stable';

      // Comparar precio
      let priceComparison: 'above_market' | 'at_market' | 'below_market' = 'at_market';
      if (property.squareMeters) {
        const propertyPricePerSqm = averagePrice / property.squareMeters;
        if (propertyPricePerSqm > pricePerSqm * 1.1) {
          priceComparison = 'above_market';
        } else if (propertyPricePerSqm < pricePerSqm * 0.9) {
          priceComparison = 'below_market';
        }
      }

      return {
        averagePrice,
        medianPrice,
        pricePerSqm,
        marketTrend,
        competingListings: similarProperties.length,
        averageDaysOnMarket: 30, // Dato estimado
        priceComparison,
        similarProperties: similarProperties.slice(0, 10),
      };
    } catch (error) {
      console.error('Error analizando mercado:', error);
      throw new Error('No se pudo analizar el mercado');
    }
  }

  /**
   * Busca propiedades similares
   */
  private static async searchSimilarProperties(criteria: {
    city: string;
    propertyType: string;
    squareMeters?: number;
    bedrooms?: number;
  }): Promise<PropertyData[]> {
    const results: PropertyData[] = [];

    // Buscar en Idealista
    try {
      const idealistaResults = await this.searchIdealista(criteria);
      results.push(...idealistaResults);
    } catch (error) {
      console.error('Error buscando en Idealista:', error);
    }

    // Buscar en Pisos.com
    try {
      const pisosResults = await this.searchPisos(criteria);
      results.push(...pisosResults);
    } catch (error) {
      console.error('Error buscando en Pisos.com:', error);
    }

    return results;
  }

  /**
   * Búsqueda en Idealista
   */
  private static async searchIdealista(criteria: any): Promise<PropertyData[]> {
    // Implementación de búsqueda en Idealista
    // Por ahora retornamos array vacío
    return [];
  }

  /**
   * Búsqueda en Pisos.com
   */
  private static async searchPisos(criteria: any): Promise<PropertyData[]> {
    // Implementación de búsqueda en Pisos.com
    return [];
  }

  /**
   * API oficial de Idealista
   */
  private static async fetchFromIdealistaAPI(unitId: string): Promise<PropertyData> {
    const axios = require('axios');

    const response = await axios.get(
      `${this.IDEALISTA_API_URL}/properties/${unitId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.IDEALISTA_API_KEY}`,
        },
      }
    );

    // Mapear respuesta de API a nuestro formato
    const data = response.data;
    
    return {
      externalId: unitId,
      portal: 'idealista',
      url: data.url,
      title: data.title,
      description: data.description,
      price: data.price,
      propertyType: data.propertyType,
      address: {
        street: data.address?.street,
        city: data.address?.city,
        province: data.address?.province,
        postalCode: data.address?.postalCode,
        coordinates: data.coordinates,
      },
      features: {
        bedrooms: data.rooms,
        bathrooms: data.bathrooms,
        squareMeters: data.size,
        floor: data.floor,
        hasElevator: data.hasLift,
        hasParking: data.parkingSpace?.hasParkingSpace,
        hasGarden: data.hasGarden,
        hasPool: data.hasSwimmingPool,
        hasAirConditioning: data.hasAirConditioning,
        energyRating: data.energyCertification?.energyConsumption,
      },
      images: data.multimedia?.images || [],
      contactInfo: data.contact,
      listingDate: new Date(data.publishDate),
      lastUpdate: new Date(data.modificationDate),
    };
  }

  /**
   * API de Pisos.com
   */
  private static async fetchFromPisosAPI(unitId: string): Promise<PropertyData> {
    // Similar a Idealista
    throw new Error('API de Pisos.com no implementada');
  }

  /**
   * Guarda propiedad importada en base de datos
   */
  static async saveImportedProperty(
    userId: string,
    propertyData: PropertyData,
    createInvestmentAnalysis: boolean = false
  ) {
    const { prisma } = require('@/lib/prisma');

    const property = await prisma.property.create({
      data: {
        userId,
        externalId: propertyData.externalId,
        externalPortal: propertyData.portal,
        externalUrl: propertyData.url,
        titulo: propertyData.title,
        descripcion: propertyData.description,
        precio: propertyData.price,
        propertyType: this.mapPropertyType(propertyData.propertyType),
        direccion: `${propertyData.address.street || ''}, ${propertyData.address.city}`,
        ciudad: propertyData.address.city,
        provincia: propertyData.address.province,
        codigoPostal: propertyData.address.postalCode,
        habitaciones: propertyData.features.bedrooms,
        banos: propertyData.features.bathrooms,
        metrosCuadrados: propertyData.features.squareMeters,
        imagen: propertyData.images[0],
        imagenes: propertyData.images,
        caracteristicas: propertyData.features,
      },
    });

    // Crear análisis de inversión automático si se solicita
    if (createInvestmentAnalysis) {
      const { InvestmentAnalysisService } = require('./investment-analysis-service');
      
      // Estimar renta basada en precio (simplificación: 0.6% mensual)
      const estimatedRent = propertyData.price * 0.006;
      
      // Crear análisis con valores por defecto
      await InvestmentAnalysisService.saveAnalysis(
        userId,
        {
          assetType: this.mapAssetType(propertyData.propertyType),
          unitId: property.id,
          purchasePrice: propertyData.price,
          monthlyRent: estimatedRent,
          // ... otros valores por defecto
          notaryAndRegistry: propertyData.price * 0.01,
          transferTax: propertyData.price * 0.1,
          agencyFees: propertyData.price * 0.02,
          renovationCosts: 0,
          furnitureCosts: 0,
          initialLegalFees: 1000,
          otherInitialCosts: 0,
          isFinanced: true,
          loanAmount: propertyData.price * 0.8,
          interestRate: 3.5,
          loanTerm: 25,
          downPayment: propertyData.price * 0.2,
          communityFees: 80,
          propertyTax: 500,
          insurance: 300,
          maintenanceRate: 1,
          propertyManagementFee: 0,
          vacancyRate: 5,
          incomeTaxRate: 21,
          capitalGainsTaxRate: 19,
          wealthTaxApplicable: false,
          appreciationRate: 3,
          rentIncreaseRate: 2,
          inflationRate: 2.5,
          holdingPeriod: 10,
        },
        {} as any, // Results se calcularán
        `Análisis automático - ${propertyData.title}`
      );
    }

    return property;
  }

  // Utilidades
  private static extractIdealistaId(url: string): string {
    const match = url.match(/inmueble\/(\d+)/);
    return match ? match[1] : '';
  }

  private static extractPisosId(url: string): string {
    const match = url.match(/vivienda-(\d+)/);
    return match ? match[1] : '';
  }

  private static inferPropertyType(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('piso') || lower.includes('apartamento')) return 'piso';
    if (lower.includes('casa') || lower.includes('chalet')) return 'casa';
    if (lower.includes('local')) return 'local';
    if (lower.includes('garaje') || lower.includes('parking')) return 'garaje';
    if (lower.includes('trastero')) return 'trastero';
    if (lower.includes('edificio')) return 'edificio';
    return 'piso';
  }

  private static mapPropertyType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'piso': 'PISO',
      'apartamento': 'PISO',
      'casa': 'CASA',
      'chalet': 'CASA',
      'local': 'LOCAL',
      'garaje': 'GARAJE',
      'trastero': 'TRASTERO',
      'edificio': 'EDIFICIO',
    };
    return typeMap[type.toLowerCase()] || 'PISO';
  }

  private static mapAssetType(type: string): 'piso' | 'local' | 'garaje' | 'trastero' | 'edificio' {
    const typeMap: { [key: string]: any } = {
      'piso': 'piso',
      'apartamento': 'piso',
      'local': 'local',
      'garaje': 'garaje',
      'trastero': 'trastero',
      'edificio': 'edificio',
    };
    return typeMap[type.toLowerCase()] || 'piso';
  }

  private static parseSpanishDate(text: string): Date {
    // Implementar parsing de fechas en español
    // "hace 2 días", "publicado el 15/01/2025", etc.
    return new Date();
  }

  private static calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}
