/**
 * Mapbox Service - Geocoding y mapas
 * @module mapbox-service
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const MAPBOX_API_URL = 'https://api.mapbox.com';

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeocodingResult {
  coordinates: Coordinates;
  placeName: string;
  confidence: number;
}

export class MapboxService {
  /**
   * Geocodifica una dirección a coordenadas
   * @param address - Dirección completa
   * @param city - Ciudad
   * @returns Coordenadas y metadatos
   */
  static async geocodeAddress(address: string, city: string): Promise<GeocodingResult | null> {
    // Si no hay token, usar simulación
    if (!MAPBOX_TOKEN) {
      console.warn('⚠️ MAPBOX_TOKEN not configured, using simulated geocoding');
      return this.simulateGeocoding(address, city);
    }

    try {
      const query = encodeURIComponent(`${address}, ${city}, Spain`);
      const url = `${MAPBOX_API_URL}/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;

        return {
          coordinates: { lat, lng },
          placeName: feature.place_name,
          confidence: feature.relevance || 0.5,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Mapbox geocoding error:', error);
      return this.simulateGeocoding(address, city);
    }
  }

  /**
   * Simulación de geocoding para desarrollo
   */
  private static simulateGeocoding(address: string, city: string): GeocodingResult {
    const cityCoords: Record<string, Coordinates> = {
      madrid: { lat: 40.4168, lng: -3.7038 },
      barcelona: { lat: 41.3851, lng: 2.1734 },
      valencia: { lat: 39.4699, lng: -0.3763 },
      sevilla: { lat: 37.3891, lng: -5.9845 },
      zaragoza: { lat: 41.6488, lng: -0.8891 },
      málaga: { lat: 36.7213, lng: -4.4214 },
      bilbao: { lat: 43.263, lng: -2.935 },
      alicante: { lat: 38.3452, lng: -0.4815 },
      default: { lat: 40.4168, lng: -3.7038 },
    };

    const cityKey = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const baseCoords = cityCoords[cityKey] || cityCoords.default;

    // Añadir variación aleatoria para simular dirección específica
    const variation = 0.01;
    return {
      coordinates: {
        lat: baseCoords.lat + (Math.random() - 0.5) * variation,
        lng: baseCoords.lng + (Math.random() - 0.5) * variation,
      },
      placeName: `${address}, ${city}, Spain`,
      confidence: 0.8,
    };
  }

  /**
   * Genera URL de mapa estático de Mapbox
   * @param lat - Latitud
   * @param lng - Longitud
   * @param zoom - Nivel de zoom (default: 15)
   * @param width - Ancho en pixels (default: 800)
   * @param height - Alto en pixels (default: 600)
   */
  static getStaticMapUrl(
    lat: number,
    lng: number,
    zoom: number = 15,
    width: number = 800,
    height: number = 600
  ): string {
    if (!MAPBOX_TOKEN) {
      // Placeholder si no hay token
      return `https://via.placeholder.com/${width}x${height}/4F46E5/FFFFFF?text=Map+${lat.toFixed(4)},${lng.toFixed(4)}`;
    }

    // URL de mapa estático de Mapbox
    return `${MAPBOX_API_URL}/styles/v1/mapbox/streets-v12/static/pin-s+FF0000(${lng},${lat})/${lng},${lat},${zoom},0/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
  }

  /**
   * Verifica si Mapbox está configurado
   */
  static isConfigured(): boolean {
    return !!MAPBOX_TOKEN && MAPBOX_TOKEN.length > 20;
  }

  /**
   * Obtiene puntos de interés cercanos
   * @param lat - Latitud
   * @param lng - Longitud
   * @param categories - Categorías de POI (escuelas, transporte, etc.)
   */
  static async getNearbyPOIs(
    lat: number,
    lng: number,
    categories: string[] = ['school', 'hospital', 'supermarket']
  ): Promise<any[]> {
    if (!MAPBOX_TOKEN) {
      return this.simulateNearbyPOIs(lat, lng);
    }

    try {
      // Mapbox Tilequery API o Places API
      const url = `${MAPBOX_API_URL}/geocoding/v5/mapbox.places/${lng},${lat}.json?types=poi&access_token=${MAPBOX_TOKEN}&limit=10`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('POI search failed');
      }

      const data = await response.json();
      return data.features || [];
    } catch (error) {
      console.error('❌ Mapbox POI search error:', error);
      return this.simulateNearbyPOIs(lat, lng);
    }
  }

  /**
   * Simulación de POIs para desarrollo
   */
  private static simulateNearbyPOIs(lat: number, lng: number): any[] {
    return [
      {
        name: 'Metro',
        type: 'transport',
        distance: Math.floor(Math.random() * 500) + 100,
        coordinates: { lat: lat + 0.001, lng: lng + 0.001 },
      },
      {
        name: 'Supermercado',
        type: 'shop',
        distance: Math.floor(Math.random() * 300) + 50,
        coordinates: { lat: lat - 0.001, lng: lng + 0.001 },
      },
      {
        name: 'Colegio',
        type: 'education',
        distance: Math.floor(Math.random() * 800) + 200,
        coordinates: { lat: lat + 0.002, lng: lng - 0.001 },
      },
    ];
  }
}

export default MapboxService;
