/**
 * Common types for PDF services
 */

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: string | (() => string);
  footer?: string | (() => string);
  watermark?: {
    text: string;
    opacity?: number;
    rotation?: number;
  };
}

export interface PDFTemplate {
  id: string;
  name: string;
  category: 'contract' | 'invoice' | 'report' | 'certificate' | 'other';
  html: string;
  variables: string[];
  styles?: string;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
}

export interface PDFParseResult {
  text: string;
  metadata: PDFMetadata;
  pages: number;
  extracted: {
    tables?: any[];
    images?: Buffer[];
    forms?: Record<string, any>;
  };
}
