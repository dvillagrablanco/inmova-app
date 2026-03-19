import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  isSaltEdgeConfigured,
  createCustomer,
  getCustomerByIdentifier,
  createConnectSession,
} from '@/lib/saltedge-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/saltedge/connect-grupo
 *
 * Inicia la conexión bancaria para TODO el Grupo Vidaro de una vez.
 * Crea un único customer Salt Edge "grupo_vidaro" y genera una URL
 * de autorización que, tras ser completada, importará automáticamente
 * todas las cuentas y las asignará a la sociedad correspondiente
 * basándose en el IBAN.
 *
 * Body: { providerCode?: string }
 *   providerCode puede ser:
 *     - "bankinter_xo_es" → Bankinter (Rovida + Viroda + Vidaro)
 *     - "bbva_xo_es"      → BBVA (Rovida + Viroda + Vidaro)
 *     - undefined         → Salt Edge muestra selector de banco
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isSaltEdgeConfigured()) {
      return NextResponse.json(
        {
          error: 'Salt Edge no configurado',
          help: 'Añadir SALTEDGE_APP_ID y SALTEDGE_SECRET al .env.production',
        },
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

    // Buscar customer_secret en BD (guardado de una conexión anterior del grupo)
    const existingConn = await prisma.bankConnection.findFirst({
      where: { proveedor: 'saltedge', estado: { not: 'error' } },
      select: { refreshToken: true },
      orderBy: { createdAt: 'desc' },
    });

    let customerSecret: string;

    if (existingConn?.refreshToken) {
      customerSecret = existingConn.refreshToken;
      logger.info('[SaltEdge Grupo] Reutilizando customer existente');
    } else {
      let customer = await getCustomerByIdentifier(GRUPO_IDENTIFIER);
      if (!customer) {
        customer = await createCustomer(GRUPO_IDENTIFIER);
      }
      customerSecret = customer.secret;
      logger.info(`[SaltEdge Grupo] Customer: ${customer.id}`);
    }

    // 2. Crear connect session
    const connectSession = await createConnectSession({
      customerSecret,
      providerCode,
      callbackUrl,
      companyId: session.user.companyId,
    });

    // 3. Registrar conexión pendiente en BD
    await prisma.bankConnection.create({
      data: {
        companyId: session.user.companyId,
        userId: session.user.id,
        proveedor: 'saltedge',
        provider: 'saltedge',
        proveedorItemId: '',
        nombreBanco: providerCode
          ? providerCode.replace(/_xo_es$/, '').replace(/_/g, ' ')
          : 'Grupo Vidaro — por conectar',
        estado: 'renovacion_requerida',
        refreshToken: customerSecret,
        consentId: '',
        errorDetalle: `Conexión grupo. providerCode: ${providerCode || 'sin_filtro'}`,
      },
    });

    const bankLabel = providerCode
      ? providerCode.replace(/_xo_es$/, '').replace(/_/g, ' ')
      : 'banco seleccionable';

    return NextResponse.json({
      success: true,
      connectUrl: connectSession.connectUrl,
      expiresAt: connectSession.expiresAt,
      message: `Redirigir al usuario a connectUrl para autorizar ${bankLabel}. Todas las cuentas del Grupo Vidaro en ese banco se conectarán automáticamente.`,
      grupoIdentifier: GRUPO_IDENTIFIER,
    });
  } catch (error: any) {
    logger.error('[SaltEdge Connect Grupo Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
