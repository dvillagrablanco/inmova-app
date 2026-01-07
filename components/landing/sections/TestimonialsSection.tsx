'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Quote, Building2, Users, TrendingUp } from 'lucide-react';
import Image from 'next/image';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  vertical: string;
  avatar: string;
  rating: number;
  quote: string;
  stats?: {
    metric: string;
    value: string;
  }[];
  highlight?: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'María G.',
    role: 'Propietaria',
    company: '8 propiedades en Barcelona',
    vertical: 'Alquiler',
    avatar: '/testimonials/maria-garcia.jpg',
    rating: 5,
    quote: 'Pasé de gestionar todo con Excel y WhatsApp a tener todo organizado en un solo lugar. Los recordatorios automáticos de cobro me han ahorrado muchos dolores de cabeza.',
    stats: [
      { metric: 'Propiedades', value: '8' },
      { metric: 'Tiempo ahorrado', value: '5h/sem' }
    ],
    highlight: 'Todo en un solo lugar'
  },
  {
    id: '2',
    name: 'Javier M.',
    role: 'Gestor Inmobiliario',
    company: 'Gestiones Madrid',
    vertical: 'Gestión',
    avatar: '/testimonials/javier-martinez.jpg',
    rating: 5,
    quote: 'Mis clientes propietarios ahora pueden ver sus informes cuando quieran desde su portal. Ya no tengo que enviar emails con PDFs cada mes. Me ha liberado mucho tiempo.',
    stats: [
      { metric: 'Clientes', value: '25' },
      { metric: 'Propiedades', value: '120' }
    ],
    highlight: 'Portal de propietarios incluido'
  },
  {
    id: '3',
    name: 'Laura S.',
    role: 'Administradora',
    company: 'Coliving Valencia',
    vertical: 'Coliving',
    avatar: '/testimonials/laura-sanchez.jpg',
    rating: 5,
    quote: 'Gestionar 15 habitaciones con inquilinos diferentes era un caos. Ahora cada uno tiene su contrato, sus pagos y su comunicación independiente pero yo lo veo todo junto.',
    stats: [
      { metric: 'Habitaciones', value: '15' },
      { metric: 'Inquilinos', value: '15' }
    ],
    highlight: 'Gestión por habitación'
  },
  {
    id: '4',
    name: 'Carlos R.',
    role: 'Inversor',
    company: 'Cartera propia',
    vertical: 'Inversión',
    avatar: '/testimonials/carlos-ruiz.jpg',
    rating: 5,
    quote: 'El dashboard me da una visión clara de rentabilidad de cada propiedad. Antes tenía que hacer cálculos en Excel que siempre me quedaban desactualizados.',
    stats: [
      { metric: 'Propiedades', value: '12' },
      { metric: 'Ciudades', value: '3' }
    ],
    highlight: 'Rentabilidad en tiempo real'
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-white via-indigo-50 to-purple-50">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-white text-gray-900 border-2 border-amber-400 px-4 py-2 font-bold shadow-sm">
            <Star className="h-4 w-4 mr-1 inline fill-yellow-500 text-yellow-500" />
            Testimonios Verificados
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Lo que Dicen Nuestros Clientes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Historias reales de gestoras, agencias y operadores de coliving que transformaron su negocio con INMOVA
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-indigo-300 relative">
              {/* Badge de Vertical */}
              <div className="absolute -top-3 right-4">
                <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg">
                  {testimonial.vertical}
                </Badge>
              </div>

              <CardContent className="p-6 space-y-4">
                {/* Quote Icon */}
                <div className="flex justify-between items-start">
                  <Quote className="h-10 w-10 text-indigo-200" />
                  {/* Rating */}
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                </div>

                {/* Quote Text */}
                <p className="text-gray-700 leading-relaxed text-sm italic">
                  "{testimonial.quote}"
                </p>

                {/* Stats */}
                {testimonial.stats && (
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                    {testimonial.stats.map((stat, i) => (
                      <div key={i} className="text-center">
                        <div className="text-lg font-black text-indigo-600">{stat.value}</div>
                        <div className="text-xs text-gray-500 font-semibold">{stat.metric}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Highlight */}
                {testimonial.highlight && (
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="text-xs text-green-700 font-bold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {testimonial.highlight}
                    </div>
                  </div>
                )}

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-xs text-gray-500">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="inline-flex p-4 bg-indigo-100 rounded-full mb-4">
              <Building2 className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-2">30 días</div>
            <div className="text-gray-700 font-semibold">Prueba Gratis Sin Compromiso</div>
          </div>
          <div className="p-6">
            <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-4xl font-black text-green-600 mb-2">10 min</div>
            <div className="text-gray-600 font-semibold">Setup Inicial Promedio</div>
          </div>
          <div className="p-6">
            <div className="inline-flex p-4 bg-yellow-100 rounded-full mb-4">
              <Star className="h-8 w-8 text-yellow-600 fill-yellow-600" />
            </div>
            <div className="text-4xl font-black text-yellow-600 mb-2">24/7</div>
            <div className="text-gray-600 font-semibold">Soporte Disponible</div>
          </div>
        </div>
      </div>
    </section>
  );
}
