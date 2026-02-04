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
import type { AutomationSuggestion } from '@/lib/ai-automation-service';

type Suggestion = AutomationSuggestion;

// Sugerencias se cargan desde la API, no hay datos mock

export default function ProactiveSuggestions() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [isWidgetVisible, setIsWidgetVisible] = useState(true);

  useEffect(() => {
    const loadSuggestions = async () => {
      // Cargar sugerencias descartadas del localStorage
      const stored = localStorage.getItem('dismissed_suggestions');
      let dismissedIds: string[] = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Asegurar que siempre sea un array
          dismissedIds = Array.isArray(parsed) ? parsed : [];
        } catch {
          dismissedIds = [];
        }
      }
      setDismissed(dismissedIds);

      // Check if widget was hidden
      const widgetHidden = localStorage.getItem('suggestions_widget_hidden');
      if (widgetHidden === 'true') {
        setIsWidgetVisible(false);
        return;
      }

      try {
        // Cargar sugerencias reales desde la API
        const response = await fetch('/api/ai/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: {} }),
        });
        if (response.ok) {
          const data = await response.json();
          const apiSuggestions = data.suggestions || [];
          // Filtrar las sugerencias descartadas
          const filtered = apiSuggestions.filter((s: Suggestion) => !dismissedIds.includes(s.id));
          setSuggestions(filtered);
        } else {
          // Si la API no está disponible, mostrar lista vacía
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error loading suggestions:', error);
        // En caso de error, mostrar lista vacía (no mock data)
        setSuggestions([]);
      }
    };

    loadSuggestions();
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
    const action = suggestion.action;
    if (!action) return;

    if (action.route) {
      router.push(action.route);
      handleDismiss(suggestion.id);
      return;
    }

    toast.info('Acción disponible próximamente.');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'wizard':
        return <Sparkles className="h-5 w-5 text-green-600" />;
      case 'action':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-yellow-600" />;
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
                            {suggestion.dismissable !== false ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDismiss(suggestion.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            ) : null}
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
                            {suggestion.action?.label || 'Ver más'}
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
