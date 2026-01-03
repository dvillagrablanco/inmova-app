/**
 * Servicio de Gestión de Documentos
 * 
 * Upload, organize, share, versioning de documentos.
 * Integrado con AWS S3 para almacenamiento.
 * 
 * @module DocumentService
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from './db';
import logger from './logger';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

// ============================================================================
// TIPOS
// ============================================================================

export interface DocumentUploadOptions {
  file: Buffer;
  filename: string;
  mimeType: string;
  entityType: 'property' | 'contract' | 'tenant' | 'company' | 'maintenance';
  entityId: string;
  userId: string;
  companyId: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  s3Key: string;
  entityType: string;
  entityId: string;
  category?: string;
  tags: string[];
  uploadedBy: string;
  companyId: string;
  isPublic: boolean;
  version: number;
  checksum: string;
  createdAt: Date;
}

export interface DocumentShareOptions {
  documentId: string;
  sharedWith: string[]; // userIds or emails
  expiresIn?: number; // segundos
  canDownload?: boolean;
  canEdit?: boolean;
}

// ============================================================================
// UPLOAD
// ============================================================================

/**
 * Sube un documento a S3 y guarda metadata en BD
 */
export async function uploadDocument(options: DocumentUploadOptions): Promise<DocumentMetadata> {
  try {
    // Generar S3 key
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = options.filename.split('.').pop();
    const s3Key = `${options.companyId}/${options.entityType}/${options.entityId}/${timestamp}-${random}.${ext}`;

    // Calcular checksum
    const checksum = crypto.createHash('sha256').update(options.file).digest('hex');

    // Upload a S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: options.file,
        ContentType: options.mimeType,
        Metadata: {
          originalFilename: options.filename,
          entityType: options.entityType,
          entityId: options.entityId,
          uploadedBy: options.userId,
        },
      })
    );

    // Generar URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    // Guardar metadata en BD
    const document = await prisma.document.create({
      data: {
        filename: options.filename,
        mimeType: options.mimeType,
        size: options.file.length,
        url,
        s3Key,
        entityType: options.entityType,
        entityId: options.entityId,
        category: options.category,
        tags: options.tags || [],
        uploadedBy: options.userId,
        companyId: options.companyId,
        isPublic: options.isPublic || false,
        version: 1,
        checksum,
      },
    });

    logger.info('📄 Document uploaded', {
      documentId: document.id,
      filename: options.filename,
      size: options.file.length,
    });

    return document as any;
  } catch (error: any) {
    logger.error('❌ Error uploading document:', error);
    throw error;
  }
}

/**
 * Genera URL firmada para descarga temporal
 */
export async function getDownloadUrl(documentId: string, expiresIn: number = 3600): Promise<string> {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { s3Key: true },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: document.s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    logger.info('🔗 Download URL generated', { documentId, expiresIn });

    return signedUrl;
  } catch (error: any) {
    logger.error('❌ Error generating download URL:', error);
    throw error;
  }
}

/**
 * Elimina un documento
 */
export async function deleteDocument(documentId: string, userId: string): Promise<void> {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        s3Key: true,
        uploadedBy: true,
        companyId: true,
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Verificar permisos (solo quien lo subió o admin)
    // (Simplificado - en producción verificar role)
    if (document.uploadedBy !== userId) {
      throw new Error('Permission denied');
    }

    // Eliminar de S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: document.s3Key,
      })
    );

    // Eliminar de BD (soft delete)
    await prisma.document.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    logger.info('🗑️ Document deleted', { documentId });
  } catch (error: any) {
    logger.error('❌ Error deleting document:', error);
    throw error;
  }
}

// ============================================================================
// ORGANIZATION
// ============================================================================

/**
 * Lista documentos por entidad
 */
