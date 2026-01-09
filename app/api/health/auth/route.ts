import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthSystem } from '@/lib/auth-guard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API de Health Check para el Sistema de Autenticación
 * 
 * GET /api/health/auth
 * - Sin autenticación: Retorna estado básico (OK/ERROR)
 * - Con autenticación admin: Retorna detalles completos
 * 
 * Este endpoint debe monitorizarse continuamente en producción.
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verificar si el usuario es admin para mostrar detalles
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && 
      ['super_admin', 'administrador'].includes((session.user as any).role);
    
    // Ejecutar verificación completa
    const result = await verifyAuthSystem();
    
    // Preparar respuesta
    const response: any = {
      status: result.success ? 'healthy' : 'unhealthy',
      timestamp: result.timestamp.toISOString(),
      duration: `${Date.now() - startTime}ms`,
    };
    
    // Si es admin, incluir detalles
    if (isAdmin) {
      response.checks = result.checks;
      response.summary = {
        total: result.checks.length,
        passed: result.checks.filter(c => c.passed).length,
        failed: result.checks.filter(c => !c.passed).length,
        criticalFailed: result.checks.filter(c => c.critical && !c.passed).length,
      };
    } else {
      // Para no-admins, solo mostrar un resumen mínimo
      response.checksTotal = result.checks.length;
      response.checksPassed = result.checks.filter(c => c.passed).length;
    }
    
    const statusCode = result.success ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
    
  } catch (error) {
    console.error('[Auth Health Check] Error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Error ejecutando verificación de autenticación',
        timestamp: new Date().toISOString(),
        duration: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}
