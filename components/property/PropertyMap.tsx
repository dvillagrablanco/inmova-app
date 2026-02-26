'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PropertyMapProps {
  address: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  showNearbyPoints?: boolean;
}

/**
 * Mapa embebido usando OpenStreetMap (gratuito, sin API key).
 * Geocodifica la dirección con Nominatim y muestra un iframe de OSM.
 */
export function PropertyMap({
  address,
  city,
  latitude,
  longitude,
  showNearbyPoints = false,
}: PropertyMapProps) {
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fullAddress = city ? `${address}, ${city}` : address;

  useEffect(() => {
    const geocode = async () => {
      // Si ya tenemos coordenadas, usarlas directamente
      if (latitude && longitude) {
        setCoords({ lat: latitude, lng: longitude });
        setLoading(false);
        return;
      }

      // Geocodificar con Nominatim (OpenStreetMap, gratuito)
      try {
        const query = encodeURIComponent(fullAddress);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
          { headers: { 'User-Agent': 'InmovaApp/1.0' } }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
          } else {
            setError('No se encontró la ubicación');
          }
        } else {
          setError('Error al buscar ubicación');
        }
      } catch (err) {
        console.error('Geocoding error:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    geocode();
  }, [address, city, latitude, longitude, fullAddress]);

  const openInGoogleMaps = () => {
    const query = encodeURIComponent(fullAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const openInOSM = () => {
    if (coords) {
      window.open(`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=17/${coords.lat}/${coords.lng}`, '_blank');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
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

  if (error || !coords) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MapPin className="h-5 w-5" />
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{error || 'Ubicación no disponible'}</p>
            <p className="text-xs">{fullAddress}</p>
            <Button variant="outline" size="sm" onClick={openInGoogleMaps}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Buscar en Google Maps
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // OpenStreetMap iframe embed (100% gratuito)
  const zoom = 17;
  const bbox = 0.003; // ~300m alrededor del punto
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - bbox}%2C${coords.lat - bbox}%2C${coords.lng + bbox}%2C${coords.lat + bbox}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MapPin className="h-5 w-5" />
          Ubicación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mapa real OSM embebido */}
        <div className="aspect-video rounded-lg overflow-hidden border bg-muted relative">
          <iframe
            src={osmEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer"
            title={`Mapa de ${fullAddress}`}
            className="absolute inset-0"
          />
        </div>

        {/* Dirección + coordenadas */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">{address}</p>
            {city && <p className="text-muted-foreground text-xs">{city}</p>}
            <p className="text-muted-foreground text-xs mt-0.5">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openInGoogleMaps} className="flex-1">
            <ExternalLink className="mr-2 h-3.5 w-3.5" />
            Google Maps
          </Button>
          <Button variant="outline" size="sm" onClick={openInOSM} className="flex-1">
            <MapPin className="mr-2 h-3.5 w-3.5" />
            OpenStreetMap
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
