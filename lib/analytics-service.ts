/**
 * ANALYTICS SERVICE
 * Servicio para tracking de eventos con Google Analytics 4
 *
 * Funcionalidades:
 * - Tracking de eventos de onboarding
 * - Tracking de conversiones
 * - Tracking de interacciones de usuario
 * - Implementación server-side y client-side
 */

// ============================================================================
// CLIENT-SIDE ANALYTICS (Google Analytics 4)
// ============================================================================

/**
 * Envía un evento a Google Analytics 4 (client-side)
 * Usa el objeto window.gtag si está disponible
 */
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams);
    console.log('[Analytics] Event tracked:', eventName, eventParams);
  } else {
    console.warn('[Analytics] gtag not available');
  }
}

/**
 * Tracking de page view
 */
export function trackPageView(url: string, title?: string) {
  trackEvent('page_view', {
    page_path: url,
    page_title: title || document.title,
  });
}

// ============================================================================
// ONBOARDING EVENTS
// ============================================================================

/**
 * Usuario inicia onboarding
 */
export function trackOnboardingStart(userId: string, vertical?: string, experienceLevel?: string) {
  trackEvent('onboarding_start', {
    user_id: userId,
    vertical,
    experience_level: experienceLevel,
  });
}

/**
 * Usuario completa una tarea de onboarding
 */
export function trackOnboardingTaskComplete(taskId: string, taskTitle: string, progress: number) {
  trackEvent('onboarding_task_complete', {
    task_id: taskId,
    task_title: taskTitle,
    progress_percentage: progress,
  });
}

/**
 * Usuario salta una tarea de onboarding
 */
export function trackOnboardingTaskSkip(taskId: string, taskTitle: string, progress: number) {
  trackEvent('onboarding_task_skip', {
    task_id: taskId,
    task_title: taskTitle,
    progress_percentage: progress,
  });
}

/**
 * Usuario completa el onboarding completo
 */
export function trackOnboardingComplete(
  userId: string,
  timeSpent: number, // en segundos
  tasksCompleted: number
) {
  trackEvent('onboarding_complete', {
    user_id: userId,
    time_spent_seconds: timeSpent,
    tasks_completed: tasksCompleted,
    value: 1, // Para tracking de conversiones
  });
}

/**
 * Usuario abandona el onboarding
 */
export function trackOnboardingAbandoned(
  userId: string,
  progress: number,
  lastCompletedTask?: string
) {
  trackEvent('onboarding_abandoned', {
    user_id: userId,
    progress_percentage: progress,
    last_completed_task: lastCompletedTask,
  });
}

// ============================================================================
// CHATBOT EVENTS
// ============================================================================

/**
 * Usuario abre el chatbot
 */
export function trackChatbotOpen() {
  trackEvent('chatbot_open');
}

/**
 * Usuario envía un mensaje al chatbot
 */
export function trackChatbotMessage(messageLength: number, hasResponse: boolean) {
  trackEvent('chatbot_message', {
    message_length: messageLength,
    has_response: hasResponse,
  });
}

/**
 * Usuario hace click en una acción sugerida del chatbot
 */
export function trackChatbotActionClick(actionLabel: string, actionRoute: string) {
  trackEvent('chatbot_action_click', {
    action_label: actionLabel,
    action_route: actionRoute,
  });
}

// ============================================================================
// NOTIFICATION EVENTS
// ============================================================================

/**
 * Usuario recibe una notificación
 */
export function trackNotificationReceived(notificationType: string, notificationTitle: string) {
  trackEvent('notification_received', {
    notification_type: notificationType,
    notification_title: notificationTitle,
  });
}

/**
 * Usuario hace click en una notificación
 */
export function trackNotificationClick(
  notificationType: string,
  notificationTitle: string,
  actionRoute?: string
) {
  trackEvent('notification_click', {
    notification_type: notificationType,
    notification_title: notificationTitle,
    action_route: actionRoute,
  });
}

// ============================================================================
// CELEBRATION EVENTS
// ============================================================================

/**
 * Usuario ve una celebración
 */
export function trackCelebrationShown(celebrationType: string, celebrationTitle: string) {
  trackEvent('celebration_shown', {
    celebration_type: celebrationType,
    celebration_title: celebrationTitle,
  });
}

/**
 * Usuario hace click en una acción de celebración
 */
export function trackCelebrationActionClick(
  celebrationType: string,
  actionLabel: string,
  actionRoute: string
) {
  trackEvent('celebration_action_click', {
    celebration_type: celebrationType,
    action_label: actionLabel,
    action_route: actionRoute,
  });
}

// ============================================================================
// USER ACTION EVENTS
// ============================================================================

/**
 * Usuario crea su primer edificio
 */
export function trackFirstBuildingCreated(buildingName: string) {
  trackEvent('first_building_created', {
    building_name: buildingName,
    value: 1,
  });
}

/**
 * Usuario crea su primera unidad
 */
export function trackFirstUnitCreated() {
  trackEvent('first_unit_created', {
    value: 1,
  });
}

/**
 * Usuario crea su primer contrato
 */
export function trackFirstContractCreated() {
  trackEvent('first_contract_created', {
    value: 1,
  });
}

// ============================================================================
// HELPER: Track Time on Page
// ============================================================================

let pageStartTime: number | null = null;

/**
 * Inicia el tracking de tiempo en página
 */
export function startPageTimer() {
  pageStartTime = Date.now();
}

/**
 * Detiene el tracking y envía el evento
 */
export function trackTimeOnPage(pageName: string) {
  if (pageStartTime) {
    const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
    trackEvent('time_on_page', {
      page_name: pageName,
      time_spent_seconds: timeSpent,
    });
    pageStartTime = null;
  }
}

// ============================================================================
// SERVER-SIDE ANALYTICS (Optional - Measurement Protocol)
// ============================================================================

/**
 * Envía un evento a Google Analytics 4 desde el servidor
 * Usa el Measurement Protocol v2
 *
 * Requiere:
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID (en .env)
 * - GA4_API_SECRET (en .env)
 */
export async function trackServerEvent(
  eventName: string,
  eventParams: Record<string, any>,
  clientId: string
) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.warn('[Analytics] GA4 credentials not configured for server-side tracking');
    return;
  }

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          events: [
            {
              name: eventName,
              params: eventParams,
            },
          ],
        }),
      }
    );

    if (response.ok) {
      console.log('[Analytics] Server event tracked:', eventName);
    } else {
      console.error('[Analytics] Failed to track server event:', response.statusText);
    }
  } catch (error) {
    console.error('[Analytics] Error tracking server event:', error);
  }
}

// Stub functions for missing exports (to be implemented)
export async function generateBuildingMetrics(buildingId: string) {
  // TODO: Implement building metrics generation
  return { buildingId, metrics: {} };
}

export async function generateAnalyticsSnapshot(userId: string) {
  // TODO: Implement analytics snapshot generation
  return { userId, snapshot: {} };
}

export async function analyzeTenantBehavior(tenantId: string) {
  // TODO: Implement tenant behavior analysis
  return { tenantId, behavior: {} };
}

export async function getAnalyticsTrends(companyId: string) {
  // TODO: Implement analytics trends
  return { companyId, trends: [] };
}
