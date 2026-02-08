/**
 * Document OCR Service
 * Specialized OCR for structured documents (invoices, contracts, IDs, etc.)
 */

import { OCROptions, DocumentOCRResult, DocumentField } from './types';
import logger from '@/lib/logger';
import {
  processDocument,
  extractDNIData,
  extractContractData,
} from '@/lib/ocr-service';

function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('utf8') === '%PDF') {
    return 'application/pdf';
  }
  if (buffer.length >= 4) {
    const signature = buffer.subarray(0, 4).toString('hex').toLowerCase();
    if (signature.startsWith('ffd8')) return 'image/jpeg';
    if (signature === '89504e47') return 'image/png';
    if (signature === '47494638') return 'image/gif';
  }
  return null;
}

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
    const mimeType = detectMimeType(documentBuffer);
    if (!mimeType) {
      throw new Error('Tipo de archivo no soportado para OCR');
    }

    const ocrResult = await processDocument(documentBuffer, mimeType);

    const fields: DocumentField[] = [];
    if (documentType === 'id' || documentType === 'passport') {
      const dniData = extractDNIData(ocrResult.text);
      Object.entries(dniData).forEach(([key, value]) => {
        if (!value) return;
        fields.push({
          key,
          value: String(value),
          confidence: Math.round(ocrResult.confidence) / 100,
          type: 'text',
        });
      });
    }

    if (documentType === 'contract') {
      const contractData = extractContractData(ocrResult.text);
      Object.entries(contractData).forEach(([key, value]) => {
        if (!value) return;
        fields.push({
          key,
          value: String(value),
          confidence: Math.round(ocrResult.confidence) / 100,
          type: typeof value === 'number' ? 'number' : 'text',
        });
      });
    }

    return {
      text: ocrResult.text,
      confidence: ocrResult.confidence / 100,
      documentType: documentType || 'other',
      fields,
      metadata: {
        language: ocrResult.language,
        processingTime: ocrResult.processingTime,
      },
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
    const fields = result.fields || [];

    if (!fields.length && result.text) {
      const totalMatch = result.text.match(/total\s*[:\-]?\s*(\d+[.,]?\d*)/i);
      if (totalMatch) {
        fields.push({
          key: 'total',
          value: totalMatch[1],
          confidence: result.confidence || 0.7,
          type: 'currency',
        });
      }
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
    return result.fields || [];
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

    const result = await performDocumentOCR(documentBuffer);
    const lines = result.text.split('\n').map((line) => line.trim()).filter(Boolean);
    const tableLines = lines.filter((line) => line.includes('|'));
    if (tableLines.length === 0) {
      return [];
    }

    return tableLines.map((line) => line.split('|').map((cell) => cell.trim()));
  } catch (error: any) {
    logger.error('Error extracting tables:', error);
    return [];
  }
}
