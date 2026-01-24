/**
 * API Route: Upload de archivos PRIVADOS a S3
 * Bucket: inmova-private
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const AWS_REGION = process.env.AWS_REGION || 'eu-north-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.AWS_BUCKET_PRIVATE || process.env.AWS_BUCKET || 'inmova-private';

const isS3Configured = !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);

const s3Client = isS3Configured 
  ? new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

const uploadSchema = z.object({
  folder: z.enum(['contratos', 'dni', 'documentos', 'facturas', 'tenants', 'inquilinos']).optional().default('documentos'),
  entityType: z.enum(['property', 'contract', 'tenant', 'user']).optional(),
  entityId: z.string().optional(),
});

// Tipos MIME permitidos - ampliados
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/octet-stream',
];

export async function POST(req: NextRequest) {
  // USAR console.warn PORQUE Next.js elimina console.log en producción
  console.warn("[UPLOAD] ========== REQUEST START ==========");
  console.warn("[UPLOAD] Time:", new Date().toISOString());
  console.warn("[UPLOAD] S3 Configured:", isS3Configured);
  
  try {
    if (!isS3Configured || !s3Client) {
      console.error("[UPLOAD] ERROR: S3 not configured");
      return NextResponse.json(
        { error: 'Servicio de almacenamiento no disponible', code: 'S3_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    console.warn("[UPLOAD] Session:", session?.user?.email || "NO SESSION");
    
    if (!session) {
      console.warn("[UPLOAD] ERROR: No session");
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    console.warn("[UPLOAD] Parsing FormData...");
    let formData;
    try {
      formData = await req.formData();
      console.warn("[UPLOAD] FormData parsed OK");
    } catch (parseError: any) {
      console.error("[UPLOAD] FormData parse error:", parseError.message);
      return NextResponse.json(
        { error: 'Error al procesar el archivo', details: parseError.message },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'documentos';
    const entityType = formData.get('entityType') as string;

    console.warn("[UPLOAD] File:", file?.name, "Size:", file?.size, "Type:", file?.type);
    console.warn("[UPLOAD] Folder:", folder);

    if (!file) {
      console.error("[UPLOAD] ERROR: No file provided");
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    const validation = uploadSchema.safeParse({ folder, entityType });
    if (!validation.success) {
      console.error("[UPLOAD] Validation error:", JSON.stringify(validation.error.errors));
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'application/octet-stream';
    const isAllowed = ALLOWED_MIME_TYPES.includes(mimeType) || 
                      mimeType.startsWith('image/') || 
                      mimeType.startsWith('application/');
    
    console.warn("[UPLOAD] MIME:", mimeType, "Allowed:", isAllowed);
    
    if (!isAllowed) {
      console.error("[UPLOAD] ERROR: MIME not allowed:", mimeType);
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido', received: mimeType },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      console.error("[UPLOAD] ERROR: File too large:", file.size);
      return NextResponse.json(
        { error: 'Archivo demasiado grande (máximo 10MB)' },
        { status: 400 }
      );
    }

    console.warn("[UPLOAD] Starting S3 upload...");
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${timestamp}-${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);
    console.warn("[UPLOAD] S3 SUCCESS! Key:", key);

    const tipoDocumento = folder === 'contratos' ? 'contrato' 
                        : folder === 'dni' ? 'dni'
                        : folder === 'facturas' ? 'factura'
                        : 'otro';

    try {
      await prisma.document.create({
        data: {
          nombre: file.name,
          tipo: tipoDocumento as any,
          url: key,
          tamanio: file.size,
          mimeType: mimeType,
          descripcion: `S3: ${BUCKET_NAME}`,
          companyId: session.user?.companyId,
        },
      });
      console.warn("[UPLOAD] DB record created");
    } catch (dbErr: any) {
      console.warn("[UPLOAD] DB error (non-fatal):", dbErr.message);
    }

    console.warn("[UPLOAD] ========== SUCCESS ==========");
    return NextResponse.json({
      success: true,
      key,
      url: `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`,
      fileName: file.name,
      size: file.size,
    });

  } catch (error: any) {
    console.error("[UPLOAD] ========== FATAL ERROR ==========");
    console.error("[UPLOAD] Error:", error.message);
    console.error("[UPLOAD] Stack:", error.stack?.slice(0, 500));
    
    return NextResponse.json(
      { error: 'Error al subir archivo', message: error.message },
      { status: 500 }
    );
  }
}
