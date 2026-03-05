import { describe, it, expect } from 'vitest';
import { detectFileType, validateFile } from '@/lib/file-validation';

describe('file-validation', () => {
  describe('detectFileType', () => {
    it('detects PDF', () => {
      const buf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
      const result = detectFileType(buf);
      expect(result?.mime).toBe('application/pdf');
      expect(result?.ext).toBe('pdf');
    });

    it('detects JPEG', () => {
      const buf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const result = detectFileType(buf);
      expect(result?.mime).toBe('image/jpeg');
    });

    it('detects PNG', () => {
      const buf = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);
      const result = detectFileType(buf);
      expect(result?.mime).toBe('image/png');
    });

    it('detects ZIP/XLSX', () => {
      const buf = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00]);
      const result = detectFileType(buf);
      expect(result?.mime).toContain('zip');
    });

    it('detects CSV', () => {
      const buf = Buffer.from('Name,Email,Phone\nJohn,john@test.com,555\n');
      const result = detectFileType(buf);
      expect(result?.mime).toBe('text/csv');
    });

    it('returns null for empty buffer', () => {
      const result = detectFileType(Buffer.from([]));
      expect(result).toBeNull();
    });
  });

  describe('validateFile', () => {
    it('validates a PDF file', () => {
      const buf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, ...Array(100).fill(0x20)]);
      const result = validateFile(buf, 'test.pdf', 'document');
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe('application/pdf');
    });

    it('rejects image in document context', () => {
      const buf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...Array(100).fill(0x20)]);
      const result = validateFile(buf, 'fake.pdf', 'document');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no permitido');
    });

    it('detects dangerous content in text files', () => {
      const buf = Buffer.from('Name,Value\n<script>alert(1)</script>,test\n');
      const result = validateFile(buf, 'data.csv', 'document');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('peligroso');
    });

    it('rejects oversized files', () => {
      const buf = Buffer.alloc(60 * 1024 * 1024); // 60MB
      buf[0] = 0x25; buf[1] = 0x50; buf[2] = 0x44; buf[3] = 0x46; // PDF header
      const result = validateFile(buf, 'big.pdf', 'document');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('grande');
    });
  });
});
