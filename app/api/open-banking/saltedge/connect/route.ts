import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  isSaltEdgeConfigured,
  createCustomer,
  getCustomerByIdentifier,
  generateConnectUrl,
} from '@/lib/saltedge-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/saltedge/connect
 *
 * Inicia el flujo de conexión bancaria con Salt Edge (API v6).
 * Crea (o reutiliza) el customer de Salt Edge para el grupo y genera
 * la URL del widget de conexión.
 *
 * Body: { providerCode?: string, companyId?: string }
 * Returns: { connectUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isSaltEdgeConfigured()) {
      return NextResponse.json(
        { error: 'Salt Edge no configurado — añadir SALTEDGE_APP_ID y SALTEDGE_SECRET' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const providerCode: string | undefined = body.providerCode;
    const targetCompanyId: string = body.companyId || session.user.companyId;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inmovaapp.com';
    const callbackUrl = `${appUrl}/api/open-banking/saltedge/callback?companyId=${targetCompanyId}&userId=${session.user.id}`;

    // 1. Obtener o crear customer de Salt Edge para el grupo
    const GRUPO_IDENTIFIER = 'grupo_vidaro';
    const prisma = getPrismaClient();

    // Buscar customer_id existente en BD
    const existingConn = await prisma.bankConnection.findFirst({
      where: { proveedor: 'saltedge', refreshToken: { not: null } },
      select: { refreshToken: true },
      orderBy: { createdAt: 'desc' },
    });

    let customerId: string;

    if (existingConn?.refreshToken) {
      customerId = existingConn.refreshToken;
      logger.info(`[SaltEdge] Reutilizando customer_id: ${customerId}`);
    } else {
      let customer = await getCustomerByIdentifier(GRUPO_IDENTIFIER);
      if (!customer) {
        customer = await createCustomer(GRUPO_IDENTIFIER);
      }
      customerId = customer.id;
      logger.info(`[SaltEdge] Customer: ${customerId} (${GRUPO_IDENTIFIER})`);
    }

    // 2. Generar URL del widget (v6: URL directa, sin API call)
    const connectUrl = generateConnectUrl({
      customerId,
      callbackUrl,
      providerCode,
      countryCode: 'ES',
    });

    // 3. Registrar conexión pendiente en BD
    await prisma.bankConnection.create({
      data: {
        companyId: targetCompanyId,
        userId: session.user.id,
        proveedor: 'saltedge',
        provider: 'saltedge',
        proveedorItemId: `pending_${Date.now()}_${targetCompanyId}`,
        nombreBanco: providerCode?.replace(/_es$/, '').replace(/_/g, ' ') || 'Por conectar',
        estado: 'renovacion_requerida',
        refreshToken: customerId, // guardamos customer_id aquí
        consentId: null,
      },
    });

    return NextResponse.json({
      success: true,
      connectUrl,
      message: 'Redirigir al usuario a connectUrl para autorizar el acceso bancario',
    });
  } catch (error: any) {
    logger.error('[SaltEdge Connect Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
