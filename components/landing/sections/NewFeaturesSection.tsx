'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Home,
  Users,
  Zap,
  Calculator,
  CalendarClock,
  BarChart3,
  Tag,
  TrendingUp,
  Clock,
  Target,
  Gift,
  CheckCircle2,
  Shield,
  Landmark,
  GraduationCap,
  UserCheck,
  Hammer,
  FileCheck,
  Euro,
  Building2,
  Leaf,
  DollarSign,
} from 'lucide-react';

const newModules = [
  {
    icon: Home,
    title: 'Room Rental PRO',
    desc: 'Gestión avanzada de coliving y alquiler por habitaciones',
    features: [
      'Prorrateo automático de suministros',
      'Calendario de limpieza',
      'Reglas de convivencia',
      'Dashboard especializado',
    ],
    gradient: 'from-green-500 to-emerald-600',
    stats: { value1: '100', label1: 'Habitaciones', value2: '10h', label2: 'Ahorradas/mes' },
    href: '/room-rental',
  },
  {
    icon: Tag,
    title: 'Cupones & Promociones',
    desc: 'Marketing automatizado con descuentos inteligentes',
    features: [
      'Descuentos % o fijos',
      'Límites de uso configurables',
      'Validación en tiempo real',
      'Analytics de conversión',
    ],
    gradient: 'from-purple-500 to-pink-600',
    stats: { value1: '+30%', label1: 'Conversión', value2: '4x', label2: 'ROI' },
    href: '/promociones',
  },
  {
    icon: Shield,
    title: 'Módulo de Seguros',
    desc: 'Gestión completa de pólizas y siniestros',
    features: [
      'Alertas de vencimiento',
      'Gestión de siniestros',
      'Analytics avanzados',
      'Exportación de reportes',
    ],
    gradient: 'from-blue-600 to-cyan-600',
    stats: { value1: '100%', label1: 'Compliance', value2: '0', label2: 'Pólizas vencidas' },
    href: '/seguros',
  },
  {
    icon: UserCheck,
    title: 'Gestión de Visitas',
    desc: 'Organiza visitas con confirmaciones automáticas',
    features: [
      'Calendario integrado',
      'Confirmaciones SMS',
      'Tracking de estado',
      'Historial completo',
    ],
    gradient: 'from-indigo-600 to-purple-600',
    stats: { value1: '0', label1: 'Olvidos', value2: '100%', label2: 'Confirmadas' },
    href: '/visitas',
  },
  {
    icon: Users,
    title: 'Programa de Partners',
    desc: 'Alianzas con bancos, aseguradoras y escuelas',
    features: [
      'Hipotecas preferenciales',
      'Seguros ventajosos',
      'Formación especializada',
      'Beneficios exclusivos',
    ],
    gradient: 'from-pink-600 to-rose-600',
    stats: { value1: '15+', label1: 'Partners', value2: '100%', label2: 'Gratis' },
    href: '/partners',
  },
  {
    icon: Hammer,
    title: 'ewoorker (B2B Construcción)',
    desc: 'Plataforma para subcontratación segura en obras con IA',
    features: [
      'Matching IA con Claude',
      'Gamificación y logros',
      'Sistema de referidos',
      'Analytics dashboard avanzado',
    ],
    gradient: 'from-orange-600 to-yellow-500',
    stats: { value1: '2.5K', label1: 'Empresas', value2: '€15M', label2: 'Facturado' },
    href: '/ewoorker/landing',
    badge: '🚀 NOVEDADES 2026',
  },
];

const allInOneFeatures = [
  {
    icon: Leaf,
    title: 'ESG & Sostenibilidad',
    desc: 'Reportes de huella de carbono y compliance europeo',
  },
  { icon: Building2, title: 'Marketplace B2C', desc: 'Servicios para inquilinos verificados' },
  { icon: DollarSign, title: 'Pricing Dinámico IA', desc: 'Optimiza tarifas automáticamente' },
  { icon: FileCheck, title: 'Firma Digital', desc: 'Contratos firmados electrónicamente' },
];

export function NewFeaturesSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 px-6 py-3 text-base font-bold">
            <Sparkles className="h-5 w-5 mr-2 inline" />
            NOVEDADES 2026
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-gray-900 via-indigo-900 to-violet-900 bg-clip-text text-transparent">
            6 Módulos Nuevos que Revolucionan la Industria
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Desde <strong className="text-indigo-600">gestión de seguros</strong> hasta{' '}
            <strong className="text-orange-600">construcción B2B</strong>. Inmova cubre todo el
            ecosistema PropTech.
          </p>
        </div>

        {/* Grid de Nuevos Módulos */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {newModules.map((module, i) => {
            const Icon = module.icon;
            return (
              <Card
                key={i}
                className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-indigo-300 bg-white relative overflow-hidden"
              >
                {/* Badge si tiene */}
                {module.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-orange-500 text-white">{module.badge}</Badge>
                  </div>
                )}

                <CardHeader className="pb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`p-4 bg-gradient-to-r ${module.gradient} rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900">{module.title}</h3>
                      <p className="text-sm text-gray-600">{module.desc}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {module.features.map((feature, j) => (
                      <div
                        key={j}
                        className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                    <div className="text-center">
                      <div className="text-3xl font-black text-blue-600">{module.stats.value1}</div>
                      <div className="text-xs text-gray-600 font-semibold">
                        {module.stats.label1}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-blue-600">{module.stats.value2}</div>
                      <div className="text-xs text-gray-600 font-semibold">
                        {module.stats.label2}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link href={module.href}>
                    <Button
                      className={`w-full bg-gradient-to-r ${module.gradient} text-white font-bold py-6 shadow-lg hover:shadow-xl transition-all group/btn`}
                    >
                      Explorar Módulo
                      <Sparkles className="ml-2 h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Módulos Adicionales */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12">
          <h3 className="text-3xl font-black text-center mb-8">Y Muchos Más Módulos Incluidos</h3>

          <div className="grid md:grid-cols-4 gap-6">
            {allInOneFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="text-center p-6 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <Icon className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-bold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-6">
            ¿Quieres ver todas estas características en acción?
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-8 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
            >
              Prueba Gratis 30 Días
              <Sparkles className="ml-2 h-6 w-6" />
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-3">
            Sin tarjeta de crédito • Acceso completo • Cancela cuando quieras
          </p>
        </div>
      </div>
    </section>
  );
}
