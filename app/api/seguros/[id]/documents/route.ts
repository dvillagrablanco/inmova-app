import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { uploadFile, deleteFile } from '@/lib/s3';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST - Upload document
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    const { id } = params;

    // Verify insurance belongs to company
    const insurance = await prisma.insurance.findFirst({
      where: { id, companyId: session.user.companyId },
    });

    if (!insurance) {
      return NextResponse.json({ error: 'Seguro no encontrado' }, { status: 404 });
    }

    // Get file from FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó un archivo' }, { status: 400 });
    }

    // Convert file to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate S3 key
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `seguros/${id}/${timestamp}-${sanitizedFilename}`;

    // Upload to S3
    const cloud_storage_path = await uploadFile(buffer, s3Key);

    // Get current documents
    const currentDocs = (insurance.documentosAdjuntos as any) || [];
    const newDoc = {
      filename: file.name,
      url: cloud_storage_path,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    // Add new document to array
    const updatedDocs = [...currentDocs, newDoc];

    // Update insurance with new document
    await prisma.insurance.update({
      where: { id },
      data: { documentosAdjuntos: updatedDocs as any },
    });

    return NextResponse.json({
      success: true,
      document: newDoc,
      message: 'Documento subido correctamente',
    });
  } catch (error) {
    logger.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Error al subir el documento' },
      { status: 500 }
    );
  }
}

// DELETE - Remove document
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const documentUrl = searchParams.get('url');

    if (!documentUrl) {
      return NextResponse.json(
        { error: 'URL del documento no proporcionada' },
        { status: 400 }
      );
    }

    // Verify insurance belongs to company
    const insurance = await prisma.insurance.findFirst({
      where: { id, companyId: session.user.companyId },
    });

    if (!insurance) {
      return NextResponse.json({ error: 'Seguro no encontrado' }, { status: 404 });
    }

    // Get current documents
    const currentDocs = (insurance.documentosAdjuntos as any) || [];

    // Find and remove the document
    const updatedDocs = currentDocs.filter((doc: any) => doc.url !== documentUrl);

    // Update insurance
    await prisma.insurance.update({
      where: { id },
      data: { documentosAdjuntos: updatedDocs as any },
    });

    // Try to delete from S3 (don't fail if it doesn't exist)
    try {
      await deleteFile(documentUrl);
    } catch (error) {
      logger.error('Error deleting file from S3:', error);
      // Continue anyway
    }

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado correctamente',
    });
  } catch (error) {
    logger.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el documento' },
      { status: 500 }
    );
  }
}
