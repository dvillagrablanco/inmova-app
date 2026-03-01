/**
 * ANÁLISIS INTELIGENTE DE PROPIEDADES CON IA MULTI-PASO
 *
 * La valoración se realiza en 2 fases de IA:
 *
 * FASE 1 — Análisis de comparables (modelo rápido)
 *   La IA analiza los comparables scrapeados de todos los portales y:
 *   - Filtra los más relevantes por similitud real con la propiedad
 *   - Asigna un score de similitud inteligente (no solo por m²)
 *   - Detecta outliers de precio y los descarta
 *   - Identifica patrones de la zona (tendencia, demanda, perfil)
 *
 * FASE 2 — Valoración experta (modelo principal)
 *   Con los comparables filtrados y el análisis de zona, la IA:
 *   - Cruza datos de múltiples plataformas (Idealista, Fotocasa, Notariado, INE)
 *   - Aplica su conocimiento del mercado español
 *   - Genera valoración con reasoning detallado
 *   - Proporciona análisis de inversión (ROI, cap rate, alquiler)
 *   - Da recomendaciones de mejora de valor
 */

import Anthropic from '@anthropic-ai/sdk';
import logger from '@/lib/logger';
import { CLAUDE_MODEL_PRIMARY, CLAUDE_MODEL_FAST } from '@/lib/ai-model-config';
import type { AggregatedMarketData, PlatformComparable } from './external-platform-data-service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// ============================================================================
// TIPOS
// ============================================================================

export interface PropertyForAnalysis {
  address: string;
  city: string;
  postalCode: string;
  province?: string;
  neighborhood?: string;
  squareMeters: number;
  rooms: number;
  bathrooms: number;
  floor?: number;
  condition: string;
  yearBuilt?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGarden?: boolean;
  hasPool?: boolean;
  hasTerrace?: boolean;
  hasGarage?: boolean;
  orientacion?: string;
  caracteristicas?: string[];
  descripcionAdicional?: string;
  finalidad?: string;
}

export interface AnalyzedComparable {
  address: string;
  price: number;
  pricePerM2: number;
  squareMeters: number;
  rooms?: number;
  source: string;
  url?: string;
  similarityScore: number; // 0-100, asignado por IA
  similarityReason: string;
  priceAdjusted: number; // Precio ajustado por diferencias con la propiedad
}

export interface ZoneAnalysis {
  profile: string;
  priceRange: { min: number; max: number };
  dominantPricePerM2: number;
  trend: string;
  demandLevel: string;
  outliersPricePerM2: number[];
  keyInsights: string[];
}

export interface Phase1Result {
  analyzedComparables: AnalyzedComparable[];
  zoneAnalysis: ZoneAnalysis;
  rawComparablesCount: number;
  filteredCount: number;
}

export interface AIValuationResult {
  // Valores
  estimatedValue: number;
  minValue: number;
  maxValue: number;
  precioM2: number;
  confidenceScore: number;

  // Análisis IA
  reasoning: string;
  analisisMercado: string;
  metodologiaUsada: string;

  // Tendencia
  tendenciaMercado: 'alcista' | 'bajista' | 'estable';
  porcentajeTendencia: number;
  tiempoEstimadoVenta: string;

  // Inversión — Larga estancia (12+ meses)
  alquilerEstimado: number;
  rentabilidadAlquiler: number;
  capRate: number;

  // Media estancia (1-11 meses)
  alquilerMediaEstancia: number | null;
  alquilerMediaEstanciaMin: number | null;
  alquilerMediaEstanciaMax: number | null;
  rentabilidadMediaEstancia: number | null;
  perfilInquilinoMediaEstancia: string | null;
  ocupacionEstimadaMediaEstancia: number | null; // % anual

  // Factores
  factoresPositivos: string[];
  factoresNegativos: string[];
  recomendaciones: string[];

  // Comparables analizados por IA
  comparables: Array<{
    direccion: string;
    precio: number;
    superficie: number;
    precioM2: number;
    similitud: number;
    fuente: string;
  }>;

