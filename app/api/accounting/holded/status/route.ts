export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isHoldedConfigured } from '@/lib/holded-integration-service';
import logger, { logError } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const isConfigured = isHoldedConfigured();

    return NextResponse.json({
      integrated: isConfigured,
      mode: isConfigured ? 'production' : 'demo',
      name: 'Holded',
      description: 'Software de gestión empresarial todo-en-uno',
      features: [
        'Facturación electrónica',
        'Gestión de clientes y proveedores',
        'Control de gastos',
        'Proyectos y CRM',
        'Integración bancaria',
      ],
      status: isConfigured ? 'active' : 'demo',
    });
  } catch (error) {
    logger.error('Error checking Holded status:', error);
    return NextResponse.json({ error: 'Error al verificar estado de Holded' }, { status: 500 });
  }
}
