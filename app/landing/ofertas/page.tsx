'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  Percent,
  Brain,
  Zap,
} from 'lucide-react';

const ofertas = [
  {
    id: 'launch2026',
    code: 'LAUNCH2026',
    title: '🚀 50% de Descuento',
    subtitle: 'Cualquier plan al 50% los 3 primeros meses',
    icon: <Sparkles className="h-8 w-8" />,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    prices: [
      { plan: 'Starter', original: '€89', discounted: '€44,50', savings: '€133,50' },
      { plan: 'Profesional', original: '€199', discounted: '€99,50', savings: '€298,50' },
      { plan: 'Empresarial', original: '€499', discounted: '€249,50', savings: '€748,50' },
    ],
    duration: '3 meses',
    benefits: [
      '88+ módulos profesionales desde el primer día',
      'Onboarding con IA que configura todo por ti',
      'Cobro masivo, facturación automática, dashboard',
      '30 días gratis + 3 meses al 50%',
      'Sin permanencia, cancela cuando quieras',
    ],
    cta: 'Activar descuento',
    ctaHref: '/register?coupon=LAUNCH2026',
    expiry: '30 junio 2026',
    maxUsos: 500,
    highlight: true,
  },
  {
    id: 'ia-free',
    code: 'IAFREE2026',
    title: '🤖 Addon IA Gratis',
    subtitle: 'IA Inmobiliaria (€149/mes) gratis 2 meses',
    icon: <Brain className="h-8 w-8" />,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    prices: [
      { plan: 'Con cualquier plan', original: '€149', discounted: '€0', savings: '€298' },
    ],
    duration: '2 meses gratis',
    benefits: [
      'Valoración automática de inmuebles con IA',
      'Predicción de morosidad (anticipa impagos)',
      'Sugerencia de renta óptima por zona',
      'Detección de anomalías financieras',
      'Asistente IA conversacional avanzado',
    ],
    cta: 'Activar IA gratis',
    ctaHref: '/register?coupon=IAFREE2026',
    expiry: '30 junio 2026',
    maxUsos: 200,
  },
  {
    id: 'switch2026',
    code: 'SWITCH2026',
    title: '🔄 Migración + 30% Dto.',
    subtitle: 'Para clientes que vienen de otra plataforma',
    icon: <ArrowRightLeft className="h-8 w-8" />,
    gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
    prices: [
      { plan: 'Cualquier plan', original: 'Precio base', discounted: '-30%', savings: 'Hasta €1.797' },
    ],
    duration: '6 meses',
    benefits: [
      'Migración de datos 100% gratuita y asistida',
      '30% de descuento durante 6 meses completos',
      'Upgrade de plan incluido (te damos más por menos)',
      'Sin pérdida de información en la migración',
      'Soporte prioritario durante la transición',
    ],
    cta: 'Solicitar migración',
    ctaHref: '/landing/contacto?motivo=migracion',
    expiry: '31 diciembre 2026',
    maxUsos: 100,
  },
  {
    id: 'pack2026',
    code: 'PACK2026',
    title: '💎 Pack Completo 50% Off',
    subtitle: 'Los 5 addons premium al 50% el primer mes',
    icon: <Zap className="h-8 w-8" />,
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    prices: [
      { plan: 'Pack Completo', original: '€499', discounted: '€249', savings: '€250' },
    ],
    duration: '1er mes',
    benefits: [
      '🤖 IA Inmobiliaria: valoración, predicción, anomalías',
      '💼 Family Office 360°: patrimonio, PE, P&L sociedades',
      '⚡ Automatización Pro: SEPA, Zucchetti, escalado',
      '📈 Analytics Avanzado: yield, benchmark, fiscal',
      '🔧 Operaciones Pro: kanban, inspecciones, proveedores',
    ],
    cta: 'Activar Pack Completo',
    ctaHref: '/register?coupon=PACK2026',
    expiry: '30 junio 2026',
    maxUsos: 100,
  },
];

