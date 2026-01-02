'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Home,
  Hotel,
  Hammer,
  Briefcase,
  TrendingUp,
  Leaf,
  ShoppingCart,
  DollarSign,
  Camera,
  Wifi,
  Link2,
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle,
  Shield,
  Users,
  FileCheck,
  Euro,
  Calendar,
  Gift,
  UserCheck,
  Building,
  GraduationCap,
  Landmark,
} from 'lucide-react';

const verticales = [
  {
    icon: Building2,
    title: 'Alquiler Tradicional',
    desc: 'Gestión completa de alquileres residenciales de largo plazo',
    features: ['Contratos', 'Pagos recurrentes', 'Portal inquilino', 'Alertas automáticas'],
    gradient: 'from-blue-500 to-cyan-500',
    color: 'blue',
  },
  {
    icon: Hotel,
    title: 'STR (Vacacional)',
    desc: 'Gestión profesional de alquileres vacacionales y corta estancia',
    features: ['Multi-canal', 'Reviews centralizadas', 'Auto check-in', 'Limpieza'],
    gradient: 'from-orange-500 to-amber-500',
    color: 'orange',
  },
  {
    icon: Home,
    title: 'Coliving / Habitaciones',
    desc: 'Gestión individual de habitaciones con espacios compartidos',
    features: ['Por habitación', 'Espacios comunes', 'Prorrateo', 'Matching IA'],
    gradient: 'from-purple-500 to-pink-500',
    color: 'purple',
  },
  {
    icon: TrendingUp,
    title: 'House Flipping',
    desc: 'Compra-reforma-venta con control total de ROI',
    features: ['Calculadora ROI/TIR', 'Timeline Gantt', 'Comparador', 'Presupuestos'],
    gradient: 'from-green-500 to-emerald-500',
    color: 'green',
  },
  {
    icon: Hammer,
    title: 'Construcción (eWoorker)',
    desc: 'Plataforma B2B para subcontratación segura en construcción',
    features: ['Compliance Ley 32/2006', 'Escrow de pagos', 'Marketplace obras', 'Libro digital'],
    gradient: 'from-orange-600 to-yellow-500',
    color: 'orange',
    badge: 'NUEVO',
    href: '/ewoorker-landing',
  },
  {
    icon: Briefcase,
    title: 'Servicios Profesionales',
    desc: 'Property management B2B para gestoras y agencias',
    features: ['CRM clientes', 'Facturación', 'Multi-cartera', 'Reporting'],
    gradient: 'from-indigo-500 to-violet-500',
    color: 'indigo',
  },
];

const modulosTransversales = [
  {
    icon: Shield,
    title: 'Módulo de Seguros',
    desc: 'Gestión completa de pólizas y siniestros',
    benefits: ['Alertas de vencimiento', 'Gestión de siniestros', 'Analytics avanzados'],
    gradient: 'from-blue-600 to-cyan-600',
    usedBy: 'Todos los verticales',
    badge: 'NUEVO',
  },
  {
    icon: Users,
    title: 'Programa de Partners',
    desc: 'Alianzas con bancos, aseguradoras y escuelas',
    benefits: ['Bancos hipotecarios', 'Aseguradoras', 'Escuelas de negocios'],
    gradient: 'from-purple-600 to-pink-600',
    usedBy: 'Todos los verticales',
    badge: 'NUEVO',
  },
  {
    icon: UserCheck,
    title: 'Gestión de Visitas',
    desc: 'Organiza visitas a propiedades con confirmaciones',
    benefits: ['Calendario integrado', 'Confirmaciones SMS', 'Seguimiento estado'],
    gradient: 'from-green-600 to-emerald-600',
    usedBy: 'Agentes, Gestores',
    badge: 'NUEVO',
  },
  {
    icon: Gift,
    title: 'Promociones y Cupones',
    desc: 'Sistema de descuentos y códigos promocionales',
    benefits: ['Descuentos fijos', 'Descuentos %', 'Validez temporal'],
    gradient: 'from-pink-600 to-rose-600',
    usedBy: 'Todos los verticales',
    badge: 'NUEVO',
  },
  {
    icon: Leaf,
    title: 'ESG & Sostenibilidad',
    desc: 'Compliance europeo y reporting sostenible',
    benefits: ['Huella de carbono', 'Reportes CSRD', 'Certificaciones'],
    gradient: 'from-green-500 to-teal-500',
    usedBy: 'Todos los verticales',
  },
  {
    icon: ShoppingCart,
    title: 'Marketplace B2C',
    desc: 'Servicios para inquilinos con proveedores verificados',
    benefits: ['Mudanzas', 'Seguros', 'Limpieza'],
    gradient: 'from-blue-500 to-indigo-500',
    usedBy: 'Alquiler, STR, Coliving',
  },
  {
    icon: DollarSign,
    title: 'Pricing Dinámico IA',
    desc: 'Optimiza tarifas con machine learning',
    benefits: ['+15-30% ingresos', 'Análisis competencia', 'Auto-ajuste'],
    gradient: 'from-purple-500 to-pink-500',
    usedBy: 'STR, Coliving',
  },
  {
    icon: Camera,
    title: 'Tours Virtuales AR/VR',
    desc: 'Tours 360° y realidad virtual/aumentada',
    benefits: ['+40% conversión', 'Home staging virtual', 'Multi-plataforma'],
    gradient: 'from-pink-500 to-rose-500',
    usedBy: 'Todos los verticales',
  },
  {
    icon: Wifi,
    title: 'Smart Home IoT',
    desc: 'Control inteligente de propiedades',
    benefits: ['Cerraduras smart', 'Termostatos', 'Sensores'],
    gradient: 'from-cyan-500 to-blue-500',
    usedBy: 'STR, Coliving',
  },
  {
    icon: Link2,
    title: 'Integraciones',
    desc: 'Conecta con +50 herramientas',
    benefits: ['Portales inmobiliarios', 'OTAs', 'Redes sociales', 'Web propia'],
    gradient: 'from-indigo-500 to-purple-500',
    usedBy: 'Todos los verticales',
  },
];

