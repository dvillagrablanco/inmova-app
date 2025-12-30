'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  Search,
  MoreVertical,
  CheckCheck,
  Check,
  Clock,
  X,
  Archive,
  Phone,
  Video,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  asunto: string;
  estado: string;
  tenantName: string;
  ultimoMensaje: string | null;
  ultimoMensajeFecha: string | null;
  unreadCount: number;
}

interface Message {
  id: string;
  senderType: string;
  mensaje: string;
  createdAt: string;
  leido: boolean;
}

interface ImprovedChatInterfaceProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  newMessage: string;
  sending: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  onSendMessage: () => void;
  onNewMessageChange: (message: string) => void;
  onCloseConversation: () => void;
}

export function ImprovedChatInterface({
  conversations,
  selectedConversation,
  messages,
  newMessage,
  sending,
  onSelectConversation,
  onSendMessage,
  onNewMessageChange,
  onCloseConversation,
}: ImprovedChatInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      inputRef.current?.focus();
    }
  }, [selectedConversation]);

  const filteredConversations = conversations.filter(
    (conv) =>
      (conv.asunto?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (conv.tenantName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMessageStatus = (message: Message) => {
    if (message.senderType !== 'admin') return null;
    if (message.leido) return <CheckCheck className="h-3 w-3 text-blue-500" />;
    return <Check className="h-3 w-3 text-gray-400" />;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-background rounded-lg border overflow-hidden">
      {/* Lista de Conversaciones */}
      <div
        className={cn(
          'w-full md:w-96 border-r flex flex-col bg-background',
          selectedConversation && 'hidden md:flex'
        )}
      >
        {/* Header de Lista */}
        <div className="p-4 border-b bg-card">
          <h2 className="text-xl font-semibold mb-3">Conversaciones</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Lista de Conversaciones */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No hay conversaciones</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={cn(
                  'p-4 border-b cursor-pointer transition-colors hover:bg-accent',
                  selectedConversation?.id === conversation.id && 'bg-accent border-l-4 border-l-primary'
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      {getInitials(conversation.tenantName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold truncate">{conversation.tenantName}</h3>
                      {conversation.ultimoMensajeFecha && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(conversation.ultimoMensajeFecha), {
                            addSuffix: false,
                            locale: es,
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-1">
                      {conversation.asunto}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.ultimoMensaje || 'Sin mensajes'}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="ml-2 bg-primary text-primary-foreground h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Área de Chat */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col bg-background">
          {/* Header del Chat */}
          <div className="p-4 border-b bg-card flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => onSelectConversation(null as any)}
            >
              <X className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                {getInitials(selectedConversation.tenantName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{selectedConversation.tenantName}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {selectedConversation.asunto}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onCloseConversation}>
                <Archive className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mensajes */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <div>
                    <p>No hay mensajes en esta conversación</p>
                    <p className="text-sm mt-2">Envía el primer mensaje para comenzar</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isAdmin = message.senderType === 'admin';
                  const showDate =
                    index === 0 ||
                    new Date(message.createdAt).toDateString() !==
                      new Date(messages[index - 1].createdAt).toDateString();

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <Badge variant="secondary" className="px-3 py-1">
                            {new Date(message.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </Badge>
                        </div>
                      )}
                      <div
                        className={cn(
                          'flex items-end gap-2 max-w-[80%]',
                          isAdmin ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        )}
                      >
                        {!isAdmin && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {getInitials(selectedConversation.tenantName)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2 break-words',
                            isAdmin
                              ? 'bg-primary text-primary-foreground rounded-br-none'
                              : 'bg-secondary text-secondary-foreground rounded-bl-none'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.mensaje}</p>
                          <div
                            className={cn(
                              'flex items-center justify-end gap-1 mt-1',
                              isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}
                          >
                            <span className="text-xs">
                              {new Date(message.createdAt).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {getMessageStatus(message)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input de Mensaje */}
          <div className="p-4 border-t bg-card">
            <div className="flex items-end gap-2">
              <Input
                ref={inputRef}
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => onNewMessageChange(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending || selectedConversation.estado === 'cerrada'}
                className="flex-1 min-h-[44px] max-h-32 resize-none"
              />
              <Button
                onClick={onSendMessage}
                disabled={!newMessage.trim() || sending || selectedConversation.estado === 'cerrada'}
                className="h-11 w-11 rounded-full flex-shrink-0"
                size="icon"
              >
                {sending ? (
                  <Clock className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            {selectedConversation.estado === 'cerrada' && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Esta conversación está cerrada
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-muted/10">
          <div className="text-center text-muted-foreground">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Send className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Selecciona una conversación</h3>
            <p>Elige una conversación de la lista para comenzar a chatear</p>
          </div>
        </div>
      )}
    </div>
  );
}
