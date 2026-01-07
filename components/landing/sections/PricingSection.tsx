'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Plus, Building2, Home, Hotel, Hammer, Users, Shield, Briefcase, ArrowRight, Zap } from 'lucide-react';

// Los 7 verticales de INMOVA
const VERTICALES = [
  { id: 'alquiler', name: 'Alquiler Residencial', icon: Building2 },
  { id: 'str', name: 'STR / Vacacional', icon: Hotel },
  { id: 'coliving', name: 'Coliving', icon: Home },
  { id: 'flipping', name: 'House Flipping', icon: Hammer },
  { id: 'construccion', name: 'Construcción', icon: Hammer },
  { id: 'comunidades', name: 'Comunidades', icon: Shield },
  { id: 'servicios', name: 'Servicios Pro', icon: Briefcase },
];

// Add-ons disponibles
const ADDONS = [
  { id: 'signatures', name: 'Pack 10 Firmas', price: 15, desc: 'Firmas digitales adicionales' },
  { id: 'storage', name: 'Pack 10GB Storage', price: 5, desc: 'Almacenamiento extra' },
  { id: 'ai', name: 'Pack IA Avanzada', price: 10, desc: '50K tokens IA/mes' },
  { id: 'sms', name: 'Pack 50 SMS', price: 8, desc: 'Notificaciones SMS' },
  { id: 'whitelabel', name: 'White-label', price: 49, desc: 'Tu marca, tu dominio' },
  { id: 'api', name: 'Acceso API', price: 29, desc: 'Integraciones personalizadas' },
];

interface PlanData {
  name: string;
  price: string;
  period: string;
  yearlyPrice?: string;
  yearlySavings?: string;
  properties: string;
  costPerProperty: string;
  verticales: number;
  verticalesDesc: string;
  popular?: boolean;
  limits: {
    users: string;
    signatures: string;
    storage: string;
    ai: string;
    sms: string;
    api: boolean;
    whiteLabel: boolean;
    support: string;
  };
  features: string[];
  vsCompetition: {
    text: string;
    savings: string;
  };
}

const plans: PlanData[] = [
  {
    name: 'Starter',
    price: '€35',
    period: '/mes',
    yearlyPrice: '€350/año',
    yearlySavings: '2 meses gratis',
    properties: '1-5 propiedades',
    costPerProperty: '€7/prop',
    verticales: 1,
    verticalesDesc: '1 vertical a elegir',
    limits: {
      users: '1 usuario',
      signatures: '2 firmas/mes',
      storage: '1 GB',
      ai: 'No incluido',
      sms: 'No incluido',
      api: false,
      whiteLabel: false,
      support: 'Email',
    },
    features: [
      'Gestión completa de propiedades',
      'Contratos digitales',
      'Portal inquilinos básico',
      'Cobros y recordatorios',
      'Dashboard con métricas',
    ],
    vsCompetition: {
      text: 'Homming cobra €59 por lo mismo',
      savings: '-41%',
    },
  },
  {
    name: 'Professional',
    price: '€59',
    period: '/mes',
    yearlyPrice: '€590/año',
    yearlySavings: '2 meses gratis',
    properties: '6-25 propiedades',
    costPerProperty: '€2.36/prop',
    verticales: 3,
    verticalesDesc: 'Hasta 3 verticales',
    popular: true,
    limits: {
      users: '3 usuarios',
      signatures: '5 firmas/mes',
      storage: '5 GB',
      ai: '5K tokens/mes',
      sms: 'No incluido',
      api: false,
      whiteLabel: false,
      support: 'Chat prioritario',
    },
    features: [
      'Todo de Starter +',
      'Combina Alquiler + STR + Coliving',
      'Portal propietarios',
      'Reportes avanzados',
      'Integraciones portales',
      'IA para valoraciones',
    ],
    vsCompetition: {
      text: 'Homming €79 = 1 vertical. Tú: 3',
      savings: '-25%',
    },
  },
  {
    name: 'Business',
    price: '€129',
    period: '/mes',
    yearlyPrice: '€1.290/año',
    yearlySavings: '2 meses gratis',
    properties: '26-100 propiedades',
    costPerProperty: '€1.29/prop',
    verticales: 7,
    verticalesDesc: 'Los 7 verticales',
    limits: {
      users: '10 usuarios',
      signatures: '15 firmas/mes',
      storage: '20 GB',
      ai: '50K tokens/mes',
      sms: '25 SMS/mes',
      api: true,
      whiteLabel: false,
      support: 'Prioritario + Gestor',
    },
    features: [
      'Todo de Professional +',
      'TODOS los 7 verticales',
      'API completa incluida',
      'Personalización de marca',
      'CRM integrado',
      'Automatizaciones',
      'Gestor de cuenta dedicado',
    ],
    vsCompetition: {
      text: 'Homming €159 = 50 props. Tú: 100',
      savings: '-19%',
    },
  },
  {
    name: 'Enterprise',
    price: '€299',
    period: '/mes',
    yearlyPrice: '€2.990/año',
    properties: '+100 propiedades',
    costPerProperty: 'Desde €0.50/prop',
    verticales: 7,
    verticalesDesc: '7 verticales + Custom',
    limits: {
      users: 'Ilimitados',
      signatures: '50 firmas/mes',
      storage: '50 GB',
      ai: '100K tokens/mes',
      sms: '100 SMS/mes',
      api: true,
      whiteLabel: true,
      support: '24/7 + Account Manager',
    },
    features: [
      'Todo de Business +',
      'White-label incluido',
      'Desarrollos a medida',
      'Migración asistida',
      'SLA 99.9% garantizado',
      'Formación presencial',
      'Integraciones custom',
    ],
    vsCompetition: {
      text: 'Competencia no ofrece esto',
      savings: 'Único',
    },
  },
];

