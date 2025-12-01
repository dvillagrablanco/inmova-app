export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isA3Configured } from '@/lib/a3-integration-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const isConfigured = isA3Configured();
    
    return NextResponse.json({
      integrated: isConfigured,
      mode: isConfigured ? 'production' : 'demo',
      name: 'A3 Software',
      description: 'ERP líder en España para pymes y grandes empresas',
      features: [
        'Contabilidad integral',
        'Gestión financiera',
        'Nóminas',
        'Facturación electrónica',
        'Cumplimiento fiscal'
      ],
      status: isConfigured ? 'active' : 'demo'
    });
  } catch (error) {
    console.error('Error checking A3 status:', error);
    return NextResponse.json(
      { error: 'Error al verificar estado de A3' },
      { status: 500 }
    );
  }
}
