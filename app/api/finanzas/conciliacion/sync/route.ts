/**
 * API: /api/finanzas/conciliacion/sync
 * 
 * POST - Sincroniza transacciones de todas las cuentas bancarias conectadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { connectionId, diasAtras = 30 } = await request.json();

    // Obtener conexiones a sincronizar
    const whereClause: any = {
      companyId,
      estado: 'conectado'
    };

    if (connectionId) {
      whereClause.id = connectionId;
    }

    const connections = await prisma.bankConnection.findMany({
      where: whereClause
    });

    if (connections.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No hay cuentas bancarias conectadas para sincronizar'
      });
    }

    let totalSynced = 0;
    const results: any[] = [];

    for (const connection of connections) {
      try {
        // Verificar si el proveedor tiene servicio de sincronización
        if (connection.proveedor === 'bankinter_redsys' || connection.proveedor === 'bankinter') {
          // Intentar sincronizar con Bankinter
          const syncResult = await syncBankinterConnection(connection.id, diasAtras);
          totalSynced += syncResult.count;
          results.push({
            connectionId: connection.id,
            bank: connection.nombreBanco,
            synced: syncResult.count,
            status: 'success'
          });
        } else {
          // Para otros proveedores, simular que ya están sincronizados
          results.push({
            connectionId: connection.id,
            bank: connection.nombreBanco,
            synced: 0,
            status: 'provider_not_supported'
          });
        }

        // Actualizar última sincronización
        await prisma.bankConnection.update({
          where: { id: connection.id },
          data: { ultimaSync: new Date() }
        });
      } catch (connError: any) {
        logger.error(`Error sincronizando conexión ${connection.id}:`, connError);
        results.push({
          connectionId: connection.id,
          bank: connection.nombreBanco,
          synced: 0,
          status: 'error',
          error: connError.message
        });
      }
    }

    logger.info(`Sincronización completada: ${totalSynced} transacciones de ${connections.length} cuentas`);

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      accounts: results,
      message: `${totalSynced} transacciones sincronizadas de ${connections.length} cuentas`
    });
  } catch (error: any) {
    logger.error('Error en sincronización:', error);
    return NextResponse.json(
      { error: 'Error en sincronización', details: error.message },
      { status: 500 }
    );
  }
}

// Función auxiliar para sincronizar con Bankinter
async function syncBankinterConnection(connectionId: string, diasAtras: number): Promise<{ count: number }> {
  try {
    // Verificar si el servicio de Bankinter está configurado
    const { bankinterService, isBankinterConfigured } = await import('@/lib/bankinter-integration-service');
    
    if (!isBankinterConfigured()) {
      logger.warn('Servicio Bankinter no configurado');
      return { count: 0 };
    }

    const resultado = await bankinterService.sincronizarTransaccionesBankinter(
      connectionId,
      diasAtras
    );

    return { count: resultado.total };
  } catch (error) {
    logger.error('Error sincronizando Bankinter:', error);
    return { count: 0 };
  }
}
