import { prisma } from './db';

// ==========================================
// MÓDULO: ASISTENTE IA CONVERSACIONAL
// ==========================================

/**
 * Crea una nueva conversación con IA
 */
export async function createAIConversation(data: {
  companyId: string;
  userId?: string;
  tenantId?: string;
  canal?: string;
  idioma?: string;
}) {
  const conversation = await prisma.aIConversation.create({
    data: {
      companyId: data.companyId,
      userId: data.userId,
      tenantId: data.tenantId,
      canal: data.canal || 'web',
      idioma: data.idioma || 'es',
      estado: 'activa',
    },
  });

  return conversation;
}

/**
 * Agrega un mensaje a la conversación
 */
export async function addAIMessage(data: {
  conversationId: string;
  rol: 'user' | 'assistant' | 'system';
  contenido: string;
  tokenUsados?: number;
  modelo?: string;
  funciones?: any;
}) {
  const message = await prisma.aIMessage.create({
    data: {
      conversationId: data.conversationId,
      rol: data.rol,
      contenido: data.contenido,
      tokenUsados: data.tokenUsados,
      modelo: data.modelo || 'gpt-4-turbo',
      funciones: data.funciones,
    },
  });

  return message;
}

/**
 * Ejecuta un comando de IA
 */
export async function executeAICommand(data: {
  conversationId: string;
  comando: string;
  parametros?: any;
  funcion: string;
  ejecutadoPor?: string;
}) {
  try {
    // Simulación de ejecución de comando
    const resultado = await simulateCommandExecution(data.funcion, data.parametros);

    const command = await prisma.aICommand.create({
      data: {
        conversationId: data.conversationId,
        comando: data.comando,
        parametros: data.parametros,
        funcion: data.funcion,
        resultado,
        exitoso: true,
        ejecutadoPor: data.ejecutadoPor,
      },
    });

    return command;
  } catch (error: any) {
    const command = await prisma.aICommand.create({
      data: {
        conversationId: data.conversationId,
        comando: data.comando,
        parametros: data.parametros,
        funcion: data.funcion,
        exitoso: false,
        error: error.message,
        ejecutadoPor: data.ejecutadoPor,
      },
    });

    return command;
  }
}

/**
 * Simula la ejecución de un comando
 */
async function simulateCommandExecution(funcion: string, parametros: any) {
  // Mapeo de funciones disponibles
  const functions: Record<string, any> = {
    crearContrato: async (params: any) => {
      return { success: true, message: 'Contrato creado exitosamente', contractId: 'mock-id' };
    },
    programarMantenimiento: async (params: any) => {
      return { success: true, message: 'Mantenimiento programado', scheduleId: 'mock-id' };
    },
    enviarRecordatorio: async (params: any) => {
      return { success: true, message: 'Recordatorio enviado', recipients: params.recipients };
    },
    buscarInquilino: async (params: any) => {
      return { success: true, message: 'Búsqueda realizada', results: [] };
    },
  };

  if (functions[funcion]) {
    return await functions[funcion](parametros);
  }

  throw new Error(`Función ${funcion} no encontrada`);
}

/**
 * Procesa una interacción de voz
 */
export async function processVoiceInteraction(data: {
  companyId: string;
  userId?: string;
  audioUrl?: string;
  duracion?: number;
  transcripcion?: string;
  idioma?: string;
}) {
  // Simulación de procesamiento de voz
  const respuestaTexto = `He procesado tu comando: "${data.transcripcion}"`;

  const interaction = await prisma.voiceInteraction.create({
    data: {
      companyId: data.companyId,
      userId: data.userId,
      audioUrl: data.audioUrl,
      duracion: data.duracion,
      transcripcion: data.transcripcion,
      idioma: data.idioma || 'es',
      respuestaTexto,
      comando: extractCommand(data.transcripcion || ''),
      exitoso: true,
    },
  });

  return interaction;
}

/**
 * Extrae comando de la transcripción
 */
function extractCommand(transcripcion: string): string | undefined {
  const keywords = [
    'crear contrato',
    'programar mantenimiento',
    'enviar recordatorio',
    'buscar inquilino',
  ];

  for (const keyword of keywords) {
    if (transcripcion.toLowerCase().includes(keyword)) {
      return keyword;
    }
  }

  return undefined;
}

/**
 * Analiza el sentimiento de la conversación
 */
export async function analyzeSentiment(conversationId: string) {
  const messages = await prisma.aIMessage.findMany({
    where: { conversationId },
    orderBy: { timestamp: 'desc' },
    take: 10,
  });

  // Simulación de análisis de sentimiento
  const sentimiento = ['positivo', 'neutral', 'negativo'][Math.floor(Math.random() * 3)];
  const satisfaccion = Math.floor(Math.random() * 5) + 1; // 1-5

  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: {
      sentimiento,
      satisfaccion,
    },
  });

  return { sentimiento, satisfaccion };
}

/**
 * Obtiene estadísticas de uso del asistente
 */
export async function getAIUsageStats(companyId: string, fechaDesde?: Date, fechaHasta?: Date) {
  const where: any = { companyId };

  if (fechaDesde || fechaHasta) {
    where.createdAt = {};
    if (fechaDesde) where.createdAt.gte = fechaDesde;
    if (fechaHasta) where.createdAt.lte = fechaHasta;
  }

  const conversaciones = await prisma.aIConversation.count({ where });
  const mensajes = await prisma.aIMessage.count({
    where: {
      conversation: where,
    },
  });

  const comandosExitosos = await prisma.aICommand.count({
    where: {
      conversation: where,
      exitoso: true,
    },
  });

  const comandosFallidos = await prisma.aICommand.count({
    where: {
      conversation: where,
      exitoso: false,
    },
  });

  return {
    totalConversaciones: conversaciones,
    totalMensajes: mensajes,
    comandosExitosos,
    comandosFallidos,
    tasaExito:
      comandosExitosos + comandosFallidos > 0
        ? (comandosExitosos / (comandosExitosos + comandosFallidos)) * 100
        : 0,
  };
}
