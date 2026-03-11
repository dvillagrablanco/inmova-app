// @ts-nocheck
import { CLAUDE_MODEL_FAST, CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
/**
 * SERVICIO DE PRICING DINÁMICO CON IA
 *
 * Calcula el precio óptimo para alquileres de media estancia basándose en:
 * - Datos del mercado local
 * - Estacionalidad
 * - Duración del contrato
 * - Características del inmueble
 * - Servicios incluidos
 * - Demanda histórica
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../db';
import { differenceInMonths, getMonth } from 'date-fns';

import logger from '@/lib/logger';
// ==========================================
// TIPOS
// ==========================================

export interface DatosMercado {
  precioMedioZona: number;
  precioMinZona: number;
  precioMaxZona: number;
  tendencia: 'subiendo' | 'bajando' | 'estable';
  ocupacionMedia: number; // 0-100%
  tiempoMedioOcupacion: number; // días hasta alquilar
}

export interface CaracteristicasInmueble {
  ciudad: string;
  barrio?: string;
  codigoPostal: string;
  superficie: number;
  habitaciones: number;
  banos: number;
  amueblado: boolean;
  extras: string[]; // ['terraza', 'parking', 'piscina', etc.]
  estadoConservacion: 'nuevo' | 'reformado' | 'bueno' | 'mejorable';
  antiguedad?: number; // años
}

export interface ParametrosAlquiler {
  duracionMeses: number;
  fechaInicio: Date;
  serviciosIncluidos: string[];
  aceptaMascotas: boolean;
  aceptaFumadores: boolean;
}

export interface ResultadoPricing {
  precioRecomendado: number;
  precioMinimo: number;
  precioMaximo: number;
  confianza: number; // 0-100
  factores: FactorPrecio[];
  comparativasMercado: ComparativaMercado[];
  recomendaciones: string[];
  explicacion: string;
}

export interface FactorPrecio {
  factor: string;
  impacto: number; // -100 a +100 (% de ajuste sobre precio base)
  descripcion: string;
}

export interface ComparativaMercado {
  descripcion: string;
  precio: number;
  diferencia: number; // % respecto a precio recomendado
}

// ==========================================
// DATOS DE MERCADO (SIMULADOS/ESTÁTICOS)
// ==========================================

// En producción, estos datos vendrían de APIs externas (Idealista, Fotocasa, etc.)
const PRECIOS_MEDIOS_ZONA: Record<string, number> = {
  // Madrid
  Madrid_Centro: 18,
  Madrid_Chamberí: 17,
  Madrid_Salamanca: 20,
  Madrid_Arganzuela: 14,
  Madrid_Retiro: 16,
  Madrid_Chamartín: 18,
  Madrid_Tetuán: 13,
  Madrid_Moncloa: 15,
  Madrid_Latina: 12,
  Madrid_Carabanchel: 10,
  Madrid_Usera: 10,
  Madrid_Villaverde: 9,
  'Madrid_Villa de Vallecas': 9,
  Madrid_default: 13,

  // Barcelona
  'Barcelona_Ciutat Vella': 20,
  Barcelona_Eixample: 18,
  Barcelona_Gràcia: 17,
  'Barcelona_Sant Martí': 15,
  'Barcelona_Sants-Montjuïc': 14,
  'Barcelona_Les Corts': 16,
  'Barcelona_Sarrià-Sant Gervasi': 20,
  'Barcelona_Horta-Guinardó': 12,
  Barcelona_default: 15,

  // Valencia
  'Valencia_Ciutat Vella': 12,
  Valencia_Eixample: 11,
  Valencia_Extramurs: 10,
  Valencia_Campanar: 10,
  Valencia_default: 10,

  // Sevilla
  'Sevilla_Casco Antiguo': 11,
  Sevilla_Triana: 10,
  Sevilla_Nervión: 10,
  Sevilla_default: 9,

  // Default España
  default: 10,
};

// Factores de estacionalidad por mes (100 = precio base)
const ESTACIONALIDAD: Record<number, number> = {
  0: 95, // Enero - temporada baja
  1: 100, // Febrero
  2: 105, // Marzo - inicio temporada alta estudiantes
  3: 110, // Abril
  4: 105, // Mayo
  5: 100, // Junio
  6: 115, // Julio - temporada alta vacaciones
  7: 120, // Agosto - máxima demanda temporal
  8: 115, // Septiembre - inicio curso académico
  9: 110, // Octubre
  10: 100, // Noviembre
  11: 95, // Diciembre - temporada baja
};

// ==========================================
// FUNCIONES DE CÁLCULO
// ==========================================

/**
 * Obtiene datos del mercado local
 */
export async function obtenerDatosMercado(ciudad: string, barrio?: string): Promise<DatosMercado> {
  // Buscar precio medio de la zona
  const key = barrio ? `${ciudad}_${barrio}` : `${ciudad}_default`;

  const precioBase = PRECIOS_MEDIOS_ZONA[key] || PRECIOS_MEDIOS_ZONA['default'];

  // Obtener datos de propiedades similares en la BD
  const propiedadesSimilares = await prisma.unit.findMany({
    where: {
      building: {
        city: ciudad,
        ...(barrio && { neighborhood: barrio }),
      },
      estado: 'ocupado',
    },
    select: {
      contracts: {
        where: { estado: 'activo' },
        select: { rentaMensual: true },
        take: 1,
      },
    },
    take: 50,
  });

  const precios = propiedadesSimilares
    .map((p) => p.contracts[0]?.rentaMensual)
    .filter((p): p is number => p !== undefined);

  let precioMedioReal = precioBase;
  let precioMinReal = precioBase * 0.7;
  let precioMaxReal = precioBase * 1.4;

  if (precios.length >= 5) {
    precioMedioReal = precios.reduce((a, b) => a + b, 0) / precios.length;
    precioMinReal = Math.min(...precios);
    precioMaxReal = Math.max(...precios);
  }

  return {
    precioMedioZona: precioMedioReal,
    precioMinZona: precioMinReal,
    precioMaxZona: precioMaxReal,
    tendencia: 'estable', // En producción, calcular de históricos
    ocupacionMedia: 85,
    tiempoMedioOcupacion: 21,
  };
}

/**
 * Calcula el precio base por m²
 */
function calcularPrecioBase(inmueble: CaracteristicasInmueble, datosMercado: DatosMercado): number {
  return datosMercado.precioMedioZona;
}

/**
 * Calcula ajustes por características del inmueble
 */
function calcularAjustesInmueble(inmueble: CaracteristicasInmueble): FactorPrecio[] {
  const factores: FactorPrecio[] = [];

  // Estado de conservación
  const ajusteEstado: Record<string, number> = {
    nuevo: 15,
    reformado: 10,
    bueno: 0,
    mejorable: -15,
  };
  factores.push({
    factor: 'Estado de conservación',
    impacto: ajusteEstado[inmueble.estadoConservacion],
    descripcion: `Inmueble en estado ${inmueble.estadoConservacion}`,
  });

  // Amueblado
  if (inmueble.amueblado) {
    factores.push({
      factor: 'Amueblado',
      impacto: 10,
      descripcion: 'Vivienda completamente amueblada',
    });
  }

  // Extras
  const ajusteExtras: Record<string, number> = {
    terraza: 8,
    balcon: 4,
    parking: 10,
    trastero: 3,
    piscina: 5,
    gimnasio: 3,
    portero: 5,
    ascensor: 5,
    aire_acondicionado: 5,
    calefaccion_central: 3,
    jardin: 7,
  };

  inmueble.extras.forEach((extra) => {
    const ajuste = ajusteExtras[extra.toLowerCase().replace(/ /g, '_')];
    if (ajuste) {
      factores.push({
        factor: `Extra: ${extra}`,
        impacto: ajuste,
        descripcion: `Incluye ${extra}`,
      });
    }
  });

  // Habitaciones (ajuste por ratio superficie/habitaciones)
  const superficiePorHab = inmueble.superficie / inmueble.habitaciones;
  if (superficiePorHab > 25) {
    factores.push({
      factor: 'Habitaciones amplias',
      impacto: 5,
      descripcion: `${superficiePorHab.toFixed(0)}m² por habitación`,
    });
  } else if (superficiePorHab < 15) {
    factores.push({
      factor: 'Habitaciones pequeñas',
      impacto: -5,
      descripcion: `${superficiePorHab.toFixed(0)}m² por habitación`,
    });
  }

  // Baños
  if (inmueble.banos >= 2) {
    factores.push({
      factor: 'Múltiples baños',
      impacto: 5,
      descripcion: `${inmueble.banos} baños`,
    });
  }

  return factores;
}

/**
 * Calcula ajustes por parámetros del alquiler
 */
function calcularAjustesAlquiler(parametros: ParametrosAlquiler): FactorPrecio[] {
  const factores: FactorPrecio[] = [];

  // Duración del contrato
  if (parametros.duracionMeses >= 6) {
    const descuento = Math.min(10, (parametros.duracionMeses - 5) * 2);
    factores.push({
      factor: 'Duración larga',
      impacto: -descuento,
      descripcion: `Contrato de ${parametros.duracionMeses} meses (descuento por duración)`,
    });
  } else if (parametros.duracionMeses <= 2) {
    factores.push({
      factor: 'Duración corta',
      impacto: 15,
      descripcion: `Contrato de ${parametros.duracionMeses} meses (premium por corta duración)`,
    });
  }

  // Estacionalidad
  const mes = getMonth(parametros.fechaInicio);
  const ajusteEstacional = ESTACIONALIDAD[mes] - 100;
  if (ajusteEstacional !== 0) {
    factores.push({
      factor: 'Estacionalidad',
      impacto: ajusteEstacional,
      descripcion: ajusteEstacional > 0 ? 'Temporada alta de demanda' : 'Temporada baja de demanda',
    });
  }

  // Servicios incluidos
  const serviciosPremium = ['wifi', 'limpieza', 'luz', 'agua', 'gas'];
  const serviciosIncluidos = parametros.serviciosIncluidos.filter((s) =>
    serviciosPremium.includes(s.toLowerCase())
  );

  if (serviciosIncluidos.length >= 3) {
    factores.push({
      factor: 'Todo incluido',
      impacto: 10,
      descripcion: `Incluye: ${serviciosIncluidos.join(', ')}`,
    });
  }

  // Mascotas
  if (parametros.aceptaMascotas) {
    factores.push({
      factor: 'Acepta mascotas',
      impacto: 5,
      descripcion: 'Amplia el pool de inquilinos potenciales',
    });
  }

  return factores;
}

/**
 * Calcula el pricing óptimo
 */
export async function calcularPricingOptimo(
  inmueble: CaracteristicasInmueble,
  parametros: ParametrosAlquiler
): Promise<ResultadoPricing> {
  // 1. Obtener datos del mercado
  const datosMercado = await obtenerDatosMercado(inmueble.ciudad, inmueble.barrio);

  // 2. Calcular precio base (€/m²)
  const precioBasePorM2 = calcularPrecioBase(inmueble, datosMercado);
  const precioBase = precioBasePorM2 * inmueble.superficie;

  // 3. Calcular factores de ajuste
  const factoresInmueble = calcularAjustesInmueble(inmueble);
  const factoresAlquiler = calcularAjustesAlquiler(parametros);
  const todosFactores = [...factoresInmueble, ...factoresAlquiler];

  // 4. Aplicar ajustes
  let ajusteTotal = 0;
  todosFactores.forEach((f) => {
    ajusteTotal += f.impacto;
  });

  // Limitar ajuste total a ±50%
  ajusteTotal = Math.max(-50, Math.min(50, ajusteTotal));

  // 5. Calcular precio final
  const precioRecomendado = Math.round(precioBase * (1 + ajusteTotal / 100));
  const precioMinimo = Math.round(precioRecomendado * 0.9);
  const precioMaximo = Math.round(precioRecomendado * 1.15);

  // 6. Calcular confianza
  let confianza = 70;
  // Aumentar confianza si tenemos datos del mercado
  if (datosMercado.ocupacionMedia > 80) confianza += 10;
  if (todosFactores.length >= 5) confianza += 10;
  // Reducir si hay pocos datos
  if (datosMercado.precioMedioZona === PRECIOS_MEDIOS_ZONA['default']) confianza -= 20;

  confianza = Math.max(30, Math.min(95, confianza));

  // 7. Generar comparativas
  const comparativas: ComparativaMercado[] = [
    {
      descripcion: `Precio medio en ${inmueble.barrio || inmueble.ciudad}`,
      precio: Math.round(datosMercado.precioMedioZona * inmueble.superficie),
      diferencia: Math.round(
        (precioRecomendado / (datosMercado.precioMedioZona * inmueble.superficie) - 1) * 100
      ),
    },
    {
      descripcion: 'Precio mínimo de la zona',
      precio: Math.round(datosMercado.precioMinZona * inmueble.superficie),
      diferencia: Math.round(
        (precioRecomendado / (datosMercado.precioMinZona * inmueble.superficie) - 1) * 100
      ),
    },
    {
      descripcion: 'Precio máximo de la zona',
      precio: Math.round(datosMercado.precioMaxZona * inmueble.superficie),
      diferencia: Math.round(
        (precioRecomendado / (datosMercado.precioMaxZona * inmueble.superficie) - 1) * 100
      ),
    },
  ];

  // 8. Generar recomendaciones
  const recomendaciones: string[] = [];

  if (parametros.duracionMeses <= 3) {
    recomendaciones.push(
      `📈 Para contratos cortos (${parametros.duracionMeses} meses), puedes cobrar un 10-15% más sobre el precio de mercado.`
    );
  }

  if (ajusteTotal < -10) {
    recomendaciones.push(
      '💡 Considera mejorar el estado del inmueble o añadir servicios para justificar un precio más alto.'
    );
  }

  if (!inmueble.amueblado) {
    recomendaciones.push(
      '🛋️ Amueblar la vivienda podría aumentar el precio un 10% y atraer más inquilinos de media estancia.'
    );
  }

  if (ESTACIONALIDAD[getMonth(parametros.fechaInicio)] < 100) {
    recomendaciones.push(
      '📅 Estás en temporada baja. Considera ofrecer un descuento del 5-10% para alquilar más rápido.'
    );
  }

  if (!parametros.serviciosIncluidos.includes('wifi')) {
    recomendaciones.push(
      '📶 Incluir WiFi es prácticamente obligatorio para media estancia. Añádelo al precio.'
    );
  }

  // 9. Generar explicación
  const explicacion = `
El precio recomendado de ${precioRecomendado}€/mes se basa en:

📍 UBICACIÓN: ${inmueble.ciudad}${inmueble.barrio ? ` (${inmueble.barrio})` : ''}
   Precio medio zona: ${datosMercado.precioMedioZona}€/m²

🏠 INMUEBLE: ${inmueble.superficie}m², ${inmueble.habitaciones} hab., ${inmueble.banos} baños
   Precio base: ${precioBase}€/mes

📊 AJUSTES APLICADOS: ${ajusteTotal > 0 ? '+' : ''}${ajusteTotal}%
${todosFactores.map((f) => `   ${f.impacto > 0 ? '↑' : '↓'} ${f.factor}: ${f.impacto > 0 ? '+' : ''}${f.impacto}%`).join('\n')}

💰 RANGO DE PRECIOS SUGERIDO: ${precioMinimo}€ - ${precioMaximo}€
   Precio óptimo: ${precioRecomendado}€/mes

📈 CONFIANZA DEL ANÁLISIS: ${confianza}%
`;

  return {
    precioRecomendado,
    precioMinimo,
    precioMaximo,
    confianza,
    factores: todosFactores,
    comparativasMercado: comparativas,
    recomendaciones,
    explicacion,
  };
}

/**
 * Genera análisis de pricing usando Claude
 */
export async function generarAnalisisPricingConIA(
  inmueble: CaracteristicasInmueble,
  parametros: ParametrosAlquiler,
  pricingCalculado: ResultadoPricing
): Promise<string> {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Eres un experto en el mercado inmobiliario español, especializado en alquileres de media estancia (1-11 meses).

Analiza el siguiente pricing calculado y proporciona recomendaciones adicionales:

INMUEBLE:
- Ubicación: ${inmueble.ciudad}${inmueble.barrio ? `, ${inmueble.barrio}` : ''}
- Superficie: ${inmueble.superficie}m²
- Habitaciones: ${inmueble.habitaciones}
- Baños: ${inmueble.banos}
- Estado: ${inmueble.estadoConservacion}
- Amueblado: ${inmueble.amueblado ? 'Sí' : 'No'}
- Extras: ${inmueble.extras.join(', ') || 'Ninguno'}

PARÁMETROS DEL ALQUILER:
- Duración: ${parametros.duracionMeses} meses
- Fecha inicio: ${parametros.fechaInicio.toISOString().split('T')[0]}
- Servicios incluidos: ${parametros.serviciosIncluidos.join(', ') || 'Ninguno'}
- Acepta mascotas: ${parametros.aceptaMascotas ? 'Sí' : 'No'}

PRICING CALCULADO:
- Precio recomendado: ${pricingCalculado.precioRecomendado}€/mes
- Rango: ${pricingCalculado.precioMinimo}€ - ${pricingCalculado.precioMaximo}€
- Confianza: ${pricingCalculado.confianza}%

FACTORES CONSIDERADOS:
${pricingCalculado.factores.map((f) => `- ${f.factor}: ${f.impacto > 0 ? '+' : ''}${f.impacto}% (${f.descripcion})`).join('\n')}

Proporciona:
1. Tu opinión sobre si el precio es adecuado
2. 2-3 estrategias específicas para maximizar ingresos en media estancia
3. Posibles riesgos a considerar
4. Sugerencias para el anuncio

Responde en español, de forma concisa y profesional.`;

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL_FAST,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return 'No se pudo generar el análisis con IA.';
  } catch (error: any) {
    logger.error('[IA Pricing Error]:', error);
    return `No se pudo conectar con el servicio de IA: ${error.message}`;
  }
}

export default {
  obtenerDatosMercado,
  calcularPricingOptimo,
  generarAnalisisPricingConIA,
};
