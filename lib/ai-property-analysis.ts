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

export type PropertyType =
  | 'vivienda'
  | 'local_comercial'
  | 'oficina'
  | 'nave_industrial'
  | 'garaje'
  | 'trastero'
  | 'terreno'
  | 'edificio'
  | 'coworking';

export interface PropertyForAnalysis {
  // Datos físicos básicos
  propertyType?: PropertyType;
  address: string;
  city: string;
  postalCode: string;
  province?: string;
  neighborhood?: string;
  squareMeters: number;
  squareMetersUtil?: number; // Útil vs construido (puede haber 5-15% diferencia)
  rooms: number;
  bathrooms: number;
  floor?: number;
  condition: string;
  yearBuilt?: number;
  yearLastRenovation?: number; // Año de última reforma integral

  // Equipamiento básico
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

  // === Factores ESG / Energía (RICS Red Book 2024 — obligatorio) ===
  certificadoEnergetico?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null;
  certificadoEmisiones?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null;
  consumoEnergeticoKwhM2?: number; // kWh/m²·año
  emisionesCo2KgM2?: number; // kg CO2/m²·año
  aislamientoTermico?: 'alto' | 'medio' | 'bajo' | null;
  ventanasDoblesAcristalamiento?: boolean;
  paneles_solares?: boolean;
  bombaCalor?: boolean;

  // === Factores ubicación cualitativos ===
  proximidadTransportePublico?: 'excelente' | 'buena' | 'regular' | 'mala' | null;
  distanciaMetroMin?: number; // minutos andando al transporte más cercano
  zonaRuido?: 'tranquila' | 'media' | 'ruidosa' | null; // calle peatonal vs avenida
  proximidadServicios?: 'excelente' | 'buena' | 'regular' | 'mala' | null;
  calidadColegios?: 'alta' | 'media' | 'baja' | null;
  zonaVerdeProxima?: boolean;
  vistas?: 'panoramicas' | 'despejadas' | 'normales' | 'limitadas' | null;
  zonaTensionada?: boolean; // declarada como tensionada por la LAU
  zbe?: boolean; // dentro de Zona de Bajas Emisiones (afecta a garajes)

  // === Riesgos físicos / técnicos ===
  riesgoInundacion?: 'alto' | 'medio' | 'bajo' | null;
  riesgoSismico?: 'alto' | 'medio' | 'bajo' | null;
  ite?: 'favorable' | 'desfavorable' | 'pendiente' | null; // Inspección Técnica Edificios
  cedulaHabitabilidad?: boolean | null;
  contaminacionSuelo?: boolean | null; // para suelo / nave

  // === Factores económicos ===
  cargaUrbanistica?: number; // % o euros (suelo)
  ibiAnual?: number;
  comunidadMensual?: number;
  derramasPendientes?: number; // euros de derramas conocidas
  rentaActualMensual?: number; // si ya está alquilado

  // === Factores específicos por tipo ===
  // Local
  metrosFachada?: number;
  alturaLibre?: number;
  licenciaActividad?: boolean | null;
  // Garaje
  tipoPlaza?: 'normal' | 'doble' | 'moto' | 'grande';
  puntoCargaElectrico?: boolean;
  // Edificio
  numeroUnidades?: number;
  unidadesOcupadas?: number;
  inquilinosRentaAntigua?: number; // contratos de la LAU 1964 (penalizan)
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  vivienda: 'Vivienda residencial',
  local_comercial: 'Local comercial',
  oficina: 'Oficina',
  nave_industrial: 'Nave industrial / Logística',
  garaje: 'Garaje / Plaza de parking',
  trastero: 'Trastero',
  terreno: 'Terreno / Solar',
  edificio: 'Edificio completo',
  coworking: 'Espacio coworking',
};

/**
 * Construye el bloque ESG (RICS Red Book 2024) con impactos cuantificados.
 * Devuelve string vacío si no hay datos relevantes.
 */
function buildEsgBlock(p: PropertyForAnalysis): string {
  const items: string[] = [];

  // Certificado energético — premium/descuento por letra
  if (p.certificadoEnergetico) {
    const c = p.certificadoEnergetico;
    const impacto =
      c === 'A'
        ? '+10-15% (eficiencia top, prima ESG residencial)'
        : c === 'B'
          ? '+5-10%'
          : c === 'C'
            ? '+2-5% (cumple normativa, sin penalización)'
            : c === 'D'
              ? '0% (referencia mediana)'
              : c === 'E'
                ? '-2-5%'
                : c === 'F'
                  ? '-5-10% (penalización ESG, requiere rehabilitación)'
                  : '-10-15% (alta penalización ESG, próxima obligación rehab)';
    items.push(`- CEE energético: **${c}** → impacto en valor: ${impacto}`);
  } else {
    items.push('- CEE energético: NO aportado (asumir D/E por defecto, sin prima)');
  }

  if (p.certificadoEmisiones && p.certificadoEmisiones !== p.certificadoEnergetico) {
    items.push(`- CEE emisiones CO₂: ${p.certificadoEmisiones}`);
  }
  if (p.consumoEnergeticoKwhM2) {
    items.push(
      `- Consumo: ${p.consumoEnergeticoKwhM2} kWh/m²·año (referencia normativa <60 kWh/m² para vivienda nueva)`
    );
  }
  if (p.aislamientoTermico) {
    items.push(`- Aislamiento térmico: ${p.aislamientoTermico}`);
  }
  if (p.ventanasDoblesAcristalamiento) items.push('- Doble acristalamiento: Sí (+1-2%)');
  if (p.paneles_solares) items.push('- Paneles solares: Sí (+3-7%)');
  if (p.bombaCalor) items.push('- Bomba de calor (alta eficiencia): Sí (+2-4%)');

  if (items.length === 0) return '';

  return `\n--- ESG / EFICIENCIA ENERGÉTICA (criterio obligatorio RICS Red Book 2024) ---\n${items.join('\n')}\n`;
}

/**
 * Construye el bloque de calidad de ubicación cualitativa (POIs).
 */
