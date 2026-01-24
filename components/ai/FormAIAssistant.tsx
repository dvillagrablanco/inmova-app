'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, Loader2, CheckCircle, Info, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'email' | 'phone' | 'checkbox' | 'currency';
  options?: { value: string; label: string }[];
  required?: boolean;
  description?: string;
}

export interface FormAIAssistantProps {
  formContext: string; // e.g., 'propiedad', 'mantenimiento', 'edificio', 'seguro'
  fields: FormField[];
  currentValues: Record<string, any>;
  onSuggestionsApply: (suggestions: Record<string, any>) => void;
  additionalContext?: string; // Extra context about related data
  className?: string;
}

interface Suggestion {
  field: string;
  value: any;
  reason: string;
  confidence: number;
}

interface AIResponse {
  success: boolean;
  suggestions: Suggestion[];
  explanation: string;
  tips?: string[];
}

export function FormAIAssistant({
  formContext,
  fields,
  currentValues,
  onSuggestionsApply,
  additionalContext,
  className,
}: FormAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRequest, setUserRequest] = useState('');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  const getSuggestions = useCallback(async () => {
    if (!userRequest.trim()) {
      toast.error('Por favor, describe lo que necesitas');
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/ai/form-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formContext,
          fields,
          currentValues,
          userRequest,
          additionalContext,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al obtener sugerencias');
      }

      const data: AIResponse = await res.json();
      setResponse(data);
      
      // Pre-select all suggestions by default
      const allFields = new Set(data.suggestions.map(s => s.field));
      setSelectedSuggestions(allFields);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al obtener sugerencias de IA');
    } finally {
      setIsLoading(false);
    }
  }, [formContext, fields, currentValues, userRequest, additionalContext]);

  const toggleSuggestion = (field: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedSuggestions(newSelected);
  };

  const applySuggestions = () => {
    if (!response) return;

    const suggestionsToApply: Record<string, any> = {};
    response.suggestions.forEach(s => {
      if (selectedSuggestions.has(s.field)) {
        suggestionsToApply[s.field] = s.value;
      }
    });

    onSuggestionsApply(suggestionsToApply);
    toast.success(`${Object.keys(suggestionsToApply).length} campos actualizados`);
    setIsOpen(false);
    setResponse(null);
    setUserRequest('');
  };

  const getAutoSuggestions = async () => {
    setIsLoading(true);
    setUserRequest('Sugiere valores óptimos para todos los campos vacíos basándote en el contexto');
    
    try {
      const res = await fetch('/api/ai/form-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formContext,
          fields,
          currentValues,
          userRequest: 'Sugiere valores óptimos para todos los campos vacíos basándote en el contexto y las mejores prácticas del sector inmobiliario',
          additionalContext,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al obtener sugerencias');
      }

      const data: AIResponse = await res.json();
      setResponse(data);
      
      const allFields = new Set(data.suggestions.map(s => s.field));
      setSelectedSuggestions(allFields);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al obtener sugerencias automáticas');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldLabel = (fieldName: string): string => {
    const field = fields.find(f => f.name === fieldName);
    return field?.label || fieldName;
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge variant="default" className="bg-green-500">Alta</Badge>;
    if (confidence >= 0.5) return <Badge variant="secondary" className="bg-yellow-500 text-black">Media</Badge>;
    return <Badge variant="outline">Baja</Badge>;
  };

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="hidden sm:inline">Asistente IA</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Asistente IA de Formularios
            </DialogTitle>
            <DialogDescription>
              Describe lo que necesitas y la IA te ayudará a completar el formulario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={getAutoSuggestions}
                disabled={isLoading}
                className="gap-1"
              >
                <Wand2 className="h-3 w-3" />
                Auto-completar vacíos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserRequest('Sugiere valores típicos para el mercado español')}
              >
                Valores de mercado
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserRequest('Optimiza los campos para máxima rentabilidad')}
              >
                Optimizar rentabilidad
              </Button>
            </div>

            {/* User request input */}
            <div className="space-y-2">
              <Textarea
                placeholder="Ej: 'Quiero crear una propiedad en Madrid centro, 2 habitaciones, para alquiler turístico'"
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
              <Button
                onClick={getSuggestions}
                disabled={isLoading || !userRequest.trim()}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Obtener Sugerencias
                  </>
                )}
              </Button>
            </div>

            {/* AI Response */}
            {response && (
              <div className="space-y-4">
                {/* Explanation */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                      <p className="text-sm text-blue-800">{response.explanation}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Suggestions */}
                {response.suggestions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Sugerencias ({response.suggestions.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {response.suggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedSuggestions.has(suggestion.field)
                              ? 'bg-purple-50 border-purple-300'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleSuggestion(suggestion.field)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                selectedSuggestions.has(suggestion.field)
                                  ? 'bg-purple-500 border-purple-500'
                                  : 'border-gray-300'
                              }`}>
                                {selectedSuggestions.has(suggestion.field) && (
                                  <CheckCircle className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span className="font-medium">{getFieldLabel(suggestion.field)}</span>
                            </div>
                            {getConfidenceBadge(suggestion.confidence)}
                          </div>
                          <div className="mt-2 ml-6">
                            <p className="text-sm font-mono bg-white px-2 py-1 rounded border inline-block">
                              {typeof suggestion.value === 'boolean' 
                                ? suggestion.value ? 'Sí' : 'No'
                                : suggestion.value}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Tips */}
                {response.tips && response.tips.length > 0 && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-yellow-800">💡 Consejos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {response.tips.map((tip, idx) => (
                          <li key={idx}>• {tip}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Apply button */}
                {response.suggestions.length > 0 && (
                  <Button
                    onClick={applySuggestions}
                    disabled={selectedSuggestions.size === 0}
                    className="w-full gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aplicar {selectedSuggestions.size} Sugerencias
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
