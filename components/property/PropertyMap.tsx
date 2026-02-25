'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PropertyMapProps {
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  showNearbyPoints?: boolean;
}

/**
 * Mapa de ubicación de propiedad usando Google Maps Embed (gratuito, sin API key).
 * Muestra el mapa real con la dirección de la propiedad.
 */
export function PropertyMap({
  address,
  city,
  latitude,
  longitude,
  showNearbyPoints = true,
}: PropertyMapProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const fullAddress = `${address}, ${city}, España`;
  const encodedAddress = encodeURIComponent(fullAddress);

  // Google Maps Embed URL (gratuito, sin API key requerida para uso básico)
  // Si hay coordenadas, las usamos; si no, buscamos por dirección
  const mapSrc = latitude && longitude
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
    : `https://maps.google.com/maps?q=${encodedAddress}&z=16&output=embed`;

  const googleMapsLink = latitude && longitude
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Ubicación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mapa real de Google Maps */}
        <div className="aspect-video rounded-lg overflow-hidden relative bg-muted">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground text-sm">Cargando mapa...</div>
            </div>
          )}
          <iframe
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setIframeLoaded(true)}
            className="absolute inset-0"
          />
        </div>

        {/* Dirección + acciones */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground min-w-0">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">{address}</p>
              <p>{city}</p>
              {latitude && longitude && (
                <p className="text-xs mt-1">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(googleMapsLink, '_blank')}
            className="shrink-0"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Google Maps
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
