/**
 * Servicio de Matching Automático con IA para eWoorker
 *
 * Recomienda subcontratistas basándose en:
 * - Especialidad y experiencia
 * - Ubicación geográfica
 * - Valoraciones y trabajos completados
 * - Disponibilidad actual
 * - Historial de colaboración
 * - Precio/tarifa
 *
 * @module EwoorkerMatchingService
 */

import { prisma } from './db';
import logger from './logger';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// TIPOS
// ============================================================================

export interface MatchCriteria {
  obraId?: string;
  especialidad: string;
  especialidadesSecundarias?: string[];
  provincia: string;
  presupuestoMax?: number;
  fechaInicio?: Date;
  duracionDias?: number;
  nivelExperienciaMin?: number; // años
  ratingMin?: number; // 0-5
  soloVerificados?: boolean;
  soloConREA?: boolean;
  excludeEmpresaIds?: string[];
}

export interface MatchResult {
  empresaId: string;
  empresa: {
    nombre: string;
    logo?: string;
    especialidad: string;
    descripcion?: string;
    verificada: boolean;
    rating: number;
    trabajosCompletados: number;
    aniosExperiencia?: number;
  };
  matchScore: number; // 0-100
  matchReasons: string[];
  distanciaKm?: number;
  tarifaEstimada?: number;
  disponibilidadInmediata: boolean;
  trabajadoresDisponibles: number;
}

export interface TrabajadorMatchResult {
  trabajadorId: string;
  trabajador: {
    nombre: string;
    foto?: string;
    especialidad: string;
    experienciaAnios?: number;
    rating: number;
    trabajosCompletados: number;
    tarifaHora?: number;
    tarifaDia?: number;
    tienePRL: boolean;
  };
  empresaNombre: string;
  matchScore: number;
  matchReasons: string[];
  disponibleDesde?: Date;
  disponibleHasta?: Date;
}

// ============================================================================
// PESOS DE MATCHING
// ============================================================================

