/**
 * API Route: Upload de archivos PÚBLICOS a S3
 * Uso: Fotos de propiedades, avatares, imágenes
 * Bucket: inmova (público)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configurar S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Validación
const uploadSchema = z.object({
  folder: z.enum(['propiedades', 'avatares', 'general']).optional().default('general'),
  maxSize: z.number().optional().default(5 * 1024 * 1024), // 5MB default
});

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Parsear FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // 3. Validaciones
    const validation = uploadSchema.safeParse({ folder });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: validation.error },
        { status: 400 }
      );
    }

    // Validar tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Tipo de archivo no permitido',
          allowed: ALLOWED_MIME_TYPES,
          received: file.type
        },
        { status: 400 }
      );
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Archivo demasiado grande (máximo 5MB)' },
        { status: 400 }
      );
    }

    // 4. Generar nombre único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${randomStr}.${extension}`;

    // 5. Convertir a Buffer y comprimir si es posible
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    
    // Compress compressible types (PDFs, text) - skip images (already compressed)
    let uploadBuffer = rawBuffer;
    let contentEncoding: string | undefined;
    const isCompressible = ['application/pdf', 'text/', 'application/json', 'application/csv'].some(t => file.type.includes(t));
    if (isCompressible && rawBuffer.length > 10240) {
      try {
        const { gzipSync } = require('zlib');
        const compressed = gzipSync(rawBuffer, { level: 6 });
        if (compressed.length < rawBuffer.length * 0.95) {
          uploadBuffer = compressed;
          contentEncoding = 'gzip';
        }
      } catch {}
    }

    // 6. Upload a S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET!,
      Key: fileName,
      Body: uploadBuffer,
      ContentType: file.type,
      ...(contentEncoding ? { ContentEncoding: contentEncoding } : {}),
      Metadata: {
        uploadedBy: session.user.id,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        originalSize: String(rawBuffer.length),
      },
    });

    await s3Client.send(command);

    // 7. Generar URL pública
    const publicUrl = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // 8. Respuesta exitosa
    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: file.size,
      type: file.type,
      bucket: process.env.AWS_BUCKET,
    }, { status: 201 });

  } catch (error: any) {
    logger.error('[Upload Public Error]:', error);
    
    return NextResponse.json(
      {
        error: 'Error subiendo archivo',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
