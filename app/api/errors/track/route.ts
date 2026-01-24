/**
 * API Route: Track Error
 * 
 * Endpoint para recibir errores del frontend y guardarlos en el sistema.
 * 
 * POST /api/errors/track
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { trackError, ErrorSource } from '@/lib/error-tracker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Obtener info del usuario si está autenticado
    const session = await getServerSession(authOptions);
    
    // Extraer headers relevantes
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               undefined;
    
    // Trackear el error
    const errorId = await trackError(
      new Error(body.message || 'Unknown frontend error'),
      {
        source: (body.source || 'frontend') as ErrorSource,
        url: body.url,
        route: body.route,
        component: body.component,
        userId: session?.user?.id,
        userEmail: session?.user?.email || undefined,
        userRole: session?.user?.role,
        userAgent,
        ip,
        metadata: {
          errorName: body.name,
          stack: body.stack,
          ...body.metadata,
        },
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      errorId,
      message: 'Error tracked successfully' 
    });
  } catch (error: any) {
    console.error('[API Error Track] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track error' },
      { status: 500 }
    );
  }
}
