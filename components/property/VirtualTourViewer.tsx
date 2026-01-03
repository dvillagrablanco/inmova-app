/**
 * Visor de Tours Virtuales 360°
 * Soporta: Matterport, Kuula, YouTube, Self-hosted
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, ExternalLink, Loader2 } from 'lucide-react';

interface VirtualTourViewerProps {
  propertyId: string;
  autoload?: boolean;
}

export function VirtualTourViewer({ propertyId, autoload = true }: VirtualTourViewerProps) {
  const [loading, setLoading] = useState(true);
  const [tour, setTour] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoload) {
      loadTour();
    }
  }, [propertyId, autoload]);

  const loadTour = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/properties/${propertyId}/virtual-tour`);

      if (response.status === 404) {
        setError('Esta propiedad no tiene tour virtual');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cargar el tour');
      }

      const data = await response.json();
      setTour(data.data);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-96 text-center">
          <div className="text-gray-400 mb-4">
            <Eye className="h-12 w-12" />
          </div>
          <p className="text-gray-600">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadTour}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!tour) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {tour.titulo}
            </CardTitle>
            {tour.descripcion && (
              <CardDescription>{tour.descripcion}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Eye className="h-4 w-4" />
            <span>{tour.vistas} vistas</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
          {tour.embedCode ? (
            // Embed code custom
            <div dangerouslySetInnerHTML={{ __html: tour.embedCode }} />
          ) : tour.tipo === 'MATTERPORT' ? (
            // Matterport iframe
            <iframe
              src={tour.urlPrincipal}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="vr; xr; accelerometer; magnetometer; gyroscope; autoplay"
              allowFullScreen
              className="absolute inset-0"
            />
          ) : tour.tipo === 'KUULA' ? (
            // Kuula iframe
            <iframe
              src={tour.urlPrincipal}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="vr; xr; gyroscope; accelerometer"
              allowFullScreen
              className="absolute inset-0"
            />
          ) : tour.tipo === 'YOUTUBE' ? (
            // YouTube embed
            <iframe
              src={tour.urlPrincipal.replace('watch?v=', 'embed/')}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
            />
          ) : (
            // Self-hosted o link externo
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center mb-4">
                <Eye className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Ver tour virtual</p>
              </div>
              <Button asChild>
                <a href={tour.urlPrincipal} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Tour
                </a>
              </Button>
            </div>
          )}
        </div>

        {tour.escenas && tour.escenas.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Escenas</h4>
            <div className="grid grid-cols-4 gap-2">
              {tour.escenas.map((escena: any, i: number) => (
                <button
                  key={i}
                  className="relative aspect-video rounded overflow-hidden hover:opacity-80 transition"
                >
                  <img
                    src={escena.urlImagen}
                    alt={escena.nombre}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                    {escena.nombre}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
