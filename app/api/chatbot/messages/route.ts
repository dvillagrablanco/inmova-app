import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET /api/chatbot/messages - Obtener mensajes de una conversación
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId requerido' },
        { status: 400 }
      );
    }

    // Verificar que la conversación pertenece al usuario
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    const conversation = await prisma.chatbotConversation.findFirst({
      where: {
        id: conversationId,
        tenantId: tenant.id
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    // Obtener mensajes
    const messages = await prisma.chatbotMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    logger.error('Error al obtener mensajes:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

// POST /api/chatbot/messages - Enviar mensaje y obtener respuesta del bot
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, mensaje } = body;

    if (!conversationId || !mensaje) {
      return NextResponse.json(
        { error: 'conversationId y mensaje son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la conversación pertenece al usuario
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    const conversation = await prisma.chatbotConversation.findFirst({
      where: {
        id: conversationId,
        tenantId: tenant.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Últimos 10 mensajes para contexto
        },
        tenant: {
          select: {
            nombreCompleto: true,
            email: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    // Guardar mensaje del usuario
    await prisma.chatbotMessage.create({
      data: {
        conversationId,
        senderType: 'tenant',
        mensaje
      }
    });

    // Construir contexto para GPT-4
    const systemPrompt = `Eres un asistente virtual 24/7 para inquilinos de propiedades inmobiliarias. Tu nombre es "INMOVA Assistant".

Información del inquilino:
- Nombre: ${conversation.tenant?.nombreCompleto}
- Email: ${conversation.tenant?.email}
- Idioma: ${conversation.idioma}
- Tema de consulta: ${conversation.tema || 'general'}

Tus capacidades:
1. Responder preguntas sobre pagos de renta
2. Gestionar solicitudes de mantenimiento
3. Proporcionar información sobre contratos
4. Ayudar con documentos
5. Escalar a un agente humano cuando sea necesario

Instrucciones:
- Responde en español de forma amigable y profesional
- Si el inquilino solicita algo que requiere acción (como solicitar mantenimiento), indica que puedes ayudarle y pregunta los detalles
- Si no puedes ayudar con algo, ofrece escalarlo a un agente humano
- Sé conciso pero completo en tus respuestas
- Usa un tono cercano y empático`;

    // Construir historial de conversación para contexto
    const conversationHistory = conversation.messages
      .reverse() // Más reciente primero
      .map(msg => ({
        role: msg.senderType === 'tenant' ? 'user' : 'assistant',
        content: msg.mensaje
      }));

    // Preparar mensajes para la API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: mensaje }
    ];

    // Llamar a la API de GPT-4 con streaming
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: messages,
        stream: true,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Crear stream personalizado para recolectar la respuesta completa
    let fullResponse = '';
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        
        try {
          while (reader) {
            const { done, value } = await reader.read();
            if (done) {
              // Guardar respuesta del bot en la base de datos
              await prisma.chatbotMessage.create({
                data: {
                  conversationId,
                  senderType: 'bot',
                  mensaje: fullResponse,
                  confidence: 0.9,
                  tokens: Math.ceil(fullResponse.length / 4) // Estimación aproximada
                }
              });

              // Actualizar conversación
              await prisma.chatbotConversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
              });

              break;
            }
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullResponse += content;
                  }
                } catch (e) {
                  // Ignorar errores de parsing
                }
              }
            }
            
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          logger.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error: any) {
    logger.error('Error al procesar mensaje:', error);
    return NextResponse.json(
      { error: 'Error al procesar mensaje' },
      { status: 500 }
    );
  }
}
