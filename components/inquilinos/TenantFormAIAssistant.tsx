'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TenantFormData {
  nombre?: string;
  email?: string;
  telefono?: string;
  documentoIdentidad?: string;
  tipoDocumento?: string;
  fechaNacimiento?: string;
  nacionalidad?: string;
  estadoCivil?: string;
  profesion?: string;
  ingresosMensuales?: string;
}

interface TenantFormAIAssistantProps {
  formData: TenantFormData;
  onSuggestion?: (field: string, value: string) => void;
}

export function TenantFormAIAssistant({ formData, onSuggestion }: TenantFormAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 ¡Hola! Soy tu asistente IA para registrar inquilinos. Puedo ayudarte a:\n\n• Validar los datos del formulario\n• Sugerir campos importantes\n• Resolver dudas sobre el proceso\n\n¿En qué te puedo ayudar?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (action: 'ask' | 'validate' | 'suggest', question?: string) => {
    if (action === 'ask' && !question?.trim()) return;

    // Añadir mensaje del usuario si es una pregunta
    if (action === 'ask' && question) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: question,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
    }

    setIsTyping(true);

    try {
      const conversationHistory = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/ai/tenant-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          question: action === 'ask' ? question : undefined,
          formData,
          conversationHistory
        })
      });

      const data = await res.json();

      if (data.success || data.message) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Error en la respuesta');
      }
    } catch (error) {
      logger.error('Error en TenantFormAIAssistant:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '😅 Lo siento, tuve un problema. Por favor, intenta de nuevo o contacta con soporte.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage('ask', inputValue);
    }
  };

  const quickActions = [
    { label: 'Validar datos', action: 'validate' as const, icon: CheckCircle2 },
    { label: 'Sugerir campos', action: 'suggest' as const, icon: Lightbulb },
  ];

  return (
    <>
      {/* Botón flotante para abrir el asistente */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-[152px] right-6 z-40 hidden md:block"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              title="Asistente IA para formulario"
            >
              <Sparkles className="h-5 w-5" />
            </Button>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-violet-500"></span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ventana del asistente */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[152px] right-6 z-40 w-96 max-w-[calc(100vw-3rem)] hidden md:block"
          >
            <Card className="h-[450px] flex flex-col shadow-2xl border-violet-200">
              <CardHeader className="flex-shrink-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-lg py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Asistente IA</CardTitle>
                      <p className="text-xs text-white/80">Formulario de Inquilino</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Acciones rápidas */}
              <div className="flex gap-2 p-2 border-b bg-muted/50">
                {quickActions.map((qa) => (
                  <Button
                    key={qa.action}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(qa.action)}
                    disabled={isTyping}
                    className="flex-1 text-xs h-8"
                  >
                    <qa.icon className="h-3 w-3 mr-1" />
                    {qa.label}
                  </Button>
                ))}
              </div>

              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`flex-shrink-0 p-1.5 rounded-full h-7 w-7 flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-violet-100 text-violet-600'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-3.5 w-3.5" />
                        ) : (
                          <Bot className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block rounded-lg p-2.5 max-w-[85%] text-sm ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                          {message.timestamp.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2"
                    >
                      <div className="bg-violet-100 text-violet-600 p-1.5 rounded-full h-7 w-7 flex items-center justify-center">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="bg-muted rounded-lg p-2.5">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                            className="h-1.5 w-1.5 bg-muted-foreground rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                            className="h-1.5 w-1.5 bg-muted-foreground rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                            className="h-1.5 w-1.5 bg-muted-foreground rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <CardContent className="flex-shrink-0 p-2 border-t">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 h-9 text-sm"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={() => sendMessage('ask', inputValue)}
                    disabled={!inputValue.trim() || isTyping}
                    size="sm"
                    className="h-9 w-9 p-0"
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default TenantFormAIAssistant;
