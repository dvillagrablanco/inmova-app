// Override para forzar la export de initializeGoogleAnalytics
declare module '@/lib/analytics-service' {
  export function initializeGoogleAnalytics(measurementId: string): void;
  export function trackEvent(
    eventName: string,
    eventParams?: Record<string, any>,
    userId?: string
  ): void;
  export function trackPageView(url: string, title?: string): void;
  export type AnalyticsEventName = string;
}
