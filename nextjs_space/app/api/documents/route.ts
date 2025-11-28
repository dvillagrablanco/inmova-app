import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { uploadFile, deleteFile } from '@/lib/s3';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const unitId = searchParams.get('unitId');
  const buildingId = searchParams.get('buildingId');
  const contractId = searchParams.get('contractId');
  const tipo = searchParams.get('tipo');

  try {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (unitId) where.unitId = unitId;
    if (buildingId) where.buildingId = buildingId;
    if (contractId) where.contractId = contractId;
    if (tipo) where.tipo = tipo;

    const documents = await prisma.document.findMany({
      where,
      include: {
        tenant: { select: { nombreCompleto: true } },
        unit: { select: { numero: true } },
        building: { select: { nombre: true } },
        contract: { select: { id: true } },
      },
      orderBy: { fechaSubida: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Error al obtener documentos' }, { status: 500 });
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
    const fechaVencimiento = formData.get('fechaVencimiento') as string | null;

    if (!file || !nombre || !tipo) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // Upload file to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `documents/${Date.now()}-${file.name}`;
    const cloudStoragePath = await uploadFile(buffer, fileName);

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
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
      },
      include: {
        tenant: { select: { nombreCompleto: true } },
        unit: { select: { numero: true } },
        building: { select: { nombre: true } },
        contract: { select: { id: true } },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Error al crear documento' }, { status: 500 });
  }
}