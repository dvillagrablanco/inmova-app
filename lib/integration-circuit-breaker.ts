/**
 * Circuit Breaker Pattern para Integraciones Externas
 * Previene cascadas de fallos protegiendo contra APIs caídas
 * 
 * Estados:
 * - CLOSED: Normal, todas las requests pasan
 * - OPEN: Circuito abierto, todas las requests fallan inmediatamente
 * - HALF_OPEN: Estado de prueba, permite 1 request para verificar recuperación
 */

import logger from './logger';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Número de fallos consecutivos para abrir circuito
  resetTimeout: number; // Tiempo (ms) antes de intentar half-open
  halfOpenMaxAttempts: number; // Máximo de intentos en half-open antes de volver a open
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalRequests: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 60 segundos
  halfOpenMaxAttempts: 3,
};

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalRequests: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private halfOpenAttempts: number = 0;
  private resetTimer: NodeJS.Timeout | null = null;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = DEFAULT_CONFIG
  ) {}

  /**
   * Ejecuta una función con protección de circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Si el circuito está abierto, fallar rápido
    if (this.state === 'OPEN') {
      // Verificar si es momento de intentar half-open
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        throw new Error(
          `Circuit breaker is OPEN for ${this.name}. Last failure: ${this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : 'N/A'}`
        );
      }
    }

    // Intentar ejecutar la función
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Maneja una ejecución exitosa
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();
    this.successCount++;

    if (this.state === 'HALF_OPEN') {
      // En half-open, un éxito significa que el servicio se recuperó
      logger.info(`[CircuitBreaker:${this.name}] Recovery successful, closing circuit`);
      this.transitionToClosed();
    } else if (this.state === 'CLOSED') {
      // En closed, reset failure count
      this.failureCount = 0;
    }
  }

  /**
   * Maneja un fallo en la ejecución
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.state === 'HALF_OPEN') {
      this.halfOpenAttempts++;

      if (this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        // Si falló en half-open, volver a open
        logger.warn(
          `[CircuitBreaker:${this.name}] Failed in HALF_OPEN state after ${this.halfOpenAttempts} attempts, opening circuit`
        );
        this.transitionToOpen();
      }
    } else if (this.state === 'CLOSED') {
      // En closed, verificar si alcanzamos el threshold
      if (this.failureCount >= this.config.failureThreshold) {
        logger.error(
          `[CircuitBreaker:${this.name}] Failure threshold reached (${this.failureCount}/${this.config.failureThreshold}), opening circuit`
        );
        this.transitionToOpen();
      }
    }
  }

  /**
   * Transición a estado CLOSED
   */
  private transitionToClosed(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.halfOpenAttempts = 0;
    this.clearResetTimer();
  }

  /**
   * Transición a estado OPEN
   */
  private transitionToOpen(): void {
    this.state = 'OPEN';
    this.scheduleReset();
  }

  /**
   * Transición a estado HALF_OPEN
   */
  private transitionToHalfOpen(): void {
    this.state = 'HALF_OPEN';
    this.halfOpenAttempts = 0;
    logger.info(`[CircuitBreaker:${this.name}] Attempting recovery in HALF_OPEN state`);
  }

  /**
   * Programa el reset del circuito
   */
  private scheduleReset(): void {
    this.clearResetTimer();
    this.resetTimer = setTimeout(() => {
      logger.info(
        `[CircuitBreaker:${this.name}] Reset timeout reached, transitioning to HALF_OPEN`
      );
      // No transicionar automáticamente, esperar al próximo request
    }, this.config.resetTimeout);
  }

  /**
   * Limpia el timer de reset
   */
  private clearResetTimer(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Verifica si es momento de intentar reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    return timeSinceLastFailure >= this.config.resetTimeout;
  }

  /**
   * Obtiene el estado actual y estadísticas
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }

  /**
   * Resetea manualmente el circuit breaker
   */
  reset(): void {
    logger.info(`[CircuitBreaker:${this.name}] Manual reset`);
    this.transitionToClosed();
  }

  /**
   * Fuerza la apertura del circuito
   */
  forceOpen(): void {
    logger.warn(`[CircuitBreaker:${this.name}] Forced open`);
    this.transitionToOpen();
  }
}

// =============================================================================
// CIRCUIT BREAKER REGISTRY
// =============================================================================

class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Obtiene o crea un circuit breaker
   */
  getBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(name);

    if (!breaker) {
      const finalConfig = { ...DEFAULT_CONFIG, ...config };
      breaker = new CircuitBreaker(name, finalConfig);
      this.breakers.set(name, breaker);
      logger.info(`[CircuitBreaker:${name}] Created with config:`, finalConfig);
    }

    return breaker;
  }

  /**
   * Obtiene estadísticas de todos los breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  /**
   * Resetea todos los circuit breakers
   */
  resetAll(): void {
    logger.info('[CircuitBreaker] Resetting all breakers');
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// Singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Wrapper para ejecutar funciones async con circuit breaker
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const breaker = circuitBreakerRegistry.getBreaker(name, config);
  return breaker.execute(fn);
}

/**
 * Configuraciones predefinidas por servicio
 */
export const CIRCUIT_BREAKER_CONFIGS = {
  stripe: {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minuto
    halfOpenMaxAttempts: 2,
  },
  zucchetti: {
    failureThreshold: 3,
    resetTimeout: 120000, // 2 minutos (API externa puede ser más lenta)
    halfOpenMaxAttempts: 3,
  },
  contasimple: {
    failureThreshold: 3,
    resetTimeout: 120000,
    halfOpenMaxAttempts: 3,
  },
};
