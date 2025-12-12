'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const faqs = [
  {
    question: '¿Qué incluye cada plan de INMOVA?',
    answer:
      'Todos nuestros planes incluyen acceso completo a los 56 módulos profesionales. La diferencia está en el número de propiedades y usuarios que puedes gestionar. No cobramos por funcionalidades adicionales - todo está incluido desde el primer día.',
  },
  {
    question: '¿Puedo cambiar de plan en cualquier momento?',
    answer:
      'Sí, puedes cambiar tu plan en cualquier momento. Si subes de plan, pagas la diferencia prorrateada. Si bajas de plan, el crédito se aplica al siguiente mes. Sin complicaciones ni penalizaciones.',
  },
  {
    question: '¿Ofrecen ayuda con la migración desde otra plataforma?',
    answer:
      'Sí, ofrecemos migración asistida gratuita (valor €500) para nuevos clientes. Nuestro equipo te ayuda a importar todos tus datos: propiedades, contratos, inquilinos, documentos y más. El proceso suele tomar 2-5 días laborables.',
  },
  {
    question: '¿Cuánto tiempo dura el período de prueba gratuita?',
    answer:
      'Ofrecemos 30 días de prueba gratuita con acceso completo a todos los módulos y funcionalidades. No necesitas tarjeta de crédito para empezar. Si no te convence, simplemente cancelas sin costes.',
  },
  {
    question: '¿Qué verticales de negocio soporta INMOVA?',
    answer:
      'INMOVA es la única plataforma multi-vertical del mercado. Soporta: Alquiler Residencial, Short-Term Rental (STR), Coliving, House Flipping, Construcción, Servicios Profesionales y Hoteles. Puedes gestionar varios modelos de negocio desde una sola cuenta.',
  },
  {
    question: '¿Los precios incluyen IVA?',
    answer:
      'Los precios mostrados NO incluyen IVA. Se añadirá el 21% de IVA (España) o el impuesto correspondiente según tu país en el momento de facturación.',
  },
  {
    question: '¿Hay contratos de permanencia?',
    answer:
      'No. INMOVA funciona con suscripciones mensuales sin permanencia. Puedes cancelar en cualquier momento desde tu panel de configuración. Si cancelas, mantienes acceso hasta el final del período pagado.',
  },
  {
    question: '¿Cómo funciona el soporte técnico?',
    answer:
      'Todos los planes incluyen soporte por email (respuesta en <48h). Los planes Profesional y superiores incluyen chat en vivo 24/7 y Account Manager dedicado. También tenemos una base de conocimientos completa y tutoriales en vídeo.',
  },
  {
    question: '¿Puedo integrar INMOVA con mis herramientas actuales?',
    answer:
      'Sí, INMOVA se integra con las principales plataformas: Stripe (pagos), Signaturit/DocuSign (firma digital), Airbnb/Booking (STR), ERP como SAP y Zucchetti, y más. También ofrecemos API REST para integraciones personalizadas.',
  },
  {
    question: '¿Qué pasa con mis datos si cancelo?',
    answer:
      'Tus datos son tuyos siempre. Antes de cancelar, puedes exportar toda tu información en formato CSV/Excel. Mantenemos tus datos 90 días después de la cancelación por si decides volver. Después, se eliminan permanentemente según GDPR.',
  },
  {
    question: '¿INMOVA es seguro? ¿Cumple con GDPR?',
    answer:
      'Sí, INMOVA cumple 100% con GDPR y las normativas de protección de datos. Usamos cifrado SSL/TLS, autenticación multi-factor, backups diarios automáticos, y auditorías de seguridad trimestrales. Tus datos están alojados en servidores europeos certificados.',
  },
  {
    question: '¿Puedo usar INMOVA en mi móvil?',
    answer:
      'Sí, INMOVA es una PWA (Progressive Web App) que funciona perfectamente en móviles y tablets. Los inquilinos, propietarios y proveedores tienen portales dedicados optimizados para móvil. También estamos desarrollando apps nativas para iOS y Android.',
  },
];

export function FAQsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faqs" className="py-20 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 border-indigo-200 px-4 py-2">
            <HelpCircle className="h-4 w-4 mr-1 inline" />
            Preguntas Frecuentes
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            ¿Tienes Dudas? Te las Resolvemos
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Encuentra respuestas a las preguntas más comunes sobre INMOVA
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                openIndex === index ? 'border-indigo-300 shadow-md' : ''
              }`}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="text-gray-800">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-indigo-600 transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </CardTitle>
              </CardHeader>
              {openIndex === index && (
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* CTA Bottom */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              ¿No encuentras lo que buscas?
            </h3>
            <p className="text-gray-600 mb-6">
              Nuestro equipo está aquí para ayudarte. Contáctanos y te respondemos en menos de 24 horas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/landing/contacto">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
                  Contactar con Ventas
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline">
                  Empezar Prueba Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
