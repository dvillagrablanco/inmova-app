'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'pricing' | 'technical' | 'legal';
}

const faqs: FAQItem[] = [
  // General
  {
    question: '¿Qué es Inmova y para quién es?',
    answer:
      'Inmova es una plataforma PropTech todo-en-uno para propietarios, gestores de propiedades e inversores inmobiliarios. Te ayuda a automatizar la gestión de alquileres, contratos, pagos y mantenimiento en un solo lugar.',
    category: 'general',
  },
  {
    question: '¿Cómo funciona el proceso de onboarding?',
    answer:
      'El onboarding toma menos de 3 minutos. Solo necesitas crear una cuenta, añadir tu primera propiedad y comenzar a invitar inquilinos. Nuestro asistente guiado te acompaña en cada paso.',
    category: 'general',
  },
  {
    question: '¿Necesito conocimientos técnicos para usar Inmova?',
    answer:
      'No. Inmova está diseñada para ser intuitiva. Si sabes usar WhatsApp y Gmail, puedes usar Inmova. Además, tenemos tutoriales en video y soporte en vivo.',
    category: 'general',
  },
  {
    question: '¿Puedo gestionar múltiples propiedades?',
    answer:
      'Sí. Nuestro plan Profesional permite gestionar hasta 200 propiedades, y el plan Enterprise es ilimitado. Perfecto para gestores y empresas de coliving.',
    category: 'general',
  },

  // Pricing
  {
    question: '¿Hay un plan gratuito?',
    answer:
      'Sí. El plan Básico es gratuito para siempre e incluye 1 propiedad y funcionalidades core. Perfecto para probar la plataforma antes de escalar.',
    category: 'pricing',
  },
  {
    question: '¿Puedo cancelar en cualquier momento?',
    answer:
      'Por supuesto. No hay permanencia. Puedes cancelar tu suscripción en cualquier momento desde tu panel de configuración. Si cancelas, mantienes acceso hasta el final del periodo pagado.',
    category: 'pricing',
  },
  {
    question: '¿Ofrecen descuentos para anuales?',
    answer:
      'Sí. Al pagar anualmente obtienes 2 meses gratis (ahorro del 17%). Los planes anuales también incluyen prioridad en soporte.',
    category: 'pricing',
  },
  {
    question: '¿Qué pasa si necesito más propiedades?',
    answer:
      'Puedes actualizar tu plan en cualquier momento. El cambio es inmediato y solo pagas la diferencia prorrateada.',
    category: 'pricing',
  },

  // Technical
  {
    question: '¿Mis datos están seguros?',
    answer:
      'Absolutamente. Usamos encriptación AES-256, servidores en Europa (GDPR compliant), backups diarios automáticos y autenticación de dos factores (2FA). Tus datos nunca se comparten con terceros.',
    category: 'technical',
  },
  {
    question: '¿Puedo exportar mis datos?',
    answer:
      'Sí. Puedes exportar todos tus datos (propiedades, inquilinos, contratos, pagos) en formato Excel o PDF en cualquier momento. No hay lock-in.',
    category: 'technical',
  },
  {
    question: '¿Se integra con otras herramientas?',
    answer:
      'Sí. Nos integramos con Stripe (pagos), Google Calendar (eventos), Gmail/Outlook (emails), y tenemos API REST para integraciones personalizadas.',
    category: 'technical',
  },
  {
    question: '¿Funciona en móvil?',
    answer:
      'Sí. Inmova es 100% responsive. Funciona perfectamente en móviles, tablets y ordenadores. Próximamente lanzaremos apps nativas para iOS y Android.',
    category: 'technical',
  },

  // Legal
  {
    question: '¿Los contratos son legalmente válidos?',
    answer:
      'Sí. Nuestros contratos están redactados por abogados especializados en derecho inmobiliario y cumplen con la Ley de Arrendamientos Urbanos (LAU) vigente en España.',
    category: 'legal',
  },
  {
    question: '¿Cumplen con GDPR y protección de datos?',
    answer:
      'Totalmente. Somos GDPR compliant. Tenemos Política de Privacidad, banner de cookies con consent mode, y todos los datos se almacenan en servidores europeos.',
    category: 'legal',
  },
  {
    question: '¿Qué soporte ofrecen?',
    answer:
      'Plan Básico: Email (48h). Plan Profesional: Email prioritario (24h). Plan Enterprise: Email, chat en vivo, y teléfono. Todos los planes incluyen base de conocimientos y tutoriales en video.',
    category: 'legal',
  },
];

const categories = [
  { id: 'general', label: 'General' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'technical', label: 'Técnico' },
  { id: 'legal', label: 'Legal' },
];

export function FAQSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFAQs = faqs.filter((faq) => faq.category === selectedCategory);

  return (
    <section id="faq" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <HelpCircle className="h-4 w-4" />
            <span>Preguntas Frecuentes</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            ¿Tienes dudas?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Aquí respondemos las preguntas más comunes. Si no encuentras tu respuesta,{' '}
            <a href="/landing/contacto" className="text-blue-600 hover:text-blue-700 underline">
              contáctanos
            </a>
            .
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                setOpenIndex(0); // Reset to first question
              }}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <Card
              key={index}
              className={`transition-all cursor-pointer hover:shadow-lg ${
                openIndex === index ? 'shadow-md border-blue-200' : ''
              }`}
            >
              <CardContent className="p-6">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full text-left flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    {openIndex === index && (
                      <p className="text-gray-600 leading-relaxed mt-3">{faq.answer}</p>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">¿No encuentras tu respuesta?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
              <a href="/landing/contacto">Contactar Soporte</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/landing/ayuda">Ver Centro de Ayuda</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
