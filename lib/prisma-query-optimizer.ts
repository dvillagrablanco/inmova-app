/**
 * Prisma Query Optimizer & Logger
 * 
 * Middleware que monitorea queries de Prisma y genera alertas
 * para queries lentas o ineficientes.
 * 
 * @module prisma-query-optimizer
 * @since Semana 2, Tarea 2.4
 */

import { Prisma } from '@prisma/client';
import logger from './logger';

// Umbrales de performance
const SLOW_QUERY_THRESHOLD_MS = 500;
const VERY_SLOW_QUERY_THRESHOLD_MS = 2000;

// Patrones problemáticos
const PROBLEMATIC_PATTERNS = {
  noLimit: /findMany.*(?!take|skip)/,
  deepInclude: /include.*include.*include/,
  selectAll: /findMany.*(?!select)/,
};

interface QueryLog {
  model: string;
  action: string;
  duration: number;
  params: any;
  timestamp: string;
}

class QueryOptimizer {
  private queryLogs: QueryLog[] = [];
  private slowQueryCount = 0;
  private totalQueries = 0;

  /**
   * Middleware de Prisma para logging y análisis
   */
  middleware(): Prisma.Middleware {
    return async (params, next) => {
      const start = Date.now();
      
      try {
        const result = await next(params);
        const duration = Date.now() - start;
        
        this.totalQueries++;
        
        // Log query
        const queryLog: QueryLog = {
          model: params.model || 'unknown',
          action: params.action,
          duration,
          params: this.sanitizeParams(params),
          timestamp: new Date().toISOString(),
        };
        
        // Detectar queries lentas
        if (duration > SLOW_QUERY_THRESHOLD_MS) {
          this.slowQueryCount++;
          this.handleSlowQuery(queryLog);
        }
        
        // Detectar patrones problemáticos
        this.detectProblematicPatterns(queryLog);
        
        // Guardar en memoria (para stats)
        if (this.queryLogs.length < 1000) {
          this.queryLogs.push(queryLog);
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.error('Prisma query error:', {
          model: params.model,
          action: params.action,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    };
  }

  /**
   * Maneja queries lentas
   */
  private handleSlowQuery(queryLog: QueryLog) {
    const severity = queryLog.duration > VERY_SLOW_QUERY_THRESHOLD_MS ? 'ERROR' : 'WARN';
    
    logger.warn(`⚠️  SLOW QUERY DETECTED [${severity}]`, {
      model: queryLog.model,
      action: queryLog.action,
      duration: `${queryLog.duration}ms`,
      threshold: `${SLOW_QUERY_THRESHOLD_MS}ms`,
      params: queryLog.params,
    });
    
    // Generar recomendaciones
    const recommendations = this.generateRecommendations(queryLog);
    if (recommendations.length > 0) {
      logger.info('💡 Recomendaciones:', recommendations);
    }
  }

  /**
   * Detecta patrones problemáticos en queries
   */
  private detectProblematicPatterns(queryLog: QueryLog) {
    const warnings: string[] = [];
    
    // findMany sin límite
    if (
      queryLog.action === 'findMany' &&
      !queryLog.params.take &&
      !queryLog.params.cursor
    ) {
      warnings.push('⚠️ findMany sin `take` - puede retornar miles de registros');
    }
    
    // Includes anidados profundos
    if (queryLog.params.include) {
      const depth = this.calculateIncludeDepth(queryLog.params.include);
      if (depth > 2) {
        warnings.push(`⚠️ Include anidado ${depth} niveles - considerar usar select`);
      }
    }
    
    // Usar include en lugar de select
    if (queryLog.params.include && !queryLog.params.select) {
      warnings.push('💡 Considerar usar `select` en lugar de `include` para reducir payload');
    }
    
    if (warnings.length > 0) {
      logger.debug(`Patrones detectados en ${queryLog.model}.${queryLog.action}:`, warnings);
    }
  }

  /**
   * Genera recomendaciones de optimización
   */
  private generateRecommendations(queryLog: QueryLog): string[] {
    const recommendations: string[] = [];
    
    // Paginación
    if (queryLog.action === 'findMany' && !queryLog.params.take) {
      recommendations.push('Agregar paginación: `take: 50, skip: (page - 1) * 50`');
    }
    
    // Índices
    if (queryLog.duration > 1000 && queryLog.params.where) {
      recommendations.push(
        'Verificar índices en columnas de filtrado: ' +
        Object.keys(queryLog.params.where).join(', ')
      );
    }
    
    // Agregaciones
    if (queryLog.action === 'findMany' && queryLog.duration > 800) {
      recommendations.push(
        'Si estás haciendo cálculos en memoria, considerar usar `aggregate` o `groupBy`'
      );
    }
    
    // Select vs Include
    if (queryLog.params.include) {
      recommendations.push(
        'Usar `select` con campos específicos para reducir -70% de datos transferidos'
      );
    }
    
    return recommendations;
  }

  /**
   * Calcula la profundidad de includes anidados
   */
  private calculateIncludeDepth(include: any, depth = 1): number {
    if (!include || typeof include !== 'object') return depth;
    
    let maxDepth = depth;
    for (const key in include) {
      if (include[key] && typeof include[key] === 'object' && include[key].include) {
        const nestedDepth = this.calculateIncludeDepth(include[key].include, depth + 1);
        maxDepth = Math.max(maxDepth, nestedDepth);
      }
    }
    
    return maxDepth;
  }

  /**
   * Sanitiza parámetros para logging (elimina datos sensibles)
   */
  private sanitizeParams(params: any): any {
    const sanitized = { ...params };
    
    // Eliminar campos sensibles
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    
    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const result: any = Array.isArray(obj) ? [] : {};
      
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          result[key] = sanitizeObject(obj[key]);
        } else {
          result[key] = obj[key];
        }
      }
      
      return result;
    };
    
    return sanitizeObject(sanitized);
  }

  /**
   * Obtiene estadísticas de queries
   */
  getStats() {
    const avgDuration = this.queryLogs.length > 0
      ? this.queryLogs.reduce((sum, q) => sum + q.duration, 0) / this.queryLogs.length
      : 0;
    
    const slowestQueries = [...this.queryLogs]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    return {
      totalQueries: this.totalQueries,
      slowQueries: this.slowQueryCount,
      slowQueryPercentage: this.totalQueries > 0
        ? ((this.slowQueryCount / this.totalQueries) * 100).toFixed(2) + '%'
        : '0%',
      avgDuration: Math.round(avgDuration) + 'ms',
      slowestQueries: slowestQueries.map(q => ({
        model: q.model,
        action: q.action,
        duration: q.duration + 'ms',
      })),
    };
  }

  /**
   * Resetea estadísticas (para testing)
   */
  reset() {
    this.queryLogs = [];
    this.slowQueryCount = 0;
    this.totalQueries = 0;
  }
}

// Instancia singleton
export const queryOptimizer = new QueryOptimizer();

// Export del middleware
export const prismaQueryMiddleware = queryOptimizer.middleware();

// Helper para obtener stats en runtime
export function getQueryStats() {
  return queryOptimizer.getStats();
}

// Helper para resetear stats
export function resetQueryStats() {
  queryOptimizer.reset();
}
