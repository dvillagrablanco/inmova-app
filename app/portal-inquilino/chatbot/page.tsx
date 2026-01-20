'use client';

/**
 * Portal Inquilino - Asistente Virtual IA
 * 
 * Chatbot inteligente para inquilinos disponible 24/7
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  Send,
  User,
  Sparkles,
  HelpCircle,
  CreditCard,
  Wrench,
  FileText,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { id: 'pagos', label: '¿Cómo pago el alquiler?', icon: CreditCard },
  { id: 'mantenimiento', label: 'Reportar problema', icon: Wrench },
  { id: 'contrato', label: 'Ver mi contrato', icon: FileText },
  { id: 'contacto', label: 'Contactar gestor', icon: MessageSquare },
];

const FAQ_RESPONSES: Record<string, string> = {
  pagos: `Para pagar el alquiler tienes varias opciones:

1. **Domiciliación bancaria**: El pago se realiza automáticamente cada mes.
2. **Transferencia bancaria**: Puedes realizar una transferencia a la cuenta indicada en tu contrato.
3. **Pago con tarjeta**: Desde la sección "Pagos" puedes pagar con tarjeta de crédito/débito.

¿Necesitas ayuda con algo más?`,

  mantenimiento: `Para reportar un problema de mantenimiento:

1. Ve a la sección **"Mantenimiento"** en el menú
2. Haz clic en **"Nueva Solicitud"**
3. Describe el problema con el mayor detalle posible
4. Adjunta fotos si es posible
5. Indica la urgencia

Un técnico se pondrá en contacto contigo lo antes posible.

¿Quieres que te lleve a crear una solicitud?`,

  contrato: `Puedes consultar tu contrato de arrendamiento en la sección **"Mi Contrato"**.

Allí encontrarás:
- Datos del contrato (fechas, renta, fianza)
- Información del inmueble
- Opción de descargar el PDF
- Alertas sobre vencimiento

¿Hay algo específico de tu contrato que necesites consultar?`,

  contacto: `Puedes contactar con tu gestor de varias formas:

1. **Chat interno**: Ve a "Comunicación" para enviar un mensaje directo
2. **Email**: Recibirás respuesta en 24-48h laborables
3. **Teléfono**: Para urgencias, llama al número de emergencias

¿Prefieres que te ayude a enviar un mensaje ahora?`,
};

export default function PortalInquilinoChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente virtual de Inmova. 🏠\n\nEstoy aquí para ayudarte con cualquier duda sobre tu alquiler, pagos, mantenimiento o contrato.\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  const generateResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for FAQ matches
    if (lowerMessage.includes('pago') || lowerMessage.includes('pagar') || lowerMessage.includes('alquiler')) {
      return FAQ_RESPONSES.pagos;
    }
    if (lowerMessage.includes('mantenimiento') || lowerMessage.includes('avería') || lowerMessage.includes('problema') || lowerMessage.includes('arreglar')) {
      return FAQ_RESPONSES.mantenimiento;
    }
    if (lowerMessage.includes('contrato') || lowerMessage.includes('documento') || lowerMessage.includes('fianza')) {
      return FAQ_RESPONSES.contrato;
    }
    if (lowerMessage.includes('contactar') || lowerMessage.includes('gestor') || lowerMessage.includes('propietario') || lowerMessage.includes('hablar')) {
      return FAQ_RESPONSES.contacto;
    }
    if (lowerMessage.includes('hola') || lowerMessage.includes('buenos días') || lowerMessage.includes('buenas')) {
      return '¡Hola! 👋 ¿En qué puedo ayudarte hoy? Puedo ayudarte con información sobre pagos, mantenimiento, tu contrato o ponerte en contacto con tu gestor.';
    }
    if (lowerMessage.includes('gracias')) {
      return '¡De nada! 😊 Si tienes alguna otra duda, estaré aquí para ayudarte. ¡Que tengas un buen día!';
    }
    if (lowerMessage.includes('urgente') || lowerMessage.includes('emergencia')) {
      return `⚠️ **Para emergencias** (fugas de agua, problemas eléctricos graves, etc.):

1. Si hay peligro inmediato, llama al **112**
2. Contacta al teléfono de urgencias de tu gestor
3. Crea una solicitud de mantenimiento marcando prioridad "Urgente"

¿Necesitas que te ayude a reportar una emergencia?`;
    }

    // Default response
    return `Entiendo que tienes una consulta sobre "${userMessage}".

Puedo ayudarte con:
- 💳 Pagos y facturación
- 🔧 Solicitudes de mantenimiento
- 📄 Información de tu contrato
- 💬 Comunicación con tu gestor

¿Podrías darme más detalles o seleccionar una de las opciones rápidas?`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = await generateResponse(inputValue);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleQuickAction = (actionId: string) => {
    const action = QUICK_ACTIONS.find((a) => a.id === actionId);
    if (action) {
      setInputValue(action.label);
      inputRef.current?.focus();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '¡Hola de nuevo! 🏠\n\n¿En qué puedo ayudarte?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Asistente Virtual
          </h1>
          <p className="text-muted-foreground">
            Tu ayudante 24/7 para resolver dudas sobre tu alquiler
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Nueva conversación
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col h-[600px]">
          <CardHeader className="border-b pb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Asistente Inmova</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  En línea
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.role === 'user'
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-2 max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Escribe tu mensaje..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isTyping}
                  className="flex-1"
                />
                <Button type="submit" disabled={!inputValue.trim() || isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handleQuickAction(action.id)}
                >
                  <action.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-left text-sm">{action.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                ¿Necesitas más ayuda?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Si el asistente no puede resolver tu consulta, contacta directamente con tu gestor.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/portal-inquilino/comunicacion">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contactar Gestor
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