export async function getDocumentsByEntity(entityType: string, entityId: string): Promise<DocumentMetadata[]> {
  return await prisma.document.findMany({
    where: {
      entityType,
      entityId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  }) as any;
}

/**
 * Busca documentos
 */
export async function searchDocuments(options: {
  companyId: string;
  query?: string;
  entityType?: string;
  category?: string;
  tags?: string[];
  uploadedBy?: string;
  page?: number;
  limit?: number;
}): Promise<{ documents: DocumentMetadata[]; total: number }> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    companyId: options.companyId,
    deletedAt: null,
  };

  if (options.query) {
    where.OR = [
      { filename: { contains: options.query, mode: 'insensitive' } },
      { category: { contains: options.query, mode: 'insensitive' } },
      { tags: { hasSome: [options.query] } },
    ];
  }

  if (options.entityType) {
    where.entityType = options.entityType;
  }

  if (options.category) {
    where.category = options.category;
  }

  if (options.tags && options.tags.length > 0) {
    where.tags = { hasSome: options.tags };
  }

  if (options.uploadedBy) {
    where.uploadedBy = options.uploadedBy;
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.document.count({ where }),
  ]);

  return { documents: documents as any, total };
}

/**
 * Actualiza metadata de documento
 */
export async function updateDocumentMetadata(
  documentId: string,
  updates: {
    category?: string;
    tags?: string[];
    isPublic?: boolean;
  }
): Promise<void> {
  await prisma.document.update({
    where: { id: documentId },
    data: updates,
  });

  logger.info('📝 Document metadata updated', { documentId, updates });
}

// ============================================================================
// SHARING
// ============================================================================

/**
 * Comparte un documento con usuarios
 */
export async function shareDocument(options: DocumentShareOptions): Promise<void> {
  try {
    // Crear shares
    const shares = options.sharedWith.map((userId) => ({
      documentId: options.documentId,
      sharedWithUserId: userId,
      expiresAt: options.expiresIn
        ? new Date(Date.now() + options.expiresIn * 1000)
        : null,
      canDownload: options.canDownload ?? true,
      canEdit: options.canEdit ?? false,
    }));

    await prisma.documentShare.createMany({
      data: shares,
      skipDuplicates: true,
    });

    logger.info('📤 Document shared', {
      documentId: options.documentId,
      sharedWith: options.sharedWith.length,
    });
  } catch (error: any) {
    logger.error('❌ Error sharing document:', error);
    throw error;
  }
}

/**
 * Revoca acceso compartido
 */
export async function revokeDocumentAccess(documentId: string, userId: string): Promise<void> {
  await prisma.documentShare.deleteMany({
    where: {
      documentId,
      sharedWithUserId: userId,
    },
  });

  logger.info('🚫 Document access revoked', { documentId, userId });
}

/**
 * Verifica si un usuario tiene acceso a un documento
 */
export async function hasDocumentAccess(documentId: string, userId: string): Promise<boolean> {
  // Verificar si es el owner
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { uploadedBy: true, isPublic: true, companyId: true },
  });

  if (!document) {
    return false;
  }

  if (document.isPublic) {
    return true;
  }

  if (document.uploadedBy === userId) {
    return true;
  }

  // Verificar si está compartido
  const share = await prisma.documentShare.findFirst({
    where: {
      documentId,
      sharedWithUserId: userId,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
  });

  return !!share;
}

// ============================================================================
// VERSIONING
// ============================================================================

/**
 * Crea una nueva versión de un documento
 */
export async function createDocumentVersion(
  existingDocumentId: string,
  newFile: Buffer,
  userId: string
): Promise<DocumentMetadata> {
  const existingDoc = await prisma.document.findUnique({
    where: { id: existingDocumentId },
  });

  if (!existingDoc) {
    throw new Error('Document not found');
  }

  // Upload nueva versión
  const newVersion = await uploadDocument({
    file: newFile,
    filename: existingDoc.filename,
    mimeType: existingDoc.mimeType,
    entityType: existingDoc.entityType as any,
    entityId: existingDoc.entityId,
    userId,
    companyId: existingDoc.companyId,
    category: existingDoc.category || undefined,
    tags: existingDoc.tags,
    isPublic: existingDoc.isPublic,
  });

  // Actualizar versión
  await prisma.document.update({
    where: { id: newVersion.id },
    data: { version: (existingDoc.version || 1) + 1 },
  });

  logger.info('📝 Document version created', {
    originalId: existingDocumentId,
    newId: newVersion.id,
    version: (existingDoc.version || 1) + 1,
  });

  return newVersion;
}

export default {
  uploadDocument,
  getDownloadUrl,
  deleteDocument,
  getDocumentsByEntity,
  searchDocuments,
  updateDocumentMetadata,
  shareDocument,
  revokeDocumentAccess,
  hasDocumentAccess,
  createDocumentVersion,
};