function buildLocationQualityBlock(p: PropertyForAnalysis): string {
  const items: string[] = [];

  if (p.proximidadTransportePublico) {
    const tag =
      p.proximidadTransportePublico === 'excelente'
        ? '+15-25% (top transport link premium)'
        : p.proximidadTransportePublico === 'buena'
          ? '+5-10%'
          : p.proximidadTransportePublico === 'regular'
            ? '0%'
            : '-3-7%';
    items.push(`- Transporte público: ${p.proximidadTransportePublico} → ${tag}`);
  }
  if (p.distanciaMetroMin !== undefined && p.distanciaMetroMin !== null) {
    items.push(`- Distancia a transporte (min andando): ${p.distanciaMetroMin}min`);
  }
  if (p.zonaRuido) {
    const tag =
      p.zonaRuido === 'tranquila'
        ? '+3-5%'
        : p.zonaRuido === 'media'
          ? '0%'
          : '-5-10% (descuento por ruido)';
    items.push(`- Nivel de ruido zona: ${p.zonaRuido} → ${tag}`);
  }
  if (p.proximidadServicios) {
    items.push(
      `- Comercios y servicios cercanos: ${p.proximidadServicios}` +
        (p.proximidadServicios === 'excelente' ? ' (+3-5%)' : '')
    );
  }
  if (p.calidadColegios) {
    const tag =
      p.calidadColegios === 'alta'
        ? '+10-30% (catchment area premium)'
        : p.calidadColegios === 'media'
          ? '0%'
          : '-3-7%';
    items.push(`- Calidad de colegios próximos: ${p.calidadColegios} → ${tag}`);
  }
  if (p.zonaVerdeProxima) items.push('- Zona verde / parque a <500m: Sí (+2-5%)');
  if (p.vistas) {
    const tag =
      p.vistas === 'panoramicas'
        ? '+8-15% (vistas premium)'
        : p.vistas === 'despejadas'
          ? '+3-6%'
          : p.vistas === 'limitadas'
            ? '-3-5%'
            : '0%';
    items.push(`- Vistas: ${p.vistas} → ${tag}`);
  }
  if (p.zonaTensionada) {
    items.push(
      '- Zona declarada TENSIONADA (LAU): aplicar tope de incremento de renta — descuento de inversión -3-8%'
    );
  }
  if (p.zbe) {
    items.push(
      '- Dentro de Zona de Bajas Emisiones (ZBE): impacto positivo en garajes (+5-10%) por escasez de aparcamiento; neutral en vivienda'
    );
  }

  if (items.length === 0) return '';

  return `\n--- CALIDAD DE UBICACIÓN (impactos cuantitativos por proximidad) ---\n${items.join('\n')}\n`;
}

/**
 * Construye el bloque de riesgos técnicos / legales (descuentos significativos).
 */
function buildRiskBlock(p: PropertyForAnalysis): string {
  const items: string[] = [];

  if (p.riesgoInundacion && p.riesgoInundacion !== 'bajo') {
    const tag = p.riesgoInundacion === 'alto' ? '-10-20%' : '-3-8%';
    items.push(`- Riesgo inundación: ${p.riesgoInundacion} → ${tag} (verificar mapa CHN/CHS)`);
  }
  if (p.riesgoSismico === 'alto') {
    items.push('- Riesgo sísmico alto: -3-8% + posible necesidad de refuerzo estructural');
  }
  if (p.ite === 'desfavorable') {
    items.push(
      '- ITE DESFAVORABLE: -10-25% (rehabilitación obligatoria, derramas inminentes esperadas)'
    );
  } else if (p.ite === 'pendiente') {
    items.push('- ITE pendiente: -3-5% por incertidumbre');
  }
  if (p.cedulaHabitabilidad === false) {
    items.push('- Sin cédula de habitabilidad: -5-15% hasta regularizar');
  }
  if (p.contaminacionSuelo) {
    items.push('- Posible contaminación de suelo: -10-30% + estudio ambiental obligatorio');
  }
  if (p.derramasPendientes && p.derramasPendientes > 0) {
    items.push(
      `- Derramas pendientes conocidas: ${p.derramasPendientes.toLocaleString('es-ES')}€ (descuento equivalente al importe)`
    );
  }
  if (p.inquilinosRentaAntigua && p.inquilinosRentaAntigua > 0) {
    items.push(
      `- Inquilinos LAU 1964 (renta antigua): ${p.inquilinosRentaAntigua} contratos → -10-30% por unidad afectada (renta sub-mercado vitalicia)`
    );
  }

  if (items.length === 0) return '';

  return `\n--- RIESGOS TÉCNICOS / LEGALES (descuentos significativos al valor) ---\n${items.join('\n')}\n`;
}

/**
 * Construye el bloque de condicionantes económicos del activo concreto.
 */
function buildEconomicBlock(p: PropertyForAnalysis): string {
  const items: string[] = [];
  if (p.ibiAnual && p.ibiAnual > 0) items.push(`- IBI anual: ${p.ibiAnual}€`);
  if (p.comunidadMensual && p.comunidadMensual > 0) {
    items.push(`- Comunidad: ${p.comunidadMensual}€/mes (${p.comunidadMensual * 12}€/año)`);
  }
  if (p.rentaActualMensual && p.rentaActualMensual > 0) {
    items.push(
      `- Renta ACTUAL en vigor: ${p.rentaActualMensual}€/mes (${p.rentaActualMensual * 12}€/año brutos)`
    );
  }
  if (p.cargaUrbanistica && p.cargaUrbanistica > 0) {
    items.push(`- Cargas urbanísticas pendientes: ${p.cargaUrbanistica}€`);
  }

  if (items.length === 0) return '';
  return `\n--- DATOS ECONÓMICOS DEL ACTIVO ---\n${items.join('\n')}\n`;
}

