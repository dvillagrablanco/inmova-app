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
    id: 'flipping26',
    code: 'FLIPPING26',
    title: 'Adiós al Excel',
    subtitle: '40% de descuento durante 6 meses',
    description: 'Deja de perder dinero en tus reformas. Controla tu ROI en tiempo real. Ideal para inversores y house flippers.',
    icon: <Sparkles className="h-8 w-8" />,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    price: {
      original: '€49',
      discounted: '€29',
      period: '/mes'
    },
    benefits: [
      'Control de ROI en tiempo real',
      'Gestión de reformas y costes',
      'Análisis de rentabilidad',
      'Comparativa de proyectos',
      'Informes automatizados',
      'Soporte prioritario 6 meses'
    ],
    validUntil: '31 de Marzo 2026',
    ctaText: 'Activar descuento',
    ctaHref: '/register?coupon=FLIPPING26'
  },
  {
    id: 'roompro',
    code: 'ROOMPRO26',
    title: 'Revolución Coliving',
    subtitle: '50% dto. primer mes + Migración gratis',
    description: 'Gestiona tus espacios coliving de forma automática. Reparto de gastos, facturación y comunicación con inquilinos.',
    icon: <TrendingUp className="h-8 w-8" />,
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    price: {
      original: '€99',
      discounted: '€49',
      period: 'primer mes'
    },
    benefits: [
      'Reparto automático de gastos',
      'Facturación de suministros',
      'Portal del inquilino',
      'Migración de datos GRATIS',
      'Room Rental PRO incluido',
      'Onboarding personalizado'
    ],
    validUntil: '31 de Marzo 2026',
    ctaText: 'Activar oferta',
    ctaHref: '/register?coupon=ROOMPRO26'
  },
  {
    id: 'switch2026',
    code: 'SWITCH2026',
    title: 'Cambia y Ahorra',
    subtitle: 'Igualamos tu precio + Upgrade gratis',
    description: '¿Usas otra plataforma? Trae tu última factura y te damos INMOVA al mismo precio con el plan superior.',
    icon: <ArrowRightLeft className="h-8 w-8" />,
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    price: {
      original: 'Tu precio actual',
      discounted: 'Igualado',
      period: '1 año'
    },
    benefits: [
      'Igualamos el precio de tu competidor',
      'Plan superior incluido',
      'Migración completa de datos',
      '7 verticales vs 1 de la competencia',
      '15 módulos transversales',
      'Soporte dedicado en la transición'
    ],
    validUntil: '31 de Marzo 2026',
    ctaText: 'Solicitar cambio',
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
              <Card key={oferta.id} className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-indigo-300">
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
                  {/* Precio */}
                  <div className="text-center py-6 border-b mb-6">
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-2xl text-gray-400 line-through">{oferta.price.original}</span>
                      <span className="text-4xl font-black text-gray-900">{oferta.price.discounted}</span>
                    </div>
                    <span className="text-gray-500">{oferta.price.period}</span>
                  </div>

                  {/* Descripción */}
                  <p className="text-gray-600 mb-6">{oferta.description}</p>

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