  // Metadatos del análisis
  phase1Summary: string;
  sourcesUsed: string[];
}

// ============================================================================
// FASE 1: ANÁLISIS DE COMPARABLES CON IA
// ============================================================================

async function runPhase1Analysis(
  property: PropertyForAnalysis,
  allComparables: PlatformComparable[],
  platformSummary: string,
): Promise<Phase1Result> {
  if (allComparables.length === 0) {
    return {
      analyzedComparables: [],
      zoneAnalysis: {
        profile: 'Sin datos suficientes',
        priceRange: { min: 0, max: 0 },
        dominantPricePerM2: 0,
        trend: 'estable',
        demandLevel: 'media',
        outliersPricePerM2: [],
        keyInsights: ['No se encontraron comparables en los portales para esta zona'],
      },
      rawComparablesCount: 0,
      filteredCount: 0,
    };
  }

  const comparablesText = allComparables
    .slice(0, 30) // Limitar para no exceder tokens
    .map(
      (c, i) =>
        `${i + 1}. [${c.source}] ${c.address} — ${c.price}€ (${c.squareMeters}m², ${c.pricePerM2}€/m²)${c.rooms ? ` ${c.rooms}hab` : ''}${c.bathrooms ? ` ${c.bathrooms}baños` : ''}`,
    )
    .join('\n');

  const prompt = `Eres un analista inmobiliario experto. Tu tarea es analizar comparables de mercado.

PROPIEDAD OBJETIVO:
- Ubicación: ${property.address}, ${property.city} (${property.postalCode})
- Superficie: ${property.squareMeters}m²
- Habitaciones: ${property.rooms} | Baños: ${property.bathrooms}
- Estado: ${property.condition}
${property.floor ? `- Planta: ${property.floor}` : ''}
${property.yearBuilt ? `- Año: ${property.yearBuilt}` : ''}
${property.hasElevator ? '- Ascensor: Sí' : ''}${property.hasParking ? ' - Parking: Sí' : ''}${property.hasTerrace ? ' - Terraza: Sí' : ''}

COMPARABLES ENCONTRADOS EN PORTALES (${allComparables.length} total):
${comparablesText}

TAREA:
1. Analiza cada comparable y puntúa su SIMILITUD REAL (0-100) con la propiedad objetivo
   - Considera: ubicación, superficie (±20% = buena similitud), habitaciones, estado
   - Penaliza diferencias grandes de superficie o ubicación distinta
2. Identifica OUTLIERS de precio (precios que se desvían >30% de la mediana)
3. Selecciona los 5-8 comparables MÁS RELEVANTES
4. Analiza el PERFIL DE LA ZONA (tipo de comprador, rango de precios, tendencia)

Responde SOLO con JSON:
{
  "analyzedComparables": [
    {
      "originalIndex": <número>,
      "similarityScore": <0-100>,
      "similarityReason": "<por qué es similar/diferente>",
      "isOutlier": <boolean>,
      "priceAdjustment": <factor de ajuste, ej: 1.05 si la propiedad objetivo es ligeramente mejor>
    }
  ],
  "zoneAnalysis": {
    "profile": "<perfil de la zona en 1-2 frases>",
    "dominantPricePerM2": <precio/m² más representativo de la zona>,
    "trend": "<alcista|bajista|estable>",
    "demandLevel": "<alta|media|baja>",
    "keyInsights": ["<insight1>", "<insight2>", "<insight3>"]
  }
}`;

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL_FAST,
      max_tokens: 2048,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0];
    if (text.type !== 'text') throw new Error('No text in response');

    const jsonMatch = text.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const analysis = JSON.parse(jsonMatch[0]);

    // Mapear resultado a nuestros tipos
    const analyzedComparables: AnalyzedComparable[] = [];
    for (const ac of analysis.analyzedComparables || []) {
      const idx = ac.originalIndex - 1;
      if (idx < 0 || idx >= allComparables.length) continue;
      if (ac.isOutlier) continue;
      if (ac.similarityScore < 40) continue;

      const original = allComparables[idx];
      analyzedComparables.push({
        address: original.address,
        price: original.price,
        pricePerM2: original.pricePerM2,
        squareMeters: original.squareMeters,
        rooms: original.rooms,
        source: original.source,
        url: original.url,
        similarityScore: ac.similarityScore,
        similarityReason: ac.similarityReason,
        priceAdjusted: Math.round(original.price * (ac.priceAdjustment || 1)),
      });
    }

    analyzedComparables.sort((a, b) => b.similarityScore - a.similarityScore);

    const pricesPerM2 = allComparables.map((c) => c.pricePerM2).sort((a, b) => a - b);
    const medianPrice = pricesPerM2[Math.floor(pricesPerM2.length / 2)] || 0;
    const outliers = pricesPerM2.filter(
      (p) => Math.abs(p - medianPrice) / medianPrice > 0.3,
    );

    return {
      analyzedComparables: analyzedComparables.slice(0, 8),
      zoneAnalysis: {
        profile: analysis.zoneAnalysis?.profile || 'Sin análisis disponible',
        priceRange: {
          min: pricesPerM2[0] || 0,
          max: pricesPerM2[pricesPerM2.length - 1] || 0,
        },
        dominantPricePerM2: analysis.zoneAnalysis?.dominantPricePerM2 || medianPrice,
        trend: analysis.zoneAnalysis?.trend || 'estable',
        demandLevel: analysis.zoneAnalysis?.demandLevel || 'media',
        outliersPricePerM2: outliers,
        keyInsights: analysis.zoneAnalysis?.keyInsights || [],
      },
      rawComparablesCount: allComparables.length,
      filteredCount: analyzedComparables.length,
    };
  } catch (error) {
    logger.warn('[AI Phase1] Error en análisis de comparables, usando fallback:', error);

    // Fallback: ordenar por diferencia de superficie
    const sorted = [...allComparables]
      .map((c) => ({
        ...c,
        diffM2: Math.abs(c.squareMeters - property.squareMeters),
      }))
      .sort((a, b) => a.diffM2 - b.diffM2)
      .slice(0, 8);

    return {
      analyzedComparables: sorted.map((c) => ({
        address: c.address,
        price: c.price,
        pricePerM2: c.pricePerM2,
        squareMeters: c.squareMeters,
        rooms: c.rooms,
        source: c.source,
        url: c.url,
        similarityScore: Math.max(40, 90 - c.diffM2),
        similarityReason: 'Ordenado por proximidad de superficie (fallback)',
        priceAdjusted: c.price,
      })),
      zoneAnalysis: {
        profile: 'Análisis automático (IA no disponible)',
        priceRange: { min: 0, max: 0 },
        dominantPricePerM2: 0,
        trend: 'estable',
        demandLevel: 'media',
        outliersPricePerM2: [],
        keyInsights: [],
      },
      rawComparablesCount: allComparables.length,
      filteredCount: sorted.length,
    };
  }
}

