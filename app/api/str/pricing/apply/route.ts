export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, price } = body;

    // TODO: Implementar actualización real en base de datos
    // TODO: Sincronizar con APIs de Airbnb, Booking, etc.
    logger.info(`Applying price €${price} to listing ${listingId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Precio actualizado correctamente' 
    });
  } catch (error) {
    logger.error('Error applying pricing:', error);
    return NextResponse.json(
      { error: 'Error al aplicar precio' },
      { status: 500 }
    );
  }
}
