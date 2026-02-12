import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getInstitutions, isNordigenConfigured } from '@/lib/nordigen-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/nordigen/institutions?country=ES
 * Lista bancos disponibles por país
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isNordigenConfigured()) {
      return NextResponse.json({ error: 'Nordigen no configurado' }, { status: 503 });
    }

    const country = request.nextUrl.searchParams.get('country') || 'ES';
    const institutions = await getInstitutions(country);

    return NextResponse.json({
      success: true,
      country,
      count: institutions.length,
      institutions: institutions.map(i => ({
        id: i.id,
        name: i.name,
        bic: i.bic,
        logo: i.logo,
        transactionDays: i.transaction_total_days,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
