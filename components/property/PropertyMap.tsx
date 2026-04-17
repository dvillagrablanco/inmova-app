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
      .replace(/,?\s*\d+[ºª°]\s*(Dcha|Izda|Izq|Dch|Ext|Int|[A-Z])?\b/gi, '')
      .replace(/,?\s*(bajo|ático|entresuelo|principal|ent|bjo|átic|piso|planta|puerta)\s*\w*/gi, '')
      .replace(/,?\s*\d+[ºª°]\b/g, '')
      .replace(/\b(Urb\.?|Urbanización)\s*/gi, '')
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

      const tryNominatim = async (query: string): Promise<{ lat: number; lng: number } | null> => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=es`,
            { headers: { 'User-Agent': 'InmovaApp/1.0' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
              return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            }
          }
        } catch {}
        return null;
      };

      try {
        const cleanedAddress = cleanAddressForGeocoding(fullAddress);
        let result = await tryNominatim(cleanedAddress);

        if (!result) {
          result = await tryNominatim(fullAddress);
        }

        if (!result && address && city) {
          result = await tryNominatim(`${address}, ${city}, España`);
        }

        if (!result && address) {
          const streetNumber = address.match(/^([^,]+?\s+\d+)/);
          if (streetNumber) {
            result = await tryNominatim(`${streetNumber[1].trim()}, ${city || ''}, España`);
          }
        }

        if (!result && city) {
          const streetName = address
            .replace(/^(Calle|C\/|Av\.|Avda\.?|Paseo|Pso\.?|Plaza|Pl\.?)\s*/i, '')
            .split(/[,\d]/)[0]
            .trim();
          if (streetName && streetName.length > 3) {
            result = await tryNominatim(`${streetName}, ${city}, España`);
          }
        }

        if (!result && city) {
          result = await tryNominatim(`${city}, España`);
        }

        if (result) {
          setCoords(result);
        }
      } catch {
        // Geocoding failed
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

  // Google Maps embed sin API key (modo búsqueda / marcador por coordenadas)
  // Preferir coords exactas si existen, si no geocodificamos la dirección limpia
  // forzando España para evitar resultados ambiguos (ciudades repetidas).
  const addressForMap = (() => {
    const cleaned = cleanAddressForGeocoding(fullAddress);
    const hasSpain = /españa|spain/i.test(cleaned);
    return hasSpain ? cleaned : `${cleaned}, España`;
  })();
  const googleEmbedUrl = coords
    ? `https://maps.google.com/maps?q=loc:${coords.lat},${coords.lng}&z=18&hl=es&output=embed&iwloc=near`
    : `https://maps.google.com/maps?q=${encodeURIComponent(addressForMap)}&z=18&hl=es&output=embed&iwloc=near`;

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
          <iframe
            src={googleEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            title={`Mapa de ${fullAddress}`}
            className="absolute inset-0"
          />
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
