/**
 * API Route: Error Management
 * 
 * Endpoints para gestionar errores capturados (solo admin).
 * 
 * GET /api/errors - Listar errores con filtros
 * GET /api/errors?stats=true - Obtener estadísticas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getRecentErrors, getErrorStats, ErrorSeverity, ErrorSource, ErrorStatus } from '@/lib/error-tracker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Roles permitidos para ver errores
const ALLOWED_ROLES = ['super_admin', 'administrador'];

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar permisos
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver errores' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Si pide estadísticas
    if (searchParams.get('stats') === 'true') {
      const stats = await getErrorStats();
      return NextResponse.json({ success: true, data: stats });
    }
    
    // Parámetros de filtro
    const limit = parseInt(searchParams.get('limit') || '50');
    const severity = searchParams.get('severity') as ErrorSeverity | null;
    const source = searchParams.get('source') as ErrorSource | null;
    const status = searchParams.get('status') as ErrorStatus | null;
    const since = searchParams.get('since');
    
    const errors = await getRecentErrors({
      limit: Math.min(limit, 500),
      severity: severity || undefined,
      source: source || undefined,
      status: status || undefined,
      since: since ? new Date(since) : undefined,
    });
    
    return NextResponse.json({
      success: true,
      data: errors,
      count: errors.length,
    });
  } catch (error: any) {
    console.error('[API Errors] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch errors' },
      { status: 500 }
    );
  }
}
