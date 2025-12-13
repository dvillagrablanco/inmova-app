import logger, { logError } from './logger';
import path from 'path';
import crypto from 'crypto';

/**
 * Configuración de validación de archivos por tipo
 */
interface FileTypeConfig {
  mimeTypes: string[];
  maxSize: number; // en bytes
  extensions: string[];
  magicNumbers?: Buffer[]; // Bytes de cabecera para validación profunda
}

/**
 * Configuraciones predefinidas por categoría de archivo
 */
export const FILE_TYPE_CONFIGS: Record<string, FileTypeConfig> = {
  image: {
    mimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    magicNumbers: [
      Buffer.from([0xff, 0xd8, 0xff]), // JPEG
      Buffer.from([0x89, 0x50, 0x4e, 0x47]), // PNG
      Buffer.from([0x47, 0x49, 0x46, 0x38]), // GIF
    ],
  },
  document: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    magicNumbers: [
      Buffer.from([0x25, 0x50, 0x44, 0x46]), // PDF
      Buffer.from([0xd0, 0xcf, 0x11, 0xe0]), // DOC/XLS (OLE)
      Buffer.from([0x50, 0x4b, 0x03, 0x04]), // DOCX/XLSX (ZIP)
    ],
  },
  csv: {
    mimeTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
    maxSize: 50 * 1024 * 1024, // 50MB
    extensions: ['.csv', '.txt'],
  },
  video: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    maxSize: 100 * 1024 * 1024, // 100MB
    extensions: ['.mp4', '.webm', '.ogv', '.mov'],
  },
  audio: {
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
    maxSize: 20 * 1024 * 1024, // 20MB
    extensions: ['.mp3', '.wav', '.ogg', '.webm'],
  },
};

/**
 * Resultado de la validación
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedFileName?: string;
  fileType?: string;
}

/**
 * Sanitiza el nombre de archivo para prevenir ataques
 */
export function sanitizeFileName(fileName: string): string {
  // Remover path traversal
  let sanitized = path.basename(fileName);

  // Remover caracteres peligrosos
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Prevenir nombres que empiecen con punto (archivos ocultos)
  if (sanitized.startsWith('.')) {
    sanitized = '_' + sanitized;
  }

  // Limitar longitud
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);
  const maxLength = 200;

  if (name.length > maxLength) {
    sanitized = name.substring(0, maxLength) + ext;
  }

  // Añadir timestamp único si es necesario
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(fileName + timestamp).digest('hex').substring(0, 8);
  sanitized = `${name}_${hash}${ext}`;

  return sanitized;
}

/**
 * Detecta el tipo de archivo basado en magic numbers
 */
export function detectFileTypeFromBuffer(buffer: Buffer): string | null {
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIGS)) {
    if (!config.magicNumbers) continue;

    for (const magicNumber of config.magicNumbers) {
      if (buffer.slice(0, magicNumber.length).equals(magicNumber)) {
        return type;
      }
    }
  }

  return null;
}

/**
 * Valida un archivo según su categoría
 */
export async function validateFile(
  file: File | { name: string; type: string; size: number; buffer?: Buffer },
  category: keyof typeof FILE_TYPE_CONFIGS
): Promise<FileValidationResult> {
  const result: FileValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  const config = FILE_TYPE_CONFIGS[category];
  if (!config) {
    result.isValid = false;
    result.errors.push(`Categoría de archivo no válida: ${category}`);
    return result;
  }

  // Validar MIME type
  if (!config.mimeTypes.includes(file.type)) {
    result.isValid = false;
    result.errors.push(
      `Tipo de archivo no permitido. Tipos permitidos: ${config.mimeTypes.join(', ')}`
    );
  }

  // Validar extensión
  const ext = path.extname(file.name).toLowerCase();
  if (!config.extensions.includes(ext)) {
    result.isValid = false;
    result.errors.push(
      `Extensión de archivo no permitida. Extensiones permitidas: ${config.extensions.join(', ')}`
    );
  }

  // Validar tamaño
  if (file.size > config.maxSize) {
    result.isValid = false;
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(2);
    result.errors.push(`El archivo excede el tamaño máximo de ${maxSizeMB}MB`);
  }

  if (file.size === 0) {
    result.isValid = false;
    result.errors.push('El archivo está vacío');
  }

  // Validar magic numbers si está disponible el buffer
  if ('buffer' in file && file.buffer && config.magicNumbers) {
    const detectedType = detectFileTypeFromBuffer(file.buffer);
    if (detectedType !== category) {
      result.warnings.push(
        'El contenido del archivo no coincide con su extensión. Esto podría indicar un archivo corrupto o malicioso.'
      );
    }
  }

  // Sanitizar nombre de archivo
  result.sanitizedFileName = sanitizeFileName(file.name);
  result.fileType = category;

  // Logging
  if (!result.isValid) {
    logError(new Error('File validation failed'), {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      category,
      errors: result.errors,
    });
  } else if (result.warnings.length > 0) {
    logger.warn('File validation warnings', {
      fileName: file.name,
      warnings: result.warnings,
    });
  }

  return result;
}

/**
 * Valida múltiples archivos
 */
export async function validateFiles(
  files: File[],
  category: keyof typeof FILE_TYPE_CONFIGS
): Promise<FileValidationResult[]> {
  const results = await Promise.all(files.map((file) => validateFile(file, category)));
  return results;
}

/**
 * Valida un archivo de imagen específicamente
 */
export async function validateImageFile(file: File): Promise<FileValidationResult> {
  return validateFile(file, 'image');
}

/**
 * Valida un archivo de documento específicamente
 */
export async function validateDocumentFile(file: File): Promise<FileValidationResult> {
  return validateFile(file, 'document');
}

/**
 * Valida un archivo CSV específicamente
 */
export async function validateCSVFile(file: File): Promise<FileValidationResult> {
  return validateFile(file, 'csv');
}

/**
 * Middleware para validación de archivos en API routes
 */
export async function validateUploadedFile(
  file: File | { name: string; type: string; size: number; buffer?: Buffer },
  category: keyof typeof FILE_TYPE_CONFIGS
): Promise<void> {
  const result = await validateFile(file, category);

  if (!result.isValid) {
    throw new Error(`Validación de archivo fallida: ${result.errors.join(', ')}`);
  }

  if (result.warnings.length > 0) {
    logger.warn('File upload warnings', {
      fileName: file.name,
      warnings: result.warnings,
    });
  }
}
