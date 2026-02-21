/**
 * Servicio de Video Calls (WebRTC)
 * 
 * Implementa videollamadas P2P para tours virtuales en vivo.
 * 
 * Stack: WebRTC + Socket.io para signaling
 * 
 * @module WebRTCService
 */

import { getWebSocketServer } from './websocket-server';
import logger from './logger';

// ============================================================================
// TIPOS
// ============================================================================

export interface VideoCallRoom {
  id: string;
  propertyId?: string;
  participants: string[]; // userIds
  hostId: string;
  createdAt: Date;
  status: 'waiting' | 'active' | 'ended';
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  data: any;
}

// ============================================================================
// ROOMS MANAGEMENT
// ============================================================================

const activeRooms = new Map<string, VideoCallRoom>();

/**
 * Crea una sala de videollamada
 */
export function createVideoCallRoom(data: {
  hostId: string;
  propertyId?: string;
}): VideoCallRoom {
  const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const room: VideoCallRoom = {
    id: roomId,
    propertyId: data.propertyId,
    participants: [data.hostId],
    hostId: data.hostId,
    createdAt: new Date(),
    status: 'waiting',
  };

  activeRooms.set(roomId, room);

  logger.info('📹 Video call room created', { roomId, hostId: data.hostId });

  return room;
}

/**
 * Usuario se une a una sala
 */
export function joinVideoCallRoom(roomId: string, userId: string): VideoCallRoom | null {
  const room = activeRooms.get(roomId);

  if (!room) {
    return null;
  }

  if (!room.participants.includes(userId)) {
    room.participants.push(userId);

    if (room.participants.length === 2 && room.status === 'waiting') {
      room.status = 'active';
    }
  }

  logger.info('👤 User joined video call', { roomId, userId });

  return room;
}

/**
 * Usuario sale de una sala
 */
export function leaveVideoCallRoom(roomId: string, userId: string): void {
  const room = activeRooms.get(roomId);

  if (!room) {
    return;
  }

  room.participants = room.participants.filter((id) => id !== userId);

  // Si el host se va, terminar la llamada
  if (userId === room.hostId || room.participants.length === 0) {
    room.status = 'ended';
    activeRooms.delete(roomId);
    logger.info('📹 Video call room ended', { roomId });
  }

  logger.info('👋 User left video call', { roomId, userId });
}

/**
 * Obtiene información de una sala
 */
export function getVideoCallRoom(roomId: string): VideoCallRoom | null {
  return activeRooms.get(roomId) || null;
}

/**
 * Lista salas activas (para admin/debug)
 */
export function getActiveRooms(): VideoCallRoom[] {
  return Array.from(activeRooms.values());
}

// ============================================================================
// SIGNALING (WebSocket)
// ============================================================================

/**
 * Inicializa eventos WebRTC en el servidor WebSocket
 * 
 * Llamar esto después de initWebSocketServer()
 */
export function initWebRTCSignaling(): void {
  const io = getWebSocketServer();

  if (!io) {
    logger.error('❌ WebSocket server not initialized');
    return;
  }

  io.on('connection', (socket: any) => {
    /**
     * Crear sala de video
     */
    socket.on('webrtc:create-room', (data: { propertyId?: string }, callback) => {
      try {
        const room = createVideoCallRoom({
          hostId: socket.userId,
          propertyId: data.propertyId,
        });

        // Join socket room
        socket.join(`videocall:${room.id}`);

        callback({ success: true, room });
      } catch (error: any) {
        logger.error('Error creating video call room:', error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Unirse a sala
     */
    socket.on('webrtc:join-room', (data: { roomId: string }, callback) => {
      try {
        const room = joinVideoCallRoom(data.roomId, socket.userId);

        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        // Join socket room
        socket.join(`videocall:${room.id}`);

        // Notificar a otros participantes
        socket.to(`videocall:${room.id}`).emit('webrtc:user-joined', {
          userId: socket.userId,
          participants: room.participants,
        });

        callback({ success: true, room });
      } catch (error: any) {
        logger.error('Error joining video call room:', error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Salir de sala
     */
    socket.on('webrtc:leave-room', (data: { roomId: string }) => {
      leaveVideoCallRoom(data.roomId, socket.userId);

      socket.to(`videocall:${data.roomId}`).emit('webrtc:user-left', {
        userId: socket.userId,
      });

      socket.leave(`videocall:${data.roomId}`);
    });

    /**
     * WebRTC Signaling: Offer
     */
    socket.on('webrtc:offer', (data: { roomId: string; offer: any; to: string }) => {
      io.to(`user:${data.to}`).emit('webrtc:offer', {
        from: socket.userId,
        offer: data.offer,
        roomId: data.roomId,
      });

      logger.debug('📹 WebRTC offer sent', {
        from: socket.userId,
        to: data.to,
        roomId: data.roomId,
      });
    });

    /**
     * WebRTC Signaling: Answer
     */
    socket.on('webrtc:answer', (data: { roomId: string; answer: any; to: string }) => {
      io.to(`user:${data.to}`).emit('webrtc:answer', {
        from: socket.userId,
        answer: data.answer,
        roomId: data.roomId,
      });

      logger.debug('📹 WebRTC answer sent', {
        from: socket.userId,
        to: data.to,
      });
    });

    /**
     * WebRTC Signaling: ICE Candidate
     */
    socket.on('webrtc:ice-candidate', (data: { roomId: string; candidate: any; to: string }) => {
      io.to(`user:${data.to}`).emit('webrtc:ice-candidate', {
        from: socket.userId,
        candidate: data.candidate,
        roomId: data.roomId,
      });
    });

    /**
     * Disconnect - limpiar salas
     */
    socket.on('disconnect', () => {
      // Buscar y limpiar salas donde el usuario estaba
      activeRooms.forEach((room, roomId) => {
        if (room.participants.includes(socket.userId)) {
          leaveVideoCallRoom(roomId, socket.userId);
          io.to(`videocall:${roomId}`).emit('webrtc:user-left', {
            userId: socket.userId,
          });
        }
      });
    });
  });

  logger.info('✅ WebRTC signaling initialized');
}

export default {
  createVideoCallRoom,
  joinVideoCallRoom,
  leaveVideoCallRoom,
  getVideoCallRoom,
  getActiveRooms,
  initWebRTCSignaling,
};
