'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Bot, Send, Loader2, MessageSquare, Sparkles, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  senderType: 'tenant' | 'bot';
  mensaje: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  sessionId: string;
  tema: string;
  idioma: string;
  estado: string;
  messages: Message[];
  createdAt: string;
}

export default function TenantChatbotPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/portal-inquilino/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchConversations();
    }
  }, [session]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chatbot/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        
        // Si hay conversaciones, seleccionar la más reciente
        if (data.length > 0 && !activeConversation) {
          selectConversation(data[0]);
        }
      }
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
      toast.error('Error al cargar conversaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setActiveConversation(conversation);
    
    try {
      const response = await fetch(`/api/chatbot/messages?conversationId=${conversation.id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      toast.error('Error al cargar mensajes');
    }
  };

  const startNewConversation = async () => {
    try {
      const response = await fetch('/api/chatbot/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: 'general', idioma: 'es' })
      });

      if (response.ok) {
        const newConversation = await response.json();
        setConversations([newConversation, ...conversations]);
        setActiveConversation(newConversation);
        setMessages([]);
        toast.success('Nueva conversación iniciada');
      }
    } catch (error) {
      console.error('Error al crear conversación:', error);
      toast.error('Error al crear conversación');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeConversation || isSending) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsSending(true);

    // Agregar mensaje del usuario inmediatamente
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      senderType: 'tenant',
      mensaje: userMessage,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/chatbot/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          mensaje: userMessage
        })
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      // Procesar stream de respuesta
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';

      // Agregar mensaje del bot con texto vacío
      const tempBotMessage: Message = {
        id: `temp-bot-${Date.now()}`,
        senderType: 'bot',
        mensaje: '',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempBotMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  botResponse += content;
                  // Actualizar mensaje del bot con contenido acumulado
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.senderType === 'bot') {
                      lastMessage.mensaje = botResponse;
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                // Ignorar errores de parsing
              }
            }
          }
        }
      }

      // Recargar mensajes desde el servidor para tener IDs correctos
      setTimeout(() => {
        selectConversation(activeConversation);
      }, 500);

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Error al enviar mensaje');
      // Remover mensajes temporales en caso de error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/portal-inquilino/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Asistente Virtual IA</h1>
            <p className="text-muted-foreground">Disponible 24/7 para ayudarte</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Conversaciones */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversaciones</CardTitle>
              <Button size="sm" onClick={startNewConversation}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay conversaciones aún
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        activeConversation?.id === conv.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{conv.tema}</span>
                        <Badge variant={conv.estado === 'activa' ? 'default' : 'secondary'} className="text-xs">
                          {conv.estado}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.messages[0]?.mensaje || 'Nueva conversación'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Chat con IA</CardTitle>
            </div>
            <CardDescription>
              Pregunta sobre pagos, mantenimiento, documentos o cualquier otra consulta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!activeConversation ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-center">
                <Bot className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inicia una conversación</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Haz clic en el botón de arriba para comenzar a chatear con el asistente
                </p>
                <Button onClick={startNewConversation}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Nueva Conversación
                </Button>
              </div>
            ) : (
              <>
                {/* Messages */}
                <ScrollArea className="h-[450px] mb-4 pr-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <p>Inicia la conversación escribiendo un mensaje</p>
                      </div>
                    )}
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'tenant' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.senderType === 'tenant'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.senderType === 'bot' && (
                            <div className="flex items-center gap-2 mb-1">
                              <Bot className="h-4 w-4" />
                              <span className="text-xs font-semibold">INMOVA Assistant</span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.mensaje}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {new Date(message.createdAt).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isSending}
                    size="icon"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
