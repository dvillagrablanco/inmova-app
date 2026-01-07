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
  DollarSign,
  Camera,
  Wifi,
  Link2,
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle,
  Shield,
  Calendar,
  Building,
} from 'lucide-react';

const verticales = [
  {
    icon: Building2,
    title: 'Alquiler Residencial',
    desc: 'Tradicional (12+ meses) + Media Estancia (1-11 meses)',
    features: ['Contratos LAU', 'Scoring IA', 'Check-in digital'],
    gradient: 'from-blue-500 to-teal-500',
    color: 'blue',
    badge: 'MEJORADO',
  },
  {
    icon: Hotel,
    title: 'STR (Vacacional)',
    desc: 'Alquileres vacacionales y corta estancia',
    features: ['Channel Manager', 'Reviews', 'Auto check-in'],
    gradient: 'from-orange-500 to-amber-500',
    color: 'orange',
  },
  {
    icon: Home,
    title: 'Coliving / Habitaciones',
    desc: 'Gestión por habitación con espacios compartidos',
    features: ['Prorrateo auto', 'Matching IA', 'Reglas convivencia'],
    gradient: 'from-purple-500 to-pink-500',
    color: 'purple',
  },
  {
    icon: TrendingUp,
    title: 'House Flipping',
    desc: 'Compra-reforma-venta con control de ROI',
    features: ['ROI/TIR', 'Timeline', 'Presupuestos'],
    gradient: 'from-green-500 to-emerald-500',
    color: 'green',
  },
  {
    icon: Hammer,
    title: 'Construcción B2B',
    desc: 'Subcontratación segura (ewoorker)',
    features: ['Ley 32/2006', 'Escrow pagos', 'Marketplace'],
    gradient: 'from-orange-600 to-yellow-500',
    color: 'orange',
    badge: 'B2B',
  },
  {
    icon: Building,
    title: 'Comunidades / Fincas',
    desc: 'Administración de comunidades de propietarios',
    features: ['Juntas', 'Cuotas', 'Incidencias'],
    gradient: 'from-cyan-500 to-blue-500',
    color: 'cyan',
    badge: 'NUEVO',
  },
  {
    icon: Briefcase,
    title: 'Servicios Profesionales',
    desc: 'Property management B2B',
    features: ['CRM', 'Facturación', 'Multi-cartera'],
    gradient: 'from-indigo-500 to-violet-500',
    color: 'indigo',
  },
];

// Módulos transversales simplificados - 6 principales
const modulosTransversales = [
  {
    icon: Calendar,
    title: 'Media Estancia (1-11 meses)',
    desc: 'Alquiler temporal LAU Art. 3.2',
    benefits: ['Contratos flexibles', 'Scoring IA', 'Renovaciones auto'],
    gradient: 'from-blue-600 to-cyan-600',
    usedBy: 'Alquiler Residencial',
    badge: 'NUEVO',
  },
  {
    icon: Shield,
    title: 'Seguros & Compliance',
    desc: 'Pólizas, siniestros y cumplimiento',
    benefits: ['Alertas vencimiento', 'GDPR', 'LAU'],
    gradient: 'from-green-600 to-emerald-600',
    usedBy: 'Todos los verticales',
  },
  {
    icon: DollarSign,
    title: 'Pricing Dinámico IA',
    desc: 'Optimización de tarifas con ML',
    benefits: ['+15-30% ingresos', 'Competencia', 'Auto-ajuste'],
    gradient: 'from-purple-500 to-pink-500',
    usedBy: 'STR, Coliving',
  },
  {
    icon: Camera,
    title: 'Tours Virtuales 360°',
    desc: 'Visitas inmersivas AR/VR',
    benefits: ['+40% conversión', 'Staging virtual'],
    gradient: 'from-pink-500 to-rose-500',
    usedBy: 'Todos los verticales',
  },
  {
    icon: Wifi,
    title: 'Smart Home IoT',
    desc: 'Domótica y control remoto',
    benefits: ['Cerraduras', 'Termostatos', 'Sensores'],
    gradient: 'from-cyan-500 to-blue-500',
    usedBy: 'STR, Coliving',
  },
  {
    icon: Link2,
    title: 'Integraciones (+50)',
    desc: 'Conecta con todas tus herramientas',
    benefits: ['Portales', 'OTAs', 'Contabilidad'],
    gradient: 'from-indigo-500 to-purple-500',
    usedBy: 'Todos los verticales',
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
              7 Verticales + 15 Módulos
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
              7 modelos especializados
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
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold">Módulos Transversales</h3>
            <Badge variant="outline" className="text-sm">
              +15 módulos incluidos
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

        {/* CTA Final */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <Sparkles className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-4">¿Listo para el Ecosistema Completo?</h3>
          <p className="text-xl mb-6 opacity-90 max-w-2xl mx-auto">
            Prueba Inmova 30 días gratis. Sin tarjeta, sin permanencia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-bold">
                <Zap className="h-5 w-5 mr-2" />
                Empezar Gratis Ahora
              </Button>
            </Link>
            <Link href="#pricing">
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold border-0"
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
