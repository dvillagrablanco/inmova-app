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

export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { provider } = params;

    let result;

    switch (provider) {
      case 'sage':
        result = await getSageService().testConnection();
        break;
      case 'holded':
        result = await getHoldedService().testConnection();
        break;
      case 'a3':
        result = await getA3Service().testConnection();
        break;
      case 'alegra':
        result = await getAlegraService().testConnection();
        break;
      case 'zucchetti':
        result = await getZucchettiService().testConnection();
        break;
      case 'contasimple':
        result = await getContaSimpleService().testConnection();
        break;
      default:
        return NextResponse.json({ error: 'Proveedor no soportado' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('Error testing integration:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Error al probar la conexión' },
      { status: 500 }
    );
  }
}
