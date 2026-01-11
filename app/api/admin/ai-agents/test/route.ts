/**
 * API: Probar Agente de IA
 * 
 * Permite enviar mensajes de prueba a los agentes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Respuestas de ejemplo por tipo de agente (fallback si no hay API configurada)
const SAMPLE_RESPONSES: Record<string, string[]> = {
  technical_support: [
    '✅ He registrado tu incidencia técnica. Un técnico especializado se pondrá en contacto contigo en las próximas 2 horas para evaluar la situación.',
    '🔧 Según tu descripción, parece ser un problema de fontanería. He contactado con nuestro proveedor certificado más cercano. ¿Puedes confirmar la dirección del inmueble?',
    '📋 He creado un ticket de mantenimiento con prioridad alta. El técnico Juan García está disponible mañana entre 9:00 y 12:00. ¿Te viene bien ese horario?'
  ],
  customer_service: [
    '👋 ¡Hola! Estoy aquí para ayudarte. ¿En qué puedo asistirte hoy?',
    '📝 Entiendo tu consulta. Déjame buscar la información que necesitas sobre tu contrato de alquiler.',
    '✨ He actualizado tus preferencias de comunicación. A partir de ahora recibirás las notificaciones por el canal que has seleccionado.'
  ],
  commercial_management: [
    '📊 He analizado el lead que mencionas. Según su perfil y presupuesto, le recomendaría las siguientes 3 propiedades...',
    '💼 Tu propuesta comercial está lista. He incluido los términos estándar y las condiciones especiales que solicitaste.',
    '🎯 El lead ha sido cualificado con puntuación 85/100. Recomiendo contactarlo hoy antes de las 18:00 para maximizar la conversión.'
  ],
  financial_analysis: [
    '📈 El análisis de rentabilidad muestra un ROI del 6.2% anual para esta propiedad. Comparado con el mercado (5.8%), está por encima de la media.',
    '💰 He detectado que 3 inquilinos tienen pagos pendientes por un total de €2,450. Te recomiendo enviar recordatorios automáticos.',
    '📊 El informe financiero del Q4 está listo. Los ingresos totales fueron €45,230, con un margen operativo del 23%.'
  ],
  legal_compliance: [
    '⚖️ He revisado el contrato y todo está conforme a la normativa LAU vigente. Puedes proceder con la firma digital.',
    '📋 Atención: Este contrato necesita incluir la cláusula de actualización de renta según IPC para cumplir con la nueva regulación.',
    '✅ La documentación RGPD está al día. El próximo vencimiento de consentimientos es en 6 meses.'
  ],
  community_manager: [
    '📱 He programado 5 publicaciones para esta semana en Instagram, LinkedIn y Twitter. ¿Quieres revisar el calendario?',
    '✍️ He redactado un nuevo artículo para el blog sobre "Tendencias PropTech 2026". Está listo para tu revisión.',
    '📊 El engagement de la última semana subió un 15%. Las publicaciones sobre tours virtuales tuvieron mejor rendimiento.'
  ]
};

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede probar agentes
    const userRole = (session.user as any)?.role;
    if (userRole !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { agentType, message } = body;

    if (!agentType || !message) {
      return NextResponse.json({
        error: 'Se requiere agentType y message'
      }, { status: 400 });
    }

    // Verificar si tenemos API de Anthropic configurada
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const apiConfigured = Boolean(anthropicKey && anthropicKey.length > 10 && !anthropicKey.includes('placeholder'));

    let response: string;
    let source: 'api' | 'fallback' = 'fallback';

    if (apiConfigured) {
      try {
        // Intentar usar la API real
        const systemPrompt = getSystemPromptForAgent(agentType);
        
        const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey!,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307', // Usar Haiku para pruebas (más rápido y económico)
            max_tokens: 500,
            system: systemPrompt,
            messages: [{ role: 'user', content: message }]
          })
        });

        if (apiResponse.ok) {
          const data = await apiResponse.json();
          response = data.content[0]?.text || 'Sin respuesta del modelo.';
          source = 'api';
        } else {
          // Fallback a respuesta de ejemplo
          response = getRandomResponse(agentType) + '\n\n⚠️ (Respuesta de ejemplo - Error en API)';
        }
      } catch (error) {
        console.error('[AI Test] API error:', error);
        response = getRandomResponse(agentType) + '\n\n⚠️ (Respuesta de ejemplo - Error de conexión)';
      }
    } else {
      // Sin API configurada, usar respuestas de ejemplo
      response = getRandomResponse(agentType) + '\n\n💡 (Respuesta de ejemplo - Configura ANTHROPIC_API_KEY para respuestas reales)';
    }

    return NextResponse.json({
      success: true,
      agentType,
      message,
      response,
      source,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[AI Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

function getRandomResponse(agentType: string): string {
  const responses = SAMPLE_RESPONSES[agentType] || SAMPLE_RESPONSES.customer_service;
  return responses[Math.floor(Math.random() * responses.length)];
}

function getSystemPromptForAgent(agentType: string): string {
  const prompts: Record<string, string> = {
    technical_support: `Eres un agente de soporte técnico especializado en gestión inmobiliaria. 
Tu rol es ayudar con incidencias de mantenimiento, reparaciones y emergencias técnicas.
Responde de forma profesional, empática y orientada a soluciones.
Siempre intenta ofrecer pasos concretos y tiempos estimados.`,

    customer_service: `Eres un agente de atención al cliente para una plataforma de gestión inmobiliaria.
Tu rol es resolver consultas, gestionar quejas y proporcionar información sobre servicios.
Sé amable, profesional y resolutivo. Ofrece alternativas cuando sea posible.`,

    commercial_management: `Eres un agente de gestión comercial especializado en el sector inmobiliario.
Tu rol es cualificar leads, hacer seguimiento de oportunidades y ayudar con propuestas comerciales.
Sé proactivo, orientado a resultados y profesional.`,

    financial_analysis: `Eres un analista financiero experto en el sector inmobiliario.
Tu rol es analizar rentabilidad, calcular ROI, optimizar ingresos y generar reportes financieros.
Sé preciso, usa datos concretos y ofrece recomendaciones basadas en análisis.`,

    legal_compliance: `Eres un asistente legal especializado en derecho inmobiliario español.
Tu rol es revisar contratos, asegurar cumplimiento normativo y asesorar en temas legales.
Sé riguroso, cita normativas relevantes (LAU, RGPD) y advierte sobre riesgos.`,

    community_manager: `Eres un community manager experto en marketing inmobiliario y PropTech.
Tu rol es crear contenido para redes sociales, gestionar el blog y aumentar el engagement.
Sé creativo, conoce las tendencias del sector y adapta el tono a cada plataforma.`
  };

  return prompts[agentType] || prompts.customer_service;
}
