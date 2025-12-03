'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Lightbulb,
  Zap,
  AlertTriangle,
  X,
  ChevronRight,
  Wand2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getProactiveSuggestions, type AutomationSuggestion } from '@/lib/ai-automation-service';
import { toast } from 'sonner';

interface ProactiveSuggestionsProps {
  userId: string;
  context?: any;
}

export function ProactiveSuggestions({ userId, context }: ProactiveSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AutomationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadSuggestions();
    // Load dismissed suggestions from localStorage
    const dismissed = localStorage.getItem('dismissedSuggestions');
    if (dismissed) {
      setDismissedIds(JSON.parse(dismissed));
    }
  }, [userId]);

  const loadSuggestions = async () => {
    try {
      const data = await getProactiveSuggestions(userId, context);
      setSuggestions(data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = (suggestionId: string) => {
    const newDismissed = [...dismissedIds, suggestionId];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedSuggestions', JSON.stringify(newDismissed));
    toast.success('Sugerencia descartada');
  };

  const handleAction = (suggestion: AutomationSuggestion) => {
    if (suggestion.action?.route) {
      router.push(suggestion.action.route);
    } else if (suggestion.action?.callback) {
      // Handle callback
      toast.info('Ejecutando acción...');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'wizard':
        return <Wand2 className="h-5 w-5" />;
      case 'action':
        return <Zap className="h-5 w-5" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-300 bg-red-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      case 'low':
        return 'border-blue-300 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      high: { label: 'Alta', className: 'bg-red-100 text-red-800' },
      medium: { label: 'Media', className: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Baja', className: 'bg-blue-100 text-blue-800' },
    };
    const variant = variants[priority] || variants.low;
    return (
      <Badge variant="secondary" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  if (isLoading) return null;

  // Filter out dismissed suggestions
  const visibleSuggestions = suggestions.filter(
    suggestion => !dismissedIds.includes(suggestion.id)
  );

  if (visibleSuggestions.length === 0) return null;

  // Sort by priority
  const sortedSuggestions = [...visibleSuggestions].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Sugerencias para ti</h3>
      </div>

      <AnimatePresence>
        {sortedSuggestions.map(suggestion => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="relative"
          >
            <Card
              className={`border-2 transition-all hover:shadow-lg ${getPriorityColor(suggestion.priority)}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        suggestion.priority === 'high'
                          ? 'bg-red-100 text-red-600'
                          : suggestion.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {getIcon(suggestion.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{suggestion.title}</CardTitle>
                        {getPriorityBadge(suggestion.priority)}
                      </div>
                      <CardDescription className="text-sm">
                        {suggestion.description}
                      </CardDescription>
                    </div>
                  </div>
                  {suggestion.dismissable && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 -mt-1 -mr-1"
                      onClick={() => handleDismiss(suggestion.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              {suggestion.action && (
                <CardContent className="pt-0">
                  <Button
                    onClick={() => handleAction(suggestion)}
                    className={`w-full ${
                      suggestion.type === 'wizard'
                        ? 'gradient-primary'
                        : suggestion.priority === 'high'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {suggestion.action.label}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
