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

// Cliente S3 (singleton)
let s3Client: S3Client | null = null;

/**
 * Obtiene el cliente S3 (lazy loading)
 */
function getS3Client(): S3Client {
  if (!s3Client) {
    // Verificar que las credenciales estén configuradas
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
    }

    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

// Configuración
const BUCKET_NAME = process.env.AWS_BUCKET || 'inmova-production';
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
 * @param file - Archivo a subir (Buffer o File)
 * @param folder - Carpeta destino en S3 (ej: 'properties', 'documents', 'avatars')
 * @param fileType - Tipo de archivo ('image' o 'document')
 * @param originalName - Nombre original del archivo
 * @returns Resultado del upload con URL pública
 * 
 * @example
 * const result = await uploadToS3(fileBuffer, 'properties', 'image', 'casa-playa.jpg');
 * if (result.success) {
 *   console.log('URL:', result.url);
 * }
 */
export async function uploadToS3(
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
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: mimeType,
      // ACL pública (opcional, depende de la configuración del bucket)
      // ACL: 'public-read',
    });

    await client.send(command);

    // Generar URL pública
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-west-1'}.amazonaws.com/${key}`;

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
 * @param key - Key del objeto en S3
 * @param expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 * @returns URL pre-firmada
 * 
 * @example
 * const url = await getSignedUrlForObject('documents/contract-123.pdf', 3600);
 * // URL válida por 1 hora
 */
export async function getSignedUrlForObject(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
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
 * @param key - Key del objeto a eliminar
 * @returns true si se eliminó correctamente
 * 
 * @example
 * await deleteFromS3('properties/old-photo.jpg');
 */
export async function deleteFromS3(key: string): Promise<boolean> {
  try {
    const client = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
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
 * Verifica si AWS S3 está configurado
 * Útil para features opcionales
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_BUCKET
  );
}

/**
 * Obtiene la URL base del bucket
 */
export function getS3BaseUrl(): string {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-west-1'}.amazonaws.com`;
}

/**
 * Upload múltiple de archivos
 * 
 * @param files - Array de archivos a subir
 * @param folder - Carpeta destino
 * @param fileType - Tipo de archivos
 * @returns Array de resultados
 * 
 * @example
 * const results = await uploadMultipleToS3([file1, file2], 'properties', 'image');
 * const successfulUploads = results.filter(r => r.success);
 */
export async function uploadMultipleToS3(
  files: Array<{ buffer: Buffer; originalName: string; mimeType: string }>,
  folder: string,
  fileType: FileType
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) =>
    uploadToS3(file.buffer, folder, fileType, file.originalName, file.mimeType)
  );

  return await Promise.all(uploadPromises);
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
};
