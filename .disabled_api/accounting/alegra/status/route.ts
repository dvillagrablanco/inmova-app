export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isAlegraConfigured } from '@/lib/alegra-integration-service';
import logger, { logError } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const isConfigured = isAlegraConfigured();
    
    return NextResponse.json({
      integrated: isConfigured,
      mode: isConfigured ? 'production' : 'demo',
      name: 'Alegra',
      description: 'Software de facturación y contabilidad líder en Latinoamérica',
      features: [
        'Facturación electrónica',
        'Contabilidad en tiempo real',
        'Inventarios',
        'Nómina electrónica',
        'Conciliación bancaria'
      ],
      status: isConfigured ? 'active' : 'demo'
    });
  } catch (error) {
    logger.error('Error checking Alegra status:', error);
    return NextResponse.json(
      { error: 'Error al verificar estado de Alegra' },
      { status: 500 }
    );
  }
}
