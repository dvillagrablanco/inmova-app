/**
 * API: POST /api/admin/ai-agents/test
 * Endpoint para verificar la conexión con Claude/Anthropic
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar configuración
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const hasApiKey = !!apiKey && apiKey.length > 10;
    const keyPrefix = apiKey ? apiKey.substring(0, 15) + '...' : 'NO CONFIGURADA';

    return NextResponse.json({
      success: true,
      status: {
        configured: hasApiKey,
        keyPrefix: hasApiKey ? keyPrefix : null,
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        maxTokens: process.env.ANTHROPIC_MAX_TOKENS || '8192',
      },
      message: hasApiKey 
        ? 'API Key configurada. Usa POST para probar la conexión.'
        : 'ANTHROPIC_API_KEY no está configurada en las variables de entorno.',
      instructions: !hasApiKey ? [
        '1. Obtener API Key en: https://console.anthropic.com/settings/keys',
        '2. Añadir a .env.production: ANTHROPIC_API_KEY=sk-ant-...',
        '3. Reiniciar PM2: pm2 restart inmova-app --update-env'
      ] : null
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error verificando configuración', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'ANTHROPIC_API_KEY no configurada',
        message: 'Debes configurar la API Key de Anthropic en las variables de entorno.',
        instructions: [
          '1. Obtener API Key en: https://console.anthropic.com/settings/keys',
          '2. SSH al servidor: ssh root@157.180.119.236',
          '3. Editar: nano /opt/inmova-app/.env.production',
          '4. Añadir: ANTHROPIC_API_KEY=sk-ant-api03-...',
          '5. Reiniciar: pm2 restart inmova-app --update-env'
        ]
      }, { status: 503 });
    }

    // Probar conexión con un mensaje simple
    const startTime = Date.now();
    
    const anthropic = new Anthropic({
      apiKey: apiKey
    });

    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Responde con exactamente: "Conexión exitosa. Claude funcionando correctamente."'
        }
      ]
    });

    const responseTime = Date.now() - startTime;
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : 'Respuesta no textual';

    return NextResponse.json({
      success: true,
      message: 'Conexión con Claude verificada exitosamente',
      test: {
        model: message.model,
        response: responseText,
        responseTime: `${responseTime}ms`,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens
        },
        stopReason: message.stop_reason
      },
      status: {
        configured: true,
        working: true
      }
    });

  } catch (error: any) {
    console.error('[AI Test Error]:', error);
    
    let errorMessage = 'Error desconocido';
    let errorType = 'unknown';
    
    if (error.message?.includes('401') || error.message?.includes('authentication')) {
      errorMessage = 'API Key inválida o expirada';
      errorType = 'auth_error';
    } else if (error.message?.includes('429') || error.message?.includes('rate')) {
      errorMessage = 'Rate limit excedido, espera un momento';
      errorType = 'rate_limit';
    } else if (error.message?.includes('500') || error.message?.includes('server')) {
      errorMessage = 'Error en servidor de Anthropic';
      errorType = 'server_error';
    } else if (error.message?.includes('network') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Error de conexión de red';
      errorType = 'network_error';
    } else {
      errorMessage = error.message;
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorType: errorType,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestions: [
        'Verificar que la API Key es correcta',
        'Verificar que la cuenta de Anthropic tiene créditos',
        'Intentar de nuevo en unos segundos'
      ]
    }, { status: 500 });
  }
}
