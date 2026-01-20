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

import logger from '@/lib/logger';
// Configuración global de AWS S3 (Inmova paga)
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.AWS_BUCKET || 'inmova-production';
const AWS_REGION = process.env.AWS_REGION || 'eu-west-1';

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

/**
 * Tipos de archivo permitidos
 */
export type FileType = 'image' | 'document' | 'pdf';

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
  }
  if (fileType === 'document' || fileType === 'pdf') {
    return ALLOWED_DOCUMENT_TYPES.includes(mimeType);
  }
  return false;
}

/**
 * Sube un archivo a S3
 * 
 * @param file - Buffer del archivo
 * @param folder - Carpeta en S3 (ej: 'properties', 'documents', 'profiles')
 * @param fileType - Tipo de archivo ('image', 'document')
 * @param originalName - Nombre original del archivo
 * @param mimeType - MIME type del archivo
 * @returns Resultado con URL del archivo
 */
export async function uploadToS3(
  file: Buffer,
  folder: string,
  fileType: FileType,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  try {
    // 1. Validar tipo de archivo
    if (!validateFileType(mimeType, fileType)) {
      return {
        success: false,
        error: `Tipo de archivo no permitido: ${mimeType}`,
      };
    }

    // 2. Validar tamaño
    if (file.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `Archivo muy grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // 3. Generar nombre único
    const fileName = generateUniqueFileName(originalName);
    const key = `${folder}/${fileName}`;

    // 4. Upload a S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    // 5. Generar URL
    const url = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

    return {
      success: true,
      url,
      key,
    };
  } catch (error: any) {
    logger.error('[S3] Upload error:', error);
    return {
      success: false,
      error: error.message || 'Error subiendo archivo',
    };
  }
}

/**
 * Obtiene una URL pre-firmada para acceder a un archivo privado
 * 
 * @param key - Key del archivo en S3
 * @param expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 * @returns URL pre-firmada
 */
export async function getSignedUrlForObject(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error: any) {
    logger.error('[S3] Signed URL error:', error);
    throw new Error('Error generando URL firmada');
  }
}

/**
 * Elimina un archivo de S3
 * 
 * @param key - Key del archivo en S3
 * @returns true si se eliminó correctamente
 */
export async function deleteFromS3(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    logger.error('[S3] Delete error:', error);
    return false;
  }
}

/**
 * Sube múltiples archivos a S3
 * 
 * @param files - Array de buffers de archivos
 * @param folder - Carpeta en S3
 * @param fileType - Tipo de archivo
 * @returns Array de resultados
 */
export async function uploadMultipleToS3(
  files: Array<{ buffer: Buffer; originalName: string; mimeType: string }>,
  folder: string,
  fileType: FileType
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadToS3(file.buffer, folder, fileType, file.originalName, file.mimeType))
  );
  return results;
}

/**
 * Verifica si S3 está configurado
 */
export function isS3Configured(): boolean {
  return !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && BUCKET_NAME);
}
