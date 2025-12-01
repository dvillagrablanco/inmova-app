import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  sanitizeEmail,
  sanitizeUrl,
  sanitizePhone,
  sanitizeAlphanumeric,
  sanitizeFileName,
  sanitizeHtml,
} from '@/lib/security/sanitize';

describe('Sanitization Functions', () => {
  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const input = 'Hello <script>alert("XSS")</script>';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello scriptalert(XSS)/script');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should limit length', () => {
      const input = 'a'.repeat(15000);
      const result = sanitizeInput(input);
      expect(result.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert to lowercase', () => {
      const email = 'USER@EXAMPLE.COM';
      const result = sanitizeEmail(email);
      expect(result).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const email = '  user@example.com  ';
      const result = sanitizeEmail(email);
      expect(result).toBe('user@example.com');
    });

    it('should limit length to 254 characters', () => {
      const email = 'a'.repeat(300) + '@example.com';
      const result = sanitizeEmail(email);
      expect(result.length).toBeLessThanOrEqual(254);
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid http URLs', () => {
      const url = 'http://example.com';
      const result = sanitizeUrl(url);
      expect(result).toBe('http://example.com/');
    });

    it('should allow valid https URLs', () => {
      const url = 'https://example.com';
      const result = sanitizeUrl(url);
      expect(result).toBe('https://example.com/');
    });

    it('should reject javascript: URLs', () => {
      const url = 'javascript:alert("XSS")';
      const result = sanitizeUrl(url);
      expect(result).toBe('');
    });

    it('should reject file: URLs', () => {
      const url = 'file:///etc/passwd';
      const result = sanitizeUrl(url);
      expect(result).toBe('');
    });

    it('should handle invalid URLs', () => {
      const url = 'not a valid url';
      const result = sanitizeUrl(url);
      expect(result).toBe('');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep numeric characters and common phone symbols', () => {
      const phone = '+1 (555) 123-4567';
      const result = sanitizePhone(phone);
      expect(result).toBe('+1 (555) 123-4567');
    });

    it('should remove letters and special characters', () => {
      const phone = 'Call me at 555-ABCD';
      const result = sanitizePhone(phone);
      expect(result).toBe('555-');
    });

    it('should limit length to 20 characters', () => {
      const phone = '1'.repeat(50);
      const result = sanitizePhone(phone);
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });

  describe('sanitizeAlphanumeric', () => {
    it('should keep only alphanumeric characters and spaces', () => {
      const input = 'Hello123! @#$ World';
      const result = sanitizeAlphanumeric(input);
      expect(result).toBe('Hello123  World');
    });

    it('should remove special characters', () => {
      const input = 'Test@#$%^&*()';
      const result = sanitizeAlphanumeric(input);
      expect(result).toBe('Test');
    });

    it('should limit length to 1000 characters', () => {
      const input = 'a'.repeat(1500);
      const result = sanitizeAlphanumeric(input);
      expect(result.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('sanitizeFileName', () => {
    it('should replace special characters with underscores', () => {
      const fileName = 'my file (1).txt';
      const result = sanitizeFileName(fileName);
      expect(result).toBe('my_file__1_.txt');
    });

    it('should prevent path traversal', () => {
      const fileName = '../../../etc/passwd';
      const result = sanitizeFileName(fileName);
      expect(result).not.toContain('..');
      expect(result).toBe('_____etc_passwd');
    });

    it('should not start with a dot', () => {
      const fileName = '.hidden-file';
      const result = sanitizeFileName(fileName);
      expect(result).toBe('_hidden-file');
    });

    it('should limit length to 255 characters', () => {
      const fileName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(fileName);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeHtml(html);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should remove script tags', () => {
      const html = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should remove dangerous attributes', () => {
      const html = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('javascript:');
    });

    it('should allow safe link hrefs', () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtml(html);
      expect(result).toContain('href="https://example.com"');
    });
  });
});
