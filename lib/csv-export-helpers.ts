/**
 * CSV Export Helpers
 * 
 * Utilidades reutilizables para exportación de CSV con formato
 * optimizado para Excel y compatibilidad UTF-8.
 * 
 * @module csv-export-helpers
 * @since Semana 2, Tarea 2.6
 */

import { NextResponse } from 'next/server';
import Papa from 'papaparse';

/**
 * Configuración global de exportación CSV
 */
export const CSV_CONFIG = {
  /** Número máximo de filas por exportación */
  MAX_ROWS: 10000,
  /** Encoding para compatibilidad */
  ENCODING: 'utf-8',
  /** Delimitador de campos */
  DELIMITER: ',',
  /** Byte Order Mark para detección UTF-8 en Excel */
  BOM: '\ufeff',
} as const;

/**
 * Genera CSV con formato optimizado para Excel
 * 
 * Incluye BOM (Byte Order Mark) para que Excel detecte automáticamente
 * la codificación UTF-8 y muestre correctamente caracteres especiales.
 * 
 * @param data - Array de objetos a convertir a CSV
 * @returns String CSV con BOM
 * 
 * @example
 * ```typescript
 * const data = [
 *   { nombre: 'Juan', edad: 30 },
 *   { nombre: 'María', edad: 25 }
 * ];
 * const csv = generateCSV(data);
 * ```
 */
export function generateCSV<T extends Record<string, any>>(data: T[]): string {
  if (data.length === 0) {
    return CSV_CONFIG.BOM + 'No hay datos para exportar';
  }

  const csv = Papa.unparse(data, {
    delimiter: CSV_CONFIG.DELIMITER,
    header: true,
  });

  // Agregar BOM al inicio para que Excel detecte UTF-8
  return CSV_CONFIG.BOM + csv;
}

/**
 * Formatea fechas para CSV en formato ISO 8601 (YYYY-MM-DD)
 * 
 * @param date - Fecha a formatear
 * @returns String de fecha o vacío si null
 * 
 * @example
 * ```typescript
 * formatDateForCSV(new Date('2024-12-18')) // '2024-12-18'
 * formatDateForCSV(null) // ''
 * ```
 */
export function formatDateForCSV(date: Date | null | undefined): string {
  if (!date) return '';
  
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch (error) {
    return '';
  }
}

/**
 * Formatea fecha y hora para CSV en formato ISO 8601
 * 
 * @param date - Fecha a formatear
 * @returns String de fecha-hora o vacío si null
 * 
 * @example
 * ```typescript
 * formatDateTimeForCSV(new Date()) // '2024-12-18 14:30:00'
 * ```
 */
export function formatDateTimeForCSV(date: Date | null | undefined): string {
  if (!date) return '';
  
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().replace('T', ' ').split('.')[0]; // YYYY-MM-DD HH:mm:ss
  } catch (error) {
    return '';
  }
}

/**
 * Formatea booleanos para CSV (Sí/No en lugar de true/false)
 * 
 * @param value - Valor booleano
 * @returns 'Sí' o 'No'
 * 
 * @example
 * ```typescript
 * formatBooleanForCSV(true) // 'Sí'
 * formatBooleanForCSV(false) // 'No'
 * ```
 */
export function formatBooleanForCSV(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value ? 'Sí' : 'No';
}

/**
 * Formatea números monetarios para CSV con 2 decimales
 * 
 * @param value - Valor numérico
 * @returns String con 2 decimales o '0.00' si null
 * 
 * @example
 * ```typescript
 * formatMoneyForCSV(1234.5) // '1234.50'
 * formatMoneyForCSV(null) // '0.00'
 * ```
 */
export function formatMoneyForCSV(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  return value.toFixed(2);
}

/**
 * Formatea arrays para CSV (separados por punto y coma)
 * 
 * @param arr - Array a formatear
 * @returns String separado por '; '
 * 
 * @example
 * ```typescript
 * formatArrayForCSV(['agua', 'luz', 'gas']) // 'agua; luz; gas'
 * ```
 */
export function formatArrayForCSV(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return '';
  return arr.join('; ');
}

/**
 * Limpia texto para CSV (elimina saltos de línea y comillas dobles)
 * 
 * @param text - Texto a limpiar
 * @returns Texto limpio
 */
export function sanitizeTextForCSV(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    .replace(/\r\n|\r|\n/g, ' ') // Reemplazar saltos de línea con espacio
    .replace(/"/g, "'") // Reemplazar comillas dobles con simples
    .trim();
}

/**
 * Crea una respuesta HTTP de CSV con headers apropiados
 * 
 * @param csv - String CSV
 * @param filename - Nombre del archivo (sin extensión)
 * @returns NextResponse con headers correctos
 * 
 * @example
 * ```typescript
 * const csv = generateCSV(data);
 * return createCSVResponse(csv, 'contratos');
 * ```
 */
export function createCSVResponse(csv: string, filename: string): NextResponse {
  // Asegurar extensión .csv
  const fullFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fullFilename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

/**
 * Tipo para opciones de exportación
 */
export interface ExportOptions {
  /** Número máximo de filas (por defecto: CSV_CONFIG.MAX_ROWS) */
  maxRows?: number;
  /** Incluir timestamp en nombre de archivo */
  includeTimestamp?: boolean;
}

/**
 * Genera nombre de archivo con timestamp opcional
 * 
 * @param baseName - Nombre base del archivo
 * @param options - Opciones de exportación
 * @returns Nombre de archivo con timestamp si aplica
 * 
 * @example
 * ```typescript
 * generateFilename('contratos', { includeTimestamp: true })
 * // 'contratos_2024-12-18_14-30-00.csv'
 * ```
 */
export function generateFilename(
  baseName: string,
  options: ExportOptions = {}
): string {
  const { includeTimestamp = false } = options;

  if (!includeTimestamp) {
    return `${baseName}.csv`;
  }

  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[T:]/g, '-')
    .split('.')[0];

  return `${baseName}_${timestamp}.csv`;
}

/**
 * Valida que los datos no excedan el límite de filas
 * 
 * @param dataLength - Número de filas
 * @param maxRows - Límite máximo
 * @returns true si está dentro del límite
 */
export function validateExportSize(
  dataLength: number,
  maxRows: number = CSV_CONFIG.MAX_ROWS
): { valid: boolean; message?: string } {
  if (dataLength === 0) {
    return {
      valid: false,
      message: 'No hay datos para exportar',
    };
  }

  if (dataLength > maxRows) {
    return {
      valid: false,
      message: `La exportación excede el límite de ${maxRows} filas. Se exportarán solo las primeras ${maxRows}.`,
    };
  }

  return { valid: true };
}

/**
 * Metadata para incluir en exports
 */
export interface ExportMetadata {
  exportDate: string;
  totalRecords: number;
  maxRecords: number;
  truncated: boolean;
}

/**
 * Genera metadata para el export
 * 
 * @param totalRecords - Total de registros exportados
 * @param maxRecords - Máximo permitido
 * @returns Objeto con metadata
 */
export function generateExportMetadata(
  totalRecords: number,
  maxRecords: number = CSV_CONFIG.MAX_ROWS
): ExportMetadata {
  return {
    exportDate: new Date().toISOString(),
    totalRecords,
    maxRecords,
    truncated: totalRecords > maxRecords,
  };
}
