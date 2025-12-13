import logger, { logError } from '@/lib/logger';


/**
 * Servicio de Automatización con IA
 * Procesa intenciones del usuario y proporciona asistencia inteligente
 */

export interface UserIntent {
  intent: 'create_building' | 'create_tenant' | 'create_contract' | 'help' | 'navigate' | 'report_issue' | 'configure' | 'other';
  confidence: number;
  entities: Record<string, any>;
  suggestedAction?: {
    label: string;
    route?: string;
    action?: string;
  };
}

export interface AutomationSuggestion {
  id: string;
  type: 'wizard' | 'action' | 'tip' | 'warning';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: {
    label: string;
    route?: string;
    callback?: string;
  };
  dismissable: boolean;
}

export interface OnboardingProgress {
  userId: string;
  completedSteps: string[];
  totalSteps: number;
  percentage: number;
  nextRecommendedAction?: {
    title: string;
    description: string;
    route: string;
  };
  steps?: Array<{
    id: string;
    title: string;
    required: boolean;
    completed: boolean;
  }>;
}

/**
 * Detecta la intención del usuario usando análisis de IA
 */
export async function detectUserIntent(userMessage: string, context?: any): Promise<UserIntent> {
  try {
    const response = await fetch('/api/ai/detect-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, context }),
    });

    if (!response.ok) {
      throw new Error('Error detecting intent');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Error detecting intent:', error);
    // Fallback a intención básica
    return {
      intent: 'other',
      confidence: 0,
      entities: {},
    };
  }
}

/**
 * Genera sugerencias proactivas basadas en el estado del usuario
 */
export async function getProactiveSuggestions(
  userId: string,
  userContext: any
): Promise<AutomationSuggestion[]> {
  try {
    const response = await fetch('/api/ai/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, context: userContext }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    logger.error('Error getting suggestions:', error);
    return [];
  }
}

/**
 * Obtiene el progreso del onboarding del usuario
 */
export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
  try {
    const response = await fetch(`/api/onboarding/progress?userId=${userId}`);

    if (!response.ok) {
      throw new Error('Error getting progress');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Error getting onboarding progress:', error);
    return {
      userId,
      completedSteps: [],
      totalSteps: 0,
      percentage: 0,
    };
  }
}

/**
 * Registra un paso completado en el onboarding
 */
export async function markOnboardingStep(userId: string, stepId: string): Promise<void> {
  try {
    await fetch('/api/onboarding/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, stepId, completed: true }),
    });
  } catch (error) {
    logger.error('Error marking step:', error);
  }
}

/**
 * Detecta automáticamente el modelo de negocio del usuario
 */
export async function detectBusinessModel(userData: any): Promise<{
  model: string;
  confidence: number;
  suggestedModules: string[];
}> {
  try {
    const response = await fetch('/api/ai/detect-business-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Error detecting business model');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Error detecting business model:', error);
    return {
      model: 'general',
      confidence: 0,
      suggestedModules: [],
    };
  }
}

/**
 * Categoriza automáticamente un ticket de soporte
 */
export async function categorizeTicket(ticketData: {
  subject: string;
  description: string;
  attachments?: string[];
}): Promise<{
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  suggestedAssignee?: string;
  relatedArticles: Array<{ title: string; url: string }>;
  autoResponse?: string;
}> {
  try {
    const response = await fetch('/api/support/categorize-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData),
    });

    if (!response.ok) {
      throw new Error('Error categorizing ticket');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Error categorizing ticket:', error);
    return {
      category: 'general',
      priority: 'medium',
      relatedArticles: [],
    };
  }
}

/**
 * Busca en la base de conocimientos usando IA
 */
export async function searchKnowledgeBase(query: string): Promise<Array<{
  id: string;
  title: string;
  excerpt: string;
  relevance: number;
  url: string;
}>> {
  try {
    const response = await fetch('/api/support/knowledge-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    logger.error('Error searching knowledge base:', error);
    return [];
  }
}
