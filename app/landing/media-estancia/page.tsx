import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/landing/sections/Navigation';
import { Footer } from '@/components/landing/sections/Footer';
import {
  Calendar,
  FileCheck,
  Shield,
  Users,
  TrendingUp,
  Globe,
  Brain,
  CheckCircle,
  ArrowRight,
  Zap,
  Clock,
  Home,
  CreditCard,
  BarChart3,
  Bell,
  Briefcase,
  GraduationCap,
  Plane,
  Heart,
  Building2,
  PenTool,
  CalendarCheck,
  Euro,
  FileText,
  RefreshCw,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Media Estancia (1-11 meses) | Inmova - Gestión de Alquiler Temporal',
  description:
    'Plataforma especializada en alquiler de media estancia (1-11 meses). Contratos LAU, scoring de inquilinos con IA, check-in digital y publicación multi-portal. Ideal para profesionales, estudiantes y nómadas digitales.',
  keywords: [
    'alquiler media estancia',
    'alquiler temporal',
    '1-11 meses',
    'contratos temporales',
    'LAU Art 3.2',
    'nómadas digitales',
    'alquiler profesionales',
    'gestión alquiler temporal',
  ],
  openGraph: {
    title: 'Media Estancia | Inmova - Alquiler Temporal Profesional',
    description:
      'Gestión integral de alquileres de 1 a 11 meses. Contratos legales, scoring IA, pagos automáticos.',
    url: 'https://inmovaapp.com/landing/media-estancia',
    images: [
      {
        url: 'https://inmovaapp.com/og-media-estancia.jpg',
        width: 1200,
        height: 630,
        alt: 'Inmova Media Estancia',
      },
    ],
  },
};

// Características principales
const features = [
  {
    icon: FileText,
    title: 'Contratos LAU Art. 3.2',
    description:
      'Contratos de arrendamiento por temporada 100% legales con cláusulas específicas para media estancia.',
    benefits: ['Cumplimiento legal automático', 'Motivo de temporalidad documentado', 'Firma digital integrada'],
  },
  {
    icon: Brain,
    title: 'Scoring de Inquilinos IA',
    description:
      'Evaluación automática del riesgo de cada solicitante con inteligencia artificial.',
    benefits: ['Puntuación 0-100', 'Verificación documental', 'Análisis de solvencia'],
  },
  {
    icon: CalendarCheck,
    title: 'Check-in/Out Digital',
    description:
      'Proceso completo de entrada y salida digitalizado con inventario fotográfico.',
    benefits: ['Self check-in con código', 'Inventario con fotos', 'Firma digital del acta'],
  },
  {
    icon: Globe,
    title: 'Multi-Portal',
    description:
      'Publica automáticamente en los principales portales de alquiler temporal.',
    benefits: ['Spotahome, HousingAnywhere', 'Sincronización de calendarios', 'Contenido multi-idioma'],
  },
  {
    icon: Euro,
    title: 'Pricing Dinámico IA',
    description:
      'Optimiza tus precios según la demanda, temporada y competencia con IA.',
    benefits: ['+15-25% ingresos', 'Análisis de mercado', 'Ajuste automático'],
  },
  {
    icon: RefreshCw,
    title: 'Renovaciones Automáticas',
    description:
      'Gestión inteligente de renovaciones con propuestas automáticas y addendums.',
    benefits: ['Alertas anticipadas', 'Propuestas automáticas', 'Addendums con firma digital'],
  },
];

// Público objetivo
const targetAudience = [
  {
    icon: Briefcase,
    title: 'Profesionales Desplazados',
    description: 'Trabajadores con proyectos temporales en otras ciudades',
    percentage: 42,
  },
  {
    icon: GraduationCap,
    title: 'Estudiantes',
    description: 'Másters, intercambios, prácticas profesionales',
    percentage: 28,
  },
  {
    icon: Plane,
    title: 'Nómadas Digitales',
    description: 'Remote workers que buscan flexibilidad',
    percentage: 18,
  },
  {
    icon: Heart,
    title: 'Tratamientos Médicos',
    description: 'Estancias por motivos de salud o cuidado familiar',
    percentage: 12,
  },
];

// Ventajas vs alquiler tradicional
const vsTraditional = [
  { feature: 'Duración del contrato', traditional: '1-5 años', mediaEstancia: '1-11 meses' },
  { feature: 'Flexibilidad', traditional: 'Baja', mediaEstancia: 'Alta' },
  { feature: 'Renta mensual', traditional: 'Estándar', mediaEstancia: '+15-30% premium' },
  { feature: 'Rotación inquilinos', traditional: 'Baja', mediaEstancia: 'Media' },
  { feature: 'Perfil inquilino', traditional: 'Familias, largo plazo', mediaEstancia: 'Profesionales, estudiantes' },
  { feature: 'Gestión requerida', traditional: 'Mínima', mediaEstancia: 'Profesional' },
  { feature: 'Check-in/out', traditional: 'Simple', mediaEstancia: 'Con inventario' },
  { feature: 'Marco legal', traditional: 'LAU Art. 2', mediaEstancia: 'LAU Art. 3.2' },
];

// Módulos incluidos
const modules = [
  { icon: FileCheck, name: 'Contratos legales', included: true },
  { icon: PenTool, name: 'Firma digital', included: true },
  { icon: Shield, name: 'Scoring inquilinos', included: true },
  { icon: Calendar, name: 'Calendario ocupación', included: true },
  { icon: Globe, name: 'Multi-portal', included: true },
  { icon: Brain, name: 'Pricing IA', included: true },
  { icon: Bell, name: 'Notificaciones auto', included: true },
  { icon: CreditCard, name: 'Pagos Stripe', included: true },
  { icon: Home, name: 'Check-in digital', included: true },
  { icon: BarChart3, name: 'Analytics avanzados', included: true },
  { icon: RefreshCw, name: 'Renovaciones auto', included: true },
  { icon: FileText, name: 'Informes fiscales', included: true },
];

