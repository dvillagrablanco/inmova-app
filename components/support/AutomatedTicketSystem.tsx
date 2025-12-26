'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Ticket,
  Send,
  Bot,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import logger from '@/lib/logger';

interface TicketSuggestion {
  title: string;
  solution: string;
  confidence: number;
  autoResolvable: boolean;
  relatedArticles: Array<{ id: string; title: string }>;
}

export default function AutomatedTicketSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState<'form' | 'analyzing' | 'suggestions' | 'created'>('form');
  const [ticketData, setTicketData] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium',
  });
  const [aiSuggestions, setAiSuggestions] = useState<TicketSuggestion | null>(null);

  const handleAnalyze = async () => {
    if (!ticketData.subject || !ticketData.description) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsAnalyzing(true);
    setStep('analyzing');

    try {
      const response = await fetch('/api/support/tickets/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: ticketData.subject,
          description: ticketData.description,
        }),
      });

      if (!response.ok) throw new Error('Error al analizar');

      const data = await response.json();
      setAiSuggestions(data.suggestions);
      setTicketData((prev) => ({
        ...prev,
        category: data.category,
        priority: data.priority,
      }));
      setStep('suggestions');

      // Si es auto-resoluble con alta confianza, sugerir solución directa
      if (data.suggestions.autoResolvable && data.suggestions.confidence > 0.8) {
        toast.success('¡Encontramos una solución automática!');
      }
    } catch (error) {
      logger.error('Error analyzing ticket:', error);
      toast.error('Error al analizar el problema');
      setStep('form');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTicket = async () => {
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) throw new Error('Error al crear ticket');

      const data = await response.json();
      setStep('created');
      toast.success('Ticket creado exitosamente');

      // Resetear después de 3 segundos
      setTimeout(() => {
        setIsOpen(false);
        setStep('form');
        setTicketData({
          subject: '',
          description: '',
          category: '',
          priority: 'medium',
        });
        setAiSuggestions(null);
      }, 3000);
    } catch (error) {
      logger.error('Error creating ticket:', error);
      toast.error('Error al crear el ticket');
    }
  };

  const handleUseAutomaticSolution = () => {
    toast.success('¡Problema resuelto automáticamente!');
    setTimeout(() => {
      setIsOpen(false);
      setStep('form');
      setTicketData({
        subject: '',
        description: '',
        category: '',
        priority: 'medium',
      });
      setAiSuggestions(null);
    }, 1500);
  };

  const renderStep = () => {
    switch (step) {
      case 'form':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Asunto *</Label>
              <Input
                id="subject"
                value={ticketData.subject}
                onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                placeholder="Describe brevemente tu problema"
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción Detallada *</Label>
              <Textarea
                id="description"
                value={ticketData.description}
                onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                placeholder="Proporciona todos los detalles posibles..."
                rows={5}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <Sparkles className="h-4 w-4 inline mr-1" />
                Nuestra IA analizará tu problema y buscará soluciones automáticas antes de crear el
                ticket.
              </p>
            </div>
            <Button
              onClick={handleAnalyze}
              className="w-full gradient-primary"
              disabled={isAnalyzing}
            >
              <Bot className="mr-2 h-4 w-4" />
              Analizar con IA
            </Button>
          </div>
        );

      case 'analyzing':
        return (
          <div className="text-center py-8 space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <Bot className="h-16 w-16 text-primary" />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Analizando tu problema...</h3>
              <p className="text-sm text-muted-foreground">
                Buscando soluciones automáticas en nuestra base de conocimiento
              </p>
            </div>
            <div className="space-y-2 text-left max-w-md mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Categorizando problema</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 text-sm"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Analizando severidad</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="flex items-center gap-2 text-sm"
              >
                <Clock className="h-4 w-4 text-blue-500 animate-spin" />
                <span>Buscando soluciones...</span>
              </motion.div>
            </div>
          </div>
        );

      case 'suggestions':
        return (
          <div className="space-y-4">
            {/* Información detectada */}
            <div className="flex gap-2">
              <Badge variant="outline">Categoría: {ticketData.category}</Badge>
              <Badge variant={ticketData.priority === 'high' ? 'destructive' : 'secondary'}>
                Prioridad:{' '}
                {ticketData.priority === 'high'
                  ? 'Alta'
                  : ticketData.priority === 'medium'
                    ? 'Media'
                    : 'Baja'}
              </Badge>
              <Badge variant="default">
                Confianza: {Math.round((aiSuggestions?.confidence || 0) * 100)}%
              </Badge>
            </div>

            {/* Solución automática */}
            {aiSuggestions?.autoResolvable && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-green-900">
                    <Zap className="h-5 w-5" />
                    Solución Automática Disponible
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    {aiSuggestions.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-800 mb-4 whitespace-pre-wrap">
                    {aiSuggestions.solution}
                  </p>
                  <Button
                    onClick={handleUseAutomaticSolution}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aplicar Solución Automática
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Artículos relacionados */}
            {aiSuggestions?.relatedArticles && aiSuggestions.relatedArticles.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Artículos Relacionados
                </h4>
                <div className="space-y-2">
                  {aiSuggestions.relatedArticles.map((article) => (
                    <button
                      key={article.id}
                      className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors"
                      onClick={() => window.open(`/knowledge-base?article=${article.id}`, '_blank')}
                    >
                      <p className="text-sm font-medium">{article.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Crear ticket si no es auto-resoluble */}
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                {aiSuggestions?.autoResolvable
                  ? '¿La solución automática no funciona? Crea un ticket para soporte humano.'
                  : 'No encontramos una solución automática. Crearé un ticket para nuestro equipo de soporte.'}
              </p>
              <Button onClick={handleCreateTicket} variant="outline" className="w-full">
                <Ticket className="mr-2 h-4 w-4" />
                Crear Ticket de Soporte
              </Button>
            </div>
          </div>
        );

      case 'created':
        return (
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-100 p-6 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Ticket Creado</h3>
              <p className="text-sm text-muted-foreground">
                Nuestro equipo te responderá en menos de 2 horas
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <p className="text-sm text-blue-800">
                <strong>Próximos pasos:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Recibirás un email de confirmación</li>
                <li>• Puedes seguir el estado en "Mis Tickets"</li>
                <li>• Te notificaremos cuando haya actualizaciones</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="fixed bottom-24 right-6 z-40 shadow-lg"
      >
        <Ticket className="mr-2 h-4 w-4" />
        Crear Ticket
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Sistema de Soporte Inteligente
            </CardTitle>
            <CardDescription>
              Nuestro sistema IA buscará soluciones automáticas antes de crear un ticket
            </CardDescription>
          </CardHeader>
          <CardContent>{renderStep()}</CardContent>
          {step === 'form' && (
            <div className="px-6 pb-6">
              <Button variant="ghost" onClick={() => setIsOpen(false)} className="w-full">
                Cancelar
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
