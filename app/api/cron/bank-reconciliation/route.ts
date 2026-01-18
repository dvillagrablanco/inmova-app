/**
 * CRON: Conciliación Bancaria Automática
 * 
 * Este endpoint ejecuta la conciliación automática entre transacciones
 * bancarias y pagos pendientes.
 * 
 * Configuración recomendada en Vercel/Cron:
 * - Schedule: 0 8,14,20 * * * (8:00, 14:00 y 20:00 cada día)
 * 
 * @endpoint POST /api/cron/bank-reconciliation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  runBankReconciliation,
  getReconciliationStats,
  getTransactionsForManualReview,
  manualReconciliation,
  discardTransaction,
  type ReconciliationOptions,
} from '@/lib/bank-reconciliation-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos máximo

/**
 * POST - Ejecutar conciliación bancaria
 * 
 * Body opcional:
 * - companyId: string - Conciliar solo para una empresa
 * - bankConnectionId: string - Conciliar solo para una conexión bancaria
 * - daysBack: number - Días hacia atrás a procesar (default: 30)
 * - dryRun: boolean - Solo simular, no conciliar
 * - autoApproveThreshold: number - Confianza mínima para auto-aprobar (0-100)
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autorización
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    let isAuthorized = false;
    let userCompanyId: string | undefined;
    
    if (authHeader === `Bearer ${cronSecret}` && cronSecret) {
      isAuthorized = true;
      logger.info('🔐 Conciliación autorizada via CRON_SECRET');
    } else {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        const role = (session.user as any).role;
        if (['super_admin', 'administrador'].includes(role)) {
          isAuthorized = true;
          if (role === 'administrador') {
            userCompanyId = (session.user as any).companyId;
          }
          logger.info(`🔐 Conciliación autorizada via sesión: ${session.user.email}`);
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Parsear opciones
    let options: ReconciliationOptions = {};
    
    try {
      const body = await req.json();
      options = {
        companyId: userCompanyId || body.companyId,
        bankConnectionId: body.bankConnectionId,
        daysBack: body.daysBack,
        dryRun: body.dryRun === true,
        autoApproveThreshold: body.autoApproveThreshold,
      };
    } catch {
      // Body vacío, usar defaults
      if (userCompanyId) {
        options.companyId = userCompanyId;
      }
    }

    logger.info('🏦 Iniciando conciliación bancaria', options);

    // Ejecutar conciliación
    const result = await runBankReconciliation(options);

    return NextResponse.json({
      success: result.success,
      message: `Conciliación completada: ${result.paymentsReconciled} pagos conciliados, ${result.manualReviewRequired} requieren revisión`,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error en CRON de conciliación:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Obtener estado de conciliación
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const companyId = role === 'super_admin' 
      ? undefined 
      : (session.user as any).companyId;

    const [stats, pendingReview] = await Promise.all([
      getReconciliationStats(companyId),
      getTransactionsForManualReview(companyId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        pendingReview: pendingReview.slice(0, 50), // Limitar a 50
      },
    });
  } catch (error: any) {
    logger.error('Error obteniendo estado de conciliación:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT - Conciliación manual o descarte
 * 
 * Body:
 * - transactionId: string
 * - action: 'reconcile' | 'discard'
 * - paymentId?: string (requerido si action es 'reconcile')
 * - reason?: string (requerido si action es 'discard')
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { transactionId, action, paymentId, reason } = body;

    if (!transactionId || !action) {
      return NextResponse.json(
        { error: 'transactionId y action son requeridos' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    if (action === 'reconcile') {
      if (!paymentId) {
        return NextResponse.json(
          { error: 'paymentId es requerido para conciliación' },
          { status: 400 }
        );
      }
      await manualReconciliation(transactionId, paymentId, userId);
      return NextResponse.json({
        success: true,
        message: 'Transacción conciliada correctamente',
      });
    }

    if (action === 'discard') {
      if (!reason) {
        return NextResponse.json(
          { error: 'reason es requerido para descartar' },
          { status: 400 }
        );
      }
      await discardTransaction(transactionId, reason, userId);
      return NextResponse.json({
        success: true,
        message: 'Transacción descartada correctamente',
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida. Use: reconcile o discard' },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error('Error en conciliación manual:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
