'use client';

/**
 * Visor de plano catastral usando el servicio WMS INSPIRE del Catastro español.
 * Muestra una imagen de mapa centrada en las coordenadas del inmueble
 * con la cartografía catastral superpuesta (parcelas, edificios, límites).
 *
 * Servicios usados:
 * - WMS INSPIRE: http://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx
 * - Sede Electrónica (link externo): https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx
 */

import { useState } from 'react';
import { ExternalLink, Map, ZoomIn, ZoomOut, Maximize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CatastroPlanoViewerProps {
  referenciaCatastral?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  className?: string;
}

const WMS_BASE = 'http://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx';
const SEDE_CATASTRO_URL = 'https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiworker.aspx';
const SEDE_MAPA_URL = 'https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx';

const ZOOM_LEVELS = [
  { label: 'Parcela', delta: 0.0008 },
  { label: 'Manzana', delta: 0.002 },
  { label: 'Barrio', delta: 0.005 },
];

function buildWmsUrl(lat: number, lon: number, delta: number, width = 600, height = 450): string {
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  return `${WMS_BASE}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap`
    + `&LAYERS=Catastro`
    + `&STYLES=`
    + `&SRS=EPSG:4326`
    + `&BBOX=${bbox}`
    + `&WIDTH=${width}`
    + `&HEIGHT=${height}`
    + `&FORMAT=image/png`
    + `&TRANSPARENT=true`;
}

export function CatastroPlanoViewer({
  referenciaCatastral,
  latitud,
  longitud,
  className = '',
}: CatastroPlanoViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasCoords = typeof latitud === 'number' && typeof longitud === 'number' && latitud !== 0 && longitud !== 0;
  const hasRC = !!referenciaCatastral && referenciaCatastral.length >= 14;

  if (!hasRC && !hasCoords) return null;

  const sedeUrl = hasRC
    ? `${SEDE_CATASTRO_URL}?RefCat=${referenciaCatastral}`
    : null;
  const mapaUrl = hasRC
    ? `${SEDE_MAPA_URL}?refcat=${referenciaCatastral}`
    : null;

  const wmsUrl = hasCoords
    ? buildWmsUrl(latitud!, longitud!, ZOOM_LEVELS[zoomLevel].delta)
    : null;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-gray-900">Plano Catastral</h3>
          {hasRC && (
            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {referenciaCatastral}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {mapaUrl && (
            <a
              href={mapaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium"
            >
              <Maximize2 className="h-3 w-3" />
              Abrir mapa
            </a>
          )}
          {sedeUrl && (
            <a
              href={sedeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium ml-3"
            >
              <ExternalLink className="h-3 w-3" />
              Sede Catastro
            </a>
          )}
        </div>
      </div>

      {/* Map image */}
      {wmsUrl && !imageError ? (
        <div className="relative">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
            </div>
          )}
          <img
            src={wmsUrl}
            alt={`Plano catastral ${referenciaCatastral || ''}`}
            className={`w-full h-auto transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-1">
            <button
              onClick={() => setZoomLevel(Math.max(0, zoomLevel - 1))}
              disabled={zoomLevel === 0}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
              title="Acercar"
            >
              <ZoomIn className="h-3.5 w-3.5 text-gray-600" />
            </button>
            <span className="text-[9px] text-gray-500 font-medium px-1 min-w-[50px] text-center">
              {ZOOM_LEVELS[zoomLevel].label}
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(ZOOM_LEVELS.length - 1, zoomLevel + 1))}
              disabled={zoomLevel === ZOOM_LEVELS.length - 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
              title="Alejar"
            >
              <ZoomOut className="h-3.5 w-3.5 text-gray-600" />
            </button>
          </div>
          {/* Attribution */}
          <div className="absolute bottom-3 left-3 text-[8px] text-gray-500 bg-white/80 px-1.5 py-0.5 rounded">
            Fuente: Catastro INSPIRE WMS
          </div>
        </div>
      ) : hasRC && !hasCoords ? (
        <div className="p-6 text-center">
          <Map className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-3">
            Sin coordenadas para mostrar el mapa.
          </p>
          <div className="flex items-center justify-center gap-2">
            {mapaUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={mapaUrl} target="_blank" rel="noopener noreferrer">
                  <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
                  Ver en Catastro
                </a>
              </Button>
            )}
          </div>
        </div>
      ) : imageError ? (
        <div className="p-6 text-center">
          <p className="text-xs text-gray-400 mb-2">No se pudo cargar el plano WMS</p>
          {mapaUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={mapaUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Ver en Sede Catastro
              </a>
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
