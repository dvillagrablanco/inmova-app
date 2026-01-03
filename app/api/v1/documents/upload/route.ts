/**
 * API Route: Upload Document
 * 
 * POST /api/v1/documents/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { uploadDocument } from '@/lib/document-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const uploadSchema = z.object({
  entityType: z.enum(['property', 'contract', 'tenant', 'company', 'maintenance']),
  entityId: z.string().cuid(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string);

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar metadata
    const validated = uploadSchema.parse(metadata);

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload
    const document = await uploadDocument({
      file: buffer,
      filename: file.name,
      mimeType: file.type,
      ...validated,
      userId: session.user.id,
      companyId: session.user.companyId,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Metadata inválida', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
