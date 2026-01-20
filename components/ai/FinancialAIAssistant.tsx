'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Brain,
  TrendingUp,
  Sparkles,
  Send,
  Loader2,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Euro,
  PiggyBank,
  Calculator,
  Zap,
  FileText,
  Building,
  CreditCard,
  LineChart,
  Target,
  Lightbulb,
  Clock,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

interface FinancialAIAssistantProps {
  /** Contexto del asistente */
  context?: 'conciliacion' | 'contabilidad' | 'presupuestos' | 'general';
  /** Datos de contexto para el análisis */
  contextData?: {
    pendingTransactions?: number;
    totalBalance?: number;
    unreconciled?: number;
    bankAccounts?: Array<{ name: string; balance: number }>;
  };
  /** Callback cuando el usuario quiere ejecutar una acción */
  onAction?: (action: string, data?: any) => void;
  /** Callback para auto-conciliar */
  onAutoReconcile?: () => void;
  /** Si está sincronizando */
  isSyncing?: boolean;
}

// Sugerencias rápidas según contexto
const QUICK_SUGGESTIONS: Record<string, string[]> = {
  conciliacion: [
    '¿Qué movimientos están pendientes de conciliar?',
    'Analiza los patrones de ingresos del último mes',
    '¿Hay facturas vencidas sin cobrar?',
    'Sugiere conciliaciones automáticas',
    '¿Cuál es el estado de las cuentas bancarias?',
  ],
  contabilidad: [
    '¿Cuál es el balance actual?',
    'Genera un informe de pérdidas y ganancias',
    '¿Hay asientos pendientes de revisar?',
    'Analiza la evolución de gastos',
    '¿Cuáles son los principales gastos del mes?',
  ],
  presupuestos: [
    '¿Estamos dentro del presupuesto?',
    'Compara presupuesto vs real',
    '¿Qué partidas están desviadas?',
    'Proyecta los gastos para el próximo trimestre',
    'Analiza tendencias de gasto',
  ],
  general: [
    '¿Cómo puedo mejorar la rentabilidad?',
    'Analiza el flujo de caja',
    '¿Hay alertas financieras?',
    'Genera un resumen financiero',
    '¿Cuál es la situación financiera actual?',
  ],
};

