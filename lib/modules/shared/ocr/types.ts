/**
 * Common types for OCR services
 */

export interface OCROptions {
  language?: string | string[];
  detectOrientation?: boolean;
  preprocessImage?: boolean;
  confidence?: 'low' | 'medium' | 'high';
  outputFormat?: 'text' | 'json' | 'hocr';
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks?: OCRBlock[];
  metadata?: {
    language?: string;
    orientation?: number;
    processingTime?: number;
  };
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  type?: 'word' | 'line' | 'paragraph' | 'block';
}

export interface DocumentField {
  key: string;
  value: string;
  confidence: number;
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean';
}

export interface DocumentOCRResult extends OCRResult {
  documentType?: 'invoice' | 'receipt' | 'contract' | 'id' | 'passport' | 'other';
  fields?: DocumentField[];
  tables?: any[];
}
