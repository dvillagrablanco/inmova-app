'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Mail, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'options' | 'contact-form';
  options?: Array<{ label: string; value: string }>;
}

const WHATSAPP_NUMBER = '+34611234567'; // Número de INMOVA
const WHATSAPP_MESSAGE = 'Hola, me gustaría obtener más información sobre INMOVA';

// Respuestas automáticas con información correcta
const FAQ_RESPONSES: Record<string, { answer: string; followUp?: Array<{ label: string; value: string }> }> = {
  precio: {
    answer: 'INMOVA ofrece varios planes:\n\n• Starter (€89/mes): 30 módulos, hasta 25 propiedades\n• Profesional (€199/mes): 60 módulos, hasta 200 propiedades\n• Empresarial (€499/mes): 88 módulos, hasta 1000 propiedades\n• Enterprise+ (€1,999+/mes): Personalizado\n\n30 días de prueba gratis en todos los planes.',
    followUp: [
      { label: 'Probar gratis 30 días', value: 'trial' },
      { label: 'Ver comparativa de planes', value: 'planes' },
      { label: 'Hablar con ventas', value: 'contact' }
    ]
  },
  funcionalidades: {
    answer: 'INMOVA incluye:\n\n• Gestión de propiedades completa\n• Alquiler tradicional y por habitaciones\n• Short-Term Rental con Channel Manager\n• Mantenimiento con IA predictiva\n• Contabilidad y pagos Stripe\n• Portales web para inquilinos y propietarios\n• Blockchain, ESG, IoT y más\n\n¿Qué te interesa más?',
    followUp: [
      { label: 'Alquiler por habitaciones', value: 'rooms' },
      { label: 'STR/Channel Manager', value: 'str' },
      { label: 'Ver demo', value: 'demo' }
    ]
  },
  demo: {
    answer: 'Puedes ver INMOVA en acción:\n\n🎥 Video demo disponible en la página principal\n💻 Regístrate para acceder a la plataforma completa\n👤 Contacta con nosotros para una demo personalizada\n\n¿Qué prefieres?',
    followUp: [
      { label: 'Registrarme ahora', value: 'trial' },
      { label: 'Contactar con ventas', value: 'contact' }
    ]
  },
  comparativa: {
    answer: 'INMOVA vs Competencia:\n\n✅ Más módulos (88 vs 10-25)\n✅ Multi-vertical (7 modelos de negocio)\n✅ Mejor precio/valor del mercado\n✅ Tecnología más avanzada (IA, Blockchain, IoT)\n\nConsulta la tabla comparativa completa en nuestra página.'
  },
  habitaciones: {
    answer: 'El módulo de Alquiler por Habitaciones incluye:\n\n🏠 Gestión de múltiples inquilinos por propiedad\n💰 Prorrateo automático de servicios (luz, agua, gas)\n📅 Calendario de limpieza y tareas\n📊 Reportes individuales\n\nIdeal para coliving y residencias compartidas.',
    followUp: [
      { label: 'Probar gratis', value: 'trial' },
      { label: 'Más información', value: 'contact' }
    ]
  },
  trial: {
    answer: '¡Perfecto! Regístrate para probar INMOVA gratis por 30 días:\n\n✅ Sin tarjeta de crédito\n✅ Acceso completo\n✅ Soporte incluido\n✅ Cancela cuando quieras\n\nHaz clic en "Comenzar Gratis" en el menú superior.'
  },
  contacto: {
    answer: 'Puedes contactarnos:\n\n📧 A través del formulario de contacto en nuestra web\n💬 Por WhatsApp (botón verde flotante)\n📞 O déjanos tus datos y te llamamos\n\n¿Prefieres que te contactemos?',
    followUp: [
      { label: 'Sí, contactadme', value: 'contact-form' },
      { label: 'WhatsApp', value: 'whatsapp' }
    ]
  }
};

