/**
 * Google Analytics 4 Integration
 * Track events and conversions
 */

export interface GA4Event {
  name: string;
  params?: Record<string, any>;
  userId?: string;
}

/**
 * Enviar evento a Google Analytics 4 via Measurement Protocol
 */
export async function trackGA4Event(event: GA4Event): Promise<void> {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.warn('[GA4] Missing credentials, skipping tracking');
    return;
  }

  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: event.userId || 'anonymous',
        events: [
          {
            name: event.name,
            params: {
              ...event.params,
              timestamp_micros: Date.now() * 1000,
            },
          },
        ],
      }),
    });

    // Event tracked successfully
  } catch (error) {
    console.error('[GA4] Error tracking event:', error);
  }
}

/**
 * Track page view
 */
export async function trackPageView(url: string, title: string, userId?: string): Promise<void> {
  await trackGA4Event({
    name: 'page_view',
    params: {
      page_location: url,
      page_title: title,
    },
    userId,
  });
}

/**
 * Track custom conversion event
 */
export async function trackConversion(
  eventName: string,
  value?: number,
  currency: string = 'EUR',
  userId?: string
): Promise<void> {
  await trackGA4Event({
    name: eventName,
    params: {
      value,
      currency,
    },
    userId,
  });
}

/**
 * Track property creation
 */
export async function trackPropertyCreated(propertyId: string, companyId: string): Promise<void> {
  await trackGA4Event({
    name: 'property_created',
    params: {
      property_id: propertyId,
      company_id: companyId,
    },
    userId: companyId,
  });
}

/**
 * Track contract signed
 */
export async function trackContractSigned(
  contractId: string,
  companyId: string,
  value: number
): Promise<void> {
  await trackGA4Event({
    name: 'contract_signed',
    params: {
      contract_id: contractId,
      company_id: companyId,
      value,
      currency: 'EUR',
    },
    userId: companyId,
  });
}

/**
 * Track payment received
 */
export async function trackPaymentReceived(
  paymentId: string,
  companyId: string,
  amount: number
): Promise<void> {
  await trackGA4Event({
    name: 'payment_received',
    params: {
      payment_id: paymentId,
      company_id: companyId,
      value: amount,
      currency: 'EUR',
    },
    userId: companyId,
  });
}