// Testimonios
const testimonials = [
  {
    quote:
      'Gestiono 15 apartamentos de media estancia y antes era un caos. Con Inmova tengo todo centralizado: contratos, check-ins, pagos. Me ahorro 20 horas a la semana.',
    author: 'María García',
    role: 'Property Manager, Madrid',
    image: '/testimonials/maria.jpg',
  },
  {
    quote:
      'El scoring de inquilinos es increíble. Ya no tengo que adivinar si un solicitante es fiable. El sistema me da toda la información que necesito para decidir.',
    author: 'Carlos Rodríguez',
    role: 'Propietario, 8 propiedades en Barcelona',
    image: '/testimonials/carlos.jpg',
  },
];

export default function MediaEstanciaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-3 text-base">
              <Calendar className="h-5 w-5 mr-2 inline" />
              NUEVO VERTICAL 2026
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                Media Estancia
              </span>
              <br />
              <span className="text-gray-800 text-4xl md:text-5xl">Alquiler de 1 a 11 meses</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              La plataforma más completa para gestionar alquileres temporales. Contratos legales,
              scoring de inquilinos con IA, check-in digital y publicación en los principales
              portales especializados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
                  <Zap className="h-5 w-5 mr-2" />
                  Empezar Gratis
                </Button>
              </Link>
              <Link href="/landing/demo">
                <Button size="lg" variant="outline">
                  Ver Demo
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <Card className="text-center border-2 border-teal-200">
              <CardContent className="pt-6">
                <div className="text-4xl font-black text-teal-600 mb-1">+25%</div>
                <div className="text-sm text-gray-600">Rentabilidad vs tradicional</div>
              </CardContent>
            </Card>
            <Card className="text-center border-2 border-teal-200">
              <CardContent className="pt-6">
                <div className="text-4xl font-black text-teal-600 mb-1">400+</div>
                <div className="text-sm text-gray-600">Propiedades gestionadas</div>
              </CardContent>
            </Card>
            <Card className="text-center border-2 border-teal-200">
              <CardContent className="pt-6">
                <div className="text-4xl font-black text-teal-600 mb-1">95%</div>
                <div className="text-sm text-gray-600">Ocupación media</div>
              </CardContent>
            </Card>
            <Card className="text-center border-2 border-teal-200">
              <CardContent className="pt-6">
                <div className="text-4xl font-black text-teal-600 mb-1">4.8</div>
                <div className="text-sm text-gray-600">Valoración inquilinos</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Todo lo que necesitas para Media Estancia
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Funcionalidades específicas diseñadas para la gestión profesional de alquileres temporales
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card key={i} className="hover:shadow-xl transition-all border-2 hover:border-teal-200">
                  <CardHeader>
                    <div className="bg-gradient-to-br from-teal-500 to-emerald-500 p-4 rounded-xl w-fit mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-teal-600 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">¿Quién alquila Media Estancia?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Un mercado en crecimiento con perfiles de alto poder adquisitivo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {targetAudience.map((audience, i) => {
              const Icon = audience.icon;
              return (
                <Card key={i} className="text-center hover:shadow-xl transition-all">
                  <CardContent className="pt-8">
                    <div className="bg-gradient-to-br from-teal-100 to-emerald-100 p-4 rounded-full w-fit mx-auto mb-4">
                      <Icon className="h-10 w-10 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{audience.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{audience.description}</p>
                    <div className="text-3xl font-black text-teal-600">{audience.percentage}%</div>
                    <p className="text-xs text-gray-500">del mercado</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Media Estancia vs Alquiler Tradicional</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Más rentabilidad, más flexibilidad, más gestión profesional
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left font-semibold">Característica</th>
                    <th className="px-6 py-4 text-center font-semibold">Tradicional</th>
                    <th className="px-6 py-4 text-center font-semibold bg-teal-50 text-teal-700">
                      Media Estancia
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vsTraditional.map((row, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 font-medium">{row.feature}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{row.traditional}</td>
                      <td className="px-6 py-4 text-center bg-teal-50 text-teal-700 font-medium">
                        {row.mediaEstancia}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">12 Módulos Incluidos</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Todo lo que necesitas en un solo plan, sin extras ni sorpresas
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {modules.map((module, i) => {
              const Icon = module.icon;
              return (
                <Card key={i} className="hover:shadow-lg transition-all">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="bg-teal-100 p-2 rounded-lg">
                      <Icon className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{module.name}</p>
                      <Badge variant="secondary" className="text-xs mt-1">Incluido</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Lo que dicen nuestros usuarios</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="hover:shadow-xl transition-all">
                <CardContent className="p-8">
                  <p className="text-lg text-gray-700 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.author[0]}
                    </div>
                    <div>
                      <p className="font-bold">{testimonial.author}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-teal-600 via-emerald-600 to-green-600 border-0 text-white overflow-hidden">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-4xl font-bold mb-4">
                Comienza a gestionar Media Estancia hoy
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                30 días gratis. Sin tarjeta. Acceso completo a todos los módulos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100">
                    <Zap className="h-5 w-5 mr-2" />
                    Empezar Gratis
                  </Button>
                </Link>
                <Link href="/landing/contacto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/20"
                  >
                    Hablar con Ventas
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm opacity-75">
                ✓ Setup en 10 minutos · ✓ Soporte 24/7 · ✓ Cancela cuando quieras
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  );
}
