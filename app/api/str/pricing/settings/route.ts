export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // TODO: Implementar desde base de datos
    const settings = {
      autoPricingEnabled: false,
      minPrice: 50,
      maxPrice: 200,
      strategy: 'balanced',
    };

    return NextResponse.json(settings);
  } catch (error) {
    logger.error('Error fetching pricing settings:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // TODO: Guardar en base de datos
    logger.info('Updating pricing settings:', body);

    return NextResponse.json({ 
      success: true, 
      message: 'Configuración actualizada' 
    });
  } catch (error) {
    logger.error('Error updating pricing settings:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}
