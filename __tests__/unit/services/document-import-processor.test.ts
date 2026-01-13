/**
 * Tests unitarios para el Document Import Processor Service
 * 
 * @module __tests__/unit/services/document-import-processor.test.ts
 */

import { describe, it, expect, vi } from 'vitest';
import {
  calculateChecksum,
  isSupportedFileType,
  getSupportedMimeTypes,
  getSupportedExtensions,
  isPdfFile,
  isWordFile,
  isImageFile,
  isExcelFile,
  isTextFile,
  isZipFile,
} from '@/lib/document-import-processor-service';

describe('Document Import Processor Service', () => {
  describe('calculateChecksum', () => {
    it('calcula checksum SHA256 correctamente', () => {
      const buffer = Buffer.from('Hello, World!');
      const checksum = calculateChecksum(buffer);
      
      // SHA256 de "Hello, World!"
      expect(checksum).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
    });

    it('retorna checksums diferentes para contenidos diferentes', () => {
      const buffer1 = Buffer.from('Content 1');
      const buffer2 = Buffer.from('Content 2');
      
      const checksum1 = calculateChecksum(buffer1);
      const checksum2 = calculateChecksum(buffer2);
      
      expect(checksum1).not.toBe(checksum2);
    });

    it('retorna el mismo checksum para el mismo contenido', () => {
      const buffer1 = Buffer.from('Same content');
      const buffer2 = Buffer.from('Same content');
      
      expect(calculateChecksum(buffer1)).toBe(calculateChecksum(buffer2));
    });
  });

  describe('isSupportedFileType', () => {
    it('retorna true para tipos de archivo soportados', () => {
      expect(isSupportedFileType('application/pdf')).toBe(true);
      expect(isSupportedFileType('image/jpeg')).toBe(true);
      expect(isSupportedFileType('application/zip')).toBe(true);
    });

    it('retorna false para tipos de archivo no soportados', () => {
      expect(isSupportedFileType('application/javascript')).toBe(false);
      expect(isSupportedFileType('video/mp4')).toBe(false);
      expect(isSupportedFileType('unknown/type')).toBe(false);
    });
  });

  describe('getSupportedMimeTypes', () => {
    it('retorna un array de tipos MIME soportados', () => {
      const mimeTypes = getSupportedMimeTypes();
      
      expect(Array.isArray(mimeTypes)).toBe(true);
      expect(mimeTypes.length).toBeGreaterThan(0);
      expect(mimeTypes).toContain('application/pdf');
      expect(mimeTypes).toContain('image/jpeg');
      expect(mimeTypes).toContain('application/zip');
    });
  });

  describe('getSupportedExtensions', () => {
    it('retorna string con extensiones soportadas', () => {
      const extensions = getSupportedExtensions();
      
      expect(typeof extensions).toBe('string');
      expect(extensions).toContain('pdf');
      expect(extensions).toContain('jpg');
      expect(extensions).toContain('zip');
    });
  });

  describe('File type checkers', () => {
    describe('isPdfFile', () => {
      it('detecta archivos PDF correctamente', () => {
        expect(isPdfFile('application/pdf')).toBe(true);
        expect(isPdfFile('image/jpeg')).toBe(false);
      });
    });

    describe('isWordFile', () => {
      it('detecta archivos Word correctamente', () => {
        expect(isWordFile('application/msword')).toBe(true);
        expect(isWordFile('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
        expect(isWordFile('application/pdf')).toBe(false);
      });
    });

    describe('isImageFile', () => {
      it('detecta archivos de imagen correctamente', () => {
        expect(isImageFile('image/jpeg')).toBe(true);
        expect(isImageFile('image/png')).toBe(true);
        expect(isImageFile('image/tiff')).toBe(true);
        expect(isImageFile('application/pdf')).toBe(false);
      });
    });

    describe('isExcelFile', () => {
      it('detecta archivos Excel correctamente', () => {
        expect(isExcelFile('application/vnd.ms-excel')).toBe(true);
        expect(isExcelFile('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
        expect(isExcelFile('text/csv')).toBe(true);
        expect(isExcelFile('application/pdf')).toBe(false);
      });
    });

    describe('isTextFile', () => {
      it('detecta archivos de texto correctamente', () => {
        expect(isTextFile('text/plain')).toBe(true);
        expect(isTextFile('text/csv')).toBe(true);
        expect(isTextFile('application/pdf')).toBe(false);
      });
    });

    describe('isZipFile', () => {
      it('detecta archivos ZIP correctamente', () => {
        expect(isZipFile('application/zip')).toBe(true);
        expect(isZipFile('application/x-zip-compressed')).toBe(true);
        expect(isZipFile('application/pdf')).toBe(false);
      });
    });
  });
});

describe('Supported Document Types', () => {
  it('soporta los principales formatos de documentos empresariales', () => {
    const mimeTypes = getSupportedMimeTypes();
    
    // Documentos
    expect(mimeTypes).toContain('application/pdf');
    expect(mimeTypes).toContain('application/msword');
    expect(mimeTypes).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
    // Hojas de cálculo
    expect(mimeTypes).toContain('application/vnd.ms-excel');
    expect(mimeTypes).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(mimeTypes).toContain('text/csv');
    
    // Imágenes
    expect(mimeTypes).toContain('image/jpeg');
    expect(mimeTypes).toContain('image/png');
    expect(mimeTypes).toContain('image/tiff');
    
    // Archivos comprimidos
    expect(mimeTypes).toContain('application/zip');
  });
});
