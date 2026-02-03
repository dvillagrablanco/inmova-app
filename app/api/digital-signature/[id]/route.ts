import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no encontrado' }, { status: 400 });
    }

    const documento = await prisma.documentoFirma.findFirst({
      where: { id: params.id, companyId },
      include: {
        firmantes: { orderBy: { orden: 'asc' } },
        tenant: { select: { nombreCompleto: true } },
        contract: {
          include: {
            unit: {
              include: {
                building: { select: { nombre: true } },
              },
            },
          },
        },
      },
    });

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ documento: mapDocumentoForUI(documento) });
  } catch (error) {
    logger.error('[digital-signature] Error loading detail:', error);
    return NextResponse.json({ error: 'Error al cargar el detalle' }, { status: 500 });
  }
}

function mapDocumentoForUI(documento: any) {
  return {
    id: documento.id,
    titulo: documento.titulo,
    tipoDocumento: documento.tipoDocumento,
    estado: mapSignatureStatus(documento.estado),
    documentUrl: documento.urlDocumento || '',
    fechaExpiracion: documento.fechaExpiracion?.toISOString?.() || documento.fechaExpiracion,
    createdAt: documento.createdAt?.toISOString?.() || documento.createdAt,
    firmantes:
      documento.firmantes?.map((firmante: any) => ({
        id: firmante.id,
        nombre: firmante.nombre,
        email: firmante.email,
        rol: firmante.rol,
        estado: firmante.estado,
      })) || [],
    tenant: documento.tenant ? { nombreCompleto: documento.tenant.nombreCompleto } : undefined,
    contract: documento.contract
      ? {
          unit: {
            numero: documento.contract.unit?.numero,
            building: { nombre: documento.contract.unit?.building?.nombre },
          },
        }
      : undefined,
  };
}

function mapSignatureStatus(status?: string) {
  switch (status) {
    case 'PENDING':
      return 'pendiente';
    case 'SIGNED':
      return 'firmado';
    case 'DECLINED':
      return 'rechazado';
    case 'EXPIRED':
      return 'expirado';
    case 'CANCELLED':
      return 'cancelado';
    default:
      return status || 'pendiente';
  }
}
