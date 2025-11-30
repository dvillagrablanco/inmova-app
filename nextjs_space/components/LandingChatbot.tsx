'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Phone, Mail, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'options' | 'contact-form';
  options?: Array<{ label: string; value: string }>;
}

const WHATSAPP_NUMBER = '+34600000000'; // Reemplazar con el número real de INMOVA
const WHATSAPP_MESSAGE = 'Hola, me gustaría obtener más información sobre INMOVA';

// Respuestas automáticas inteligentes
const FAQ_RESPONSES: Record<string, { answer: string; followUp?: Array<{ label: string; value: string }> }> = {
  precio: {
    answer: '¡Excelente pregunta! INMOVA ofrece un plan único por solo €149/mes que incluye:\n\n• 88 módulos profesionales\n• Actualizaciones automáticas\n• Soporte técnico incluido\n• Sin costes ocultos\n\n¿Te gustaría probar INMOVA gratis por 30 días?',
    followUp: [
      { label: 'Sí, quiero probar gratis', value: 'trial' },
      { label: 'Ver demo en vivo', value: 'demo' },
      { label: 'Hablar con ventas', value: 'contact' }
    ]
  },
  funcionalidades: {
    answer: 'INMOVA es una plataforma completa con 88 módulos que cubren:\n\n✨ Gestión de propiedades\n✨ Alquiler tradicional y por habitaciones\n✨ Short-Term Rental (STR)\n✨ Mantenimiento predictivo con IA\n✨ Contabilidad automática\n✨ Portal de inquilinos\n✨ Firma digital\n\n¿Qué módulo te interesa más?',
    followUp: [
      { label: 'Alquiler por habitaciones', value: 'rooms' },
      { label: 'STR/Channel Manager', value: 'str' },
      { label: 'IA y automatización', value: 'ai' },
      { label: 'Ver todos los módulos', value: 'all-modules' }
    ]
  },
  demo: {
    answer: '¡Perfecto! Te puedo ofrecer varias opciones:\n\n🎥 Ver video demo de 90 segundos\n💻 Acceder a demo interactiva en línea\n👤 Agendar demo personalizada con un experto\n\n¿Cuál prefieres?',
    followUp: [
      { label: 'Video demo', value: 'video' },
      { label: 'Demo interactiva', value: 'interactive' },
      { label: 'Agendar con experto', value: 'schedule' }
    ]
  },
  comparativa: {
    answer: 'INMOVA vs Competidores:\n\n✅ INMOVA: €149/mes, 88 módulos, todo incluido\n❌ Homming: €3,500/año, funciones limitadas\n❌ Rentger: €2,400/año, sin STR\n❌ Buildium: $3,600/año, solo para USA\n\n📊 Con INMOVA ahorras hasta 85% vs competidores\n\n¿Quieres ver una comparativa detallada?'
  },
  habitaciones: {
    answer: '¡El módulo de Alquiler por Habitaciones es único!\n\n🏠 Gestiona múltiples inquilinos por propiedad\n💰 Prorrateo automático de gastos comunes\n📅 Calendario de limpieza rotativo\n📋 Normas de convivencia personalizables\n📊 Reportes individuales por habitación\n\n¿Te gustaría ver cómo funciona?',
    followUp: [
      { label: 'Ver demo del módulo', value: 'rooms-demo' },
      { label: 'Casos de éxito', value: 'cases' },
      { label: 'Hablar con experto', value: 'contact' }
    ]
  },
  trial: {
    answer: '🎉 ¡Genial! Puedes empezar tu prueba gratuita de 30 días ahora mismo.\n\n✨ Sin tarjeta de crédito\n✨ Acceso completo a todos los módulos\n✨ Soporte técnico incluido\n✨ Cancelación en cualquier momento\n\nDéjame tus datos y te enviamos el acceso inmediatamente:'
  },
  contacto: {
    answer: '📧 Email: sales@inmova.com\n📞 Teléfono: +34 900 123 456\n🌐 Web: www.inmova.com\n\n¿Prefieres que te contactemos nosotros?'
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
          '¡Hola! 👋 Soy el asistente virtual de INMOVA.\n\n¿En qué puedo ayudarte hoy?',
          'options',
          [
            { label: '💰 Precio y planes', value: 'precio' },
            { label: '✨ Funcionalidades', value: 'funcionalidades' },
            { label: '🎥 Ver demo', value: 'demo' },
            { label: '🏠 Alquiler por habitaciones', value: 'habitaciones' },
            { label: '📊 Comparativa', value: 'comparativa' },
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
        setShowContactForm(true);
        addBotMessage(
          'Perfecto, completa este formulario y te enviaremos el acceso a tu prueba gratuita de 30 días:',
          'contact-form'
        );
        break;
      case 'contact':
        setShowContactForm(true);
        addBotMessage(
          'Completa este formulario y un experto de INMOVA te contactará en menos de 24 horas:',
          'contact-form'
        );
        break;
      case 'whatsapp':
        addBotMessage(
          '¡Perfecto! Puedes contactarnos directamente por WhatsApp haciendo clic en el botón verde flotante en la esquina inferior derecha 💬\n\nO haz clic aquí: ' + WHATSAPP_NUMBER
        );
        break;
      case 'menu':
        addBotMessage(
          '¿En qué puedo ayudarte?',
          'options',
          [
            { label: '💰 Precio y planes', value: 'precio' },
            { label: '✨ Funcionalidades', value: 'funcionalidades' },
            { label: '🎥 Ver demo', value: 'demo' },
            { label: '📊 Comparativa', value: 'comparativa' }
          ]
        );
        break;
      case 'video':
        addBotMessage(
          '🎥 Puedes ver nuestro video demo aquí:\n\nhttps://www.youtube.com/inmova-demo\n\n¿Te gustaría también acceder a la demo interactiva?',
          'options',
          [
            { label: 'Sí, demo interactiva', value: 'interactive' },
            { label: 'Agendar demo personal', value: 'schedule' }
          ]
        );
        break;
      case 'interactive':
        addBotMessage(
          '¡Genial! Puedes acceder a la demo interactiva aquí:\n\n👉 www.inmova.com/demo\n\n¿Necesitas ayuda con algo más?'
        );
        break;
      case 'schedule':
        setShowContactForm(true);
        addBotMessage(
          'Completa tus datos y agendaremos una demo personalizada contigo:',
          'contact-form'
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

    toast.success('¡Gracias! Te contactaremos pronto.');
    setShowContactForm(false);
    addBotMessage(
      `¡Gracias ${contactForm.name}! 🎉\n\nHemos recibido tu información y nuestro equipo te contactará en las próximas 24 horas.\n\nMientras tanto, puedes:\n\n✅ Visitar nuestra web: www.inmova.com\n✅ Contactarnos por WhatsApp\n✅ Ver nuestro blog con casos de éxito`
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
      {/* WhatsApp Floating Button */}
      <button
        onClick={openWhatsApp}
        className="fixed bottom-6 right-6 z-[60] p-4 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-200 group"
        aria-label="Contactar por WhatsApp"
      >
        <Phone size={24} className="group-hover:animate-pulse" />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          1
        </span>
      </button>

      {/* Chatbot Widget Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-24 z-[60] p-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-200 ${
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
