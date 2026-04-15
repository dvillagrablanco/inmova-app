'use client';

import { useEffect, useState } from 'react';
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

export function PropertyMap({ address, city, latitude, longitude }: PropertyMapProps) {
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fullAddress = city ? `${address}, ${city}` : address;

  const cleanAddressForGeocoding = (addr: string): string => {
    return addr
      .replace(/,?\s*\d+[ºª°]\s*[A-Za-z]?\b/g, '')
      .replace(/,?\s*(bajo|ático|entresuelo|principal|ent|bjo|átic|piso)\s*\w*/gi, '')
      .replace(/,?\s*\d+[ºª°]\b/g, '')
      .replace(/,\s*,/g, ',')
      .replace(/,\s*$/g, '')
      .trim();
  };

  useEffect(() => {
    const geocode = async () => {
      if (latitude && longitude) {
        setCoords({ lat: latitude, lng: longitude });
        setLoading(false);
        return;
      }

      try {
        const cleanedAddress = cleanAddressForGeocoding(fullAddress);
        const query = encodeURIComponent(cleanedAddress);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=es`,
          { headers: { 'User-Agent': 'InmovaApp/1.0' } }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
          } else if (city) {
            const cityRes = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ', Spain')}&limit=1`,
              { headers: { 'User-Agent': 'InmovaApp/1.0' } }
            );
            if (cityRes.ok) {
              const cityData = await cityRes.json();
              if (cityData.length > 0) {
                setCoords({ lat: parseFloat(cityData[0].lat), lng: parseFloat(cityData[0].lon) });
              }
            }
          }
        }
      } catch {
        // Geocoding failed silently — fallback map will show
      } finally {
        setLoading(false);
      }
    };

    geocode();
  }, [address, city, latitude, longitude, fullAddress]);

  const openInGoogleMaps = () => {
    const query = coords ? `${coords.lat},${coords.lng}` : encodeURIComponent(fullAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
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

  const osmEmbedUrl = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.005},${coords.lat - 0.003},${coords.lng + 0.005},${coords.lat + 0.003}&layer=mapnik&marker=${coords.lat},${coords.lng}`
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MapPin className="h-5 w-5" />
          Ubicación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="aspect-video rounded-lg overflow-hidden border bg-muted relative">
          {osmEmbedUrl ? (
            <iframe
              src={osmEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              title={`Mapa de ${fullAddress}`}
              className="absolute inset-0"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No se pudo determinar la ubicación exacta</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">{address}</p>
            {city && <p className="text-muted-foreground text-xs">{city}</p>}
            {coords && (
              <p className="text-muted-foreground text-xs mt-0.5">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={openInGoogleMaps} className="w-full">
          <ExternalLink className="mr-2 h-3.5 w-3.5" />
          Abrir en Google Maps
        </Button>
      </CardContent>
    </Card>
  );
}
