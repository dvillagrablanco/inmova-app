/**
 * Componente de Chat con Agentes IA
 *
 * Interfaz de usuario para interactuar con el sistema de agentes especializados
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { AgentType } from '@/lib/ai-agents/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentType?: AgentType;
  timestamp: Date;
  actions?: any[];
  suggestions?: any[];
  toolsUsed?: string[];
}

interface AgentChatProps {
  preferredAgent?: AgentType;
  onAgentChange?: (agent: AgentType) => void;
  className?: string;
}

export default function AgentChat({
  preferredAgent,
  onAgentChange,
  className = '',
}: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(`conv_${Date.now()}`);
  const [currentAgent, setCurrentAgent] = useState<AgentType | undefined>(preferredAgent);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          conversationId,
          preferredAgent: currentAgent,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al comunicarse con el agente');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: data.response,
        agentType: data.agentType,
        timestamp: new Date(),
        actions: data.actions,
        suggestions: data.suggestions,
        toolsUsed: data.toolsUsed,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Actualizar agente actual si cambió
      if (data.agentType !== currentAgent) {
        setCurrentAgent(data.agentType);
        onAgentChange?.(data.agentType);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = async (suggestion: any) => {
    if (suggestion.actionable && suggestion.actionPayload?.transferTo) {
      // Manejar transferencia a otro agente
      setCurrentAgent(suggestion.actionPayload.transferTo);
      onAgentChange?.(suggestion.actionPayload.transferTo);
    }
  };

  const getAgentName = (agentType?: AgentType) => {
    const names: Record<AgentType, string> = {
      technical_support: 'Soporte Técnico',
      customer_service: 'Atención al Cliente',
      commercial_management: 'Gestión Comercial',
      financial_analysis: 'Análisis Financiero',
      legal_compliance: 'Legal y Cumplimiento',
      maintenance_preventive: 'Mantenimiento Preventivo',
      general: 'Asistente General',
    };
    return agentType ? names[agentType] : 'Asistente IA';
  };

  const getAgentColor = (agentType?: AgentType) => {
    const colors: Record<AgentType, string> = {
      technical_support: 'bg-orange-500',
      customer_service: 'bg-blue-500',
      commercial_management: 'bg-green-500',
      financial_analysis: 'bg-purple-500',
      legal_compliance: 'bg-red-500',
      maintenance_preventive: 'bg-yellow-500',
      general: 'bg-gray-500',
    };
    return agentType ? colors[agentType] : 'bg-gray-500';
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-full ${getAgentColor(currentAgent)} flex items-center justify-center`}
          >
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">{getAgentName(currentAgent)}</h3>
            <p className="text-xs text-blue-100">INMOVA AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">¿En qué puedo ayudarte hoy?</p>
            <p className="text-sm">
              Pregúntame sobre mantenimiento, contratos, pagos, análisis financiero o asuntos
              legales.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-2 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' ? 'bg-gray-200' : getAgentColor(message.agentType)
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-gray-600" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              <div className="flex flex-col space-y-2">
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Tools Used */}
                {message.toolsUsed && message.toolsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-1 px-2">
                    {message.toolsUsed.map((tool, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="space-y-2 px-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left p-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{suggestion.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                          </div>
                          {suggestion.actionable && (
                            <ArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {message.actions && message.actions.length > 0 && (
                  <div className="space-y-2 px-2">
                    <p className="text-xs font-medium text-gray-600">Acciones realizadas:</p>
                    {message.actions.map((action, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-2 text-sm p-2 bg-green-50 rounded border border-green-200"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{action.type}</p>
                          <p className="text-xs text-gray-600">{action.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">
                {getAgentName(currentAgent)} está pensando...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex items-end space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span>Enviar</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Presiona Enter para enviar • Los agentes pueden acceder y modificar datos del sistema
        </p>
      </div>
    </div>
  );
}
