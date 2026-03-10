'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageSquare, Send } from 'lucide-react';

interface Note {
  id: string;
  entityType: string;
  entityId: string;
  contenido: string;
  autor: string;
  fechaCreacion: string;
}

interface EntityNotesProps {
  entityType: string;
  entityId: string;
}

export function EntityNotes({ entityType, entityId }: EntityNotesProps) {
  const { data: session, status } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') loadNotes();
  }, [status, entityType, entityId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notas?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Error cargando notas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/notas', {
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
        setNotes((prev) => [nuevo, ...prev]);
        setNewContent('');
        toast.success('Nota añadida');
      } else {
        toast.error('Error añadiendo nota');
      }
    } catch {
      toast.error('Error añadiendo nota');
    } finally {
      setSubmitting(false);
    }
  };

  if (status !== 'authenticated') return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Notas y observaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Añadir una nota..."
            rows={3}
            disabled={submitting}
          />
          <Button type="submit" size="sm" disabled={!newContent.trim() || submitting}>
            <Send className="h-4 w-4 mr-2" />
            Enviar
          </Button>
        </form>

        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando notas...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay notas aún.</p>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                className="rounded-lg border bg-muted/30 p-3 text-sm"
              >
                <p className="text-muted-foreground text-xs mb-1">
                  {n.autor} · {new Date(n.fechaCreacion).toLocaleString('es-ES')}
                </p>
                <p className="whitespace-pre-wrap">{n.contenido}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
