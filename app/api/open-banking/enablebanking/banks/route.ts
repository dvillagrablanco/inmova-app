import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isEnableBankingConfigured, getBanks } from '@/lib/enablebanking-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/enablebanking/banks?country=ES
 * Lista bancos disponibles.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isEnableBankingConfigured()) {
      return NextResponse.json({ error: 'Enable Banking no configurado' }, { status: 503 });
    }

    const country = request.nextUrl.searchParams.get('country') || 'ES';
    const banks = await getBanks(country);

    return NextResponse.json({
      success: true,
      country,
      count: banks.length,
      banks: banks.map((b) => ({
        name: b.name,
        country: b.country,
        bic: b.bic,
        logo: b.logo,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
