/**
 * RoutePreloaderManager - Gestor centralizado de precarga de rutas
 * 
 * Proporciona una API para:
 * - Precargar rutas críticas al cargar la aplicación
 * - Precargar datos de endpoints API comunes
 * - Gestionar el cache de datos precargados
 * - Configurar estrategias de precarga por tipo de usuario
 */

interface PreloadStrategy {
  routes: string[];
  endpoints?: string[];
  priority: 'high' | 'medium' | 'low';
}

const preloadStrategies: Record<string, PreloadStrategy> = {
  // Usuario administrador
  admin: {
    routes: ['/dashboard', '/edificios', '/propietarios', '/contratos'],
    endpoints: ['/api/dashboard-stats', '/api/buildings', '/api/contracts'],
    priority: 'high',
  },
  // Usuario propietario
  owner: {
    routes: ['/dashboard', '/mis-propiedades', '/contratos', '/pagos'],
    endpoints: ['/api/dashboard-stats', '/api/my-buildings', '/api/payments'],
    priority: 'high',
  },
  // Usuario inquilino
  tenant: {
    routes: ['/dashboard', '/mi-contrato', '/pagos', '/mantenimiento'],
    endpoints: ['/api/my-contract', '/api/payments', '/api/maintenance'],
    priority: 'medium',
  },
  // Usuario visitante/público
  guest: {
    routes: ['/propiedades', '/login', '/registro'],
    endpoints: ['/api/public/properties'],
    priority: 'low',
  },
};

class RoutePreloaderManager {
  private preloadedRoutes = new Set<string>();
  private preloadedData = new Map<string, any>();
  private isPreloading = false;

  /**
   * Precarga rutas basadas en el rol del usuario
   */
  async preloadForUserRole(role: 'admin' | 'owner' | 'tenant' | 'guest') {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    const strategy = preloadStrategies[role];

    if (!strategy) {
      console.warn(`[RoutePreloader] Estrategia no encontrada para rol: ${role}`);
      this.isPreloading = false;
      return;
    }

    try {
      // Precargar rutas
      if (strategy.routes) {
        await this.preloadRoutes(strategy.routes);
      }

      // Precargar datos de endpoints
      if (strategy.endpoints) {
        await this.preloadEndpoints(strategy.endpoints);
      }

      console.log(`[RoutePreloader] Precarga completada para rol: ${role}`);
    } catch (error) {
      console.error('[RoutePreloader] Error en precarga:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Precarga un conjunto de rutas
   */
  private async preloadRoutes(routes: string[]) {
    const promises = routes.map(route => {
      if (this.preloadedRoutes.has(route)) return Promise.resolve();
      
      return new Promise<void>(resolve => {
        this.preloadedRoutes.add(route);
        // En Next.js 13+, el prefetch se maneja automáticamente con Link
        // Aquí solo marcamos como "intención de precargar"
        resolve();
      });
    });

    await Promise.all(promises);
  }

  /**
   * Precarga datos de endpoints API
   */
  private async preloadEndpoints(endpoints: string[]) {
    const promises = endpoints.map(async endpoint => {
      if (this.preloadedData.has(endpoint)) return;

      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          this.preloadedData.set(endpoint, data);
        }
      } catch (error) {
        console.error(`[RoutePreloader] Error precargando ${endpoint}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Obtiene datos precargados de un endpoint
   */
  getCachedData(endpoint: string) {
    return this.preloadedData.get(endpoint);
  }

  /**
   * Limpia el cache
   */
  clearCache() {
    this.preloadedRoutes.clear();
    this.preloadedData.clear();
  }

  /**
   * Verifica si una ruta ya fue precargada
   */
  isRoutePrecached(route: string): boolean {
    return this.preloadedRoutes.has(route);
  }

  /**
   * Precarga manual de una ruta específica
   */
  preloadRoute(route: string) {
    if (!this.preloadedRoutes.has(route)) {
      this.preloadedRoutes.add(route);
    }
  }
}

// Exportar instancia singleton
export const routePreloader = new RoutePreloaderManager();

/**
 * Hook de utilidad para usar el preloader en componentes
 */
export function useRoutePreloaderManager() {
  return routePreloader;
}
