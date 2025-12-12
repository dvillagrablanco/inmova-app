/**
 * SERVICIO DE SCREENING AVANZADO DE CANDIDATOS
 * 
 * Sistema de verificación y scoring con 20+ criterios:
 * - Verificación de identidad (20 puntos)
 * - Verificación laboral (25 puntos)
 * - Verificación económica (25 puntos)
 * - Referencias (15 puntos)
 * - Antecedentes (15 puntos - descuento)
 * 
 * Sin integración con APIs externas - proceso manual guiado
 */

import { prisma } from '@/lib/db';
import type {ScreeningEstado, RiskLevel } from '@prisma/client';

interface ResultadoScreening {
  scoringTotal: number;
  desglosePuntos: {
    identidad: number;
    laboral: number;
    economica: number;
    referencias: number;
    antecedentes: number;
  };
  flagsRiesgo: FlagRiesgo[];
  nivelRiesgoGlobal: RiskLevel;
  recomendacion: string;
}

interface FlagRiesgo {
  tipo: string;
  descripcion: string;
  severidad: 'baja' | 'media' | 'alta';
}

/**
 * CALCULA EL SCORING COMPLETO DEL CANDIDATO
 * 
 * Evalúa 5 áreas principales con diferentes pesos:
 * 1. Identidad (20%)
 * 2. Situación Laboral (25%)
 * 3. Situación Económica (25%)
 * 4. Referencias (15%)
 * 5. Antecedentes (15%)
 */
export async function calcularScoringCompleto(
  candidateId: string
): Promise<ResultadoScreening> {
  
  // Obtener screening actual o crear uno nuevo
  let screening = await prisma.screeningCandidato.findUnique({
    where: { candidateId },
    include: {
      candidate: {
        include: {
          unit: true
        }
      }
    }
  });
  
  if (!screening) {
    throw new Error('Screening no encontrado. Crea uno primero con crearScreening()');
  }
  
  // Calcular puntos por área
  const puntosIdentidad = calcularPuntosIdentidad(screening);
  const puntosLaboral = calcularPuntosLaboral(screening);
  const puntosEconomica = calcularPuntosEconomica(screening);
  const puntosReferencias = calcularPuntosReferencias(screening);
  const puntosAntecedentes = calcularPuntosAntecedentes(screening);
  
  // Total (máximo 100)
  const scoringTotal = Math.round(
    puntosIdentidad +
    puntosLaboral +
    puntosEconomica +
    puntosReferencias +
    puntosAntecedentes
  );
  
  // Identificar flags de riesgo
  const flagsRiesgo = identificarFlagsRiesgo(screening);
  
  // Determinar nivel de riesgo global
  const nivelRiesgoGlobal = determinarNivelRiesgo(scoringTotal, flagsRiesgo);
  
  // Generar recomendación
  const recomendacion = generarRecomendacion(scoringTotal, nivelRiesgoGlobal, flagsRiesgo);
  
  return {
    scoringTotal,
    desglosePuntos: {
      identidad: puntosIdentidad,
      laboral: puntosLaboral,
      economica: puntosEconomica,
      referencias: puntosReferencias,
      antecedentes: puntosAntecedentes
    },
    flagsRiesgo,
    nivelRiesgoGlobal,
    recomendacion
  };
}

/**
 * ÁREA 1: VERIFICACIÓN DE IDENTIDAD (20 puntos máx)
 */
function calcularPuntosIdentidad(screening: any): number {
  let puntos = 0;
  
  // DNI verificado: 20 puntos
  if (screening.dniVerificado) {
    puntos = 20;
  } else {
    puntos = 0;
  }
  
  return puntos;
}

/**
 * ÁREA 2: VERIFICACIÓN LABORAL (25 puntos máx)
 */
function calcularPuntosLaboral(screening: any): number {
  let puntos = 0;
  
  // Contrato de trabajo verificado: 10 puntos
  if (screening.contratoTrabajoVerificado) {
    puntos += 10;
  }
  
  // Nóminas verificadas: 8 puntos
  if (screening.nominasVerificadas) {
    puntos += 8;
    
    // Bonus por número de nóminas (máx 3 puntos)
    const bonusNominas = Math.min(screening.mesesNominas * 0.5, 3);
    puntos += bonusNominas;
  }
  
  // Empresa contactada: 4 puntos
  if (screening.empresaContactada) {
    puntos += 4;
  }
  
  return Math.min(puntos, 25);
}

/**
 * ÁREA 3: VERIFICACIÓN ECONÓMICA (25 puntos máx)
 */