// Partners por categoría
const partnersByCategory = [
  {
    icon: Landmark,
    title: 'Bancos Hipotecarios',
    desc: 'Hipotecas preferenciales para tus clientes',
    gradient: 'from-blue-600 to-blue-700',
    href: '/partners/bancos',
  },
  {
    icon: Shield,
    title: 'Aseguradoras',
    desc: 'Seguros de hogar y alquiler ventajosos',
    gradient: 'from-green-600 to-emerald-700',
    href: '/partners/aseguradoras',
  },
  {
    icon: GraduationCap,
    title: 'Escuelas de Negocios',
    desc: 'Formación en gestión inmobiliaria',
    gradient: 'from-purple-600 to-indigo-700',
    href: '/partners/escuelas',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 text-lg px-4 py-1">🚀 Ecosistema Completo PropTech</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              6 Verticales + 10 Módulos
            </span>
            <br />
            Todo en Una Plataforma
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Desde alquiler tradicional hasta construcción B2B. Inmova cubre todo el ciclo de vida
            inmobiliario con tecnología de vanguardia.
          </p>
        </div>

        {/* Verticales de Negocio */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold">Verticales de Negocio</h3>
            <Badge variant="outline" className="text-sm">
              6 modelos especializados
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {verticales.map((vertical, i) => {
              const Icon = vertical.icon;
              return (
                <Card
                  key={i}
                  className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-200 relative overflow-hidden"
                >
                  {vertical.badge && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-orange-500 text-white">{vertical.badge}</Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div
                      className={`bg-gradient-to-br ${vertical.gradient} p-4 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl mb-2">{vertical.title}</CardTitle>
                    <p className="text-sm text-gray-600">{vertical.desc}</p>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      {vertical.features.map((feature, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {vertical.href && (
                      <Link href={vertical.href}>
                        <Button variant="outline" className="w-full mt-4 group/btn">
                          Explorar
                          <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Módulos Transversales */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold">Módulos Transversales</h3>
            <Badge variant="outline" className="text-sm">
              10+ módulos potenciadores
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modulosTransversales.map((modulo, i) => {
              const Icon = modulo.icon;
              return (
                <Card
                  key={i}
                  className="group hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                >
                  {modulo.badge && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-emerald-500 text-white">{modulo.badge}</Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div
                      className={`bg-gradient-to-br ${modulo.gradient} p-3 rounded-lg w-fit mb-3`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg mb-2">{modulo.title}</CardTitle>
                    <p className="text-sm text-gray-600">{modulo.desc}</p>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {modulo.benefits.map((benefit, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        <strong>Disponible para:</strong> {modulo.usedBy}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Ecosistema de Partners */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold">Ecosistema de Partners</h3>
            <Badge variant="outline" className="text-sm">
              Alianzas estratégicas
            </Badge>
          </div>

          <p className="text-gray-600 mb-8 max-w-3xl">
            Accede a servicios preferenciales de nuestros partners: financiación hipotecaria,
            seguros de hogar y formación especializada para tu negocio inmobiliario.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {partnersByCategory.map((partner, i) => {
              const Icon = partner.icon;
              return (
                <Link key={i} href={partner.href}>
                  <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-300 cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div
                        className={`bg-gradient-to-br ${partner.gradient} p-4 rounded-xl w-fit mb-4 mx-auto group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-center mb-2">{partner.title}</h4>
                      <p className="text-sm text-gray-600 text-center mb-4">{partner.desc}</p>
                      <Button variant="outline" className="w-full group/btn">
                        Ver Partners
                        <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTA Final */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <Sparkles className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-4">¿Listo para el Ecosistema Completo?</h3>
          <p className="text-xl mb-6 opacity-90 max-w-2xl mx-auto">
            Prueba Inmova 30 días gratis. Sin tarjeta, sin permanencia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Zap className="h-5 w-5 mr-2" />
                Empezar Gratis Ahora
              </Button>
            </Link>
            <Link href="#pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/20"
              >
                Ver Planes y Precios
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm opacity-75">
            ✓ Setup en 10 minutos · ✓ Soporte 24/7 · ✓ Cancela cuando quieras
          </p>
        </div>
      </div>
    </section>
  );
}