const MATCH_WEIGHTS = {
  ESPECIALIDAD_PRINCIPAL: 25,
  ESPECIALIDAD_SECUNDARIA: 15,
  ZONA_OPERACION: 20,
  RATING: 15,
  EXPERIENCIA: 10,
  VERIFICACION: 10,
  DISPONIBILIDAD: 10,
  HISTORIAL_POSITIVO: 10,
  PRECIO_COMPETITIVO: 5,
  REA_VIGENTE: 5,
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class EwoorkerMatchingService {
  private anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  /**
   * Encuentra empresas que mejor encajan con una obra
   */
  async findMatchingEmpresas(criteria: MatchCriteria, limit: number = 10): Promise<MatchResult[]> {
    try {
      // 1. Búsqueda base en BD
      const empresas = await prisma.ewoorkerPerfilEmpresa.findMany({
        where: {
          activo: true,
          ...(criteria.soloVerificados && { verificado: true }),
          OR: [
            { especialidadPrincipal: criteria.especialidad },
            { especialidadesSecundarias: { has: criteria.especialidad } },
            ...(criteria.especialidadesSecundarias?.map((e) => ({
              OR: [{ especialidadPrincipal: e }, { especialidadesSecundarias: { has: e } }],
            })) || []),
          ],
          zonasOperacion: { has: criteria.provincia },
          ...(criteria.excludeEmpresaIds && {
            id: { notIn: criteria.excludeEmpresaIds },
          }),
        },
        include: {
          company: true,
          documentos: {
            where: {
              estado: 'aprobado',
              OR: [{ fechaVencimiento: null }, { fechaVencimiento: { gt: new Date() } }],
            },
          },
          reviews: {
            where: { tipoReview: 'PARA_SUBCONTRATISTA' },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          contratos: {
            where: { estado: 'completado' },
            select: { id: true },
          },
          trabajadores: {
            where: { activo: true, disponible: true },
            select: { id: true },
          },
        },
        take: 50, // Obtener más para filtrar después
      });

      // 2. Calcular scores
      const scoredResults: MatchResult[] = empresas.map((empresa) => {
        const score = this.calculateMatchScore(empresa, criteria);
        return {
          empresaId: empresa.id,
          empresa: {
            nombre: empresa.company.nombre,
            logo: empresa.logoUrl || undefined,
            especialidad: empresa.especialidadPrincipal,
            descripcion: empresa.descripcion || undefined,
            verificada: empresa.verificado,
            rating: empresa.rating,
            trabajosCompletados: empresa.contratos.length,
            aniosExperiencia: empresa.aniosExperiencia || undefined,
          },
          matchScore: score.total,
          matchReasons: score.reasons,
          tarifaEstimada: empresa.tarifaMediaHora
            ? empresa.tarifaMediaHora * 8 * (criteria.duracionDias || 1)
            : undefined,
          disponibilidadInmediata: empresa.trabajadores.length > 0,
          trabajadoresDisponibles: empresa.trabajadores.length,
        };
      });

      // 3. Ordenar por score y limitar
      scoredResults.sort((a, b) => b.matchScore - a.matchScore);

      // 4. Si hay IA disponible, reordenar con criterios adicionales
      if (this.anthropic && criteria.obraId) {
        return await this.aiEnhancedRanking(scoredResults.slice(0, limit * 2), criteria);
      }

      return scoredResults.slice(0, limit);
    } catch (error: any) {
      logger.error('[EwoorkerMatching] Error buscando empresas:', error);
      return [];
    }
  }

  /**
   * Encuentra trabajadores individuales disponibles
   */
  async findMatchingTrabajadores(
    criteria: MatchCriteria,
    limit: number = 20
  ): Promise<TrabajadorMatchResult[]> {
    try {
      const trabajadores = await prisma.ewoorkerTrabajador.findMany({
        where: {
          activo: true,
          disponible: true,
          OR: [
            { especialidad: criteria.especialidad },
            { especialidadesSecundarias: { has: criteria.especialidad } },
          ],
          perfilEmpresa: {
            activo: true,
            verificado: criteria.soloVerificados || undefined,
            zonasOperacion: { has: criteria.provincia },
            id: criteria.excludeEmpresaIds ? { notIn: criteria.excludeEmpresaIds } : undefined,
          },
          ...(criteria.nivelExperienciaMin && {
            experienciaAnios: { gte: criteria.nivelExperienciaMin },
          }),
          ...(criteria.ratingMin && {
            rating: { gte: criteria.ratingMin },
          }),
          ...(criteria.soloConREA && {
            tienePRL: true,
          }),
          // Disponibilidad en fechas
          ...(criteria.fechaInicio && {
            OR: [{ disponibleDesde: null }, { disponibleDesde: { lte: criteria.fechaInicio } }],
          }),
        },
        include: {
          perfilEmpresa: {
            include: {
              company: { select: { nombre: true } },
            },
          },
        },
        orderBy: [{ rating: 'desc' }, { trabajosCompletados: 'desc' }],
        take: limit * 2,
      });

      // Calcular scores
      const scoredResults: TrabajadorMatchResult[] = trabajadores.map((t) => {
        const score = this.calculateTrabajadorScore(t, criteria);
        return {
          trabajadorId: t.id,
          trabajador: {
            nombre: `${t.nombre} ${t.apellidos || ''}`.trim(),
            foto: t.fotoUrl || undefined,
            especialidad: t.especialidad,
            experienciaAnios: t.experienciaAnios || undefined,
            rating: t.rating,
            trabajosCompletados: t.trabajosCompletados,
            tarifaHora: t.tarifaHora || undefined,
            tarifaDia: t.tarifaDia || undefined,
            tienePRL: t.tienePRL,
          },
          empresaNombre: t.perfilEmpresa.company.nombre,
          matchScore: score.total,
          matchReasons: score.reasons,
          disponibleDesde: t.disponibleDesde || undefined,
          disponibleHasta: t.disponibleHasta || undefined,
        };
      });

      scoredResults.sort((a, b) => b.matchScore - a.matchScore);

      return scoredResults.slice(0, limit);
    } catch (error: any) {
      logger.error('[EwoorkerMatching] Error buscando trabajadores:', error);
      return [];
    }
  }

  /**
   * Obtiene recomendaciones para una obra específica
   */
  async getRecommendationsForObra(obraId: string): Promise<{
    empresas: MatchResult[];
    trabajadores: TrabajadorMatchResult[];
  }> {
    try {
      const obra = await prisma.ewoorkerObra.findUnique({
        where: { id: obraId },
        include: {
          perfilEmpresa: true,
        },
      });

      if (!obra) {
        return { empresas: [], trabajadores: [] };
      }

      const criteria: MatchCriteria = {
        obraId,
        especialidad: obra.especialidad,
        especialidadesSecundarias: obra.especialidadesRequeridas || [],
        provincia: obra.provincia,
        presupuestoMax: obra.presupuestoEstimado || undefined,
        fechaInicio: obra.fechaInicio || undefined,
        duracionDias: obra.duracionEstimadaDias || undefined,
        soloVerificados: true,
        excludeEmpresaIds: [obra.perfilEmpresaId], // Excluir la empresa que publica
      };

      const [empresas, trabajadores] = await Promise.all([
        this.findMatchingEmpresas(criteria, 10),
        this.findMatchingTrabajadores(criteria, 20),
      ]);

      return { empresas, trabajadores };
    } catch (error: any) {
      logger.error('[EwoorkerMatching] Error obteniendo recomendaciones:', error);
      return { empresas: [], trabajadores: [] };
    }
  }

  /**
   * Sugiere precio competitivo para una oferta
   */
  async suggestCompetitivePrice(
    obraId: string,
    especialidad: string
  ): Promise<{
    precioSugerido: number;
    rangoBajo: number;
    rangoAlto: number;
    basadoEn: number;
  } | null> {
    try {
      // Buscar contratos similares completados
      const contratosSimilares = await prisma.ewoorkerContrato.findMany({
        where: {
          estado: 'completado',
          obra: {
            especialidad,
          },
        },
        select: {
          montoTotal: true,
          obra: {
            select: {
              duracionEstimadaDias: true,
              presupuestoEstimado: true,
            },
          },
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });

      if (contratosSimilares.length < 3) {
        return null; // No hay suficientes datos
      }

      const precios = contratosSimilares.map((c) => c.montoTotal);
      const promedio = precios.reduce((a, b) => a + b, 0) / precios.length;
      const min = Math.min(...precios);
      const max = Math.max(...precios);

      return {
        precioSugerido: Math.round(promedio),
        rangoBajo: Math.round(min),
        rangoAlto: Math.round(max),
        basadoEn: contratosSimilares.length,
      };
    } catch (error: any) {
      logger.error('[EwoorkerMatching] Error sugiriendo precio:', error);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // CÁLCULO DE SCORES
  // --------------------------------------------------------------------------

  private calculateMatchScore(
    empresa: any,
    criteria: MatchCriteria
  ): { total: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Especialidad principal
    if (empresa.especialidadPrincipal === criteria.especialidad) {
      score += MATCH_WEIGHTS.ESPECIALIDAD_PRINCIPAL;
      reasons.push('Especialidad principal coincide');
    } else if (empresa.especialidadesSecundarias?.includes(criteria.especialidad)) {
      score += MATCH_WEIGHTS.ESPECIALIDAD_SECUNDARIA;
      reasons.push('Especialidad secundaria coincide');
    }

    // Zona de operación
    if (empresa.zonasOperacion?.includes(criteria.provincia)) {
      score += MATCH_WEIGHTS.ZONA_OPERACION;
      reasons.push(`Opera en ${criteria.provincia}`);
    }

    // Rating
    if (empresa.rating >= 4.5) {
      score += MATCH_WEIGHTS.RATING;
      reasons.push(`Excelente valoración (${empresa.rating}⭐)`);
    } else if (empresa.rating >= 4.0) {
      score += MATCH_WEIGHTS.RATING * 0.7;
      reasons.push(`Buena valoración (${empresa.rating}⭐)`);
    } else if (empresa.rating >= 3.5) {
      score += MATCH_WEIGHTS.RATING * 0.4;
    }

    // Experiencia
    if (empresa.aniosExperiencia >= 10) {
      score += MATCH_WEIGHTS.EXPERIENCIA;
      reasons.push(`${empresa.aniosExperiencia} años de experiencia`);
    } else if (empresa.aniosExperiencia >= 5) {
      score += MATCH_WEIGHTS.EXPERIENCIA * 0.7;
      reasons.push(`${empresa.aniosExperiencia} años de experiencia`);
    }

    // Verificación
    if (empresa.verificado) {
      score += MATCH_WEIGHTS.VERIFICACION;
      reasons.push('Empresa verificada ✓');
    }

    // Disponibilidad de trabajadores
    if (empresa.trabajadores?.length > 0) {
      score += MATCH_WEIGHTS.DISPONIBILIDAD;
      reasons.push(`${empresa.trabajadores.length} trabajadores disponibles`);
    }

    // REA vigente
    const tieneREA = empresa.documentos?.some(
      (d: any) => d.tipoDocumento === 'REA' && d.estado === 'aprobado'
    );
    if (tieneREA) {
      score += MATCH_WEIGHTS.REA_VIGENTE;
      reasons.push('REA vigente');
    }

    // Normalizar a 0-100
    const maxPossible = Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0);
    const normalizedScore = Math.round((score / maxPossible) * 100);

    return { total: normalizedScore, reasons };
  }

  private calculateTrabajadorScore(
    trabajador: any,
    criteria: MatchCriteria
  ): { total: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Especialidad
    if (trabajador.especialidad === criteria.especialidad) {
      score += 30;
      reasons.push('Especialidad exacta');
    } else if (trabajador.especialidadesSecundarias?.includes(criteria.especialidad)) {
      score += 20;
      reasons.push('Especialidad secundaria');
    }

    // Rating
    if (trabajador.rating >= 4.5) {
      score += 20;
      reasons.push(`Excelente valoración (${trabajador.rating}⭐)`);
    } else if (trabajador.rating >= 4.0) {
      score += 15;
    }

    // Experiencia
    if (trabajador.experienciaAnios >= 10) {
      score += 15;
      reasons.push(`${trabajador.experienciaAnios} años de experiencia`);
    } else if (trabajador.experienciaAnios >= 5) {
      score += 10;
    }

    // Trabajos completados
    if (trabajador.trabajosCompletados >= 50) {
      score += 15;
      reasons.push(`${trabajador.trabajosCompletados} trabajos completados`);
    } else if (trabajador.trabajosCompletados >= 20) {
      score += 10;
    }

    // PRL
    if (trabajador.tienePRL) {
      score += 10;
      reasons.push('Formación PRL vigente');
    }

    // Puntualidad
    if (trabajador.tasaPuntualidad >= 95) {
      score += 10;
      reasons.push(`${trabajador.tasaPuntualidad}% puntualidad`);
    }

    return { total: Math.min(score, 100), reasons };
  }

  // --------------------------------------------------------------------------
  // IA ENHANCEMENT
  // --------------------------------------------------------------------------

  private async aiEnhancedRanking(
    results: MatchResult[],
    criteria: MatchCriteria
  ): Promise<MatchResult[]> {
    if (!this.anthropic || results.length === 0) {
      return results;
    }

    try {
      // Obtener detalles de la obra para contexto
      let obraContext = '';
      if (criteria.obraId) {
        const obra = await prisma.ewoorkerObra.findUnique({
          where: { id: criteria.obraId },
          select: { titulo: true, descripcion: true, requisitosEspeciales: true },
        });
        if (obra) {
          obraContext = `
Obra: ${obra.titulo}
Descripción: ${obra.descripcion || 'No especificada'}
Requisitos especiales: ${obra.requisitosEspeciales || 'Ninguno'}`;
        }
      }

      const prompt = `Eres un experto en matching de empresas de construcción para subcontratación.

Contexto de la búsqueda:
- Especialidad requerida: ${criteria.especialidad}
- Provincia: ${criteria.provincia}
- Presupuesto máximo: ${criteria.presupuestoMax ? `€${criteria.presupuestoMax}` : 'No especificado'}
${obraContext}

Empresas candidatas (ordenadas por score inicial):
${results
  .slice(0, 10)
  .map(
    (r, i) => `
${i + 1}. ${r.empresa.nombre}
   - Score: ${r.matchScore}
   - Especialidad: ${r.empresa.especialidad}
   - Rating: ${r.empresa.rating}⭐
   - Trabajos: ${r.empresa.trabajosCompletados}
   - Verificada: ${r.empresa.verificada ? 'Sí' : 'No'}
   - Trabajadores disponibles: ${r.trabajadoresDisponibles}
   - Razones match: ${r.matchReasons.join(', ')}
`
  )
  .join('')}

Reordena las empresas del 1 al 10 basándote en:
1. Idoneidad para el trabajo específico
2. Fiabilidad (rating + trabajos completados)
3. Disponibilidad inmediata
4. Relación calidad-precio

Responde SOLO con una lista de IDs de empresa en orden de preferencia, separados por comas.
Ejemplo: id1,id2,id3,id4,id5`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307', // Usar modelo rápido para ranking
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      });

      const response = message.content[0];
      if (response.type === 'text') {
        const orderedIds = response.text
          .trim()
          .split(',')
          .map((id) => id.trim());

        // Reordenar resultados según IA
        const reordered: MatchResult[] = [];
        for (const id of orderedIds) {
          const found = results.find((r) => r.empresaId === id);
          if (found) {
            reordered.push(found);
          }
        }

        // Añadir cualquier resultado no incluido por IA
        for (const result of results) {
          if (!reordered.find((r) => r.empresaId === result.empresaId)) {
            reordered.push(result);
          }
        }

        return reordered.slice(0, 10);
      }

      return results.slice(0, 10);
    } catch (error: any) {
      logger.warn('[EwoorkerMatching] Error en AI ranking, usando score base:', error);
      return results.slice(0, 10);
    }
  }
}

// Exportar instancia singleton
export const ewoorkerMatching = new EwoorkerMatchingService();

export default ewoorkerMatching;
