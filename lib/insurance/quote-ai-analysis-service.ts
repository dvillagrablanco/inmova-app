import Anthropic from '@anthropic-ai/sdk';
import logger from '@/lib/logger';
import type { PrismaClient } from '@prisma/client';

async function getPrisma(): Promise<PrismaClient> {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// ─── Types ───────────────────────────────────────────────────────────

export interface AIAnalysisResult {
  score: number;
  resumen: string;
  pros: string[];
  cons: string[];
  riesgosDetectados: string[];
  exclusionesImportantes: string[];
  recomendacion: string;
  comparacionMercado: string;
}

export interface AIComparisonResult {
  ranking: Array<{
    quotationId: string;
    provider: string;
    position: number;
    score: number;
    justificacion: string;
  }>;
  resumen: string;
  recomendacion: string;
  analisisDetallado: string;
}

export interface AIRenewalAnalysis {
  recomendacion: 'renovar' | 'cambiar' | 'negociar';
  score: number;
  resumen: string;
  comparativa: {
    precioActual: number;
    precioNuevo: number;
    diferenciaPrecio: number;
    diferenciaPorcentaje: number;
    coberturasGanadas: string[];
    coberturasPerdidas: string[];
  };
  pros: string[];
  cons: string[];
  justificacion: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  'Eres un experto analista de seguros inmobiliarios en España con 20 años de experiencia. Analiza propuestas de seguros con rigor técnico. Responde SIEMPRE en formato JSON válido.';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2048;

// ─── Helpers ─────────────────────────────────────────────────────────

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function defaultAnalysisResult(message: string): AIAnalysisResult {
  return {
    score: 0,
    resumen: message,
    pros: [],
    cons: [],
    riesgosDetectados: [],
    exclusionesImportantes: [],
    recomendacion: message,
    comparacionMercado: message,
  };
}

function parseJSONResponse<T>(text: string): T {
  const cleaned = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
  return JSON.parse(cleaned);
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Analyze a single insurance quotation using Claude.
 * Saves the AI analysis results back to the quotation record.
 */
export async function analyzeQuotation(quotationId: string): Promise<AIAnalysisResult> {
  try {
    const prisma = await getPrisma();

    const quotation = await prisma.insuranceQuotation.findUnique({
      where: { id: quotationId },
      include: { provider: true },
    });

    if (!quotation) {
      throw new Error(`Quotation ${quotationId} not found`);
    }

    const client = getAnthropicClient();
    if (!client) {
      logger.warn('Anthropic API key not configured, returning default analysis');
      return defaultAnalysisResult('API key not configured');
    }

    const prompt = `Analiza la siguiente cotización de seguro inmobiliario y proporciona un análisis detallado.

COTIZACIÓN:
- Proveedor: ${quotation.provider.nombre}
- Tipo de seguro: ${quotation.tipoSeguro}
- Prima anual: ${quotation.primaAnual}€
- Prima mensual: ${quotation.primaMensual ?? 'No especificada'}€
- Suma asegurada: ${quotation.sumaAsegurada}€
- Franquicia/Deducible: ${quotation.franquicia ?? 'No especificada'}€
- Coberturas incluidas: ${JSON.stringify(quotation.coberturas)}
- Exclusiones: ${JSON.stringify(quotation.exclusiones)}
- Condiciones especiales: ${quotation.condicionesEspeciales ?? 'Ninguna'}

EVALÚA:
1. Relación coberturas vs precio
2. Exclusiones peligrosas para el asegurado
3. Condiciones especiales problemáticas
4. Relación calidad-precio general
5. Riesgos potenciales no cubiertos

Responde en JSON con esta estructura exacta:
{
  "score": <número 0-100>,
  "resumen": "<resumen general en 2-3 frases>",
  "pros": ["<ventaja1>", "<ventaja2>", ...],
  "cons": ["<desventaja1>", "<desventaja2>", ...],
  "riesgosDetectados": ["<riesgo1>", "<riesgo2>", ...],
  "exclusionesImportantes": ["<exclusion1>", "<exclusion2>", ...],
  "recomendacion": "<recomendación clara para el cliente>",
  "comparacionMercado": "<cómo se compara con el mercado español actual>"
}`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    const result = parseJSONResponse<AIAnalysisResult>(responseText);

    await prisma.insuranceQuotation.update({
      where: { id: quotationId },
      data: {
        analisisIA: result as any,
        scoreIA: result.score,
      },
    });

    logger.info('AI quotation analysis completed', {
      quotationId,
      score: result.score,
    });

    return result;
  } catch (error: any) {
    logger.error('Error analyzing quotation with AI', {
      quotationId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Compare multiple quotations using Claude and return a ranked analysis.
 */
export async function compareQuotationsWithAI(quotationIds: string[]): Promise<AIComparisonResult> {
  try {
    if (quotationIds.length < 2) {
      throw new Error('At least 2 quotation IDs are required for comparison');
    }

    const prisma = await getPrisma();

    const quotations = await prisma.insuranceQuotation.findMany({
      where: { id: { in: quotationIds } },
      include: { provider: true },
    });

    if (quotations.length < 2) {
      throw new Error('At least 2 valid quotations are required for comparison');
    }

    const client = getAnthropicClient();
    if (!client) {
      logger.warn('Anthropic API key not configured, returning default comparison');
      return {
        ranking: quotations.map((q, i) => ({
          quotationId: q.id,
          provider: q.provider.nombre,
          position: i + 1,
          score: 0,
          justificacion: 'API key not configured',
        })),
        resumen: 'API key not configured',
        recomendacion: 'API key not configured',
        analisisDetallado: 'API key not configured',
      };
    }

    const quotationDetails = quotations
      .map(
        (q, i) => `
COTIZACIÓN ${i + 1} (ID: ${q.id}):
- Proveedor: ${q.provider.nombre}
- Tipo: ${q.tipoSeguro}
- Prima anual: ${q.primaAnual}€
- Prima mensual: ${q.primaMensual ?? 'N/A'}€
- Suma asegurada: ${q.sumaAsegurada}€
- Franquicia: ${q.franquicia ?? 'N/A'}€
- Coberturas: ${JSON.stringify(q.coberturas)}
- Exclusiones: ${JSON.stringify(q.exclusiones)}
- Condiciones especiales: ${q.condicionesEspeciales ?? 'Ninguna'}`
      )
      .join('\n');

    const prompt = `Compara las siguientes cotizaciones de seguros inmobiliarios y proporciona un ranking con recomendación.

${quotationDetails}

Analiza considerando: precio, coberturas, exclusiones, franquicia, condiciones especiales y relación calidad-precio.

Responde en JSON con esta estructura exacta:
{
  "ranking": [
    {
      "quotationId": "<id>",
      "provider": "<nombre>",
      "position": <número>,
      "score": <0-100>,
      "justificacion": "<por qué esta posición>"
    }
  ],
  "resumen": "<resumen comparativo en 3-4 frases>",
  "recomendacion": "<recomendación clara de cuál elegir y por qué>",
  "analisisDetallado": "<análisis detallado de las diferencias clave>"
}`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    const result = parseJSONResponse<AIComparisonResult>(responseText);

    logger.info('AI quotation comparison completed', {
      count: quotations.length,
      topProvider: result.ranking[0]?.provider,
    });

    return result;
  } catch (error: any) {
    logger.error('Error comparing quotations with AI', {
      quotationIds,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Analyze whether to renew an existing insurance or switch to a new quotation.
 */
export async function analyzeRenewalProposal(
  currentInsuranceId: string,
  newQuotationId: string
): Promise<AIRenewalAnalysis> {
  try {
    const prisma = await getPrisma();

    const [currentInsurance, newQuotation] = await Promise.all([
      prisma.insurance.findUnique({ where: { id: currentInsuranceId } }),
      prisma.insuranceQuotation.findUnique({
        where: { id: newQuotationId },
        include: { provider: true },
      }),
    ]);

    if (!currentInsurance) {
      throw new Error(`Insurance ${currentInsuranceId} not found`);
    }
    if (!newQuotation) {
      throw new Error(`Quotation ${newQuotationId} not found`);
    }

    const currentCoberturas: string[] = currentInsurance.cobertura
      ? currentInsurance.cobertura
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : [];

    const client = getAnthropicClient();
    if (!client) {
      logger.warn('Anthropic API key not configured, returning default renewal analysis');
      const priceDiff = newQuotation.primaAnual - (currentInsurance.primaAnual ?? 0);
      const pricePct =
        currentInsurance.primaAnual && currentInsurance.primaAnual > 0
          ? (priceDiff / currentInsurance.primaAnual) * 100
          : 0;

      return {
        recomendacion: 'negociar',
        score: 0,
        resumen: 'API key not configured',
        comparativa: {
          precioActual: currentInsurance.primaAnual ?? 0,
          precioNuevo: newQuotation.primaAnual,
          diferenciaPrecio: Math.round(priceDiff * 100) / 100,
          diferenciaPorcentaje: Math.round(pricePct * 100) / 100,
          coberturasGanadas: [],
          coberturasPerdidas: [],
        },
        pros: [],
        cons: [],
        justificacion: 'API key not configured',
      };
    }

    const prompt = `Compara el seguro actual con la nueva propuesta de renovación/cambio y recomienda la mejor opción.

SEGURO ACTUAL:
- Aseguradora: ${currentInsurance.aseguradora}
- Número de póliza: ${currentInsurance.numeroPoliza}
- Tipo: ${currentInsurance.tipo}
- Prima anual: ${currentInsurance.primaAnual ?? 'No especificada'}€
- Prima mensual: ${currentInsurance.primaMensual ?? 'No especificada'}€
- Suma asegurada: ${currentInsurance.sumaAsegurada ?? 'No especificada'}€
- Franquicia: ${currentInsurance.franquicia ?? 'No especificada'}€
- Coberturas: ${JSON.stringify(currentCoberturas)}
- Fecha vencimiento: ${currentInsurance.fechaVencimiento.toISOString().split('T')[0]}
- Renovación automática: ${currentInsurance.renovacionAutomatica ? 'Sí' : 'No'}

NUEVA PROPUESTA:
- Proveedor: ${newQuotation.provider.nombre}
- Tipo: ${newQuotation.tipoSeguro}
- Prima anual: ${newQuotation.primaAnual}€
- Prima mensual: ${newQuotation.primaMensual ?? 'No especificada'}€
- Suma asegurada: ${newQuotation.sumaAsegurada}€
- Franquicia: ${newQuotation.franquicia ?? 'No especificada'}€
- Coberturas: ${JSON.stringify(newQuotation.coberturas)}
- Exclusiones: ${JSON.stringify(newQuotation.exclusiones)}
- Condiciones especiales: ${newQuotation.condicionesEspeciales ?? 'Ninguna'}

Responde en JSON con esta estructura exacta:
{
  "recomendacion": "<'renovar' | 'cambiar' | 'negociar'>",
  "score": <0-100 confianza en la recomendación>,
  "resumen": "<resumen en 2-3 frases>",
  "comparativa": {
    "precioActual": <número>,
    "precioNuevo": <número>,
    "diferenciaPrecio": <número, positivo=más caro>,
    "diferenciaPorcentaje": <número>,
    "coberturasGanadas": ["<cobertura nueva no en actual>"],
    "coberturasPerdidas": ["<cobertura actual no en nueva>"]
  },
  "pros": ["<ventaja del cambio>"],
  "cons": ["<desventaja del cambio>"],
  "justificacion": "<justificación detallada de la recomendación>"
}`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    const result = parseJSONResponse<AIRenewalAnalysis>(responseText);

    logger.info('AI renewal analysis completed', {
      currentInsuranceId,
      newQuotationId,
      recomendacion: result.recomendacion,
    });

    return result;
  } catch (error: any) {
    logger.error('Error analyzing renewal proposal with AI', {
      currentInsuranceId,
      newQuotationId,
      error: error.message,
    });
    throw error;
  }
}
