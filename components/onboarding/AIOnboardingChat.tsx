'use client';

/**
 * Onboarding Conversacional con IA
 * 
 * Chat fullscreen que guía al usuario nuevo paso a paso,
 * detecta su nivel, y configura la plataforma automáticamente.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Send,
  Bot,
  User,
  Sparkles,
  ArrowRight,
  X,
  Building2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{ type: string; path: string; label?: string }>;
}

interface AIOnboardingChatProps {
  onComplete: () => void;
  onSkip: () => void;
}

const PHASES = ['welcome', 'business', 'experience', 'configure', 'ready'];
const PHASE_LABELS: Record<string, string> = {
  welcome: 'Bienvenida',
  business: 'Tu negocio',
  experience: 'Experiencia',
  configure: 'Personalización',
  ready: '¡Listo!',
};

export function AIOnboardingChat({ onComplete, onSkip }: AIOnboardingChatProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState('welcome');
  const [configApplied, setConfigApplied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-start conversation
  useEffect(() => {
    if (messages.length === 0) {
      sendToAI('Hola', 'welcome');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendToAI = async (userMessage: string, currentPhase?: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    // Don't show "Hola" as user message on first interaction
    if (messages.length > 0) {
      setMessages(prev => [...prev, userMsg]);
    }

    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      if (messages.length > 0) {
        history.push({ role: 'user', content: userMessage });
      }

      const res = await fetch('/api/ai/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: history.slice(-10),
          phase: currentPhase || phase,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          actions: data.actions,
        };

        setMessages(prev => [...prev, botMsg]);

        if (data.phase) {
          setPhase(data.phase);
        }

        if (data.configApplied) {
          setConfigApplied(true);
        }

        if (data.phase === 'complete' || data.phase === 'ready') {
          // Give user time to read final message
          setTimeout(() => {
            // Don't auto-close, let user click "Empezar"
          }, 2000);
        }
      } else {
        setMessages(prev => [...prev, {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: '¡Ups! Hubo un problema técnico. ¿Puedes repetir lo que dijiste?',
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const msg = input.trim();
    setInput('');
    sendToAI(msg);
  };

  const handleQuickReply = (text: string) => {
    if (isTyping) return;
    sendToAI(text);
  };

  const handleComplete = async () => {
    try {
      await fetch('/api/user/onboarding-status', { method: 'POST' });
    } catch {
      // Non-blocking
    }
    onComplete();
    toast.success('¡Bienvenido a INMOVA! Tu plataforma está configurada.');
  };

  const currentPhaseIndex = PHASES.indexOf(phase);
  const progress = Math.min(((currentPhaseIndex + 1) / PHASES.length) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold">Configuración con IA</h1>
            <p className="text-white/50 text-xs">
              {PHASE_LABELS[phase] || 'Onboarding'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2">
            {PHASES.map((p, i) => (
              <div
                key={p}
                className={`h-2 w-8 rounded-full transition-colors ${
                  i <= currentPhaseIndex ? 'bg-indigo-500' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-white/50 hover:text-white hover:bg-white/10"
          >
            Saltar
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 md:px-12 lg:px-24 xl:px-48 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-indigo-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/10 text-white/90'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                {/* Action buttons from AI */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.actions
                      .filter(a => a.type === 'navigate')
                      .map((action, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant="outline"
                          className="text-xs border-white/20 text-white hover:bg-white/10"
                          onClick={() => {
                            handleComplete();
                            router.push(action.path);
                          }}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          {action.label || action.path}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-lg bg-indigo-600/50 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies for common responses */}
      {phase === 'welcome' && messages.length <= 2 && !isTyping && (
        <div className="px-4 md:px-12 lg:px-24 xl:px-48 pb-2">
          <div className="flex flex-wrap gap-2">
            {[
              'Alquiler residencial',
              'Alquiler vacacional (STR)',
              'Coliving / Habitaciones',
              'Holding / Family Office',
              'Gestión de comunidades',
            ].map((option) => (
              <Button
                key={option}
                variant="outline"
                size="sm"
                className="text-xs border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => handleQuickReply(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* "Empezar" button when ready */}
      {(phase === 'ready' || phase === 'complete') && !isTyping && (
        <div className="px-4 md:px-12 lg:px-24 xl:px-48 pb-2">
          <Button
            size="lg"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleComplete}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            ¡Empezar a usar INMOVA!
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 md:p-6 md:px-12 lg:px-24 xl:px-48 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={phase === 'ready' ? 'Escribe tu pregunta o haz click en Empezar...' : 'Escribe tu respuesta...'}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-indigo-500"
            disabled={isTyping}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-white/30 text-xs mt-2 text-center">
          Pulsa Enter para enviar · La IA configura tu plataforma en tiempo real
        </p>
      </div>
    </motion.div>
  );
}
