/**
 * API: Estado del Sistema de Agentes de IA
 * 
 * Verifica configuración y disponibilidad de los agentes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede acceder
    const userRole = (session.user as any)?.role;
    if (userRole !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar configuración de Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const configured = Boolean(anthropicKey && anthropicKey.length > 10 && !anthropicKey.includes('placeholder'));

    // Verificar conectividad (opcional - solo si está configurado)
    let connected = false;
    let modelAvailable = false;
    let lastCheck = new Date().toISOString();

    if (configured) {
      try {
        // Intentar una llamada mínima a la API
        const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey!,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }]
          })
        });

        // Si responde (aunque sea error de cuota), la API está accesible
        connected = testResponse.status !== 401 && testResponse.status !== 403;
        modelAvailable = testResponse.ok;
      } catch (error) {
        console.error('[AI Agents Status] Error testing API:', error);
        connected = false;
      }
    }

    // Información del sistema
    const systemInfo = {
      version: '1.0.0',
      name: 'INMOVA AI Agents System',
      poweredBy: 'Anthropic Claude 3.5 Sonnet',
      agents: [
        {
          type: 'technical_support',
          name: 'Soporte Técnico',
          description: 'Gestión de mantenimiento y reparaciones',
          enabled: true
        },
        {
          type: 'customer_service',
          name: 'Atención al Cliente',
          description: 'Consultas y soporte general',
          enabled: true
        },
        {
          type: 'commercial_management',
          name: 'Gestión Comercial',
          description: 'Ventas, leads y desarrollo comercial',
          enabled: true
        },
        {
          type: 'financial_analysis',
          name: 'Análisis Financiero',
          description: 'Análisis de rentabilidad y finanzas',
          enabled: true
        },
        {
          type: 'legal_compliance',
          name: 'Legal y Cumplimiento',
          description: 'Aspectos legales y normativos',
          enabled: true
        },
        {
          type: 'community_manager',
          name: 'Community Manager',
          description: 'Redes sociales y blog',
          enabled: true
        }
      ],
      capabilities: {
        multiAgentCoordination: true,
        contextualHandoff: true,
        toolCalling: true,
        conversationMemory: true,
        metricsTracking: true,
        escalationToHuman: true
      }
    };

    return NextResponse.json({
      success: true,
      configured,
      connected,
      modelAvailable,
      lastCheck,
      apiKeyPresent: Boolean(anthropicKey),
      apiKeyMasked: anthropicKey ? `${anthropicKey.substring(0, 8)}...${anthropicKey.slice(-4)}` : null,
      system: systemInfo
    });

  } catch (error: any) {
    console.error('[AI Agents Status] Error:', error);
    return NextResponse.json({
      success: false,
      configured: false,
      connected: false,
      error: error.message
    }, { status: 500 });
  }
}
