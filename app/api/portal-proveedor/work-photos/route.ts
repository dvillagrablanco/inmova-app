import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/portal-proveedor/work-photos
 * Provider uploads before/after photos for a work order
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const formData = await request.formData();
    const workOrderId = formData.get('workOrderId') as string;
    const tipo = formData.get('tipo') as string; // 'antes' | 'despues'
    const notas = formData.get('notas') as string;
    const file = formData.get('file') as File | null;

    if (!workOrderId) return NextResponse.json({ error: 'workOrderId required' }, { status: 400 });

    // Upload to S3 if file provided
    let fileUrl = null;
    if (file) {
      try {
        const { uploadDocument } = await import('@/lib/document-service');
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadDocument({
          file: buffer,
          filename: `${tipo}-${Date.now()}.${file.name.split('.').pop()}`,
          mimeType: file.type,
          companyId: 'provider-work-photos',
          userId: 'provider-portal',
          entityType: 'maintenance',
          entityId: workOrderId,
        });
        fileUrl = result.url;
      } catch (e) {
        logger.warn('[Work Photos] Upload failed, continuing without file');
      }
    }

    // Update maintenance request with photo info
    const current = await prisma.maintenanceRequest.findUnique({
      where: { id: workOrderId },
      select: { descripcion: true },
    });

    const photoNote = `\n[FOTO ${tipo?.toUpperCase()}] ${new Date().toLocaleDateString('es-ES')} — ${notas || 'Sin notas'}${fileUrl ? ' — URL: ' + fileUrl : ''}`;

    await prisma.maintenanceRequest.update({
      where: { id: workOrderId },
      data: {
        descripcion: (current?.descripcion || '') + photoNote,
        ...(tipo === 'despues' ? { estado: 'completado', fechaCompletada: new Date() } : {}),
      },
    });

    return NextResponse.json({ success: true, message: `Foto ${tipo} registrada`, fileUrl });
  } catch (error: any) {
    logger.error('[Work Photos]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