export function LandingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          '¡Hola! 👋 Soy el asistente de INMOVA.\n\n¿En qué puedo ayudarte?',
          'options',
          [
            { label: '💰 Precios', value: 'precio' },
            { label: '✨ Funcionalidades', value: 'funcionalidades' },
            { label: '🏠 Alquiler habitaciones', value: 'habitaciones' },
            { label: '📞 Contacto', value: 'contacto' }
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
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addBotMessage = (
    text: string,
    type: 'text' | 'options' | 'contact-form' = 'text',
    options?: Array<{ label: string; value: string }>
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      type,
      options
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    addUserMessage(userMessage);
    setInputValue('');
    setIsTyping(true);

    // Simular tiempo de respuesta
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Buscar respuesta relevante
    const lowerMessage = userMessage.toLowerCase();
    let responded = false;

    // Detectar intenciones clave
    const intentions = {
      precio: ['precio', 'coste', 'cost', 'cuánto', 'cuanto', 'tarifa', 'plan'],
      funcionalidades: ['módulo', 'modulo', 'función', 'funcion', 'característica', 'caracteristica', 'qué hace', 'que hace'],
      demo: ['demo', 'demostración', 'demostracion', 'prueba', 'ver', 'mostrar'],
      comparativa: ['comparar', 'competencia', 'competidor', 'alternativa', 'vs', 'diferencia'],
      habitaciones: ['habitación', 'habitacion', 'roommate', 'coliving', 'compartir'],
      trial: ['gratis', 'free', 'trial', 'prueba gratuita'],
      contacto: ['contacto', 'llamar', 'email', 'teléfono', 'telefono', 'hablar']
    };

    for (const [key, keywords] of Object.entries(intentions)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        const response = FAQ_RESPONSES[key];
        if (response) {
          addBotMessage(response.answer, response.followUp ? 'options' : 'text', response.followUp);
          responded = true;
          break;
        }
      }
    }

    if (!responded) {
      addBotMessage(
        'Entiendo. ¿Te gustaría que un experto de INMOVA te contacte para resolver tus dudas específicas?',
        'options',
        [
          { label: 'Sí, quiero que me contacten', value: 'contact' },
          { label: 'Ver opciones principales', value: 'menu' },
          { label: 'Hablar por WhatsApp', value: 'whatsapp' }
        ]
      );
    }

    setIsTyping(false);
  };

  const handleOptionClick = async (value: string) => {
    addUserMessage(`Seleccioné: ${value}`);
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    switch (value) {
      case 'trial':
        addBotMessage(
          '¡Perfecto! Para probar INMOVA gratis:\n\n1. Haz clic en "Comenzar Gratis" en el menú superior\n2. Completa el registro (sin tarjeta)\n3. Accede inmediatamente a todos los módulos\n\n¿Necesitas ayuda con el registro?',
          'options',
          [
            { label: 'Sí, ayúdame', value: 'contact-form' },
            { label: 'No, ya puedo', value: 'menu' }
          ]
        );
        break;
      case 'contact':
      case 'contact-form':
        setShowContactForm(true);
        addBotMessage(
          'Déjanos tus datos y te contactaremos pronto:',
          'contact-form'
        );
        break;
      case 'whatsapp':
        addBotMessage(
          '¡Perfecto! Haz clic en el botón verde de WhatsApp en la esquina inferior derecha 💬'
        );
        break;
      case 'menu':
        addBotMessage(
          '¿En qué puedo ayudarte?',
          'options',
          [
            { label: '💰 Precios', value: 'precio' },
            { label: '✨ Funcionalidades', value: 'funcionalidades' },
            { label: '🏠 Alquiler habitaciones', value: 'habitaciones' },
            { label: '📞 Contacto', value: 'contacto' }
          ]
        );
        break;
      case 'planes':
        addBotMessage(
          'Consulta la comparativa detallada de planes en la sección de Precios de esta página.\n\nDesplázate hacia abajo para verla completa.'
        );
        break;
      default:
        // Si es una palabra clave de FAQ, responder
        const response = FAQ_RESPONSES[value];
        if (response) {
          addBotMessage(response.answer, response.followUp ? 'options' : 'text', response.followUp);
        }
    }

    setIsTyping(false);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    if (!contactForm.name || !contactForm.email) {
      toast.error('Por favor completa al menos tu nombre y email');
      return;
    }

    // Capturar lead en el CRM
    try {
      const conversacionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preguntasHechas = messages
        .filter(m => m.sender === 'user')
        .map(m => m.text);

      await fetch('/api/landing/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: contactForm.name,
          email: contactForm.email,
          telefono: contactForm.phone,
          mensajeInicial: contactForm.message,
          fuente: 'chatbot',
          conversacionId,
          preguntasFrecuentes: preguntasHechas,
          paginaOrigen: window.location.href,
          urgencia: 'media',
        }),
      });

      toast.success('¡Gracias! Te contactaremos pronto.');
    } catch (error) {
      logger.error('Error capturing lead:', error);
      toast.success('¡Gracias! Te contactaremos pronto.');
    }

    setShowContactForm(false);
    addBotMessage(
      `¡Gracias ${contactForm.name}! 🎉\n\nHemos recibido tu información. Te contactaremos en menos de 24 horas.\n\n¿Necesitas algo más?`,
      'options',
      [
        { label: 'Ver precios', value: 'precio' },
        { label: 'WhatsApp ahora', value: 'whatsapp' },
        { label: 'No, gracias', value: 'menu' }
      ]
    );
    
    // Reset form
    setContactForm({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* WhatsApp Floating Button - VISIBLE en esquina inferior derecha */}
      <button
        onClick={openWhatsApp}
        className="fixed bottom-6 right-6 z-[9999] p-4 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-200 group animate-bounce"
        aria-label="Contactar por WhatsApp"
        style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)' }}
      >
        {/* Icono de WhatsApp SVG */}
        <svg 
          viewBox="0 0 24 24" 
          width="28" 
          height="28" 
          fill="currentColor"
          className="group-hover:scale-110 transition-transform"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          !
        </span>
        {/* Tooltip */}
        <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          ¡Chatea con nosotros!
        </span>
      </button>

      {/* Chatbot Widget Button - Junto al WhatsApp */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-6 z-[9998] p-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-200 ${
          isOpen ? 'rotate-90' : ''
        }`}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-[60] w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] shadow-2xl border-2 border-indigo-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Bot size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold">Asistente INMOVA</h3>
                <p className="text-xs text-indigo-100">Siempre disponible</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-slate-50 to-indigo-50">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                      : 'bg-white border-2 border-indigo-200 text-indigo-600'
                  }`}
                >
                  {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div
                  className={`flex flex-col gap-2 max-w-[75%] ${
                    message.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl p-3 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                        : 'bg-white border border-indigo-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                  {message.type === 'options' && message.options && (
                    <div className="flex flex-col gap-2 w-full">
                      {message.options.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleOptionClick(option.value)}
                          className="text-left px-4 py-2 bg-white border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg text-sm transition-all"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {message.type === 'contact-form' && showContactForm && (
                    <form onSubmit={handleContactSubmit} className="w-full space-y-3 bg-white p-4 rounded-lg border-2 border-indigo-200">
                      <Input
                        placeholder="Tu nombre*"
                        value={contactForm.name}
                        onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                        className="border-indigo-200"
                      />
                      <Input
                        type="email"
                        placeholder="Tu email*"
                        value={contactForm.email}
                        onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                        className="border-indigo-200"
                      />
                      <Input
                        type="tel"
                        placeholder="Tu teléfono (opcional)"
                        value={contactForm.phone}
                        onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="border-indigo-200"
                      />
                      <Textarea
                        placeholder="Tu mensaje (opcional)"
                        value={contactForm.message}
                        onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                        rows={3}
                        className="border-indigo-200"
                      />
                      <Button type="submit" className="w-full gradient-primary shadow-primary">
                        Enviar
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center">
                  <Bot size={16} className="text-indigo-600" />
                </div>
                <div className="bg-white border border-indigo-200 rounded-2xl p-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                className="flex-1 border-indigo-200"
              />
              <Button
                onClick={handleSend}
                className="gradient-primary shadow-primary"
                disabled={!inputValue.trim()}
              >
                <Send size={20} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Respuesta automática • Equipo disponible 24/7
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
