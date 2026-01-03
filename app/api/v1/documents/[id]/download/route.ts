/**
 * API Route: Download Document
 * 
 * GET /api/v1/documents/[id]/download
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getDownloadUrl, hasDocumentAccess } from '@/lib/document-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const documentId = params.id;

    // Verificar acceso
    const hasAccess = await hasDocumentAccess(documentId, session.user.id);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Generar URL de descarga
    const downloadUrl = await getDownloadUrl(documentId);

    // Redirect a S3
    return NextResponse.redirect(downloadUrl);
  } catch (error: any) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
