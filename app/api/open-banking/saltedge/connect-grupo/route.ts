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
 * POST /api/open-banking/saltedge/connect-grupo
 *
 * Inicia la conexión bancaria para TODO el Grupo Vidaro (API v6).
 * Crea un único customer Salt Edge "grupo_vidaro" y genera la URL
 * del widget de conexión. Tras la autorización, el callback detecta
 * automáticamente los IBANs y los asigna a cada sociedad.
 *
 * Body: { providerCode?: string }
 *   "bankinter_es" → Bankinter (Rovida + Viroda + Vidaro)
 *   "santander_es" → Santander (Vidaro)
 *   etc.
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inmovaapp.com';
    const callbackUrl = `${appUrl}/api/open-banking/saltedge/callback?companyId=${session.user.companyId}&userId=${session.user.id}`;

    // 1. Obtener o crear customer del grupo
    const GRUPO_IDENTIFIER = 'grupo_vidaro';
    const prisma = getPrismaClient();

    // Buscar customer_id en BD
    const existingConn = await prisma.bankConnection.findFirst({
      where: { proveedor: 'saltedge', refreshToken: { not: null } },
      select: { refreshToken: true },
      orderBy: { createdAt: 'desc' },
    });

    let customerId: string;

    if (existingConn?.refreshToken && !existingConn.refreshToken.startsWith('pending_')) {
      customerId = existingConn.refreshToken;
      logger.info(`[SaltEdge Grupo] Reutilizando customer_id: ${customerId}`);
    } else {
      let customer = await getCustomerByIdentifier(GRUPO_IDENTIFIER);
      if (!customer) {
        customer = await createCustomer(GRUPO_IDENTIFIER);
      }
      customerId = customer.id;
      logger.info(`[SaltEdge Grupo] Customer: ${customerId}`);
    }

    // 2. Generar URL del widget (v6: URL directa)
    const connectUrl = generateConnectUrl({
      customerId,
      callbackUrl,
      providerCode,
      countryCode: 'ES',
    });

    // 3. Registrar conexión pendiente en BD
    await prisma.bankConnection.create({
      data: {
        companyId: session.user.companyId,
        userId: session.user.id,
        proveedor: 'saltedge',
        provider: 'saltedge',
        proveedorItemId: `pending_grupo_${Date.now()}`,
        nombreBanco: providerCode?.replace(/_es$/, '').replace(/_/g, ' ') || 'Grupo Vidaro',
        estado: 'renovacion_requerida',
        refreshToken: customerId,
        consentId: null,
        errorDetalle: `Conexión grupo. providerCode: ${providerCode || 'selector'}`,
      },
    });

    const bankLabel = providerCode?.replace(/_es$/, '').replace(/_/g, ' ') || 'selector de banco';

    return NextResponse.json({
      success: true,
      connectUrl,
      message: `Redirigir a connectUrl para autorizar ${bankLabel}. Salt Edge detectará automáticamente las cuentas de todas las sociedades del grupo.`,
      customerId,
    });
  } catch (error: any) {
    logger.error('[SaltEdge Connect Grupo Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
