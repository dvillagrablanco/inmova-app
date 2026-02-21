/**
 * WebSocket Server
 * 
 * Real-time bidireccional para chat, notifications, live updates.
 * 
 * Stack: Socket.io (server + client)
 * 
 * @module WebSocketServer
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';
// Lazy Prisma loading
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
import logger from './logger';

// ============================================================================
// TIPOS
// ============================================================================

export interface AuthenticatedSocket extends Socket {
  userId: string;
  companyId: string;
  userRole: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file';
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface LiveNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// SERVIDOR WEBSOCKET
// ============================================================================

let io: SocketIOServer | null = null;

/**
 * Inicializa el servidor WebSocket
 */
export function initWebSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
    path: '/api/socket',
    transports: ['websocket', 'polling'],
  });

  // Middleware de autenticación
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verificar token (NextAuth session)
      // En producción, deberías verificar el JWT o session token
      const userId = socket.handshake.auth.userId;
      const companyId = socket.handshake.auth.companyId;

      if (!userId) {
        return next(new Error('Invalid token'));
      }

      // Extender socket con datos de auth
      (socket as AuthenticatedSocket).userId = userId;
      (socket as AuthenticatedSocket).companyId = companyId;
      (socket as AuthenticatedSocket).userRole = socket.handshake.auth.userRole || 'USER';

      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Manejadores de eventos
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    
    logger.info('🔌 WebSocket client connected', {
      socketId: socket.id,
      userId: authSocket.userId,
    });

    // Join user's personal room
    socket.join(`user:${authSocket.userId}`);
    socket.join(`company:${authSocket.companyId}`);

    // ========================================================================
    // CHAT EVENTS
    // ========================================================================

    /**
     * Join conversation
     */
    socket.on('chat:join', async (conversationId: string) => {
      try {
        // Verificar que el usuario tiene acceso a la conversación
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { participants: true },
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.userId === authSocket.userId
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        socket.emit('chat:joined', { conversationId });

        logger.info('👤 User joined conversation', {
          userId: authSocket.userId,
          conversationId,
        });
      } catch (error: any) {
        logger.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    /**
     * Send message
     */
    socket.on('chat:message', async (data: {
      conversationId: string;
      content: string;
      type?: 'text' | 'image' | 'file';
      metadata?: Record<string, any>;
    }) => {
      try {
        // Guardar mensaje en BD
        const message = await prisma.message.create({
          data: {
            conversationId: data.conversationId,
            senderId: authSocket.userId,
            content: data.content,
            type: data.type || 'text',
            metadata: data.metadata,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Broadcast a todos los participantes
        io!.to(`conversation:${data.conversationId}`).emit('chat:message', {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderName: message.sender.name,
          content: message.content,
          type: message.type,
          metadata: message.metadata,
          timestamp: message.createdAt,
        });

        logger.info('💬 Chat message sent', {
          messageId: message.id,
          conversationId: data.conversationId,
        });
      } catch (error: any) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Typing indicator
     */
    socket.on('chat:typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${data.conversationId}`).emit('chat:typing', {
        conversationId: data.conversationId,
        userId: authSocket.userId,
        isTyping: data.isTyping,
      });
    });

    /**
     * Mark as read
     */
    socket.on('chat:read', async (data: { conversationId: string; messageId: string }) => {
      try {
        await prisma.messageRead.create({
          data: {
            messageId: data.messageId,
            userId: authSocket.userId,
          },
        });

        socket.to(`conversation:${data.conversationId}`).emit('chat:read', {
          conversationId: data.conversationId,
          messageId: data.messageId,
          userId: authSocket.userId,
        });
      } catch (error: any) {
        logger.error('Error marking message as read:', error);
      }
    });

    // ========================================================================
    // LIVE NOTIFICATIONS
    // ========================================================================

    /**
     * Client ready to receive notifications
     */
    socket.on('notifications:subscribe', () => {
      socket.emit('notifications:subscribed');
      logger.info('🔔 User subscribed to notifications', { userId: authSocket.userId });
    });

    // ========================================================================
    // LIVE UPDATES (Property changes, etc.)
    // ========================================================================

    /**
     * Subscribe to property updates
     */
    socket.on('property:subscribe', (propertyId: string) => {
      socket.join(`property:${propertyId}`);
      logger.info('🏠 User subscribed to property updates', { propertyId });
    });

    socket.on('property:unsubscribe', (propertyId: string) => {
      socket.leave(`property:${propertyId}`);
    });

    // ========================================================================
    // DISCONNECT
    // ========================================================================

    socket.on('disconnect', (reason) => {
      logger.info('🔌 WebSocket client disconnected', {
        socketId: socket.id,
        userId: authSocket.userId,
        reason,
      });
    });
  });

  logger.info('✅ WebSocket server initialized');

  return io;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Envía notificación live a un usuario específico
 */
export async function sendLiveNotification(notification: LiveNotification): Promise<void> {
  const prisma = await getPrisma();
  if (!io) {
    logger.warn('⚠️ WebSocket server not initialized');
    return;
  }

  io.to(`user:${notification.userId}`).emit('notification:new', notification);

  logger.info('🔔 Live notification sent', {
    userId: notification.userId,
    type: notification.type,
  });
}

/**
 * Broadcast a todos los usuarios de una company
 */
export async function broadcastToCompany(companyId: string, event: string, data: any): Promise<void> {
  const prisma = await getPrisma();
  if (!io) {
    logger.warn('⚠️ WebSocket server not initialized');
    return;
  }

  io.to(`company:${companyId}`).emit(event, data);

  logger.info('📢 Broadcast to company', { companyId, event });
}

/**
 * Envía actualización de propiedad a subscriptores
 */
export async function sendPropertyUpdate(propertyId: string, update: any): Promise<void> {
  const prisma = await getPrisma();
  if (!io) {
    logger.warn('⚠️ WebSocket server not initialized');
    return;
  }

  io.to(`property:${propertyId}`).emit('property:updated', {
    propertyId,
    ...update,
  });

  logger.info('🏠 Property update sent', { propertyId });
}

/**
 * Obtiene usuarios conectados
 */
export async function getConnectedUsers(): Promise<string[]> {
  const prisma = await getPrisma();
  if (!io) {
    return [];
  }

  const sockets = await io.fetchSockets();
  return sockets.map((socket) => (socket as any).userId).filter(Boolean);
}

/**
 * Obtiene instancia del servidor WebSocket
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

export default {
  initWebSocketServer,
  sendLiveNotification,
  broadcastToCompany,
  sendPropertyUpdate,
  getConnectedUsers,
  getWebSocketServer,
};
