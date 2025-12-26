/**
 * PDF Templates
 * Pre-defined templates for common documents
 */

import { PDFTemplate } from '../types';

/**
 * Contract template
 */
export const contractTemplate: PDFTemplate = {
  id: 'contract',
  name: 'Contrato de Arrendamiento',
  category: 'contract',
  variables: [
    'landlordName',
    'tenantName',
    'propertyAddress',
    'rentAmount',
    'startDate',
    'endDate',
  ],
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { text-align: center; }
          .section { margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>Contrato de Arrendamiento</h1>
        <div class="section">
          <p><strong>Arrendador:</strong> {{landlordName}}</p>
          <p><strong>Arrendatario:</strong> {{tenantName}}</p>
          <p><strong>Propiedad:</strong> {{propertyAddress}}</p>
          <p><strong>Renta Mensual:</strong> {{rentAmount}}</p>
          <p><strong>Período:</strong> {{startDate}} - {{endDate}}</p>
        </div>
      </body>
    </html>
  `,
};

/**
 * Invoice template
 */
export const invoiceTemplate: PDFTemplate = {
  id: 'invoice',
  name: 'Factura',
  category: 'invoice',
  variables: ['invoiceNumber', 'date', 'companyName', 'clientName', 'items', 'total'],
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Factura #{{invoiceNumber}}</h1>
        <p><strong>Fecha:</strong> {{date}}</p>
        <p><strong>De:</strong> {{companyName}}</p>
        <p><strong>Para:</strong> {{clientName}}</p>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td>{{description}}</td>
              <td>{{quantity}}</td>
              <td>{{price}}</td>
              <td>{{total}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
        <p><strong>Total:</strong> {{total}}</p>
      </body>
    </html>
  `,
};

/**
 * Report template
 */
export const reportTemplate: PDFTemplate = {
  id: 'report',
  name: 'Informe',
  category: 'report',
  variables: ['title', 'date', 'author', 'content', 'summary'],
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .metadata { font-size: 12px; color: #666; }
          .content { margin: 30px 0; }
        </style>
      </head>
      <body>
        <h1>{{title}}</h1>
        <div class="metadata">
          <p><strong>Fecha:</strong> {{date}}</p>
          <p><strong>Autor:</strong> {{author}}</p>
        </div>
        <div class="content">
          {{content}}
        </div>
        {{#if summary}}
        <div class="summary">
          <h2>Resumen</h2>
          <p>{{summary}}</p>
        </div>
        {{/if}}
      </body>
    </html>
  `,
};

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): PDFTemplate | undefined {
  const templates: Record<string, PDFTemplate> = {
    contract: contractTemplate,
    invoice: invoiceTemplate,
    report: reportTemplate,
  };

  return templates[templateId];
}

/**
 * List all available templates
 */
export function listTemplates(): PDFTemplate[] {
  return [contractTemplate, invoiceTemplate, reportTemplate];
}
