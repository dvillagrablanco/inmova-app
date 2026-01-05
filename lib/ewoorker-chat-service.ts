/**
 * Servicio de Chat en Tiempo Real para eWoorker
 *
 * Maneja comunicación entre empresas:
 * - Chat por obra
 * - Chat por contrato
 * - Mensajes directos
 * - Notificaciones en tiempo real
 *
 * Usa Server-Sent Events (SSE) para tiempo real
 * (WebSockets requeriría servidor custom)
 *
 * @module EwoorkerChatService
 */

import { prisma } from './db';
import logger from './logger';
import { ewoorkerNotifications } from './ewoorker-notifications-service';

// ============================================================================
// TIPOS
// ============================================================================

export interface ChatMessage {
  id: string;
  conversacionId: string;
  remitente: {
    id: string;
    nombre: string;
    avatar?: string;
    empresa: string;
  };
  contenido: string;
  tipo: 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM';
  archivoUrl?: string;
  archivoNombre?: string;
  leido: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  tipo: 'OBRA' | 'CONTRATO' | 'DIRECTO';
  referenciaId?: string;
  referenciaTitulo?: string;
  participantes: {
    id: string;
    nombre: string;
    avatar?: string;
    empresa: string;
    online?: boolean;
  }[];
  ultimoMensaje?: ChatMessage;
  mensajesNoLeidos: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatEvent {
  type: 'NEW_MESSAGE' | 'MESSAGE_READ' | 'TYPING' | 'USER_ONLINE' | 'USER_OFFLINE';
  data: any;
  timestamp: Date;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class EwoorkerChatService {
  // Almacenamiento temporal de conexiones SSE (en producción usar Redis)
  private connections: Map<string, Set<(event: ChatEvent) => void>> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map();

  // --------------------------------------------------------------------------
  // GESTIÓN DE CONVERSACIONES
  // --------------------------------------------------------------------------

  /**
   * Obtiene o crea conversación para una obra
   */
  async getOrCreateObraConversation(
    obraId: string,
    empresaId1: string,
    empresaId2: string
  ): Promise<Conversation | null> {
    try {
      // Buscar conversación existente
      let conversacion = await prisma.ewoorkerConversacion.findFirst({
        where: {
          tipo: 'OBRA',
          obraId,
          participantes: {
            every: {
              perfilEmpresaId: { in: [empresaId1, empresaId2] },
            },
          },
        },
        include: {
          participantes: {
            include: {
              perfilEmpresa: {
                include: { company: true },
              },
            },
          },
          mensajes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              remitente: {
                include: {
                  perfilEmpresa: { include: { company: true } },
                },
              },
            },
          },
          obra: { select: { titulo: true } },
        },
      });

      if (!conversacion) {
        // Crear nueva conversación
        conversacion = await prisma.ewoorkerConversacion.create({
          data: {
            tipo: 'OBRA',
            obraId,
            participantes: {
              create: [{ perfilEmpresaId: empresaId1 }, { perfilEmpresaId: empresaId2 }],
            },
          },
          include: {
            participantes: {
              include: {
                perfilEmpresa: {
                  include: { company: true },
                },
              },
            },
            mensajes: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                remitente: {
                  include: {
                    perfilEmpresa: { include: { company: true } },
                  },
                },
              },
            },
            obra: { select: { titulo: true } },
          },
        });
      }

