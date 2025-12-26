/**
 * ONBOARDING CHATBOT
 * Asistente virtual IA para guiar al usuario durante el onboarding
 * Ubicado en la esquina inferior derecha de la página de onboarding
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Building2,
  Home,
  FileText,
  Rocket,
  LayoutDashboard,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestedActions?: Array<{
    label: string;
    route: string;
    icon?: string;
  }>;
}

interface OnboardingChatbotProps {
  className?: string;
}

export default function OnboardingChatbot({ className = '' }: OnboardingChatbotProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom cuando cambian los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cargar mensaje de bienvenida al abrir por primera vez
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadWelcomeMessage();
    }
  }, [isOpen]);

  async function loadWelcomeMessage() {
    try {
      const response = await fetch('/api/onboarding/chatbot');
      if (response.ok) {
        const data = await response.json();
        setMessages([
          {
            role: 'assistant',
            content: data.welcomeMessage,
          },
        ]);
        setQuickQuestions(data.quickQuestions || []);
      }
    } catch (error) {
      console.error('Error loading welcome message:', error);
    }
  }

  async function sendMessage(message: string) {
    if (!message.trim() || isLoading) return;

    // Añadir mensaje del usuario
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/onboarding/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message,
          suggestedActions: data.suggestedActions,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, he tenido un problema. ¿Podrías intentarlo de nuevo? 😔',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickQuestion(question: string) {
    sendMessage(question);
  }

  function handleAction(route: string) {
    router.push(route);
    setIsOpen(false);
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 w-96 max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
            style={{ height: '500px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Asistente INMOVA</h3>
                  <p className="text-indigo-100 text-xs">Estoy aquí para ayudarte</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {/* Acciones sugeridas */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.suggestedActions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => handleAction(action.route)}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            {getIcon(action.icon)}
                            <span>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 rounded-2xl px-4 py-2 shadow-sm border border-gray-200">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  </div>
                </div>
              )}

              {/* Quick Questions (solo al inicio) */}
              {messages.length === 1 && quickQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Preguntas frecuentes:</p>
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(q)}
                      className="w-full text-left px-3 py-2 bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-lg text-xs border border-gray-200 hover:border-indigo-300 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(inputValue);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Abrir asistente virtual"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Badge de nuevo mensaje (opcional) */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
        >
          <Sparkles className="w-3 h-3" />
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getIcon(iconName?: string) {
  const iconMap: Record<string, React.ReactNode> = {
    Building2: <Building2 className="w-4 h-4" />,
    Home: <Home className="w-4 h-4" />,
    FileText: <FileText className="w-4 h-4" />,
    Rocket: <Rocket className="w-4 h-4" />,
    LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
  };

  return iconMap[iconName || ''] || <Sparkles className="w-4 h-4" />;
}
