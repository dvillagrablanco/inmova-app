/**
 * API DEL CHATBOT INTELIGENTE
 * Integrado con GPT-4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatContext {
  userId?: string;
  userRole?: string;
  currentPath?: string;
}

/**
 * POST /api/chatbot
 * Procesar mensaje del usuario y generar respuesta
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { message, history = [], context = {} } = body as {
      message: string;
      history?: ChatMessage[];
      context?: ChatContext;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensaje inválido' },
        { status: 400 }
      );
    }

    // Construir contexto del usuario
    let userContext = '';
    if (session?.user) {
      userContext = `
Contexto del usuario:
- Nombre: ${session.user.name}
- Email: ${session.user.email}
- Rol: ${session.user.role}
- Página actual: ${context.currentPath || 'desconocida'}
`;
    }

    // Sistema prompt para el chatbot
    const systemPrompt = `Eres el asistente virtual de INMOVA, una plataforma PropTech avanzada para gestión inmobiliaria.

Tu objetivo es ayudar a los usuarios a:
1. Resolver problemas técnicos
2. Descubrir funcionalidades
3. Completar tareas comunes
4. Navegar por la plataforma

CARACTERÍSTICAS DE INMOVA:
- 88 módulos integrados
- Soporte para 7 modelos de negocio (Alquiler tradicional, Room Rental, STR, Flipping, Construcción, Profesional, Comunidades)
- IA, Blockchain, OCR, Chatbot integrados
- Módulos principales: Propiedades, Contratos, Pagos, Mantenimiento, Inquilinos, Dashboard, Reportes

INSTRUCCIONES:
- Responde en español de forma amigable y profesional
- Sé conciso (máximo 150 palabras)
- Si no sabes algo, admite y ofrece contactar soporte
- Si detectas que necesita ayuda humana (problemas complejos, cancelaciones, quejas), indica escalateToHuman: true
- Sugiere acciones concretas cuando sea posible (links, rutas)
${userContext}

RESPONDE EN FORMATO JSON:
{
  "message": "tu respuesta aquí",
  "escalateToHuman": false,
  "confidence": 0.9,
  "suggestedActions": [
    { "label": "Crear propiedad", "action": "route", "value": "/edificios/nuevo" }
  ]
}
`;

    // Preparar mensajes para la API
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // Últimos 10 mensajes para contexto
      { role: 'user', content: message }
    ];

    // Llamar a GPT-4 (o usar fallback local)
    let aiResponse;
    
    if (process.env.ABACUSAI_API_KEY || process.env.OPENAI_API_KEY) {
      // Usar API de IA
      const apiKey = process.env.ABACUSAI_API_KEY || process.env.OPENAI_API_KEY;
      const apiUrl = process.env.ABACUSAI_API_KEY 
        ? 'https://api.abacus.ai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('Error en API de IA');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Intentar parsear como JSON
      try {
        aiResponse = JSON.parse(content);
      } catch {
        // Si no es JSON, usar como mensaje simple
        aiResponse = {
          message: content,
          escalateToHuman: false,
          confidence: 0.7,
          suggestedActions: []
        };
      }
    } else {
      // Fallback: Respuestas predefinidas
      aiResponse = getFallbackResponse(message);
    }

    // Guardar interacción en base de datos
    if (session?.user?.id) {
      try {
        await prisma.supportInteraction.create({
          data: {
            userId: session.user.id,
            type: 'chatbot',
            question: message,
            response: aiResponse.message,
            confidence: aiResponse.confidence,
            resolved: !aiResponse.escalateToHuman
          }
        });
      } catch (error) {
        console.error('[CHATBOT] Error guardando interacción:', error);
      }
    }

    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error('[CHATBOT] Error:', error);
    return NextResponse.json(
      { 
        message: 'Lo siento, hubo un error procesando tu mensaje. ¿Podrías intentar de nuevo?',
        escalateToHuman: false,
        confidence: 0,
        suggestedActions: [
          { label: 'Contactar soporte', action: 'link', value: 'mailto:soporte@inmova.app' }
        ]
      },
      { status: 200 } // Devolver 200 para mostrar mensaje de error amigable
    );
  }
}

/**
 * Respuestas predefinidas (fallback)
 */
