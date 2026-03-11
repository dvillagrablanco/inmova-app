// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';

// Declaración de tipos para Crisp
declare global {
  interface Window {
    $crisp?: any[];
    CRISP_WEBSITE_ID?: string;
  }
}
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'options' | 'contact-form';
  options?: Array<{ label: string; value: string }>;
}

// Respuestas automáticas con información correcta
const FAQ_RESPONSES: Record<
  string,
  { answer: string; followUp?: Array<{ label: string; value: string }> }
> = {
  precio: {
    answer:
      'INMOVA ofrece 4 planes base + addons premium:\n\n📋 PLANES BASE:\n• Starter (€89/mes): 25 propiedades, gestión completa, onboarding IA\n• Profesional (€199/mes): 200 prop., cobro masivo, facturación auto, IA\n• Empresarial (€499/mes): 1000 prop., 88 módulos, 7 verticales, API\n• Enterprise+ (€998/mes): Todo ilimitado + Pack Completo addons\n\n🚀 ADDONS PREMIUM:\n• IA Inmobiliaria (€149/mes): Predicción, valoración, anomalías\n• Family Office 360° (€249/mes): Patrimonio, PE, P&L\n• Automatización Pro (€99/mes): SEPA, Zucchetti, escalado\n• Analytics Avanzado (€79/mes): Yield, benchmark, fiscal\n• Operaciones Pro (€69/mes): Kanban, inspecciones\n• 🚀 Pack Completo (€499/mes): Los 5 — Ahorra 23%\n\n30 días gratis. Sin permanencia.',
    followUp: [
      { label: 'Probar gratis 30 días', value: 'trial' },
      { label: 'Ver comparativa de planes', value: 'planes' },
      { label: 'Hablar con ventas', value: 'contact' },
    ],
  },
  funcionalidades: {
    answer:
      'INMOVA es la plataforma más completa del mercado:\n\n🏠 Gestión de propiedades (alquiler, STR, coliving)\n🤖 IA predictiva: valoración, morosidad, renta óptima\n💼 Family Office: dashboard 360°, P&L por sociedad, PE\n⚡ Automatización: facturación, cobro 1-click, IPC masivo\n📊 Analytics: morosidad, yield, benchmark, previsión 12m\n🔧 Operaciones: Kanban, inspecciones, proveedores\n📋 Workflows: alta inquilino, renovación, salida\n🔗 Integraciones: Zucchetti, SEPA, conciliación bancaria\n\n¿Qué módulo te interesa?',
    followUp: [
      { label: '🤖 IA y Automatización', value: 'ia' },
      { label: '💼 Family Office', value: 'family-office' },
      { label: '📊 Analytics y Reportes', value: 'analytics' },
      { label: 'Ver demo', value: 'demo' },
    ],
  },
  ia: {
    answer:
      'Nuestra IA integrada incluye:\n\n🎯 Valoración automática de inmuebles\n📈 Predicción de morosidad (anticipa impagos)\n💰 Sugerencia de renta óptima por zona\n🔍 Detección de anomalías financieras\n📄 Clasificación automática de documentos\n💡 Alertas de oportunidad (renta bajo mercado)\n🤖 Asistente IA conversacional con acciones directas\n\nTodo integrado sin coste adicional en planes premium.',
    followUp: [
      { label: 'Probar gratis', value: 'trial' },
      { label: 'Ver precios', value: 'precio' },
    ],
  },
  'family-office': {
    answer:
      'El módulo Family Office es ideal para holdings:\n\n📊 Dashboard Patrimonial 360° consolidado\n🏢 P&L comparativo por sociedad del grupo\n💎 Portfolio Private Equity (TVPI, DPI, IRR)\n📋 Informes trimestrales PDF automáticos\n🔄 Sync contable con Zucchetti/Altai\n📈 Benchmark vs mercado por zona\n👁️ Portal del propietario read-only para socios\n\nDiseñado para grupos inmobiliarios con múltiples sociedades.',
    followUp: [
      { label: 'Solicitar demo', value: 'demo' },
      { label: 'Contactar ventas', value: 'contact' },
    ],
  },
  analytics: {
    answer:
      'Analytics y reportes avanzados:\n\n📊 Dashboard ejecutivo con KPIs consolidados\n📉 Informe de morosidad con días de retraso\n🏠 Yield tracker por propiedad\n📈 Benchmark de mercado por zona\n💹 Previsión de tesorería a 12 meses\n📋 Estimación fiscal trimestral (303, 115, 111)\n📊 Scoring de inquilinos (0-100)\n📥 Export CSV de cualquier tabla\n\nDatos en tiempo real, no aproximaciones.',
    followUp: [
      { label: 'Probar gratis', value: 'trial' },
      { label: 'Ver precios', value: 'precio' },
    ],
  },
  demo: {
    answer:
      'Puedes ver INMOVA en acción:\n\n🎥 Video demo disponible en la página principal\n💻 Regístrate para acceder a la plataforma completa\n👤 Contacta con nosotros para una demo personalizada\n\n¿Qué prefieres?',
    followUp: [
      { label: 'Registrarme ahora', value: 'trial' },
      { label: 'Contactar con ventas', value: 'contact' },
    ],
  },
  comparativa: {
    answer:
      'Lo que hace única a INMOVA:\n\n✅ 88+ módulos (el más completo del mercado)\n✅ 7 verticales de negocio en una plataforma\n✅ IA predictiva integrada (valoración, morosidad, renta)\n✅ Family Office 360° para holdings inmobiliarios\n✅ Automatización total de cobros y facturación\n✅ Workflows completos: alta→gestión→salida inquilino\n✅ Conciliación bancaria con auto-matching\n✅ Integración contable directa con Zucchetti/Altai\n\nNinguna otra plataforma ofrece todo esto.',
    followUp: [
      { label: 'Ver funcionalidades', value: 'funcionalidades' },
      { label: 'Probar gratis', value: 'trial' },
    ],
  },
  habitaciones: {
    answer:
      'El módulo de Alquiler por Habitaciones incluye:\n\n🏠 Gestión de múltiples inquilinos por propiedad\n💰 Prorrateo automático de servicios (luz, agua, gas)\n📅 Calendario de limpieza y tareas\n📊 Reportes individuales\n\nIdeal para coliving y residencias compartidas.',
    followUp: [
      { label: 'Probar gratis', value: 'trial' },
      { label: 'Más información', value: 'contact' },
    ],
  },
  trial: {
    answer:
      '¡Perfecto! Regístrate para probar INMOVA gratis por 30 días:\n\n✅ Sin tarjeta de crédito\n✅ Acceso completo\n✅ Soporte incluido\n✅ Cancela cuando quieras\n\nHaz clic en "Comenzar Gratis" en el menú superior.',
  },
  contacto: {
    answer:
      'Puedes contactarnos:\n\n📧 A través del formulario de contacto en nuestra web\n💬 Directamente desde este chat\n📞 O déjanos tus datos y te llamamos\n\n¿Prefieres que te contactemos?',
    followUp: [
      { label: 'Sí, contactadme', value: 'contact-form' },
      { label: 'Ver opciones principales', value: 'menu' },
    ],
  },
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
    message: '',
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
            { label: '📞 Contacto', value: 'contacto' },
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
    setMessages((prev) => [...prev, newMessage]);
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
      options,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    addUserMessage(userMessage);
    setInputValue('');
    setIsTyping(true);

    try {
      // Call AI-powered commercial chatbot
      const history = messages
        .filter((m) => m.sender !== 'system')
        .slice(-8)
        .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

      const res = await fetch('/api/landing/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history }),
      });

      if (res.ok) {
        const data = await res.json();
        addBotMessage(data.response || 'Disculpa, ¿puedes reformular tu pregunta?');
      } else {
        addBotMessage(getLocalFallback(userMessage));
      }
    } catch {
      addBotMessage(getLocalFallback(userMessage));
    }

    setIsTyping(false);
  };

  // Fallback local cuando la API no está disponible
  const getLocalFallback = (msg: string): string => {
    const m = msg.toLowerCase();
    const keywords: Record<string, string[]> = {
      precio: ['precio', 'coste', 'cuánto', 'cuanto', 'plan', 'tarifa'],
      funcionalidades: ['módulo', 'función', 'característica', 'qué hace'],
      ia: ['inteligencia artificial', 'ia', 'valoración', 'predicción', 'morosidad'],
      'family-office': ['family office', 'holding', 'patrimonio', 'sociedad'],
      analytics: ['analytics', 'reporte', 'kpi', 'dashboard', 'métricas'],
      demo: ['demo', 'probar', 'prueba'],
      comparativa: ['comparar', 'diferencia', 'mejor', 'único'],
      contacto: ['contacto', 'llamar', 'email', 'teléfono'],
      trial: ['gratis', 'free', 'trial'],
    };
    for (const [key, kws] of Object.entries(keywords)) {
      if (kws.some((kw) => m.includes(kw))) {
        const faq = FAQ_RESPONSES[key];
        if (faq) return faq.answer;
      }
    }
    return '¡Gracias por tu interés! 😊 INMOVA es la plataforma PropTech más completa de España con 88+ módulos e IA integrada. ¿Te gustaría probarlo gratis 30 días? Regístrate en inmovaapp.com';
  };

  const handleOptionClick = async (value: string) => {
    addUserMessage(`Seleccioné: ${value}`);
    setIsTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    switch (value) {
      case 'trial':
        addBotMessage(
          '¡Perfecto! Para probar INMOVA gratis:\n\n1. Haz clic en "Comenzar Gratis" en el menú superior\n2. Completa el registro (sin tarjeta)\n3. Accede inmediatamente a todos los módulos\n\n¿Necesitas ayuda con el registro?',
          'options',
          [
            { label: 'Sí, ayúdame', value: 'contact-form' },
            { label: 'No, ya puedo', value: 'menu' },
          ]
        );
        break;
      case 'contact':
      case 'contact-form':
        setShowContactForm(true);
        addBotMessage('Déjanos tus datos y te contactaremos pronto:', 'contact-form');
        break;
      case 'menu':
        addBotMessage('¿En qué puedo ayudarte?', 'options', [
          { label: '💰 Precios', value: 'precio' },
          { label: '✨ Funcionalidades', value: 'funcionalidades' },
          { label: '🏠 Alquiler habitaciones', value: 'habitaciones' },
          { label: '📞 Contacto', value: 'contacto' },
        ]);
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
      const preguntasHechas = messages.filter((m) => m.sender === 'user').map((m) => m.text);

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
        { label: 'No, gracias', value: 'menu' },
      ]
    );

    // Reset form
    setContactForm({
      name: '',
      email: '',
      phone: '',
      message: '',
    });
  };

  // Ocultar Crisp cuando este componente está activo
  useEffect(() => {
    // Ocultar Crisp Chat en la landing (usamos nuestro chatbot personalizado)
    const hideCrisp = () => {
      if (typeof window !== 'undefined' && window.$crisp) {
        window.$crisp.push(['do', 'chat:hide']);
      }
    };

    // Intentar ocultar Crisp cuando el script se cargue
    hideCrisp();
    const interval = setInterval(hideCrisp, 1000);

    // Limpiar después de 5 segundos
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      // Mostrar Crisp de nuevo al desmontar (si navega a otra página)
      if (typeof window !== 'undefined' && window.$crisp) {
        window.$crisp.push(['do', 'chat:show']);
      }
    };
  }, []);

  return (
    <>
      {/* Chatbot Widget Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[9999] p-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-full shadow-xl hover:scale-110 transition-all duration-200 ${
          isOpen ? 'rotate-90' : ''
        }`}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
        style={{ boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)' }}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <Card className="fixed bottom-20 right-6 z-[9997] w-[360px] max-w-[calc(100vw-3rem)] h-[480px] max-h-[calc(100vh-10rem)] shadow-2xl border-2 border-indigo-200 overflow-hidden flex flex-col">
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
            {messages.map((message) => (
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
                      {message.options.map((option) => (
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
                    <form
                      onSubmit={handleContactSubmit}
                      className="w-full space-y-3 bg-white p-4 rounded-lg border-2 border-indigo-200"
                    >
                      <Input
                        placeholder="Tu nombre*"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                        className="border-indigo-200"
                      />
                      <Input
                        type="email"
                        placeholder="Tu email*"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                        className="border-indigo-200"
                      />
                      <Input
                        type="tel"
                        placeholder="Tu teléfono (opcional)"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="border-indigo-200"
                      />
                      <Textarea
                        placeholder="Tu mensaje (opcional)"
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, message: e.target.value })
                        }
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
                    <span
                      className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
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
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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
