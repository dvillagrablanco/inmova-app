/**
 * SERVICIO DE MATCHING INQUILINO-PROPIEDAD PARA MEDIA ESTANCIA
 * 
 * Algoritmo de compatibilidad entre inquilinos temporales y propiedades disponibles
 * Optimizado para alquileres de 1-11 meses
 */

import { prisma } from '../db';
import Anthropic from '@anthropic-ai/sdk';
import { differenceInMonths, addMonths, isBefore, isAfter } from 'date-fns';

import logger from '@/lib/logger';
// ==========================================
// TIPOS
// ==========================================

export interface PerfilInquilinoTemporal {
  id?: string;
  nombre?: string;
  email?: string;
  
  // Preferencias básicas
  presupuestoMin: number;
  presupuestoMax: number;
  ciudadesPreferidas: string[];
  barriosPreferidos?: string[];
  
  // Requisitos de espacio
  habitacionesMinimas: number;
  banosMinimos: number;
  superficieMinima?: number;
  
  // Requisitos temporales
  fechaEntrada: Date;
  duracionMeses: number;
  fechaFlexible: boolean; // ±15 días
  
  // Motivo de estancia
  motivoEstancia: 'trabajo' | 'estudios' | 'tratamiento_medico' | 'proyecto' | 'transicion' | 'otro';
  descripcionMotivo?: string;
  
  // Preferencias adicionales
  necesitaAmueblado: boolean;
  necesitaWifi: boolean;
  necesitaServiciosIncluidos: boolean;
  tieneMascotas: boolean;
  tipoMascota?: string;
  esFumador: boolean;
  
  // Preferencias de ubicación
  cercaTransportePublico: boolean;
  cercaCentro: boolean;
  zonasTranquilas: boolean;
  
  // Extras deseados
  extrasDeseados: string[];
}

export interface PropiedadDisponible {
  id: string;
  direccion: string;
  ciudad: string;
  barrio?: string;
  codigoPostal: string;
  
  // Características
  superficie: number;
  habitaciones: number;
  banos: number;
  amueblado: boolean;
  
  // Precio
  precioMensual: number;
  serviciosIncluidos: string[];
  gastosEstimados?: number; // Si no todo incluido
  
  // Disponibilidad
  disponibleDesde: Date;
  disponibleHasta?: Date;
  duracionMinimaContrato?: number;
  duracionMaximaContrato?: number;
  
  // Políticas
  aceptaMascotas: boolean;
  aceptaFumadores: boolean;
  
  // Extras
  extras: string[];
  
  // Ubicación
  cercaMetro?: boolean;
  cercaBus?: boolean;
  distanciaCentro?: number; // km
  
  // Fotos
  fotos?: string[];
  
  // Rating interno
  ratingPropietario?: number;
}

export interface MatchResult {
  propiedad: PropiedadDisponible;
  puntuacionTotal: number; // 0-100
  desglosePuntuacion: DesglosePuntuacion;
  compatibilidades: string[];
  incompatibilidades: string[];
  recomendaciones: string[];
}

export interface DesglosePuntuacion {
  presupuesto: number;      // 0-25
  ubicacion: number;        // 0-20
  espacio: number;          // 0-20
  disponibilidad: number;   // 0-15
  servicios: number;        // 0-10
  politicas: number;        // 0-10
}

// ==========================================
// ALGORITMO DE MATCHING
// ==========================================

/**
 * Calcula la puntuación de compatibilidad entre un inquilino y una propiedad
 */
