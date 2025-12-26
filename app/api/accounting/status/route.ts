import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSageService } from '@/lib/sage-integration-service';
import { getHoldedService } from '@/lib/holded-integration-service';
import { getA3Service } from '@/lib/a3-integration-service';
import { getAlegraService } from '@/lib/alegra-integration-service';
import { getZucchettiService } from '@/lib/zucchetti-integration-service';
import { getContaSimpleService } from '@/lib/contasimple-integration-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const status = {
      sage: {
        connected: getSageService().isConfigured(),
        name: 'Sage 50cloud / Sage 200cloud',
      },
      holded: {
        connected: getHoldedService().isConfigured(),
        name: 'Holded',
      },
      a3: {
        connected: getA3Service().isConfigured(),
        name: 'A3 Software',
      },
      alegra: {
        connected: getAlegraService().isConfigured(),
        name: 'Alegra',
      },
      zucchetti: {
        connected: getZucchettiService().isConfigured(),
        name: 'Zucchetti',
      },
      contasimple: {
        connected: getContaSimpleService().isConfigured(),
        name: 'ContaSimple',
      },
    };

    return NextResponse.json(status);
  } catch (error: any) {
    logger.error('Error checking integration status:', error);
    return NextResponse.json(
      { error: 'Error al verificar el estado de las integraciones', details: error.message },
      { status: 500 }
    );
  }
}
