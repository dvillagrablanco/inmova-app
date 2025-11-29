'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { MessageSquare, Send, Home, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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

export default function AdminChatPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadConversations();
    }
  }, [session]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      const interval = setInterval(() => {
        loadMessages(selectedConversation.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations');
      if (!response.ok) throw new Error('Error');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      toast.error('Error al cargar conversaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      if (!response.ok) throw new Error('Error');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          mensaje: newMessage.trim(),
        }),
      });

      if (!response.ok) throw new Error('Error');

      setNewMessage('');
      loadMessages(selectedConversation.id);
      loadConversations();
    } catch (error) {
      toast.error('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async () => {
    if (!selectedConversation) return;

    try {
      const response = await fetch(`/api/chat/conversations/${selectedConversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cerrada' }),
      });

      if (!response.ok) throw new Error('Error');

      toast.success('Conversación cerrada');
      loadConversations();
      setSelectedConversation(null);
    } catch (error) {
      toast.error('Error al cerrar conversación');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Chat</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-2">Mensajes</h1>
              <p className="text-gray-600">Atiende consultas de inquilinos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[700px]">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Conversaciones</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    {conversations.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No hay conversaciones</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`w-full p-4 text-left border-b hover:bg-gray-50 ${
                            selectedConversation?.id === conv.id ? 'bg-gray-100' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">{conv.asunto}</h3>
                              <p className="text-xs text-gray-600">{conv.tenantName}</p>
                            </div>
                            {conv.unreadCount > 0 && (
                              <Badge variant="destructive">{conv.unreadCount}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {conv.ultimoMensaje || 'Sin mensajes'}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {conv.ultimoMensajeFecha
                                ? new Date(conv.ultimoMensajeFecha).toLocaleDateString('es-ES')
                                : ''}
                            </span>
                            <Badge variant={conv.estado === 'activa' ? 'default' : 'secondary'}>
                              {conv.estado}
                            </Badge>
                          </div>
                        </button>
                      ))
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                {selectedConversation ? (
                  <>
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {selectedConversation.asunto}
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            {selectedConversation.tenantName}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant={
                              selectedConversation.estado === 'activa'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {selectedConversation.estado}
                          </Badge>
                          {selectedConversation.estado === 'activa' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={closeConversation}
                            >
                              Cerrar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[500px] p-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`mb-4 flex ${
                              msg.senderType === 'user'
                                ? 'justify-end'
                                : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.senderType === 'user'
                                  ? 'bg-black text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.mensaje}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs opacity-70">
                                  {new Date(msg.createdAt).toLocaleString('es-ES')}
                                </span>
                                {msg.senderType === 'user' && (
                                  <span className="text-xs opacity-70">
                                    {msg.leido ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                      <Separator />
                      {selectedConversation.estado === 'activa' ? (
                        <div className="p-4 flex gap-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe tu respuesta..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            disabled={sending}
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={sending || !newMessage.trim()}
                            className="bg-black hover:bg-gray-800"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 text-center text-sm text-gray-600">
                          Esta conversación está cerrada
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Selecciona una conversación</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
