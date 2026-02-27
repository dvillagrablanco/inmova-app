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
  {
    question: '¿Qué es Inmova y para quién es?',
    answer:
      'Inmova es una plataforma PropTech multi-vertical que centraliza toda la gestión inmobiliaria en un solo lugar. Está diseñada para propietarios particulares, gestores de propiedades, operadores de coliving, administradores de fincas, inversores y constructores. Cubre 7 modelos de negocio: alquiler residencial, media estancia, vacacional (STR), coliving, house flipping, comunidades de propietarios y construcción B2B.',
    category: 'general',
  },
  {
    question: '¿Cuánto tiempo lleva configurar mi cuenta?',
    answer:
      'El setup inicial toma menos de 3 minutos. Creas tu cuenta, añades tu primera propiedad con nuestro asistente guiado y ya puedes empezar a gestionar. Si tienes datos en Excel u otra plataforma, puedes importarlos con un clic o nuestro equipo los migra por ti sin coste adicional.',
    category: 'general',
  },
  {
    question: '¿Necesito conocimientos técnicos?',
    answer:
      'No. Inmova está diseñada para ser intuitiva. Si sabes usar un navegador web, puedes usar Inmova. Además, incluimos tutoriales en vídeo, centro de ayuda completo y soporte en vivo para resolver cualquier duda.',
    category: 'general',
  },
  {
    question: '¿Cuántas propiedades puedo gestionar?',
    answer:
      'Depende del plan: Starter hasta 5, Professional hasta 25, Business hasta 100, y Enterprise ilimitadas. Puedes cambiar de plan en cualquier momento y el ajuste de precio se prorratea automáticamente.',
    category: 'general',
  },

  {
    question: '¿Hay periodo de prueba gratuito?',
    answer:
      'Sí. Todos los planes incluyen 30 días de prueba gratis sin necesidad de tarjeta de crédito. Puedes probar todas las funcionalidades de tu plan elegido. Si no te convence, simplemente no activas la suscripción.',
    category: 'pricing',
  },
  {
    question: '¿Puedo cancelar en cualquier momento?',
    answer:
      'Sí, sin permanencia ni penalización. Cancelas desde tu panel de configuración en un clic. Mantienes acceso hasta el final del periodo pagado y puedes exportar todos tus datos en cualquier momento.',
    category: 'pricing',
  },
  {
    question: '¿Ofrecen descuento por pago anual?',
    answer:
      'Sí. Al pagar anualmente obtienes 2 meses gratis (ahorro del 17%). Los planes anuales también incluyen prioridad en soporte técnico.',
    category: 'pricing',
  },
  {
    question: '¿Qué son los add-ons y cómo funcionan?',
    answer:
      'Los add-ons son extensiones opcionales que puedes añadir a cualquier plan: packs de firmas digitales, almacenamiento extra, tokens de IA, SMS, white-label o acceso API. Se contratan mes a mes y los activas o desactivas cuando quieras.',
    category: 'pricing',
  },

  {
    question: '¿Mis datos están seguros?',
    answer:
      'Sí. Usamos encriptación AES-256, servidores en la Unión Europea (GDPR compliant), backups diarios automáticos y autenticación de dos factores (2FA). Tus datos nunca se comparten con terceros y puedes exportarlos en cualquier momento.',
    category: 'technical',
  },
  {
    question: '¿Puedo exportar mis datos si cambio de plataforma?',
    answer:
      'Sí. Todos tus datos (propiedades, inquilinos, contratos, pagos, documentos) se exportan en formato Excel o PDF en cualquier momento. No hay lock-in de datos.',
    category: 'technical',
  },
  {
    question: '¿Con qué herramientas se integra?',
    answer:
      'Inmova se integra nativamente con Stripe (cobros automáticos), Signaturit (firma digital), Google Calendar y Outlook (calendario), portales inmobiliarios (Idealista, Fotocasa), plataformas vacacionales (Airbnb, Booking) y contabilidad. Además, los planes Business y Enterprise incluyen API REST para integraciones personalizadas.',
    category: 'technical',
  },
  {
    question: '¿Funciona en el móvil?',
    answer:
      'Sí. Inmova es 100% responsive y funciona perfectamente en móviles, tablets y ordenadores. Puedes gestionar todas tus propiedades desde cualquier dispositivo con navegador web.',
    category: 'technical',
  },

  {
    question: '¿Los contratos generados son legalmente válidos?',
    answer:
      'Sí. Las plantillas de contrato están redactadas por abogados especializados en derecho inmobiliario y cumplen con la Ley de Arrendamientos Urbanos (LAU) vigente en España. Además, integran firma digital con validez legal plena.',
    category: 'legal',
  },
  {
    question: '¿Cumplen con GDPR y protección de datos?',
    answer:
      'Totalmente. Inmova es GDPR compliant. Contamos con Política de Privacidad detallada, banner de cookies con consent mode, DPO designado y todos los datos se almacenan exclusivamente en servidores europeos.',
    category: 'legal',
  },
  {
    question: '¿Qué tipo de soporte incluye cada plan?',
    answer:
      'Starter incluye soporte por email y acceso a tutoriales. Professional añade chat prioritario. Business incluye gestor de cuenta dedicado y soporte prioritario. Enterprise ofrece soporte 24/7, account manager dedicado y formación personalizada para tu equipo.',
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
            <a href="/landing/contacto" className="text-blue-700 hover:text-blue-800 font-semibold underline">
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
            <Button size="lg" asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold">
              <a href="/landing/contacto">Contactar Soporte</a>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-2 border-gray-400 text-gray-900 hover:bg-gray-100 hover:border-gray-500 font-semibold">
              <a href="/landing/ayuda">Ver Centro de Ayuda</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
