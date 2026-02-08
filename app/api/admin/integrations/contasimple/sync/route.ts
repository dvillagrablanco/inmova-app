import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const authKey = process.env.INMOVA_CONTASIMPLE_AUTH_KEY;
    
    if (!authKey) {
      return NextResponse.json({
        success: false,
        error: 'No hay credenciales configuradas',
        synced: 0,
      });
    }

    // Import the bridge service dynamically
    try {
      const { getInmovaContasimpleBridge } = await import('@/lib/inmova-contasimple-bridge');
      const inmovaContasimpleBridge = getInmovaContasimpleBridge();
      
      if (!inmovaContasimpleBridge.isConfigured()) {
        return NextResponse.json({
          success: false,
          error: 'Contasimple no está configurado',
          synced: 0,
        });
      }

      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 12);

      const result = await inmovaContasimpleBridge.syncPendingInvoices(
        startDate,
        endDate
      );
      
      return NextResponse.json({
        success: true,
        synced: result.synced,
        errors: result.errors,
        message: `${result.synced} facturas sincronizadas, ${result.errors} errores`,
      });
    } catch (importError) {
      logger.error('Error importing bridge:', importError);
      return NextResponse.json({
        success: false,
        error: 'Error al cargar el servicio de sincronización',
        synced: 0,
      });
    }
  } catch (error) {
    logger.error('Error syncing invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Error sincronizando facturas', synced: 0 },
      { status: 500 }
    );
  }
}
