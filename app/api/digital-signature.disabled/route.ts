import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { crearSolicitudFirma } from '@/lib/digital-signature-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/digital-signature
 * Obtiene documentos de firma con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const contractId = searchParams.get('contractId');
    const tenantId = searchParams.get('tenantId');

    const where: any = {
      companyId: session.user.companyId,
    };

    if (estado) {
      where.estado = estado;
    }

    if (contractId) {
      where.contractId = contractId;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const documentos = await prisma.documentoFirma.findMany({
      where,
      include: {
        firmantes: true,
        tenant: true,
        contract: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(documentos);
  } catch (error) {
    logger.error('Error obteniendo documentos de firma:', error);
    return NextResponse.json({ error: 'Error obteniendo documentos' }, { status: 500 });
  }
}

/**
 * POST /api/digital-signature
 * Crea una nueva solicitud de firma digital
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo administradores y gestores
    if (!['administrador', 'gestor'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No tiene permisos para crear solicitudes de firma' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      contractId,
      tenantId,
      titulo,
      tipoDocumento,
      documentUrl,
      mensaje,
      firmantes,
      diasExpiracion = 30,
    } = body;

    if (!titulo || !tipoDocumento || !documentUrl || !firmantes || firmantes.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const result = await crearSolicitudFirma({
      companyId: session.user.companyId,
      contractId,
      tenantId,
      titulo,
      tipoDocumento,
      documentUrl,
      mensaje,
      firmantes,
      creadoPor: session.user.id,
      diasExpiracion,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logger.error('Error creando solicitud de firma:', error);
    return NextResponse.json({ error: 'Error creando solicitud de firma' }, { status: 500 });
  }
}
