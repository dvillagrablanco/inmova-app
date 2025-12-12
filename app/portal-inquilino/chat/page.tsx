'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { MessageSquare, Plus, Send, Clock, CheckCircle2 } from 'lucide-react';
import logger, { logError } from '@/lib/logger';


interface Conversation {
  id: string;
  asunto: string;
  estado: string;
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

export default function TenantChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newConversation, setNewConversation] = useState({
    asunto: '',
    mensaje: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/portal-inquilino/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadConversations();
    }
  }, [status]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        loadMessages(selectedConversation.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/portal-inquilino/chat/conversations');
      if (!response.ok) throw new Error('Error al cargar conversaciones');
      const data = await response.json();
      setConversations(Array.isArray(data.conversations) ? data.conversations : []);
    } catch (error) {
      logger.error('Error loading conversations:', error);
      toast.error('Error al cargar conversaciones');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/portal-inquilino/chat/messages?conversationId=${conversationId}`
      );
      if (!response.ok) throw new Error('Error al cargar mensajes');
      const data = await response.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
      logger.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch('/api/portal-inquilino/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          mensaje: newMessage.trim(),
        }),
      });

      if (!response.ok) throw new Error('Error al enviar mensaje');

      setNewMessage('');
      loadMessages(selectedConversation.id);
      loadConversations();
    } catch (error) {
      logger.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const createConversation = async () => {
    if (!newConversation.asunto.trim() || !newConversation.mensaje.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/portal-inquilino/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConversation),
      });

      if (!response.ok) throw new Error('Error al crear conversación');

      const data = await response.json();
      setShowNewDialog(false);
      setNewConversation({ asunto: '', mensaje: '' });
      loadConversations();
      setSelectedConversation(data.conversation);
      toast.success('Conversación creada exitosamente');
    } catch (error) {
      logger.error('Error creating conversation:', error);
      toast.error('Error al crear conversación');
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mensajes</h1>
          <p className="text-gray-600">Comunica con la administración</p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Consulta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Consulta</DialogTitle>
              <DialogDescription>
                Inicia una nueva conversación con la administración
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="asunto">Asunto</Label>
                <Input
                  id="asunto"
                  value={newConversation.asunto}
                  onChange={(e) =>
                    setNewConversation((prev) => ({ ...prev, asunto: e.target.value }))
                  }
                  placeholder="Ej: Consulta sobre el contrato"
                />
              </div>
              <div>
                <Label htmlFor="mensaje">Mensaje</Label>
                <Textarea
                  id="mensaje"
                  value={newConversation.mensaje}
                  onChange={(e) =>
                    setNewConversation((prev) => ({ ...prev, mensaje: e.target.value }))
                  }
                  placeholder="Describe tu consulta..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={createConversation}
                disabled={sending}
                className="bg-black hover:bg-gray-800"
              >
                {sending ? 'Enviando...' : 'Enviar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[700px]">
        {/* Conversations List */}
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
                  <p className="text-sm">Inicia una nueva consulta</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-sm line-clamp-1">{conv.asunto}</h3>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {conv.unreadCount}
                        </Badge>
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
                      <Badge
                        variant={conv.estado === 'activa' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {conv.estado}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="md:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedConversation.asunto}</CardTitle>
                    <p className="text-sm text-gray-500">Administración</p>
                  </div>
                  <Badge
                    variant={selectedConversation.estado === 'activa' ? 'default' : 'secondary'}
                  >
                    {selectedConversation.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] p-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-4 flex ${
                        msg.senderType === 'tenant' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.senderType === 'tenant'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.mensaje}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs opacity-70">
                            {new Date(msg.createdAt).toLocaleString('es-ES')}
                          </span>
                          {msg.senderType === 'tenant' && (
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
                      placeholder="Escribe tu mensaje..."
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
                <p>Selecciona una conversación para ver los mensajes</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
