/**
 * Webhook de Retell AI para procesamiento de llamadas de voz
 * 
 * POST /api/retell/webhook
 * 
 * Recibe el transcript del usuario de Retell y genera respuestas usando OpenAI
 * con Function Calling para integración con el CRM (checkAvailability, bookAppointment)
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Prompt del sistema para Carmen
const SYSTEM_PROMPT = `Eres Carmen, asistente de ventas de Inmova. Tu objetivo es cualificar al lead y agendar visita. Sé breve y natural.

CONTEXTO:
- Inmova es una plataforma de gestión inmobiliaria para propietarios, gestores y agencias
- Ofrecemos gestión de propiedades, inquilinos, contratos, cobros y mantenimiento
- Tenemos planes desde €19/mes para propietarios hasta €499/mes para empresas

OBJETIVO DE LA LLAMADA:
1. Saludar cordialmente y presentarte
2. Cualificar al lead: ¿cuántas propiedades gestiona? ¿qué problemas tiene actualmente?
3. Explicar brevemente cómo Inmova puede ayudarle
4. Proponer agendar una visita/demo para mostrar la plataforma
5. Confirmar datos de contacto

ESTILO:
- Sé amable, profesional pero cercana
- Respuestas cortas y directas (máximo 2-3 frases)
- Usa un tono natural, como si hablaras por teléfono
- Si el lead pregunta precios, da rangos generales y ofrece la demo para detalles

HERRAMIENTAS DISPONIBLES:
- Puedes consultar disponibilidad de horas para agendar citas
- Puedes crear citas directamente en el sistema
- Puedes actualizar el estado del lead (interesado, no interesado, etc.)
- Puedes guardar notas importantes de la conversación`;

// Definición de herramientas (Function Calling)
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'checkAvailability',
      description: 'Consulta la disponibilidad de horas para agendar una cita o visita. Usa esta función cuando el lead quiera agendar una reunión.',
      parameters: {
        type: 'object',
        properties: {
          fecha: {
            type: 'string',
            description: 'Fecha para consultar disponibilidad en formato YYYY-MM-DD. Si no se especifica, usa la fecha de mañana.',
          },
          duracion: {
            type: 'number',
            description: 'Duración de la cita en minutos. Por defecto 30 minutos.',
            default: 30,
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bookAppointment',
      description: 'Crea una cita en el calendario y actualiza el estado del lead. Usa esta función cuando el lead confirme una hora específica.',
      parameters: {
        type: 'object',
        properties: {
          leadId: {
            type: 'string',
            description: 'ID del lead en el sistema. Si no se tiene, se puede omitir y se creará un nuevo lead.',
          },
          nombre: {
            type: 'string',
            description: 'Nombre completo del lead',
          },
          email: {
            type: 'string',
            description: 'Email del lead',
          },
          telefono: {
            type: 'string',
            description: 'Teléfono del lead',
          },
          fecha: {
            type: 'string',
            description: 'Fecha de la cita en formato YYYY-MM-DD',
          },
          hora: {
            type: 'string',
            description: 'Hora de la cita en formato HH:MM (24h)',
          },
          tipo: {
            type: 'string',
            enum: ['visita', 'llamada', 'demo', 'reunion_online'],
            description: 'Tipo de cita',
            default: 'demo',
          },
          notas: {
            type: 'string',
            description: 'Notas adicionales sobre la cita o el lead',
          },
        },
        required: ['nombre', 'fecha', 'hora'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateLeadStatus',
      description: 'Actualiza el estado del lead en el CRM. Usa esta función cuando el lead exprese claramente su nivel de interés o cuando la conversación llegue a una conclusión.',
      parameters: {
        type: 'object',
        properties: {
          telefono: {
            type: 'string',
            description: 'Número de teléfono del lead (identificador principal)',
          },
          email: {
            type: 'string',
            description: 'Email del lead (identificador alternativo)',
          },
          status: {
            type: 'string',
            enum: ['nuevo', 'contactado', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido'],
            description: 'Nuevo estado del lead',
          },
          temperatura: {
            type: 'string',
            enum: ['frio', 'tibio', 'caliente'],
            description: 'Temperatura del lead según su nivel de interés',
          },
          motivoPerdida: {
            type: 'string',
            description: 'Si el estado es "perdido", indica el motivo (ej: "no tiene presupuesto", "usa otra herramienta")',
          },
        },
        required: ['status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createNote',
      description: 'Guarda una nota importante sobre la conversación con el lead. Usa esta función para registrar información relevante como necesidades, objeciones, datos de contacto adicionales, etc.',
      parameters: {
        type: 'object',
        properties: {
          telefono: {
            type: 'string',
            description: 'Número de teléfono del lead',
          },
          email: {
            type: 'string',
            description: 'Email del lead',
          },
          titulo: {
            type: 'string',
            description: 'Título breve de la nota',
          },
          contenido: {
            type: 'string',
            description: 'Contenido detallado de la nota',
          },
          tipo: {
            type: 'string',
            enum: ['llamada', 'nota', 'objecion', 'necesidad', 'dato_contacto'],
            description: 'Tipo de nota',
            default: 'llamada',
          },
        },
        required: ['contenido'],
      },
    },
  },
];

// Función para verificar disponibilidad
async function checkAvailability(params: { fecha?: string; duracion?: number }): Promise<string> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  // Fecha por defecto: mañana
  const targetDate = params.fecha 
    ? new Date(params.fecha) 
    : new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  const duracion = params.duracion || 30;

  // Obtener inicio y fin del día
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(9, 0, 0, 0); // Horario comercial desde las 9:00
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(18, 0, 0, 0); // Hasta las 18:00

  // Buscar citas existentes en ese día
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      fechaInicio: {
        gte: startOfDay,
        lt: endOfDay,
      },
      estado: {
        in: ['programada', 'confirmada'],
      },
    },
    orderBy: { fechaInicio: 'asc' },
    select: {
      fechaInicio: true,
      fechaFin: true,
    },
  });

  // Generar slots disponibles (cada 30 minutos)
  const availableSlots: string[] = [];
  let currentSlot = new Date(startOfDay);

  while (currentSlot < endOfDay) {
    const slotEnd = new Date(currentSlot.getTime() + duracion * 60 * 1000);
    
    // Verificar si el slot está libre
    const isOccupied = existingAppointments.some(apt => {
      const aptStart = new Date(apt.fechaInicio);
      const aptEnd = new Date(apt.fechaFin);
      return (currentSlot < aptEnd && slotEnd > aptStart);
    });

    if (!isOccupied && slotEnd <= endOfDay) {
      availableSlots.push(
        currentSlot.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    }

    currentSlot = new Date(currentSlot.getTime() + 30 * 60 * 1000); // Avanzar 30 minutos
  }

  const fechaFormateada = targetDate.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  if (availableSlots.length === 0) {
    return `No hay huecos disponibles para el ${fechaFormateada}. ¿Te gustaría consultar otro día?`;
  }

  // Mostrar solo algunos slots representativos
  const slotsToShow = availableSlots.length > 6 
    ? [availableSlots[0], availableSlots[Math.floor(availableSlots.length/3)], 
       availableSlots[Math.floor(availableSlots.length*2/3)], availableSlots[availableSlots.length-1]]
    : availableSlots;

  return `Para el ${fechaFormateada} tengo disponibles: ${slotsToShow.join(', ')} horas. ¿Cuál te viene mejor?`;
}

// Función para crear cita
async function bookAppointment(params: {
  leadId?: string;
  nombre: string;
  email?: string;
  telefono?: string;
  fecha: string;
  hora: string;
  tipo?: string;
  notas?: string;
  retellCallId?: string;
}): Promise<string> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  try {
    // Construir fecha y hora de la cita
    const [hours, minutes] = params.hora.split(':').map(Number);
    const fechaCita = new Date(params.fecha);
    fechaCita.setHours(hours, minutes, 0, 0);
    
    const fechaFin = new Date(fechaCita.getTime() + 30 * 60 * 1000); // 30 minutos

    // Verificar que la hora esté disponible
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        fechaInicio: {
          lt: fechaFin,
        },
        fechaFin: {
          gt: fechaCita,
        },
        estado: {
          in: ['programada', 'confirmada'],
        },
      },
    });

    if (conflictingAppointment) {
      return `Lo siento, esa hora ya está ocupada. ¿Te parece si buscamos otra hora?`;
    }

    let lead;

    // Buscar o crear lead
    if (params.leadId) {
      lead = await prisma.lead.findUnique({ where: { id: params.leadId } });
    }

    if (!lead && params.email) {
      lead = await prisma.lead.findFirst({
        where: { email: params.email },
      });
    }

    // Obtener una company por defecto (la primera disponible o crear lógica según necesidad)
    const defaultCompany = await prisma.company.findFirst({
      where: { activa: true },
      select: { id: true },
    });

    if (!defaultCompany) {
      return 'Error interno al procesar la cita. Por favor, contacta con soporte.';
    }

    // Si no existe el lead, crearlo
    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          companyId: defaultCompany.id,
          nombre: params.nombre,
          email: params.email || `${params.nombre.toLowerCase().replace(/\s+/g, '.')}@pendiente.com`,
          telefono: params.telefono,
          fuente: 'retell_ai',
          origenDetalle: 'Llamada telefónica con Carmen (Retell AI)',
          estado: 'contactado',
          temperatura: 'tibio',
          notas: params.notas,
        },
      });
    } else {
      // Actualizar estado del lead existente
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          estado: 'calificado',
          temperatura: 'caliente',
          ultimoContacto: new Date(),
          notas: params.notas 
            ? `${lead.notas || ''}\n\n[Retell AI] ${params.notas}`.trim()
            : lead.notas,
        },
      });
    }

    // Crear la cita
    const appointment = await prisma.appointment.create({
      data: {
        leadId: lead.id,
        titulo: `Demo Inmova - ${params.nombre}`,
        descripcion: params.notas || 'Cita agendada por Carmen (Retell AI)',
        tipo: params.tipo || 'demo',
        fechaInicio: fechaCita,
        fechaFin: fechaFin,
        duracion: 30,
        estado: 'programada',
        esVirtual: true,
        origen: 'retell_ai',
        retellCallId: params.retellCallId,
      },
    });

    // Registrar actividad en el lead
    // Buscar un usuario del sistema para asignar la actividad
    const systemUser = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' },
      select: { id: true },
    });

    if (systemUser) {
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          tipo: 'reunion',
          titulo: 'Cita agendada vía Retell AI',
          descripcion: `Carmen (asistente virtual) agendó una demo para el ${fechaCita.toLocaleDateString('es-ES')} a las ${params.hora}`,
          fecha: new Date(),
          creadoPor: systemUser.id,
        },
      });
    }

    const fechaFormateada = fechaCita.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    return `¡Perfecto! Te he agendado la demo para el ${fechaFormateada} a las ${params.hora}. Te enviaremos un recordatorio por email. ¿Hay algo más en lo que pueda ayudarte?`;
  } catch (error) {
    console.error('[Retell Webhook] Error booking appointment:', error);
    return 'Ha habido un problema técnico al agendar la cita. ¿Podrías repetirme la fecha y hora?';
  }
}

// Función para actualizar estado del lead
async function updateLeadStatus(params: {
  telefono?: string;
  email?: string;
  status: string;
  temperatura?: string;
  motivoPerdida?: string;
  retellCallId?: string;
}): Promise<string> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  try {
    // Buscar el lead por teléfono o email
    let lead = null;

    if (params.telefono) {
      lead = await prisma.lead.findFirst({
        where: { telefono: params.telefono },
      });
    }

    if (!lead && params.email) {
      lead = await prisma.lead.findFirst({
        where: { email: params.email },
      });
    }

    if (!lead) {
      return 'No he encontrado el lead en el sistema. ¿Podrías confirmarme tus datos de contacto?';
    }

    // Actualizar el lead
    const updateData: Record<string, unknown> = {
      estado: params.status,
      ultimoContacto: new Date(),
    };

    if (params.temperatura) {
      updateData.temperatura = params.temperatura;
    }

    if (params.status === 'perdido' && params.motivoPerdida) {
      updateData.motivoPerdida = params.motivoPerdida;
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: updateData,
    });

    // Registrar actividad
    const systemUser = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' },
      select: { id: true },
    });

    if (systemUser) {
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          tipo: 'nota',
          titulo: `Estado actualizado a: ${params.status}`,
          descripcion: `Carmen (Retell AI) actualizó el estado del lead${params.temperatura ? `. Temperatura: ${params.temperatura}` : ''}${params.motivoPerdida ? `. Motivo: ${params.motivoPerdida}` : ''}`,
          fecha: new Date(),
          creadoPor: systemUser.id,
        },
      });
    }

    const statusMessages: Record<string, string> = {
      nuevo: 'He registrado tu interés inicial.',
      contactado: 'Perfecto, he actualizado tu perfil.',
      calificado: '¡Genial! Veo que tienes un proyecto interesante.',
      propuesta: 'Te prepararemos una propuesta personalizada.',
      negociacion: 'Estamos avanzando bien en la conversación.',
      ganado: '¡Bienvenido a Inmova! Nos alegra tenerte.',
      perdido: 'Entiendo, gracias por tu tiempo. Si cambias de opinión, aquí estaremos.',
    };

    return statusMessages[params.status] || 'Estado actualizado correctamente.';
  } catch (error) {
    console.error('[Retell Webhook] Error updating lead status:', error);
    return 'He tenido un problema al actualizar tus datos. No te preocupes, lo anotaré manualmente.';
  }
}

// Función para crear nota en el lead
async function createNote(params: {
  telefono?: string;
  email?: string;
  titulo?: string;
  contenido: string;
  tipo?: string;
  retellCallId?: string;
}): Promise<string> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  try {
    // Buscar el lead
    let lead = null;

    if (params.telefono) {
      lead = await prisma.lead.findFirst({
        where: { telefono: params.telefono },
      });
    }

    if (!lead && params.email) {
      lead = await prisma.lead.findFirst({
        where: { email: params.email },
      });
    }

    // Si no encontramos el lead, crear uno temporal con los datos disponibles
    if (!lead) {
      const defaultCompany = await prisma.company.findFirst({
        where: { activa: true },
        select: { id: true },
      });

      if (!defaultCompany) {
        return 'Nota guardada en el registro de la llamada.';
      }

      lead = await prisma.lead.create({
        data: {
          companyId: defaultCompany.id,
          nombre: 'Lead desde llamada',
          email: params.email || 'pendiente@retell.ai',
          telefono: params.telefono,
          fuente: 'retell_ai',
          origenDetalle: 'Llamada telefónica con Carmen (Retell AI)',
          estado: 'nuevo',
          temperatura: 'tibio',
        },
      });
    }

    // Buscar usuario del sistema
    const systemUser = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' },
      select: { id: true },
    });

    if (!systemUser) {
      // Actualizar notas del lead directamente si no hay usuario
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          notas: `${lead.notas || ''}\n\n[${new Date().toLocaleString('es-ES')}] ${params.contenido}`.trim(),
        },
      });
      return 'Anotado.';
    }

    // Crear actividad/nota
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        tipo: params.tipo || 'llamada',
        titulo: params.titulo || 'Nota de llamada (Retell AI)',
        descripcion: params.contenido,
        fecha: new Date(),
        creadoPor: systemUser.id,
      },
    });

    return 'Anotado, gracias por la información.';
  } catch (error) {
    console.error('[Retell Webhook] Error creating note:', error);
    return 'De acuerdo, lo tengo en cuenta.';
  }
}

// Handler principal del webhook
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación del webhook (opcional pero recomendado)
    const retellSignature = request.headers.get('x-retell-signature');
    // TODO: Verificar firma si Retell proporciona un mecanismo
    
    const body = await request.json();
    
    // Estructura esperada de Retell AI
    const {
      call_id,
      transcript,
      response_id,
      interaction_type, // "response_required", "reminder", etc.
      messages = [], // Historial de conversación
    } = body;

    // Log para debugging
    console.log('[Retell Webhook] Received:', {
      call_id,
      interaction_type,
      transcript: transcript?.substring(0, 100),
    });

    // Si no se requiere respuesta, solo confirmar recepción
    if (interaction_type !== 'response_required') {
      return NextResponse.json({ 
        response_id,
        content: '',
        content_complete: true,
      });
    }

    // Construir historial de mensajes para OpenAI
    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Añadir historial de la conversación si existe
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        chatMessages.push({
          role: msg.role === 'agent' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    // Añadir el mensaje actual del usuario
    if (transcript) {
      chatMessages.push({ role: 'user', content: transcript });
    }

    // Llamar a OpenAI con function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: chatMessages,
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 300, // Respuestas cortas para llamadas de voz
    });

    const responseMessage = completion.choices[0].message;
    let finalResponse = responseMessage.content || '';

    // Procesar tool calls si hay
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolResults: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let result: string;

        switch (functionName) {
          case 'checkAvailability':
            result = await checkAvailability(functionArgs);
            break;
          case 'bookAppointment':
            result = await bookAppointment({
              ...functionArgs,
              retellCallId: call_id,
            });
            break;
          case 'updateLeadStatus':
            result = await updateLeadStatus({
              ...functionArgs,
              retellCallId: call_id,
            });
            break;
          case 'createNote':
            result = await createNote({
              ...functionArgs,
              retellCallId: call_id,
            });
            break;
          default:
            result = 'Función no reconocida';
        }

        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // Segunda llamada a OpenAI para generar respuesta con los resultados
      const followUpMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        ...chatMessages,
        responseMessage as OpenAI.Chat.Completions.ChatCompletionMessageParam,
        ...toolResults,
      ];

      const followUpCompletion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: followUpMessages,
        temperature: 0.7,
        max_tokens: 300,
      });

      finalResponse = followUpCompletion.choices[0].message.content || '';
    }

    // Respuesta para Retell AI
    return NextResponse.json({
      response_id,
      content: finalResponse,
      content_complete: true,
      // Opcional: metadata adicional
      end_call: false, // true si quieres terminar la llamada
    });

  } catch (error: any) {
    console.error('[Retell Webhook] Error:', error);
    
    // Respuesta de fallback
    return NextResponse.json({
      content: 'Disculpa, ha habido un problema técnico. ¿Podrías repetirme lo que decías?',
      content_complete: true,
    }, { status: 200 }); // Retornamos 200 para que Retell no reintente
  }
}

// Endpoint GET para verificar que el webhook está activo
export async function GET() {
  return NextResponse.json({
    status: 'active',
    agent: 'Carmen - Asistente de Ventas Inmova',
    capabilities: [
      'checkAvailability',
      'bookAppointment', 
      'updateLeadStatus',
      'createNote',
    ],
    version: '1.1.0',
  });
}
