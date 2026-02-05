'use client';

/**
 * Portal Inquilino - Comunicación
 * 
 * Sistema de mensajería entre inquilino y propietario/gestor
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Paperclip,
  MessageCircle,
  User,
  Clock,
  Check,
  CheckCheck,
  Image as ImageIcon,
  File,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

interface Message {
  id: string;
  contenido: string;
  emisorTipo: 'inquilino' | 'gestor' | 'propietario';
  emisorNombre: string;
  leido: boolean;
  createdAt: string;
  adjuntos?: string[];
}

interface Conversation {
  id: string;
  asunto: string;
  ultimoMensaje: string;
  ultimaFecha: string;
  sinLeer: number;
  participante: {
    nombre: string;
    rol: string;
  };
}

export default function PortalInquilinoComunicacionPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mapSenderType = (senderType?: string): Message['emisorTipo'] => {
    if (senderType === 'tenant') return 'inquilino';
    if (senderType === 'user') return 'gestor';
    if (senderType === 'owner') return 'propietario';
    return 'gestor';
  };

  const normalizeConversation = (conv: any): Conversation => {
    const lastMessage = Array.isArray(conv?.messages) ? conv.messages[0] : null;

    return {
      id: conv.id,
      asunto: conv.asunto ?? 'Sin asunto',
      ultimoMensaje: conv.ultimoMensaje ?? lastMessage?.mensaje ?? '',
      ultimaFecha:
        conv.ultimaFecha ??
        conv.ultimoMensajeFecha ??
        lastMessage?.createdAt ??
        conv.createdAt ??
        new Date().toISOString(),
      sinLeer: typeof conv.sinLeer === 'number' ? conv.sinLeer : conv.unreadCount ?? 0,
      participante: conv.participante ?? {
        nombre: conv.participanteNombre ?? 'Administración',
        rol: conv.participanteRol ?? 'Gestor',
      },
    };
  };

  const normalizeMessage = (message: any): Message => ({
    id: message.id,
    contenido: message.contenido ?? message.mensaje ?? '',
    emisorTipo: message.emisorTipo ?? mapSenderType(message.senderType),
    emisorNombre:
      message.emisorNombre ??
      (message.senderType === 'tenant' ? 'Tú' : 'Administración'),
    leido: Boolean(message.leido),
    createdAt: message.createdAt ?? new Date().toISOString(),
    adjuntos: Array.isArray(message.adjuntos) ? message.adjuntos : [],
  });

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portal-inquilino/chat/conversations');
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sesión expirada');
          return;
        }
        throw new Error('Error al cargar conversaciones');
      }

      const data = await response.json();
      const conversationList = Array.isArray(data)
        ? data
        : Array.isArray(data?.conversations)
          ? data.conversations
          : [];
      const normalizedConversations = conversationList.map(normalizeConversation);
      setConversations(normalizedConversations);
      
      // Seleccionar primera conversación si existe
      if (normalizedConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(normalizedConversations[0]);
      }
    } catch (error) {
      toast.error('Error al cargar conversaciones');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/portal-inquilino/chat/messages?conversationId=${conversationId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar mensajes');
      }

      const data = await response.json();
      const messageList = Array.isArray(data)
        ? data
        : Array.isArray(data?.messages)
          ? data.messages
          : [];
      setMessages(messageList.map(normalizeMessage));
    } catch (error) {
      toast.error('Error al cargar mensajes');
      setMessages([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const response = await fetch('/api/portal-inquilino/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          contenido: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      const sentMessage = await response.json();
      setMessages([...messages, sentMessage]);
      setNewMessage('');
    } catch (error) {
      toast.error('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const response = await fetch('/api/portal-inquilino/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asunto: 'Nueva consulta',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear conversación');
      }

      const newConv = await response.json();
      setConversations([newConv, ...conversations]);
      setSelectedConversation(newConv);
      toast.success('Conversación creada');
    } catch (error) {
      toast.error('Error al crear conversación');
    }
  };

  const formatMessageDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Ayer ' + format(date, 'HH:mm');
    return format(date, "d MMM HH:mm", { locale: es });
  };

  const formatConversationDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Ayer';
    return format(date, "d MMM", { locale: es });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Comunicación</h1>
          <p className="text-muted-foreground">
            Mensajería con tu gestor o propietario
          </p>
        </div>
        <Button onClick={handleNewConversation}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Nueva Conversación
        </Button>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Conversaciones</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              No tienes conversaciones activas. Inicia una nueva para comunicarte
              con tu gestor o propietario.
            </p>
            <Button onClick={handleNewConversation}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Iniciar Conversación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          {/* Lista de Conversaciones */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversaciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedConversation?.id === conv.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {conv.participante.nombre.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium truncate">
                            {conv.participante.nombre}
                          </p>
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            {formatConversationDate(conv.ultimaFecha)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.asunto}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conv.ultimoMensaje}
                        </p>
                      </div>
                      {conv.sinLeer > 0 && (
                        <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                          {conv.sinLeer}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Área de Mensajes */}
          <Card className="md:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header de la conversación */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {selectedConversation.participante.nombre.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedConversation.participante.nombre}
                        </CardTitle>
                        <CardDescription>
                          {selectedConversation.participante.rol}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{selectedConversation.asunto}</Badge>
                  </div>
                </CardHeader>

                {/* Mensajes */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-[380px] p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.emisorTipo === 'inquilino' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.emisorTipo === 'inquilino'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.emisorTipo !== 'inquilino' && (
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {message.emisorNombre}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{message.contenido}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              message.emisorTipo === 'inquilino'
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}>
                              <span className="text-xs">
                                {formatMessageDate(message.createdAt)}
                              </span>
                              {message.emisorTipo === 'inquilino' && (
                                message.leido ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Input de mensaje */}
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Button type="button" variant="ghost" size="icon" disabled>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Escribe un mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!newMessage.trim() || sending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-full">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Selecciona una conversación para ver los mensajes
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
