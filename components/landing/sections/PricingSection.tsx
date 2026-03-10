'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Building2, Home, Hotel, Hammer, Shield, Briefcase, ArrowRight, Zap } from 'lucide-react';

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

// Add-ons Premium disponibles
const ADDONS = [
  { id: 'ia_inmobiliaria', name: '🤖 IA Inmobiliaria', price: 149, yearlyPrice: 1490, desc: 'Valoración IA, predicción morosidad, renta óptima, anomalías, clasificación docs, asistente IA' },
  { id: 'family_office', name: '💼 Family Office 360°', price: 249, yearlyPrice: 2490, desc: 'Dashboard patrimonial, P&L sociedades, Private Equity (TVPI/DPI), informes PDF trimestrales' },
  { id: 'automatizacion', name: '⚡ Automatización Pro', price: 99, yearlyPrice: 990, desc: 'Facturación auto, SEPA, escalado impagos (4 niveles), sync Zucchetti, conciliación bancaria' },
  { id: 'analytics', name: '📈 Analytics Avanzado', price: 79, yearlyPrice: 790, desc: 'Morosidad detallada, yield tracker, benchmark mercado, previsión 12m, fiscal trimestral' },
  { id: 'operaciones', name: '🔧 Operaciones Pro', price: 69, yearlyPrice: 690, desc: 'Kanban mantenimiento, checklist inspección, evaluación proveedores, workflows completos' },
  { id: 'pack_completo', name: '🚀 Pack Completo', price: 499, yearlyPrice: 4990, desc: 'Los 5 addons incluidos — Ahorra 23% vs compra individual (€645/mes)', highlight: true },
];

// Add-ons Funcionales (accesibles para planes menores)
const FUNCTIONAL_ADDONS = [
  { id: 'liquidaciones', name: '💰 Liquidaciones', price: 19, yearlyPrice: 190, desc: 'Liquidaciones a propietarios con cálculo automático y export PDF. Incluido desde Profesional.' },
  { id: 'facturacion_avanzada', name: '🧾 Facturación Avanzada', price: 25, yearlyPrice: 250, desc: 'Series de facturación, IVA/IRPF, proformas, rectificativas, Verifactu. Incluido desde Profesional.' },
  { id: 'reportes_avanzados', name: '📊 21 Reportes', price: 15, yearlyPrice: 150, desc: 'Inquilinos, contratos, incidencias, rentabilidad, impagos, declaración renta. Incluido desde Business.' },
  { id: 'checkin_checkout', name: '📋 Check-in/out Digital', price: 12, yearlyPrice: 120, desc: 'Formularios digitales con token, inventario, contadores y firma. Incluido desde Profesional.' },
  { id: 'ia_modular', name: '✨ IA por Módulo', price: 29, yearlyPrice: 290, desc: 'Asistente IA contextual en cada módulo: scoring, clasificación, previsión. Incluido desde Business.' },
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
  highlight: string;
}

