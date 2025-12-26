/**
 * BOOKING.COM INTEGRATION SERVICE
 * Channel Manager para alquileres vacacionales y hoteles
 * API de Conectividad de Booking.com
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BookingConfig {
  hotelId: string;
  username: string;
  password: string;
  environment: 'test' | 'production';
  enabled: boolean;
}

export interface BookingProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  propertyType: string;
  rating: number;
  rooms: BookingRoom[];
}

export interface BookingRoom {
  id: string;
  name: string;
  description: string;
  maxOccupancy: number;
  bedType: string;
  quantity: number;
  basePrice: number;
  currency: string;
  photos: string[];
  amenities: string[];
}

export interface BookingReservation {
  id: string;
  confirmationNumber: string;
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
  status: 'confirmed' | 'cancelled' | 'no_show' | 'completed';
  specialRequests?: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface AvailabilityUpdate {
  roomId: string;
  date: Date;
  available: number; // Número de habitaciones disponibles
  closed?: boolean;
  minStay?: number;
  maxStay?: number;
}

export interface RateUpdate {
  roomId: string;
  date: Date;
  rate: number;
  currency: string;
}

// ============================================================================
// BOOKING.COM CLIENT
// ============================================================================

export class BookingClient {
  private hotelId: string;
  private username: string;
  private password: string;
  private baseUrl: string;

  constructor(config: BookingConfig) {
    this.hotelId = config.hotelId;
    this.username = config.username;
    this.password = config.password;
    
    // URLs según entorno
    this.baseUrl = config.environment === 'production'
      ? 'https://supply-xml.booking.com/hotels/xml'
      : 'https://supply-xml.booking.com/hotels/xml/test';
  }

  /**
   * Headers de autenticación básica
   */
  private getAuthHeaders(): HeadersInit {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/xml',
    };
  }

  /**
   * Realizar petición XML
   */
  private async makeXMLRequest(xmlBody: string): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: xmlBody,
      });

      if (!response.ok) {
        throw new Error(`Booking.com API error: ${response.statusText}`);
      }

      const xmlResponse = await response.text();
      
      // Parsear XML a JSON (simplificado, usar xml2js en producción)
      return this.parseXMLResponse(xmlResponse);
    } catch (error) {
      logger.error('Error making Booking.com XML request:', error);
      throw error;
    }
  }

  /**
   * Parser XML básico (en producción usar xml2js o similar)
   */
  private parseXMLResponse(xml: string): any {
    // Implementación simplificada
    // En producción, usar una librería como xml2js
    try {
      // Extract relevant data from XML
      const data: any = {};
      
      // Check for errors
      const errorMatch = xml.match(/<error>([^<]+)<\/error>/);
      if (errorMatch) {
        throw new Error(errorMatch[1]);
      }

      // Extract success status
      data.success = xml.includes('<ok>') || xml.includes('<success>');
      
      return data;
    } catch (error) {
      logger.error('Error parsing XML response:', error);
      throw error;
    }
  }

  /**
   * Obtener información de la propiedad
   */
  async getProperty(): Promise<BookingProperty | null> {
    try {
      const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.username}</username>
  <password>${this.password}</password>
  <hotel_id>${this.hotelId}</hotel_id>
  <action>get_hotel_info</action>
</request>`;

      const response = await this.makeXMLRequest(xmlBody);

      // Mapear respuesta a nuestro formato
      // Implementación simplificada
      logger.info(`Retrieved property info for hotel ${this.hotelId}`);
      
      return null; // Placeholder
    } catch (error) {
      logger.error('Error getting Booking.com property:', error);
      return null;
    }
  }

  /**
   * Obtener reservas
   */
  async getReservations(params?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<BookingReservation[]> {
    try {
      const startDate = params?.startDate || new Date();
      const endDate = params?.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.username}</username>
  <password>${this.password}</password>
  <hotel_id>${this.hotelId}</hotel_id>
  <action>reservations</action>
  <from_date>${startDate.toISOString().split('T')[0]}</from_date>
  <to_date>${endDate.toISOString().split('T')[0]}</to_date>
</request>`;

      const response = await this.makeXMLRequest(xmlBody);

      logger.info(`Retrieved reservations for hotel ${this.hotelId}`);

      // Mapear XML a BookingReservation[]
      return []; // Placeholder
    } catch (error) {
      logger.error('Error getting Booking.com reservations:', error);
      return [];
    }
  }

  /**
   * Actualizar disponibilidad
   */
  async updateAvailability(updates: AvailabilityUpdate[]): Promise<boolean> {
    try {
      // Construir XML para actualizar disponibilidad
      const roomUpdates = updates.map(update => {
        const dateStr = update.date.toISOString().split('T')[0];
        return `
    <room id="${update.roomId}">
      <date value="${dateStr}">
        <avail>${update.available}</avail>
        ${update.closed ? '<closed>1</closed>' : ''}
        ${update.minStay ? `<min_stay>${update.minStay}</min_stay>` : ''}
        ${update.maxStay ? `<max_stay>${update.maxStay}</max_stay>` : ''}
      </date>
    </room>`;
      }).join('\n');

      const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.username}</username>
  <password>${this.password}</password>
  <hotel_id>${this.hotelId}</hotel_id>
  <action>update_availability</action>
  <rooms>
    ${roomUpdates}
  </rooms>
</request>`;

      const response = await this.makeXMLRequest(xmlBody);

      logger.info(`Updated availability for ${updates.length} room-dates`);
      return response.success || false;
    } catch (error) {
      logger.error('Error updating Booking.com availability:', error);
      return false;
    }
  }

  /**
   * Actualizar tarifas
   */
  async updateRates(updates: RateUpdate[]): Promise<boolean> {
    try {
      const rateUpdates = updates.map(update => {
        const dateStr = update.date.toISOString().split('T')[0];
        return `
    <room id="${update.roomId}">
      <date value="${dateStr}">
        <rate currency="${update.currency}">${update.rate.toFixed(2)}</rate>
      </date>
    </room>`;
      }).join('\n');

      const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.username}</username>
  <password>${this.password}</password>
  <hotel_id>${this.hotelId}</hotel_id>
  <action>update_rates</action>
  <rooms>
    ${rateUpdates}
  </rooms>
</request>`;

      const response = await this.makeXMLRequest(xmlBody);

      logger.info(`Updated rates for ${updates.length} room-dates`);
      return response.success || false;
    } catch (error) {
      logger.error('Error updating Booking.com rates:', error);
      return false;
    }
  }

  /**
   * Confirmar reserva
   */
  async confirmReservation(reservationId: string): Promise<boolean> {
    try {
      const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.username}</username>
  <password>${this.password}</password>
  <hotel_id>${this.hotelId}</hotel_id>
  <action>confirm_reservation</action>
  <reservation_id>${reservationId}</reservation_id>
</request>`;

      const response = await this.makeXMLRequest(xmlBody);

      logger.info(`Confirmed reservation ${reservationId}`);
      return response.success || false;
    } catch (error) {
      logger.error('Error confirming reservation:', error);
      return false;
    }
  }

  /**
   * Marcar reserva como No-Show
   */
  async markNoShow(reservationId: string): Promise<boolean> {
    try {
      const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.username}</username>
  <password>${this.password}</password>
  <hotel_id>${this.hotelId}</hotel_id>
  <action>mark_no_show</action>
  <reservation_id>${reservationId}</reservation_id>
</request>`;

      const response = await this.makeXMLRequest(xmlBody);

      logger.info(`Marked reservation ${reservationId} as no-show`);
      return response.success || false;
    } catch (error) {
      logger.error('Error marking no-show:', error);
      return false;
    }
  }

  /**
   * Sincronización masiva de disponibilidad y precios
   */
  async bulkSync(params: {
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

      // Generar todas las fechas en el rango
      const dates: Date[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }

      // Actualizar disponibilidad
      const availUpdates: AvailabilityUpdate[] = [];
      const rateUpdates: RateUpdate[] = [];

      rooms.forEach(room => {
        dates.forEach(date => {
          availUpdates.push({
            roomId: room.roomId,
            date: new Date(date),
            available: room.dailyAvailability,
          });

          rateUpdates.push({
            roomId: room.roomId,
            date: new Date(date),
            rate: room.dailyRate,
            currency: 'EUR',
          });
        });
      });

      // Ejecutar ambas actualizaciones
      const availResult = await this.updateAvailability(availUpdates);
      const rateResult = await this.updateRates(rateUpdates);

      logger.info(`Bulk sync completed for ${rooms.length} rooms, ${dates.length} days`);

      return availResult && rateResult;
    } catch (error) {
      logger.error('Error in bulk sync:', error);
      return false;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isBookingConfigured(config?: BookingConfig | null): boolean {
  if (!config) return false;
  return !!(
    config.hotelId &&
    config.username &&
    config.password &&
    config.enabled
  );
}

export function getBookingClient(config?: BookingConfig): BookingClient | null {
  if (!config || !isBookingConfigured(config)) {
    return null;
  }

  return new BookingClient(config);
}

/**
 * Mapear tipo de propiedad de INMOVA a Booking.com
 */
export function mapPropertyType(inmovaType: string): string {
  const typeMap: Record<string, string> = {
    'apartamento': 'apartment',
    'casa': 'house',
    'hotel': 'hotel',
    'hostal': 'hostel',
    'villa': 'villa',
  };
  return typeMap[inmovaType.toLowerCase()] || 'apartment';
}
