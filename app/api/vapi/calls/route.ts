/**
 * API para gestión de llamadas Vapi
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { VapiService } from '@/lib/vapi/vapi-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación para llamada saliente
const outboundCallSchema = z.object({
  assistantId: z.string().min(1),
  phoneNumber: z.string().regex(/^\+?[0-9]{9,15}$/, 'Número de teléfono inválido'),
  customerName: z.string().optional(),
  customerId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Schema para llamada web
const webCallSchema = z.object({
  assistantId: z.string().min(1),
  customerId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET - Listar llamadas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get('assistantId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    
    const calls = await VapiService.listCalls({
      assistantId,
      limit: Math.min(limit, 100),
      createdAtGt: startDate,
      createdAtLt: endDate,
    });
    
    // Calcular estadísticas
    const stats = await VapiService.getCallStats({
      assistantId,
      startDate,
      endDate,
    });
    
    return NextResponse.json({
      success: true,
      calls,
      stats,
      pagination: {
        limit,
        returned: calls.length,
      },
    });
    
  } catch (error: any) {
    logger.error('[Vapi Calls GET Error]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Iniciar una nueva llamada
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    const body = await request.json();
    const { callType } = body;
    
    // Llamada telefónica saliente
    if (callType === 'outbound' || body.phoneNumber) {
      const validated = outboundCallSchema.parse(body);
      
      const call = await VapiService.startOutboundCall({
        assistantId: validated.assistantId,
        phoneNumber: validated.phoneNumber,
        customerName: validated.customerName,
        customerId: validated.customerId,
        metadata: {
          ...validated.metadata,
          initiatedBy: session.user.id,
          companyId: session.user.companyId,
        },
      });
      
      return NextResponse.json({
        success: true,
        call,
        message: 'Llamada iniciada correctamente',
      }, { status: 201 });
    }
    
    // Llamada web (browser)
    if (callType === 'web') {
      const validated = webCallSchema.parse(body);
      
      const result = await VapiService.startWebCall({
        assistantId: validated.assistantId,
        customerId: validated.customerId,
        metadata: {
          ...validated.metadata,
          initiatedBy: session.user.id,
          companyId: session.user.companyId,
        },
      });
      
      return NextResponse.json({
        success: true,
        ...result,
        message: 'Sesión web creada correctamente',
      }, { status: 201 });
    }
    
    return NextResponse.json(
      { error: 'Tipo de llamada no especificado (outbound o web)' },
      { status: 400 }
    );
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    logger.error('[Vapi Calls POST Error]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
