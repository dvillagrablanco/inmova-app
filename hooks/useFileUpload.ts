/**
 * Hook: useFileUpload
 * 
 * Facilita el upload de archivos programáticamente
 * Sin necesidad de usar el componente visual
 * 
 * @example
 * const { upload, uploading, progress } = useFileUpload();
 * 
 * const handleSubmit = async (files: File[]) => {
 *   const urls = await upload(files, 'properties', 'image');
 *   console.log('URLs:', urls);
 * };
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export type FileType = 'image' | 'document';

interface UploadOptions {
  /** Mostrar toast de progreso */
  showToast?: boolean;
  /** Callback de progreso (0-100) */
  onProgress?: (progress: number) => void;
}

interface UseFileUploadReturn {
  /** Función de upload */
  upload: (files: File[], folder: string, fileType: FileType, options?: UploadOptions) => Promise<string[]>;
  /** Estado de uploading */
  uploading: boolean;
  /** Progreso del upload (0-100) */
  progress: number;
  /** Error si hay */
  error: string | null;
}

export function useFileUpload(): UseFileUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload de archivos
   */
  const upload = useCallback(
    async (
      files: File[],
      folder: string,
      fileType: FileType,
      options: UploadOptions = {}
    ): Promise<string[]> => {
      const { showToast = true, onProgress } = options;

      if (files.length === 0) {
        throw new Error('No hay archivos para subir');
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Preparar FormData
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('folder', folder);
        formData.append('fileType', fileType);

        // Simular progreso (fetch no soporta progreso nativo para upload)
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const next = prev + 10;
            if (next >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            if (onProgress) onProgress(next);
            return next;
          });
        }, 200);

        // Upload
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setProgress(100);
        if (onProgress) onProgress(100);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error subiendo archivos');
        }

        if (!data.success) {
          throw new Error('Upload falló');
        }

        // Mostrar toast de éxito
        if (showToast) {
          toast.success(`${data.count} archivo(s) subido(s) correctamente`);
        }

        // Extraer URLs
        const urls = data.uploads.map((u: any) => u.url);

        return urls;
      } catch (err: any) {
        const errorMsg = err.message || 'Error subiendo archivos';
        setError(errorMsg);

        if (showToast) {
          toast.error(errorMsg);
        }

        throw err;
      } finally {
        setUploading(false);
        // Reset progreso después de 1 segundo
        setTimeout(() => {
          setProgress(0);
        }, 1000);
      }
    },
    []
  );

  return {
    upload,
    uploading,
    progress,
    error,
  };
}
