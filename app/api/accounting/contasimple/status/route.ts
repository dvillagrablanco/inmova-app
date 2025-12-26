export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isContaSimpleConfigured } from '@/lib/contasimple-integration-service';
import logger, { logError } from '@/lib/logger';

/**
 * GET /api/accounting/contasimple/status
 * Verifica el estado de la configuración de ContaSimple
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const configured = isContaSimpleConfigured();

    return NextResponse.json({
      configured,
      provider: 'ContaSimple',
      status: configured ? 'ready' : 'pending_configuration',
      features: [
        'Sincronización de clientes',
        'Generación de facturas',
        'Registro de pagos',
        'Registro de gastos',
        'Contabilidad simplificada',
      ],
      message: configured
        ? 'La integración con ContaSimple está lista para usar.'
        : 'Para activar la integración, configure las credenciales en variables de entorno.',
    });
  } catch (error) {
    logger.error('Error al verificar estado de ContaSimple:', error);
    return NextResponse.json({ error: 'Error al verificar el estado' }, { status: 500 });
  }
}