export function FinancialAIAssistant({
  context = 'conciliacion',
  contextData,
  onAction,
  onAutoReconcile,
  isSyncing = false,
}: FinancialAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Enviar mensaje al agente
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Preparar contexto para el agente
      const systemContext = {
        context,
        contextData,
        currentTime: new Date().toISOString(),
      };

      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'financial_analysis',
          message: content,
          systemContext,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar mensaje');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || data.response || 'Lo siento, no pude procesar tu solicitud.',
        timestamp: new Date(),
        suggestions: data.suggestions,
        actions: data.actions,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Respuesta de fallback con información útil
      const fallbackMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: getFallbackResponse(content, context, contextData),
        timestamp: new Date(),
        suggestions: QUICK_SUGGESTIONS[context]?.slice(0, 3),
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, context, contextData, isLoading]);

  // Respuesta de fallback inteligente
  const getFallbackResponse = (query: string, ctx: string, data?: any): string => {
    const lowerQuery = query.toLowerCase();
    
    if (ctx === 'conciliacion') {
      if (lowerQuery.includes('pendiente') || lowerQuery.includes('conciliar')) {
        const pending = data?.pendingTransactions || 0;
        return `Actualmente tienes **${pending} movimientos pendientes** de conciliar. Te recomiendo:\n\n1. Usar la función "Conciliar con IA" para automatizar el proceso\n2. Revisar los movimientos de mayor importe primero\n3. Verificar que las referencias bancarias coincidan con tus facturas\n\n¿Quieres que inicie la conciliación automática?`;
      }
      
      if (lowerQuery.includes('banco') || lowerQuery.includes('cuenta') || lowerQuery.includes('saldo')) {
        const accounts = data?.bankAccounts || [];
        if (accounts.length > 0) {
          const accountsInfo = accounts.map((a: any) => `- **${a.name}**: ${a.balance.toLocaleString('es-ES')}€`).join('\n');
          return `Estas son tus cuentas bancarias conectadas:\n\n${accountsInfo}\n\n**Saldo total**: ${data?.totalBalance?.toLocaleString('es-ES') || 0}€\n\n¿Necesitas sincronizar alguna cuenta?`;
        }
        return 'No hay cuentas bancarias conectadas. Te recomiendo ir a **Open Banking** para conectar tus cuentas y empezar a sincronizar movimientos.';
      }

      if (lowerQuery.includes('factura') || lowerQuery.includes('cobrar') || lowerQuery.includes('vencid')) {
        return 'Para ver las facturas pendientes de cobro, revisa la pestaña **"Facturas"** en esta pantalla. Ahí podrás ver:\n\n- Facturas emitidas pendientes de pago\n- Facturas vencidas\n- Estado de conciliación\n\nLa conciliación automática puede vincular pagos recibidos con sus facturas correspondientes.';
      }
    }

    // Respuesta genérica
    return `Entiendo tu consulta sobre "${query}". Como asistente financiero de INMOVA, puedo ayudarte con:\n\n📊 **Conciliación bancaria** - Vincular movimientos con facturas\n💰 **Análisis financiero** - Revisar ingresos, gastos y rentabilidad\n📈 **Proyecciones** - Estimar flujos de caja futuros\n🔍 **Detección de anomalías** - Identificar pagos duplicados o faltantes\n\n¿En qué área específica necesitas ayuda?`;
  };

  // Manejar sugerencia rápida
  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Ejecutar acción
  const handleAction = (action: string, data?: any) => {
    if (action === 'auto_reconcile' && onAutoReconcile) {
      onAutoReconcile();
      toast.success('Iniciando conciliación automática...');
    } else if (onAction) {
      onAction(action, data);
    }
  };

  // Obtener título según contexto
  const getContextTitle = () => {
    switch (context) {
      case 'conciliacion':
        return 'Asistente de Conciliación';
      case 'contabilidad':
        return 'Asistente Contable';
      case 'presupuestos':
        return 'Asistente de Presupuestos';
      default:
        return 'Asistente Financiero';
    }
  };

  // Obtener icono según contexto
  const getContextIcon = () => {
    switch (context) {
      case 'conciliacion':
        return <ArrowRightLeft className="h-5 w-5 text-white" />;
      case 'contabilidad':
        return <Calculator className="h-5 w-5 text-white" />;
      case 'presupuestos':
        return <Target className="h-5 w-5 text-white" />;
      default:
        return <TrendingUp className="h-5 w-5 text-white" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-24 md:bottom-6 right-6 z-[60] h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 hover:shadow-2xl hover:scale-105 transition-all"
          size="icon"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Brain className="h-6 w-6 text-white" />
                  {contextData?.pendingTransactions && contextData.pendingTransactions > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {contextData.pendingTransactions > 9 ? '9+' : contextData.pendingTransactions}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{getContextTitle()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg bg-white dark:bg-gray-950 border-l shadow-xl flex flex-col">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center">
              {getContextIcon()}
            </div>
            <span className="text-lg">{getContextTitle()}</span>
          </SheetTitle>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1 text-emerald-500" />
              Claude Sonnet 4
            </Badge>
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Análisis Financiero
            </Badge>
          </div>

          <SheetDescription className="text-sm">
            Te ayudo a conciliar movimientos, analizar finanzas y detectar anomalías
          </SheetDescription>
        </SheetHeader>

        {/* Resumen de contexto */}
        {contextData && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {contextData.pendingTransactions !== undefined && (
              <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-lg font-bold text-amber-700">{contextData.pendingTransactions}</p>
                      <p className="text-xs text-amber-600">Pendientes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {contextData.totalBalance !== undefined && (
              <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-lg font-bold text-emerald-700">
                        {contextData.totalBalance.toLocaleString('es-ES')}€
                      </p>
                      <p className="text-xs text-emerald-600">Saldo total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Acciones rápidas */}
        {context === 'conciliacion' && (
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAutoReconcile?.()}
              disabled={isSyncing}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-1" />
              Conciliar con IA
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isSyncing}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </div>
        )}

        {/* Área de chat */}
        <div className="flex-1 mt-4 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-2">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Lightbulb className="h-10 w-10 mx-auto text-amber-500 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Pregúntame sobre conciliación, movimientos o análisis financiero
                  </p>
                </div>

                {/* Sugerencias rápidas */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Sugerencias:</p>
                  {QUICK_SUGGESTIONS[context]?.slice(0, 4).map((suggestion, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => handleQuickSuggestion(suggestion)}
                    >
                      <HelpCircle className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                      <span className="text-sm">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-muted'
                      }`}
                    >
                      <div 
                        className="text-sm whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: message.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                      
                      {/* Acciones sugeridas */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.actions.map((action, idx) => (
                            <Button
                              key={idx}
                              size="sm"
                              variant="secondary"
                              onClick={() => handleAction(action.action, action.data)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Sugerencias de seguimiento */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-muted-foreground/20">
                          <p className="text-xs text-muted-foreground mb-2">También puedes preguntar:</p>
                          <div className="space-y-1">
                            {message.suggestions.map((suggestion, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-left h-auto py-1 text-xs"
                                onClick={() => handleQuickSuggestion(suggestion)}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Analizando...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input de mensaje */}
          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Escribe tu consulta financiera..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputValue);
                }
              }}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default FinancialAIAssistant;
