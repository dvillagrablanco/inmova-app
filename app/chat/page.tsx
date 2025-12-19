'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { Home } from 'lucide-react';
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
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gradient-bg p-6">
            <LoadingState message="Cargando chat..." size="lg" />
          </main>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-bg p-6">
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
                  <BreadcrumbPage>Chat</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="space-y-4">
              <BackButton href="/dashboard" label="Volver al Dashboard" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight gradient-text">Mensajes</h1>
                <p className="text-muted-foreground mt-1">
                  Atiende consultas y comunicaciones con inquilinos
                </p>
              </div>
            </div>

            {/* Interfaz de Chat Mejorada */}
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
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminChatPage;
