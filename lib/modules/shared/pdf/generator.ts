/**
 * PDF Generator Service
 * Handles PDF generation from HTML templates
 */

import { PDFGenerationOptions, PDFMetadata } from './types';
import logger from '@/lib/logger';
import PDFDocument from 'pdfkit';

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getHeaderFooterValue(value?: string | (() => string)): string | undefined {
  if (!value) return undefined;
  return typeof value === 'function' ? value() : value;
}

export interface PDFGenerationResult {
  success: boolean;
  buffer?: Buffer;
  filePath?: string;
  error?: string;
  size?: number;
}

/**
 * Generate PDF from HTML
 */
export async function generatePDFFromHTML(
  html: string,
  options?: PDFGenerationOptions,
  metadata?: PDFMetadata
): Promise<PDFGenerationResult> {
  try {
    logger.info('Generating PDF from HTML', {
      htmlLength: html.length,
      format: options?.format || 'A4',
    });
    const doc = new PDFDocument({
      size: options?.format || 'A4',
      layout: options?.orientation || 'portrait',
      margins: options?.margins || { top: 40, right: 40, bottom: 40, left: 40 },
    });

    if (metadata) {
      doc.info.Title = metadata.title;
      doc.info.Author = metadata.author;
      doc.info.Subject = metadata.subject;
      if (metadata.keywords) {
        doc.info.Keywords = metadata.keywords.join(', ');
      }
      doc.info.Creator = metadata.creator;
      doc.info.Producer = metadata.producer;
      doc.info.CreationDate = metadata.creationDate || new Date();
    }

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const header = getHeaderFooterValue(options?.header);
    if (header) {
      doc.fontSize(10).text(header, { align: 'center' });
      doc.moveDown(1);
    }

    const content = stripHtml(html);
    doc.fontSize(12).text(content || 'Contenido vacío');

    const footer = getHeaderFooterValue(options?.footer);
    if (footer) {
      doc.moveDown(2);
      doc.fontSize(10).text(footer, { align: 'center' });
    }

    if (options?.watermark?.text) {
      doc.save();
      doc.opacity(options.watermark.opacity ?? 0.1);
      doc.rotate(options.watermark.rotation ?? -45, { origin: [200, 300] });
      doc.fontSize(48).text(options.watermark.text, 100, 250, { align: 'center' });
      doc.restore();
    }

    doc.end();

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));
    });

    return {
      success: true,
      buffer,
      size: buffer.length,
    };
  } catch (error: any) {
    logger.error('Error generating PDF:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate PDF from template
 */
export async function generatePDFFromTemplate(
  templateId: string,
  data: Record<string, any>,
  options?: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  try {
    // TODO: Load template from database or file system
    // TODO: Render template with data (use handlebars, ejs, etc.)
    
    const html = `<html><body><h1>Template ${templateId}</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
    
    return generatePDFFromHTML(html, options);
  } catch (error: any) {
    logger.error('Error generating PDF from template:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Merge multiple PDFs
 */
export async function mergePDFs(pdfBuffers: Buffer[]): Promise<PDFGenerationResult> {
  try {
    logger.info('Merging PDFs', { count: pdfBuffers.length });
    return {
      success: false,
      error: 'Merge de PDFs no implementado',
    };
  } catch (error: any) {
    logger.error('Error merging PDFs:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Add watermark to PDF
 */
export async function addWatermarkToPDF(
  pdfBuffer: Buffer,
  watermarkText: string,
  options?: { opacity?: number; rotation?: number }
): Promise<PDFGenerationResult> {
  try {
    logger.info('Adding watermark to PDF', { watermarkText });
    return {
      success: false,
      error: 'Marca de agua no implementada',
    };
  } catch (error: any) {
    logger.error('Error adding watermark to PDF:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
