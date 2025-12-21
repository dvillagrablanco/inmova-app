// Override para forzar la export de initializeGoogleAnalytics
declare module '@/lib/analytics-service' {
  export function initializeGoogleAnalytics(measurementId: string): void;
  export function trackEvent(
    eventName: string,
    eventParams?: Record<string, any>,
    userId?: string
  ): void;
  export function trackPageView(url: string, title?: string): void;
  export function trackOnboardingStart(
    userId: string,
    vertical?: string,
    experienceLevel?: string
  ): void;
  export function trackOnboardingTaskComplete(
    taskId: string,
    taskTitle: string,
    progress: number
  ): void;
  export function trackOnboardingTaskSkip(
    taskId: string,
    taskTitle: string,
    progress: number
  ): void;
  export function trackOnboardingComplete(
    userId: string,
    timeSpent: number,
    tasksCompleted: number
  ): void;
  export type AnalyticsEventName = string;
}
