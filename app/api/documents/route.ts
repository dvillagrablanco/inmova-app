import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { uploadFile, deleteFile } from '@/lib/s3';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const unitId = searchParams.get('unitId');
  const buildingId = searchParams.get('buildingId');
  const contractId = searchParams.get('contractId');
  const folderId = searchParams.get('folderId');
  const tipo = searchParams.get('tipo');

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json([]);
    }

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (unitId) where.unitId = unitId;
    if (buildingId) where.buildingId = buildingId;
    if (contractId) where.contractId = contractId;
    if (folderId) where.folderId = folderId;
    if (tipo) where.tipo = tipo;

    const documents = await prisma.document.findMany({
      where,
      include: {
        tenant: { select: { nombreCompleto: true } },
        unit: { select: { numero: true } },
        building: { select: { nombre: true } },
        contract: { select: { id: true } },
        folder: { select: { nombre: true, color: true } },
        _count: {
          select: {
            versions: true,
            shares: true,
          },
        },
      },
      orderBy: { fechaSubida: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    logger.error('Error fetching documents:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const nombre = formData.get('nombre') as string;
    const tipo = formData.get('tipo') as string;
    const tenantId = formData.get('tenantId') as string | null;
    const unitId = formData.get('unitId') as string | null;
    const buildingId = formData.get('buildingId') as string | null;
    const contractId = formData.get('contractId') as string | null;
    const folderId = formData.get('folderId') as string | null;
    const descripcion = formData.get('descripcion') as string | null;
    const tags = formData.get('tags') as string | null;
    const fechaVencimiento = formData.get('fechaVencimiento') as string | null;

    if (!file || !nombre || !tipo) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // Upload file to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `documents/${Date.now()}-${file.name}`;
    const cloudStoragePath = await uploadFile(buffer, fileName);

    // Parse tags
    const tagsArray = tags ? JSON.parse(tags) : [];

    // Create document record
    const document = await prisma.document.create({
      data: {
        nombre,
        tipo: tipo as any,
        cloudStoragePath,
        tenantId: tenantId || undefined,
        unitId: unitId || undefined,
        buildingId: buildingId || undefined,
        contractId: contractId || undefined,
        folderId: folderId || undefined,
        descripcion: descripcion || undefined,
        tags: tagsArray,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
      },
      include: {
        tenant: { select: { nombreCompleto: true } },
        unit: { select: { numero: true } },
        building: { select: { nombre: true } },
        contract: { select: { id: true } },
        folder: { select: { nombre: true, color: true } },
      },
    });

    // Create first version
    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumero: 1,
        cloud_storage_path: cloudStoragePath,
        tamano: file.size,
        uploadedBy: session.user.id,
        comentario: 'Versi\u00f3n inicial',
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    logger.error('Error creating document:', error);
    return NextResponse.json({ error: 'Error al crear documento' }, { status: 500 });
  }
}
