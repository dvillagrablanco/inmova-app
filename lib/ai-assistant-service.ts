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
    const resultado = await executeCommand(data.funcion, data.parametros);

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
 * Ejecuta un comando con lógica real
 */
async function executeCommand(funcion: string, parametros: any) {
  switch (funcion) {
    case 'crearContrato': {
      if (!parametros?.unitId || !parametros?.tenantId || !parametros?.fechaInicio || !parametros?.fechaFin) {
        throw new Error('Parametros insuficientes para crear contrato');
      }
      if (!parametros?.rentaMensual || !parametros?.deposito) {
        throw new Error('Renta y deposito son obligatorios');
      }
      const contract = await prisma.contract.create({
        data: {
          unitId: parametros.unitId,
          tenantId: parametros.tenantId,
          fechaInicio: new Date(parametros.fechaInicio),
          fechaFin: new Date(parametros.fechaFin),
          rentaMensual: Number(parametros.rentaMensual),
          deposito: Number(parametros.deposito),
          diaPago: parametros.diaPago || 1,
          mesesFianza: parametros.mesesFianza || 1,
          renovacionAutomatica: Boolean(parametros.renovacionAutomatica),
          incrementoType: parametros.incrementoType || 'ipc',
          incrementoValor: parametros.incrementoValor || null,
          gastosIncluidos: parametros.gastosIncluidos || [],
          gastosExcluidos: parametros.gastosExcluidos || [],
          clausulasAdicionales: parametros.clausulasAdicionales || null,
          tipo: parametros.tipo || 'residencial',
          estado: parametros.estado || 'activo',
        },
      });
      return { success: true, contractId: contract.id };
    }
    case 'programarMantenimiento': {
      if (!parametros?.titulo || !parametros?.descripcion || !parametros?.tipo || !parametros?.frecuencia) {
        throw new Error('Parametros insuficientes para programar mantenimiento');
      }
      if (!parametros?.proximaFecha || (!parametros?.buildingId && !parametros?.unitId)) {
        throw new Error('Se requiere proximaFecha y buildingId o unitId');
      }
      const schedule = await prisma.maintenanceSchedule.create({
        data: {
          titulo: parametros.titulo,
          descripcion: parametros.descripcion,
          tipo: parametros.tipo,
          frecuencia: parametros.frecuencia,
          proximaFecha: new Date(parametros.proximaFecha),
          buildingId: parametros.buildingId || null,
          unitId: parametros.unitId || null,
          diasAnticipacion: parametros.diasAnticipacion || 15,
          providerId: parametros.providerId || null,
          costoEstimado: parametros.costoEstimado || null,
          notas: parametros.notas || null,
        },
      });
      return { success: true, scheduleId: schedule.id };
    }
    case 'enviarRecordatorio': {
      const companyId = parametros?.companyId;
      const recipients = parametros?.recipients;
      if (!companyId || !Array.isArray(recipients) || recipients.length === 0) {
        throw new Error('companyId y recipients son obligatorios');
      }
      const message = parametros?.message || 'Recordatorio automático';
      const subject = parametros?.subject || 'Recordatorio';
      await prisma.notificationLog.createMany({
        data: recipients.map((recipient: string) => ({
          companyId,
          tipo: 'info',
          canal: parametros?.channel || 'email',
          destinatario: recipient,
          asunto: subject,
          mensaje: message,
          estado: 'pendiente',
          metadatos: parametros?.metadata || null,
        })),
      });
      return { success: true, recipients: recipients.length };
    }
    case 'buscarInquilino': {
      const companyId = parametros?.companyId;
      if (!companyId) {
        throw new Error('companyId es obligatorio');
      }
      const query = parametros?.query?.toLowerCase();
      const results = await prisma.tenant.findMany({
        where: {
          companyId,
          ...(query
            ? {
                OR: [
                  { nombreCompleto: { contains: query, mode: 'insensitive' } },
                  { email: { contains: query, mode: 'insensitive' } },
                  { telefono: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          nombreCompleto: true,
          email: true,
          telefono: true,
        },
        take: 10,
      });
      return { success: true, results };
    }
    default:
      throw new Error(`Función ${funcion} no encontrada`);
  }
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
  if (!data.transcripcion) {
    throw new Error('Transcripcion requerida');
  }

  const comandoDetectado = extractCommand(data.transcripcion);
  const respuestaTexto = comandoDetectado
    ? `Comando detectado: "${comandoDetectado}". Lo he registrado para su ejecución.`
    : `No pude identificar un comando claro en: "${data.transcripcion}"`;

  const interaction = await prisma.voiceInteraction.create({
    data: {
      companyId: data.companyId,
      userId: data.userId,
      audioUrl: data.audioUrl,
      duracion: data.duracion,
      transcripcion: data.transcripcion,
      idioma: data.idioma || 'es',
      respuestaTexto,
      comando: comandoDetectado,
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

  const text = messages.map((msg) => msg.contenido).join(' ').toLowerCase();
  const positiveWords = ['excelente', 'genial', 'gracias', 'perfecto', 'encantado', 'feliz'];
  const negativeWords = ['malo', 'problema', 'queja', 'fallo', 'error', 'molesto'];

  let score = 0;
  positiveWords.forEach((word) => {
    if (text.includes(word)) score += 1;
  });
  negativeWords.forEach((word) => {
    if (text.includes(word)) score -= 1;
  });

  const sentimiento = score > 0 ? 'positivo' : score < 0 ? 'negativo' : 'neutral';
  const satisfaccion = Math.min(5, Math.max(1, 3 + score));

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