function getPropertyTypeContext(type: PropertyType): string {
  const contexts: Record<PropertyType, string> = {
    vivienda: `TIPO: VIVIENDA RESIDENCIAL (mercado España 2025)
- Yields objetivo (rentabilidad bruta nacional 2025: ~6.9%):
  · Madrid centro/BCN centro: 3.5-4.5% (escasez de oferta, altos precios)
  · Madrid periferia, BCN periferia, ciudades grandes: 4.5-5.5%
  · Ciudades medias (Valencia, Sevilla, Málaga, Bilbao): 5-7%
  · Ciudades secundarias (Murcia, Valladolid, Palencia, Zaragoza): 6-9%
- Gastos típicos: IBI ~0.5-1%, comunidad variable, seguro ~0.15%, mantenimiento 2-4% renta, gestión 5-8%
- Vacío estimado: 5-8% anual
- Métricas clave: €/m², habitaciones, baños, planta, ascensor, orientación, CEE, distancia transporte
- Riesgos: zona tensionada LAU (tope renta), rotación inquilinos, morosidad
- Premium ESG (RICS 2024): CEE A/B = +5-15%, F/G = -5-15% (rehabilitación obligatoria próxima)
- Premium ubicación: top transporte +15-25%, catchment colegios alta +10-30%`,

    local_comercial: `TIPO: LOCAL COMERCIAL
- Yields objetivo: 5-9% bruto (prime 5-6%, zona secundaria 6-9%)
- Gastos típicos: IBI más alto ~1-2%, seguro ~0.3%, mantenimiento 3-5%, gestión 8-10%
- Vacío estimado: 8-15% anual (mucho mayor que residencial)
- Métricas clave: €/m², metros de fachada, escaparate, acceso, actividad permitida, licencia
- Riesgos: ubicación crítica, cambio de hábitos de consumo, periodos vacíos largos (6-12 meses), acondicionamiento
- Cap rates: prime 4-5.5%, secundario 5.5-8%, periferia 7-10%
- IMPORTANTE: NO comparar con precios de vivienda. Usar precios de locales de la zona.`,

    oficina: `TIPO: OFICINA
- Yields objetivo: 4-7.5% bruto (prime 4-5%, zona secundaria 5.5-7.5%)
- Gastos típicos: IBI ~1%, comunidad/CAM alta, seguro ~0.2%, mantenimiento 3-5%, gestión 8-10%
- Vacío estimado: 10-20% anual (impacto teletrabajo post-COVID)
- Métricas clave: €/m², planta diáfana/compartimentada, climatización, eficiencia energética, fibra
- Riesgos: teletrabajo, obsolescencia técnica, eficiencia energética, tenant quality, break options
- Cap rates: CBD 4-5%, zona business 5-6.5%, periferia 6-8%
- IMPORTANTE: El mercado de oficinas ha cambiado radicalmente post-COVID. Aplicar descuento de tendencia.`,

    nave_industrial: `TIPO: NAVE INDUSTRIAL / LOGÍSTICA
- Yields objetivo: 5.5-9% bruto (logística prime 5.5-6.5%, secundario 6.5-9%)
- Gastos típicos: IBI ~0.5-1.5%, seguro ~0.3%, mantenimiento 2-4%, gestión 5-8%
- Vacío estimado: 5-10% anual
- Métricas clave: €/m², altura libre, muelles de carga, resistencia suelo, acceso autopista/circunvalación
- Riesgos: contaminación suelo, licencias actividad, obsolescencia, ubicación logística
- Cap rates: logística prime 5-6%, secundario 6-8%, rural 7.5-10%
- IMPORTANTE: La logística prime (última milla, e-commerce) tiene primas significativas.`,

    garaje: `TIPO: GARAJE / PLAZA DE PARKING
- Yields objetivo: 4-6.5% bruto
- Gastos típicos: comunidad baja, IBI ~0.3-0.5%, seguro mínimo, mantenimiento bajo
- Vacío estimado: 3-5% anual (muy estable)
- Métricas clave: €/plaza, tipo plaza (normal/doble/moto), accesibilidad, altura, ubicación
- Riesgos: ZBE (Zonas Bajas Emisiones), movilidad urbana, vehículo eléctrico (punto de carga)
- Cap rates: centro 4-5.5%, periferia 5-7%
- IMPORTANTE: Valorar por €/plaza, NO por €/m². Precio medio plaza Madrid: 25.000-45.000€, BCN: 30.000-50.000€.`,

    trastero: `TIPO: TRASTERO
- Yields objetivo: 7-11% bruto (uno de los activos más rentables)
- Gastos típicos: comunidad muy baja, IBI ~0.2%, seguro mínimo
- Vacío estimado: 5-8% anual
- Métricas clave: €/m², acceso, seguridad, humedad, ubicación
- Riesgos: baja liquidez, mercado muy local, competencia self-storage
- Cap rates: 6-9%
- IMPORTANTE: Mercado nicho. Comparar con self-storage de la zona.`,

    terreno: `TIPO: TERRENO / SOLAR
- Sin yield de alquiler (salvo uso temporal: parking, almacén)
- Metodología: valor residual = valor inmueble terminado - costes construcción - beneficio promotor
- Métricas clave: €/m² suelo, edificabilidad (m²t/m²s), uso permitido (PGOU), cargas urbanísticas
- Riesgos: urbanístico (no edificable, protección), plazos licencia, costes urbanización
- IMPORTANTE: NO aplicar método de comparables de vivienda. Usar valor residual.`,

    edificio: `TIPO: EDIFICIO COMPLETO
- Yields objetivo: según composición (residencial + comercial + garajes)
- Gastos típicos: IBI total edificio, comunidad propia, seguro edificio, mantenimiento global
- Métricas clave: yield ponderado por uso, NOI total, estado fachada/estructura, ITE
- Riesgos: derramas, ITE desfavorable, rehabilitación energética obligatoria, inquilinos de renta antigua
- IMPORTANTE: Desglosar por uso (vivienda, local, garaje) y aplicar yield por tipo. Yield ponderado.`,

    coworking: `TIPO: ESPACIO COWORKING
- Yields objetivo: 6-10% bruto (si se opera), 4-6% como oficina alquilada a operador
- Gastos típicos: como oficina + mobiliario + servicios + personal
- Vacío estimado: 15-25% (variable según marca y ubicación)
- Métricas clave: €/puesto, ocupación media, mix (hot desk/dedicated/privado), servicios
- Riesgos: competencia, WeWork effect, obsolescencia rápida de diseño
- Cap rates: como oficina + prima de riesgo operacional`,
  };

  return contexts[type] || contexts.vivienda;
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

  // Desglose de ajustes RICS Red Book 2024 / IVS / ECO 805/2003
  ajustesPorFactores?: {
    esg?: {
      impactoTotal: string;
      ceeAplicado: string;
      detalle: string;
    };
    ubicacion?: {
      impactoTotal: string;
      factoresAplicados: string[];
    };
    riesgos?: {
      impactoTotal: string;
      factoresAplicados: string[];
    };
  };
}