const plans: PlanData[] = [
  {
    name: 'Starter',
    price: '€89',
    period: '/mes',
    yearlyPrice: '€890/año',
    yearlySavings: '2 meses gratis',
    properties: 'Hasta 25 propiedades',
    costPerProperty: '€3.56/prop',
    verticales: 1,
    verticalesDesc: '1 vertical a elegir',
    limits: {
      users: '2 usuarios',
      signatures: '5 firmas/mes',
      storage: '5 GB',
      ai: 'Básico (onboarding IA)',
      sms: 'No incluido',
      api: false,
      whiteLabel: false,
      support: 'Email + Chat',
    },
    features: [
      'Gestión completa de propiedades y edificios',
      'Contratos digitales con plantillas LAU',
      'Portal de inquilinos con acceso web',
      'Cobros con Stripe y recordatorios email',
      'Dashboard con KPIs y alertas',
      'Bandeja "Mi Día" con tareas pendientes',
      'Onboarding IA conversacional',
    ],
    highlight: 'Para propietarios particulares',
  },
  {
    name: 'Profesional',
    price: '€199',
    period: '/mes',
    yearlyPrice: '€1.990/año',
    yearlySavings: '2 meses gratis',
    properties: 'Hasta 200 propiedades',
    costPerProperty: '€1/prop',
    verticales: 3,
    verticalesDesc: 'Hasta 3 verticales',
    popular: true,
    limits: {
      users: '5 usuarios',
      signatures: '10 firmas/mes',
      storage: '10 GB',
      ai: '10K tokens/mes',
      sms: '25 SMS/mes',
      api: false,
      whiteLabel: false,
      support: 'Chat prioritario',
    },
    features: [
      'Todo de Starter +',
      'Combina hasta 3 verticales (Alquiler + STR + Coliving)',
      'Cobro en 1-click y cobro masivo batch',
      'Facturación avanzada con series y retenciones',
      'Liquidaciones a propietarios',
      'Pipeline prealquiler Kanban',
      'Incidencias Kanban con IA',
      'Check-in/out digital con token',
      'Contratos de gestión con propietarios',
      'Renovación automática con IPC',
      'Valoraciones de inmuebles con IA',
      'Asistente IA conversacional',
    ],
    highlight: 'El más elegido por gestores',
  },
  {
    name: 'Empresarial',
    price: '€499',
    period: '/mes',
    yearlyPrice: '€4.990/año',
    yearlySavings: '2 meses gratis',
    properties: 'Hasta 1000 propiedades',
    costPerProperty: '€0.50/prop',
    verticales: 7,
    verticalesDesc: 'Los 7 verticales',
    limits: {
      users: '15 usuarios',
      signatures: '25 firmas/mes',
      storage: '50 GB',
      ai: '50K tokens/mes',
      sms: '50 SMS/mes',
      api: true,
      whiteLabel: false,
      support: 'Prioritario + Gestor dedicado',
    },
    features: [
      'Todo de Profesional +',
      'Los 7 verticales completos',
      '100+ módulos incluidos',
      '21 reportes avanzados con export CSV/PDF',
      'Acciones masivas (cobros, gastos, transferencias)',
      'Conciliación bancaria visual con IA',
      'Chat vinculado a entidades',
      'Campos personalizados por entidad',
      'Asistente IA contextual en cada módulo',
      'API REST + CRM inmobiliario',
      'Gestor dedicado + personalización marca',
    ],
    highlight: 'Para gestoras profesionales',
  },
  {
    name: 'Enterprise+',
    price: '€998',
    period: '/mes',
    yearlyPrice: '€9.980/año',
    yearlySavings: '2 meses gratis',
    properties: 'Ilimitadas',
    costPerProperty: 'Todo incluido',
    verticales: 7,
    verticalesDesc: '7 verticales + Todos los addons',
    limits: {
      users: 'Ilimitados',
      signatures: 'Ilimitadas',
      storage: '200 GB',
      ai: 'Ilimitado (todos los addons IA)',
      sms: '200 SMS/mes',
      api: true,
      whiteLabel: true,
      support: '24/7 + Account Manager dedicado',
    },
    features: [
      'Todo de Empresarial + Pack Completo incluido',
      '🤖 IA Inmobiliaria: valoración, predicción, anomalías',
      '💼 Family Office 360°: patrimonio, PE, P&L sociedades',
      '⚡ Automatización Pro: SEPA, Zucchetti, escalado',
      '📈 Analytics Avanzado: yield, benchmark, fiscal',
      '🔧 Operaciones Pro: kanban, inspecciones, proveedores',
      'White-label + SLA 99.9% + Account Manager',
      'Migración asistida + formación presencial',
      'Propiedades ilimitadas + usuarios ilimitados',
    ],
    highlight: 'Todo incluido — Para fondos y holdings',
  },
];

