/**
 * ANALYTICS TRACKING - SISTEMA DE NAVEGACIÓN
 * 
 * Trackea el uso de:
 * - Command Palette (Cmd+K)
 * - Shortcuts de teclado
 * - Quick Actions
 * - Navegación con breadcrumbs
 */

import { useEffect, useCallback } from 'react';

// Types
export interface NavigationEvent {
  type: 'command_palette' | 'shortcut' | 'quick_action' | 'breadcrumb' | 'search';
  action: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface NavigationAnalytics {
  totalEvents: number;
  commandPaletteUsage: number;
  shortcutsUsage: Record<string, number>;
  quickActionsUsage: Record<string, number>;
  searchQueries: string[];
  mostUsedActions: Array<{ action: string; count: number }>;
}

// Storage keys
const STORAGE_KEY = 'inmova_navigation_analytics';
const SESSION_KEY = 'inmova_navigation_session';

/**
 * Guarda evento de navegación
 */
export function trackNavigationEvent(event: Omit<NavigationEvent, 'timestamp'>) {
  try {
    const fullEvent: NavigationEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Guardar en localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    const events: NavigationEvent[] = stored ? JSON.parse(stored) : [];
    
    // Limitar a últimos 500 eventos
    if (events.length >= 500) {
      events.shift();
    }
    
    events.push(fullEvent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));

    // Enviar a analytics externos (si está configurado)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.type, {
        event_category: 'Navigation',
        event_label: event.action,
        ...event.metadata,
      });
    }

    // Enviar a Mixpanel (si está configurado)
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track('Navigation Event', {
        type: event.type,
        action: event.action,
        ...event.metadata,
      });
    }

  } catch (error) {
    console.warn('[Navigation Analytics] Error tracking event:', error);
  }
}

/**
 * Hook para trackear uso del Command Palette
 */
export function useCommandPaletteAnalytics() {
  const trackOpen = useCallback(() => {
    trackNavigationEvent({
      type: 'command_palette',
      action: 'opened',
    });
  }, []);

  const trackSearch = useCallback((query: string) => {
    if (query.length >= 2) {
      trackNavigationEvent({
        type: 'search',
        action: 'command_palette_search',
        metadata: { query, queryLength: query.length },
      });
    }
  }, []);

  const trackAction = useCallback((action: string) => {
    trackNavigationEvent({
      type: 'command_palette',
      action: 'action_executed',
      metadata: { action },
    });
  }, []);

  return { trackOpen, trackSearch, trackAction };
}

/**
 * Hook para trackear shortcuts de teclado
 */
export function useShortcutAnalytics() {
  const trackShortcut = useCallback((shortcut: string, destination: string) => {
    trackNavigationEvent({
      type: 'shortcut',
      action: shortcut,
      metadata: { destination },
    });
  }, []);

  const trackSequence = useCallback((sequence: string, destination: string) => {
    trackNavigationEvent({
      type: 'shortcut',
      action: 'sequence',
      metadata: { sequence, destination },
    });
  }, []);

  return { trackShortcut, trackSequence };
}

/**
 * Hook para trackear Quick Actions
 */
export function useQuickActionAnalytics() {
  const trackAction = useCallback((action: string, page: string) => {
    trackNavigationEvent({
      type: 'quick_action',
      action,
      metadata: { page },
    });
  }, []);

  return { trackAction };
}

/**
 * Hook para trackear navegación con breadcrumbs
 */
export function useBreadcrumbAnalytics() {
  const trackNavigation = useCallback((from: string, to: string, method: 'click' | 'back') => {
    trackNavigationEvent({
      type: 'breadcrumb',
      action: 'navigation',
      metadata: { from, to, method },
    });
  }, []);

  return { trackNavigation };
}

/**
 * Obtener analytics agregados
 */
