'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useState, useEffect, useRef } from 'react';
import logger from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Plus, Send, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Conversation {
  id: string;
  asunto: string;
  estado: string;
  ultimoMensaje: string;
  ultimoMensajeFecha: string;
  ultimoMensajePor: string;
  mensajesNoLeidosProveedor: number;
  mensajes?: Message[];
}

interface Message {
  id: string;
  remitenteTipo: string;
  remitenteNombre: string;
  contenido: string;
  leido: boolean;
  createdAt: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [newConversation, setNewConversation] = useState({ asunto: '', mensajeInicial: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      const interval = setInterval(() => fetchMessages(selectedConversation), 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/portal-proveedor/chat/conversations', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      logger.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/portal-proveedor/chat/messages?conversacionId=${conversationId}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      logger.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch('/api/portal-proveedor/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversacionId: selectedConversation,
          contenido: messageContent,
        }),
      });

      if (!response.ok) throw new Error('Error al enviar mensaje');

      setMessageContent('');
      await fetchMessages(selectedConversation);
      await fetchConversations();
    } catch (error) {
      logger.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!newConversation.asunto || !newConversation.mensajeInicial) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const response = await fetch('/api/portal-proveedor/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newConversation),
      });

      if (!response.ok) throw new Error('Error al crear conversación');

      const conversation = await response.json();
      toast.success('Conversación creada correctamente');
      setShowNewConversationDialog(false);
      setNewConversation({ asunto: '', mensajeInicial: '' });
      await fetchConversations();
      setSelectedConversation(conversation.id);
    } catch (error) {
      logger.error('Error creating conversation:', error);
      toast.error('Error al crear la conversación');
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mensajería</h1>
            <p className="text-gray-600">Comunicate directamente con los gestores</p>
        </div>
        <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Conversación
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Conversación</DialogTitle>
                <DialogDescription>
                Inicia una nueva conversación con el equipo de gestión
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="asunto">Asunto</Label>
                  <Input
                  id="asunto"
                  value={newConversation.asunto}
                  onChange={(e) =>
                    setNewConversation({ ...newConversation, asunto: e.target.value })
                  }
                  placeholder="Asunto de la conversación..."
                />
              </div>
              <div>
                <Label htmlFor="mensajeInicial">Mensaje Inicial</Label>
                  <Textarea
                  id="mensajeInicial"
                  value={newConversation.mensajeInicial}
                  onChange={(e) =>
                    setNewConversation({
                      ...newConversation,
                      mensajeInicial: e.target.value,
                    })
                  }
                  placeholder="Escribe tu mensaje..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowNewConversationDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateConversation}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-3 h-[600px]">
            {/* Lista de conversaciones */}
            <div className="border-r">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold">Conversaciones</h3>
              </div>
              <ScrollArea className="h-[540px]">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Cargando...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No hay conversaciones</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => setSelectedConversation(conv.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-sm">{conv.asunto}</h4>
                          {conv.mensajesNoLeidosProveedor > 0 && (
                          <Badge className="bg-blue-500 text-xs">
                            {conv.mensajesNoLeidosProveedor}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                        {conv.ultimoMensaje}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(conv.ultimoMensajeFecha), 'dd MMM, HH:mm', {
                          locale: es,
                        })}
                      </p>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Área de mensajes */}
            <div className="md:col-span-2 flex flex-col">
              {selectedConv ? (
                <>
                  {/* Encabezado */}
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-semibold">{selectedConv.asunto}</h3>
                      <p className="text-xs text-gray-500">
                      {selectedConv.estado === 'activa' ? 'Activa' : 'Archivada'}
                    </p>
                  </div>

                  {/* Mensajes */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.remitenteTipo === 'proveedor'
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.remitenteTipo === 'proveedor'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-xs font-semibold mb-1">
                              {message.remitenteNombre}
                            </p>
                            <p className="text-sm">{message.contenido}</p>
                              <p
                              className={`text-xs mt-1 ${
                                message.remitenteTipo === 'proveedor'
                                  ? 'text-blue-100'
                                  : 'text-gray-500'
                              }`}
                            >
                              {format(new Date(message.createdAt), 'HH:mm', {
                                locale: es,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input de mensaje */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Escribe tu mensaje..."
                        disabled={sending}
                      />
                      <Button type="submit" disabled={sending || !messageContent.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Selecciona una conversación</p>
                  </div>
                </div>
              )}
        </CardContent>
      </Card>
            </div>
          </main>
        </div>
      </div>
  );
}
