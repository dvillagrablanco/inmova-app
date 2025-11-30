import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isSageConfigured } from '@/lib/sage-integration-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const isConfigured = isSageConfigured();
    
    return NextResponse.json({
      integrated: isConfigured,
      mode: isConfigured ? 'production' : 'demo',
      name: 'Sage',
      description: 'Líder mundial en software de contabilidad y ERP',
      features: [
        'Gestión de clientes',
        'Facturación automática',
        'Registro de pagos',
        'Control de gastos',
        'Integración bancaria'
      ],
      status: isConfigured ? 'active' : 'demo'
    });
  } catch (error) {
    console.error('Error checking Sage status:', error);
    return NextResponse.json(
      { error: 'Error al verificar estado de Sage' },
      { status: 500 }
    );
  }
}
