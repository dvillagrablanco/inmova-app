/**
 * EXPEDIA INTEGRATION SERVICE
 * Channel Manager para alquileres vacacionales y hoteles
 * EPS (Expedia Partner Solutions) API
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ExpediaConfig {
  partnerId: string;
  apiKey: string;
  apiSecret: string;
  environment: 'test' | 'production';
  enabled: boolean;
}

export interface ExpediaProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  propertyType: string;
  starRating: number;
  rooms: ExpediaRoom[];
  status: 'active' | 'inactive';
}

export interface ExpediaRoom {
  id: string;
  name: string;
  description: string;
  maxOccupancy: number;
  bedType: string;
  quantity: number;
  baseRate: number;
  currency: string;
  amenities: string[];
  photos: string[];
}

export interface ExpediaReservation {
  id: string;
  confirmationNumber: string;
  propertyId: string;
  roomId: string;
  roomName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  totalPrice: number;
  commission: number;
  currency: string;
  status: 'confirmed' | 'cancelled' | 'modified' | 'completed';
  specialRequests?: string;
  createdAt: Date;
  modifiedAt?: Date;
}

export interface RatePlan {
  roomId: string;
  date: Date;
  rate: number;
  available: number;
  minStay?: number;
  maxStay?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
}

// ============================================================================
// EXPEDIA CLIENT
// ============================================================================

export class ExpediaClient {
  private partnerId: string;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(config: ExpediaConfig) {
    this.partnerId = config.partnerId;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    
    this.baseUrl = config.environment === 'production'
      ? 'https://services.expediapartnercentral.com/properties/v1'
      : 'https://test-services.expediapartnercentral.com/properties/v1';
  }

  /**
   * Headers de autenticación
   */
  private getAuthHeaders(): HeadersInit {
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
    
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Partner-Id': this.partnerId,
    };
  }

  /**
   * Obtener propiedades
   */
  async getProperties(): Promise<ExpediaProperty[]> {
    try {
      const response = await fetch(`${this.baseUrl}/properties`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get properties: ${response.statusText}`);
      }

      const data = await response.json();
      
      logger.info(`Retrieved ${data.properties?.length || 0} Expedia properties`);

      return (data.properties || []).map((prop: any) => this.mapProperty(prop));
    } catch (error) {
      logger.error('Error getting Expedia properties:', error);
      throw error;
    }
  }

  /**
   * Obtener propiedad específica
   */
  async getProperty(propertyId: string): Promise<ExpediaProperty> {
    try {
      const response = await fetch(`${this.baseUrl}/properties/${propertyId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get property: ${response.statusText}`);
      }

      const data = await response.json();
      return this.mapProperty(data);
    } catch (error) {
      logger.error('Error getting Expedia property:', error);
      throw error;
    }
  }

  /**
   * Mapear propiedad de Expedia
   */
  private mapProperty(expediaProp: any): ExpediaProperty {
    return {
      id: expediaProp.propertyId || expediaProp.id,
      name: expediaProp.name || '',
      address: expediaProp.address?.line1 || '',
      city: expediaProp.address?.city || '',
      country: expediaProp.address?.countryCode || '',
      propertyType: expediaProp.propertyType || 'hotel',
      starRating: expediaProp.starRating || 0,
      rooms: (expediaProp.rooms || []).map((r: any) => this.mapRoom(r)),
      status: expediaProp.status === 'ACTIVE' ? 'active' : 'inactive',
    };
  }

  /**
   * Mapear habitación
   */
  private mapRoom(room: any): ExpediaRoom {
    return {
      id: room.roomId || room.id,
      name: room.name || '',
      description: room.description || '',
      maxOccupancy: room.maxOccupancy || 2,
      bedType: room.bedType || 'double',
      quantity: room.quantity || 1,
      baseRate: room.baseRate || 0,
      currency: room.currency || 'EUR',
      amenities: room.amenities || [],
      photos: room.photos?.map((p: any) => p.url) || [],
    };
  }

  /**
   * Obtener reservas
   */
  async getReservations(params?: {
    startDate?: Date;
    endDate?: Date;
    propertyId?: string;
  }): Promise<ExpediaReservation[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.startDate) {
        queryParams.append('checkInStart', params.startDate.toISOString().split('T')[0]);
      }
      if (params?.endDate) {
        queryParams.append('checkInEnd', params.endDate.toISOString().split('T')[0]);
      }
      if (params?.propertyId) {
        queryParams.append('propertyId', params.propertyId);
      }

      const response = await fetch(
        `${this.baseUrl}/reservations?${queryParams}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get reservations: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.reservations?.length || 0} Expedia reservations`);

      return (data.reservations || []).map((res: any) => this.mapReservation(res));
    } catch (error) {
      logger.error('Error getting Expedia reservations:', error);
      throw error;
    }
  }

  /**
   * Mapear reserva
   */
  private mapReservation(res: any): ExpediaReservation {
    return {
      id: res.reservationId || res.id,
      confirmationNumber: res.confirmationNumber || res.id,
      propertyId: res.propertyId,
      roomId: res.roomId,
      roomName: res.roomName || '',
      guestName: `${res.primaryGuest?.firstName || ''} ${res.primaryGuest?.lastName || ''}`.trim(),
      guestEmail: res.primaryGuest?.email || '',
      guestPhone: res.primaryGuest?.phone,
      checkIn: new Date(res.checkIn),
      checkOut: new Date(res.checkOut),
      adults: res.adults || 1,
      children: res.children || 0,
      totalPrice: res.totalPrice?.amount || 0,
      commission: res.commission?.amount || 0,
      currency: res.totalPrice?.currency || 'EUR',
      status: this.mapReservationStatus(res.status),
      specialRequests: res.specialRequests,
      createdAt: new Date(res.createdAt || Date.now()),
      modifiedAt: res.modifiedAt ? new Date(res.modifiedAt) : undefined,
    };
  }

  /**
   * Mapear estado de reserva
   */
  private mapReservationStatus(status: string): ExpediaReservation['status'] {
    const statusMap: Record<string, ExpediaReservation['status']> = {
      'CONFIRMED': 'confirmed',
      'CANCELLED': 'cancelled',
      'MODIFIED': 'modified',
      'COMPLETED': 'completed',
    };
    return statusMap[status] || 'confirmed';
  }

  /**
   * Actualizar disponibilidad y tarifas (AR - Availability & Rates)
   */
  async updateAvailabilityAndRates(updates: RatePlan[]): Promise<boolean> {
    try {
      // Agrupar por propiedad
      const byProperty = updates.reduce((acc, update) => {
        if (!acc[update.roomId]) {
          acc[update.roomId] = [];
        }
        acc[update.roomId].push(update);
        return acc;
      }, {} as Record<string, RatePlan[]>);

      // Enviar actualizaciones
      for (const [roomId, plans] of Object.entries(byProperty)) {
        const payload = {
          roomId,
          ratePlans: plans.map(plan => ({
            date: plan.date.toISOString().split('T')[0],
            rate: plan.rate,
            available: plan.available,
            restrictions: {
              minStay: plan.minStay,
              maxStay: plan.maxStay,
              closedToArrival: plan.closedToArrival,
              closedToDeparture: plan.closedToDeparture,
            },
          })),
        };

        const response = await fetch(
          `${this.baseUrl}/properties/availability-rates`,
          {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          logger.error(`Failed to update AR for room ${roomId}`);
          continue;
        }
      }

      logger.info(`Updated availability and rates for ${updates.length} room-dates`);
      return true;
    } catch (error) {
      logger.error('Error updating Expedia availability and rates:', error);
      return false;
    }
  }

  /**
   * Confirmar reserva
   */
  async confirmReservation(reservationId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reservations/${reservationId}/confirm`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to confirm reservation: ${response.statusText}`);
      }

      logger.info(`Confirmed Expedia reservation ${reservationId}`);
      return true;
    } catch (error) {
      logger.error('Error confirming reservation:', error);
      return false;
    }
  }

  /**
   * Cancelar reserva
   */
  async cancelReservation(reservationId: string, reason?: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reservations/${reservationId}/cancel`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            cancellationReason: reason || 'Property request',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel reservation: ${response.statusText}`);
      }

      logger.info(`Cancelled Expedia reservation ${reservationId}`);
      return true;
    } catch (error) {
      logger.error('Error cancelling reservation:', error);
      return false;
    }
  }

  /**
   * Sincronización masiva de inventario
   */
  async bulkSync(params: {
    propertyId: string;
    startDate: Date;
    endDate: Date;
    rooms: Array<{
      roomId: string;
      dailyAvailability: number;
      dailyRate: number;
    }>;
  }): Promise<boolean> {
    try {
      const { startDate, endDate, rooms } = params;

      // Generar todas las fechas
      const dates: Date[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }

      // Crear rate plans
      const ratePlans: RatePlan[] = [];
      rooms.forEach(room => {
        dates.forEach(date => {
          ratePlans.push({
            roomId: room.roomId,
            date: new Date(date),
            rate: room.dailyRate,
            available: room.dailyAvailability,
          });
        });
      });

      // Actualizar
      const success = await this.updateAvailabilityAndRates(ratePlans);

      logger.info(`Bulk sync completed for property ${params.propertyId}`);

      return success;
    } catch (error) {
      logger.error('Error in bulk sync:', error);
      return false;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isExpediaConfigured(config?: ExpediaConfig | null): boolean {
  if (!config) return false;
  return !!(
    config.partnerId &&
    config.apiKey &&
    config.apiSecret &&
    config.enabled
  );
}

export function getExpediaClient(config?: ExpediaConfig): ExpediaClient | null {
  if (!config || !isExpediaConfigured(config)) {
    return null;
  }

  return new ExpediaClient(config);
}

/**
 * Mapear tipo de propiedad de INMOVA a Expedia
 */
export function mapPropertyType(inmovaType: string): string {
  const typeMap: Record<string, string> = {
    'apartamento': 'apartment',
    'casa': 'house',
    'hotel': 'hotel',
    'hostal': 'hostel',
    'villa': 'villa',
    'bed_and_breakfast': 'bed_and_breakfast',
  };
  return typeMap[inmovaType.toLowerCase()] || 'apartment';
}
