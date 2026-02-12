import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createRequisition, isNordigenConfigured } from '@/lib/nordigen-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/nordigen/connect
 * Inicia conexión con un banco via Nordigen
 * Body: { institutionId: string, institutionName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session.user.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isNordigenConfigured()) {
      return NextResponse.json({ error: 'Nordigen no configurado' }, { status: 503 });
    }

    const { institutionId, institutionName } = await request.json();
    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId requerido' }, { status: 400 });
    }

    const result = await createRequisition({
      institutionId,
      companyId: session.user.companyId,
      userId: session.user.id,
    });

    if (!result) {
      return NextResponse.json({ error: 'Error creando conexión' }, { status: 500 });
    }

    // Save pending connection to DB
    const prisma = getPrismaClient();
    await prisma.bankConnection.create({
      data: {
        companyId: session.user.companyId,
        userId: session.user.id,
        proveedor: 'nordigen',
        provider: 'nordigen',
        proveedorItemId: result.requisitionId,
        nombreBanco: institutionName || institutionId,
        estado: 'renovacion_requerida', // Pending user auth
        consentId: result.requisitionId,
      },
    });

    logger.info(`[Nordigen] Conexión iniciada: ${result.requisitionId} para ${institutionId}`);

    return NextResponse.json({
      success: true,
      requisitionId: result.requisitionId,
      link: result.link,
      message: 'Redirigir al usuario al link para autorizar acceso bancario',
    });
  } catch (error: any) {
    logger.error('[Nordigen Connect Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
