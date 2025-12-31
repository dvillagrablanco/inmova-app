'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PropertyMapProps {
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  showNearbyPoints?: boolean;
}

// Simulación de mapa sin Mapbox (para evitar dependencias)
export function PropertyMap({
  address,
  city,
  latitude,
  longitude,
  showNearbyPoints = true,
}: PropertyMapProps) {
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const geocodeAddress = async () => {
      // Si ya tenemos coordenadas, usarlas
      if (latitude && longitude) {
        setCoordinates({ lat: latitude, lng: longitude });
        setLoading(false);
        return;
      }

      // Simular geocoding (en producción usar Mapbox Geocoding API)
      setTimeout(() => {
        // Coordenadas simuladas para ciudades principales de España
        const cityCoords: Record<string, { lat: number; lng: number }> = {
          madrid: { lat: 40.4168, lng: -3.7038 },
          barcelona: { lat: 41.3851, lng: 2.1734 },
          valencia: { lat: 39.4699, lng: -0.3763 },
          sevilla: { lat: 37.3891, lng: -5.9845 },
          zaragoza: { lat: 41.6488, lng: -0.8891 },
          málaga: { lat: 36.7213, lng: -4.4214 },
          default: { lat: 40.4168, lng: -3.7038 },
        };

        const cityKey = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const coords = cityCoords[cityKey] || cityCoords.default;
        
        // Añadir pequeña variación aleatoria para simular dirección específica
        const variation = 0.01;
        setCoordinates({
          lat: coords.lat + (Math.random() - 0.5) * variation,
          lng: coords.lng + (Math.random() - 0.5) * variation,
        });
        setLoading(false);
      }, 1000);
    };

    geocodeAddress();
  }, [address, city, latitude, longitude]);

  const openInGoogleMaps = () => {
    const query = encodeURIComponent(`${address}, ${city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{error}</p>
            <Button variant="outline" onClick={openInGoogleMaps}>
              Ver en Google Maps
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Ubicación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mapa simulado (en producción sería Mapbox GL JS) */}
        <div className="aspect-video bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg relative overflow-hidden">
          {/* Simulación de mapa */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Marcador central */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              {/* Pin */}
              <div className="w-12 h-12 bg-primary rounded-full shadow-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary-foreground fill-current" />
              </div>
              {/* Pulso */}
              <div className="absolute inset-0 w-12 h-12 bg-primary rounded-full animate-ping opacity-30" />
            </div>
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg">
            <p className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {address}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{city}</p>
            {coordinates && (
              <p className="text-xs text-muted-foreground mt-1">
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={openInGoogleMaps} className="flex-1">
            <MapPin className="mr-2 h-4 w-4" />
            Abrir en Google Maps
          </Button>
        </div>

        {/* Puntos de interés cercanos (simulado) */}
        {showNearbyPoints && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Puntos de Interés Cercanos</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="flex items-center gap-2">
                  🏪 Supermercado
                </span>
                <span className="text-muted-foreground">~300m</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="flex items-center gap-2">
                  🚇 Metro
                </span>
                <span className="text-muted-foreground">~500m</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="flex items-center gap-2">
                  🏥 Centro de Salud
                </span>
                <span className="text-muted-foreground">~800m</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="flex items-center gap-2">
                  🏫 Colegio
                </span>
                <span className="text-muted-foreground">~1.2km</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              * Distancias aproximadas. En producción se calcularían con geolocalización real.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
