import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isZucchettiConfigured } from '@/lib/zucchetti-integration-service';

/**
 * GET /api/accounting/zucchetti/status
 * Verifica el estado de la configuración de Zucchetti
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const configured = isZucchettiConfigured();

    return NextResponse.json({
      configured,
      provider: 'Zucchetti',
      status: configured ? 'ready' : 'pending_configuration',
      features: [
        'Sincronización de clientes',
        'Generación de facturas',
        'Registro de pagos',
        'Contabilidad avanzada',
      ],
      message: configured
        ? 'La integración con Zucchetti está lista para usar.'
        : 'Para activar la integración, configure las credenciales en variables de entorno.',
    });
  } catch (error) {
    console.error('Error al verificar estado de Zucchetti:', error);
    return NextResponse.json(
      { error: 'Error al verificar el estado' },
      { status: 500 }
    );
  }
}