// ============================================================================
// FASE 1: ANÁLISIS DE COMPARABLES CON IA
// ============================================================================

async function runPhase1Analysis(
  property: PropertyForAnalysis,
  allComparables: PlatformComparable[],
  platformSummary: string
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
        `${i + 1}. [${c.source}] ${c.address} — ${c.price}€ (${c.squareMeters}m², ${c.pricePerM2}€/m²)${c.rooms ? ` ${c.rooms}hab` : ''}${c.bathrooms ? ` ${c.bathrooms}baños` : ''}`
    )
    .join('\n');

  const pType = property.propertyType || 'vivienda';
  const pTypeLabel = PROPERTY_TYPE_LABELS[pType] || pType;

  const prompt = `Eres un analista inmobiliario experto. Tu tarea es analizar comparables de mercado para un activo de tipo **${pTypeLabel}**.

PROPIEDAD OBJETIVO (${pTypeLabel}):
- Tipo de activo: ${pTypeLabel}
- Ubicación: ${property.address}, ${property.city} (${property.postalCode})
- Superficie: ${property.squareMeters}m²
${pType === 'vivienda' || pType === 'edificio' ? `- Habitaciones: ${property.rooms} | Baños: ${property.bathrooms}` : ''}
- Estado: ${property.condition}
${property.floor ? `- Planta: ${property.floor}` : ''}
${property.yearBuilt ? `- Año: ${property.yearBuilt}` : ''}
${property.hasElevator ? '- Ascensor: Sí' : ''}${property.hasParking ? ' - Parking: Sí' : ''}${property.hasTerrace ? ' - Terraza: Sí' : ''}

COMPARABLES ENCONTRADOS EN PORTALES (${allComparables.length} total):
${comparablesText}

TAREA:
1. Analiza cada comparable y puntúa su SIMILITUD REAL (0-100) con la propiedad objetivo
   - CRÍTICO: Solo considerar comparables del MISMO TIPO DE ACTIVO (${pTypeLabel})
   - Una vivienda NO es comparable con un local comercial ni con una oficina
   - Considera: tipo de activo, ubicación, superficie (±20% = buena similitud)${pType === 'vivienda' ? ', habitaciones, estado' : pType === 'garaje' ? ', tipo de plaza, accesibilidad' : pType === 'local_comercial' ? ', fachada, actividad, zona comercial' : pType === 'oficina' ? ', planta diáfana, climatización' : ', características técnicas'}
   - Penaliza diferencias grandes de superficie o ubicación distinta
   - Penalizar FUERTEMENTE si el comparable es de un tipo de activo diferente
2. Identifica OUTLIERS de precio (precios que se desvían >30% de la mediana del tipo)
3. Selecciona los 5-8 comparables MÁS RELEVANTES (mismo tipo de activo)
4. Analiza el PERFIL DE LA ZONA para este tipo de activo específico

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
    const outliers = pricesPerM2.filter((p) => Math.abs(p - medianPrice) / medianPrice > 0.3);

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
  aggregatedMarketData: AggregatedMarketData | null
): Promise<AIValuationResult> {
  const analyzedCompsText =
    phase1.analyzedComparables.length > 0
      ? phase1.analyzedComparables
          .map(
            (c, i) =>
              `${i + 1}. [${c.source}] ${c.address}: ${c.price}€ (${c.squareMeters}m², ${c.pricePerM2}€/m²)` +
              `\n   Similitud IA: ${c.similarityScore}% — ${c.similarityReason}` +
              `\n   Precio ajustado: ${c.priceAdjusted}€`
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

  const pType = property.propertyType || 'vivienda';
  const pTypeLabel = PROPERTY_TYPE_LABELS[pType] || pType;
  const typeContext = getPropertyTypeContext(pType);

  // === Bloques cualitativos avanzados (RICS Red Book 2024 + IVS + ECO 805/2003) ===
  const esgBlock = buildEsgBlock(property);
  const locationQualityBlock = buildLocationQualityBlock(property);
  const riskBlock = buildRiskBlock(property);
  const economicBlock = buildEconomicBlock(property);

  const prompt = `Eres un tasador inmobiliario certificado (RICS/ATASA) con 20+ años de experiencia en el mercado español. Realizas una valoración profesional rigurosa siguiendo las normas ECO 805/2003 y estándares internacionales de valoración (IVS).

Tu valoración DEBE ser REALISTA — ni optimista ni pesimista — basada en datos verificables.

═══════════════════════════════════════════════════════
TIPO DE ACTIVO: ${pTypeLabel.toUpperCase()}
═══════════════════════════════════════════════════════
${typeContext}

═══════════════════════════════════════════════════════
PROPIEDAD A VALORAR (${pTypeLabel})
═══════════════════════════════════════════════════════
- Tipo: ${pTypeLabel}
- Dirección: ${property.address}, ${property.city} (CP: ${property.postalCode})
${property.neighborhood ? `- Barrio/Zona: ${property.neighborhood}` : ''}
- Superficie: ${property.squareMeters}m²
${pType === 'vivienda' || pType === 'edificio' ? `- Distribución: ${property.rooms} habitaciones, ${property.bathrooms} baños` : pType === 'garaje' ? `- Plazas: ${property.rooms || 1}` : ''}
${property.floor !== undefined ? `- Planta: ${property.floor}${property.floor === 0 ? ' (bajo' + (pType === 'local_comercial' ? ' — ideal para local a pie de calle)' : ')') : property.floor >= 4 ? (pType === 'vivienda' ? ' (planta alta — prima +3-5%)' : '') : ''}` : ''}
- Estado conservación: ${property.condition === 'NEW' ? 'Obra nueva / A estrenar' : property.condition === 'NEEDS_RENOVATION' ? 'Necesita reforma' : 'Buen estado general'}
${property.yearBuilt ? `- Antigüedad: ${new Date().getFullYear() - property.yearBuilt} años (construido ${property.yearBuilt})` : ''}
${pType === 'vivienda' && property.orientacion ? `- Orientación: ${property.orientacion}` : ''}
${features.length > 0 ? `- Equipamiento: ${features.join(', ')}` : ''}
${property.squareMetersUtil ? `- Superficie útil: ${property.squareMetersUtil}m² (vs ${property.squareMeters}m² construidos = ratio ${(property.squareMetersUtil / property.squareMeters).toFixed(2)})` : ''}
${property.yearLastRenovation ? `- Última reforma integral: ${property.yearLastRenovation} (hace ${new Date().getFullYear() - property.yearLastRenovation} años)` : ''}
${property.descripcionAdicional ? `- Observaciones: ${property.descripcionAdicional}` : ''}
- Finalidad valoración: ${property.finalidad === 'venta' ? 'Determinación valor de mercado (venta)' : property.finalidad === 'alquiler' ? 'Determinación renta de mercado (alquiler)' : 'Valor de mercado + Renta de mercado'}
${esgBlock}${locationQualityBlock}${riskBlock}${economicBlock}
═══════════════════════════════════════════════════════
DATOS DE MERCADO — MÚLTIPLES FUENTES VERIFICADAS
═══════════════════════════════════════════════════════
${platformDataText}

