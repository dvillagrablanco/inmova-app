'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  ArrowLeft,
  Bot,
  MessageSquare,
  Mic,
  Zap,
  Send,
  Loader2,
  CheckCircle2,
  User,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';


interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionExecuted?: boolean;
  actionType?: string;
}

export default function AIAssistantPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '¡Hola! 👋 Soy INMOVA Assistant, tu asistente IA. Puedo ayudarte con:\n\n✅ Crear solicitudes de mantenimiento\n💳 Consultar el estado de tus pagos\n📄 Ver información de tu contrato\n📅 Agendar visitas\n📂 Acceder a documentos\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    conversations: 0,
    actionsExecuted: 0,
    successRate: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setLoading(false);
      loadStats();
    }
  }, [status, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadStats = async () => {
    setStats({
      conversations: messages.length > 1 ? 1 : 0,
      actionsExecuted: messages.filter((m) => m.actionExecuted).length,
      successRate: 95,
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationHistory,
        }),
      });

      if (!response.ok) throw new Error('Error en la respuesta');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        actionExecuted: data.type === 'action_executed',
        actionType: data.action?.action,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.type === 'action_executed' && data.action?.success) {
        toast.success('✅ Acción ejecutada automáticamente');
        setStats((prev) => ({
          ...prev,
          actionsExecuted: prev.actionsExecuted + 1,
        }));
      }
    } catch (error) {
      logger.error('Error enviando mensaje:', error);
      toast.error('Error al procesar tu mensaje');

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard">
                        <Home className="h-4 w-4" />
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Asistente IA</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h1 className="mt-2 text-2xl font-bold md:text-3xl flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Asistente IA Avanzado
                </h1>
                <p className="text-muted-foreground">
                  <Badge variant="outline" className="mr-2">
                    FASE 3 - LLM Integrado
                  </Badge>
                  Auto-resolución inteligente con GPT-4
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Conversaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.conversations}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Acciones Automatizadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.actionsExecuted}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Tasa de Éxito</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.successRate}%</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Chat con INMOVA Assistant
                  </CardTitle>
                  <CardDescription>
                    Asistente inteligente con capacidad de ejecutar acciones automáticamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px] px-6">
                    <div className="space-y-4 py-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                            {message.actionExecuted && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                Acción ejecutada: {message.actionType}
                              </div>
                            )}
                            <p className="mt-1 text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {message.role === 'user' && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                              <User className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-3 justify-start">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div className="max-w-[80%] rounded-lg bg-muted px-4 py-3">
                            <div className="flex gap-1">
                              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></div>
                              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></div>
                              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Escribe tu mensaje aquí... (Ej: Necesito reportar una fuga de agua)"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isTyping}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isTyping}
                        size="icon"
                      >
                        {isTyping ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Capacidades IA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Auto-resolución</p>
                        <p className="text-xs text-muted-foreground">
                          Ejecuta acciones automáticamente
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Detección de intenciones</p>
                        <p className="text-xs text-muted-foreground">Entiende lo que necesitas</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Memoria contextual</p>
                        <p className="text-xs text-muted-foreground">Recuerda la conversación</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Ejemplos de uso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="rounded-md bg-muted p-2">
                      <p className="font-medium">&quot;Tengo una fuga en el baño&quot;</p>
                      <p className="text-muted-foreground">→ Crea solicitud automáticamente</p>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <p className="font-medium">&quot;¿Cuándo vence mi próximo pago?&quot;</p>
                      <p className="text-muted-foreground">→ Consulta y muestra info</p>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <p className="font-medium">&quot;Muéstrame mi contrato&quot;</p>
                      <p className="text-muted-foreground">→ Busca y presenta datos</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Comandos de Voz
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">Próximamente</Badge>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Control por voz con Whisper AI
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
