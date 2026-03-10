'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  entityType: string;
  entityId: string;
  autorId: string;
  autorNombre: string;
  contenido: string;
  createdAt: string;
}

interface EntityChatProps {
  entityType: string;
  entityId: string;
  entityLabel?: string;
}

export function EntityChat({ entityType, entityId, entityLabel }: EntityChatProps) {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/chat/entity?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch {
      toast.error('Error cargando mensajes');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (status === 'authenticated' && entityId) {
      fetchMessages();
    }
  }, [status, entityId, fetchMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || !session?.user) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/chat/entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          contenido: newContent.trim(),
        }),
      });
      if (res.ok) {
        const nuevo = await res.json();
        setMessages((prev) => [nuevo, ...prev]);
        setNewContent('');
        toast.success('Mensaje enviado');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Error enviando mensaje');
      }
    } catch {
      toast.error('Error enviando mensaje');
    } finally {
      setSubmitting(false);
    }
  };

  const label = entityLabel || `${entityType} #${entityId.slice(0, 8)}`;

  return (
    <Card className="border rounded-lg">
      <CardHeader
        className="cursor-pointer py-3 px-4 flex flex-row items-center justify-between hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Chat</span>
          <Badge variant="secondary" className="text-xs">
            {entityLabel || `${entityType} #${entityId.slice(0, 8)}`}
          </Badge>
          <span className="text-xs text-muted-foreground">
            ({messages.length} mens{messages.length === 1 ? 'aje' : 'ajes'})
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 border-t">
          <div className="space-y-4 py-4">
            {/* Mensajes */}
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay mensajes. Escribe el primero.
                </p>
              ) : (
                [...messages].reverse().map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium">
                      {msg.autorNombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{msg.autorNombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(msg.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{msg.contenido}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            {session?.user && (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                  disabled={submitting}
                />
                <Button type="submit" size="icon" disabled={!newContent.trim() || submitting}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