═══════════════════════════════════════════════════════
COMPARABLES PRE-ANALIZADOS POR IA (Fase 1 — filtrados por similitud)
═══════════════════════════════════════════════════════
${analyzedCompsText}

${zoneText}

${internalComparables ? `═══════════════════════════════════════════════════════\nCOMPARABLES DEL PORTFOLIO PROPIO (propiedades gestionadas)\n═══════════════════════════════════════════════════════\n${internalComparables}` : ''}

═══════════════════════════════════════════════════════
METODOLOGÍA DE VALORACIÓN (6 PASOS OBLIGATORIOS — RICS Red Book 2024 + ECO 805/2003 + IVS 2024)
═══════════════════════════════════════════════════════
NOTA RICS: La consideración de factores ESG (eficiencia energética, sostenibilidad,
gobernanza) es OBLIGATORIA en cada paso de valoración profesional desde 2025.

PASO 1 — MÉTODO DE COMPARACIÓN (peso: 50-60%):
- CRÍTICO: Usa SOLO comparables DEL MISMO TIPO DE ACTIVO (${pTypeLabel})
- NO mezclar tipos: un local NO es comparable con una vivienda, una oficina NO es comparable con una nave
- Usa SOLO comparables con similitud >60% de la Fase 1
- Ajusta el precio por diferencias:
${
  pType === 'vivienda'
    ? `  · Superficie (±1.5% por cada 5m² de diferencia)
  · Estado/calidad (reforma: -15-25%, obra nueva: +10-15%)
  · Planta (bajo: -5-8%, planta alta con ascensor: +3-5%, ático: +8-12%)
  · Equipamiento (garaje: +8-12%, terraza: +5-8%, piscina: +3-5%, ascensor: +3-5%)
  · Orientación (sur: +2-3%, norte: -2%)`
    : pType === 'local_comercial'
      ? `  · Superficie (±1% por cada 10m² de diferencia)
  · Fachada y escaparate (con fachada: +10-20%, esquina: +15-25%)
  · Planta (a pie de calle: referencia, sótano: -30-50%, primera planta: -15-25%)
  · Altura libre (>3.5m: +5%, <2.5m: -10%)
  · Estado (a reformar: -20-30% según nivel)
  · Licencia de actividad vigente (+5-10%)`
      : pType === 'oficina'
        ? `  · Superficie (±1% por cada 15m² de diferencia)
  · Planta (baja: -10%, plantas altas con vistas: +5-10%)
  · Diáfana vs compartimentada (diáfana: +5%)
  · Climatización central (+5-8%)
  · Eficiencia energética (A/B: +5-10%, F/G: -5-10%)
  · Fibra óptica y cableado (+3-5%)`
        : pType === 'nave_industrial'
          ? `  · Superficie (±1% por cada 100m² de diferencia)
  · Altura libre (>8m: +10%, <5m: -10%)
  · Muelles de carga (+10-15%)
  · Resistencia suelo (>3T/m²: +5%)
  · Acceso autopista/circunvalación (+5-10%)`
          : pType === 'garaje'
            ? `  · Tipo de plaza (normal: referencia, doble: +60-80%, moto: -50-60%)
  · Accesibilidad (rampa ancha: +5%, difícil maniobra: -10-15%)
  · Punto carga eléctrica (+5-10%)
  · Planta (más superficial: +5%, sótanos profundos: -5-10%)`
            : `  · Superficie (ajustar según tipo)
  · Estado/calidad
  · Ubicación y accesibilidad`
}
- CRÍTICO: Los asking prices de portales están INFLADOS un 10-15%. APLICA SIEMPRE descuento.
- Los precios del Notariado son precios REALES escriturados — máxima fiabilidad.
- Idealista Data Platform: datos profesionales agregados — descuento ~8-10%.

PASO 2 — MÉTODO DE CAPITALIZACIÓN DE RENTAS (peso: 20-30%):
- Estima la renta mensual para ${pTypeLabel} basándote en:
  · Precios de alquiler de la zona PARA ESTE TIPO DE ACTIVO (datos de plataformas)
  · Rentabilidad bruta de la zona si disponible (datos Idealista)
  · Comparables de alquiler similares DEL MISMO TIPO
- Calcula: Valor = (Renta mensual × 12) / Cap Rate para ${pTypeLabel}
  · Usar Cap Rate del tipo de activo indicado arriba, NO cap rate genérico
  · ${
    pType === 'vivienda'
      ? 'Residencial: Madrid centro 3.5-4.2%, BCN 3.8-4.5%, medias 4.5-5.5%'
      : pType === 'local_comercial'
        ? 'Local: prime 4-5.5%, secundario 5.5-8%, periferia 7-10%'
        : pType === 'oficina'
          ? 'Oficina: CBD 4-5%, business 5-6.5%, periferia 6-8%'
          : pType === 'nave_industrial'
            ? 'Nave: logística prime 5-6%, secundario 6-8%, rural 7.5-10%'
            : pType === 'garaje'
              ? 'Garaje: centro 4-5.5%, periferia 5-7%'
              : 'Usar cap rate específico del tipo de activo'
  }
- El resultado sirve como validación cruzada del método de comparables

