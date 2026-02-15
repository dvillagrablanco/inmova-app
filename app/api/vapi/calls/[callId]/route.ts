/**
 * API para gestión de una llamada específica
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { VapiService } from '@/lib/vapi/vapi-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET - Obtener información de una llamada
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { callId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    const { callId } = params;
    
    if (!callId) {
      return NextResponse.json(
        { error: 'Se requiere callId' },
        { status: 400 }
      );
    }
    
    const call = await VapiService.getCall(callId);
    
    return NextResponse.json({
      success: true,
      call,
    });
    
  } catch (error: any) {
    logger.error('[Vapi Call GET Error]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Finalizar una llamada en curso
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { callId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    const { callId } = params;
    
    if (!callId) {
      return NextResponse.json(
        { error: 'Se requiere callId' },
        { status: 400 }
      );
    }
    
    await VapiService.endCall(callId);
    
    return NextResponse.json({
      success: true,
      message: 'Llamada finalizada correctamente',
    });
    
  } catch (error: any) {
    logger.error('[Vapi Call DELETE Error]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
