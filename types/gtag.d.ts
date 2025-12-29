/**
 * Google Analytics gtag types
 */

interface Window {
  gtag?: (
    command: 'config' | 'event' | 'js' | 'set',
    targetId: string,
    config?: Gtag.ControlParams | Gtag.EventParams | Gtag.CustomParams | Date
  ) => void;
}

declare namespace Gtag {
  interface ControlParams {
    groups?: string | string[];
    send_to?: string | string[];
    event_callback?: () => void;
    event_timeout?: number;
  }

  interface EventParams {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: any;
  }

  interface CustomParams {
    [key: string]: any;
  }
}
