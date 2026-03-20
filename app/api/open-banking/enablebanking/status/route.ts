import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  isEnableBankingConfigured,
  testConnection,
  getBankinterInfo,
} from '@/lib/enablebanking-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/enablebanking/status
 * Estado de la integración con Enable Banking.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isEnableBankingConfigured()) {
      return NextResponse.json({
        configured: false,
        connected: false,
        message: 'Enable Banking no configurado',
        setupUrl: 'https://enablebanking.com/dashboard',
        envVars: ['ENABLE_BANKING_APP_ID', 'ENABLE_BANKING_PRIVATE_KEY'],
      });
    }

    const test = await testConnection();
    if (!test.ok) {
      return NextResponse.json({ configured: true, connected: false, error: test.message });
    }

    const bankinter = await getBankinterInfo();

    return NextResponse.json({
      configured: true,
      connected: true,
      message: test.message,
      bankinterAvailable: !!bankinter,
      bankinterName: bankinter?.name || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
