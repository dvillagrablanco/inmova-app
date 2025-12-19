/**
 * Hook para exportación CSV
 * 
 * Hook reutilizable que proporciona funcionalidad de exportación CSV
 * con estados de carga, feedback visual y manejo de errores.
 * 
 * @module use-csv-export
 * @since Semana 2, Tarea 2.6
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Opciones para el hook useCSVExport
 */
export interface UseCSVExportOptions {
  /** Endpoint de la API para exportación */
  endpoint: string;
  /** Nombre del archivo (con o sin extensión .csv) */
  filename?: string;
  /** Callback al completar exitosamente */
  onSuccess?: () => void;
  /** Callback al ocurrir un error */
  onError?: (error: Error) => void;
  /** Mostrar toast de éxito (default: true) */
  showSuccessToast?: boolean;
  /** Mostrar toast de error (default: true) */
  showErrorToast?: boolean;
}

/**
 * Resultado del hook useCSVExport
 */
export interface UseCSVExportResult {
  /** Función para ejecutar la exportación */
  exportCSV: (params?: Record<string, any>) => Promise<void>;
  /** Estado de carga */
  isExporting: boolean;
  /** Último error */
  error: Error | null;
  /** Resetear error */
  clearError: () => void;
}

/**
 * Hook para exportación CSV con feedback visual
 * 
 * @param options - Opciones de configuración
 * @returns Objeto con función de exportación y estados
 * 
 * @example
 * ```typescript
 * function ContractsPage() {
 *   const { exportCSV, isExporting } = useCSVExport({
 *     endpoint: '/api/export',
 *     filename: 'contratos.csv',
 *   });
 * 
 *   return (
 *     <Button
 *       onClick={() => exportCSV({ type: 'contracts', estado: 'activo' })}
 *       disabled={isExporting}
 *     >
 *       {isExporting ? 'Exportando...' : 'Exportar CSV'}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useCSVExport(options: UseCSVExportOptions): UseCSVExportResult {
  const {
    endpoint,
    filename,
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportCSV = async (params: Record<string, any> = {}) => {
    setIsExporting(true);
    setError(null);

    // Mostrar toast de loading
    const toastId = toast.loading('Preparando exportación...');

    try {
      // Construir URL con parámetros
      const queryParams = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v != null)
      ).toString();
      const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;

      // Realizar request
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      // Obtener blob del CSV
      const blob = await response.blob();

      // Determinar nombre de archivo
      let downloadFilename = filename || 'export.csv';
      if (!downloadFilename.endsWith('.csv')) {
        downloadFilename += '.csv';
      }

      // Intentar obtener filename del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          downloadFilename = filenameMatch[1];
        }
      }

      // Crear link de descarga y ejecutar
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      // Feedback de éxito
      if (showSuccessToast) {
        toast.success('¡Exportación completada!', { id: toastId });
      } else {
        toast.dismiss(toastId);
      }

      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al exportar');
      setError(error);

      console.error('Error exporting CSV:', error);

      if (showErrorToast) {
        toast.error(
          error.message || 'Error al exportar datos. Inténtalo de nuevo.',
          { id: toastId }
        );
      } else {
        toast.dismiss(toastId);
      }

      onError?.(error);
    } finally {
      setIsExporting(false);
    }
  };

  const clearError = () => setError(null);

  return {
    exportCSV,
    isExporting,
    error,
    clearError,
  };
}
