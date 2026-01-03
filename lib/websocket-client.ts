/**
 * WebSocket Client
 * 
 * Cliente para conectar a WebSocket server desde React.
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

interface WebSocketState {
  connected: boolean;
  error: Error | null;
  socket: Socket | null;
}

/**
 * Hook para conectar a WebSocket
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { data: session } = useSession();
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    error: null,
    socket: null,
  });

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.user || socketRef.current) {
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socket',
      auth: {
        token: session.accessToken,
        userId: session.user.id,
        companyId: session.user.companyId,
        userRole: session.user.role,
      },
      transports: ['websocket', 'polling'],
      autoConnect: options.autoConnect !== false,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setState((prev) => ({ ...prev, connected: true, error: null }));
      options.onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      setState((prev) => ({ ...prev, connected: false }));
      options.onDisconnect?.(reason);
    });

    socket.on('error', (error: Error) => {
      setState((prev) => ({ ...prev, error }));
      options.onError?.(error);
    });

    setState((prev) => ({ ...prev, socket }));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session]);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  return {
    ...state,
    emit,
    on,
  };
}

/**
 * Hook para chat en tiempo real
 */
export function useChat(conversationId: string) {
  const { socket, emit, on, connected } = useWebSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [typing, setTyping] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!connected || !conversationId) return;

    // Join conversation
    emit('chat:join', conversationId);

    // Listen for new messages
    const unsubscribeMessage = on('chat:message', (message: any) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing indicators
    const unsubscribeTyping = on('chat:typing', (data: any) => {
      setTyping((prev) => ({
        ...prev,
        [data.userId]: data.isTyping,
      }));
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
    };
  }, [connected, conversationId]);

  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'file' = 'text') => {
    emit('chat:message', {
      conversationId,
      content,
      type,
    });
  }, [conversationId, emit]);

  const setIsTyping = useCallback((isTyping: boolean) => {
    emit('chat:typing', {
      conversationId,
      isTyping,
    });
  }, [conversationId, emit]);

  const markAsRead = useCallback((messageId: string) => {
    emit('chat:read', {
      conversationId,
      messageId,
    });
  }, [conversationId, emit]);

  return {
    messages,
    typing,
    sendMessage,
    setIsTyping,
    markAsRead,
    connected,
  };
}

/**
 * Hook para notificaciones live
 */
export function useLiveNotifications() {
  const { on, emit, connected } = useWebSocket();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!connected) return;

    emit('notifications:subscribe');

    const unsubscribe = on('notification:new', (notification: any) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return unsubscribe;
  }, [connected]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    clearNotifications,
    connected,
  };
}

/**
 * Hook para property updates live
 */
export function usePropertyUpdates(propertyId: string) {
  const { on, emit, connected } = useWebSocket();
  const [lastUpdate, setLastUpdate] = useState<any>(null);

  useEffect(() => {
    if (!connected || !propertyId) return;

    emit('property:subscribe', propertyId);

    const unsubscribe = on('property:updated', (update: any) => {
      setLastUpdate(update);
    });

    return () => {
      emit('property:unsubscribe', propertyId);
      unsubscribe();
    };
  }, [connected, propertyId]);

  return {
    lastUpdate,
    connected,
  };
}
