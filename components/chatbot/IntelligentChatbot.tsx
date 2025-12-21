'use client';

/**
 * CHATBOT INTELIGENTE CON GPT-4
 * Zero-Touch Support System
 */

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Phone,
  Mail,
  ExternalLink,
  Sparkles,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: {
    label: string;
    action: 'link' | 'route' | 'function';
    value: string;
  }[];
}

interface ChatbotProps {
  position?: 'bottom-right' | 'bottom-left';
  accentColor?: string;
}

export function IntelligentChatbot({ 
  position = 'bottom-right',
  accentColor = '#667eea'
}: ChatbotProps) {
  const { data: session } = useSession() || {};
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Mensaje de bienvenida
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `¡Hola${session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}! 👋\n\nSoy el asistente virtual de INMOVA. ¿En qué puedo ayudarte hoy?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, session]);

  const quickActions = [
    { 
      label: 'Crear primera propiedad', 
      icon: '🏢', 
      prompt: '¿Cómo creo mi primera propiedad?' 
    },
    { 
      label: 'Importar datos', 
      icon: '📂', 
      prompt: '¿Cómo importo mis datos existentes?' 
    },
    { 
      label: 'Configurar pagos', 
      icon: '💳', 
      prompt: '¿Cómo configuro los pagos con Stripe?' 
    },
    { 
      label: 'Ver tutoriales', 
      icon: '🎥', 
      prompt: '¿Dónde encuentro tutoriales?' 
    }
  ];

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      // Llamar a API del chatbot
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          history: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          context: {
            userId: session?.user?.id,
            userRole: session?.user?.role,
            currentPath: window.location.pathname
          }
        })
      });

      if (!response.ok) throw new Error('Error en respuesta del chatbot');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        actions: data.suggestedActions
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Si necesita escalar a humano
      if (data.escalateToHuman) {
        const escalationMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'system',
          content: '📞 Para este tema, es mejor que hables directamente con nuestro equipo. ¿Quieres que te contactemos?',
          timestamp: new Date(),
          actions: [
            { label: 'Sí, contáctenme', action: 'function', value: 'requestCallback' },
            { label: 'Enviar email', action: 'link', value: 'mailto:soporte@inmova.app' }
          ]
        };
        setMessages(prev => [...prev, escalationMessage]);
      }
    } catch (error) {
      console.error('[CHATBOT] Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Lo siento, hubo un error. ¿Podrías intentar de nuevo o contactar a soporte@inmova.app?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    handleSend();
  };

  const handleAction = async (action: Message['actions'][0]) => {
    if (action.action === 'link') {
      window.open(action.value, '_blank');
    } else if (action.action === 'route') {
      window.location.href = action.value;
    } else if (action.action === 'function') {
      // Ejecutar función específica
      if (action.value === 'requestCallback') {
        // Aquí se podría abrir un formulario o enviar a API
        alert('Te contactaremos pronto. Revisa tu email.');
      }
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <>
      {/* Botón flotante */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`fixed ${positionClasses[position]} z-50`}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg"
              style={{ backgroundColor: accentColor }}
              size="icon"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
            
            {/* Badge de notificación */}
            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              <Sparkles className="h-3 w-3" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ventana del chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed ${positionClasses[position]} z-50`}
          >
            <Card className="w-[380px] shadow-2xl" style={{ 
              height: isMinimized ? '60px' : '600px',
              maxHeight: 'calc(100vh - 32px)'
            }}>
              {/* Header */}
              <div 
                className="flex items-center justify-between border-b px-4 py-3"
                style={{ backgroundColor: accentColor }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Asistente INMOVA</h3>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-400"></div>
                      <span className="text-xs text-white/80">En línea</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: '440px' }}>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex max-w-[80%] gap-2 ${
                            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              message.role === 'user'
                                ? 'bg-gray-200'
                                : message.role === 'system'
                                ? 'bg-amber-100'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                            }`}
                          >
                            {message.role === 'user' ? (
                              <User className="h-4 w-4 text-gray-600" />
                            ) : (
                              <Bot className="h-4 w-4 text-white" />
                            )}
                          </div>

                          {/* Message bubble */}
                          <div>
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                message.role === 'user'
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                  : message.role === 'system'
                                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>

                            {/* Actions */}
                            {message.actions && message.actions.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {message.actions.map((action, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => handleAction(action)}
                                  >
                                    {action.label}
                                    {action.action === 'link' && <ExternalLink className="ml-1 h-3 w-3" />}
                                  </Button>
                                ))}
                              </div>
                            )}

                            <p className="mt-1 text-xs text-gray-500">
                              {message.timestamp.toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                            <span className="text-sm text-gray-600">Escribiendo...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick actions */}
                  {showQuickActions && messages.length === 1 && (
                    <div className="border-t px-4 py-3">
                      <p className="mb-2 text-xs font-medium text-gray-500">Acciones rápidas:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {quickActions.map((action, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="h-auto justify-start text-left text-xs"
                            onClick={() => handleQuickAction(action.prompt)}
                          >
                            <span className="mr-2">{action.icon}</span>
                            <span className="truncate">{action.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe tu pregunta..."
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        size="icon"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Send className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Powered by GPT-4 • <a href="mailto:soporte@inmova.app" className="text-indigo-600 hover:underline">soporte@inmova.app</a>
                    </p>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
export default IntelligentChatbot;
