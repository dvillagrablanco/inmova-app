import Anthropic from '@anthropic-ai/sdk';

import logger from '@/lib/logger';
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface PropertyData {
  address: string;
  city: string;
  neighborhood?: string;
  postalCode?: string;
  squareMeters: number;
  rooms?: number;
  bathrooms?: number;
  floor?: number;
  condition?: string;
  yearBuilt?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGarden?: boolean;
  hasPool?: boolean;
  aireAcondicionado?: boolean;
  calefaccion?: boolean;
  terraza?: boolean;
  balcon?: boolean;
  orientacion?: string;
}

interface MarketData {
  avgPricePerM2: number;
  marketTrend: 'UP' | 'DOWN' | 'STABLE';
  similarProperties?: Array<{
    address: string;
    price: number;
    squareMeters: number;
    distance?: number;
  }>;
}

export interface ValuationResult {
  estimatedValue: number;
  minValue: number;
  maxValue: number;
  confidenceScore: number; // 0-100
  pricePerM2: number;
  reasoning: string;
  keyFactors: string[];
  marketComparison: string;
  investmentPotential: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
}

export class AIValuationService {
  /**
   * Valora una propiedad usando IA (Claude)
   */
  static async valuateProperty(
    propertyData: PropertyData,
    marketData?: MarketData
  ): Promise<ValuationResult> {
    // Validar API key
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no configurada');
    }

