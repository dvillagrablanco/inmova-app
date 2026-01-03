/**
 * API Route: Upload de archivos PRIVADOS a S3
 * Uso: Contratos, DNI, documentos sensibles
 * Bucket: inmova-private (privado)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';
import { prisma } from '@/lib/db';

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
  folder: z.enum(['contratos', 'dni', 'documentos', 'facturas']).optional().default('documentos'),
  entityType: z.enum(['property', 'contract', 'tenant', 'user']).optional(),
  entityId: z.string().optional(),
});

// Tipos MIME permitidos para documentos
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
    const folder = formData.get('folder') as string || 'documentos';
    const entityType = formData.get('entityType') as string;
    const entityId = formData.get('entityId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // 3. Validaciones
    const validation = uploadSchema.safeParse({ folder, entityType, entityId });
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

    // Validar tamaño (10MB para documentos)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Archivo demasiado grande (máximo 10MB)' },
        { status: 400 }
      );
    }

    // 4. Generar nombre único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${randomStr}.${extension}`;

    // 5. Convertir a Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 6. Upload a S3 (bucket PRIVADO)
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_PRIVATE!, // inmova-private
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        uploadedBy: session.user.id,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        entityType: entityType || 'none',
        entityId: entityId || 'none',
      },
    });

    await s3Client.send(command);

    // 7. Guardar registro en BD (adaptado al schema existente)
    const document = await prisma.document.create({
      data: {
        nombre: file.name,
        tipo: folder === 'contratos' ? 'CONTRATO' : 'OTRO',
        cloudStoragePath: fileName, // S3 key
        descripcion: `Bucket: inmova-private, Size: ${file.size}, Type: ${file.type}`,
        // Relaciones opcionales
        ...(entityType === 'contract' && entityId && { contractId: entityId }),
        ...(entityType === 'tenant' && entityId && { tenantId: entityId }),
        ...(entityType === 'property' && entityId && { unitId: entityId }), // properties se mapean a unit
      },
    });

    // 8. Respuesta exitosa (NO incluir URL pública)
    return NextResponse.json({
      success: true,
      documentId: document.id,
      fileName,
      size: file.size,
      type: file.type,
      bucket: 'inmova-private',
      message: 'Documento subido de forma segura',
      // NO retornar URL pública - usar endpoint de descarga
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Upload Private Error]:', error);
    
    return NextResponse.json(
      {
        error: 'Error subiendo documento',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
