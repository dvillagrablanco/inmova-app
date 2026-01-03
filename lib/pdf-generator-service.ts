/**
 * Servicio de Generación de PDFs
 * 
 * Genera reportes PDF profesionales: contratos, propiedades, analytics.
 * 
 * @module PDFGeneratorService
 */

import PDFDocument from 'pdfkit';
import { prisma } from './db';
import logger from './logger';
import { Readable } from 'stream';

// ============================================================================
// TIPOS
// ============================================================================

export interface PDFOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  language?: string;
}

export interface ContractPDFData {
  contractId: string;
  property: {
    address: string;
    city: string;
    postalCode: string;
    rooms: number;
    bathrooms: number;
    squareMeters: number;
  };
  landlord: {
    name: string;
    dni: string;
    email: string;
    phone: string;
  };
  tenant: {
    name: string;
    dni: string;
    email: string;
    phone: string;
  };
  terms: {
    rentAmount: number;
    deposit: number;
    startDate: Date;
    endDate: Date;
    paymentDay: number;
    includedServices: string[];
  };
}

export interface PropertyReportData {
  property: any;
  occupancyHistory: any[];
  maintenanceHistory: any[];
  financialSummary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    occupancyRate: number;
  };
}

// ============================================================================
// GENERACIÓN DE CONTRATOS
// ============================================================================

/**
 * Genera PDF de contrato de arrendamiento
 */
