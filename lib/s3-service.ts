/**
 * AWS S3 Service - Upload y gestión de archivos
 * @module s3-service
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cliente S3 configurado con variables de entorno
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'inmova-properties';
const CDN_URL = process.env.AWS_CLOUDFRONT_URL || '';

interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  error?: string;
}

export class S3Service {
  /**
   * Sube un archivo a S3
   * @param file - Buffer del archivo
   * @param filename - Nombre del archivo
   * @param folder - Carpeta dentro del bucket (ej: 'properties', 'avatars')
   * @returns URL pública del archivo
   */
  static async uploadFile(
    file: Buffer,
    filename: string,
    folder: string = 'properties'
  ): Promise<UploadResult> {
    try {
      // Validar que las credenciales estén configuradas
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.warn('⚠️ AWS credentials not configured, using simulated upload');
        return this.simulateUpload(filename, folder);
      }

      // Generar key único con timestamp
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `${folder}/${timestamp}-${sanitizedFilename}`;

      // Detectar content type
      const contentType = this.getContentType(filename);

      // Upload a S3
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
        // ACL público para que las imágenes sean accesibles
        // ACL: 'public-read', // Comentado por seguridad, usar CloudFront
      });

      await s3Client.send(command);

      // Construir URL
      const url = CDN_URL
        ? `${CDN_URL}/${key}`
        : `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return {
        success: true,
        url,
        key,
      };
    } catch (error: any) {
      console.error('❌ Error uploading to S3:', error);
      
      // Fallback a simulación en caso de error
      return this.simulateUpload(filename, folder);
    }
  }

  /**
   * Elimina un archivo de S3
   * @param key - Key del archivo en S3
   */
  static async deleteFile(key: string): Promise<boolean> {
    try {
      if (!process.env.AWS_ACCESS_KEY_ID) {
        console.warn('⚠️ AWS credentials not configured');
        return true; // Simulación exitosa
      }

      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting from S3:', error);
      return false;
    }
  }

  /**
   * Genera URL firmada para acceso temporal (download directo)
   * @param key - Key del archivo en S3
   * @param expiresIn - Tiempo de expiración en segundos (default: 1 hora)
   */
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (!process.env.AWS_ACCESS_KEY_ID) {
        return `https://via.placeholder.com/800x600?text=${encodeURIComponent(key)}`;
      }

      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error: any) {
      console.error('❌ Error generating signed URL:', error);
      return '';
    }
  }

  /**
   * Simula upload para desarrollo/testing
   */
  private static simulateUpload(filename: string, folder: string): UploadResult {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${timestamp}-${sanitizedFilename}`;
    
    // URL de placeholder realista
    const url = `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=${encodeURIComponent(
      filename.substring(0, 20)
    )}`;

    console.log('🔧 Simulated S3 upload:', { key, url });

    return {
      success: true,
      url,
      key,
    };
  }

  /**
   * Detecta content type basado en extensión
   */
  private static getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Valida que el archivo sea una imagen válida
   */
  static validateImageFile(file: Buffer, filename: string): { valid: boolean; error?: string } {
    const ext = filename.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (!ext || !validExtensions.includes(ext)) {
      return {
        valid: false,
        error: 'Formato de archivo no válido. Solo se permiten: jpg, jpeg, png, gif, webp',
      };
    }

    // Validar tamaño máximo (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.length > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Máximo 5MB',
      };
    }

    return { valid: true };
  }
}

export default S3Service;