function calcularPuntosEconomica(screening: any): number {
  let puntos = 0;
  
  // Ingresos verificados: 10 puntos
  if (screening.ingresosVerificados) {
    puntos += 10;
    
    // Bonus por buen ratio ingresos/renta (máx 8 puntos)
    if (screening.ratioIngresosRenta) {
      if (screening.ratioIngresosRenta >= 4) {
        puntos += 8; // Ratio excelente (>4x)
      } else if (screening.ratioIngresosRenta >= 3) {
        puntos += 6; // Ratio bueno (3-4x)
      } else if (screening.ratioIngresosRenta >= 2.5) {
        puntos += 4; // Ratio aceptable (2.5-3x)
      } else {
        puntos += 1; // Ratio bajo (<2.5x)
      }
    }
  }
  
  // Cuenta bancaria verificada: 4 puntos
  if (screening.cuentaBancariaVerificada) {
    puntos += 4;
  }
  
  // Ahorros verificados: 3 puntos
  if (screening.ahorrosVerificados) {
    puntos += 3;
  }
  
  return Math.min(puntos, 25);
}

/**
 * ÁREA 4: REFERENCIAS (15 puntos máx)
 */
function calcularPuntosReferencias(screening: any): number {
  let puntos = 0;
  
  // Referencias aportadas
  const totalReferencias = 
    screening.referenciasPersonales +
    screening.referenciasLaborales +
    screening.referenciasPrevias;
  
  // Puntos base por referencias (máx 8 puntos)
  puntos += Math.min(totalReferencias * 1.5, 8);
  
  // Puntos por referencias contactadas (máx 4 puntos)
  if (screening.referenciasContactadas > 0) {
    puntos += Math.min(screening.referenciasContactadas * 2, 4);
  }
  
  // Bonus por referencias positivas (máx 3 puntos)
  if (screening.referenciasPositivas > 0) {
    const porcentajePositivo = screening.referenciasContactadas > 0
      ? screening.referenciasPositivas / screening.referenciasContactadas
      : 0;
    
    puntos += porcentajePositivo * 3;
  }
  
  return Math.min(puntos, 15);
}

/**
 * ÁREA 5: ANTECEDENTES (15 puntos máx - se restan por problemas)
 */
function calcularPuntosAntecedentes(screening: any): number {
  let puntos = 15; // Comienza con puntuación máxima
  
  // Descuentos por flags negativos
  if (screening.ficherosMorosidad) {
    puntos -= 10; // Penalización alta por morosidad
  }
  
  if (screening.impagosAnteriores) {
    puntos -= 8; // Penalización alta por impagos
  }
  
  if (screening.demandasPrevias) {
    puntos -= 5; // Penalización media por demandas
  }
  
  return Math.max(puntos, 0);
}

/**
 * Identifica flags de riesgo basados en los datos del screening
 */
function identificarFlagsRiesgo(screening: any): FlagRiesgo[] {
  const flags: FlagRiesgo[] = [];
  
  // FLAGS DE IDENTIDAD
  if (!screening.dniVerificado) {
    flags.push({
      tipo: 'Identidad',
      descripcion: 'DNI no verificado',
      severidad: 'alta'
    });
  }
  
  // FLAGS LABORALES
  if (!screening.contratoTrabajoVerificado) {
    flags.push({
      tipo: 'Laboral',
      descripcion: 'Contrato de trabajo no verificado',
      severidad: 'media'
    });
  }
  
  if (!screening.nominasVerificadas) {
    flags.push({
      tipo: 'Laboral',
      descripcion: 'Nóminas no verificadas',
      severidad: 'media'
    });
  }
  
  if (screening.mesesNominas < 3) {
    flags.push({
      tipo: 'Laboral',
      descripcion: 'Menos de 3 meses de nóminas',
      severidad: 'baja'
    });
  }
  
  // FLAGS ECONÓMICOS
  if (screening.ratioIngresosRenta && screening.ratioIngresosRenta < 2.5) {
    flags.push({
      tipo: 'Económico',
      descripcion: `Ratio ingresos/renta bajo (${screening.ratioIngresosRenta.toFixed(1)}x)`,
      severidad: 'alta'
    });
  }
  
  if (!screening.cuentaBancariaVerificada) {
    flags.push({
      tipo: 'Económico',
      descripcion: 'Cuenta bancaria no verificada',
      severidad: 'baja'
    });
  }
  
  // FLAGS DE REFERENCIAS
  const totalReferencias = 
    screening.referenciasPersonales +
    screening.referenciasLaborales +
    screening.referenciasPrevias;
  
  if (totalReferencias < 2) {
    flags.push({
      tipo: 'Referencias',
      descripcion: 'Menos de 2 referencias aportadas',
      severidad: 'media'
    });
  }
  
  if (screening.referenciasContactadas === 0) {
    flags.push({
      tipo: 'Referencias',
      descripcion: 'No se han contactado referencias',
      severidad: 'baja'
    });
  }
  
  // FLAGS DE ANTECEDENTES
  if (screening.ficherosMorosidad) {
    flags.push({
      tipo: 'Antecedentes',
      descripcion: 'Aparece en ficheros de morosidad (ASNEF/RAI)',
      severidad: 'alta'
    });
  }
  
  if (screening.impagosAnteriores) {
    flags.push({
      tipo: 'Antecedentes',
      descripcion: 'Historial de impagos en alquileres anteriores',
      severidad: 'alta'
    });
  }
  
  if (screening.demandasPrevias) {
    flags.push({
      tipo: 'Antecedentes',
      descripcion: 'Demandas judiciales previas',
      severidad: 'media'
    });
  }
  
  return flags;
}

