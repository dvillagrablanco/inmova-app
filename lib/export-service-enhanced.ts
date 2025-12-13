'use client';

import * as XLSX from 'xlsx';
import { Parser } from 'papaparse';
import logger from './logger';

export type ExportFormat = 'csv' | 'xlsx' | 'json';

export interface ExportOptions {
  filename: string;
  format: ExportFormat;
  sheetName?: string;
  includeTimestamp?: boolean;
  customHeaders?: Record<string, string>; // Mapeo de claves a nombres de columna
}

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

/**
 * Servicio mejorado de exportación de datos
 * Soporta CSV, Excel (XLSX) y JSON
 * Optimizado para grandes volúmenes de datos
 */
export class ExportService {
  /**
   * Exportar datos a archivo
   */
  static async exportData<T extends Record<string, any>>(
    data: T[],
    options: ExportOptions
  ): Promise<void> {
    try {
      const filename = this.generateFilename(options.filename, options.format, options.includeTimestamp);

      switch (options.format) {
        case 'csv':
          await this.exportToCSV(data, filename, options.customHeaders);
          break;
        case 'xlsx':
          await this.exportToExcel(data, filename, options.sheetName, options.customHeaders);
          break;
        case 'json':
          await this.exportToJSON(data, filename);
          break;
        default:
          throw new Error(`Formato no soportado: ${options.format}`);
      }

      logger.info('Exportación completada', { filename, format: options.format, records: data.length });
    } catch (error) {
      logger.error('Error en exportación', error);
      throw error;
    }
  }

  /**
   * Exportar a CSV
   */
  private static async exportToCSV(
    data: any[],
    filename: string,
    customHeaders?: Record<string, string>
  ): Promise<void> {
    const processedData = this.processData(data, customHeaders);
    const csv = this.convertToCSV(processedData);
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exportar a Excel (XLSX)
   */
  private static async exportToExcel(
    data: any[],
    filename: string,
    sheetName: string = 'Datos',
    customHeaders?: Record<string, string>
  ): Promise<void> {
    const processedData = this.processData(data, customHeaders);
    
    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(processedData);

    // Aplicar estilos a la cabecera
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E2E8F0' } },
        alignment: { horizontal: 'center' },
      };
    }

    // Auto-ajustar ancho de columnas
    const colWidths = this.calculateColumnWidths(processedData);
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generar y descargar archivo
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.downloadBlob(blob, filename);
  }

  /**
   * Exportar a JSON
   */
  private static async exportToJSON(data: any[], filename: string): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, filename, 'application/json;charset=utf-8;');
  }

  /**
   * Procesar datos aplicando headers personalizados
   */
  private static processData(
    data: any[],
    customHeaders?: Record<string, string>
  ): any[] {
    if (!customHeaders || data.length === 0) return data;

    return data.map(item => {
      const processed: Record<string, any> = {};
      Object.keys(item).forEach(key => {
        const newKey = customHeaders[key] || key;
        processed[newKey] = item[key];
      });
      return processed;
    });
  }

  /**
   * Convertir array de objetos a CSV
   */
  private static convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Añadir headers
    csvRows.push(headers.map(h => this.escapeCSVValue(h)).join(','));

    // Añadir filas
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return this.escapeCSVValue(this.formatValue(value));
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Escapar valores para CSV
   */
  private static escapeCSVValue(value: any): string {
    if (value == null) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  /**
   * Formatear valores para exportación
   */
  private static formatValue(value: any): string {
    if (value == null) return '';
    if (value instanceof Date) return value.toLocaleDateString('es-ES');
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  /**
   * Calcular anchos de columna para Excel
   */
  private static calculateColumnWidths(data: any[]): any[] {
    if (data.length === 0) return [];

    const keys = Object.keys(data[0]);
    return keys.map(key => {
      const maxLength = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Máximo 50 caracteres
    });
  }

  /**
   * Generar nombre de archivo
   */
  private static generateFilename(
    baseName: string,
    format: ExportFormat,
    includeTimestamp: boolean = true
  ): string {
    const timestamp = includeTimestamp
      ? `_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`
      : '';
    return `${baseName}${timestamp}.${format}`;
  }

  /**
   * Descargar archivo de texto
   */
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  /**
   * Descargar blob
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exportar con columnas personalizadas
   */
  static async exportWithColumns<T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    options: Omit<ExportOptions, 'customHeaders'>
  ): Promise<void> {
    // Transformar datos según columnas
    const transformedData = data.map(item => {
      const row: Record<string, any> = {};
      columns.forEach(col => {
        const value = item[col.key];
        row[col.label] = col.format ? col.format(value) : value;
      });
      return row;
    });

    await this.exportData(transformedData, options);
  }

  /**
   * Exportar múltiples hojas a Excel
   */
  static async exportMultipleSheets(
    sheets: Array<{ name: string; data: any[]; customHeaders?: Record<string, string> }>,
    filename: string,
    includeTimestamp: boolean = true
  ): Promise<void> {
    try {
      const wb = XLSX.utils.book_new();

      for (const sheet of sheets) {
        const processedData = this.processData(sheet.data, sheet.customHeaders);
        const ws = XLSX.utils.json_to_sheet(processedData);
        
        // Auto-ajustar anchos
        ws['!cols'] = this.calculateColumnWidths(processedData);
        
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      }

      const finalFilename = this.generateFilename(filename, 'xlsx', includeTimestamp);
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      this.downloadBlob(blob, finalFilename);

      logger.info('Exportación multi-hoja completada', { filename: finalFilename, sheets: sheets.length });
    } catch (error) {
      logger.error('Error en exportación multi-hoja', error);
      throw error;
    }
  }
}

/**
 * Hook para usar el servicio de exportación en componentes React
 */
export function useExport() {
  const exportData = async <T extends Record<string, any>>(
    data: T[],
    options: ExportOptions
  ) => {
    try {
      await ExportService.exportData(data, options);
      return { success: true };
    } catch (error) {
      logger.error('Error en exportación', error);
      return { success: false, error };
    }
  };

  const exportWithColumns = async <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    options: Omit<ExportOptions, 'customHeaders'>
  ) => {
    try {
      await ExportService.exportWithColumns(data, columns, options);
      return { success: true };
    } catch (error) {
      logger.error('Error en exportación con columnas', error);
      return { success: false, error };
    }
  };

  const exportMultipleSheets = async (
    sheets: Array<{ name: string; data: any[]; customHeaders?: Record<string, string> }>,
    filename: string,
    includeTimestamp?: boolean
  ) => {
    try {
      await ExportService.exportMultipleSheets(sheets, filename, includeTimestamp);
      return { success: true };
    } catch (error) {
      logger.error('Error en exportación multi-hoja', error);
      return { success: false, error };
    }
  };

  return {
    exportData,
    exportWithColumns,
    exportMultipleSheets,
  };
}