    // Construir prompt detallado
    const prompt = this.buildValuationPrompt(propertyData, marketData);

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.3, // Baja temperatura para respuestas más consistentes
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Respuesta inesperada de la IA');
      }

      // Parsear respuesta JSON
      const result = JSON.parse(content.text);
      
      // Validar estructura
      this.validateValuationResult(result);

      return result;
    } catch (error: any) {
      logger.error('[AI Valuation Error]:', error);
      throw new Error(`Error en valoración: ${error.message}`);
    }
  }

  /**
   * Construye el prompt para la IA
   */
  private static buildValuationPrompt(
    property: PropertyData,
    market?: MarketData
  ): string {
    let prompt = `Eres un tasador inmobiliario certificado con 20 años de experiencia en España.

Tu tarea es valorar esta propiedad con precisión profesional.

## PROPIEDAD A VALORAR

**Ubicación:**
- Dirección: ${property.address}
- Ciudad: ${property.city}
${property.neighborhood ? `- Barrio: ${property.neighborhood}` : ''}
${property.postalCode ? `- Código Postal: ${property.postalCode}` : ''}

**Características Principales:**
- Superficie: ${property.squareMeters}m²
${property.rooms ? `- Habitaciones: ${property.rooms}` : ''}
${property.bathrooms ? `- Baños: ${property.bathrooms}` : ''}
${property.floor !== undefined ? `- Planta: ${property.floor}` : ''}
${property.orientacion ? `- Orientación: ${property.orientacion}` : ''}

**Estado y Equipamiento:**
${property.condition ? `- Estado: ${property.condition}` : ''}
${property.yearBuilt ? `- Año construcción: ${property.yearBuilt}` : ''}
${property.aireAcondicionado ? '- ✓ Aire Acondicionado' : ''}
${property.calefaccion ? '- ✓ Calefacción' : ''}
${property.terraza ? '- ✓ Terraza' : ''}
${property.balcon ? '- ✓ Balcón' : ''}
${property.hasElevator ? '- ✓ Ascensor' : ''}
${property.hasParking ? '- ✓ Parking' : ''}`;

    if (market) {
      prompt += `\n\n## DATOS DEL MERCADO

- Precio medio por m² en la zona: €${market.avgPricePerM2.toLocaleString()}
- Tendencia del mercado: ${market.marketTrend === 'UP' ? 'Al alza' : market.marketTrend === 'DOWN' ? 'A la baja' : 'Estable'}`;

      if (market.similarProperties && market.similarProperties.length > 0) {
        prompt += '\n\n**Propiedades Similares Cercanas:**';
        market.similarProperties.forEach((prop, i) => {
          prompt += `\n${i + 1}. ${prop.address}: €${prop.price.toLocaleString()} (${prop.squareMeters}m²) = €${(prop.price / prop.squareMeters).toFixed(2)}/m²`;
        });
      }
    }

    prompt += `\n\n## INSTRUCCIONES

Proporciona una valoración detallada en formato JSON con la siguiente estructura:

\`\`\`json
{
  "estimatedValue": number,           // Valor estimado en euros
  "minValue": number,                 // Valor mínimo del rango
  "maxValue": number,                 // Valor máximo del rango
  "confidenceScore": number,          // 0-100, tu nivel de confianza
  "pricePerM2": number,              // Precio por metro cuadrado
  "reasoning": "string",              // 2-3 párrafos explicando tu valoración
  "keyFactors": ["string"],          // 3-5 factores clave que afectan el precio
  "marketComparison": "string",      // Comparación con el mercado local
  "investmentPotential": "LOW|MEDIUM|HIGH",  // Potencial de inversión
  "recommendations": ["string"]       // 2-3 recomendaciones para mejorar valor
}
\`\`\`

**Criterios de valoración:**
1. Usa datos de mercado reales si están disponibles
2. Considera la ubicación y accesibilidad
3. Evalúa el estado y equipamiento
4. Analiza tendencias del mercado
5. Sé conservador pero realista
6. Justifica tu razonamiento

**IMPORTANTE:** Responde SOLO con el JSON, sin texto adicional.`;

    return prompt;
  }

  /**
   * Valida que el resultado tenga la estructura correcta
   */
  private static validateValuationResult(result: any): void {
    const required = [
      'estimatedValue',
      'minValue',
      'maxValue',
      'confidenceScore',
      'pricePerM2',
      'reasoning',
      'keyFactors',
      'marketComparison',
      'investmentPotential',
      'recommendations',
    ];

    for (const field of required) {
      if (!(field in result)) {
        throw new Error(`Campo requerido faltante: ${field}`);
      }
    }

    // Validar tipos
    if (typeof result.estimatedValue !== 'number' || result.estimatedValue <= 0) {
      throw new Error('estimatedValue debe ser un número positivo');
    }

    if (result.confidenceScore < 0 || result.confidenceScore > 100) {
      throw new Error('confidenceScore debe estar entre 0 y 100');
    }

    if (!['LOW', 'MEDIUM', 'HIGH'].includes(result.investmentPotential)) {
      throw new Error('investmentPotential debe ser LOW, MEDIUM o HIGH');
    }
  }

  /**
   * Obtiene datos del mercado local (simulado - en producción usar APIs reales)
   */
  static async getMarketData(
    city: string,
    neighborhood?: string,
    postalCode?: string
  ): Promise<MarketData> {
    // En producción, esto llamaría a APIs como Idealista, Fotocasa, etc.
    // Por ahora, retornamos datos simulados basados en promedios de España
    
    const cityAverages: Record<string, number> = {
      madrid: 3500,
      barcelona: 4200,
      valencia: 2100,
      sevilla: 1800,
      bilbao: 3200,
      málaga: 2400,
      default: 2000,
    };

    const cityKey = city.toLowerCase();
    const avgPricePerM2 = cityAverages[cityKey] || cityAverages.default;

    // Simular tendencia (en producción vendría de datos históricos)
    const marketTrend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';

    return {
      avgPricePerM2,
      marketTrend,
      similarProperties: [], // En producción, buscar propiedades similares
    };
  }

  /**
   * Genera recomendaciones de mejora para incrementar el valor
   */
  static async getImprovementRecommendations(
    propertyData: PropertyData,
    currentValuation: ValuationResult
  ): Promise<Array<{ improvement: string; estimatedCost: number; valueIncrease: number; roi: number }>> {
    const prompt = `Eres un consultor inmobiliario experto.

Basándote en esta propiedad:
- Superficie: ${propertyData.squareMeters}m²
- Habitaciones: ${propertyData.rooms || 'N/A'}
- Valor actual: €${currentValuation.estimatedValue.toLocaleString()}

Proporciona 3-5 mejoras específicas que aumentarían su valor.

Responde en JSON:
\`\`\`json
[
  {
    "improvement": "descripción de la mejora",
    "estimatedCost": número (euros),
    "valueIncrease": número (euros),
    "roi": número (porcentaje)
  }
]
\`\`\``;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
    } catch (error) {
      logger.error('[AI Recommendations Error]:', error);
    }

    return [];
  }
}
