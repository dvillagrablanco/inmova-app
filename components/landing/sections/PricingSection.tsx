'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Building2, Home, Hotel, Hammer, Shield, Briefcase, ArrowRight, Zap, Users, Crown, Layers } from 'lucide-react';
import { PLAN_INFO, MODULES_BY_PLAN, MODULE_ADDON_PRICES, type PlanTier } from '@/lib/modules-pricing-config';

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

// Planes públicos (excluyendo owner)
const PUBLIC_PLANS: PlanTier[] = ['starter', 'professional', 'business', 'enterprise'];

// Iconos por plan
const PLAN_ICONS: Record<PlanTier, React.ComponentType<any>> = {
  starter: Users,
  professional: Building2,
  business: Briefcase,
  enterprise: Crown,
  owner: Crown,
};

// Add-ons destacados para la sección
const ADD_ONS_DESTACADOS = [
  { id: 'recordatorios_auto', name: 'Recordatorios Auto', price: 8, desc: 'Notificaciones automáticas' },
  { id: 'portal_inquilino', name: 'Portal Inquilino', price: 15, desc: 'Autoservicio para inquilinos' },
  { id: 'analytics', name: 'Analytics Avanzado', price: 25, desc: 'Predicciones con IA' },
  { id: 'contabilidad', name: 'Contabilidad', price: 30, desc: 'Integración A3, Sage...' },
  { id: 'whitelabel_basic', name: 'White-label', price: 35, desc: 'Tu marca y colores' },
  { id: 'api_access', name: 'Acceso API', price: 49, desc: 'Integraciones personalizadas' },
];

// Comparativa genérica
const featureComparison = [
  { feature: 'Verticales de negocio', inmova: '7 verticales', others: '1-2 verticales' },
  { feature: 'Propiedades incluidas', inmova: 'Hasta 100', others: 'Hasta 50' },
  { feature: 'Firmas digitales', inmova: 'Incluidas + Packs', others: 'Limitadas' },
  { feature: 'IA integrada', inmova: '✅ Incluida', others: '❌ No disponible' },
  { feature: 'Multi-vertical', inmova: '✅ Sí', others: '❌ No' },
  { feature: 'API abierta', inmova: '✅ Desde Business', others: '❌ Solo Enterprise' },
  { feature: 'Add-ons flexibles', inmova: '✅ Disponibles', others: '❌ No disponible' },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-white via-indigo-50 to-violet-50">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-white text-gray-900 border-2 border-green-400 px-4 py-2 font-bold shadow-sm">
            <span className="text-green-700">✓</span> 7 Verticales · Precios Transparentes · Add-ons Flexibles
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Más Funcionalidades. Mejor Precio.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-2">
            Una plataforma, <strong className="text-indigo-600">7 verticales de negocio</strong>. 
            Todo lo que necesitas para gestionar tu cartera inmobiliaria.
          </p>
          <p className="text-lg text-gray-500">
            30 días gratis · Sin tarjeta · Cancela cuando quieras
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
          {PUBLIC_PLANS.map((planKey) => {
            const plan = PLAN_INFO[planKey];
            const PlanIcon = PLAN_ICONS[planKey];
            const modules = MODULES_BY_PLAN[planKey];
            const moduleCount = modules.core.length + modules.included.length;

            return (
              <Card key={planKey} className={`group hover:shadow-2xl transition-all flex flex-col ${
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
                  <div className="flex items-center justify-center mb-2">
                    <PlanIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xl mb-1 text-gray-900 text-center">{plan.name}</CardTitle>
                  
                  {/* Precio */}
                  <div className="space-y-1 text-center">
                    <div>
                      <span className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        €{plan.monthlyPrice}
                      </span>
                      <span className="text-gray-500 text-sm">/mes</span>
                    </div>
                    <div className="text-xs text-green-600 font-semibold">
                      €{plan.annualPrice}/año · Ahorra 2 meses
                    </div>
                  </div>

                  {/* Propiedades y Límites */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Propiedades:</span>
                      <Badge variant="secondary" className="font-semibold">
                        {plan.maxProperties === 'unlimited' ? 'Ilimitadas' : `Hasta ${plan.maxProperties}`}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Usuarios:</span>
                      <Badge variant="secondary" className="font-semibold">
                        {plan.maxUsers === 'unlimited' ? 'Ilimitados' : plan.maxUsers}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Módulos:</span>
                      <Badge className={`font-semibold ${planKey === 'enterprise' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {planKey === 'enterprise' ? 'Todos' : moduleCount}
                      </Badge>
                    </div>
                  </div>

                  {/* Highlight */}
                  <div className="mt-3 p-2 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg border border-indigo-100">
                    <div className="text-sm text-indigo-700 font-semibold text-center">
                      {plan.description}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex-1">
                  {/* Features */}
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-gray-700">
                        {plan.signaturesIncluded === 'unlimited' ? 'Firmas ilimitadas' : `${plan.signaturesIncluded} firmas/mes`}
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{plan.storageIncluded} almacenamiento</span>
                    </li>
                    {planKey === 'enterprise' && (
                      <>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-gray-700">Todos los add-ons incluidos</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-gray-700">White-label completo</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-gray-700">SLA 99.9% garantizado</span>
                        </li>
                      </>
                    )}
                    {modules.addon.length > 0 && planKey !== 'enterprise' && (
                      <li className="flex items-start gap-2 text-sm">
                        <Layers className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-xs">
                          +{modules.addon.length} módulos disponibles como add-on
                        </span>
                      </li>
                    )}
                  </ul>
                </CardContent>

                {/* CTA */}
                <CardFooter className="mt-auto">
                  <Link href={planKey === 'enterprise' ? '/landing/contacto' : '/register'} className="w-full block">
                    <Button 
                      className="w-full font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
                    >
                      {planKey === 'enterprise' ? 'Contactar ventas' : 'Probar 30 días gratis'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Add-ons Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <Badge className="mb-3 bg-white text-gray-900 border-2 border-purple-400 font-bold shadow-sm">
              <Zap className="h-3 w-3 mr-1 inline text-purple-600" />
              Módulos Add-on
            </Badge>
            <h3 className="text-2xl font-bold text-gray-800">
              ¿Necesitas más funcionalidades?
            </h3>
            <p className="text-gray-600 mt-2">
              Activa módulos premium según tus necesidades. <span className="text-indigo-600 font-medium">Incluidos en Enterprise.</span>
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {ADD_ONS_DESTACADOS.map((addon) => (
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
          
          <div className="text-center mt-6">
            <Link href="/landing/precios">
              <Button variant="outline" className="font-semibold">
                Ver todos los add-ons
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabla Comparativa */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 px-6 rounded-t-xl">
            <h3 className="text-2xl font-bold text-center">
              ¿Por qué elegir INMOVA?
            </h3>
          </div>
          <div className="bg-white rounded-b-xl shadow-lg overflow-hidden border border-t-0">
            <table className="w-full">
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

        {/* CTA Final */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-700 mb-4">
            ¿Más de 100 propiedades? ¿Necesitas personalización?
          </p>
          <Link href="/landing/demo">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-lg">
              Solicitar Demo Personalizada
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