// ============================================================================
// FASE 2: VALORACIÓN EXPERTA CON IA
// ============================================================================

async function runPhase2Valuation(
  property: PropertyForAnalysis,
  phase1: Phase1Result,
  platformDataText: string,
  internalComparables: string,
): Promise<AIValuationResult> {
  const analyzedCompsText =
    phase1.analyzedComparables.length > 0
      ? phase1.analyzedComparables
          .map(
            (c, i) =>
              `${i + 1}. [${c.source}] ${c.address}: ${c.price}€ (${c.squareMeters}m², ${c.pricePerM2}€/m²)` +
              `\n   Similitud IA: ${c.similarityScore}% — ${c.similarityReason}` +
              `\n   Precio ajustado: ${c.priceAdjusted}€`,
          )
          .join('\n')
      : 'No hay comparables analizados.';

  const zoneText = `
ANÁLISIS DE ZONA (Fase 1 — IA):
- Perfil: ${phase1.zoneAnalysis.profile}
- Precio/m² dominante: ${phase1.zoneAnalysis.dominantPricePerM2}€/m²
- Rango: ${phase1.zoneAnalysis.priceRange.min}-${phase1.zoneAnalysis.priceRange.max}€/m²
- Tendencia: ${phase1.zoneAnalysis.trend}
- Demanda: ${phase1.zoneAnalysis.demandLevel}
${phase1.zoneAnalysis.keyInsights.length > 0 ? `- Insights: ${phase1.zoneAnalysis.keyInsights.join('; ')}` : ''}
${phase1.zoneAnalysis.outliersPricePerM2.length > 0 ? `- Outliers descartados: ${phase1.zoneAnalysis.outliersPricePerM2.length} precios atípicos` : ''}
- Comparables analizados: ${phase1.filteredCount} de ${phase1.rawComparablesCount} encontrados`;

  const features: string[] = [];
  if (property.hasElevator) features.push('Ascensor');
  if (property.hasParking) features.push('Parking');
  if (property.hasGarden) features.push('Jardín');
  if (property.hasPool) features.push('Piscina');
  if (property.hasTerrace) features.push('Terraza');
  if (property.hasGarage) features.push('Garaje');
  if (property.caracteristicas) features.push(...property.caracteristicas);

  const prompt = `Eres un tasador inmobiliario certificado con 20 años de experiencia en España.
Realizas una valoración profesional combinando tu conocimiento experto con datos reales del mercado.

═══════════════════════════════════════════════════════
PROPIEDAD A VALORAR
═══════════════════════════════════════════════════════
- Dirección: ${property.address}, ${property.city} (CP: ${property.postalCode})
${property.neighborhood ? `- Barrio: ${property.neighborhood}` : ''}
- Superficie: ${property.squareMeters}m²
- Habitaciones: ${property.rooms} | Baños: ${property.bathrooms}
${property.floor ? `- Planta: ${property.floor}` : ''}
- Estado: ${property.condition}
${property.yearBuilt ? `- Año construcción: ${property.yearBuilt}` : ''}
${property.orientacion ? `- Orientación: ${property.orientacion}` : ''}
${features.length > 0 ? `- Equipamiento: ${features.join(', ')}` : ''}
${property.descripcionAdicional ? `- Info adicional: ${property.descripcionAdicional}` : ''}
- Finalidad: ${property.finalidad || 'venta'}

═══════════════════════════════════════════════════════
DATOS DE MERCADO DE PLATAFORMAS (scraping en vivo)
═══════════════════════════════════════════════════════
${platformDataText}

═══════════════════════════════════════════════════════
COMPARABLES ANALIZADOS POR IA (Fase 1 — filtrados por similitud)
═══════════════════════════════════════════════════════
${analyzedCompsText}

${zoneText}

${internalComparables ? `═══════════════════════════════════════════════════════\nCOMPARABLES DEL PORTFOLIO INTERNO\n═══════════════════════════════════════════════════════\n${internalComparables}` : ''}

═══════════════════════════════════════════════════════
INSTRUCCIONES DE VALORACIÓN
═══════════════════════════════════════════════════════

Realiza una valoración profesional en 4 pasos:

PASO 1 — MÉTODO DE COMPARABLES:
- Usa los comparables con mayor similitud (>70%) como base
- Ajusta por diferencias (superficie, estado, equipamiento, planta)
- Pondera: Notariado (precio real) > Portales (asking price -12%)

PASO 2 — MÉTODO DE CAPITALIZACIÓN:
- Estima renta mensual de LARGA ESTANCIA (contrato 12+ meses) basándote en alquileres de la zona
- Calcula valor por capitalización (renta anual / cap rate zona)
- Compara con el valor por comparables

PASO 3 — ANÁLISIS DE MEDIA ESTANCIA (1-11 meses):
Si la propiedad es vivienda, calcula también el alquiler de MEDIA ESTANCIA:
- Estima renta mensual para contratos temporales (1-11 meses)
- La media estancia suele tener un PREMIUM del 25-60% sobre larga estancia
  (varía por ciudad: Madrid/Barcelona ~40-60%, ciudades medianas ~25-35%)
- Considera: zona turística/empresarial, amueblado, servicios incluidos
- Estima la ocupación anual realista (no 100%; típico 75-90%)
- Calcula rentabilidad neta considerando la ocupación
- Indica el perfil típico de inquilino (profesional, estudiante, nómada digital, etc.)

PASO 4 — VALORACIÓN FINAL:
- Pondera ambos métodos (70% comparables + 30% capitalización)
- Aplica tu criterio experto para ajustes finales
- Justifica cada decisión en el reasoning

Responde SOLO con JSON exacto:
{
  "estimatedValue": <entero, euros>,
  "minValue": <entero, euros>,
  "maxValue": <entero, euros>,
  "precioM2": <entero, €/m²>,
  "confidenceScore": <50-98>,
  "reasoning": "<3-5 párrafos explicando: 1) qué datos usaste, 2) cómo ponderaste las fuentes, 3) ajustes aplicados, 4) conclusión>",
  "analisisMercado": "<2-3 frases sobre la zona y su mercado actual>",
  "metodologiaUsada": "<explicación breve de los métodos combinados>",
  "tendenciaMercado": "<alcista|bajista|estable>",
  "porcentajeTendencia": <número 0.5-10>,
  "tiempoEstimadoVenta": "<ej: 2-4 meses>",

  "alquilerLargaEstancia": <entero, €/mes, contrato 12+ meses>,
  "rentabilidadLargaEstancia": <número, % bruto anual>,
  "capRate": <número, %>,

  "alquilerMediaEstancia": <entero, €/mes, contrato 1-11 meses>,
  "alquilerMediaEstanciaMin": <entero, €/mes, temporada baja>,
  "alquilerMediaEstanciaMax": <entero, €/mes, temporada alta>,
  "rentabilidadMediaEstancia": <número, % bruto anual considerando ocupación>,
  "ocupacionEstimadaMediaEstancia": <número, % anual, ej: 80>,
  "perfilInquilinoMediaEstancia": "<ej: Profesionales en movilidad, estudiantes Erasmus, nómadas digitales>",

  "factoresPositivos": ["<factor1>", "<factor2>", "<factor3>"],
  "factoresNegativos": ["<factor1>", "<factor2>"],
  "recomendaciones": ["<recomendación1>", "<recomendación2>", "<recomendación3>"],
  "comparablesUsados": [
    {"direccion": "<del comparable real usado>", "precio": <número>, "superficie": <número>, "precioM2": <número>, "similitud": <0.0-1.0>, "fuente": "<portal>"}
  ]
}`;

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL_PRIMARY,
    max_tokens: 4096,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0];
  if (text.type !== 'text') throw new Error('No text in phase 2 response');

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in phase 2 response');

  const raw = JSON.parse(jsonMatch[0]);

  // Mapear comparables del resultado
  const comparables = (raw.comparablesUsados || []).map((c: any) => ({
    direccion: c.direccion || c.address || '',
    precio: c.precio || c.price || 0,
    superficie: c.superficie || c.squareMeters || 0,
    precioM2: c.precioM2 || c.pricePerM2 || 0,
    similitud: c.similitud || c.similarity || 0.8,
    fuente: c.fuente || c.source || '',
  }));

  // Si la IA no devolvió comparables, usar los de Fase 1
  if (comparables.length === 0 && phase1.analyzedComparables.length > 0) {
    for (const ac of phase1.analyzedComparables.slice(0, 5)) {
      comparables.push({
        direccion: ac.address,
        precio: ac.price,
        superficie: ac.squareMeters,
        precioM2: ac.pricePerM2,
        similitud: ac.similarityScore / 100,
        fuente: ac.source,
      });
    }
  }

  const sourcesUsed: string[] = [];
  if (phase1.analyzedComparables.some((c) => c.source === 'idealista')) sourcesUsed.push('idealista');
  if (phase1.analyzedComparables.some((c) => c.source === 'fotocasa')) sourcesUsed.push('fotocasa');
  if (phase1.analyzedComparables.some((c) => c.source === 'habitaclia')) sourcesUsed.push('habitaclia');
  if (phase1.analyzedComparables.some((c) => c.source === 'pisos_com')) sourcesUsed.push('pisos_com');
  sourcesUsed.push('notariado', 'ine', 'claude_ai');

  return {
    estimatedValue: raw.estimatedValue || raw.valorEstimado || 0,
    minValue: raw.minValue || raw.valorMinimo || 0,
    maxValue: raw.maxValue || raw.valorMaximo || 0,
    precioM2: raw.precioM2 || 0,
    confidenceScore: raw.confidenceScore || raw.confianza || 70,
    reasoning: raw.reasoning || raw.analisis || '',
    analisisMercado: raw.analisisMercado || '',
    metodologiaUsada: raw.metodologiaUsada || 'Comparables + Capitalización + Criterio experto IA',
    tendenciaMercado: raw.tendenciaMercado || 'estable',
    porcentajeTendencia: raw.porcentajeTendencia || 0,
    tiempoEstimadoVenta: raw.tiempoEstimadoVenta || '3-6 meses',
    alquilerEstimado: raw.alquilerLargaEstancia || raw.alquilerEstimado || 0,
    rentabilidadAlquiler: raw.rentabilidadLargaEstancia || raw.rentabilidadAlquiler || 0,
    capRate: raw.capRate || 0,
    alquilerMediaEstancia: raw.alquilerMediaEstancia || null,
    alquilerMediaEstanciaMin: raw.alquilerMediaEstanciaMin || null,
    alquilerMediaEstanciaMax: raw.alquilerMediaEstanciaMax || null,
    rentabilidadMediaEstancia: raw.rentabilidadMediaEstancia || null,
    perfilInquilinoMediaEstancia: raw.perfilInquilinoMediaEstancia || null,
    ocupacionEstimadaMediaEstancia: raw.ocupacionEstimadaMediaEstancia || null,
    factoresPositivos: raw.factoresPositivos || [],
    factoresNegativos: raw.factoresNegativos || [],
    recomendaciones: raw.recomendaciones || [],
    comparables,
    phase1Summary: `Analizados ${phase1.rawComparablesCount} comparables de portales, ${phase1.filteredCount} seleccionados por IA con similitud >40%. Zona: ${phase1.zoneAnalysis.profile}`,
    sourcesUsed,
  };
}

