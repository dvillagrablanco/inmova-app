'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, Building2, Users, Briefcase, Crown } from 'lucide-react';

const planes = [
  {
    nombre: 'Starter',
    precio: 35,
    periodo: '/mes',
    descripcion: 'Perfecto para empezar',
    anual: '€350/año · 2 meses gratis',
    features: [
      'Hasta 5 propiedades',
      'Gestión básica de inquilinos',
      'Contratos simples',
      'Soporte por email',
    ],
    cta: 'Probar 30 días gratis',
    destacado: false,
    icon: Users,
  },
  {
    nombre: 'Profesional',
    precio: 59,
    periodo: '/mes',
    descripcion: 'Para propietarios activos',
    anual: '€590/año · 2 meses gratis',
    features: [
      'Hasta 25 propiedades',
      'Gestión avanzada de inquilinos',
      'Contratos con firma digital',
      'Cobro automático de rentas',
      'Informes financieros',
      'Soporte prioritario',
    ],
    cta: 'Probar 30 días gratis',
    destacado: true,
    icon: Building2,
  },
  {
    nombre: 'Business',
    precio: 129,
    periodo: '/mes',
    descripcion: 'Para gestores profesionales',
    anual: '€1.290/año · 2 meses gratis',
    features: [
      'Hasta 100 propiedades',
      'Multi-propietario',
      'CRM integrado',
      'API de integración',
      'Los 7 verticales',
      'Account manager dedicado',
    ],
    cta: 'Probar 30 días gratis',
    destacado: false,
    icon: Briefcase,
  },
  {
    nombre: 'Enterprise',
    precio: 299,
    periodo: '/mes',
    descripcion: 'Para grandes empresas',
    anual: '€2.990/año · 2 meses gratis',
    features: [
      'Todo de Business',
      'Propiedades ilimitadas',
      'White-label incluido',
      'SLA garantizado',
      'Integraciones personalizadas',
      'Soporte 24/7',
    ],
    cta: 'Solicitar Demo',
    destacado: false,
    icon: Crown,
  },
];

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Planes y Precios
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades. Sin permanencia, cancela cuando quieras.
          </p>
        </div>
      </div>

      {/* Planes */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
          {planes.map((plan) => (
            <Card 
              key={plan.nombre}
              className={`relative flex flex-col ${plan.destacado ? 'border-2 border-blue-500 shadow-2xl ring-2 ring-blue-500 ring-offset-2' : 'border'}`}
            >
              {plan.destacado && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                  Más Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <plan.icon className={`w-12 h-12 mx-auto mb-3 ${plan.destacado ? 'text-blue-600' : 'text-gray-600'}`} />
                <CardTitle className="text-xl">{plan.nombre}</CardTitle>
                <p className="text-gray-500 text-sm">{plan.descripcion}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    €{plan.precio}
                  </span>
                  <span className="text-gray-500">{plan.periodo}</span>
                </div>
                {plan.anual && (
                  <p className="text-xs text-green-600 font-semibold mt-1">{plan.anual}</p>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Link href={plan.nombre === 'Enterprise' ? '/landing/contacto' : '/register'} className="w-full">
                  <Button 
                    className={`w-full ${plan.destacado ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.destacado ? 'default' : 'outline'}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ rápido */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            ¿Tienes preguntas? Consulta nuestras{' '}
            <Link href="/landing/faq" className="text-blue-600 hover:underline">
              preguntas frecuentes
            </Link>{' '}
            o{' '}
            <Link href="/landing/contacto" className="text-blue-600 hover:underline">
              contacta con nosotros
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