export async function generateContractPDF(
  contractData: ContractPDFData,
  options: PDFOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: options.title || 'Contrato de Arrendamiento',
          Author: options.author || 'Inmova App',
          Subject: options.subject || 'Contrato de Arrendamiento de Vivienda',
          Keywords: options.keywords?.join(', ') || 'contrato, arrendamiento, alquiler',
        },
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('CONTRATO DE ARRENDAMIENTO DE VIVIENDA', { align: 'center' })
        .moveDown();

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Nº de Contrato: ${contractData.contractId}`, { align: 'center' })
        .moveDown(2);

      // Partes del contrato
      doc.fontSize(14).font('Helvetica-Bold').text('PARTES CONTRATANTES');
      doc.moveDown(0.5);

      // Arrendador
      doc.fontSize(12).font('Helvetica-Bold').text('ARRENDADOR (Propietario):');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre: ${contractData.landlord.name}`);
      doc.text(`DNI: ${contractData.landlord.dni}`);
      doc.text(`Email: ${contractData.landlord.email}`);
      doc.text(`Teléfono: ${contractData.landlord.phone}`);
      doc.moveDown();

      // Arrendatario
      doc.fontSize(12).font('Helvetica-Bold').text('ARRENDATARIO (Inquilino):');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre: ${contractData.tenant.name}`);
      doc.text(`DNI: ${contractData.tenant.dni}`);
      doc.text(`Email: ${contractData.tenant.email}`);
      doc.text(`Teléfono: ${contractData.tenant.phone}`);
      doc.moveDown(2);

      // Inmueble
      doc.fontSize(14).font('Helvetica-Bold').text('INMUEBLE ARRENDADO');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Dirección: ${contractData.property.address}`);
      doc.text(`Ciudad: ${contractData.property.city}, ${contractData.property.postalCode}`);
      doc.text(`Superficie: ${contractData.property.squareMeters}m²`);
      doc.text(`Habitaciones: ${contractData.property.rooms}`);
      doc.text(`Baños: ${contractData.property.bathrooms}`);
      doc.moveDown(2);

      // Condiciones económicas
      doc.fontSize(14).font('Helvetica-Bold').text('CONDICIONES ECONÓMICAS');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Renta mensual: ${contractData.terms.rentAmount}€`);
      doc.text(`Fianza: ${contractData.terms.deposit}€ (${contractData.terms.deposit / contractData.terms.rentAmount} meses)`);
      doc.text(`Día de pago: Día ${contractData.terms.paymentDay} de cada mes`);
      doc.text(`Servicios incluidos: ${contractData.terms.includedServices.join(', ')}`);
      doc.moveDown(2);

      // Vigencia
      doc.fontSize(14).font('Helvetica-Bold').text('VIGENCIA DEL CONTRATO');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Fecha de inicio: ${contractData.terms.startDate.toLocaleDateString('es-ES')}`);
      doc.text(`Fecha de finalización: ${contractData.terms.endDate.toLocaleDateString('es-ES')}`);
      const durationMonths = Math.round(
        (contractData.terms.endDate.getTime() - contractData.terms.startDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30)
      );
      doc.text(`Duración: ${durationMonths} meses`);
      doc.moveDown(2);

      // Cláusulas legales (simplificadas)
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('CLÁUSULAS');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');

      const clauses = [
        {
          title: 'PRIMERA: OBJETO',
          text: 'El ARRENDADOR cede en arrendamiento al ARRENDATARIO la vivienda descrita, para uso exclusivo de vivienda habitual.',
        },
        {
          title: 'SEGUNDA: DURACIÓN',
          text: `El contrato tendrá una duración de ${durationMonths} meses, desde el ${contractData.terms.startDate.toLocaleDateString('es-ES')} hasta el ${contractData.terms.endDate.toLocaleDateString('es-ES')}.`,
        },
        {
          title: 'TERCERA: RENTA',
          text: `El ARRENDATARIO se compromete a pagar una renta mensual de ${contractData.terms.rentAmount}€, que deberá ser abonada el día ${contractData.terms.paymentDay} de cada mes.`,
        },
        {
          title: 'CUARTA: FIANZA',
          text: `El ARRENDATARIO entrega en este acto la cantidad de ${contractData.terms.deposit}€ en concepto de fianza, que le será devuelta al finalizar el contrato.`,
        },
        {
          title: 'QUINTA: USO DE LA VIVIENDA',
          text: 'La vivienda se destinará exclusivamente a vivienda habitual del ARRENDATARIO, quedando prohibido el subarriendo.',
        },
        {
          title: 'SEXTA: CONSERVACIÓN',
          text: 'El ARRENDATARIO se obliga a conservar la vivienda en buen estado y realizar las reparaciones derivadas del uso ordinario.',
        },
      ];

      clauses.forEach((clause, index) => {
        doc.font('Helvetica-Bold').text(clause.title);
        doc.font('Helvetica').text(clause.text, { align: 'justify' });
        doc.moveDown();
      });

      // Firmas
      doc.addPage();
      doc.moveDown(5);

      doc.fontSize(12).font('Helvetica-Bold').text('FIRMAS', { align: 'center' });
      doc.moveDown(3);

      // Dos columnas para firmas
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const col1 = doc.page.margins.left;
      const col2 = doc.page.margins.left + pageWidth / 2;

      doc.fontSize(10).font('Helvetica');
      
      doc.text('EL ARRENDADOR', col1, doc.y, { width: pageWidth / 2 - 20, align: 'center' });
      doc.text('EL ARRENDATARIO', col2, doc.y, { width: pageWidth / 2 - 20, align: 'center' });

      doc.moveDown(5);

      const signatureY = doc.y;
      doc.text('_____________________', col1, signatureY, { width: pageWidth / 2 - 20, align: 'center' });
      doc.text('_____________________', col2, signatureY, { width: pageWidth / 2 - 20, align: 'center' });

      doc.moveDown(0.5);
      doc.text(contractData.landlord.name, col1, doc.y, { width: pageWidth / 2 - 20, align: 'center' });
      doc.text(contractData.tenant.name, col2, doc.y, { width: pageWidth / 2 - 20, align: 'center' });

      doc.moveDown();
      const dateY = doc.y;
      const today = new Date().toLocaleDateString('es-ES');
      doc.text(`Fecha: ${today}`, col1, dateY, { width: pageWidth / 2 - 20, align: 'center' });
      doc.text(`Fecha: ${today}`, col2, dateY, { width: pageWidth / 2 - 20, align: 'center' });

      // Footer
      doc.fontSize(8).font('Helvetica').text(
        'Documento generado por Inmova App - inmovaapp.com',
        doc.page.margins.left,
        doc.page.height - doc.page.margins.bottom,
        { align: 'center' }
      );

      doc.end();

    } catch (error: any) {
      logger.error('❌ Error generating contract PDF:', error);
      reject(error);
    }
  });
}

