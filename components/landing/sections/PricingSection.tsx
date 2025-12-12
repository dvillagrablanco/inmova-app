'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, DollarSign } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '€89',
    period: '/mes',
    modules: '56 módulos',
    properties: '1-25 propiedades',
    costPerProperty: '€3.56/propiedad (máx)',
    features: [
      'Todos los 56 módulos incluidos',
      '1-25 propiedades',
      'Todos los verticales de negocio',
      '3 usuarios incluidos',
      'Soporte email 48h',
      'Onboarding básico incluido'
    ],
    cta: 'Ideal para emprendedores',
    tcoYear: '€1,068/año'
  },
  {
    name: 'Profesional',
    price: '€169',
    period: '/mes',
    modules: '56 módulos',
    properties: '26-100 propiedades',
    costPerProperty: '€1.69/propiedad (máx)',
    popular: true,
    features: [
      'Todos los 56 módulos incluidos',
      '26-100 propiedades',
      'Todos los verticales de negocio',
      'Portal inquilino + propietario',
      'Firma Digital ilimitada + CRM',
      '10 usuarios incluidos',
      'Soporte chat 24h + Account Manager'
    ],
    cta: 'Gestoras en crecimiento',
    tcoYear: '€2,028/año'
  },
  {
    name: 'Empresa',
    price: '€329',
    period: '/mes',
    modules: '56 módulos',
    properties: '101-250 propiedades',
    costPerProperty: '€1.32/propiedad (máx)',
    features: [
      'Todos los 56 módulos incluidos',
      '101-250 propiedades',
      'Todos los verticales de negocio',
      'White Label personalizado',
      'Integraciones ERP (SAP, Zucchetti)',
      '25 usuarios incluidos',
      'SLA 99.9% + Infraestructura dedicada'
    ],
    cta: 'Empresas consolidadas',
    tcoYear: '€3,948/año'
  },
  {
    name: 'Enterprise',
    price: '€599',
    period: '/mes',
    modules: '56 módulos',
    properties: '251-500 propiedades',
    costPerProperty: '€1.20/propiedad (máx)',
    features: [
      'Todos los módulos + desarrollos custom',
      '251-500 propiedades',
      '50 usuarios incluidos',
      'Multi-región + Multi-moneda',
      'SLA 99.95% + Soporte 24/7',
      'Account Manager dedicado',
      'Consultoría estratégica incluida'
    ],
    cta: 'Grandes corporaciones',
    tcoYear: '€7,188/año'
  },
  {
    name: 'Corporate',
    price: 'A medida',
    period: '',
    modules: '56+ módulos',
    properties: '+500 propiedades',
    costPerProperty: 'Personalizado',
    features: [
      'Solución 100% personalizada',
      'Propiedades ilimitadas',
      'Usuarios ilimitados',
      'Desarrollos custom a medida',
      'Blockchain + IA avanzada',
      'Infraestructura dedicada',
      'Soporte prioritario 24/7/365'
    ],
    cta: 'Grandes holdings',
    tcoYear: 'Consultar'
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-white via-indigo-50 to-violet-50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 px-4 py-2">
            <DollarSign className="h-4 w-4 mr-1 inline" />
            Mejor Precio/Valor del Mercado
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Una Plataforma. Todo Incluido.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            <strong className="text-indigo-600">Todos los 56 módulos incluidos en todos los planes.</strong> Paga solo por tus propiedades, no por funcionalidades. Ahorra hasta un 70% consolidando 5-8 herramientas en una sola.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-[1600px] mx-auto">
          {plans.map((plan, i) => (
            <Card key={i} className={`group hover:shadow-2xl transition-all ${
              plan.popular 
                ? 'border-indigo-500 border-2 shadow-xl relative scale-105' 
                : 'hover:border-indigo-300 border-2'
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ Más Popular
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg mb-2">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div>
                    <span className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                  <div className="text-xs text-gray-500 font-semibold">{plan.costPerProperty}</div>
                  <div className="text-xs text-gray-400 mt-1">TCO: {plan.tcoYear}</div>
                </div>
                <Badge variant="secondary" className="mt-3 w-fit text-xs">{plan.modules}</Badge>
                <div className="text-xs text-indigo-600 font-semibold mt-2">{plan.properties}</div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs text-gray-700 font-semibold text-center">{plan.cta}</p>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="w-full">
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.popular ? '🚀 Comenzar Ahora' : 'Comenzar Ahora'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12 space-y-4">
          <p className="text-sm text-gray-600">
            ¿Más de 500 propiedades? <Link href="/landing/demo" className="text-indigo-600 font-semibold hover:underline">Solicita una demo</Link> para un plan Corporate personalizado
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-3xl mx-auto">
            <p className="text-sm text-green-800 font-semibold">
              🎁 <strong>Promoción Lanzamiento:</strong> 30% descuento + 2 meses gratis en facturación anual para los primeros 100 clientes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