export default function OfertasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-amber-500 to-red-500 text-white border-0 text-sm px-4 py-1.5">
              <Gift className="h-4 w-4 mr-1.5" />
              Ofertas de Lanzamiento 2026
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Ofertas Exclusivas de Lanzamiento
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Celebramos el lanzamiento de INMOVA con descuentos especiales.{' '}
              <strong>88+ módulos, 7 verticales, IA predictiva</strong> — al mejor precio.
            </p>
          </div>

          {/* Urgency bar */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl p-4 mb-10 text-center">
            <p className="flex items-center justify-center gap-2 font-semibold">
              <Clock className="h-5 w-5" />
              Oferta limitada — Plazas limitadas por cupón. ¡No te lo pierdas!
            </p>
          </div>

          {/* Ofertas grid */}
          <div className="grid gap-8 md:grid-cols-2">
            {ofertas.map((oferta) => (
              <Card
                key={oferta.id}
                id={oferta.id}
                className={`overflow-hidden transition-all hover:shadow-2xl ${
                  oferta.highlight ? 'md:col-span-2 ring-2 ring-amber-400' : ''
                }`}
              >
                {/* Header gradient */}
                <div className={`bg-gradient-to-r ${oferta.gradient} p-6 text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {oferta.icon}
                        <h2 className="text-2xl font-bold">{oferta.title}</h2>
                      </div>
                      <p className="text-white/90 text-lg">{oferta.subtitle}</p>
                    </div>
                    <Badge className="bg-white/20 text-white border-0 text-sm">
                      Código: {oferta.code}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6 space-y-5">
                  {/* Prices */}
                  <div className={`grid gap-3 ${oferta.prices.length > 1 ? 'md:grid-cols-3' : ''}`}>
                    {oferta.prices.map((price, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">{price.plan}</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-gray-400 line-through text-sm">{price.original}</span>
                          <span className="text-2xl font-bold text-green-600">{price.discounted}</span>
                        </div>
                        <p className="text-xs text-green-600 font-medium mt-1">Ahorras {price.savings}</p>
                      </div>
                    ))}
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Duración: <strong>{oferta.duration}</strong></span>
                    <span className="mx-2">·</span>
                    <span>Válido hasta: <strong>{oferta.expiry}</strong></span>
                    <span className="mx-2">·</span>
                    <span>Máx. {oferta.maxUsos} usos</span>
                  </div>

                  {/* Benefits */}
                  <ul className="space-y-2">
                    {oferta.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Link href={oferta.ctaHref} className="w-full">
                    <Button size="lg" className={`w-full bg-gradient-to-r ${oferta.gradient} text-white shadow-lg hover:opacity-90`}>
                      {oferta.cta}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* FAQ rápida */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">Preguntas Frecuentes</h3>
            <div className="space-y-4">
              {[
                { q: '¿Puedo combinar cupones?', a: 'Los cupones de planes base no se combinan entre sí, pero sí puedes usar un cupón de plan + un cupón de addon (ej: LAUNCH2026 + IAFREE2026).' },
                { q: '¿Qué pasa cuando termina la oferta?', a: 'Continúas con el precio normal del plan. Sin sorpresas ni cargos ocultos. Puedes cancelar en cualquier momento.' },
                { q: '¿La prueba de 30 días es aparte?', a: 'Sí. Primero disfrutas 30 días gratis completos, y después se aplica el descuento del cupón durante los meses indicados.' },
                { q: '¿Cómo uso el cupón?', a: 'Al registrarte, introduce el código del cupón en el campo "Código promocional". Se aplica automáticamente al pago.' },
              ].map((faq, i) => (
                <div key={i} className="bg-white rounded-lg p-5 border">
                  <p className="font-semibold mb-1">{faq.q}</p>
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA final */}
          <div className="mt-16 text-center">
            <p className="text-lg text-gray-600 mb-4">¿No estás seguro? Prueba gratis 30 días sin compromiso.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg">
                  Empezar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/landing/contacto">
                <Button size="lg" variant="outline">
                  Hablar con Ventas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
