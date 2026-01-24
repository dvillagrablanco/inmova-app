/**
 * Document OCR Service
 * Specialized OCR for structured documents (invoices, contracts, IDs, etc.)
 */

import { OCROptions, DocumentOCRResult, DocumentField } from './types';
import logger from '@/lib/logger';
import { z } from 'zod';
import { fetchJson } from '@/lib/integrations/http-client';

const documentResponseSchema = z.object({
  text: z.string(),
  confidence: z.number(),
  documentType: z.string().optional(),
  fields: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
        confidence: z.number(),
        type: z.enum(['text', 'number', 'date', 'currency', 'boolean']),
      })
    )
    .optional(),
  tables: z.array(z.any()).optional(),
  metadata: z
    .object({
      language: z.string().optional(),
      orientation: z.number().optional(),
      processingTime: z.number().optional(),
    })
    .optional(),
});

/**
 * Perform OCR on a structured document
 */
export async function performDocumentOCR(
  documentBuffer: Buffer,
  documentType?: 'invoice' | 'receipt' | 'contract' | 'id' | 'passport',
  options?: OCROptions
): Promise<DocumentOCRResult> {
  try {
    logger.info('Performing document OCR', {
      size: documentBuffer.length,
      type: documentType || 'auto',
    });

    const ocrApiUrl = process.env.OCR_API_URL;
    if (!ocrApiUrl) {
      throw new Error('OCR_API_URL no configurado');
    }

    const { data } = await fetchJson<z.infer<typeof documentResponseSchema>>(ocrApiUrl, {
      method: 'POST',
      headers: process.env.OCR_API_KEY
        ? { Authorization: `Bearer ${process.env.OCR_API_KEY}` }
        : undefined,
      body: {
        type: 'document',
        documentType,
        contentBase64: documentBuffer.toString('base64'),
        options,
      },
      timeoutMs: 30_000,
      circuitKey: 'ocr-document',
    });

    const parsed = documentResponseSchema.parse(data);

    return {
      text: parsed.text,
      confidence: parsed.confidence,
      documentType: (parsed.documentType || documentType || 'other') as DocumentOCRResult['documentType'],
      fields: parsed.fields || [],
      tables: parsed.tables || [],
      metadata: parsed.metadata,
    };
  } catch (error: any) {
    logger.error('Error performing document OCR:', error);
    throw error;
  }
}

/**
 * Extract specific fields from an invoice
 */
export async function extractInvoiceFields(
  invoiceBuffer: Buffer
): Promise<DocumentField[]> {
  try {
    logger.info('Extracting invoice fields');

    const result = await performDocumentOCR(invoiceBuffer, 'invoice');
    if (result.fields && result.fields.length > 0) {
      return result.fields;
    }

    const fields: DocumentField[] = [];
    const text = result.text || '';

    const invoiceNumber = text.match(/factura\s*(?:n[oº]?|num(?:ero)?)\s*[:#]?\s*([A-Z0-9-]+)/i);
    if (invoiceNumber?.[1]) {
      fields.push({ key: 'invoice_number', value: invoiceNumber[1], confidence: 0.6, type: 'text' });
    }

    const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch?.[1]) {
      fields.push({ key: 'date', value: dateMatch[1], confidence: 0.6, type: 'date' });
    }

    const totalMatch = text.match(/total\s*[:€]?\s*([0-9.,]+)/i);
    if (totalMatch?.[1]) {
      fields.push({ key: 'total', value: totalMatch[1], confidence: 0.6, type: 'currency' });
    }

    return fields;
  } catch (error: any) {
    logger.error('Error extracting invoice fields:', error);
    return [];
  }
}

/**
 * Extract specific fields from an ID document
 */
export async function extractIDFields(
  idBuffer: Buffer
): Promise<DocumentField[]> {
  try {
    logger.info('Extracting ID fields');

    const result = await performDocumentOCR(idBuffer, 'id');
    if (result.fields && result.fields.length > 0) {
      return result.fields;
    }

    const fields: DocumentField[] = [];
    const text = result.text || '';

    const dniMatch = text.match(/(dni|nif)\s*[:#]?\s*([0-9A-Z-]+)/i);
    if (dniMatch?.[2]) {
      fields.push({ key: 'document_number', value: dniMatch[2], confidence: 0.6, type: 'text' });
    }

    const nameMatch = text.match(/nombre\s*[:#]?\s*([A-ZÁÉÍÓÚÑ\s]+)/i);
    if (nameMatch?.[1]) {
      fields.push({ key: 'name', value: nameMatch[1].trim(), confidence: 0.5, type: 'text' });
    }

    const birthMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (birthMatch?.[1]) {
      fields.push({ key: 'date_of_birth', value: birthMatch[1], confidence: 0.5, type: 'date' });
    }

    return fields;
  } catch (error: any) {
    logger.error('Error extracting ID fields:', error);
    return [];
  }
}

/**
 * Extract tables from a document
 */
export async function extractDocumentTables(
  documentBuffer: Buffer
): Promise<any[]> {
  try {
    logger.info('Extracting tables from document');
    const result = await performDocumentOCR(documentBuffer, 'invoice');
    return result.tables || [];
  } catch (error: any) {
    logger.error('Error extracting tables:', error);
    return [];
  }
}