// ============================================================================
// FUNCIÓN PRINCIPAL: VALORACIÓN MULTI-PASO
// ============================================================================

export async function analyzeAndValuateProperty(
  property: PropertyForAnalysis,
  aggregatedMarketData: AggregatedMarketData | null,
  platformDataText: string,
  internalComparables?: string,
): Promise<AIValuationResult> {
  const startTime = Date.now();

  logger.info('[AI Analysis] Iniciando valoración multi-paso', {
    city: property.city,
    squareMeters: property.squareMeters,
    comparablesCount: aggregatedMarketData?.allComparables.length || 0,
  });

  // FASE 1: Análisis de comparables con IA rápida
  logger.info('[AI Analysis] Fase 1: Análisis de comparables...');
  const phase1 = await runPhase1Analysis(
    property,
    aggregatedMarketData?.allComparables || [],
    platformDataText,
  );

  logger.info('[AI Analysis] Fase 1 completada', {
    rawComparables: phase1.rawComparablesCount,
    filtered: phase1.filteredCount,
    zoneProfile: phase1.zoneAnalysis.profile,
  });

  // FASE 2: Valoración experta
  logger.info('[AI Analysis] Fase 2: Valoración experta...');
  const result = await runPhase2Valuation(
    property,
    phase1,
    platformDataText,
    internalComparables || '',
  );

  const duration = Date.now() - startTime;
  logger.info(`[AI Analysis] Valoración completada en ${duration}ms`, {
    estimatedValue: result.estimatedValue,
    confidence: result.confidenceScore,
    sourcesUsed: result.sourcesUsed,
  });

  return result;
}