${
  pType === 'vivienda' || pType === 'edificio'
    ? `PASO 3 — ANÁLISIS DE INVERSIÓN (MEDIA ESTANCIA 1-11 meses):
- Aplica SOLO a vivienda y edificio residencial
- Estima renta media estancia (contratos temporales) con premium sobre larga estancia:
  · Madrid/Barcelona premium: +40-60%
  · Ciudades turísticas (Málaga, Palma, Benidorm): +50-80%
  · Ciudades medias: +25-40%
- Estima ocupación REALISTA anual (no 100%): típico 75-90% según zona
- Calcula rentabilidad bruta = (renta × meses ocupados) / valor inmueble
- Perfil de inquilino típico`
    : pType === 'oficina' || pType === 'coworking'
      ? `PASO 3 — ANÁLISIS DE FLEXIBILIDAD (contratos cortos):
- Para oficinas/coworking, analiza el potencial de contratos flexibles
- Premium por flexibilidad: +20-40% sobre contrato largo fijo
- Ocupación media coworking: 70-85%. Oficina flexible: 80-90%
- Riesgo de obsolescencia por teletrabajo`
      : `PASO 3 — ANÁLISIS ESPECÍFICO DEL TIPO DE ACTIVO (${pTypeLabel}):
- Analiza riesgos y oportunidades específicos de ${pTypeLabel}
- Para locales: analizar zona comercial, tránsito peatonal, competencia
- Para naves: analizar acceso logístico, demanda de la zona, crecimiento e-commerce
- Para garajes: analizar impacto ZBE, demanda parking en la zona, vehículo eléctrico
- Para trasteros: analizar demanda local, competencia self-storage
- NO calcular media estancia si no aplica a este tipo de activo`
}

PASO 4 — AJUSTES POR FACTORES ESG, UBICACIÓN CUALITATIVA Y RIESGOS (RICS Red Book 2024):
**OBLIGATORIO**: Aplica AL VALOR BASE de los pasos 1-2 los siguientes ajustes acumulativos:

(a) ESG / Eficiencia energética (datos arriba en bloque ESG):
- CEE A: +10-15% / B: +5-10% / C: +2-5% / D: 0% (referencia) / E: -2-5% / F: -5-10% / G: -10-15%
- Si NO hay CEE aportado, asumir D-E (sin prima ni descuento explícito)
- Aislamiento alto + doble ventana + bomba calor = +3-5% adicional combinado
- A partir 2025-2027 entrarán en vigor restricciones de alquiler para CEE F/G en algunos países UE

(b) Calidad de ubicación (datos arriba en bloque CALIDAD DE UBICACIÓN):
- Top transporte público: +15-25% (la dominante: ubicación = 60-80% del valor)
- Catchment de colegios alta calidad: +10-30% (residencial)
- Zona tranquila vs ruidosa: ±5-10%
- Vistas panorámicas/despejadas: +3-15%
- Zona verde a <500m: +2-5%
- Zona declarada tensionada (LAU): -3-8% en valor por tope de renta

(c) Riesgos técnicos / legales (datos arriba en bloque RIESGOS):
- ITE desfavorable: -10-25% (rehabilitación inminente)
- Riesgo inundación alto: -10-20%
- Sin cédula habitabilidad: -5-15%
- Inquilinos LAU 1964 (renta antigua): -10-30% por unidad afectada
- Derramas pendientes conocidas: descontar el importe completo

(d) Datos económicos verificables del activo (bloque DATOS ECONÓMICOS):
- Renta actual en vigor < renta de mercado: oportunidad de revalorización (informar pero NO inflar valor)
- Renta actual en vigor ≥ renta de mercado: aplicar como referencia primaria
- IBI o comunidad anormalmente alta: descontar capitalización del exceso

PASO 5 — VALIDACIÓN CRUZADA Y COHERENCIA:
- Compara el valor obtenido por comparables vs capitalización
  · Si difieren >15%, analiza por qué y ajusta
  · SIEMPRE prioriza comparables de mercado (transacciones reales) sobre capitalización
  · Solo usa capitalización como método principal si hay <2 comparables con similitud >60%
  · Si capitalización difiere >20% de comparables, el resultado DEBE basarse en comparables
- Verifica coherencia: el precio/m² resultante debe estar dentro del rango de la zona
- Si hay evolución histórica de precios, verifica que la tendencia es coherente
- Si hay datos de subzonas/distritos, usa la subzona más cercana como referencia primaria

PASO 6 — DETERMINACIÓN FINAL Y CONFIANZA:
- Pondera: comparables de mercado (65%) + criterio experto (20%) + capitalización de rentas (15%)
- IMPORTANTE: La capitalización de rentas es un método de VALIDACIÓN CRUZADA, NO el principal.
  El precio de mercado real (transacciones escrituradas y comparables) debe ser la referencia primaria.
  La capitalización solo debe usarse como check de coherencia o cuando no hay suficientes comparables.
- Ajuste final por factores macro: tendencia del mercado, tipos de interés, estacionalidad
- Confianza (50-98):
  · >85 = datos Notariado + comparables reales escriturados + ≥5 comparables similares
  · 75-85 = datos de portales + Idealista Data + ≥3 comparables buenos
  · 65-75 = asking prices + pocos comparables o baja similitud
  · 50-65 = datos estáticos o insuficientes, valoración estimativa
- El rango min-max debe reflejar incertidumbre REAL (típico ±8-12% del valor central)

