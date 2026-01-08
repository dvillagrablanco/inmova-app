'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/landing/sections/Navigation';
import { Footer } from '@/components/landing/sections/Footer';
import { 
  Sparkles, 
  TrendingUp, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  Gift,
  ArrowRight,
  Percent
} from 'lucide-react';

const ofertas = [
  {
    id: 'starter26',
    code: 'STARTER26',
    title: '¡Empieza a €17/mes!',
    subtitle: 'Plan Starter al 50% durante 3 meses',
    description: 'Perfecto para pequeños propietarios y house flippers. Gestión profesional de hasta 5 propiedades con todas las herramientas esenciales.',
    icon: <Sparkles className="h-8 w-8" />,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    price: {
      original: '€35',
      discounted: '€17',
      period: '/mes (3 meses)'
    },
    savings: 'Ahorras €54',
    planName: 'Plan Starter',
    planFeatures: '1-5 propiedades • 1 vertical • Contratos digitales',
    benefits: [
      'Gestión completa de propiedades',
      'Contratos digitales y firma online',
      'Portal de inquilinos incluido',
      'Cobros automáticos y recordatorios',
      'Dashboard con métricas',
      'Soporte por email'
    ],
    validUntil: '31 de Marzo 2026',
    ctaText: 'Activar 50% dto.',
    ctaHref: '/register?coupon=STARTER26&plan=starter'
  },
  {
    id: 'coliving26',
    code: 'COLIVING26',
    title: 'Coliving Sin Complicaciones',
    subtitle: 'Primer mes GRATIS + 20% dto. 6 meses',
    description: 'El plan Professional perfecto para gestores de coliving. Prorrateo automático de suministros, contratos flexibles y portal de residentes.',
    icon: <TrendingUp className="h-8 w-8" />,
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    price: {
      original: '€59',
      discounted: '€0',
      period: 'primer mes'
    },
    savings: 'Ahorras €130+',
    planName: 'Plan Professional',
    planFeatures: '6-25 propiedades • 3 verticales • IA incluida',
    benefits: [
      'Prorrateo automático de suministros',
      'Facturación individual por habitación',
      'Portal de residentes avanzado',
      'Migración de datos GRATIS',
      'Contratos flexibles (1-12 meses)',
      'Onboarding personalizado 1:1'
    ],
    validUntil: '31 de Marzo 2026',
    ctaText: 'Empezar GRATIS',
    ctaHref: '/register?coupon=COLIVING26&plan=professional'
  },
  {
    id: 'switch26',
    code: 'SWITCH26',
    title: 'Cambia y Ahorra',
    subtitle: 'Igualamos precio + Plan superior incluido',
    description: '¿Pagas por otra plataforma? Trae tu factura y te damos INMOVA al mismo precio pero con el plan superior. Más funcionalidades por el mismo dinero.',
    icon: <ArrowRightLeft className="h-8 w-8" />,
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    price: {
      original: 'Tu precio',
      discounted: 'Igualado',
      period: '12 meses'
    },
    savings: 'Plan superior GRATIS',
    planName: 'Upgrade garantizado',
    planFeatures: '7 verticales • 15 módulos • Sin límites ocultos',
    benefits: [
      'Igualamos tu precio actual 12 meses',
      'Upgrade al plan superior gratis',
      'Migración completa de datos',
      '7 verticales vs 1 de competencia',
      '15 módulos transversales',
      'Soporte dedicado en transición'
    ],
    validUntil: '31 de Marzo 2026',
    ctaText: 'Solicitar Cambio',
    ctaHref: '/landing/contacto?motivo=cambio-competencia'
  }
];

