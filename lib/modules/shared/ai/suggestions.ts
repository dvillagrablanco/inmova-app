/**
 * AI Suggestions Service
 * Generates intelligent suggestions for users
 */

import { AISuggestion } from './types';
import logger from '@/lib/logger';

/**
 * Generate suggestions based on user context
 */
export async function generateSuggestions(
  context: Record<string, any>,
  suggestionType?: string
): Promise<AISuggestion[]> {
  try {
    logger.info('Generating AI suggestions', {
      type: suggestionType || 'general',
    });
    const suggestions: AISuggestion[] = [];

    if (context?.missingProfile) {
      suggestions.push({
        id: `sug_profile_${Date.now()}`,
        type: suggestionType || 'general',
        title: 'Completa tu perfil',
        description: 'Completar tu perfil mejora la experiencia y la seguridad.',
        confidence: 0.7,
        createdAt: new Date(),
      });
    }

    if (typeof context?.unreadNotifications === 'number' && context.unreadNotifications > 0) {
      suggestions.push({
        id: `sug_notifications_${Date.now()}`,
        type: suggestionType || 'general',
        title: 'Revisa tus notificaciones',
        description: `Tienes ${context.unreadNotifications} notificaciones pendientes.`,
        confidence: 0.65,
        createdAt: new Date(),
      });
    }

    if (typeof context?.propertiesCount === 'number' && context.propertiesCount === 0) {
      suggestions.push({
        id: `sug_properties_${Date.now()}`,
        type: suggestionType || 'general',
        title: 'Crea tu primera propiedad',
        description: 'Añade propiedades para empezar a gestionar contratos y pagos.',
        confidence: 0.8,
        createdAt: new Date(),
      });
    }

    return suggestions;
  } catch (error: any) {
    logger.error('Error generating suggestions:', error);
    return [];
  }
}

/**
 * Get property pricing suggestions
 */
export async function suggestPropertyPricing(
  propertyData: {
    location: string;
    size: number;
    bedrooms: number;
    bathrooms: number;
    features?: string[];
  }
): Promise<AISuggestion> {
  try {
    logger.info('Generating property pricing suggestion');
    const base = propertyData.size * 12;
    const roomsBonus = propertyData.bedrooms * 60 + propertyData.bathrooms * 40;
    const featuresBonus = (propertyData.features?.length || 0) * 25;
    const suggestedPrice = Math.round(base + roomsBonus + featuresBonus);
    const min = Math.round(suggestedPrice * 0.9);
    const max = Math.round(suggestedPrice * 1.1);

    return {
      id: `price_sug_${Date.now()}`,
      type: 'pricing',
      title: 'Precio Sugerido',
      description: 'Estimación basada en tamaño, habitaciones y características.',
      confidence: 0.6,
      metadata: {
        suggestedPrice,
        priceRange: { min, max },
      },
      createdAt: new Date(),
    };
  } catch (error: any) {
    logger.error('Error suggesting property pricing:', error);
    throw error;
  }
}

/**
 * Get maintenance suggestions
 */
export async function suggestMaintenance(
  propertyId: string,
  maintenanceHistory?: any[]
): Promise<AISuggestion[]> {
  try {
    logger.info('Generating maintenance suggestions', { propertyId });
    const items = maintenanceHistory || [];
    if (items.length === 0) {
      return [];
    }

    const recentIssues = items.filter((item: any) => {
      const dateValue = item?.createdAt || item?.fecha || item?.date;
      const date = dateValue ? new Date(dateValue) : null;
      if (!date || Number.isNaN(date.getTime())) return false;
      const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 180;
    });

    if (recentIssues.length >= 3) {
      return [
        {
          id: `maint_sug_${Date.now()}`,
          type: 'maintenance',
          title: 'Plan de mantenimiento preventivo',
          description: 'Se detectaron varias incidencias recientes. Programa mantenimiento preventivo.',
          confidence: 0.65,
          createdAt: new Date(),
        },
      ];
    }

    return [];
  } catch (error: any) {
    logger.error('Error suggesting maintenance:', error);
    return [];
  }
}
