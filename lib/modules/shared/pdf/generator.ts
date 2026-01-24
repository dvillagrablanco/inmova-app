/**
 * PDF Generator Service
 * Handles PDF generation from HTML templates
 */

import { PDFGenerationOptions, PDFMetadata } from './types';
import logger from '@/lib/logger';
import PDFDocument from 'pdfkit';
import { PDFDocument as PDFLibDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

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

    const margins = options?.margins || { top: 40, right: 40, bottom: 40, left: 40 };
    const doc = new PDFDocument({
      size: options?.format || 'A4',
      layout: options?.orientation === 'landscape' ? 'landscape' : 'portrait',
      margins,
    });

    if (metadata) {
      doc.info.Title = metadata.title;
      doc.info.Author = metadata.author;
      doc.info.Subject = metadata.subject;
      doc.info.Keywords = metadata.keywords?.join(', ');
      doc.info.Creator = metadata.creator;
      doc.info.Producer = metadata.producer;
      if (metadata.creationDate) doc.info.CreationDate = metadata.creationDate;
    }

    const textContent = html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (options?.header) {
      const headerText = typeof options.header === 'function' ? options.header() : options.header;
      doc.fontSize(10).text(headerText, { align: 'center' }).moveDown();
    }

    doc.fontSize(12).text(textContent || ' ', {
      align: 'left',
    });

    if (options?.footer) {
      const footerText = typeof options.footer === 'function' ? options.footer() : options.footer;
      doc.moveDown().fontSize(10).text(footerText, { align: 'center' });
    }

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error) => reject(error));
      doc.end();
    });

    if (options?.watermark?.text) {
      const watermarked = await addWatermarkToPDF(buffer, options.watermark.text, {
        opacity: options.watermark.opacity,
        rotation: options.watermark.rotation,
      });

      if (watermarked.success && watermarked.buffer) {
        return {
          success: true,
          buffer: watermarked.buffer,
          size: watermarked.buffer.length,
        };
      }
    }

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

    const mergedPdf = await PDFLibDocument.create();

    for (const pdfBuffer of pdfBuffers) {
      const pdf = await PDFLibDocument.load(pdfBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    const mergedBuffer = Buffer.from(mergedBytes);

    return {
      success: true,
      buffer: mergedBuffer,
      size: mergedBuffer.length,
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

    const pdfDoc = await PDFLibDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const opacity = options?.opacity ?? 0.2;
    const rotation = options?.rotation ?? 45;

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      const fontSize = Math.min(width, height) / 6;
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const x = (width - textWidth) / 2;
      const y = height / 2;

      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.7, 0.7, 0.7),
        rotate: degrees(rotation),
        opacity,
      });
    });

    const bytes = await pdfDoc.save();
    const updatedBuffer = Buffer.from(bytes);

    return {
      success: true,
      buffer: updatedBuffer,
      size: updatedBuffer.length,
    };
  } catch (error: any) {
    logger.error('Error adding watermark to PDF:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