REGLAS DE REALISMO PARA ${pTypeLabel.toUpperCase()}:
- NO inflar el valor. El activo vale lo que indica el mercado para su tipo.
- Usar yields, cap rates y gastos ESPECÍFICOS del tipo ${pTypeLabel} (ver sección TIPO DE ACTIVO arriba).
${
  pType === 'vivienda'
    ? `- Reforma necesaria: -15% parcial, -25% integral.
- Sin ascensor planta >2: -5% a -10%.
- Antigüedad >40 años sin reforma: -5%.
- Sin garaje en zona con problema parking: -3-5%.`
    : pType === 'local_comercial'
      ? `- Local sin fachada/escaparate: descuento -20-30%.
- Sótano o primera planta (no pie de calle): -25-50%.
- Sin licencia de actividad: -5-10%.
- Vacío actual: considerar 6-12 meses para encontrar inquilino.`
      : pType === 'oficina'
        ? `- Oficina sin climatización central: -10-15%.
- Sin eficiencia energética (F/G): -5-10%.
- Compartimentada rígida (no adaptable): -5%.
- Impacto teletrabajo: aplicar prima de riesgo +0.5-1% en cap rate.`
        : pType === 'nave_industrial'
          ? `- Sin muelles de carga: -10-15% para logística.
- Altura libre <5m: -10%.
- Sin acceso rodado pesado: -15-20%.
- Posible contaminación suelo: requiere estudio ambiental.`
          : pType === 'garaje'
            ? `- Valorar POR PLAZA, no por m².
- Difícil maniobra: -10-15%.
- Sótanos profundos (>2): -5-10%.
- Sin punto carga eléctrica: penalización creciente.`
            : `- Aplicar criterios específicos del tipo de activo.`
}

Responde SOLO con JSON exacto (sin texto adicional antes o después):
{
  "estimatedValue": <entero, euros — valor de mercado más probable>,
  "minValue": <entero, euros — límite inferior razonable>,
  "maxValue": <entero, euros — límite superior razonable>,
  "precioM2": <entero, €/m²${pType === 'garaje' ? ' o €/plaza' : ''}>,
  "confidenceScore": <50-98, basado en calidad de datos>,

  "reasoning": "<4-6 párrafos DETALLADOS: 1) Tipo de activo y metodología aplicada, 2) Fuentes de datos y fiabilidad, 3) Comparables del MISMO TIPO seleccionados y ajustes, 4) Capitalización: renta estimada para ${pTypeLabel} y cap rate usado, 5) Factores de ajuste específicos del tipo, 6) Conclusión>",

  "analisisMercado": "<3-4 frases sobre el mercado de ${pTypeLabel} en la zona: oferta/demanda, tendencia, perspectiva>",
  "metodologiaUsada": "<Métodos aplicados específicos para ${pTypeLabel}: comparación directa, capitalización con cap rate de ${pType === 'vivienda' ? '3.5-6%' : pType === 'local_comercial' ? '4-10%' : pType === 'oficina' ? '4-8%' : pType === 'nave_industrial' ? '5-10%' : pType === 'garaje' ? '4-7%' : '5-8%'}, ajustes por características>",

  "tendenciaMercado": "<alcista|bajista|estable>",
  "porcentajeTendencia": <número 0.5-12, variación interanual %>,
  "tiempoEstimadoVenta": "<estimación realista para ${pTypeLabel}>",

  "alquilerLargaEstancia": <entero, €/mes>,
  "rentabilidadLargaEstancia": <número, % bruto anual para ${pTypeLabel}>,
  "capRate": <número, % — ESPECÍFICO para ${pTypeLabel}>,

${
  pType === 'vivienda' || pType === 'edificio'
    ? `  "alquilerMediaEstancia": <entero, €/mes, contrato 1-11 meses>,
  "alquilerMediaEstanciaMin": <entero, €/mes, temporada baja>,
  "alquilerMediaEstanciaMax": <entero, €/mes, temporada alta>,
  "rentabilidadMediaEstancia": <número, % bruto anual ajustado por ocupación>,
  "ocupacionEstimadaMediaEstancia": <número, % anual realista>,
  "perfilInquilinoMediaEstancia": "<perfiles concretos>",`
    : `  "alquilerMediaEstancia": null,
  "alquilerMediaEstanciaMin": null,
  "alquilerMediaEstanciaMax": null,
  "rentabilidadMediaEstancia": null,
  "ocupacionEstimadaMediaEstancia": null,
  "perfilInquilinoMediaEstancia": null,`
}

  "factoresPositivos": ["<factor1 con impacto estimado>", "<factor2>", "<factor3>"],
  "factoresNegativos": ["<factor1 con impacto estimado>", "<factor2>"],
  "recomendaciones": ["<recomendación1 con impacto en valor>", "<recomendación2>", "<recomendación3>"],
  "comparablesUsados": [
    {"direccion": "<dirección real del comparable>", "precio": <número>, "superficie": <número>, "precioM2": <número>, "similitud": <0.0-1.0>, "fuente": "<portal>"}
  ],

  "ajustesPorFactores": {
    "esg": {
      "impactoTotal": "<+/-X% (resumen)>",
      "ceeAplicado": "<letra o 'no aportado'>",
      "detalle": "<frase 1-2 líneas>"
    },
    "ubicacion": {
      "impactoTotal": "<+/-X%>",
      "factoresAplicados": ["transporte:+10%", "colegios:+15%", "..."]
    },
    "riesgos": {
      "impactoTotal": "<-X%>",
      "factoresAplicados": ["ITE desfavorable:-15%", "..."]
    }
  }
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

  const sourcesUsed = Array.from(
    new Set([...(aggregatedMarketData?.sourcesUsed || []), 'claude_ai'])
  );

  const estimatedValue = raw.estimatedValue || raw.valorEstimado || 0;

  // Extraer yield real de Idealista del texto de plataformas
  let idealistaYield: number | null = null;
  const yieldMatch = platformDataText.match(/Rentabilidad bruta alquiler:\s*([\d.,]+)%/);
  if (yieldMatch) {
    idealistaYield = parseFloat(yieldMatch[1].replace(',', '.'));
  }

  const rental = computeRentalEstimates(raw, estimatedValue, idealistaYield, property.propertyType);

  return {
    estimatedValue,
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
    alquilerEstimado: rental.alquilerEstimado,
    rentabilidadAlquiler: rental.rentabilidadAlquiler,
    capRate: rental.capRate,
    alquilerMediaEstancia: rental.alquilerMediaEstancia,
    alquilerMediaEstanciaMin: rental.alquilerMediaEstanciaMin,
    alquilerMediaEstanciaMax: rental.alquilerMediaEstanciaMax,
    rentabilidadMediaEstancia: rental.rentabilidadMediaEstancia,
    perfilInquilinoMediaEstancia: rental.perfilInquilinoMediaEstancia,
    ocupacionEstimadaMediaEstancia: rental.ocupacionEstimadaMediaEstancia,
    factoresPositivos: raw.factoresPositivos || [],
    factoresNegativos: raw.factoresNegativos || [],
    recomendaciones: raw.recomendaciones || [],
    comparables,
    phase1Summary: `Analizados ${phase1.rawComparablesCount} comparables de portales, ${phase1.filteredCount} seleccionados por IA con similitud >40%. Zona: ${phase1.zoneAnalysis.profile}`,
    sourcesUsed,
    ajustesPorFactores: raw.ajustesPorFactores || undefined,
  };
}

