/**
 * Utilidades para exportar datos en diferentes formatos
 */

import { format } from 'date-fns';

interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

interface ExportOptions {
  filename: string;
  columns: ExportColumn[];
  data: any[];
  title?: string;
  subtitle?: string;
}

/**
 * Exporta datos a CSV
 */
export function exportToCSV(options: ExportOptions): void {
  const { filename, columns, data } = options;

  // Crear encabezados
  const headers = columns.map((col) => col.label).join(',');

  // Crear filas
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let value = item[col.key];
        if (col.format) {
          value = col.format(value);
        }
        // Escapar valores que contienen comas, comillas o saltos de línea
        if (
          typeof value === 'string' &&
          (value.includes(',') || value.includes('"') || value.includes('\n'))
        ) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      })
      .join(',');
  });

  // Combinar todo
  const csvContent = [headers, ...rows].join('\n');

  // Descargar archivo
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Exporta datos a Excel (formato HTML que Excel puede abrir)
 */
export function exportToExcel(options: ExportOptions): void {
  const { filename, columns, data, title, subtitle } = options;

  let html = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #4F46E5; color: white; padding: 8px; text-align: left; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          h1 { color: #4F46E5; }
          h2 { color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
  `;

  if (title) {
    html += `<h1>${title}</h1>`;
  }
  if (subtitle) {
    html += `<h2>${subtitle}</h2>`;
  }

  html += '<table>';

  // Encabezados
  html += '<thead><tr>';
  columns.forEach((col) => {
    html += `<th>${col.label}</th>`;
  });
  html += '</tr></thead>';

  // Datos
  html += '<tbody>';
  data.forEach((item) => {
    html += '<tr>';
    columns.forEach((col) => {
      let value = item[col.key];
      if (col.format) {
        value = col.format(value);
      }
      html += `<td>${value ?? ''}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  html += '</body></html>';

  // Descargar archivo
  downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel');
}

/**
 * Exporta datos a PDF (implementación básica usando print)
 */
export function exportToPDF(options: ExportOptions): void {
  const { filename, columns, data, title, subtitle } = options;

  // Crear ventana nueva con el contenido
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) {
    alert('Por favor, permite ventanas emergentes para exportar a PDF');
    return;
  }

  let html = `
    <html>
      <head>
        <title>${filename}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background-color: #4F46E5; color: white; padding: 8px; text-align: left; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; font-size: 12px; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          h1 { color: #4F46E5; margin-bottom: 5px; }
          h2 { color: #666; font-size: 14px; margin-top: 0; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <button onclick="window.print(); setTimeout(() => window.close(), 100);" style="padding: 10px 20px; background-color: #4F46E5; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 10px;">
          Imprimir / Guardar como PDF
        </button>
  `;

  if (title) {
    html += `<h1>${title}</h1>`;
  }
  if (subtitle) {
    html += `<h2>${subtitle}</h2>`;
  }

  html += '<table>';

  // Encabezados
  html += '<thead><tr>';
  columns.forEach((col) => {
    html += `<th>${col.label}</th>`;
  });
  html += '</tr></thead>';

  // Datos
  html += '<tbody>';
  data.forEach((item) => {
    html += '<tr>';
    columns.forEach((col) => {
      let value = item[col.key];
      if (col.format) {
        value = col.format(value);
      }
      html += `<td>${value ?? ''}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  html += '</body></html>';

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Función auxiliar para descargar archivos
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formateadores comunes
 */
export const formatters = {
  date: (value: any) => {
    if (!value) return '';
    try {
      return format(new Date(value), 'dd/MM/yyyy');
    } catch {
      return String(value);
    }
  },
  datetime: (value: any) => {
    if (!value) return '';
    try {
      return format(new Date(value), 'dd/MM/yyyy HH:mm');
    } catch {
      return String(value);
    }
  },
  currency: (value: any) => {
    if (value === null || value === undefined) return '€0.00';
    return `€${Number(value).toFixed(2)}`;
  },
  percentage: (value: any) => {
    if (value === null || value === undefined) return '0%';
    return `${Number(value).toFixed(1)}%`;
  },
  boolean: (value: any) => {
    return value ? 'Sí' : 'No';
  },
  phone: (value: any) => {
    if (!value) return '';
    return String(value).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  },
};
