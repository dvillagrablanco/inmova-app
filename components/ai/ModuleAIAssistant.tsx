'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MODULE_LABELS: Record<string, string> = {
  liquidaciones: 'Liquidaciones',
  facturacion: 'Facturación',
  candidatos: 'Candidatos',
  incidencias: 'Incidencias',
  'contratos-gestion': 'Contratos de Gestión',
  'check-in-out': 'Check-in / Check-out',
  reportes: 'Reportes',
  'acciones-masivas': 'Acciones Masivas',
  suministros: 'Suministros',
  avalistas: 'Avalistas',
  'actualizaciones-renta': 'Actualizaciones de Renta',
  'garajes-trasteros': 'Garajes y Trasteros',
  visitas: 'Visitas',
};

const QUICK_ACTIONS: Record<string, string[]> = {
  liquidaciones: [
    '¿Cómo calcular honorarios?',
    '¿Qué gastos son repercutibles?',
    'Optimizar liquidación',
  ],
  facturacion: [
    '¿Qué IVA aplico?',
    '¿Necesito retención IRPF?',
    'Generar factura rectificativa',
  ],
  candidatos: [
    'Analizar solvencia candidato',
    '¿Qué documentación pedir?',
    'Scoring recomendado',
  ],
  incidencias: [
    'Clasificar incidencia',
    'Estimar coste reparación',
    'Prioridad recomendada',
  ],
  'contratos-gestion': [
    'Modelo contrato recomendado',
    '% honorarios mercado',
    'Cláusulas esenciales',
  ],
  'check-in-out': [
    'Checklist recomendado',
    'Lecturas de contadores',
    'Documentación necesaria',
  ],
  reportes: [
    'Interpretar KPIs',
    'Detectar anomalías',
    'Recomendaciones mejora',
  ],
  'acciones-masivas': [
    'Validar lote antes de ejecutar',
    'Mejores prácticas cobros masivos',
    'Rollback en caso de error',
  ],
  suministros: [
    'Cambio de titular',
    'Repercusión a inquilino',
    'Lecturas periódicas',
  ],
  avalistas: [
    'Tipos de aval',
    'Requisitos aval personal',
    'Seguro de impago',
  ],
  'actualizaciones-renta': [
    '¿Cuándo aplicar IPC?',
    'Comunicación al inquilino',
    'Cálculo incremento',
  ],
  'garajes-trasteros': [
    'Vinculación a vivienda',
    'Precios de mercado',
    'Documentación necesaria',
  ],
  visitas: [
    'Horario óptimo visitas',
    'Preparación inmueble',
    'Tips conversión',
  ],
};

const DEFAULT_QUICK_ACTIONS = [
  '¿Cómo funciona este módulo?',
  'Mejores prácticas',
  'Necesito ayuda',
];

interface ModuleAIAssistantProps {
  module: string;
  context?: string;
  className?: string;
}

export function ModuleAIAssistant({
  module,
  context = '',
  className,
}: ModuleAIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [initialFetched, setInitialFetched] = useState(false);

  const quickActions = QUICK_ACTIONS[module] || DEFAULT_QUICK_ACTIONS;
  const moduleLabel = MODULE_LABELS[module] || module;

  const fetchAssistant = useCallback(
    async (question?: string) => {
      setLoading(true);
      setResponse('');
      try {
        const res = await fetch('/api/ai/module-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module,
            context: context || `Módulo: ${moduleLabel}`,
            question: question || undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || 'Error al consultar');
        }

        const data = await res.json();
        setResponse(data.response || '');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al consultar');
        setResponse('No se pudo obtener respuesta. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    },
    [module, context, moduleLabel]
  );

  useEffect(() => {
    if (open && !initialFetched) {
      setInitialFetched(true);
      fetchAssistant();
    }
  }, [open, initialFetched, fetchAssistant]);

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    fetchAssistant(action);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q) return;
    fetchAssistant(q);
    setInputValue('');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-1.5 shadow-md hover:shadow-lg transition-shadow',
            'fixed bottom-6 right-6 z-40',
            className
          )}
        >
          <Sparkles
            className={cn('h-4 w-4', loading && 'animate-pulse')}
          />
          <span className="font-medium">IA</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Asistente IA — {moduleLabel}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Quick actions */}
          <div className="px-4 py-3 border-b shrink-0">
            <p className="text-xs text-muted-foreground mb-2">Preguntas rápidas</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action}
                  variant="secondary"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => handleQuickAction(action)}
                  disabled={loading}
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>

          {/* Response area */}
          <ScrollArea className="flex-1 px-4 py-4 min-h-[200px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  Consultando asistente...
                </p>
              </div>
            ) : response ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 rounded-lg p-4">
                  {response}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Haz una pregunta o elige una acción rápida.
              </p>
            )}
          </ScrollArea>

          {/* Chat input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t shrink-0"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                disabled={loading}
              />
              <Button type="submit" size="icon" disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
