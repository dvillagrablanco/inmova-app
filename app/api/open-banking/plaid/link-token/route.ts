import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createLinkToken, isPlaidConfigured } from '@/lib/plaid-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/plaid/link-token
 * Crea un link_token para iniciar Plaid Link en el frontend
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session.user.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isPlaidConfigured()) {
      return NextResponse.json(
        { error: 'Plaid no configurado', message: 'Contacte al administrador' },
        { status: 503 }
      );
    }

    const result = await createLinkToken({
      userId: session.user.id,
      companyId: session.user.companyId,
    });

    if (!result) {
      return NextResponse.json({ error: 'Error creando link token' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('[Plaid Link Token Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