// Comparativa genérica
const featureComparison = [
  { feature: 'Verticales de negocio', inmova: '7 verticales', others: '1-2 verticales' },
  { feature: 'Multi-vertical (alquiler + coliving + STR...)', inmova: '✅ Combina libremente', others: '❌ Solo 1 modelo' },
  { feature: 'IA predictiva (morosidad, valoración, renta)', inmova: '✅ Incluida desde Professional', others: '❌ No disponible' },
  { feature: 'Onboarding conversacional con IA', inmova: '✅ En todos los planes', others: '❌ No disponible' },
  { feature: 'Facturación y cobro masivo automático', inmova: '✅ Desde Professional', others: '❌ Manual' },
  { feature: 'Family Office 360° + Private Equity', inmova: '✅ En Enterprise', others: '❌ No disponible' },
  { feature: 'Conciliación bancaria auto-matching', inmova: '✅ Desde Business', others: '❌ No disponible' },
  { feature: 'Workflows completos (alta→gestión→salida)', inmova: '✅ Incluidos', others: '⚠️ Parcial' },
  { feature: 'Integración contable (Zucchetti/Altai)', inmova: '✅ Desde Business', others: '❌ No disponible' },
  { feature: 'API abierta', inmova: '✅ Desde Business', others: '❌ Solo Enterprise' },
  { feature: 'White-label (tu marca)', inmova: '✅ Disponible', others: '❌ No disponible' },
  { feature: 'Sin permanencia', inmova: '✅ Mes a mes', others: '❌ 12 meses mínimo' },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-white via-indigo-50 to-violet-50">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-white text-gray-900 border-2 border-green-400 px-4 py-2 font-bold shadow-sm">
            <span className="text-green-700">✓</span> 88+ Módulos · 7 Verticales · IA Integrada · Sin Permanencia
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            La Plataforma Más Completa del Mercado
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-2">
            Donde otras herramientas ofrecen 10-25 módulos para 1 modelo de negocio, INMOVA te da{' '}
            <strong className="text-indigo-600">88+ módulos, 7 verticales y IA predictiva</strong>{' '}
            desde €3.56/propiedad/mes.
          </p>
          <p className="text-lg text-gray-500">
            30 días gratis · Sin tarjeta de crédito · Sin permanencia · Migración asistida
          </p>
        </div>

        {/* Los 7 Verticales */}
        <div className="mb-12">
          <h3 className="text-center text-lg font-semibold text-gray-700 mb-4">Los 7 Verticales incluidos en INMOVA</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {VERTICALES.map((v) => (
              <div key={v.id} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm">
                <v.icon className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">{v.name}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-3">
            La mayoría de plataformas solo ofrecen <strong>1 vertical</strong>. INMOVA te da los 7.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16 auto-rows-fr">
          {plans.map((plan, i) => (
            <Card key={i} className={`group hover:shadow-2xl transition-all flex flex-col ${
              plan.popular 
                ? 'border-indigo-500 border-2 shadow-2xl relative ring-2 ring-indigo-500 ring-offset-2' 
                : 'hover:border-indigo-300 border-2'
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ Más Popular
                </div>
              )}
              
              <CardHeader className="pb-3">
                <CardTitle className="text-xl mb-1 text-gray-900">{plan.name}</CardTitle>
                
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

                {/* Highlight */}
                <div className="mt-3 p-2 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg border border-indigo-100">
                  <div className="text-sm text-indigo-700 font-semibold text-center">
                    {plan.highlight}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 flex-1">
                {/* Límites */}
                <div className="mb-4 p-2 bg-gray-50 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">👤 Usuarios:</span>
                    <span className="font-medium text-gray-800">{plan.limits.users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">✍️ Firmas:</span>
                    <span className="font-medium text-gray-800">{plan.limits.signatures}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">💾 Storage:</span>
                    <span className="font-medium text-gray-800">{plan.limits.storage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🤖 IA:</span>
                    <span className="font-medium text-gray-800">{plan.limits.ai}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🔌 API:</span>
                    <span className="font-medium text-gray-800">{plan.limits.api ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">💬 Soporte:</span>
                    <span className="font-medium text-gray-800">{plan.limits.support}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              {/* CTA - En CardFooter para alineación */}
              <CardFooter className="mt-auto">
                <Link href="/register" className="w-full block">
                  <Button 
                    className="w-full font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
                  >
                    Probar 30 días gratis
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="text-center mb-8">
            <Badge className="mb-3 bg-white text-gray-900 border-2 border-purple-400 font-bold shadow-sm">
              <Zap className="h-3 w-3 mr-1 inline text-purple-600" />
              Addons Premium
            </Badge>
            <h3 className="text-2xl font-bold text-gray-800">
              Potencia tu plan con addons especializados
            </h3>
            <p className="text-gray-600 mt-2">
              Funcionalidades avanzadas que puedes añadir a cualquier plan. Ahorra 17% con pago anual.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {ADDONS.map((addon: any) => (
              <div
                key={addon.id}
                className={`p-5 rounded-xl border-2 transition-all ${
                  addon.highlight
                    ? 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-400 shadow-lg ring-2 ring-indigo-200 md:col-span-3'
                    : 'bg-white border-gray-100 hover:border-purple-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <span className={`font-bold ${addon.highlight ? 'text-lg text-indigo-900' : 'text-gray-800'}`}>
                    {addon.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={addon.highlight ? 'bg-indigo-600 text-white text-sm px-3' : 'bg-purple-100 text-purple-700'}>
                      €{addon.price}/mes
                    </Badge>
                    <span className="text-xs text-gray-400">
                      o €{addon.yearlyPrice?.toLocaleString('es-ES')}/año
                    </span>
                  </div>
                </div>
                <p className={`text-sm ${addon.highlight ? 'text-indigo-700 font-medium' : 'text-gray-500'}`}>{addon.desc}</p>
                {addon.highlight && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-indigo-600 font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    Incluye: IA Inmobiliaria + Family Office + Automatización + Analytics + Operaciones
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Los add-ons se pueden añadir a cualquier plan en cualquier momento
          </p>

          {/* Addons Funcionales */}
          <div className="mt-10 text-center">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-2">
              Módulos a la carta
            </Badge>
            <h4 className="text-xl font-bold text-gray-800 mt-3">
              Amplía tu plan Starter o Básico
            </h4>
            <p className="text-gray-500 text-sm mt-1">
              Incluidos en planes superiores. Disponibles como add-on para planes Starter y Básico.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
            {FUNCTIONAL_ADDONS.map((addon: any) => (
              <div key={addon.id} className="p-4 rounded-lg border bg-white hover:border-emerald-300 transition-all">
                <span className="font-semibold text-sm text-gray-800">{addon.name}</span>
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 text-xs">
                  €{addon.price}/mes
                </Badge>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{addon.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla Comparativa Genérica */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 px-6 rounded-t-xl">
            <h3 className="text-2xl font-bold text-center">
              ¿Por qué elegir INMOVA?
            </h3>
          </div>
          <div className="bg-white rounded-b-xl shadow-lg border border-t-0">
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="px-4 py-3 text-left text-sm font-bold text-indigo-900">Característica</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-indigo-900">INMOVA</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Otras plataformas</th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{row.feature}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-green-600">{row.inmova}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-500">{row.others}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-700 mb-4">
            ¿Gestionas +100 propiedades o necesitas funcionalidades a medida?
          </p>
          <Link href="/landing/contacto">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-lg">
              Solicitar Demo Personalizada
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
