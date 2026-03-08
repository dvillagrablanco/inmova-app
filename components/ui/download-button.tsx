'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadButtonProps {
  /** URL de descarga directa (presigned S3 URL o API endpoint) */
  url?: string;
  /** ID del documento en BD para obtener presigned URL vía API */
  documentId?: string;
  /** Nombre del archivo para la descarga */
  filename?: string;
  /** Texto del botón */
  label?: string;
  /** Variante del botón */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  /** Tamaño */
  size?: 'default' | 'sm' | 'icon';
  /** Clase CSS adicional */
  className?: string;
  /** Solo icono */
  iconOnly?: boolean;
}

/**
 * Botón reutilizable de descarga.
 * 
 * Soporta 3 modos:
 * 1. URL directa (S3 presigned): `url="https://s3..."` 
 * 2. ID de documento: `documentId="clx..."` → llama a /api/documents/[id]/download
 * 3. API endpoint: `url="/api/export?type=buildings"` → descarga la respuesta
 */
export function DownloadButton({
  url,
  documentId,
  filename = 'descarga',
  label = 'Descargar',
  variant = 'outline',
  size = 'sm',
  className,
  iconOnly = false,
}: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      let downloadUrl = url;

      // If documentId provided, get presigned URL from API
      if (!downloadUrl && documentId) {
        const res = await fetch(`/api/documents/${documentId}/download`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        const data = await res.json();
        downloadUrl = data.url || data.signedUrl || data.downloadUrl;
      }

      if (!downloadUrl) {
        toast.error('No hay archivo disponible para descargar');
        return;
      }

      // If it's an API endpoint (starts with /api), fetch and create blob
      if (downloadUrl.startsWith('/api')) {
        const res = await fetch(downloadUrl);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        // Direct URL (S3 presigned) — open in new tab
        window.open(downloadUrl, '_blank');
      }

      toast.success('Descarga iniciada');
    } catch (error: any) {
      toast.error(error.message || 'Error al descargar');
    } finally {
      setLoading(false);
    }
  };

  if (iconOnly) {
    return (
      <Button variant={variant} size="icon" onClick={handleDownload} disabled={loading} className={className} title={label}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload} disabled={loading} className={className}>
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
      {label}
    </Button>
  );
}