/**
 * Determina el nivel de riesgo global
 */
function determinarNivelRiesgo(
  scoringTotal: number,
  flags: FlagRiesgo[]
): RiskLevel {
  
  // Contar flags por severidad
  const flagsAlta = flags.filter(f => f.severidad === 'alta').length;
  const flagsMedia = flags.filter(f => f.severidad === 'media').length;
  
  // Clasificación de 4 niveles (D -> A):
  // D (crítico): scoring < 40 o 3+ flags alta
  // C (alto): scoring 40-59 o 2 flags alta
  // B (medio): scoring 60-79 o 1 flag alta o 3+ flags media
  // A (bajo): scoring 80+ y flags bajos
  
  // Nivel D - Crítico (muy riesgoso, no recomendado)
  if (flagsAlta >= 3 || scoringTotal < 40) return 'critico';
  
  // Nivel C - Alto (riesgo significativo)
  if (flagsAlta >= 2 || scoringTotal < 60) return 'alto';
  
  // Nivel B - Medio (riesgo moderado, revisar)
  if (flagsAlta === 1 || flagsMedia >= 3 || scoringTotal < 80) return 'medio';
  
  // Nivel A - Bajo (excelente candidato)
  return 'bajo';
}

/**
 * Genera recomendación basada en el scoring y flags
 */
function generarRecomendacion(
  scoringTotal: number,
  nivelRiesgo: RiskLevel,
  flags: FlagRiesgo[]
): string {
  
  const recomendaciones: string[] = [];
  
  // Recomendación principal
  if (scoringTotal >= 80) {
    recomendaciones.push('RECOMENDADO: Candidato con perfil excelente.');
  } else if (scoringTotal >= 70) {
    recomendaciones.push('ACEPTABLE: Candidato con buen perfil.');
  } else if (scoringTotal >= 50) {
    recomendaciones.push('REVISAR: Candidato con perfil regular. Se recomienda análisis detallado.');
  } else {
    recomendaciones.push('NO RECOMENDADO: Candidato con perfil de alto riesgo.');
  }
  
  // Mencionar flags críticos
  const flagsCriticos = flags.filter(f => f.severidad === 'alta');
  if (flagsCriticos.length > 0) {
    recomendaciones.push(
      `\n\nALERTAS CRÍTICAS: ${flagsCriticos.map(f => f.descripcion).join(', ')}.`
    );
  }
  
  // Condiciones especiales
  if (scoringTotal >= 60 && scoringTotal < 80) {
    recomendaciones.push(
      '\n\nSUGERENCIAS: Considerar aval solidario, aumento de fianza o seguro de impago.'
    );
  }
  
  return recomendaciones.join(' ');
}

/**
 * Crea un nuevo screening para un candidato
 */
export async function crearScreening(
  companyId: string,
  candidateId: string
) {
  
  // Verificar que el candidato existe
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { unit: true }
  });
  
  if (!candidate) {
    throw new Error('Candidato no encontrado');
  }
  
  // Crear screening con valores por defecto
  return await prisma.screeningCandidato.create({
    data: {
      companyId,
      candidateId,
      estado: 'pendiente',
      scoringTotal: 0,
      dniVerificado: false,
      dniPuntos: 0,
      contratoTrabajoVerificado: false,
      nominasVerificadas: false,
      mesesNominas: 0,
      empresaContactada: false,
      laboralPuntos: 0,
      ingresosVerificados: false,
      cuentaBancariaVerificada: false,
      ahorrosVerificados: false,
      economicaPuntos: 0,
      referenciasPersonales: 0,
      referenciasLaborales: 0,
      referenciasPrevias: 0,
      referenciasContactadas: 0,
      referenciasPositivas: 0,
      referenciasPuntos: 0,
      ficherosMorosidad: false,
      impagosAnteriores: false,
      demandasPrevias: false,
      antecedentesPuntos: 15,
      documentosRequeridos: [
        { nombre: 'DNI', recibido: false, verificado: false },
        { nombre: 'Contrato de trabajo', recibido: false, verificado: false },
        { nombre: 'Nóminas (3 últimas)', recibido: false, verificado: false },
        { nombre: 'Declaración de la renta', recibido: false, verificado: false },
        { nombre: 'Referencias personales', recibido: false, verificado: false }
      ],
      documentosCompletos: false,
      entrevistaRealizada: false,
      visitaRealizada: false,
      nivelRiesgoGlobal: 'medio'
    }
  });
}

/**
 * Actualiza los datos del screening
 */
export async function actualizarScreening(
  screeningId: string,
  datos: any
) {
  return await prisma.screeningCandidato.update({
    where: { id: screeningId },
    data: datos
  });
}
