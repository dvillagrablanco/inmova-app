'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle } from 'lucide-react';

const faqs = [
  {
    categoria: 'General',
    preguntas: [
      {
        q: '¿Qué es Inmova?',
        a: 'Inmova es una plataforma integral de gestión inmobiliaria que permite a propietarios, gestores e inquilinos gestionar propiedades, contratos, pagos y comunicaciones desde un solo lugar.',
      },
      {
        q: '¿Inmova es gratis?',
        a: 'Ofrecemos un plan gratuito con funcionalidades básicas. Para acceder a características avanzadas como firma digital, cobro automático de rentas o gestión multi-propietario, disponemos de planes de pago desde €49/mes.',
      },
      {
        q: '¿Puedo cancelar en cualquier momento?',
        a: 'Sí, no hay permanencia. Puedes cancelar tu suscripción en cualquier momento desde el panel de configuración. Mantendrás acceso hasta el final del período facturado.',
      },
    ],
  },
  {
    categoria: 'Propiedades',
    preguntas: [
      {
        q: '¿Cuántas propiedades puedo gestionar?',
        a: 'Depende de tu plan: Starter permite hasta 5 propiedades, Profesional hasta 25, y los planes Gestor y Enterprise ofrecen propiedades ilimitadas.',
      },
      {
        q: '¿Puedo gestionar propiedades de terceros?',
        a: 'Sí, con los planes Gestor y Enterprise puedes gestionar propiedades de múltiples propietarios, ideal para administradores de fincas y gestores profesionales.',
      },
    ],
  },
  {
    categoria: 'Pagos',
    preguntas: [
      {
        q: '¿Cómo funciona el cobro de rentas?',
        a: 'Configuramos el cobro automático mediante domiciliación bancaria (SEPA) o tarjeta. El inquilino recibe un recordatorio antes del cobro y tú recibes el pago directamente en tu cuenta.',
      },
      {
        q: '¿Qué comisión cobra Inmova por los pagos?',
        a: 'Solo cobramos un 1% sobre los pagos procesados, sin costes ocultos. Esta comisión cubre el procesamiento, las notificaciones y la conciliación automática.',
      },
      {
        q: '¿Qué pasa si un inquilino no paga?',
        a: 'El sistema envía recordatorios automáticos. Si persiste el impago, te notificamos inmediatamente y puedes iniciar el proceso de reclamación desde la plataforma.',
      },
    ],
  },
  {
    categoria: 'Contratos',
    preguntas: [
      {
        q: '¿Los contratos tienen validez legal?',
        a: 'Sí, nuestros contratos están redactados por abogados especializados y cumplen con la LAU (Ley de Arrendamientos Urbanos). La firma electrónica tiene plena validez legal según el reglamento eIDAS.',
      },
      {
        q: '¿Puedo usar mis propios contratos?',
        a: 'Sí, puedes subir tus propias plantillas de contrato. También puedes editar nuestras plantillas para adaptarlas a tus necesidades.',
      },
    ],
  },
  {
    categoria: 'Seguridad',
    preguntas: [
      {
        q: '¿Mis datos están seguros?',
        a: 'Utilizamos encriptación de nivel bancario (AES-256) y cumplimos con el RGPD. Nuestros servidores están en la UE y realizamos copias de seguridad diarias.',
      },
      {
        q: '¿Quién puede acceder a mis datos?',
        a: 'Solo tú y las personas que autorices. Cada usuario tiene su propio acceso con permisos configurables. Nunca compartimos ni vendemos datos a terceros.',
      },
    ],
  },
];

export default function FAQPage() {
  const [abiertos, setAbiertos] = useState<string[]>([]);

  const togglePregunta = (id: string) => {
    setAbiertos(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Preguntas Frecuentes
          </h1>
          <p className="text-xl text-blue-100">
            Encuentra respuestas a las preguntas más comunes
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {faqs.map((seccion) => (
          <div key={seccion.categoria} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{seccion.categoria}</h2>
            <div className="space-y-3">
              {seccion.preguntas.map((faq, i) => {
                const id = `${seccion.categoria}-${i}`;
                const abierto = abiertos.includes(id);
                return (
                  <Card key={id} className="overflow-hidden">
                    <button
                      onClick={() => togglePregunta(id)}
                      className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{faq.q}</span>
                      {abierto ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    {abierto && (
                      <CardContent className="pt-0 pb-4 px-4 border-t bg-gray-50">
                        <p className="text-gray-600">{faq.a}</p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* CTA */}
        <Card className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h3 className="text-2xl font-bold mb-2">¿No encuentras lo que buscas?</h3>
            <p className="text-blue-100 mb-6">
              Nuestro equipo está listo para ayudarte
            </p>
            <Link href="/landing/contacto">
              <Button variant="secondary" size="lg">
                Contactar Soporte
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
