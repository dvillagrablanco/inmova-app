import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isSaltEdgeConfigured, testConnection, getBankinterProvider } from '@/lib/saltedge-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/saltedge/status
 * Verifica el estado de la integración con Salt Edge
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isSaltEdgeConfigured()) {
      return NextResponse.json({
        configured: false,
        connected: false,
        message: 'Salt Edge no configurado',
        setupUrl: 'https://www.saltedge.com/partner_program',
        envVars: ['SALTEDGE_APP_ID', 'SALTEDGE_SECRET'],
      });
    }

    const test = await testConnection();

    if (!test.ok) {
      return NextResponse.json({
        configured: true,
        connected: false,
        error: test.message,
      });
    }

    const bankinter = await getBankinterProvider();

    return NextResponse.json({
      configured: true,
      connected: true,
      message: test.message,
      bankinterAvailable: !!bankinter,
      bankinterCode: bankinter?.code || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