// Comparativa con competencia
const competitorComparison = [
  { feature: 'Verticales de negocio', inmova: '7 verticales', homming: '1 (solo alquiler)', rentger: '1-2 verticales' },
  { feature: 'Propiedades (plan medio)', inmova: 'Hasta 100', homming: 'Hasta 50', rentger: 'Hasta 50' },
  { feature: 'Precio plan medio', inmova: '€129/mes', homming: '€159/mes', rentger: '€149/mes' },
  { feature: 'Firmas digitales', inmova: 'Incluidas + Packs', homming: 'Limitadas (120/año)', rentger: 'Limitadas' },
  { feature: 'IA integrada', inmova: '✅ Sí', homming: '❌ No', rentger: '❌ No' },
  { feature: 'Multi-vertical', inmova: '✅ Sí', homming: '❌ No', rentger: '❌ No' },
  { feature: 'API abierta', inmova: '✅ Business+ o Add-on', homming: '❌ Solo Enterprise', rentger: '❌ Solo Enterprise' },
  { feature: 'White-label', inmova: '✅ Enterprise o Add-on', homming: '❌ No', rentger: '❌ No' },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-white via-indigo-50 to-violet-50">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 px-4 py-2">
            7 Verticales · Precios Transparentes · Add-ons Flexibles
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Más Verticales. Menos Precio.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-2">
            La competencia cobra más por menos. <strong className="text-indigo-600">INMOVA te da 7 verticales</strong> donde otros solo ofrecen 1.
          </p>
          <p className="text-lg text-gray-500">
            30 días gratis · Sin tarjeta · Cancela cuando quieras
          </p>
        </div>

        {/* Los 7 Verticales */}
        <div className="mb-12">
          <h3 className="text-center text-lg font-semibold text-gray-700 mb-4">Los 7 Verticales que incluye INMOVA</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {VERTICALES.map((v) => (
              <div key={v.id} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm">
                <v.icon className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium">{v.name}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-3">
            Homming y Rentger solo ofrecen <strong>1 vertical</strong> (alquiler tradicional)
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
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
              
              <CardHeader className="pb-3">
                <CardTitle className="text-xl mb-1">{plan.name}</CardTitle>
                
                {/* Precio */}
                <div className="space-y-1">
                  <div>
                    <span className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                  {plan.yearlyPrice && (
                    <div className="text-xs text-green-600 font-semibold">
                      {plan.yearlyPrice} · {plan.yearlySavings}
                    </div>
                  )}
                </div>

                {/* Propiedades y Verticales */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Propiedades:</span>
                    <Badge variant="secondary" className="font-semibold">{plan.properties}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Verticales:</span>
                    <Badge className={`font-semibold ${plan.verticales === 7 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {plan.verticalesDesc}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 text-center font-medium">
                    {plan.costPerProperty}
                  </div>
                </div>

                {/* Comparativa con competencia */}
                <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="text-xs text-green-800 font-medium text-center">
                    {plan.vsCompetition.text}
                  </div>
                  <div className="text-lg font-bold text-green-600 text-center">
                    {plan.vsCompetition.savings}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Límites */}
                <div className="mb-4 p-2 bg-gray-50 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>👤 Usuarios:</span>
                    <span className="font-medium">{plan.limits.users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✍️ Firmas:</span>
                    <span className="font-medium">{plan.limits.signatures}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>💾 Storage:</span>
                    <span className="font-medium">{plan.limits.storage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🤖 IA:</span>
                    <span className="font-medium">{plan.limits.ai}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🔌 API:</span>
                    <span className="font-medium">{plan.limits.api ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>💬 Soporte:</span>
                    <span className="font-medium">{plan.limits.support}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href="/register" className="w-full block">
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Empezar Gratis
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <Badge className="mb-3 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200">
              <Zap className="h-3 w-3 mr-1 inline" />
              Mejoras Opcionales
            </Badge>
            <h3 className="text-2xl font-bold text-gray-800">
              ¿Necesitas más? Añade lo que necesites
            </h3>
            <p className="text-gray-600 mt-2">
              Paga solo por lo que uses. Sin compromisos.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {ADDONS.map((addon) => (
              <div key={addon.id} className="bg-white p-4 rounded-xl border-2 border-gray-100 hover:border-purple-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{addon.name}</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    €{addon.price}/mes
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{addon.desc}</p>
              </div>
            ))}
          </div>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Los add-ons se pueden añadir a cualquier plan en cualquier momento
          </p>
        </div>

        {/* Tabla Comparativa vs Competencia */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
            ¿Por qué INMOVA vs Homming o Rentger?
          </h3>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Característica</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">INMOVA</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Homming</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Rentger</th>
                </tr>
              </thead>
              <tbody>
                {competitorComparison.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{row.feature}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold text-green-600">{row.inmova}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-500">{row.homming}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-500">{row.rentger}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            * Datos basados en información pública de Homming y Rentger (Enero 2026)
          </p>
        </div>

        {/* CTA Final */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-700 mb-4">
            ¿Más de 100 propiedades? ¿Necesitas personalización?
          </p>
          <Link href="/contacto">
            <Button size="lg" variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
              Solicitar Demo Personalizada
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
