import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API para crear tickets de soporte con resolución automática mediante IA
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { subject, description, category, priority } = await req.json();

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Asunto y descripción son requeridos' },
        { status: 400 }
      );
    }

    // Crear el ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session?.user?.id,
        companyId: session?.user?.companyId,
        subject,
        description,
        category: category || 'question',
        priority: priority || 'medium',
        status: 'open',
      },
    });

    // Generar respuesta automática con IA
    const aiResponse = await generateAIResponse({
      subject,
      description,
      category: category || 'question',
    });

    // Crear mensaje del sistema con la respuesta de IA
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        sender: 'ai',
        message: aiResponse.message,
        isAutomatic: true,
      },
    });

    // Si la IA puede resolver el ticket automáticamente
    if (aiResponse.canAutoResolve) {
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          status: 'resolved',
          autoResolved: true,
          resolvedAt: new Date(),
        },
      });
    }

    // Obtener el ticket completo con mensajes
    const updatedTicket = await prisma.supportTicket.findUnique({
      where: { id: ticket.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Ticket de soporte creado con respuesta IA', {
      ticketId: ticket.id,
      userId: session?.user?.id,
      category,
      autoResolved: aiResponse.canAutoResolve,
    });

    return NextResponse.json({
      ticket: updatedTicket,
      aiResponse: {
        message: aiResponse.message,
        canAutoResolve: aiResponse.canAutoResolve,
        suggestedActions: aiResponse.suggestedActions,
      },
    });
  } catch (error) {
    logger.error('Error al crear ticket de soporte:', error);
    return NextResponse.json(
      { error: 'Error al crear el ticket de soporte' },
      { status: 500 }
    );
  }
}

/**
 * Genera una respuesta automática usando IA basada en el contenido del ticket
 */
async function generateAIResponse(params: {
  subject: string;
  description: string;
  category: string;
}): Promise<{
  message: string;
  canAutoResolve: boolean;
  suggestedActions: string[];
}> {
  const { subject, description, category } = params;

  // Base de conocimientos para respuestas automáticas
  const knowledgeBase: Record<string, any> = {
    technical: {
      keywords: ['error', 'bug', 'fallo', 'problema', 'no funciona', 'crash'],
      responses: {
        login: {
          message:
            'Entiendo que tienes problemas para iniciar sesión. Te recomiendo:\n\n' +
            '1. Verificar que tu correo y contraseña sean correctos\n' +
            '2. Intentar restablecer tu contraseña desde "¿Olvidaste tu contraseña?"\n' +
            '3. Limpiar la caché de tu navegador\n' +
            '4. Intentar en modo incógnito\n\n' +
            'Si el problema persiste, responde a este ticket y un administrador te ayudará.',
          canAutoResolve: false,
          actions: ['Restablecer contraseña', 'Limpiar caché', 'Contactar soporte'],
        },
        slow: {
          message:
            'Veo que experimentas lentitud en la plataforma. Aquí algunas soluciones:\n\n' +
            '1. Cierra pestañas innecesarias del navegador\n' +
            '2. Verifica tu conexión a internet\n' +
            '3. Intenta en otro navegador (Chrome, Firefox, Edge)\n' +
            '4. Actualiza tu navegador a la última versión\n\n' +
            'Si continúa lento, responde con más detalles del dispositivo que usas.',
          canAutoResolve: false,
          actions: ['Cambiar navegador', 'Verificar conexión', 'Reportar detalles'],
        },
      },
    },
    billing: {
      keywords: ['factura', 'pago', 'precio', 'plan', 'suscripción', 'cargo'],
      responses: {
        invoice: {
          message:
            'Para consultas sobre facturación:\n\n' +
            '1. Puedes descargar tus facturas desde "Perfil > Facturación"\n' +
            '2. Los pagos se procesan automáticamente cada mes\n' +
            '3. Para cambiar tu plan, ve a "Perfil > Plan de Suscripción"\n\n' +
            'Si necesitas una factura específica o tienes dudas sobre un cargo, ' +
            'responde a este ticket con más detalles.',
          canAutoResolve: false,
          actions: ['Ver facturas', 'Cambiar plan', 'Contactar facturación'],
        },
      },
    },
    feature_request: {
      keywords: ['necesito', 'quiero', 'sería bueno', 'sugerencia', 'propuesta'],
      responses: {
        default: {
          message:
            '¡Gracias por tu sugerencia! Valoramos mucho el feedback de nuestros usuarios.\n\n' +
            'Tu propuesta ha sido registrada y será evaluada por nuestro equipo de producto. ' +
            'Las mejoras más votadas se priorizan en nuestra hoja de ruta.\n\n' +
            'Te notificaremos si implementamos esta funcionalidad. ' +
            '¡Gracias por ayudarnos a mejorar INMOVA!',
          canAutoResolve: true,
          actions: ['Ver roadmap', 'Votar sugerencias'],
        },
      },
    },
    question: {
      keywords: ['cómo', 'qué', 'cuándo', 'dónde', 'por qué', 'puedo'],
      responses: {
        howto: {
          message:
            'Para resolver tu consulta, te recomiendo:\n\n' +
            '1. Consultar nuestra Base de Conocimientos en la esquina superior derecha\n' +
            '2. Ver los tutoriales en vídeo disponibles en cada módulo\n' +
            '3. Usar el asistente interactivo (icono ? en el menú)\n\n' +
            'Si no encuentras lo que buscas, responde con más detalles y ' +
            'un miembro del equipo te ayudará personalmente.',
          canAutoResolve: false,
          actions: ['Base de conocimientos', 'Ver tutoriales', 'Asistente IA'],
        },
      },
    },
  };

  // Analizar el contenido para determinar la mejor respuesta
  const text = `${subject} ${description}`.toLowerCase();
  
  let bestMatch = {
    message:
      'Gracias por contactarnos. He registrado tu consulta.\n\n' +
      'Un miembro de nuestro equipo la revisará y te responderá lo antes posible. ' +
      'Tiempo estimado de respuesta: 24 horas.\n\n' +
      'Mientras tanto, puedes:\n' +
      '• Consultar nuestra Base de Conocimientos\n' +
      '• Ver tutoriales en vídeo\n' +
      '• Usar el asistente de IA\n\n' +
      'Gracias por usar INMOVA.',
    canAutoResolve: false,
    actions: ['Base de conocimientos', 'Ver tutoriales'],
  };

  // Buscar coincidencias en la base de conocimientos
  for (const [cat, data] of Object.entries(knowledgeBase)) {
    if (category === cat || data.keywords.some((kw: string) => text.includes(kw))) {
      for (const [key, response] of Object.entries(data.responses)) {
        if (text.includes(key) || key === 'default') {
          bestMatch = response as any;
          break;
        }
      }
      if (bestMatch.canAutoResolve !== false) break;
    }
  }

  return {
    message: bestMatch.message,
    canAutoResolve: bestMatch.canAutoResolve,
    suggestedActions: bestMatch.actions,
  };
}

/**
 * GET: Obtener tickets de soporte del usuario
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const where: any = {
      userId: session?.user?.id,
      companyId: session?.user?.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    logger.error('Error al obtener tickets:', error);
    return NextResponse.json(
      { error: 'Error al obtener los tickets' },
      { status: 500 }
    );
  }
}