export function getNavigationAnalytics(): NavigationAnalytics {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const events: NavigationEvent[] = stored ? JSON.parse(stored) : [];

    // Agregar datos
    const analytics: NavigationAnalytics = {
      totalEvents: events.length,
      commandPaletteUsage: 0,
      shortcutsUsage: {},
      quickActionsUsage: {},
      searchQueries: [],
      mostUsedActions: [],
    };

    events.forEach((event) => {
      switch (event.type) {
        case 'command_palette':
          analytics.commandPaletteUsage++;
          break;
        case 'shortcut':
          const shortcut = event.action;
          analytics.shortcutsUsage[shortcut] = (analytics.shortcutsUsage[shortcut] || 0) + 1;
          break;
        case 'quick_action':
          const action = event.action;
          analytics.quickActionsUsage[action] = (analytics.quickActionsUsage[action] || 0) + 1;
          break;
        case 'search':
          if (event.metadata?.query) {
            analytics.searchQueries.push(event.metadata.query);
          }
          break;
      }
    });

    // Calcular acciones más usadas
    const allActions = {
      ...analytics.shortcutsUsage,
      ...analytics.quickActionsUsage,
    };

    analytics.mostUsedActions = Object.entries(allActions)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return analytics;
  } catch (error) {
    console.warn('[Navigation Analytics] Error getting analytics:', error);
    return {
      totalEvents: 0,
      commandPaletteUsage: 0,
      shortcutsUsage: {},
      quickActionsUsage: {},
      searchQueries: [],
      mostUsedActions: [],
    };
  }
}

/**
 * Exportar analytics como CSV
 */
export function exportAnalyticsCSV(): string {
  const analytics = getNavigationAnalytics();
  
  let csv = 'Tipo,Acción,Contador\n';
  
  // Shortcuts
  Object.entries(analytics.shortcutsUsage).forEach(([shortcut, count]) => {
    csv += `Shortcut,${shortcut},${count}\n`;
  });
  
  // Quick Actions
  Object.entries(analytics.quickActionsUsage).forEach(([action, count]) => {
    csv += `Quick Action,${action},${count}\n`;
  });
  
  return csv;
}

/**
 * Limpiar analytics antiguos (> 30 días)
 */
export function cleanOldAnalytics() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const events: NavigationEvent[] = stored ? JSON.parse(stored) : [];

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentEvents = events.filter((e) => e.timestamp > thirtyDaysAgo);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentEvents));
    
    return {
      removed: events.length - recentEvents.length,
      remaining: recentEvents.length,
    };
  } catch (error) {
    console.warn('[Navigation Analytics] Error cleaning analytics:', error);
    return { removed: 0, remaining: 0 };
  }
}

/**
 * Hook para inicializar sesión de analytics
 */
export function useNavigationSession() {
  useEffect(() => {
    try {
      const sessionId = sessionStorage.getItem(SESSION_KEY) || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(SESSION_KEY, sessionId);

      // Trackear inicio de sesión
      trackNavigationEvent({
        type: 'command_palette',
        action: 'session_started',
        metadata: { sessionId },
      });

      // Limpiar analytics viejos al iniciar sesión
      const cleaned = cleanOldAnalytics();
      if (cleaned.removed > 0) {
        console.log(`[Navigation Analytics] Limpiados ${cleaned.removed} eventos antiguos`);
      }
    } catch (error) {
      console.warn('[Navigation Analytics] Error initializing session:', error);
    }
  }, []);
}

/**
 * Reporte de analytics para admin
 */
export function generateAnalyticsReport(): string {
  const analytics = getNavigationAnalytics();
  
  return `
# 📊 REPORTE DE ANALYTICS - SISTEMA DE NAVEGACIÓN

Fecha: ${new Date().toLocaleDateString('es-ES')}

## Uso General
- Total de eventos: ${analytics.totalEvents}
- Uso del Command Palette: ${analytics.commandPaletteUsage} veces
- Búsquedas realizadas: ${analytics.searchQueries.length}

## Top 10 Acciones Más Usadas
${analytics.mostUsedActions.map((a, i) => `${i + 1}. ${a.action}: ${a.count} veces`).join('\n')}

## Shortcuts Más Utilizados
${Object.entries(analytics.shortcutsUsage)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([key, count]) => `- ${key}: ${count} veces`)
  .join('\n')}

## Quick Actions Más Usadas
${Object.entries(analytics.quickActionsUsage)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([key, count]) => `- ${key}: ${count} veces`)
  .join('\n')}

## Búsquedas Recientes (últimas 10)
${analytics.searchQueries.slice(-10).map((q) => `- "${q}"`).join('\n')}
  `.trim();
}
