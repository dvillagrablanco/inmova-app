import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { uploadFile } from '@/lib/s3';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const queryCompanyId = searchParams.get('companyId');
  const userRole = (session.user as any).role;
  const sessionCompanyId = session.user.companyId;
  const companyId =
    queryCompanyId && (userRole === 'super_admin' || userRole === 'soporte')
      ? queryCompanyId
      : sessionCompanyId;
  if (!companyId) {
    return NextResponse.json({ error: 'Empresa no válida' }, { status: 400 });
  }
  const tenantId = searchParams.get('tenantId');
  const unitId = searchParams.get('unitId');
  const buildingId = searchParams.get('buildingId');
  const contractId = searchParams.get('contractId');
  const folderId = searchParams.get('folderId');
  const tipo = searchParams.get('tipo');

  try {
    const whereFilters: any = {};
    if (tenantId) whereFilters.tenantId = tenantId;
    if (unitId) whereFilters.unitId = unitId;
    if (buildingId) whereFilters.buildingId = buildingId;
    if (contractId) whereFilters.contractId = contractId;
    if (folderId) whereFilters.folderId = folderId;
    if (tipo) whereFilters.tipo = tipo;

    const companyScope = {
      OR: [
        { building: { companyId } },
        { unit: { building: { companyId } } },
        { tenant: { companyId } },
        { contract: { unit: { building: { companyId } } } },
        { folder: { companyId } },
      ],
    };

    const where =
      Object.keys(whereFilters).length > 0
        ? { AND: [companyScope, whereFilters] }
        : companyScope;

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
    return NextResponse.json({ error: 'Error al obtener documentos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const queryCompanyId = searchParams.get('companyId');
    const userRole = (session.user as any).role;
    const sessionCompanyId = session.user.companyId;
    const companyId =
      queryCompanyId && (userRole === 'super_admin' || userRole === 'soporte')
        ? queryCompanyId
        : sessionCompanyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no válida' }, { status: 400 });
    }
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

    const [tenant, unit, building, contract, folder] = await Promise.all([
      tenantId
        ? prisma.tenant.findFirst({ where: { id: tenantId, companyId } })
        : Promise.resolve(null),
      unitId
        ? prisma.unit.findFirst({ where: { id: unitId, building: { companyId } } })
        : Promise.resolve(null),
      buildingId
        ? prisma.building.findFirst({ where: { id: buildingId, companyId } })
        : Promise.resolve(null),
      contractId
        ? prisma.contract.findFirst({
            where: { id: contractId, unit: { building: { companyId } } },
          })
        : Promise.resolve(null),
      folderId
        ? prisma.documentFolder.findFirst({ where: { id: folderId, companyId } })
        : Promise.resolve(null),
    ]);

    if (tenantId && !tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }
    if (unitId && !unit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }
    if (buildingId && !building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }
    if (contractId && !contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }
    if (folderId && !folder) {
      return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
    }

    let resolvedFolderId = folderId || undefined;
    const hasRelation = tenantId || unitId || buildingId || contractId || folderId;

    if (!hasRelation) {
      const defaultFolder =
        folder ||
        (await prisma.documentFolder.findFirst({
          where: { companyId, nombre: 'General', parentFolderId: null },
        }));

      if (defaultFolder) {
        resolvedFolderId = defaultFolder.id;
      } else {
        const createdFolder = await prisma.documentFolder.create({
          data: {
            companyId,
            nombre: 'General',
            descripcion: 'Documentos generales',
            color: '#111827',
            icono: 'Folder',
          },
        });
        resolvedFolderId = createdFolder.id;
      }
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
        folderId: resolvedFolderId,
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
