'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, X, Send, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface AIContextualButtonProps {
  agentType: string;
  agentName: string;
  agentDescription: string;
  apiEndpoint: string;
  color?: string;
}

const colorGradients: Record<string, string> = {
  violet: 'from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700',
  blue: 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
  green: 'from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
};

export function AIContextualButton({
  agentType,
  agentName,
  agentDescription,
  apiEndpoint,
  color = 'violet',
}: AIContextualButtonProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const gradient = colorGradients[color] || colorGradients.violet;

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    setInputText('');
    const userMessage = { role: 'user' as const, content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
      });

      if (!res.ok) {
        throw new Error(res.statusText || 'Error en la respuesta');
      }

      const data = await res.json();
      const assistantContent =
        typeof data.response === 'string' ? data.response : data.content ?? data.message ?? JSON.stringify(data);

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el asistente';
      toast.error(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 md:bottom-8 md:right-8">
      {open && (
        <Card
          className={`w-[calc(100vw-2rem)] max-h-[500px] flex flex-col shadow-xl md:w-[400px] ${
            open ? 'animate-in fade-in slide-in-from-bottom-4' : ''
          }`}
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4" />
                {agentName}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{agentDescription}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            <ScrollArea className="flex-1 px-4 py-3" style={{ maxHeight: 320 }}>
              <div className="space-y-3">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Escribe tu pregunta y el asistente te ayudará.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Pensando...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-2 border-t p-3">
              <Input
                placeholder="Escribe tu mensaje..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={loading}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={loading || !inputText.trim()}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Button
        onClick={() => setOpen((o) => !o)}
        className={`bg-gradient-to-r ${gradient} text-white shadow-lg transition-all hover:shadow-xl`}
      >
        <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
        {agentName}
      </Button>
    </div>
  );
}
