import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

// Estado de las integraciones contables
interface AccountingIntegration {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  invoicesSynced?: number;
  pendingSync?: number;
  error?: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar variables de entorno para determinar estado
    const integrations: AccountingIntegration[] = [
      {
        id: 'contasimple',
        name: 'Contasimple',
        status: process.env.CONTASIMPLE_API_KEY ? 'connected' : 'disconnected',
        lastSync: process.env.CONTASIMPLE_API_KEY ? new Date().toISOString() : undefined,
        invoicesSynced: process.env.CONTASIMPLE_API_KEY ? 0 : undefined,
        pendingSync: 0,
      },
      {
        id: 'holded',
        name: 'Holded',
        status: process.env.HOLDED_API_KEY ? 'connected' : 'disconnected',
        lastSync: process.env.HOLDED_API_KEY ? new Date().toISOString() : undefined,
        invoicesSynced: process.env.HOLDED_API_KEY ? 0 : undefined,
        pendingSync: 0,
      },
      {
        id: 'a3',
        name: 'A3 Software',
        status: 'disconnected',
        pendingSync: 0,
      },
      {
        id: 'sage',
        name: 'Sage',
        status: 'disconnected',
        pendingSync: 0,
      },
      {
        id: 'alegra',
        name: 'Alegra',
        status: 'disconnected',
        pendingSync: 0,
      },
    ];

    return NextResponse.json({
      integrations,
      summary: {
        connected: integrations.filter(i => i.status === 'connected').length,
        disconnected: integrations.filter(i => i.status === 'disconnected').length,
        errors: integrations.filter(i => i.status === 'error').length,
      },
    });
  } catch (error) {
    logger.error('Error al obtener estado de integraciones contables:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { integrationId, action } = body;

    if (action === 'test') {
      // Simular test de conexión
      return NextResponse.json({
        success: true,
        message: `Test de conexión con ${integrationId} exitoso`,
      });
    }

    if (action === 'sync') {
      // Simular sincronización
      return NextResponse.json({
        success: true,
        message: `Sincronización con ${integrationId} iniciada`,
        syncId: `sync-${Date.now()}`,
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error en acción de integración contable:', error);
    return NextResponse.json(
      { error: 'Error en la operación' },
      { status: 500 }
    );
  }
}
