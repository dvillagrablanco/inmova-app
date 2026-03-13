import { S3Client } from '@aws-sdk/client-s3';

/**
 * Obtener configuración del bucket S3.
 * Soporta múltiples nombres de variable de entorno por compatibilidad:
 * AWS_BUCKET_NAME (preferido) > AWS_BUCKET > AWS_S3_BUCKET > fallback 'inmova'
 */
export function getBucketConfig() {
  return {
    bucketName:
      process.env.AWS_BUCKET_NAME ||
      process.env.AWS_BUCKET ||
      process.env.AWS_S3_BUCKET ||
      'inmova',
    folderPrefix: process.env.AWS_FOLDER_PREFIX || '',
  };
}

export function createS3Client() {
  return new S3Client({});
}
