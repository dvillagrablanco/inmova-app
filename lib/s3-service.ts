/**
 * AWS S3 Service - Upload y gestión de archivos
 * @module s3-service
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { gzipSync } from 'zlib';

import logger from '@/lib/logger';
// Cliente S3 configurado con variables de entorno
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME || process.env.AWS_BUCKET || 'inmova';
const CDN_URL = process.env.AWS_CLOUDFRONT_URL || '';

interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  error?: string;
}

export class S3Service {
  /**
   * Compress file before S3 upload based on content type
   * - Images: already compressed client-side (WebP), skip further compression
   * - PDFs, text, JSON, CSV, XML: gzip compress (30-80% savings)
   * - Already compressed formats (zip, gz): skip
   */
  private static compressForUpload(
    buffer: Buffer,
    contentType: string
  ): { body: Buffer; encoding: string | null } {
    // Skip compression for small files (<10KB) or already-compressed formats
    if (buffer.length < 10 * 1024) {
      return { body: buffer, encoding: null };
    }

    // Skip for images (already compressed as WebP/JPEG/PNG)
    if (contentType.startsWith('image/')) {
      return { body: buffer, encoding: null };
    }

    // Skip for already-compressed formats
    const skipTypes = [
      'application/zip', 'application/gzip', 'application/x-rar',
      'application/x-7z-compressed', 'video/', 'audio/',
    ];
    if (skipTypes.some(t => contentType.includes(t))) {
      return { body: buffer, encoding: null };
    }

    // Gzip compress PDFs, text, JSON, CSV, XML, DOCX, etc.
    const compressibleTypes = [
      'application/pdf',
      'text/', 'application/json', 'application/xml',
      'application/csv', 'text/csv',
      'application/vnd.openxmlformats', // DOCX, XLSX
      'application/msword',
      'application/vnd.ms-excel',
    ];

    if (compressibleTypes.some(t => contentType.includes(t))) {
      try {
        const compressed = gzipSync(buffer, { level: 6 }); // Level 6 = good balance
        // Only use compressed if it's actually smaller
        if (compressed.length < buffer.length * 0.95) {
          return { body: compressed, encoding: 'gzip' };
        }
      } catch {
        // Fallback to uncompressed
      }
    }

    return { body: buffer, encoding: null };
  }

  private static isConfigured(): boolean {
    return Boolean(
      process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        BUCKET_NAME
    );
  }

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
      if (!this.isConfigured()) {
        const errorMsg = 'AWS S3 no configurado';
        logger.warn(`⚠️ ${errorMsg}`);
        if (process.env.NODE_ENV !== 'production') {
          return this.simulateUpload(filename, folder);
        }
        return { success: false, url: '', key: '', error: errorMsg };
      }

      // Generar key único con timestamp
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `${folder}/${timestamp}-${sanitizedFilename}`;

      // Detectar content type
      const contentType = this.getContentType(filename);

      // Compress file before upload to minimize S3 storage
      const { body: uploadBody, encoding } = this.compressForUpload(file, contentType);
      
      const originalSize = file.length;
      const compressedSize = uploadBody.length;
      if (originalSize > 10000) {
        const savings = ((1 - compressedSize / originalSize) * 100).toFixed(0);
        logger.info(`📦 S3 upload: ${filename} ${(originalSize/1024).toFixed(0)}KB → ${(compressedSize/1024).toFixed(0)}KB (${savings}% savings)`);
      }

      // Upload a S3
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: uploadBody,
        ContentType: contentType,
        ...(encoding ? { ContentEncoding: encoding } : {}),
        // Metadata for lifecycle management
        Metadata: {
          'original-size': String(originalSize),
          'compressed': encoding ? 'gzip' : 'none',
        },
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
      logger.error('❌ Error uploading to S3:', error);

      if (process.env.NODE_ENV !== 'production') {
        return this.simulateUpload(filename, folder);
      }

      return {
        success: false,
        url: '',
        key: '',
        error: error?.message || 'Error subiendo archivo',
      };
    }
  }

  /**
   * Elimina un archivo de S3
   * @param key - Key del archivo en S3
   */
  static async deleteFile(key: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        logger.warn('⚠️ AWS S3 no configurado');
        return process.env.NODE_ENV !== 'production';
      }

      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      logger.error('❌ Error deleting from S3:', error);
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
      if (!this.isConfigured()) {
        if (process.env.NODE_ENV !== 'production') {
          return `https://via.placeholder.com/800x600?text=${encodeURIComponent(key)}`;
        }
        throw new Error('AWS S3 no configurado');
      }

      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error: any) {
      logger.error('❌ Error generating signed URL:', error);
      if (process.env.NODE_ENV !== 'production') {
        return `https://via.placeholder.com/800x600?text=${encodeURIComponent(key)}`;
      }
      throw error;
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

    logger.info('🔧 Simulated S3 upload', { key, url });

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
