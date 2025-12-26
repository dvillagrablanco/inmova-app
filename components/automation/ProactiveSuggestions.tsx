'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Suggestion {
  id: string;
  type: 'optimization' | 'warning' | 'opportunity';
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Activa pagos recurrentes',
    description:
      'Tienes 8 contratos activos sin pagos automatizados. Actívalos para reducir morosidad en un 40%.',
    action: '/contratos',
    actionLabel: 'Configurar ahora',
    priority: 'high',
    category: 'payments',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Contratos próximos a vencer',
    description:
      '3 contratos vencen en los próximos 30 días. Contacta a tus inquilinos para renovación.',
    action: '/contratos?filter=expiring',
    actionLabel: 'Ver contratos',
    priority: 'high',
    category: 'contracts',
  },
  {
    id: '3',
    type: 'optimization',
    title: 'Completa datos de edificios',
    description:
      '5 edificios no tienen fotos. Añade imágenes para mejorar tu presentación profesional.',
    action: '/edificios',
    actionLabel: 'Añadir fotos',
    priority: 'medium',
    category: 'buildings',
  },
  {
    id: '4',
    type: 'opportunity',
    title: 'Programa mantenimiento preventivo',
    description:
      'Evita averías costosas. Configura revisiones automáticas de ascensores y calderas.',
    action: '/mantenimiento-preventivo',
    actionLabel: 'Configurar',
    priority: 'medium',
    category: 'maintenance',
  },
  {
    id: '5',
    type: 'optimization',
    title: 'Integra tu contabilidad',
    description: 'Sincroniza con Sage, Holded o A3 y ahorra 10h/mes en gestión contable.',
    action: '/contabilidad',
    actionLabel: 'Ver integraciones',
    priority: 'low',
    category: 'accounting',
  },
];

export default function ProactiveSuggestions() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [isWidgetVisible, setIsWidgetVisible] = useState(true);

  useEffect(() => {
    // En producción, esto vendría de la API
    // Por ahora usamos sugerencias mock
    const stored = localStorage.getItem('dismissed_suggestions');
    const dismissedIds = stored ? JSON.parse(stored) : [];
    setDismissed(dismissedIds);

    // Check if widget was hidden
    const widgetHidden = localStorage.getItem('suggestions_widget_hidden');
    if (widgetHidden === 'true') {
      setIsWidgetVisible(false);
      return;
    }

    const filtered = MOCK_SUGGESTIONS.filter((s) => !dismissedIds.includes(s.id));
    setSuggestions(filtered);
  }, []);

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    localStorage.setItem('dismissed_suggestions', JSON.stringify(newDismissed));
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    toast.success('Sugerencia descartada');
  };

  const handleHideWidget = () => {
    localStorage.setItem('suggestions_widget_hidden', 'true');
    setIsWidgetVisible(false);
    toast.success('Panel de sugerencias ocultado. Puedes reactivarlo desde Configuración.');
  };

  const handleAction = (suggestion: Suggestion) => {
    if (suggestion.action) {
      router.push(suggestion.action);
      handleDismiss(suggestion.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Sparkles className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'optimization':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      default:
        return <Lightbulb className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (!isWidgetVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Sugerencias Inteligentes</CardTitle>
            <CardDescription>
              Recomendaciones personalizadas para optimizar tu gestión
            </CardDescription>
          </div>
          <Badge variant="outline">{suggestions.length} pendientes</Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleHideWidget}
            title="Ocultar panel de sugerencias"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence>
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getIcon(suggestion.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant={getPriorityColor(suggestion.priority) as any}
                              className="text-xs"
                            >
                              {suggestion.priority === 'high'
                                ? 'Alta'
                                : suggestion.priority === 'medium'
                                  ? 'Media'
                                  : 'Baja'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDismiss(suggestion.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {suggestion.description}
                        </p>
                        {suggestion.action && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(suggestion)}
                            className="text-xs"
                          >
                            {suggestion.actionLabel || 'Ver más'}
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