      return this.formatConversation(conversacion);
    } catch (error: any) {
      logger.error('[EwoorkerChat] Error obteniendo/creando conversación:', error);
      return null;
    }
  }

  /**
   * Obtiene conversaciones de una empresa
   */
  async getConversations(
    perfilEmpresaId: string,
    options?: { tipo?: 'OBRA' | 'CONTRATO' | 'DIRECTO'; limit?: number }
  ): Promise<Conversation[]> {
    try {
      const conversaciones = await prisma.ewoorkerConversacion.findMany({
        where: {
          participantes: {
            some: { perfilEmpresaId },
          },
          ...(options?.tipo && { tipo: options.tipo }),
        },
        include: {
          participantes: {
            include: {
              perfilEmpresa: {
                include: { company: true },
              },
            },
          },
          mensajes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              remitente: {
                include: {
                  perfilEmpresa: { include: { company: true } },
                },
              },
            },
          },
          obra: { select: { titulo: true } },
          contrato: { select: { numeroContrato: true } },
          _count: {
            select: {
              mensajes: {
                where: {
                  leido: false,
                  NOT: {
                    remitente: { perfilEmpresaId },
                  },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: options?.limit || 50,
      });

      return conversaciones.map((c) => this.formatConversation(c));
    } catch (error: any) {
      logger.error('[EwoorkerChat] Error obteniendo conversaciones:', error);
      return [];
    }
  }

  /**
   * Obtiene mensajes de una conversación
   */
  async getMessages(
    conversacionId: string,
    perfilEmpresaId: string,
    options?: { before?: Date; limit?: number }
  ): Promise<ChatMessage[]> {
    try {
      // Verificar que la empresa es participante
      const participante = await prisma.ewoorkerParticipanteConversacion.findFirst({
        where: {
          conversacionId,
          perfilEmpresaId,
        },
      });

      if (!participante) {
        return [];
      }

      const mensajes = await prisma.ewoorkerMensajeChat.findMany({
        where: {
          conversacionId,
          ...(options?.before && { createdAt: { lt: options.before } }),
        },
        include: {
          remitente: {
            include: {
              perfilEmpresa: { include: { company: true } },
              user: { select: { nombre: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
      });

      // Marcar como leídos
      await prisma.ewoorkerMensajeChat.updateMany({
        where: {
          conversacionId,
          leido: false,
          NOT: {
            remitente: { perfilEmpresaId },
          },
        },
        data: { leido: true, leidoAt: new Date() },
      });

      return mensajes.reverse().map((m) => this.formatMessage(m));
    } catch (error: any) {
      logger.error('[EwoorkerChat] Error obteniendo mensajes:', error);
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // ENVÍO DE MENSAJES
  // --------------------------------------------------------------------------

  /**
   * Envía un mensaje en una conversación
   */
  async sendMessage(
    conversacionId: string,
    remitenteId: string, // ID del participante
    contenido: string,
    tipo: 'TEXT' | 'FILE' | 'IMAGE' = 'TEXT',
    archivo?: { url: string; nombre: string }
  ): Promise<ChatMessage | null> {
    try {
      // Verificar que el remitente es participante
      const participante = await prisma.ewoorkerParticipanteConversacion.findUnique({
        where: { id: remitenteId },
        include: {
          perfilEmpresa: { include: { company: true } },
          conversacion: {
            include: {
              participantes: {
                include: {
                  perfilEmpresa: {
                    include: {
                      company: {
                        include: {
                          users: { where: { activo: true }, select: { id: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!participante) {
        return null;
      }

      // Crear mensaje
      const mensaje = await prisma.ewoorkerMensajeChat.create({
        data: {
          conversacionId,
          remitenteId,
          contenido,
          tipo,
          archivoUrl: archivo?.url,
          archivoNombre: archivo?.nombre,
        },
        include: {
          remitente: {
            include: {
              perfilEmpresa: { include: { company: true } },
              user: { select: { nombre: true, avatarUrl: true } },
            },
          },
        },
      });

      // Actualizar timestamp de conversación
      await prisma.ewoorkerConversacion.update({
        where: { id: conversacionId },
        data: { updatedAt: new Date() },
      });

      const formattedMessage = this.formatMessage(mensaje);

      // Emitir evento a todos los participantes
      this.emitToConversation(conversacionId, {
        type: 'NEW_MESSAGE',
        data: formattedMessage,
        timestamp: new Date(),
      });

      // Notificación push a otros participantes
      const otrosParticipantes = participante.conversacion.participantes.filter(
        (p) => p.id !== remitenteId
      );

      for (const p of otrosParticipantes) {
        const userIds = p.perfilEmpresa.company.users.map((u) => u.id);
        for (const userId of userIds) {
          await ewoorkerNotifications.sendPushToUser(userId, {
            type: 'MENSAJE_OBRA',
            title: `💬 ${participante.perfilEmpresa.company.nombre}`,
            body: contenido.length > 100 ? contenido.substring(0, 100) + '...' : contenido,
            url: `/ewoorker/chat/${conversacionId}`,
            priority: 'normal',
            data: { conversacionId },
          });
        }
      }

      logger.debug('[EwoorkerChat] Mensaje enviado:', mensaje.id);

      return formattedMessage;
    } catch (error: any) {
      logger.error('[EwoorkerChat] Error enviando mensaje:', error);
      return null;
    }
  }

  /**
   * Marca mensajes como leídos
   */
  async markAsRead(conversacionId: string, perfilEmpresaId: string): Promise<number> {
    try {
      const result = await prisma.ewoorkerMensajeChat.updateMany({
        where: {
          conversacionId,
          leido: false,
          remitente: {
            NOT: { perfilEmpresaId },
          },
        },
        data: {
          leido: true,
          leidoAt: new Date(),
        },
      });

      // Emitir evento de lectura
      this.emitToConversation(conversacionId, {
        type: 'MESSAGE_READ',
        data: { perfilEmpresaId, count: result.count },
        timestamp: new Date(),
      });

      return result.count;
    } catch (error: any) {
      logger.error('[EwoorkerChat] Error marcando como leído:', error);
      return 0;
    }
  }

  // --------------------------------------------------------------------------
  // TIEMPO REAL (SSE)
  // --------------------------------------------------------------------------

  /**
   * Suscribe un usuario a eventos de conversación
   */
  subscribe(conversacionId: string, callback: (event: ChatEvent) => void): () => void {
    if (!this.connections.has(conversacionId)) {
      this.connections.set(conversacionId, new Set());
    }
    this.connections.get(conversacionId)!.add(callback);

    // Retornar función de unsuscribe
    return () => {
      this.connections.get(conversacionId)?.delete(callback);
    };
  }

  /**
   * Emite evento a todos los suscriptores de una conversación
   */
  private emitToConversation(conversacionId: string, event: ChatEvent): void {
    const callbacks = this.connections.get(conversacionId);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(event);
        } catch (error) {
          logger.warn('[EwoorkerChat] Error emitiendo evento:', error);
        }
      });
    }
  }

  /**
   * Notifica que un usuario está escribiendo
   */
  notifyTyping(conversacionId: string, perfilEmpresaId: string): void {
    if (!this.typingUsers.has(conversacionId)) {
      this.typingUsers.set(conversacionId, new Set());
    }
    this.typingUsers.get(conversacionId)!.add(perfilEmpresaId);

    this.emitToConversation(conversacionId, {
      type: 'TYPING',
      data: { perfilEmpresaId },
      timestamp: new Date(),
    });

    // Limpiar después de 3 segundos
    setTimeout(() => {
      this.typingUsers.get(conversacionId)?.delete(perfilEmpresaId);
    }, 3000);
  }

  // --------------------------------------------------------------------------
  // ESTADÍSTICAS
  // --------------------------------------------------------------------------

  /**
   * Obtiene estadísticas de chat de una empresa
   */
  async getChatStats(perfilEmpresaId: string): Promise<{
    conversacionesActivas: number;
    mensajesNoLeidos: number;
    mensajesEnviados: number;
    mensajesRecibidos: number;
    tiempoRespuestaPromedio?: number;
  }> {
    try {
      const [conversacionesActivas, mensajesNoLeidos, mensajesEnviados, mensajesRecibidos] =
        await Promise.all([
          prisma.ewoorkerConversacion.count({
            where: {
              participantes: { some: { perfilEmpresaId } },
              mensajes: { some: {} },
            },
          }),
          prisma.ewoorkerMensajeChat.count({
            where: {
              conversacion: {
                participantes: { some: { perfilEmpresaId } },
              },
              leido: false,
              NOT: {
                remitente: { perfilEmpresaId },
              },
            },
          }),
          prisma.ewoorkerMensajeChat.count({
            where: {
              remitente: { perfilEmpresaId },
            },
          }),
          prisma.ewoorkerMensajeChat.count({
            where: {
              conversacion: {
                participantes: { some: { perfilEmpresaId } },
              },
              NOT: {
                remitente: { perfilEmpresaId },
              },
            },
          }),
        ]);

      return {
        conversacionesActivas,
        mensajesNoLeidos,
        mensajesEnviados,
        mensajesRecibidos,
      };
    } catch (error: any) {
      logger.error('[EwoorkerChat] Error obteniendo stats:', error);
      return {
        conversacionesActivas: 0,
        mensajesNoLeidos: 0,
        mensajesEnviados: 0,
        mensajesRecibidos: 0,
      };
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS PRIVADOS
  // --------------------------------------------------------------------------

  private formatConversation(conv: any): Conversation {
    const ultimoMensaje = conv.mensajes?.[0];

    return {
      id: conv.id,
      tipo: conv.tipo,
      referenciaId: conv.obraId || conv.contratoId || undefined,
      referenciaTitulo: conv.obra?.titulo || conv.contrato?.numeroContrato || undefined,
      participantes: conv.participantes.map((p: any) => ({
        id: p.id,
        nombre: p.perfilEmpresa.company.nombre,
        avatar: p.perfilEmpresa.logoUrl,
        empresa: p.perfilEmpresa.company.nombre,
      })),
      ultimoMensaje: ultimoMensaje ? this.formatMessage(ultimoMensaje) : undefined,
      mensajesNoLeidos: conv._count?.mensajes || 0,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  private formatMessage(msg: any): ChatMessage {
    return {
      id: msg.id,
      conversacionId: msg.conversacionId,
      remitente: {
        id: msg.remitenteId,
        nombre:
          msg.remitente?.user?.nombre || msg.remitente?.perfilEmpresa?.company?.nombre || 'Usuario',
        avatar: msg.remitente?.user?.avatarUrl || msg.remitente?.perfilEmpresa?.logoUrl,
        empresa: msg.remitente?.perfilEmpresa?.company?.nombre || '',
      },
      contenido: msg.contenido,
      tipo: msg.tipo,
      archivoUrl: msg.archivoUrl,
      archivoNombre: msg.archivoNombre,
      leido: msg.leido,
      createdAt: msg.createdAt,
    };
  }
}

// Exportar instancia singleton
export const ewoorkerChat = new EwoorkerChatService();

export default ewoorkerChat;
