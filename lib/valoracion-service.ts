/**
 * SERVICIO DE VALORACIÓN AUTOMÁTICA DE PROPIEDADES
 * 
 * Sistema inteligente de valoración basado en:
 * - Análisis de comparables (propiedades similares en la zona)
 * - Características de la propiedad
 * - Datos de mercado local
 * - Factores positivos y negativos
 * 
 * Sin integración con APIs externas - utiliza datos locales
 */

// Lazy Prisma loading
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
import { ValoracionMetodo, ValoracionFinalidad } from '@/types/prisma-types';

interface DatosPropiedad {
  unitId?: string;
  buildingId?: string;
  direccion: string;
  municipio: string;
  provincia: string;
  codigoPostal?: string;
  metrosCuadrados: number;
  habitaciones?: number;
  banos?: number;
  garajes?: number;
  trasteros?: number;
  ascensor?: boolean;
  terraza?: boolean;
  jardin?: boolean;
  piscina?: boolean;
  anosConstruccion?: number;
  estadoConservacion?: 'excelente' | 'bueno' | 'aceptable' | 'reformar';
  orientacion?: 'norte' | 'sur' | 'este' | 'oeste';
  eficienciaEnergetica?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
}

interface ResultadoValoracion {
  valorEstimado: number;
  valorMinimo: number;
  valorMaximo: number;
  precioM2: number;
  confianzaValoracion: number;
  numComparables: number;
  comparablesData: any[];
  factoresPositivos: string[];
  factoresNegativos: string[];
  recomendacionPrecio: string;
  precioMedioZona?: number;
  demandaZona?: 'alta' | 'media' | 'baja';
  diasPromedioVenta?: number;
}

/**
 * ALGORITMO DE VALORACIÓN POR COMPARABLES
 * 
 * 1. Busca propiedades similares en el sistema
 * 2. Calcula precio base por m²
 * 3. Aplica ajustes por características
 * 4. Genera rangos de valor
 */
export async function calcularValoracionPropiedad(
  companyId: string,
  datos: DatosPropiedad,
  metodo: ValoracionMetodo,
  finalidad: ValoracionFinalidad,
  generadoPor: string
): Promise<ResultadoValoracion> {
  
  // 1. BUSCAR COMPARABLES EN LA ZONA
  const comparables = await buscarComparables(companyId, datos);
  
  // 2. CALCULAR PRECIO BASE POR M²
  let precioM2Base = calcularPrecioM2Base(comparables, datos.municipio);
  
  // 3. APLICAR AJUSTES POR CARACTERÍSTICAS
  const { precioM2Ajustado, factoresPositivos, factoresNegativos } = aplicarAjustes(
    precioM2Base,
    datos
  );
  
  // 4. CALCULAR VALORES
  const valorEstimado = Math.round(precioM2Ajustado * datos.metrosCuadrados);
  const margenVariacion = 0.10; // ±10%
  const valorMinimo = Math.round(valorEstimado * (1 - margenVariacion));
  const valorMaximo = Math.round(valorEstimado * (1 + margenVariacion));
  
  // 5. CALCULAR CONFIANZA (basado en número de comparables y similitud)
  const confianzaValoracion = calcularConfianza(comparables.length, datos);
  
  // 6. ANÁLISIS DE MERCADO
  const analisisMercado = await analizarMercadoLocal(datos.municipio, finalidad);
  
  // 7. RECOMENDACIÓN DE PRECIO
  const recomendacionPrecio = generarRecomendacion(
    valorEstimado,
    finalidad,
    analisisMercado,
    factoresPositivos,
    factoresNegativos
  );
  
  return {
    valorEstimado,
    valorMinimo,
    valorMaximo,
    precioM2: Math.round(precioM2Ajustado),
    confianzaValoracion,
    numComparables: comparables.length,
    comparablesData: comparables,
    factoresPositivos,
    factoresNegativos,
    recomendacionPrecio,
    precioMedioZona: analisisMercado.precioMedioZona,
    demandaZona: analisisMercado.demandaZona,
    diasPromedioVenta: analisisMercado.diasPromedioVenta
  };
}

