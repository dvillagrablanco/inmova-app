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
 * POST /api/open-banking/saltedge/connect
 *
 * Inicia el flujo de conexión bancaria con Salt Edge.
 * Crea (o reutiliza) el customer de Salt Edge para la empresa,
 * genera una sesión de conexión y devuelve la URL de redirección.
 *
 * Body: { providerCode?: string, companyId?: string }
 * Returns: { connectUrl: string, expiresAt: string }
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
          help: 'Registrarse en https://www.saltedge.com/partner_program y añadir SALTEDGE_APP_ID + SALTEDGE_SECRET al .env.production',
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const providerCode: string | undefined = body.providerCode;
    const targetCompanyId: string = body.companyId || session.user.companyId;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inmovaapp.com';
    const callbackUrl = `${appUrl}/api/open-banking/saltedge/callback?companyId=${targetCompanyId}&userId=${session.user.id}`;

    // 1. Obtener o crear customer de Salt Edge para esta empresa
    let customerSecret: string;

    const prisma = getPrismaClient();
    const existingConnection = await prisma.bankConnection.findFirst({
      where: {
        companyId: targetCompanyId,
        proveedor: 'saltedge',
      },
      select: { proveedorItemId: true, refreshToken: true },
      orderBy: { createdAt: 'desc' },
    });

    if (existingConnection?.proveedorItemId && existingConnection?.refreshToken) {
      // Reutilizar customer existente
      customerSecret = existingConnection.refreshToken;
      logger.info(`[SaltEdge] Reutilizando customer ${existingConnection.proveedorItemId}`);
    } else {
      // Crear nuevo customer (identifier = companyId de Inmova)
      const identifier = `inmova_${targetCompanyId}`;
      let existingCustomer = await getCustomerByIdentifier(identifier);

      if (!existingCustomer) {
        existingCustomer = await createCustomer(identifier);
      }

      customerSecret = existingCustomer.secret;

      logger.info(
        `[SaltEdge] Customer listo: ${existingCustomer.id} para company ${targetCompanyId}`
      );
    }

    // 2. Crear connect session
    const connectSession = await createConnectSession({
      customerSecret,
      providerCode,
      callbackUrl,
      companyId: targetCompanyId,
    });

    // 3. Guardar estado pendiente en BD
    await prisma.bankConnection.create({
      data: {
        companyId: targetCompanyId,
        userId: session.user.id,
        proveedor: 'saltedge',
        provider: 'saltedge',
        proveedorItemId: '', // se rellena en el callback
        nombreBanco: providerCode
          ? providerCode.replace(/_xo_es$/, '').replace(/_/g, ' ')
          : 'Por conectar',
        estado: 'renovacion_requerida',
        refreshToken: customerSecret, // guardar customer_secret para futuras llamadas
        consentId: '', // se rellena en callback
      },
    });

    return NextResponse.json({
      success: true,
      connectUrl: connectSession.connectUrl,
      expiresAt: connectSession.expiresAt,
      message: 'Redirigir al usuario a connectUrl para autorizar el acceso bancario',
    });
  } catch (error: any) {
    logger.error('[SaltEdge Connect Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