// ============================================================================
// CÁLCULO DE ALQUILERES CON FALLBACK GARANTIZADO
// ============================================================================

function computeRentalEstimates(
  raw: any,
  estimatedValue: number,
  idealistaYield?: number | null,
  propertyType?: PropertyType
) {
  const pType = propertyType || 'vivienda';

  // Yields por defecto por tipo de activo
  const DEFAULT_YIELDS: Record<string, number> = {
    vivienda: 0.045,
    local_comercial: 0.065,
    oficina: 0.055,
    nave_industrial: 0.07,
    garaje: 0.05,
    trastero: 0.085,
    terreno: 0.02,
    edificio: 0.05,
    coworking: 0.06,
  };

  const MEDIA_ESTANCIA_PREMIUM: Record<string, number> = {
    vivienda: 1.4,
    oficina: 1.25,
    coworking: 1.1,
  };

  const OCUPACION_POR_TIPO: Record<string, number> = {
    vivienda: 82,
    local_comercial: 87,
    oficina: 80,
    nave_industrial: 90,
    garaje: 95,
    trastero: 90,
    edificio: 85,
    coworking: 75,
  };

  const YIELD_MEDIA_PREMIUM = MEDIA_ESTANCIA_PREMIUM[pType] || 1.0;
  const OCUPACION_MEDIA = OCUPACION_POR_TIPO[pType] || 85;

  const yieldBase =
    idealistaYield && idealistaYield > 0 ? idealistaYield / 100 : DEFAULT_YIELDS[pType] || 0.045;

  // Larga estancia: priorizar IA, luego calcular con yield real
  let alquilerEstimado = Number(raw.alquilerLargaEstancia || raw.alquilerEstimado || 0);
  if (alquilerEstimado <= 0 && estimatedValue > 0) {
    alquilerEstimado = Math.round((estimatedValue * yieldBase) / 12);
  }

  let rentabilidadAlquiler = Number(raw.rentabilidadLargaEstancia || raw.rentabilidadAlquiler || 0);
  if (rentabilidadAlquiler <= 0 && estimatedValue > 0 && alquilerEstimado > 0) {
    rentabilidadAlquiler = Math.round(((alquilerEstimado * 12) / estimatedValue) * 1000) / 10;
  }
  // Si Idealista tiene yield real y es diferente al calculado, ajustar
  if (idealistaYield && idealistaYield > 0 && Math.abs(rentabilidadAlquiler - idealistaYield) > 1) {
    rentabilidadAlquiler = Math.round(((rentabilidadAlquiler + idealistaYield) / 2) * 10) / 10;
  }

  let capRate = Number(raw.capRate || 0);
  if (capRate <= 0 && rentabilidadAlquiler > 0) {
    capRate = Math.round(rentabilidadAlquiler * 0.75 * 10) / 10;
  }

  // Media estancia: solo para tipos que lo soporten
  const supportsMediaEstancia = ['vivienda', 'edificio', 'oficina', 'coworking'].includes(pType);

  let alquilerMediaEstancia = Number(raw.alquilerMediaEstancia || 0);
  if (
    alquilerMediaEstancia <= 0 &&
    alquilerEstimado > 0 &&
    supportsMediaEstancia &&
    YIELD_MEDIA_PREMIUM > 1
  ) {
    alquilerMediaEstancia = Math.round(alquilerEstimado * YIELD_MEDIA_PREMIUM);
  }

  let alquilerMediaEstanciaMin = Number(raw.alquilerMediaEstanciaMin || 0);
  if (alquilerMediaEstanciaMin <= 0 && alquilerMediaEstancia > 0) {
    alquilerMediaEstanciaMin = Math.round(alquilerMediaEstancia * 0.88);
  }

  let alquilerMediaEstanciaMax = Number(raw.alquilerMediaEstanciaMax || 0);
  if (alquilerMediaEstanciaMax <= 0 && alquilerMediaEstancia > 0) {
    alquilerMediaEstanciaMax = Math.round(alquilerMediaEstancia * 1.15);
  }

  let rentabilidadMediaEstancia = Number(raw.rentabilidadMediaEstancia || 0);
  if (rentabilidadMediaEstancia <= 0 && estimatedValue > 0 && alquilerMediaEstancia > 0) {
    rentabilidadMediaEstancia =
      Math.round(((alquilerMediaEstancia * 12 * (OCUPACION_MEDIA / 100)) / estimatedValue) * 1000) /
      10;
  }

  const ocupacionEstimadaMediaEstancia =
    Number(raw.ocupacionEstimadaMediaEstancia || 0) || OCUPACION_MEDIA;

  const perfilInquilinoMediaEstancia =
    raw.perfilInquilinoMediaEstancia ||
    'Profesionales en movilidad, ejecutivos temporales, estudiantes de posgrado';

  return {
    alquilerEstimado,
    rentabilidadAlquiler,
    capRate,
    alquilerMediaEstancia,
    alquilerMediaEstanciaMin,
    alquilerMediaEstanciaMax,
    rentabilidadMediaEstancia,
    perfilInquilinoMediaEstancia,
    ocupacionEstimadaMediaEstancia,
  };
}

// ============================================================================
// FUNCIÓN PRINCIPAL: VALORACIÓN MULTI-PASO
// ============================================================================

export async function analyzeAndValuateProperty(
  property: PropertyForAnalysis,
  aggregatedMarketData: AggregatedMarketData | null,
  platformDataText: string,
  internalComparables?: string
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
    platformDataText
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
    aggregatedMarketData
  );

  const duration = Date.now() - startTime;
  logger.info(`[AI Analysis] Valoración completada en ${duration}ms`, {
    estimatedValue: result.estimatedValue,
    confidence: result.confidenceScore,
    sourcesUsed: result.sourcesUsed,
  });

  return result;
}
