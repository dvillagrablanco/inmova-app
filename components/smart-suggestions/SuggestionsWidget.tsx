'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  Building2,
  TrendingUp,
  Settings,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Suggestion {
  id: string;
  area: string;
  prioridad: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  accion?: string;
  enlace?: string;
  createdAt: string;
}

const AREA_CONFIG: Record<string, { icon: typeof Building2; color: string; label: string }> = {
  inmobiliario: { icon: Building2, color: 'text-blue-600 bg-blue-50', label: 'Inmobiliario' },
  financiero: { icon: TrendingUp, color: 'text-green-600 bg-green-50', label: 'Financiero' },
  operacional: { icon: Settings, color: 'text-orange-600 bg-orange-50', label: 'Operacional' },
  fiscal: { icon: FileText, color: 'text-purple-600 bg-purple-50', label: 'Fiscal' },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  critica: { color: 'bg-red-100 text-red-700', label: 'Crítica' },
  alta: { color: 'bg-orange-100 text-orange-700', label: 'Alta' },
  media: { color: 'bg-yellow-100 text-yellow-700', label: 'Media' },
  baja: { color: 'bg-gray-100 text-gray-700', label: 'Baja' },
};

interface SuggestionsWidgetProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function SuggestionsWidget({
  limit = 5,
  showHeader = true,
  compact = false,
}: SuggestionsWidgetProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSuggestions = async () => {
    try {
      const res = await fetch(`/api/smart-suggestions?limit=${limit}&estado=pendiente`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch {
      // Silently fail for widget
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleAction = async (id: string, estado: string) => {
    try {
      const res = await fetch('/api/smart-suggestions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado }),
      });
      if (res.ok) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        toast.success(estado === 'completada' ? 'Sugerencia completada' : 'Sugerencia descartada');
      }
    } catch {
      toast.error('Error actualizando sugerencia');
    }
  };

  if (loading || suggestions.length === 0) return null;

  return (
    <Card className={cn('border-amber-200', !compact && 'bg-amber-50/30')}>
      {showHeader && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              Sugerencias de Gestión
              <Badge variant="secondary" className="text-[10px]">
                {suggestions.length}
              </Badge>
            </span>
            <Link href="/admin/sugerencias">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                Ver todas <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(showHeader ? 'pt-0' : 'pt-4')}>
        <div className="space-y-2">
          {suggestions.map((s) => {
            const areaConfig = AREA_CONFIG[s.area] || AREA_CONFIG.operacional;
            const prioConfig = PRIORITY_CONFIG[s.prioridad] || PRIORITY_CONFIG.media;
            const Icon = areaConfig.icon;

            return (
              <div
                key={s.id}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-white border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    areaConfig.color.split(' ')[1]
                  )}
                >
                  <Icon className={cn('h-4 w-4', areaConfig.color.split(' ')[0])} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium truncate">{s.titulo}</span>
                    <Badge className={cn('text-[9px] px-1 py-0 shrink-0', prioConfig.color)}>
                      {prioConfig.label}
                    </Badge>
                  </div>
                  {!compact && (
                    <p className="text-[11px] text-gray-500 line-clamp-2">{s.descripcion}</p>
                  )}
                  {s.accion && !compact && (
                    <p className="text-[11px] text-blue-600 mt-0.5 font-medium">→ {s.accion}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {s.enlace && (
                    <Link href={s.enlace}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                    onClick={() => handleAction(s.id, 'completada')}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    onClick={() => handleAction(s.id, 'descartada')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