/**
 * Genera PDF de reporte de propiedad
 */
export async function generatePropertyReportPDF(
  data: PropertyReportData,
  options: PDFOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('REPORTE DE PROPIEDAD', { align: 'center' });
      doc.moveDown();

      // Property info
      doc.fontSize(14).font('Helvetica-Bold').text('INFORMACIÓN DE LA PROPIEDAD');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Dirección: ${data.property.direccion || data.property.address}`);
      doc.text(`Ciudad: ${data.property.ciudad || data.property.city}`);
      doc.text(`Superficie: ${data.property.superficie}m²`);
      doc.text(`Habitaciones: ${data.property.habitaciones}`);
      doc.text(`Estado: ${data.property.estado}`);
      doc.moveDown(2);

      // Financial summary
      doc.fontSize(14).font('Helvetica-Bold').text('RESUMEN FINANCIERO');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Ingresos totales: ${data.financialSummary.totalIncome}€`);
      doc.text(`Gastos totales: ${data.financialSummary.totalExpenses}€`);
      doc.text(`Beneficio neto: ${data.financialSummary.netIncome}€`);
      doc.text(`Tasa de ocupación: ${data.financialSummary.occupancyRate}%`);
      doc.moveDown(2);

      // Occupancy history
      if (data.occupancyHistory.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('HISTORIAL DE OCUPACIÓN');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        data.occupancyHistory.forEach((entry: any) => {
          doc.text(
            `${entry.tenant} - ${new Date(entry.startDate).toLocaleDateString('es-ES')} a ${new Date(entry.endDate).toLocaleDateString('es-ES')}`
          );
        });

        doc.moveDown(2);
      }

      // Maintenance history
      if (data.maintenanceHistory.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('HISTORIAL DE MANTENIMIENTO');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        data.maintenanceHistory.slice(0, 10).forEach((entry: any) => {
          doc.text(
            `${new Date(entry.date).toLocaleDateString('es-ES')} - ${entry.description} (${entry.cost}€)`
          );
        });
      }

      doc.end();

    } catch (error: any) {
      logger.error('❌ Error generating property report PDF:', error);
      reject(error);
    }
  });
}

/**
 * Genera PDF de reporte de analytics
 */
export async function generateAnalyticsReportPDF(
  metrics: any,
  period: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('REPORTE DE ANALYTICS', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`Periodo: ${period}`, { align: 'center' });
      doc.moveDown(2);

      // Usage metrics
      doc.fontSize(14).font('Helvetica-Bold').text('MÉTRICAS DE USO');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Usuarios activos: ${metrics.users.activeUsers}`);
      doc.text(`Propiedades totales: ${metrics.properties.totalProperties}`);
      doc.text(`Propiedades rentadas: ${metrics.properties.rentedProperties}`);
      doc.text(`Valoraciones realizadas: ${metrics.features.valuationsCount}`);
      doc.text(`Matches generados: ${metrics.features.matchesCount}`);
      doc.text(`Incidencias reportadas: ${metrics.features.incidentsCount}`);
      doc.moveDown(2);

      // AI costs
      if (metrics.aiCosts) {
        doc.fontSize(14).font('Helvetica-Bold').text('COSTOS DE IA');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Costo total: ${metrics.aiCosts.total}€`);
        doc.text(`Requests totales: ${metrics.aiCosts.totalRequests}`);
        doc.text(`Costo promedio/request: ${metrics.aiCosts.avgCostPerRequest}€`);
        doc.moveDown();
        doc.text('Desglose por feature:');
        doc.text(`  - Valoraciones: ${metrics.aiCosts.byFeature.valuations}€`);
        doc.text(`  - Matching: ${metrics.aiCosts.byFeature.matching}€`);
        doc.text(`  - Incidencias: ${metrics.aiCosts.byFeature.incidents}€`);
        doc.text(`  - Marketing: ${metrics.aiCosts.byFeature.marketing}€`);
      }

      doc.end();

    } catch (error: any) {
      logger.error('❌ Error generating analytics report PDF:', error);
      reject(error);
    }
  });
}

export default {
  generateContractPDF,
  generatePropertyReportPDF,
  generateAnalyticsReportPDF,
};
