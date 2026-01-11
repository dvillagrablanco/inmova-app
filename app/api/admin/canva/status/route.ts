import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Solo super_admin puede ver el estado
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si Canva está configurado
    const canvaClientId = process.env.CANVA_CLIENT_ID;
    const canvaClientSecret = process.env.CANVA_CLIENT_SECRET;
    const canvaAccessToken = process.env.CANVA_ACCESS_TOKEN;

    const configured = Boolean(canvaClientId && canvaClientSecret);
    const connected = Boolean(canvaAccessToken);

    return NextResponse.json({
      configured,
      connected,
      clientId: canvaClientId ? 'Configurado' : 'No configurado',
      features: {
        createDesigns: connected,
        exportDesigns: connected,
        brandKit: connected,
        templates: true, // Plantillas locales siempre disponibles
      },
      pricing: {
        plan: 'Canva Pro',
        cost: '€11.99/mes',
        features: ['Acceso API completo', 'Kit de marca', 'Plantillas premium'],
      },
      documentation: 'https://www.canva.dev/docs/connect/',
    });
  } catch (error: any) {
    console.error('[Canva Status Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estado de Canva' },
      { status: 500 }
    );
  }
}
