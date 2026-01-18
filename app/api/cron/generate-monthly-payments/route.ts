/**
 * CRON: Generación Automática de Pagos Mensuales
 * 
 * Este endpoint genera automáticamente los pagos pendientes para todos
 * los contratos activos al inicio de cada mes.
 * 
 * Configuración recomendada en Vercel/Cron:
 * - Schedule: 0 6 1 * * (6:00 AM del día 1 de cada mes)
 * - O alternativamente: 0 6 * * * (diario, el servicio verifica internamente)
 * 
 * También puede ejecutarse manualmente desde el panel de admin.
 * 
 * @endpoint POST /api/cron/generate-monthly-payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { 
  generateMonthlyPayments, 
  checkMissingPayments,
  getPaymentGenerationStats,
  type GenerationOptions 
} from '@/lib/monthly-payments-generator';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos máximo

/**
 * POST - Ejecutar generación de pagos
 * 
 * Body opcional:
 * - companyId: string - Generar solo para una empresa
 * - targetMonth: string - Mes objetivo (ISO date)
 * - dryRun: boolean - Solo simular, no crear pagos
 * - sendNotifications: boolean - Enviar emails a inquilinos
 * - forceRegenerate: boolean - Regenerar incluso si ya existe
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autorización
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Permitir acceso con CRON_SECRET o sesión autenticada
    let isAuthorized = false;
    let isAdmin = false;
    
    if (authHeader === `Bearer ${cronSecret}` && cronSecret) {
      isAuthorized = true;
      logger.info('🔐 CRON autorizado via CRON_SECRET');
    } else {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        const role = (session.user as any).role;
        if (['super_admin', 'administrador'].includes(role)) {
          isAuthorized = true;
          isAdmin = true;
          logger.info(`🔐 CRON autorizado via sesión: ${session.user.email}`);
        }
      }
    }

    if (!isAuthorized) {
      logger.warn('⚠️ Intento de acceso no autorizado a CRON de pagos');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Parsear opciones del body
    let options: GenerationOptions = {
      sendNotifications: true,
    };

    try {
      const body = await req.json();
      options = {
        companyId: body.companyId,
        targetMonth: body.targetMonth ? new Date(body.targetMonth) : undefined,
        dryRun: body.dryRun === true,
        sendNotifications: body.sendNotifications !== false,
        forceRegenerate: body.forceRegenerate === true,
      };

      // Si es admin y no super_admin, limitar a su empresa
      if (isAdmin) {
        const session = await getServerSession(authOptions);
        const role = (session?.user as any)?.role;
        if (role === 'administrador') {
          options.companyId = (session?.user as any)?.companyId;
        }
      }
    } catch {
      // Body vacío es válido, usar valores por defecto
    }

    logger.info('🚀 Iniciando generación de pagos mensuales', options);

    // Ejecutar generación
    const result = await generateMonthlyPayments(options);

    // Log del resultado
    if (result.success) {
      logger.info('✅ Generación de pagos completada', {
        totalContracts: result.totalContracts,
        paymentsCreated: result.paymentsCreated,
        paymentsSkipped: result.paymentsSkipped,
      });
    } else {
      logger.error('❌ Generación de pagos con errores', {
        errors: result.errors,
      });
    }

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Generación completada: ${result.paymentsCreated} pagos creados, ${result.paymentsSkipped} omitidos`
        : 'Generación completada con errores',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error en CRON de generación de pagos:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Obtener estado de generación de pagos
 * 
 * Útil para verificar si los pagos del mes ya fueron generados
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const companyId = (session.user as any).companyId;

    // Solo admins pueden ver estado
    if (!['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetMonth = searchParams.get('month') 
      ? new Date(searchParams.get('month')!)
      : new Date();

    // Obtener estadísticas
    const stats = await getPaymentGenerationStats(
      role === 'super_admin' ? undefined : companyId
    );

    // Obtener pagos faltantes
    const missing = await checkMissingPayments(
      targetMonth,
      role === 'super_admin' ? undefined : companyId
    );

    return NextResponse.json({
      success: true,
      data: {
        stats,
        missing: {
          total: missing.total,
          missingCount: missing.missing.length,
          contracts: missing.missing.slice(0, 20), // Limitar a 20
        },
        targetMonth: targetMonth.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Error obteniendo estado de pagos:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
