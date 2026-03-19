import { NextRequest, NextResponse } from 'next/server';
import { listAccounts, getConnection } from '@/lib/saltedge-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/saltedge/callback
 *
 * Salt Edge redirige aquí después de que el usuario autoriza el acceso al banco.
 * Parámetros devueltos por Salt Edge:
 *   - connection_id: ID de la conexión creada
 *   - connection_secret: Secret de la conexión (para acceso a cuentas)
 *   - stage: "success" | "error" | "fetching"
 *   - error: si hay error
 *
 * También pasan los parámetros que añadimos en return_to:
 *   - companyId
 *   - userId
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const stage = params.get('stage');
  const connectionId = params.get('connection_id');
  const connectionSecret = params.get('connection_secret');
  const companyId = params.get('companyId');
  const errorMessage = params.get('error');

  // Siempre redirigir a la UI con el resultado
  const redirectBase = '/finanzas/bancaria-setup';

  if (stage === 'error' || errorMessage) {
    logger.warn(`[SaltEdge Callback] Error: ${errorMessage}`);
    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=saltedge&error=${encodeURIComponent(errorMessage || 'auth_failed')}`,
        request.url
      )
    );
  }

  if (stage === 'fetching') {
    // Salt Edge está importando transacciones — redirigir con estado pendiente
    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=saltedge&status=fetching&connection_id=${connectionId}`,
        request.url
      )
    );
  }

  if (!connectionId || !connectionSecret || !companyId) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=saltedge&error=missing_params`, request.url)
    );
  }

  try {
    const prisma = getPrismaClient();

    // Obtener detalles de la conexión (nombre del banco, estado)
    const connection = await getConnection(connectionId, connectionSecret);
    const bankName = connection?.providerName || connectionId;

    // Actualizar la BankConnection pendiente más reciente de esta empresa
    const pendingConnection = await prisma.bankConnection.findFirst({
      where: {
        companyId,
        proveedor: 'saltedge',
        estado: 'renovacion_requerida',
        proveedorItemId: '',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingConnection) {
      await prisma.bankConnection.update({
        where: { id: pendingConnection.id },
        data: {
          estado: 'conectado',
          proveedorItemId: connectionId,
          accessToken: connectionId, // usar connectionId como accessToken para las llamadas
          consentId: connectionSecret, // guardar connection_secret en consentId
          refreshToken: pendingConnection.refreshToken, // mantener customer_secret
          nombreBanco: bankName,
          ultimaSync: new Date(),
        },
      });
    } else {
      // Crear nueva entrada si no hay pendiente
      await prisma.bankConnection.create({
        data: {
          companyId,
          proveedor: 'saltedge',
          provider: 'saltedge',
          proveedorItemId: connectionId,
          accessToken: connectionId,
          consentId: connectionSecret,
          nombreBanco: bankName,
          estado: 'conectado',
          ultimaSync: new Date(),
        },
      });
    }

    // Obtener cuentas para informar al usuario
    const accounts = await listAccounts(connectionId, connectionSecret);
    const ibanList = accounts
      .map((a) => a.extra?.iban || a.iban)
      .filter(Boolean)
      .join(', ');

    logger.info(`[SaltEdge Callback] OK: ${bankName} con ${accounts.length} cuentas (${ibanList})`);

    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=saltedge&success=bank_connected&bank=${encodeURIComponent(bankName)}&accounts=${accounts.length}`,
        request.url
      )
    );
  } catch (error: any) {
    logger.error('[SaltEdge Callback Error]:', error);
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=saltedge&error=callback_failed`, request.url)
    );
  }
}
