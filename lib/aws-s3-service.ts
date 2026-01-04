/**
 * AWS S3 Service - Upload de archivos a S3
 * 
 * Features:
 * - Upload de imágenes (propiedades, perfiles)
 * - Upload de documentos PDF (contratos, facturas)
 * - Generación de URLs pre-firmadas
 * - Validación de tipos de archivo
 * - Compresión automática de imágenes
 * 
 * @module lib/aws-s3-service
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

/**
 * MODELO DE INTEGRACIÓN POR CLIENTE
 * 
 * Cada empresa (Company) puede tener sus propias credenciales de AWS S3.
 * Inmova puede ofrecer:
 * 1. Storage compartido (bucket de Inmova) - Para clientes pequeños
 * 2. BYOS (Bring Your Own Storage) - Para clientes enterprise que quieren su propio bucket
 * 
 * Las credenciales se almacenan en la tabla Company:
 * - awsAccessKeyId: Access key del cliente (encriptada) o null (usa el de Inmova)
 * - awsSecretAccessKey: Secret key del cliente (encriptada) o null
 * - awsBucket: Nombre del bucket del cliente o null (usa el de Inmova)
 * - awsRegion: Región del bucket (default: eu-west-1)
 */

/**
 * Configuración de AWS S3 por empresa
 */
export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
}

/**
 * Obtiene el cliente S3 con la configuración proporcionada
 */
function getS3Client(config: S3Config): S3Client {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

// Configuración por defecto de Inmova (para clientes sin su propio bucket)
const DEFAULT_S3_CONFIG: S3Config | null = process.env.AWS_ACCESS_KEY_ID
  ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      bucket: process.env.AWS_BUCKET || 'inmova-production',
      region: process.env.AWS_REGION || 'eu-west-1',
    }
  : null;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

/**
 * Tipos de archivo permitidos
 */
export type FileType = 'image' | 'document';

/**
 * Resultado de upload
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Genera un nombre de archivo único
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Valida el tipo de archivo
 */
function validateFileType(mimeType: string, fileType: FileType): boolean {
  if (fileType === 'image') {
    return ALLOWED_IMAGE_TYPES.includes(mimeType);
  } else if (fileType === 'document') {
    return ALLOWED_DOCUMENT_TYPES.includes(mimeType);
  }
  return false;
}

/**
 * Valida el tamaño del archivo
 */
function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

/**
 * Upload de archivo a S3
 * 
 * @param config - Configuración de S3 (de la empresa o default de Inmova)
 * @param file - Archivo a subir (Buffer o File)
 * @param folder - Carpeta destino en S3 (ej: 'properties', 'documents', 'avatars')
 * @param fileType - Tipo de archivo ('image' o 'document')
 * @param originalName - Nombre original del archivo
 * @param mimeType - MIME type del archivo
 * @returns Resultado del upload con URL pública
 * 
 * @example
 * const result = await uploadToS3(s3Config, fileBuffer, 'properties', 'image', 'casa-playa.jpg', 'image/jpeg');
 * if (result.success) {
 *   console.log('URL:', result.url);
 * }
 */
export async function uploadToS3(
  config: S3Config,
  file: Buffer,
  folder: string,
  fileType: FileType,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  try {
    // Validar tipo de archivo
    if (!validateFileType(mimeType, fileType)) {
      return {
        success: false,
        error: `Invalid file type. Allowed types: ${fileType === 'image' ? ALLOWED_IMAGE_TYPES.join(', ') : ALLOWED_DOCUMENT_TYPES.join(', ')}`,
      };
    }

    // Validar tamaño
    if (!validateFileSize(file.length)) {
      return {
        success: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024} MB`,
      };
    }

    // Generar nombre único
    const uniqueFileName = generateUniqueFileName(originalName);
    const key = `${folder}/${uniqueFileName}`;

    // Subir a S3
    const client = getS3Client(config);
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
      // ACL pública (opcional, depende de la configuración del bucket)
      // ACL: 'public-read',
    });

    await client.send(command);

    // Generar URL pública
    const url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;

    return {
      success: true,
      url,
      key,
    };
  } catch (error: any) {
    console.error('[AWS S3] Upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

/**
 * Genera una URL pre-firmada para acceso temporal
 * Útil para archivos privados que necesitan acceso temporal
 * 
 * @param config - Configuración de S3
 * @param key - Key del objeto en S3
 * @param expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 * @returns URL pre-firmada
 * 
 * @example
 * const url = await getSignedUrlForObject(s3Config, 'documents/contract-123.pdf', 3600);
 * // URL válida por 1 hora
 */
export async function getSignedUrlForObject(
  config: S3Config,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const client = getS3Client(config);
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn });
    return url;
  } catch (error: any) {
    console.error('[AWS S3] Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Elimina un archivo de S3
 * 
 * @param config - Configuración de S3
 * @param key - Key del objeto a eliminar
 * @returns true si se eliminó correctamente
 * 
 * @example
 * await deleteFromS3(s3Config, 'properties/old-photo.jpg');
 */
export async function deleteFromS3(config: S3Config, key: string): Promise<boolean> {
  try {
    const client = getS3Client(config);
    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error: any) {
    console.error('[AWS S3] Delete error:', error);
    return false;
  }
}

/**
 * Verifica si una empresa tiene S3 configurado
 */
export function isS3Configured(config?: S3Config | null): boolean {
  if (config) {
    return !!(config.accessKeyId && config.secretAccessKey && config.bucket);
  }
  return !!DEFAULT_S3_CONFIG;
}

/**
 * Obtiene la URL base del bucket
 */
export function getS3BaseUrl(config: S3Config): string {
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com`;
}

/**
 * Upload múltiple de archivos
 * 
 * @param config - Configuración de S3
 * @param files - Array de archivos a subir
 * @param folder - Carpeta destino
 * @param fileType - Tipo de archivos
 * @returns Array de resultados
 * 
 * @example
 * const results = await uploadMultipleToS3(s3Config, [file1, file2], 'properties', 'image');
 * const successfulUploads = results.filter(r => r.success);
 */
export async function uploadMultipleToS3(
  config: S3Config,
  files: Array<{ buffer: Buffer; originalName: string; mimeType: string }>,
  folder: string,
  fileType: FileType
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) =>
    uploadToS3(config, file.buffer, folder, fileType, file.originalName, file.mimeType)
  );

  return await Promise.all(uploadPromises);
}

/**
 * Obtiene la configuración de S3 (de la empresa o default de Inmova)
 */
export function getS3Config(companyConfig?: {
  awsAccessKeyId?: string | null;
  awsSecretAccessKey?: string | null;
  awsBucket?: string | null;
  awsRegion?: string | null;
}): S3Config | null {
  // Si la empresa tiene su propia configuración, usarla
  if (
    companyConfig?.awsAccessKeyId &&
    companyConfig?.awsSecretAccessKey &&
    companyConfig?.awsBucket
  ) {
    return {
      accessKeyId: companyConfig.awsAccessKeyId,
      secretAccessKey: companyConfig.awsSecretAccessKey,
      bucket: companyConfig.awsBucket,
      region: companyConfig.awsRegion || 'eu-west-1',
    };
  }

  // Sino, usar la configuración default de Inmova
  return DEFAULT_S3_CONFIG;
}

/**
 * Servicio de S3 exportado
 */
export const S3Service = {
  upload: uploadToS3,
  uploadMultiple: uploadMultipleToS3,
  delete: deleteFromS3,
  getSignedUrl: getSignedUrlForObject,
  isConfigured: isS3Configured,
  getBaseUrl: getS3BaseUrl,
  getConfig: getS3Config,
};
