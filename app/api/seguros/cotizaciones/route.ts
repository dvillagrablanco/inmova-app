import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { insuranceComparison } from '@/lib/integrations/insurance-providers';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.propertyValue || !body.coverageTypes) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Get quotes from multiple providers
    const quotes = await insuranceComparison.compareQuotes(body);

    logger.info('Insurance quotes generated', {
      userId: session.user.id,
      propertyValue: body.propertyValue,
      quotesCount: quotes.length,
    });

    return NextResponse.json({
      success: true,
      quotes,
      requestedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error generating quotes:', error);
    return NextResponse.json(
      { error: 'Error al generar cotizaciones', details: error.message },
      { status: 500 }
    );
  }
}
