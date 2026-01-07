'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, DollarSign } from 'lucide-react';

interface UsageLimits {
  signatures: string;
  storage: string;
  ai: string;
  sms: string;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  yearlyPrice?: string;
  yearlySavings?: string;
  modules: string;
  properties: string;
  costPerProperty: string;
  popular?: boolean;
  newFeature?: string;
  usageLimits?: UsageLimits;
  features: string[];
  addons: string[];
  cta: string;
}

const plans: Plan[] = [
  {
    name: 'Starter',
    price: '€29',
    period: '/mes',
    yearlyPrice: '€290/año',
    yearlySavings: 'Ahorra €58 (2 meses gratis)',
    modules: 'Alquiler Residencial',
    properties: 'Hasta 5 propiedades',
    costPerProperty: '€5.80/propiedad',
    usageLimits: {
      signatures: '5 firmas/mes',
      storage: '1 GB',
      ai: 'No incluido',
      sms: '5 SMS/mes',
    },
    features: [
      '✅ Gestión de propiedades',
      '✅ Contratos digitales básicos',
      '✅ Gestión de inquilinos',
      '✅ Cobros y recordatorios',
      '✅ Dashboard básico',
      'Soporte email'
    ],
    addons: [],
    cta: 'Para propietarios con pocas propiedades'
  },
  {
    name: 'Professional',
    price: '€49',
    period: '/mes',
    yearlyPrice: '€490/año',
    yearlySavings: 'Ahorra €98 (2 meses gratis)',
    modules: '1 Vertical completo',
    properties: 'Hasta 25 propiedades',
    costPerProperty: '€1.96/propiedad',
    popular: true,
    usageLimits: {
      signatures: '15 firmas/mes',
      storage: '5 GB',
      ai: 'Básico',
      sms: '25 SMS/mes',
    },
    features: [
      '✅ Todo de Starter +',
      '✅ Hasta 25 propiedades',
      '✅ 3 usuarios incluidos',
      '✅ Reportes avanzados',
      '✅ Portal de inquilinos',
      '✅ Integraciones (portales, calendario)',
      '✅ Soporte chat'
    ],
    addons: [],
    cta: 'Ideal para propietarios y pequeños gestores'
  },
  {
    name: 'Business',
    price: '€149',
    period: '/mes',
    yearlyPrice: '€1,490/año',
    yearlySavings: 'Ahorra €298 (2 meses gratis)',
    modules: 'Múltiples verticales',
    properties: 'Hasta 100 propiedades',
    costPerProperty: '€1.49/propiedad',
    usageLimits: {
      signatures: '50 firmas/mes',
      storage: '20 GB',
      ai: 'Avanzado',
      sms: '100 SMS/mes',
    },
    features: [
      '✅ Todo de Professional +',
      '✅ Hasta 100 propiedades',
      '✅ 10 usuarios incluidos',
      '✅ Múltiples verticales',
      '✅ API acceso',
      '✅ Personalización de marca',
      '✅ Gestor de cuenta',
      '✅ Soporte prioritario'
    ],
    addons: [],
    cta: 'Para agencias y gestoras profesionales'
  },
  {
    name: 'Enterprise',
    price: 'A medida',
    period: '',
    modules: 'Todos los verticales',
    properties: 'Ilimitadas',
    costPerProperty: 'Personalizado',
    usageLimits: {
      signatures: 'Ilimitadas',
      storage: 'Ilimitado',
      ai: 'Ilimitado',
      sms: 'Ilimitados',
    },
    features: [
      '✅ Todo de Business +',
      '✅ Propiedades ilimitadas',
      '✅ Usuarios ilimitados',
      '✅ Desarrollos a medida',
      '✅ Migración de datos incluida',
      '✅ SLA garantizado',
      '✅ Formación presencial',
      '✅ Soporte 24/7'
    ],
    addons: [],
    cta: 'Grandes gestoras y promotoras'
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-white via-indigo-50 to-violet-50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 px-4 py-2">
            <DollarSign className="h-4 w-4 mr-1 inline" />
            Precios Transparentes - Sin Sorpresas
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Elige el Plan que Necesitas
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Desde propietarios individuales hasta grandes gestoras. <strong className="text-indigo-600">Todos los planes incluyen soporte y actualizaciones.</strong>
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Prueba gratis 30 días. Sin tarjeta de crédito. Cancela cuando quieras.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, i) => (
            <Card key={i} className={`group hover:shadow-2xl transition-all ${
              plan.popular 
                ? 'border-indigo-500 border-2 shadow-xl relative' 
                : 'hover:border-indigo-300 border-2'
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ Más Popular
                </div>
              )}
              {plan.newFeature && !plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg">
                  ✨ NUEVO Q4 2024
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div>
                    <span className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                  {plan.yearlyPrice && (
                    <div className="text-xs text-green-600 font-semibold">
                      {plan.yearlyPrice} • {plan.yearlySavings}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 font-semibold">{plan.costPerProperty}</div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  <Badge variant="secondary" className="text-xs">{plan.modules}</Badge>
                  {plan.newFeature && (
                    <Badge className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                      {plan.newFeature}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-indigo-600 font-semibold mt-2">{plan.properties}</div>
                
                {/* Usage Limits */}
                {plan.usageLimits && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg space-y-1">
                    <div className="text-xs font-semibold text-blue-900 mb-1">Límites incluidos/mes:</div>
                    <div className="text-xs text-blue-700 space-y-0.5">
                      <div>📝 {plan.usageLimits.signatures}</div>
                      <div>💾 {plan.usageLimits.storage}</div>
                      <div>🤖 {plan.usageLimits.ai}</div>
                      <div>📱 {plan.usageLimits.sms}</div>
                    </div>
                  </div>
                )}
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

        <div className="text-center mt-12">
          <p className="text-sm text-gray-600">
            ¿Más de 300 propiedades? <Link href="/contacto" className="text-indigo-600 font-semibold hover:underline">Contáctanos</Link> para un plan personalizado
          </p>
        </div>
      </div>
    </section>
  );
}
