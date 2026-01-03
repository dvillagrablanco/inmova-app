/**
 * Componente: Chat Window
 * 
 * Ventana de chat en tiempo real usando WebSockets.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/lib/websocket-client';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';

interface ChatWindowProps {
  conversationId: string;
  recipientName: string;
  onClose?: () => void;
}

export function ChatWindow({ conversationId, recipientName, onClose }: ChatWindowProps) {
  const { data: session } = useSession();
  const { messages, sendMessage, setIsTyping, connected } = useChat(conversationId);
  const [input, setInput] = useState('');
  const [isTypingState, setIsTypingState] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (value: string) => {
    setInput(value);

    // Send typing indicator
    if (!isTypingState && value.length > 0) {
      setIsTyping(true);
      setIsTypingState(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 1s of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setIsTypingState(false);
    }, 1000);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    sendMessage(input.trim());
    setInput('');
    setIsTyping(false);
    setIsTypingState(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback>{recipientName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{recipientName}</h3>
            <p className="text-xs text-gray-500">
              {connected ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  En línea
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                  Desconectado
                </span>
              )}
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No hay mensajes aún. ¡Empieza la conversación!
          </div>
        )}

        {messages.map((message) => {
          const isOwn = message.senderId === session?.user?.id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                {!isOwn && (
                  <p className="text-xs text-gray-500 mb-1">{message.senderName}</p>
                )}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            disabled={!connected}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            size="icon"
          >
            {connected ? <Send className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
