/**
 * AIRBNB INTEGRATION SERVICE
 * Channel Manager para alquileres vacacionales
 * Sincronización bidireccional de reservas, disponibilidad y precios
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AirbnbConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  enabled: boolean;
}

export interface AirbnbListing {
  id: string;
  name: string;
  address: string;
  propertyType: string;
  roomType: string;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  price: number;
  currency: string;
  status: 'active' | 'inactive' | 'pending';
  photos: string[];
  amenities: string[];
  calendarUrl?: string;
}

export interface AirbnbReservation {
  id: string;
  listingId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
  confirmationCode: string;
  createdAt: Date;
}

export interface PricingRule {
  listingId: string;
  startDate: Date;
  endDate: Date;
  basePrice: number;
  weekendPrice?: number;
  minNights?: number;
  maxNights?: number;
}

// ============================================================================
// AIRBNB CLIENT
// ============================================================================

export class AirbnbClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private refreshToken?: string;
  private baseUrl: string = 'https://api.airbnb.com/v2';

  constructor(config: AirbnbConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
  }

  /**
   * Obtener access token con OAuth 2.0
   */
  async authenticate(authorizationCode: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await fetch('https://api.airbnb.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: `${process.env.NEXT_PUBLIC_URL}/integrations/airbnb/callback`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Airbnb auth failed: ${response.statusText}`);
      }

      const data = await response.json();

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;

      logger.info('Airbnb authentication successful');

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
    } catch (error) {
      logger.error('Error authenticating with Airbnb:', error);
      throw error;
    }
  }

  /**
   * Refrescar access token
   */
  async refreshAccessToken(): Promise<string> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://api.airbnb.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      return data.access_token;
    } catch (error) {
      logger.error('Error refreshing Airbnb token:', error);
      throw error;
    }
  }

  /**
   * Headers de autenticación
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Airbnb');
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'X-Airbnb-API-Key': this.clientId,
    };
  }

  /**
   * Obtener todos los listings del usuario
   */
  async getListings(): Promise<AirbnbListing[]> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/listings`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.getListings(); // Retry
        }
        throw new Error(`Failed to get listings: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.listings?.length || 0} Airbnb listings`);

      return (data.listings || []).map((listing: any) => this.mapListing(listing));
    } catch (error) {
      logger.error('Error getting Airbnb listings:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles de un listing específico
   */
  async getListing(listingId: string): Promise<AirbnbListing> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/listings/${listingId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get listing: ${response.statusText}`);
      }

      const data = await response.json();
      return this.mapListing(data.listing);
    } catch (error) {
      logger.error('Error getting Airbnb listing:', error);
      throw error;
    }
  }

  /**
   * Mapear datos de Airbnb a nuestro formato
   */
  private mapListing(airbnbListing: any): AirbnbListing {
    return {
      id: airbnbListing.id.toString(),
      name: airbnbListing.name || '',
      address: airbnbListing.address || '',
      propertyType: airbnbListing.property_type || 'apartment',
      roomType: airbnbListing.room_type || 'entire_home',
      bedrooms: airbnbListing.bedrooms || 0,
      bathrooms: airbnbListing.bathrooms || 0,
      guests: airbnbListing.accommodates || 0,
      price: airbnbListing.price || 0,
      currency: airbnbListing.currency || 'EUR',
      status: airbnbListing.has_availability ? 'active' : 'inactive',
      photos: airbnbListing.photos?.map((p: any) => p.xl_picture) || [],
      amenities: airbnbListing.amenities || [],
      calendarUrl: airbnbListing.calendar_url,
    };
  }

  /**
   * Obtener reservas
   */
  async getReservations(params?: {
    startDate?: Date;
    endDate?: Date;
    listingId?: string;
  }): Promise<AirbnbReservation[]> {
    try {
      const headers = await this.getAuthHeaders();

      const queryParams = new URLSearchParams();
      if (params?.startDate) {
        queryParams.append('start_date', params.startDate.toISOString().split('T')[0]);
      }
      if (params?.endDate) {
        queryParams.append('end_date', params.endDate.toISOString().split('T')[0]);
      }
      if (params?.listingId) {
        queryParams.append('listing_id', params.listingId);
      }

      const response = await fetch(`${this.baseUrl}/reservations?${queryParams}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.getReservations(params); // Retry
        }
        throw new Error(`Failed to get reservations: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.reservations?.length || 0} Airbnb reservations`);

      return (data.reservations || []).map((res: any) => this.mapReservation(res));
    } catch (error) {
      logger.error('Error getting Airbnb reservations:', error);
      throw error;
    }
  }

  /**
   * Mapear reserva de Airbnb
   */
  private mapReservation(airbnbRes: any): AirbnbReservation {
    return {
      id: airbnbRes.id.toString(),
      listingId: airbnbRes.listing_id.toString(),
      guestName: airbnbRes.guest?.full_name || '',
      guestEmail: airbnbRes.guest?.email || '',
      guestPhone: airbnbRes.guest?.phone,
      checkIn: new Date(airbnbRes.start_date),
      checkOut: new Date(airbnbRes.end_date),
      guests: airbnbRes.guests || 1,
      totalPrice: airbnbRes.total_price || 0,
      currency: airbnbRes.currency || 'EUR',
      status: this.mapReservationStatus(airbnbRes.status),
      confirmationCode: airbnbRes.confirmation_code || airbnbRes.id.toString(),
      createdAt: new Date(airbnbRes.created_at),
    };
  }

  /**
   * Mapear estado de reserva
   */
  private mapReservationStatus(status: string): AirbnbReservation['status'] {
    const statusMap: Record<string, AirbnbReservation['status']> = {
      'pending': 'pending',
      'accept': 'accepted',
      'deny': 'declined',
      'cancelled': 'cancelled',
      'completed': 'completed',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Actualizar disponibilidad del calendario
   */
  async updateAvailability(params: {
    listingId: string;
    startDate: Date;
    endDate: Date;
    available: boolean;
  }): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/calendar_days`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          listing_id: params.listingId,
          start_date: params.startDate.toISOString().split('T')[0],
          end_date: params.endDate.toISOString().split('T')[0],
          availability: params.available ? 'available' : 'unavailable',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update availability: ${response.statusText}`);
      }

      logger.info(`Airbnb availability updated for listing ${params.listingId}`);
      return true;
    } catch (error) {
      logger.error('Error updating Airbnb availability:', error);
      return false;
    }
  }

  /**
   * Actualizar precios
   */
  async updatePricing(rule: PricingRule): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/pricing_rules`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          listing_id: rule.listingId,
          start_date: rule.startDate.toISOString().split('T')[0],
          end_date: rule.endDate.toISOString().split('T')[0],
          nightly_price: rule.basePrice,
          weekend_price: rule.weekendPrice,
          min_nights: rule.minNights,
          max_nights: rule.maxNights,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update pricing: ${response.statusText}`);
      }

      logger.info(`Airbnb pricing updated for listing ${rule.listingId}`);
      return true;
    } catch (error) {
      logger.error('Error updating Airbnb pricing:', error);
      return false;
    }
  }

  /**
   * Enviar mensaje al huésped
   */
  async sendMessage(params: {
    reservationId: string;
    message: string;
  }): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/threads/send_message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reservation_id: params.reservationId,
          message: params.message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      logger.info(`Message sent to reservation ${params.reservationId}`);
      return true;
    } catch (error) {
      logger.error('Error sending Airbnb message:', error);
      return false;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isAirbnbConfigured(config?: AirbnbConfig | null): boolean {
  if (!config) return false;
  return !!(
    config.clientId &&
    config.clientSecret &&
    config.enabled
  );
}

export function getAirbnbClient(config?: AirbnbConfig): AirbnbClient | null {
  if (!config || !isAirbnbConfigured(config)) {
    return null;
  }

  return new AirbnbClient(config);
}

/**
 * Generar URL de autorización OAuth
 */
export function getAirbnbAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    scope: 'listings_read,reservations_read,calendar_write,messages_write',
  });

  return `https://www.airbnb.com/oauth2/auth?${params}`;
}
