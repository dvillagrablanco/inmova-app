/**
 * VRBO/HOMEAWAY INTEGRATION SERVICE
 * Channel Manager para alquileres vacacionales
 * Parte de la familia Expedia Group
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface VrboConfig {
  clientId: string;
  clientSecret: string;
  partnerId: string;
  environment: 'sandbox' | 'production';
  enabled: boolean;
}

export interface VrboListing {
  id: string;
  name: string;
  headline: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  photos: string[];
  amenities: string[];
  basePrice: number;
  currency: string;
  status: 'active' | 'inactive' | 'pending';
  calendarUrl?: string;
}

export interface VrboReservation {
  id: string;
  listingId: string;
  confirmationCode: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  pets: number;
  totalPrice: number;
  currency: string;
  status: 'inquiry' | 'request' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  modifiedAt?: Date;
}

export interface AvailabilityUpdate {
  listingId: string;
  date: Date;
  available: boolean;
  minNights?: number;
  price?: number;
}

// ============================================================================
// VRBO CLIENT
// ============================================================================

export class VrboClient {
  private clientId: string;
  private clientSecret: string;
  private partnerId: string;
  private baseUrl: string;
  private accessToken?: string;
  private tokenExpiresAt?: number;

  constructor(config: VrboConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.partnerId = config.partnerId;

    this.baseUrl =
      config.environment === 'production'
        ? 'https://api.vrbo.com/v1'
        : 'https://api-sandbox.vrbo.com/v1';
  }

  /**
   * Obtener access token (OAuth 2.0)
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Si ya tenemos un token válido, usarlo
      if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
        return this.accessToken;
      }

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await fetch('https://api.vrbo.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`VRBO auth failed: ${response.statusText}`);
      }

      const data = await response.json();

      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

      return this.accessToken;
    } catch (error) {
      logger.error('Error getting VRBO access token:', error);
      throw error;
    }
  }

  /**
   * Headers de autenticación
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Partner-Id': this.partnerId,
    };
  }

  /**
   * Obtener listings
   */
  async getListings(): Promise<VrboListing[]> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/listings`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get listings: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.listings?.length || 0} VRBO listings`);

      return (data.listings || []).map((listing: any) => this.mapListing(listing));
    } catch (error) {
      logger.error('Error getting VRBO listings:', error);
      throw error;
    }
  }

  /**
   * Obtener listing específico
   */
  async getListing(listingId: string): Promise<VrboListing> {
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
      return this.mapListing(data);
    } catch (error) {
      logger.error('Error getting VRBO listing:', error);
      throw error;
    }
  }

  /**
   * Mapear listing de VRBO
   */
  private mapListing(vrboListing: any): VrboListing {
    return {
      id: vrboListing.listingId || vrboListing.id,
      name: vrboListing.propertyName || vrboListing.name || '',
      headline: vrboListing.headline || '',
      description: vrboListing.description || '',
      address: vrboListing.address?.addressLine1 || '',
      city: vrboListing.address?.city || '',
      state: vrboListing.address?.stateProvince || '',
      country: vrboListing.address?.country || '',
      postalCode: vrboListing.address?.postalCode || '',
      propertyType: vrboListing.propertyType || 'house',
      bedrooms: vrboListing.bedrooms || 0,
      bathrooms: vrboListing.bathrooms || 0,
      sleeps: vrboListing.sleeps || 0,
      photos: vrboListing.photos?.map((p: any) => p.url) || [],
      amenities: vrboListing.amenities || [],
      basePrice: vrboListing.pricing?.baseRate || 0,
      currency: vrboListing.pricing?.currency || 'USD',
      status: this.mapListingStatus(vrboListing.status),
      calendarUrl: vrboListing.calendarUrl,
    };
  }

  /**
   * Mapear estado de listing
   */
  private mapListingStatus(status: string): VrboListing['status'] {
    const statusMap: Record<string, VrboListing['status']> = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      PENDING: 'pending',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Obtener reservas
   */
  async getReservations(params?: {
    startDate?: Date;
    endDate?: Date;
    listingId?: string;
  }): Promise<VrboReservation[]> {
    try {
      const headers = await this.getAuthHeaders();

      const queryParams = new URLSearchParams();
      if (params?.startDate) {
        queryParams.append('arrivalDateStart', params.startDate.toISOString().split('T')[0]);
      }
      if (params?.endDate) {
        queryParams.append('arrivalDateEnd', params.endDate.toISOString().split('T')[0]);
      }
      if (params?.listingId) {
        queryParams.append('listingId', params.listingId);
      }

      const response = await fetch(`${this.baseUrl}/reservations?${queryParams}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get reservations: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.reservations?.length || 0} VRBO reservations`);

      return (data.reservations || []).map((res: any) => this.mapReservation(res));
    } catch (error) {
      logger.error('Error getting VRBO reservations:', error);
      throw error;
    }
  }

  /**
   * Mapear reserva
   */
  private mapReservation(res: any): VrboReservation {
    return {
      id: res.reservationId || res.id,
      listingId: res.listingId,
      confirmationCode: res.confirmationCode || res.id,
      guestFirstName: res.guest?.firstName || '',
      guestLastName: res.guest?.lastName || '',
      guestEmail: res.guest?.email || '',
      guestPhone: res.guest?.phone,
      checkIn: new Date(res.arrivalDate || res.checkIn),
      checkOut: new Date(res.departureDate || res.checkOut),
      adults: res.adults || 1,
      children: res.children || 0,
      pets: res.pets || 0,
      totalPrice: res.financials?.totalPrice || 0,
      currency: res.financials?.currency || 'USD',
      status: this.mapReservationStatus(res.status),
      createdAt: new Date(res.createdAt || Date.now()),
      modifiedAt: res.modifiedAt ? new Date(res.modifiedAt) : undefined,
    };
  }

  /**
   * Mapear estado de reserva
   */
  private mapReservationStatus(status: string): VrboReservation['status'] {
    const statusMap: Record<string, VrboReservation['status']> = {
      INQUIRY: 'inquiry',
      REQUEST: 'request',
      CONFIRMED: 'confirmed',
      CANCELLED: 'cancelled',
      COMPLETED: 'completed',
    };
    return statusMap[status] || 'inquiry';
  }

  /**
   * Actualizar disponibilidad
   */
  async updateAvailability(updates: AvailabilityUpdate[]): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();

      // Agrupar por listing
      const byListing = updates.reduce(
        (acc, update) => {
          if (!acc[update.listingId]) {
            acc[update.listingId] = [];
          }
          acc[update.listingId].push(update);
          return acc;
        },
        {} as Record<string, AvailabilityUpdate[]>
      );

      // Enviar actualizaciones
      for (const [listingId, listingUpdates] of Object.entries(byListing)) {
        const payload = {
          listingId,
          availability: listingUpdates.map((u) => ({
            date: u.date.toISOString().split('T')[0],
            available: u.available,
            minNights: u.minNights,
            price: u.price,
          })),
        };

        const response = await fetch(`${this.baseUrl}/listings/${listingId}/calendar`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          logger.error(`Failed to update availability for listing ${listingId}`);
          continue;
        }
      }

      logger.info(`Updated availability for ${updates.length} listing-dates`);
      return true;
    } catch (error) {
      logger.error('Error updating VRBO availability:', error);
      return false;
    }
  }

  /**
   * Aceptar/Rechazar solicitud de reserva
   */
  async respondToInquiry(
    reservationId: string,
    accept: boolean,
    message?: string
  ): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/reservations/${reservationId}/respond`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: accept ? 'ACCEPT' : 'DECLINE',
          message: message || (accept ? 'Confirmed' : 'Not available'),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to respond to inquiry: ${response.statusText}`);
      }

      logger.info(`${accept ? 'Accepted' : 'Declined'} VRBO reservation ${reservationId}`);
      return true;
    } catch (error) {
      logger.error('Error responding to inquiry:', error);
      return false;
    }
  }

  /**
   * Enviar mensaje al huésped
   */
  async sendMessage(reservationId: string, message: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/reservations/${reservationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          sender: 'HOST',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      logger.info(`Message sent to VRBO reservation ${reservationId}`);
      return true;
    } catch (error) {
      logger.error('Error sending message:', error);
      return false;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isVrboConfigured(config?: VrboConfig | null): boolean {
  if (!config) return false;
  return !!(config.clientId && config.clientSecret && config.partnerId && config.enabled);
}

export function getVrboClient(config?: VrboConfig): VrboClient | null {
  if (!config || !isVrboConfigured(config)) {
    return null;
  }

  return new VrboClient(config);
}

/**
 * Generar URL de autorización OAuth
 */
export function getVrboAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    scope: 'listings:read reservations:read calendar:write messages:write',
  });

  return `https://www.vrbo.com/oauth2/authorize?${params}`;
}