/**
 * Busca propiedades comparables en el sistema
 */
async function buscarComparables(
  companyId: string,
  datos: DatosPropiedad
): Promise<any[]> {
  
  // Buscar unidades similares en la misma zona
  const units = await prisma.unit.findMany({
    where: {
      building: {
        companyId: companyId
      },
      superficie: {
        gte: datos.metrosCuadrados * 0.8, // ±20% m²
        lte: datos.metrosCuadrados * 1.2
      },
      ...(datos.habitaciones && {
        habitaciones: {
          gte: Math.max(1, datos.habitaciones - 1),
          lte: datos.habitaciones + 1
        }
      })
    },
    include: {
      building: true,
      contracts: {
        where: {
          estado: 'activo'
        },
        take: 1,
        orderBy: {
          fechaInicio: 'desc'
        }
      }
    },
    take: 10 // Máximo 10 comparables
  });
  
  // Convertir a formato comparable
  return units.map(unit => ({
    id: unit.id,
    direccion: unit.building?.direccion || '',
    metrosCuadrados: unit.superficie,
    habitaciones: unit.habitaciones,
    banos: unit.banos,
    precioM2: unit.rentaMensual ? Math.round((unit.rentaMensual * 12) / unit.superficie * 15) : 0, // Estimación
    similitud: calcularSimilitud(datos, unit)
  }));
}

/**
 * Calcula la similitud entre dos propiedades (0-100%)
 */
function calcularSimilitud(datos: DatosPropiedad, unit: any): number {
  let similitud = 100;
  
  // Penalizar diferencias de m²
  const difM2 = Math.abs(datos.metrosCuadrados - unit.superficie) / datos.metrosCuadrados;
  similitud -= difM2 * 20;
  
  // Penalizar diferencias de habitaciones
  if (datos.habitaciones && unit.habitaciones) {
    similitud -= Math.abs(datos.habitaciones - unit.habitaciones) * 5;
  }
  
  return Math.max(0, Math.round(similitud));
}

/**
 * Calcula el precio base por m² usando comparables
 */
function calcularPrecioM2Base(comparables: any[], municipio: string): number {
  if (comparables.length === 0) {
    // Precios promedio por defecto según tipo de municipio
    const preciosBase: { [key: string]: number } = {
      'Madrid': 3500,
      'Barcelona': 3200,
      'Valencia': 2000,
      'Sevilla': 1800,
      'default': 1500
    };
    
    return preciosBase[municipio] || preciosBase['default'];
  }
  
  // Calcular media ponderada por similitud
  const sumaPrecios = comparables.reduce((sum, c) => sum + (c.precioM2 * c.similitud), 0);
  const sumaSimilitudes = comparables.reduce((sum, c) => sum + c.similitud, 0);
  
  return sumaSimilitudes > 0 ? sumaPrecios / sumaSimilitudes : 1500;
}

/**
 * Aplica ajustes al precio por características de la propiedad
 */
