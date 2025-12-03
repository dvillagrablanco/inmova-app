'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, X, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { detectUserIntent, searchKnowledgeBase } from '@/lib/ai-automation-service';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: Array<{ label: string; action: string }>;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Mensaje de bienvenida
      setTimeout(() => {
        addBotMessage(
          '¡Hola! 👋 Soy tu Asistente IA de INMOVA. Puedo ayudarte a:\n\n• Crear edificios, inquilinos o contratos\n• Responder dudas sobre cómo usar la plataforma\n• Buscar en la documentación\n• Sugerirte acciones para optimizar tu gestión\n\n¿En qué puedo ayudarte?',
          [
            { label: '🏘️ Crear edificio', action: '/edificios/nuevo' },
            { label: '👥 Registrar inquilino', action: '/inquilinos/nuevo' },
            { label: '❓ Ver tutoriales', action: 'help' },
          ]
        );
      }, 500);
    }
  }, [isOpen]);

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addBotMessage = (text: string, suggestions?: Array<{ label: string; action: string }>) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      suggestions,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue;
    addUserMessage(userMessage);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Detectar intención
      const intent = await detectUserIntent(userMessage);

      let response = '';
      let suggestions: Array<{ label: string; action: string }> = [];

      switch (intent.intent) {
        case 'create_building':
          response =
            'Entiendo que quieres crear un edificio. Puedo guiarte paso a paso con el Wizard de creación que te hará algunas preguntas.\n\n¿Quieres que abra el asistente de creación?';
          suggestions = [
            { label: '✅ Sí, abrir wizard', action: '/edificios/nuevo' },
            { label: '📖 Ver guía primero', action: 'guide:building' },
          ];
          break;

        case 'create_tenant':
          response =
            'Perfecto, te ayudaré a registrar un nuevo inquilino. Tengo un wizard que facilita el proceso.\n\n¿Prefieres usar el wizard o hacerlo manualmente?';
          suggestions = [
            { label: '🦾 Usar wizard', action: '/inquilinos/nuevo' },
            { label: '🔍 Ver requisitos', action: 'guide:tenant' },
          ];
          break;

        case 'create_contract':
          response =
            'Genial, vamos a crear un contrato. Puedo ayudarte a generarlo con plantillas profesionales.\n\n¿Qué tipo de contrato necesitas?';
          suggestions = [
            { label: '🏠 Alquiler vivienda', action: '/contratos/nuevo?type=residential' },
            { label: '🏪 Alquiler local', action: '/contratos/nuevo?type=commercial' },
            { label: '🛌 Alquiler temporal', action: '/contratos/nuevo?type=temporal' },
          ];
          break;

        case 'help':
          // Buscar en base de conocimientos
          const articles = await searchKnowledgeBase(userMessage);
          if (articles.length > 0) {
            response = `Encontré ${articles.length} artículos que pueden ayudarte:\n\n${articles
              .slice(0, 3)
              .map((a, i) => `${i + 1}. ${a.title}\n   ${a.excerpt}`)
              .join('\n\n')}`;
            suggestions = articles.slice(0, 3).map(a => ({
              label: `Ver: ${a.title}`,
              action: a.url,
            }));
          } else {
            response =
              'No encontré artículos específicos para tu consulta, pero puedo ayudarte de otras formas.';
            suggestions = [
              { label: '📞 Contactar soporte', action: '/soporte' },
              { label: '📚 Ver todos los tutoriales', action: '/knowledge-base' },
            ];
          }
          break;

        case 'navigate':
          if (intent.suggestedAction) {
            response = `Te dirijo a: ${intent.suggestedAction.label}`;
            suggestions = [
              {
                label: `Ir a ${intent.suggestedAction.label}`,
                action: intent.suggestedAction.route || '/',
              },
            ];
          } else {
            response = '¿A dónde quieres ir?';
            suggestions = [
              { label: 'Dashboard', action: '/dashboard' },
              { label: 'Edificios', action: '/edificios' },
              { label: 'Inquilinos', action: '/inquilinos' },
              { label: 'Contratos', action: '/contratos' },
            ];
          }
          break;

        case 'report_issue':
          response =
            'Lamento que estés experimentando un problema. ¿Quieres crear un ticket de soporte? Te ayudaré a categorizarlo automáticamente.';
          suggestions = [
            { label: '🎫 Crear ticket', action: '/soporte/nuevo' },
            { label: '📞 Contactar directo', action: '/soporte' },
          ];
          break;

        case 'configure':
          response =
            '¿Qué quieres configurar? Puedo ayudarte con varias configuraciones.';
          suggestions = [
            { label: '⚙️ Configuración general', action: '/admin/configuracion' },
            { label: '🔔 Notificaciones', action: '/configuracion/notificaciones' },
            { label: '🔌 Integraciones', action: '/admin/integraciones-contables' },
          ];
          break;

        default:
          response =
            'Entiendo tu mensaje, pero no estoy seguro de cómo ayudarte mejor. ¿Podrías ser más específico o elegir una de estas opciones?';
          suggestions = [
            { label: '🏘️ Crear edificio', action: '/edificios/nuevo' },
            { label: '👥 Registrar inquilino', action: '/inquilinos/nuevo' },
            { label: '📖 Ver tutoriales', action: 'help' },
            { label: '📞 Contactar soporte', action: '/soporte' },
          ];
      }

      addBotMessage(response, suggestions);
    } catch (error) {
      console.error('Error processing message:', error);
      addBotMessage(
        'Disculpa, tuve un problema al procesar tu mensaje. ¿Podrías intentar de nuevo?'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (action: string) => {
    if (action.startsWith('/')) {
      router.push(action);
      toast.success('Redirigiendo...');
    } else if (action.startsWith('guide:')) {
      const topic = action.replace('guide:', '');
      addUserMessage(`Mostrar guía sobre ${topic}`);
      addBotMessage(
        `Aquí tienes información sobre ${topic}. Puedes encontrar más detalles en la sección de ayuda.`,
        [{ label: '📖 Ver guía completa', action: '/knowledge-base' }]
      );
    } else if (action === 'help') {
      addUserMessage('Ver tutoriales');
      addBotMessage(
        'Tenemos tutoriales completos sobre todos los módulos. ¿Sobre qué te gustaría aprender?',
        [
          { label: 'Gestión de edificios', action: 'guide:building' },
          { label: 'Gestión de inquilinos', action: 'guide:tenant' },
          { label: 'Contratos', action: 'guide:contract' },
        ]
      );
    }
  };

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-2xl gradient-primary hover:scale-110 transition-transform"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          height: isMinimized ? 60 : 600,
        }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)]"
      >
        <Card className="shadow-2xl border-2 border-primary/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold">Asistente IA</h3>
                <p className="text-xs text-indigo-100">Siempre listo para ayudar</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
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
              <CardContent className="h-[440px] overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-slate-50 to-indigo-50">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white' : 'bg-white border-2 border-indigo-200 text-indigo-600'}`}
                    >
                      {message.sender === 'user' ? '👤' : <Bot className="h-4 w-4" />}
                    </div>
                    <div className="flex flex-col gap-2 max-w-[75%]">
                      <div
                        className={`rounded-2xl p-3 ${message.sender === 'user' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white' : 'bg-white border border-indigo-200 text-gray-800'}`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      </div>
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <Button
                              key={idx}
                              size="sm"
                              variant="outline"
                              onClick={() => handleSuggestionClick(suggestion.action)}
                              className="justify-start text-left border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50"
                            >
                              {suggestion.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="bg-white border border-indigo-200 rounded-2xl p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input */}
              <div className="p-4 bg-white border-t-2 border-indigo-200">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe tu pregunta..."
                    disabled={isProcessing}
                    className="flex-1 border-indigo-200"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isProcessing}
                    className="gradient-primary"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