export function calcularCompatibilidad(
  inquilino: PerfilInquilinoTemporal,
  propiedad: PropiedadDisponible
): MatchResult {
  const desglose: DesglosePuntuacion = {
    presupuesto: 0,
    ubicacion: 0,
    espacio: 0,
    disponibilidad: 0,
    servicios: 0,
    politicas: 0,
  };
  
  const compatibilidades: string[] = [];
  const incompatibilidades: string[] = [];
  const recomendaciones: string[] = [];
  
  // ========================================
  // 1. PRESUPUESTO (máx 25 puntos)
  // ========================================
  const costoTotal = propiedad.serviciosIncluidos.length > 0
    ? propiedad.precioMensual
    : propiedad.precioMensual + (propiedad.gastosEstimados || 100);
  
  if (costoTotal <= inquilino.presupuestoMax) {
    if (costoTotal >= inquilino.presupuestoMin) {
      // Dentro del rango
      const rangoTotal = inquilino.presupuestoMax - inquilino.presupuestoMin;
      const posicionEnRango = (inquilino.presupuestoMax - costoTotal) / rangoTotal;
      desglose.presupuesto = Math.round(15 + posicionEnRango * 10); // 15-25 puntos
      compatibilidades.push(`✅ Precio (${costoTotal}€) dentro del presupuesto`);
    } else {
      // Por debajo del mínimo (sospechosamente barato)
      desglose.presupuesto = 20;
      recomendaciones.push('⚠️ El precio está por debajo de tu presupuesto mínimo. Verifica las condiciones.');
    }
  } else {
    // Por encima del máximo
    const exceso = ((costoTotal - inquilino.presupuestoMax) / inquilino.presupuestoMax) * 100;
    if (exceso <= 10) {
      desglose.presupuesto = 10;
      incompatibilidades.push(`⚠️ Precio (${costoTotal}€) supera tu máximo en un ${exceso.toFixed(0)}%`);
      recomendaciones.push('Podrías negociar el precio dado que es media estancia.');
    } else {
      desglose.presupuesto = 0;
      incompatibilidades.push(`❌ Precio (${costoTotal}€) muy por encima del presupuesto`);
    }
  }
  
  // ========================================
  // 2. UBICACIÓN (máx 20 puntos)
  // ========================================
  let puntuacionUbicacion = 0;
  
  // Ciudad (8 puntos)
  if (inquilino.ciudadesPreferidas.includes(propiedad.ciudad)) {
    puntuacionUbicacion += 8;
    compatibilidades.push(`✅ Ciudad preferida: ${propiedad.ciudad}`);
  } else if (inquilino.ciudadesPreferidas.length === 0) {
    puntuacionUbicacion += 4; // Sin preferencia = puntos parciales
  } else {
    incompatibilidades.push(`⚠️ Ciudad ${propiedad.ciudad} no está en tus preferencias`);
  }
  
  // Barrio (6 puntos)
  if (inquilino.barriosPreferidos && inquilino.barriosPreferidos.length > 0) {
    if (propiedad.barrio && inquilino.barriosPreferidos.includes(propiedad.barrio)) {
      puntuacionUbicacion += 6;
      compatibilidades.push(`✅ Barrio preferido: ${propiedad.barrio}`);
    }
  } else {
    puntuacionUbicacion += 3; // Sin preferencia de barrio
  }
  
  // Transporte público (3 puntos)
  if (inquilino.cercaTransportePublico) {
    if (propiedad.cercaMetro || propiedad.cercaBus) {
      puntuacionUbicacion += 3;
      compatibilidades.push('✅ Cerca de transporte público');
    } else {
      recomendaciones.push('❓ Verifica el transporte público cercano');
    }
  } else {
    puntuacionUbicacion += 1.5;
  }
  
  // Distancia al centro (3 puntos)
  if (inquilino.cercaCentro) {
    if (propiedad.distanciaCentro !== undefined) {
      if (propiedad.distanciaCentro <= 2) {
        puntuacionUbicacion += 3;
        compatibilidades.push('✅ Muy cerca del centro');
      } else if (propiedad.distanciaCentro <= 5) {
        puntuacionUbicacion += 2;
      } else {
        incompatibilidades.push('⚠️ Lejos del centro de la ciudad');
      }
    }
  } else {
    puntuacionUbicacion += 1.5;
  }
  
  desglose.ubicacion = Math.min(20, Math.round(puntuacionUbicacion));
  
  // ========================================
  // 3. ESPACIO (máx 20 puntos)
  // ========================================
  let puntuacionEspacio = 0;
  
  // Habitaciones (10 puntos)
  if (propiedad.habitaciones >= inquilino.habitacionesMinimas) {
    puntuacionEspacio += 10;
    if (propiedad.habitaciones > inquilino.habitacionesMinimas) {
      compatibilidades.push(`✅ Más habitaciones de las requeridas (${propiedad.habitaciones})`);
    } else {
      compatibilidades.push(`✅ Habitaciones: ${propiedad.habitaciones}`);
    }
  } else {
    incompatibilidades.push(`❌ Menos habitaciones (${propiedad.habitaciones}) de las requeridas (${inquilino.habitacionesMinimas})`);
  }
  
  // Baños (5 puntos)
  if (propiedad.banos >= inquilino.banosMinimos) {
    puntuacionEspacio += 5;
  } else {
    incompatibilidades.push(`⚠️ Menos baños (${propiedad.banos}) de los preferidos`);
    puntuacionEspacio += 2;
  }
  
  // Superficie (5 puntos)
  if (inquilino.superficieMinima) {
    if (propiedad.superficie >= inquilino.superficieMinima) {
      puntuacionEspacio += 5;
      compatibilidades.push(`✅ Superficie: ${propiedad.superficie}m²`);
    } else {
      const deficit = ((inquilino.superficieMinima - propiedad.superficie) / inquilino.superficieMinima) * 100;
      if (deficit <= 15) {
        puntuacionEspacio += 2;
        recomendaciones.push(`La superficie (${propiedad.superficie}m²) es algo menor de lo deseado`);
      } else {
        incompatibilidades.push(`❌ Superficie insuficiente (${propiedad.superficie}m² vs ${inquilino.superficieMinima}m²)`);
      }
    }
  } else {
    puntuacionEspacio += 3;
  }
  
  desglose.espacio = Math.round(puntuacionEspacio);
  
  // ========================================
  // 4. DISPONIBILIDAD (máx 15 puntos)
  // ========================================
  let puntuacionDisponibilidad = 0;
  const fechaFinDeseada = addMonths(inquilino.fechaEntrada, inquilino.duracionMeses);
  
  // Fecha de entrada
  if (isBefore(propiedad.disponibleDesde, inquilino.fechaEntrada) || 
      propiedad.disponibleDesde.getTime() === inquilino.fechaEntrada.getTime()) {
    puntuacionDisponibilidad += 8;
    compatibilidades.push(`✅ Disponible desde ${propiedad.disponibleDesde.toLocaleDateString()}`);
  } else if (inquilino.fechaFlexible) {
    const diasDiferencia = Math.ceil(
      (propiedad.disponibleDesde.getTime() - inquilino.fechaEntrada.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diasDiferencia <= 15) {
      puntuacionDisponibilidad += 5;
      recomendaciones.push(`Disponible ${diasDiferencia} días después de tu fecha ideal`);
    } else {
      incompatibilidades.push(`⚠️ Disponible ${diasDiferencia} días después de tu fecha`);
      puntuacionDisponibilidad += 2;
    }
  } else {
    incompatibilidades.push(`❌ No disponible en tu fecha de entrada`);
  }
  
  // Duración permitida
  if (propiedad.duracionMinimaContrato && inquilino.duracionMeses < propiedad.duracionMinimaContrato) {
    incompatibilidades.push(`❌ Requiere mínimo ${propiedad.duracionMinimaContrato} meses de contrato`);
  } else if (propiedad.duracionMaximaContrato && inquilino.duracionMeses > propiedad.duracionMaximaContrato) {
    incompatibilidades.push(`⚠️ Máximo ${propiedad.duracionMaximaContrato} meses de contrato`);
    puntuacionDisponibilidad += 3;
  } else {
    puntuacionDisponibilidad += 7;
    compatibilidades.push(`✅ Acepta contratos de ${inquilino.duracionMeses} meses`);
  }
  
  desglose.disponibilidad = Math.min(15, Math.round(puntuacionDisponibilidad));
  
  // ========================================
  // 5. SERVICIOS (máx 10 puntos)
  // ========================================
  let puntuacionServicios = 0;
  
  // Amueblado
  if (inquilino.necesitaAmueblado) {
    if (propiedad.amueblado) {
      puntuacionServicios += 4;
      compatibilidades.push('✅ Vivienda amueblada');
    } else {
      incompatibilidades.push('❌ Necesitas amueblado pero no lo está');
    }
  } else {
    puntuacionServicios += 2;
  }
  
  // WiFi
  if (inquilino.necesitaWifi) {
    if (propiedad.serviciosIncluidos.some(s => s.toLowerCase().includes('wifi') || s.toLowerCase().includes('internet'))) {
      puntuacionServicios += 3;
      compatibilidades.push('✅ WiFi incluido');
    } else {
      recomendaciones.push('WiFi no incluido, deberás contratarlo');
    }
  } else {
    puntuacionServicios += 1.5;
  }
  
  // Servicios incluidos
  if (inquilino.necesitaServiciosIncluidos) {
    const serviciosClave = ['agua', 'luz', 'gas', 'wifi'];
    const incluidos = serviciosClave.filter(s => 
      propiedad.serviciosIncluidos.some(ps => ps.toLowerCase().includes(s))
    );
    
    if (incluidos.length >= 3) {
      puntuacionServicios += 3;
      compatibilidades.push(`✅ Servicios incluidos: ${incluidos.join(', ')}`);
    } else if (incluidos.length > 0) {
      puntuacionServicios += 1.5;
      recomendaciones.push(`Solo incluye: ${propiedad.serviciosIncluidos.join(', ')}`);
    } else {
      incompatibilidades.push('⚠️ No incluye servicios básicos');
    }
  } else {
    puntuacionServicios += 1.5;
  }
  
  desglose.servicios = Math.min(10, Math.round(puntuacionServicios));
  
  // ========================================
  // 6. POLÍTICAS (máx 10 puntos)
  // ========================================
  let puntuacionPoliticas = 5; // Base
  
  // Mascotas
  if (inquilino.tieneMascotas) {
    if (propiedad.aceptaMascotas) {
      puntuacionPoliticas += 5;
      compatibilidades.push(`✅ Acepta mascotas`);
    } else {
      puntuacionPoliticas = 0;
      incompatibilidades.push(`❌ NO acepta mascotas`);
    }
  } else {
    puntuacionPoliticas += 2.5;
  }
  
  // Fumadores
  if (inquilino.esFumador) {
    if (propiedad.aceptaFumadores) {
      puntuacionPoliticas += 2.5;
    } else {
      incompatibilidades.push(`⚠️ NO permite fumar`);
      puntuacionPoliticas -= 2;
    }
  } else {
    puntuacionPoliticas += 2.5;
    if (!propiedad.aceptaFumadores) {
      compatibilidades.push('✅ Ambiente libre de humo');
    }
  }
  
  desglose.politicas = Math.max(0, Math.min(10, Math.round(puntuacionPoliticas)));
  
  // ========================================
  // PUNTUACIÓN TOTAL
  // ========================================
  const puntuacionTotal = 
    desglose.presupuesto + 
    desglose.ubicacion + 
    desglose.espacio + 
    desglose.disponibilidad + 
    desglose.servicios + 
    desglose.politicas;
  
  return {
    propiedad,
    puntuacionTotal: Math.min(100, puntuacionTotal),
    desglosePuntuacion: desglose,
    compatibilidades,
    incompatibilidades,
    recomendaciones,
  };
}

/**
 * Encuentra las mejores propiedades para un inquilino temporal
 */
export async function encontrarMejoresMatches(
  inquilino: PerfilInquilinoTemporal,
  limite: number = 10
): Promise<MatchResult[]> {
  // Obtener propiedades disponibles de la BD
  const propiedadesDB = await prisma.unit.findMany({
    where: {
      estado: 'disponible',
      building: {
        city: { in: inquilino.ciudadesPreferidas.length > 0 ? inquilino.ciudadesPreferidas : undefined },
      },
    },
    include: {
      building: true,
      contracts: {
        where: { estado: 'activo' },
        take: 1,
      },
    },
    take: 100, // Limitar para performance
  });
  
  // Convertir a PropiedadDisponible
  const propiedades: PropiedadDisponible[] = propiedadesDB
    .filter(u => u.contracts.length === 0) // Sin contrato activo
    .map(u => ({
      id: u.id,
      direccion: u.direccion || '',
      ciudad: u.building?.city || '',
      barrio: u.building?.neighborhood || undefined,
      codigoPostal: u.building?.postalCode || '',
      superficie: u.superficie || 50,
      habitaciones: u.habitaciones || 1,
      banos: u.banos || 1,
      amueblado: u.amueblado || false,
      precioMensual: u.precioBase || 800,
      serviciosIncluidos: [], // Simplificado
      disponibleDesde: new Date(),
      aceptaMascotas: u.aceptaMascotas || false,
      aceptaFumadores: false,
      extras: [],
    }));
  
  // Calcular compatibilidad para cada propiedad
  const matches = propiedades.map(p => calcularCompatibilidad(inquilino, p));
  
  // Ordenar por puntuación y devolver los mejores
  return matches
    .sort((a, b) => b.puntuacionTotal - a.puntuacionTotal)
    .slice(0, limite);
}

/**
 * Genera explicación del matching con IA
 */
export async function generarExplicacionMatchingConIA(
  inquilino: PerfilInquilinoTemporal,
  matches: MatchResult[]
): Promise<string> {
  if (matches.length === 0) {
    return 'No se encontraron propiedades compatibles con tus criterios.';
  }
  
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const mejorMatch = matches[0];
    
    const prompt = `Eres un asesor inmobiliario especializado en alquileres de media estancia en España.

Un inquilino busca vivienda temporal por motivo de "${inquilino.motivoEstancia}" durante ${inquilino.duracionMeses} meses.

Perfil del inquilino:
- Presupuesto: ${inquilino.presupuestoMin}€ - ${inquilino.presupuestoMax}€
- Ciudades: ${inquilino.ciudadesPreferidas.join(', ')}
- Requisitos: ${inquilino.habitacionesMinimas}+ habitaciones, ${inquilino.banosMinimos}+ baños
- Necesita amueblado: ${inquilino.necesitaAmueblado ? 'Sí' : 'No'}
- Tiene mascotas: ${inquilino.tieneMascotas ? 'Sí' : 'No'}

Mejor match encontrado (${mejorMatch.puntuacionTotal}/100 puntos):
- Dirección: ${mejorMatch.propiedad.direccion}
- Precio: ${mejorMatch.propiedad.precioMensual}€/mes
- Características: ${mejorMatch.propiedad.habitaciones} hab, ${mejorMatch.propiedad.banos} baños, ${mejorMatch.propiedad.superficie}m²

Compatibilidades:
${mejorMatch.compatibilidades.join('\n')}

Incompatibilidades:
${mejorMatch.incompatibilidades.join('\n')}

Se encontraron ${matches.length} propiedades en total.

Proporciona un breve resumen (máximo 150 palabras) explicando por qué esta propiedad es el mejor match y qué debería considerar el inquilino. Responde en español de forma profesional y amigable.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return 'No se pudo generar la explicación.';
  } catch (error: any) {
    logger.error('[IA Matching Error]:', error);
    return `Encontramos ${matches.length} propiedades compatibles. La mejor opción tiene ${matches[0].puntuacionTotal} puntos de compatibilidad.`;
  }
}

export default {
  calcularCompatibilidad,
  encontrarMejoresMatches,
  generarExplicacionMatchingConIA,
};
