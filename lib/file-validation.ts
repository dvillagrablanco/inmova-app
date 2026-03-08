/**
 * File Validation Service
 * 
 * Validates uploaded files by checking magic bytes (file signatures)
 * instead of relying on Content-Type headers or file extensions.
 * 
 * OWASP A08:2021 – Software and Data Integrity Failures
 */

import logger from '@/lib/logger';

// File signatures (magic bytes)
const FILE_SIGNATURES: { mime: string; ext: string; bytes: number[]; offset?: number }[] = [
  // Images
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif', ext: 'gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF....WEBP
  { mime: 'image/svg+xml', ext: 'svg', bytes: [0x3C, 0x73, 0x76, 0x67] }, // <svg
  
  // Documents
  { mime: 'application/pdf', ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  
  // Office (ZIP-based: xlsx, docx, pptx)
  { mime: 'application/zip', ext: 'zip', bytes: [0x50, 0x4B, 0x03, 0x04] }, // PK
  { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx', bytes: [0x50, 0x4B, 0x03, 0x04] },
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx', bytes: [0x50, 0x4B, 0x03, 0x04] },
  
  // Legacy Office
  { mime: 'application/vnd.ms-excel', ext: 'xls', bytes: [0xD0, 0xCF, 0x11, 0xE0] },
  
  // CSV/Text (starts with printable ASCII)
  { mime: 'text/csv', ext: 'csv', bytes: [] }, // No signature, validated by content
  { mime: 'text/plain', ext: 'txt', bytes: [] },
];

// Allowed MIME types by context
export const ALLOWED_TYPES = {
  document: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  proposal: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'image/jpeg', 'image/png'],
  any: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'application/zip', 'application/x-rar-compressed', 'application/vnd.rar', 'application/x-7z-compressed'],
};

export const MAX_FILE_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,    // 10MB
  document: 50 * 1024 * 1024, // 50MB
  proposal: 25 * 1024 * 1024, // 25MB
  any: 50 * 1024 * 1024,      // 50MB
};

interface ValidationResult {
  valid: boolean;
  detectedMime: string | null;
  detectedExt: string | null;
  error?: string;
}

/**
 * Detect file type from buffer using magic bytes
 */
export function detectFileType(buffer: Buffer | Uint8Array): { mime: string; ext: string } | null {
  if (!buffer || buffer.length < 4) return null;

  for (const sig of FILE_SIGNATURES) {
    if (sig.bytes.length === 0) continue; // Skip text types
    
    const offset = sig.offset || 0;
    let match = true;
    
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[offset + i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    
    if (match) {
      // Special case: WEBP needs additional check
      if (sig.ext === 'webp') {
        if (buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
          return { mime: sig.mime, ext: sig.ext };
        }
        continue;
      }
      return { mime: sig.mime, ext: sig.ext };
    }
  }

  // Check if it's text/CSV (printable ASCII)
  const isTextual = Array.from(buffer.slice(0, 512)).every(b => 
    (b >= 0x20 && b <= 0x7E) || b === 0x0A || b === 0x0D || b === 0x09 || b === 0xC3 || b === 0xC2 // UTF-8 common chars
  );
  if (isTextual) {
    const header = Buffer.from(buffer.slice(0, 200)).toString('utf-8');
    if (header.includes(',') || header.includes(';') || header.includes('\t')) {
      return { mime: 'text/csv', ext: 'csv' };
    }
    return { mime: 'text/plain', ext: 'txt' };
  }

  return null;
}

/**
 * Validate a file upload
 * @param buffer - File contents as Buffer
 * @param declaredName - Original filename
 * @param context - Upload context ('document', 'image', 'proposal', 'any')
 */
export function validateFile(
  buffer: Buffer | Uint8Array,
  declaredName: string,
  context: keyof typeof ALLOWED_TYPES = 'any'
): ValidationResult {
  // 1. Check size
  const maxSize = MAX_FILE_SIZES[context] || MAX_FILE_SIZES.any;
  if (buffer.length > maxSize) {
    return {
      valid: false,
      detectedMime: null,
      detectedExt: null,
      error: `Archivo demasiado grande (${Math.round(buffer.length / 1024 / 1024)}MB). Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  // 2. Detect real type from magic bytes
  const detected = detectFileType(buffer);
  if (!detected) {
    logger.warn(`[FileValidation] Unknown file type for: ${declaredName}`);
    return {
      valid: false,
      detectedMime: null,
      detectedExt: null,
      error: 'Tipo de archivo no reconocido',
    };
  }

  // 3. Check against allowed types
  const allowed = ALLOWED_TYPES[context];
  // For ZIP-based formats (xlsx, docx), the detected MIME might be application/zip
  const isAllowed = allowed.some(mime => {
    if (detected.mime === 'application/zip') {
      // Check file extension for Office formats
      const ext = declaredName.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' && mime.includes('spreadsheet')) return true;
      if (ext === 'docx' && mime.includes('wordprocessing')) return true;
      if (mime === 'application/zip') return true;
      return false;
    }
    return detected.mime === mime || (detected.mime === 'text/csv' && mime === 'text/plain');
  });

  if (!isAllowed) {
    logger.warn(`[FileValidation] Blocked file: ${declaredName} (detected: ${detected.mime}, context: ${context})`);
    return {
      valid: false,
      detectedMime: detected.mime,
      detectedExt: detected.ext,
      error: `Tipo de archivo no permitido: ${detected.ext}. Permitidos: ${allowed.map(m => m.split('/').pop()).join(', ')}`,
    };
  }

  // 4. Check for dangerous content in text files
  if (detected.mime.startsWith('text/')) {
    const content = Buffer.from(buffer.slice(0, 2000)).toString('utf-8');
    const dangerousPatterns = ['<script', 'javascript:', 'onerror=', 'onload=', 'eval(', 'exec('];
    for (const pattern of dangerousPatterns) {
      if (content.toLowerCase().includes(pattern)) {
        logger.warn(`[FileValidation] Dangerous content in ${declaredName}: ${pattern}`);
        return {
          valid: false,
          detectedMime: detected.mime,
          detectedExt: detected.ext,
          error: 'Contenido potencialmente peligroso detectado',
        };
      }
    }
  }

  return {
    valid: true,
    detectedMime: detected.mime,
    detectedExt: detected.ext,
  };
}
