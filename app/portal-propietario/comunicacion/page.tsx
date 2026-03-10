'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Mensaje {
  id: string;
  texto: string;
  remitente: 'propietario' | 'gestor';
  fecha: string;
}

const MOCK_MENSAJES: Mensaje[] = [
  {
    id: '1',
    texto: 'Hola, quería consultar sobre la liquidación de marzo. ¿Cuándo estará disponible?',
    remitente: 'propietario',
    fecha: '2025-03-08 10:30',
  },
  {
    id: '2',
    texto: 'Buenos días. La liquidación de marzo se procesará el día 15. Le enviaremos el PDF por email.',
    remitente: 'gestor',
    fecha: '2025-03-08 11:15',
  },
  {
    id: '3',
    texto: 'Perfecto, gracias por la información.',
    remitente: 'propietario',
    fecha: '2025-03-08 11:22',
  },
];

function formatFecha(s: string) {
  const [date, time] = s.split(' ');
  const d = new Date(date + 'T' + time);
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ComunicacionPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>(MOCK_MENSAJES);
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  const handleEnviar = () => {
    const texto = nuevoMensaje.trim();
    if (!texto) return;
    setMensajes((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        texto,
        remitente: 'propietario' as const,
        fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
      },
    ]);
    setNuevoMensaje('');
    toast.success('Mensaje enviado');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comunicación</h1>
        <p className="text-muted-foreground">Conversación con tu gestor</p>
      </div>

      <Card className="flex flex-col" style={{ minHeight: '500px' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat con Gestor
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
            {mensajes.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.remitente === 'propietario' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    m.remitente === 'propietario'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{m.texto}</p>
                  <p
                    className={`mt-1 text-xs ${
                      m.remitente === 'propietario' ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}
                  >
                    {formatFecha(m.fecha)} · {m.remitente === 'propietario' ? 'Tú' : 'Gestor'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t pt-4">
            <Input
              placeholder="Escribe tu mensaje..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleEnviar()}
            />
            <Button onClick={handleEnviar} size="icon" disabled={!nuevoMensaje.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