function aplicarAjustes(
  precioM2Base: number,
  datos: DatosPropiedad
): {
  precioM2Ajustado: number;
  factoresPositivos: string[];
  factoresNegativos: string[];
} {
  let precioM2 = precioM2Base;
  const factoresPositivos: string[] = [];
  const factoresNegativos: string[] = [];
  
  // AJUSTES POSITIVOS
  
  if (datos.ascensor) {
    precioM2 *= 1.05; // +5%
    factoresPositivos.push('Edificio con ascensor (+5%)');
  }
  
  if (datos.terraza) {
    precioM2 *= 1.08; // +8%
    factoresPositivos.push('Terraza disponible (+8%)');
  }
  
  if (datos.jardin) {
    precioM2 *= 1.10; // +10%
    factoresPositivos.push('Jardín privado (+10%)');
  }
  
  if (datos.piscina) {
    precioM2 *= 1.12; // +12%
    factoresPositivos.push('Piscina comunitaria (+12%)');
  }
  
  if (datos.garajes && datos.garajes > 0) {
    precioM2 *= 1 + (datos.garajes * 0.03); // +3% por garaje
    factoresPositivos.push(`${datos.garajes} plaza(s) de garaje (+${datos.garajes * 3}%)`);
  }
  
  if (datos.orientacion === 'sur') {
    precioM2 *= 1.04; // +4%
    factoresPositivos.push('Orientación sur (+4%)');
  }
  
  if (datos.eficienciaEnergetica && ['A', 'B', 'C'].includes(datos.eficienciaEnergetica)) {
    precioM2 *= 1.06; // +6%
    factoresPositivos.push(`Eficiencia energética ${datos.eficienciaEnergetica} (+6%)`);
  }
  
  if (datos.estadoConservacion === 'excelente') {
    precioM2 *= 1.10; // +10%
    factoresPositivos.push('Estado de conservación excelente (+10%)');
  } else if (datos.estadoConservacion === 'bueno') {
    precioM2 *= 1.03; // +3%
    factoresPositivos.push('Buen estado de conservación (+3%)');
  }
  
  // AJUSTES NEGATIVOS
  
  if (!datos.ascensor && datos.habitaciones && datos.habitaciones >= 3) {
    precioM2 *= 0.95; // -5%
    factoresNegativos.push('Sin ascensor en edificio grande (-5%)');
  }
  
  if (datos.estadoConservacion === 'reformar') {
    precioM2 *= 0.85; // -15%
    factoresNegativos.push('Necesita reforma integral (-15%)');
  } else if (datos.estadoConservacion === 'aceptable') {
    precioM2 *= 0.97; // -3%
    factoresNegativos.push('Necesita reformas menores (-3%)');
  }
  
  if (datos.anosConstruccion && datos.anosConstruccion > 40) {
    precioM2 *= 0.92; // -8%
    factoresNegativos.push('Edificio antiguo (>40 años) (-8%)');
  }
  
  if (datos.orientacion === 'norte') {
    precioM2 *= 0.96; // -4%
    factoresNegativos.push('Orientación norte (-4%)');
  }
  
  if (datos.eficienciaEnergetica && ['F', 'G'].includes(datos.eficienciaEnergetica)) {
    precioM2 *= 0.94; // -6%
    factoresNegativos.push(`Baja eficiencia energética ${datos.eficienciaEnergetica} (-6%)`);
  }
  
  return {
    precioM2Ajustado: precioM2,
    factoresPositivos,
    factoresNegativos
  };
}

/**
 * Calcula el nivel de confianza de la valoración
 */
function calcularConfianza(numComparables: number, datos: DatosPropiedad): number {
  let confianza = 50; // Base 50%
  
  // Más comparables = más confianza
  confianza += Math.min(numComparables * 5, 30); // +5% por comparable, máx +30%
  
  // Datos completos = más confianza
  if (datos.habitaciones) confianza += 3;
  if (datos.banos) confianza += 2;
  if (datos.estadoConservacion) confianza += 5;
  if (datos.eficienciaEnergetica) confianza += 5;
  if (datos.anosConstruccion) confianza += 5;
  
  return Math.min(100, Math.round(confianza));
}

/**
 * Analiza el mercado local (simulado con datos históricos)
 */
async function analizarMercadoLocal(
  municipio: string,
  finalidad: ValoracionFinalidad
): Promise<{
  precioMedioZona?: number;
  demandaZona: 'alta' | 'media' | 'baja';
  diasPromedioVenta?: number;
}> {
  
  // Simulación de datos de mercado
  const mercadosPorMunicipio: { [key: string]: any } = {
    'Madrid': {
      precioMedioZona: 3500,
      demandaZona: 'alta',
      diasPromedioVenta: 45
    },
    'Barcelona': {
      precioMedioZona: 3200,
      demandaZona: 'alta',
      diasPromedioVenta: 50
    },
    'Valencia': {
      precioMedioZona: 2000,
      demandaZona: 'media',
      diasPromedioVenta: 75
    },
    'default': {
      precioMedioZona: 1500,
      demandaZona: 'media',
      diasPromedioVenta: 90
    }
  };
  
  return mercadosPorMunicipio[municipio] || mercadosPorMunicipio['default'];
}