function getFallbackResponse(message: string): any {
  const lowerMessage = message.toLowerCase();

  // Crear propiedad
  if (lowerMessage.includes('propiedad') || lowerMessage.includes('edificio')) {
    return {
      message: 'Para crear tu primera propiedad:\n\n1. Ve a "Edificios" en el menú lateral\n2. Clic en "Nueva Propiedad"\n3. Completa los datos básicos\n4. ¡Listo!\n\nTambién puedes usar el asistente guiado para un proceso paso a paso.',
      confidence: 0.9,
      escalateToHuman: false,
      suggestedActions: [
        { label: 'Crear propiedad', action: 'route', value: '/edificios/nuevo' },
        { label: 'Ver tutorial', action: 'link', value: 'https://www.youtube.com/watch?v=zm55Gdl5G1Q' }
      ]
    };
  }

  // Importar datos
  if (lowerMessage.includes('importar') || lowerMessage.includes('excel') || lowerMessage.includes('csv')) {
    return {
      message: 'Puedes importar tus datos desde Excel o CSV de forma sencilla:\n\n1. Ve a "Admin" > "Importar Datos"\n2. Descarga la plantilla\n3. Llena tus datos\n4. Sube el archivo\n\nEl sistema validará todo automáticamente.',
      confidence: 0.9,
      escalateToHuman: false,
      suggestedActions: [
        { label: 'Ir a importación', action: 'route', value: '/admin/importar' }
      ]
    };
  }

  // Pagos/Stripe
  if (lowerMessage.includes('pago') || lowerMessage.includes('stripe') || lowerMessage.includes('cobro')) {
    return {
      message: 'Para configurar pagos con Stripe:\n\n1. Ve a "Configuración" > "Pagos"\n2. Conecta tu cuenta de Stripe\n3. Configura recordatorios automáticos\n\nTus inquilinos podrán pagar con tarjeta de forma segura.',
      confidence: 0.85,
      escalateToHuman: false,
      suggestedActions: [
        { label: 'Configurar pagos', action: 'route', value: '/configuracion/pagos' }
      ]
    };
  }

  // Ayuda general
  if (lowerMessage.includes('ayuda') || lowerMessage.includes('tutorial')) {
    return {
      message: 'Puedo ayudarte con:\n\n• Crear propiedades y contratos\n• Configurar pagos\n• Importar datos\n• Gestionar inquilinos\n• Ver tutoriales\n\n¿Qué necesitas hacer?',
      confidence: 0.7,
      escalateToHuman: false,
      suggestedActions: [
        { label: 'Ver centro de ayuda', action: 'link', value: 'https://www.inmova.app/ayuda' },
        { label: 'Videos tutoriales', action: 'link', value: 'https://www.youtube.com/@inmova' }
      ]
    };
  }

  // Cancelar/Problemas serios
  if (lowerMessage.includes('cancelar') || lowerMessage.includes('problema') || lowerMessage.includes('error')) {
    return {
      message: 'Entiendo que tienes un problema importante. Será mejor que hables directamente con nuestro equipo de soporte. Ellos pueden ayudarte de manera personalizada.',
      confidence: 0.5,
      escalateToHuman: true,
      suggestedActions: [
        { label: 'Enviar email', action: 'link', value: 'mailto:soporte@inmova.app' },
        { label: 'Llamar soporte', action: 'link', value: 'tel:+34900000000' }
      ]
    };
  }

  // Default
  return {
    message: 'No estoy seguro de cómo ayudarte con eso. ¿Podrías reformular tu pregunta o contactar directamente con soporte?\n\nPuedes preguntarme sobre:\n• Cómo crear propiedades\n• Importar datos\n• Configurar pagos\n• Ver tutoriales',
    confidence: 0.3,
    escalateToHuman: false,
    suggestedActions: [
      { label: 'Contactar soporte', action: 'link', value: 'mailto:soporte@inmova.app' }
    ]
  };
}
