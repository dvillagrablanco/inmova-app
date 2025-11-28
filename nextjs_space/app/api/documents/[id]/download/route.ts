import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { downloadFile } from '@/lib/s3';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Get signed URL from S3
    const signedUrl = await downloadFile(document.cloudStoragePath);

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json({ error: 'Error al descargar documento' }, { status: 500 });
  }
}