export default function OfertasPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300 px-4 py-2">
            <Gift className="h-4 w-4 mr-2 inline" />
            Ofertas Exclusivas 2026
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-gray-900 via-indigo-800 to-violet-900 bg-clip-text text-transparent">
            Promociones Especiales
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Aprovecha nuestras ofertas exclusivas para empezar con INMOVA. 
            Descuentos reales, sin letra pequeña.
          </p>
        </div>
      </section>

      {/* Ofertas Grid */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {ofertas.map((oferta) => (
              <Card id={oferta.id} key={oferta.id} className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-indigo-300 scroll-mt-24">
                {/* Gradient Header */}
                <div className={`bg-gradient-to-r ${oferta.gradient} p-6 text-white`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      {oferta.icon}
                    </div>
                    <Badge className="bg-white/30 text-white border-white/50">
                      Código: {oferta.code}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-black mb-2">{oferta.title}</h2>
                  <p className="text-white/90 font-semibold">{oferta.subtitle}</p>
                </div>

                <CardContent className="p-6">
                  {/* Precio y Ahorro */}
                  <div className="text-center py-4 border-b mb-4">
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-2xl text-gray-400 line-through">{oferta.price.original}</span>
                      <span className="text-4xl font-black text-gray-900">{oferta.price.discounted}</span>
                    </div>
                    <span className="text-gray-500">{oferta.price.period}</span>
                    {oferta.savings && (
                      <div className="mt-2">
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          🎁 {oferta.savings}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Plan incluido */}
                  {oferta.planName && (
                    <div className="bg-indigo-50 rounded-lg p-3 mb-4 text-center">
                      <p className="text-sm font-bold text-indigo-800">{oferta.planName}</p>
                      <p className="text-xs text-indigo-600">{oferta.planFeatures}</p>
                    </div>
                  )}

                  {/* Descripción */}
                  <p className="text-gray-600 mb-4 text-sm">{oferta.description}</p>

                  {/* Beneficios */}
                  <ul className="space-y-3 mb-6">
                    {oferta.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Validez */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Clock className="h-4 w-4" />
                    <span>Válido hasta: {oferta.validUntil}</span>
                  </div>

                  {/* CTA */}
                  <Link href={oferta.ctaHref}>
                    <Button className={`w-full bg-gradient-to-r ${oferta.gradient} text-white font-bold py-6 text-lg hover:opacity-90`}>
                      {oferta.ctaText}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparativa de Precios */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Precios Normales vs Ofertas
          </h2>
          <p className="text-gray-600 text-center mb-10">
            Compara cuánto ahorras con nuestras promociones especiales
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-amber-200 bg-amber-50/50">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">Plan Starter</h3>
                <p className="text-gray-500 text-sm mb-4">1-5 propiedades</p>
                <div className="mb-4">
                  <span className="text-gray-400 line-through text-xl">€35/mes</span>
                  <div className="text-3xl font-black text-amber-600">€17/mes</div>
                  <span className="text-sm text-amber-700">3 primeros meses</span>
                </div>
                <Badge className="bg-amber-200 text-amber-800">STARTER26</Badge>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">Plan Professional</h3>
                <p className="text-gray-500 text-sm mb-4">6-25 propiedades</p>
                <div className="mb-4">
                  <span className="text-gray-400 line-through text-xl">€59/mes</span>
                  <div className="text-3xl font-black text-green-600">€0 1er mes</div>
                  <span className="text-sm text-green-700">+ €47/mes (6 meses)</span>
                </div>
                <Badge className="bg-green-200 text-green-800">COLIVING26</Badge>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-indigo-200 bg-indigo-50/50">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">Migración</h3>
                <p className="text-gray-500 text-sm mb-4">Desde competencia</p>
                <div className="mb-4">
                  <span className="text-gray-400 text-xl">Tu precio</span>
                  <div className="text-3xl font-black text-indigo-600">Igualado</div>
                  <span className="text-sm text-indigo-700">+ Plan superior gratis</span>
                </div>
                <Badge className="bg-indigo-200 text-indigo-800">SWITCH26</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="container mx-auto text-center text-white">
          <Percent className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Tienes dudas sobre las ofertas?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Contáctanos y te ayudamos a elegir la mejor opción para tu negocio.
          </p>
          <Link href="/landing/contacto">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-bold px-8 py-6 text-lg">
              Contactar con Ventas
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