/**
 * Genera recomendación de precio según análisis
 */
function generarRecomendacion(
  valorEstimado: number,
  finalidad: ValoracionFinalidad,
  analisisMercado: any,
  factoresPositivos: string[],
  factoresNegativos: string[]
): string {
  
  const recomendaciones: string[] = [];
  
  // Recomendación principal
  if (finalidad === 'venta') {
    recomendaciones.push(
      `Precio de venta recomendado: ${formatCurrency(valorEstimado)}. `
    );
    
    if (analisisMercado.demandaZona === 'alta') {
      recomendaciones.push(
        'La zona tiene alta demanda, puedes posicionarte en el rango superior del valor estimado. '
      );
    } else if (analisisMercado.demandaZona === 'baja') {
      recomendaciones.push(
        'Zona con demanda moderada, considera empezar en el rango inferior para agilizar la venta. '
      );
    }
    
    recomendaciones.push(
      `Tiempo estimado de venta: ${analisisMercado.diasPromedioVenta} días. `
    );
    
  } else if (finalidad === 'alquiler') {
    const rentaMensual = Math.round(valorEstimado * 0.004); // ~0.4% valor/mes
    recomendaciones.push(
      `Renta mensual recomendada: ${formatCurrency(rentaMensual)}/mes. `
    );
  }
  
  // Destacar puntos fuertes
  if (factoresPositivos.length > 0) {
    recomendaciones.push(
      `\n\nPuntos fuertes a destacar: ${factoresPositivos.slice(0, 3).join(', ')}. `
    );
  }
  
  // Advertir sobre puntos débiles
  if (factoresNegativos.length > 0) {
    recomendaciones.push(
      `\n\nAspectos a mejorar: ${factoresNegativos.slice(0, 2).join(', ')}. `
    );
  }
  
  return recomendaciones.join('');
}

/**
 * Guarda la valoración en la base de datos
 */
export async function guardarValoracion(
  companyId: string,
  datos: DatosPropiedad,
  metodo: ValoracionMetodo,
  finalidad: ValoracionFinalidad,
  resultado: ResultadoValoracion,
  generadoPor: string
) {
  
  // Validez de 6 meses
  const validoHasta = new Date();
  validoHasta.setMonth(validoHasta.getMonth() + 6);
  
  return await prisma.valoracionPropiedad.create({
    data: {
      companyId,
      unitId: datos.unitId,
      buildingId: datos.buildingId,
      direccion: datos.direccion,
      municipio: datos.municipio,
      provincia: datos.provincia,
      codigoPostal: datos.codigoPostal,
      metrosCuadrados: datos.metrosCuadrados,
      habitaciones: datos.habitaciones,
      banos: datos.banos,
      garajes: datos.garajes,
      trasteros: datos.trasteros,
      ascensor: datos.ascensor || false,
      terraza: datos.terraza || false,
      jardin: datos.jardin || false,
      piscina: datos.piscina || false,
      anosConstruccion: datos.anosConstruccion,
      estadoConservacion: datos.estadoConservacion,
      orientacion: datos.orientacion,
      eficienciaEnergetica: datos.eficienciaEnergetica,
      metodo,
      finalidad,
      valorEstimado: resultado.valorEstimado,
      valorMinimo: resultado.valorMinimo,
      valorMaximo: resultado.valorMaximo,
      precioM2: resultado.precioM2,
      confianzaValoracion: resultado.confianzaValoracion,
      numComparables: resultado.numComparables,
      comparablesData: resultado.comparablesData,
      factoresPositivos: resultado.factoresPositivos,
      factoresNegativos: resultado.factoresNegativos,
      recomendacionPrecio: resultado.recomendacionPrecio,
      precioMedioZona: resultado.precioMedioZona,
      demandaZona: resultado.demandaZona,
      diasPromedioVenta: resultado.diasPromedioVenta,
      generadoPor,
      validoHasta
    }
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}
