'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { Home, MessageCircle, ExternalLink, Settings } from 'lucide-react';
import logger from '@/lib/logger';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ImprovedChatInterface } from '@/components/chat/ImprovedChatInterface';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

function AdminChatPage() {
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
      logger.error('Failed to fetch messages', { error });
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
      <AuthenticatedLayout>
            <LoadingState message="Cargando chat..." size="lg" />
          </AuthenticatedLayout>
    );
  }

  if (!session?.user) return null;

  const openCrispChat = () => {
    // Abrir Crisp en nueva ventana si está configurado
    if (typeof window !== 'undefined' && (window as any).$crisp) {
      (window as any).$crisp.push(['do', 'chat:open']);
    } else {
      window.open('https://app.crisp.chat/', '_blank');
    }
  };

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Comunicaciones</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="space-y-4">
              <BackButton href="/dashboard" label="Volver al Dashboard" />
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight gradient-text">Centro de Comunicaciones</h1>
                  <p className="text-muted-foreground mt-1">
                    Atiende consultas y comunicaciones con inquilinos
                  </p>
                </div>
                <Button onClick={openCrispChat} variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Abrir Crisp
                </Button>
              </div>
            </div>

            {/* Tabs para diferentes canales */}
            <Tabs defaultValue="internal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="internal" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Chat Interno
                </TabsTrigger>
                <TabsTrigger value="crisp" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Crisp Live Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="internal" className="mt-6">
                {/* Interfaz de Chat Interno */}
                <ImprovedChatInterface
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  messages={messages}
                  newMessage={newMessage}
                  sending={sending}
                  onSelectConversation={setSelectedConversation}
                  onSendMessage={sendMessage}
                  onNewMessageChange={setNewMessage}
                  onCloseConversation={closeConversation}
                />
              </TabsContent>

              <TabsContent value="crisp" className="mt-6">
                {/* Integración con Crisp */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Crisp Live Chat
                      <Badge variant="secondary">Integración</Badge>
                    </CardTitle>
                    <CardDescription>
                      Chat en vivo profesional para atención al cliente multicanal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert>
                      <MessageCircle className="h-4 w-4" />
                      <AlertDescription>
                        Crisp permite gestionar chats desde web, email, WhatsApp, Messenger y más desde un único panel.
                      </AlertDescription>
                    </Alert>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-2 hover:border-primary transition-colors">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold mb-2">Funcionalidades</h3>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>✓ Chat en vivo en la web</li>
                            <li>✓ Integración WhatsApp Business</li>
                            <li>✓ Integración Facebook Messenger</li>
                            <li>✓ Bot de respuestas automáticas</li>
                            <li>✓ CRM integrado</li>
                            <li>✓ Base de conocimientos</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="border-2 hover:border-primary transition-colors">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold mb-2">Configuración</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Configura tu Website ID de Crisp en las integraciones de la plataforma.
                          </p>
                          <div className="space-y-2">
                            <Button onClick={openCrispChat} className="w-full gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Abrir Panel de Crisp
                            </Button>
                            <Button variant="outline" className="w-full gap-2" onClick={() => window.open('/integraciones', '_self')}>
                              <Settings className="h-4 w-4" />
                              Configurar Integración
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">¿Por qué usar Crisp?</h4>
                      <p className="text-sm text-muted-foreground">
                        Crisp es la solución líder para atención al cliente multicanal. 
                        Permite atender consultas de inquilinos y propietarios desde un único lugar, 
                        con historial de conversaciones y automatizaciones inteligentes.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </AuthenticatedLayout>
  );
}

export default AdminChatPage;
