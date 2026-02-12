import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { exchangePublicToken, getAccounts, isPlaidConfigured, getPlaidEnv } from '@/lib/plaid-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/plaid/exchange
 * Intercambia el public_token por access_token y guarda la conexión en BD
 * Body: { publicToken: string, institutionName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session.user.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isPlaidConfigured()) {
      return NextResponse.json({ error: 'Plaid no configurado' }, { status: 503 });
    }

    const { publicToken, institutionName } = await request.json();
    if (!publicToken) {
      return NextResponse.json({ error: 'publicToken requerido' }, { status: 400 });
    }

    // Exchange token
    const result = await exchangePublicToken(publicToken);
    if (!result) {
      return NextResponse.json({ error: 'Error intercambiando token' }, { status: 500 });
    }

    // Get accounts info
    const accountsData = await getAccounts(result.accessToken);

    // Save to database
    const prisma = getPrismaClient();
    const connection = await prisma.bankConnection.create({
      data: {
        companyId: session.user.companyId,
        userId: session.user.id,
        proveedor: 'plaid',
        provider: 'plaid',
        proveedorItemId: result.itemId,
        accessToken: result.accessToken,
        nombreBanco: institutionName || 'Banco conectado via Plaid',
        estado: 'conectado',
        ultimaSincronizacion: new Date(),
        cuentas: accountsData?.accounts ? JSON.stringify(accountsData.accounts) : '[]',
      },
    });

    logger.info(`[Plaid] Conexión creada: ${connection.id} para company ${session.user.companyId}`);

    return NextResponse.json({
      success: true,
      connectionId: connection.id,
      accounts: accountsData?.accounts || [],
      message: `Banco conectado: ${institutionName || 'OK'}`,
    });
  } catch (error: any) {
    logger.error('[Plaid Exchange Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
