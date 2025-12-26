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
    name: 'María García',
    role: 'Fundadora',
    company: 'CoLiving Barcelona',
    vertical: 'Coliving',
    avatar: '/testimonials/maria-garcia.jpg',
    rating: 5,
    quote:
      'Antes tardábamos 8 horas al mes calculando el prorrateo de luz, agua y gas para 25 habitaciones. Con Room Rental PRO de INMOVA, son literalmente 3 clics y está todo hecho. Los inquilinos reciben su factura individualizada automáticamente. Un cambio de juego total.',
    stats: [
      { metric: 'Tiempo ahorrado', value: '8h/mes' },
      { metric: 'Habitaciones', value: '25' },
      { metric: 'Satisfacción', value: '98%' },
    ],
    highlight: 'Ahorra 8h/mes en cálculos manuales',
  },
  {
    id: '2',
    name: 'Javier Martínez',
    role: 'Director de Operaciones',
    company: 'Student Housing Madrid',
    vertical: 'Residencia Estudiantil',
    avatar: '/testimonials/javier-martinez.jpg',
    rating: 5,
    quote:
      'Gestionamos 3 residencias con 150 habitaciones en total. El dashboard de Room Rental PRO nos da visibilidad instantánea de ocupación, vencimientos de contratos y alertas. Hemos reducido la tasa de impagos un 35% gracias al sistema de seguimiento automatizado.',
    stats: [
      { metric: 'Habitaciones', value: '150' },
      { metric: 'Impagos', value: '-35%' },
      { metric: 'Residencias', value: '3' },
    ],
    highlight: 'Redujo impagos en 35%',
  },
  {
    id: '3',
    name: 'Laura Sánchez',
    role: 'Directora de Marketing',
    company: 'Inmobiliaria del Sur',
    vertical: 'Agencia Inmobiliaria',
    avatar: '/testimonials/laura-sanchez.jpg',
    rating: 5,
    quote:
      'El Sistema de Cupones de INMOVA nos permitió lanzar una campaña "Primer mes 50% OFF" en 10 minutos. Antes, teníamos que hacerlo manualmente con Excel y llamadas. Resultado: +42% de leads convertidos y ROI de 5x en la primera campaña.',
    stats: [
      { metric: 'Leads convertidos', value: '+42%' },
      { metric: 'ROI', value: '5x' },
      { metric: 'Setup', value: '10min' },
    ],
    highlight: '+42% conversión con cupones',
  },
  {
    id: '4',
    name: 'Carlos Ruiz',
    role: 'Gestor de Propiedades',
    company: 'Urban Coliving Valencia',
    vertical: 'Coliving',
    avatar: '/testimonials/carlos-ruiz.jpg',
    rating: 5,
    quote:
      'Las reglas de co-living personalizables son oro puro. Definimos horarios de limpieza, turnos de cocina, política de visitas... todo en el sistema. Los inquilinos lo ven en su app y las fricciones desaparecieron. La satisfacción subió de 6.5/10 a 9.2/10.',
    stats: [
      { metric: 'Satisfacción', value: '9.2/10' },
      { metric: 'Fricciones', value: '-70%' },
      { metric: 'Retention', value: '+25%' },
    ],
    highlight: 'Satisfacción de 6.5 a 9.2/10',
  },
  {
    id: '5',
    name: 'Ana Torres',
    role: 'CEO',
    company: 'Flex Living Group',
    vertical: 'Coliving',
    avatar: '/testimonials/ana-torres.jpg',
    rating: 5,
    quote:
      'Migrar desde nuestra solución anterior fue increíblemente fácil. El equipo de INMOVA nos ayudó a importar 80 habitaciones, 50 inquilinos y 2 años de historial de pagos en una tarde. Room Rental PRO nos permite escalar sin contratar más personal administrativo.',
    stats: [
      { metric: 'Migración', value: '1 tarde' },
      { metric: 'Habitaciones', value: '80' },
      { metric: 'Escalabilidad', value: '∞' },
    ],
    highlight: 'Escala sin más personal',
  },
  {
    id: '6',
    name: 'Pedro López',
    role: 'Fundador',
    company: 'Promotora Montaña',
    vertical: 'Promotora',
    avatar: '/testimonials/pedro-lopez.jpg',
    rating: 5,
    quote:
      'Usamos el módulo de Construcción y cuando terminamos la obra, activamos Room Rental PRO para comercializar habitaciones individuales. Todo en la misma plataforma. De obra a ingresos recurrentes sin cambiar de sistema. Brillante.',
    stats: [
      { metric: 'Proyectos', value: '4' },
      { metric: 'Hab. vendidas', value: '95%' },
      { metric: 'Time to market', value: '-40%' },
    ],
    highlight: 'De obra a ingresos en un sistema',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-white via-indigo-50 to-purple-50">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-200 px-4 py-2">
            <Star className="h-4 w-4 mr-1 inline fill-yellow-500" />
            Testimonios Verificados
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Lo que Dicen Nuestros Clientes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Historias reales de gestoras, agencias y operadores de coliving que transformaron su
            negocio con INMOVA
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-indigo-300 relative"
            >
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
            <div className="text-4xl font-black text-indigo-600 mb-2">500+</div>
            <div className="text-gray-600 font-semibold">Empresas Confían en INMOVA</div>
          </div>
          <div className="p-6">
            <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-4xl font-black text-green-600 mb-2">10,000+</div>
            <div className="text-gray-600 font-semibold">Propiedades Gestionadas</div>
          </div>
          <div className="p-6">
            <div className="inline-flex p-4 bg-yellow-100 rounded-full mb-4">
              <Star className="h-8 w-8 text-yellow-600 fill-yellow-600" />
            </div>
            <div className="text-4xl font-black text-yellow-600 mb-2">4.9/5</div>
            <div className="text-gray-600 font-semibold">Valoración Promedio</div>
          </div>
        </div>
      </div>
    </section>
  );
}
