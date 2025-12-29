/**
 * Google Analytics 4 Integration
 * Provides type-safe analytics tracking for Next.js App Router
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
interface GtagEventParams {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

export const event = ({ action, category, label, value, ...params }: GtagEventParams) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...params,
    });
  }
};

// Eventos predefinidos comunes
export const trackEvent = {
  // User actions
  signup: (method: string) => {
    event({
      action: 'sign_up',
      category: 'engagement',
      label: method,
    });
  },

  login: (method: string) => {
    event({
      action: 'login',
      category: 'engagement',
      label: method,
    });
  },

  // Property events
  viewProperty: (propertyId: string) => {
    event({
      action: 'view_item',
      category: 'property',
      label: propertyId,
    });
  },

  searchProperties: (searchTerm: string) => {
    event({
      action: 'search',
      category: 'property',
      label: searchTerm,
    });
  },

  // Payment events
  initiateCheckout: (amount: number, currency: string = 'EUR') => {
    event({
      action: 'begin_checkout',
      category: 'ecommerce',
      value: amount,
      currency,
    });
  },

  completePurchase: (amount: number, transactionId: string, currency: string = 'EUR') => {
    event({
      action: 'purchase',
      category: 'ecommerce',
      value: amount,
      transaction_id: transactionId,
      currency,
    });
  },

  // Engagement
  share: (contentType: string, itemId: string) => {
    event({
      action: 'share',
      category: 'engagement',
      label: contentType,
      content_id: itemId,
    });
  },

  contactFormSubmit: () => {
    event({
      action: 'generate_lead',
      category: 'engagement',
      label: 'contact_form',
    });
  },
};

// Type declaration for gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}
