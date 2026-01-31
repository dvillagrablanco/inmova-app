/**
 * API Route: Descargar documentos del almacenamiento local
 * Endpoint: GET /api/documents/local/{folder}/{filename}
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as LocalStorage from '@/lib/local-storage';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// MIME types comunes
const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Reconstruir el path del archivo
    const filePath = params.path.join('/');

    if (!filePath) {
      return NextResponse.json({ error: 'Ruta de archivo no especificada' }, { status: 400 });
    }

    // 3. Validar que no intenta acceder fuera del directorio
    if (filePath.includes('..') || filePath.startsWith('/')) {
      logger.warn(`[Local Download] Intento de path traversal: ${filePath}`);
      return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
    }

    // 4. Leer el archivo
    const fileBuffer = await LocalStorage.readFile(filePath);

    if (!fileBuffer) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    // 5. Obtener metadata
    const metadata = LocalStorage.getFileMetadata(filePath);
    const originalName = metadata?.originalName || filePath.split('/').pop() || 'document';

    // 6. Determinar Content-Type
    const extension = '.' + filePath.split('.').pop()?.toLowerCase();
    const contentType =
      metadata?.contentType || MIME_TYPES[extension] || 'application/octet-stream';

    // 7. Retornar el archivo
    logger.info(`[Local Download] Archivo servido: ${filePath}`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${originalName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    logger.error('[Local Download Error]:', error);
    return NextResponse.json(
      {
        error: 'Error descargando archivo',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
