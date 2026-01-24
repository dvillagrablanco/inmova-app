'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  ExternalLink,
  PlayCircle,
  Loader2,
  Sparkles,
  BookOpen,
  Ticket,
  Smile,
  Meh,
  Frown,
  AlertTriangle,
  Zap,
  Heart,
  ThumbsUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import logger, { logError } from '@/lib/logger';

interface SentimentInfo {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  emotions: string[];
  suggestedTone?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  confidence?: number;
  suggestedActions?: SuggestedAction[];
  relatedArticles?: KnowledgeArticle[];
  sentimentAnalysis?: SentimentInfo;
}

interface SuggestedAction {
  id: string;
  label: string;
  action: string;
  icon: string;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  excerpt: string;
  videoUrl?: string;
}

export default function IntelligentSupportChatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: '¡Hola! Soy tu asistente inteligente de INMOVA. ¿En qué puedo ayudarte hoy? 🚀',
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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Preparar historial de conversación para análisis de contexto
      const conversationHistory = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      const res = await fetch('/api/support/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask',
          question: inputValue,
          conversationHistory
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.message,
          timestamp: new Date(),
          confidence: data.confidence,
          suggestedActions: data.suggestedActions,
          relatedArticles: data.relatedArticles,
          sentimentAnalysis: data.sentimentAnalysis
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Error en la respuesta');
      }
    } catch (error) {
      logger.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Lo siento, he tenido un problema. ¿Podrías intentarlo de nuevo?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action: SuggestedAction) => {
    if (action.action.startsWith('navigate:')) {
      const path = action.action.replace('navigate:', '');
      router.push(path);
      setIsOpen(false);
      toast.success(`Redirigiendo a ${action.label}`);
    } else if (action.action === 'create_ticket') {
      router.push('/soporte?action=create');
      setIsOpen(false);
    } else if (action.action.startsWith('play_video:')) {
      const videoUrl = action.action.replace('play_video:', '');
      window.open(videoUrl, '_blank');
    }
  };

  const handleArticleClick = async (article: KnowledgeArticle) => {
    try {
      const res = await fetch('/api/support/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_article',
          articleId: article.id
        })
      });

      if (res.ok) {
        const { article: fullArticle } = await res.json();
        
        const articleMessage: Message = {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Aquí está el artículo completo:\n\n## ${fullArticle.title}\n\n${fullArticle.excerpt}\n\n[Ver artículo completo](/knowledge-base?article=${fullArticle.id})`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, articleMessage]);
      }
    } catch (error) {
      logger.error('Error fetching article:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Botón flotante mejorado con emoticono */}
      {/* Posicionamiento controlado por CSS global via data-floating-widget */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            className="intelligent-chatbot-floating"
            data-floating-widget="support-chatbot"
          >
            <Button
              size="lg"
              onClick={() => setIsOpen(true)}
              className="h-16 w-16 rounded-full shadow-2xl hover:shadow-3xl transition-all bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-2 border-white relative overflow-hidden group"
              aria-label="Abrir chat de asistencia"
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors" />
              
              {/* Emoticono del asistente */}
              <span className="text-3xl relative z-10 group-hover:scale-110 transition-transform" role="img" aria-label="Asistente">
                🤖
              </span>
            </Button>
            
            {/* Indicador de disponibilidad pulsante */}
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
              className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-3 border-white shadow-lg"
              aria-label="En línea"
            >
              <span className="sr-only">Asistente disponible</span>
            </motion.div>
            
            {/* Tooltip informativo */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2 }}
              className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl pointer-events-none hidden sm:block"
            >
              💬 ¿Necesitas ayuda?
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-8 border-transparent border-l-gray-900" />
            </motion.div>
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
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[60] w-[calc(100vw-2rem)] md:w-full md:max-w-md"
          >
            <Card className="h-[600px] flex flex-col shadow-2xl">
              <CardHeader className="flex-shrink-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Asistente INMOVA</CardTitle>
                      <CardDescription className="text-primary-foreground/80 text-xs">
                        Soporte inteligente 24/7
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-primary-foreground hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${
                        message.sender === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      } p-2 rounded-full h-8 w-8 flex items-center justify-center`}>
                        {message.sender === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div className={`flex-1 ${
                        message.sender === 'user' ? 'items-end' : 'items-start'
                      } flex flex-col gap-2`}>
                        <div className={`${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted'
                        } rounded-lg p-3 max-w-[85%]`}>
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          {message.confidence && message.confidence < 0.7 && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              Sugerencia: puede que necesites crear un ticket
                            </Badge>
                          )}
                        </div>

                        {/* Análisis de Sentimiento */}
                        {message.sentimentAnalysis && message.sender === 'bot' && (
                          <div className="mt-2 p-2 bg-white border rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Análisis de Sentimiento:
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {/* Sentimiento */}
                              <Badge 
                                variant={
                                  message.sentimentAnalysis.sentiment === 'positive' 
                                    ? 'default' 
                                    : message.sentimentAnalysis.sentiment === 'negative' 
                                    ? 'destructive' 
                                    : 'secondary'
                                }
                                className="text-xs flex items-center gap-1"
                              >
                                {message.sentimentAnalysis.sentiment === 'positive' && <Smile className="h-3 w-3" />}
                                {message.sentimentAnalysis.sentiment === 'neutral' && <Meh className="h-3 w-3" />}
                                {message.sentimentAnalysis.sentiment === 'negative' && <Frown className="h-3 w-3" />}
                                {message.sentimentAnalysis.sentiment === 'positive' ? 'Positivo' : 
                                 message.sentimentAnalysis.sentiment === 'negative' ? 'Negativo' : 'Neutral'}
                              </Badge>
                              
                              {/* Urgencia */}
                              {message.sentimentAnalysis.urgency !== 'low' && (
                                <Badge 
                                  variant={
                                    message.sentimentAnalysis.urgency === 'critical' 
                                      ? 'destructive' 
                                      : message.sentimentAnalysis.urgency === 'high'
                                      ? 'default'
                                      : 'outline'
                                  }
                                  className="text-xs flex items-center gap-1"
                                >
                                  {(message.sentimentAnalysis.urgency === 'critical' || 
                                    message.sentimentAnalysis.urgency === 'high') && 
                                    <AlertTriangle className="h-3 w-3" />}
                                  {message.sentimentAnalysis.urgency === 'critical' ? 'Crítico' :
                                   message.sentimentAnalysis.urgency === 'high' ? 'Alta Urgencia' : 'Moderado'}
                                </Badge>
                              )}
                              
                              {/* Emociones detectadas */}
                              {message.sentimentAnalysis.emotions && message.sentimentAnalysis.emotions.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {message.sentimentAnalysis.emotions.slice(0, 2).join(', ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Acciones sugeridas */}
                        {message.suggestedActions && message.suggestedActions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {message.suggestedActions.map((action) => (
                              <Button
                                key={action.id}
                                variant="outline"
                                size="sm"
                                onClick={() => handleActionClick(action)}
                                className="text-xs"
                              >
                                {action.icon === 'Ticket' && <Ticket className="mr-1 h-3 w-3" />}
                                {action.icon === 'BookOpen' && <BookOpen className="mr-1 h-3 w-3" />}
                                {action.icon === 'ExternalLink' && <ExternalLink className="mr-1 h-3 w-3" />}
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Artículos relacionados */}
                        {message.relatedArticles && message.relatedArticles.length > 0 && (
                          <div className="mt-2 space-y-2 w-full">
                            <p className="text-xs text-muted-foreground font-medium">
                              Artículos relacionados:
                            </p>
                            {message.relatedArticles.map((article) => (
                              <button
                                key={article.id}
                                onClick={() => handleArticleClick(article)}
                                className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors"
                              >
                                <div className="flex items-start gap-2">
                                  <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{article.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {article.excerpt}
                                    </p>
                                    {article.videoUrl && (
                                      <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                                        <PlayCircle className="h-3 w-3" />
                                        Incluye video tutorial
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="bg-muted p-2 rounded-full h-8 w-8 flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                            className="h-2 w-2 bg-muted-foreground rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                            className="h-2 w-2 bg-muted-foreground rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                            className="h-2 w-2 bg-muted-foreground rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <CardContent className="flex-shrink-0 p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    size="icon"
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Respuestas automáticas con IA - Soporte 24/7
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
