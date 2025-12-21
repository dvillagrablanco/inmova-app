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
  CheckCircle2
} from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const roomRentalFeatures: Feature[] = [
  {
    icon: <Calculator className="h-5 w-5" />,
    title: 'Prorrateo Automático',
    description: 'Distribuye automáticamente luz, agua y gas por habitación o persona'
  },
  {
    icon: <CalendarClock className="h-5 w-5" />,
    title: 'Calendario de Limpieza',
    description: 'Programa y gestiona la limpieza de habitaciones y espacios comunes'
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Reglas de Co-living',
    description: 'Define y aplica reglas personalizadas para cada propiedad compartida'
  },
  {
    icon: <Home className="h-5 w-5" />,
    title: 'Espacios Comunes',
    description: 'Gestiona salón, cocina, baños compartidos y otros espacios'
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Dashboard Especializado',
    description: 'Vista 360º con ocupación, ingresos y estadísticas por habitación'
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: 'Ahorra 10h/mes',
    description: 'Elimina cálculos manuales y gestiona hasta 100 habitaciones fácilmente'
  }
];

const couponSystemFeatures: Feature[] = [
  {
    icon: <Tag className="h-5 w-5" />,
    title: 'Cupones Flexibles',
    description: 'Crea descuentos por porcentaje o monto fijo con total control'
  },
  {
    icon: <Target className="h-5 w-5" />,
    title: 'Límites Inteligentes',
    description: 'Define usos máximos, validez temporal y restricciones por usuario'
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Validación en Tiempo Real',
    description: 'El sistema valida automáticamente elegibilidad y condiciones'
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Panel de Estadísticas',
    description: 'Monitorea conversión, ingresos y usuarios únicos en tiempo real'
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: 'ROI Comprobado',
    description: '25-35% aumento en conversión de leads, €4 generados por cada €1 de descuento'
  },
  {
    icon: <Gift className="h-5 w-5" />,
    title: 'Campañas Automatizadas',
    description: 'Lanza promociones estacionales y ofertas flash sin esfuerzo manual'
  }
];

const useCases = [
  {
    type: 'Coliving Urbano',
    problem: 'Calcular facturas de luz manualmente para 15 inquilinos',
    solution: 'INMOVA prorratea automáticamente por habitación en 3 clics',
    savings: 'Ahorra 8h/mes'
  },
  {
    type: 'Residencia Estudiantil',
    problem: 'Gestionar 50 habitaciones con contratos escalonados',
    solution: 'Dashboard unificado con ocupación, vencimientos y alertas',
    savings: 'Visibilidad total'
  },
  {
    type: 'Agencia Inmobiliaria',
    problem: 'Lanzar campaña de descuento para inquilinos nuevos',
    solution: 'Sistema de cupones con límites y tracking de conversión',
    savings: '+30% leads'
  }
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
            NOVEDADES Q4 2024
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-gray-900 via-indigo-900 to-violet-900 bg-clip-text text-transparent">
            Las Características que Revolucionan el Sector
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Dos <strong className="text-indigo-600">killer features</strong> que ningún competidor tiene y que ya están ayudando a cientos de gestoras a ahorrar tiempo y aumentar ingresos.
          </p>
        </div>

        {/* Dos Columnas Principales */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Room Rental PRO */}
          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-green-200 hover:border-green-400 bg-white relative overflow-hidden">
            {/* Badge de NUEVO */}
            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-2 rotate-12 shadow-lg">
              <span className="text-xs font-black">✨ NUEVO</span>
            </div>

            <CardHeader className="pb-6 pt-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Home className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900">Room Rental PRO</h3>
                  <p className="text-sm text-green-600 font-bold">Gestión Avanzada de Coliving</p>
                </div>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                El <strong>primer y único sistema</strong> del mercado español que automatiza completamente la gestión de alquiler por habitaciones con <strong>prorrateo inteligente de suministros</strong>.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-3">
                {roomRentalFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600 shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{feature.title}</div>
                      <div className="text-xs text-gray-600">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div className="text-center">
                  <div className="text-3xl font-black text-green-600">100</div>
                  <div className="text-xs text-gray-600 font-semibold">Habitaciones</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-green-600">10h</div>
                  <div className="text-xs text-gray-600 font-semibold">Ahorradas/mes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-green-600">0€</div>
                  <div className="text-xs text-gray-600 font-semibold">Errores manuales</div>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-4">
                <Link href="/room-rental" className="block">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all group">
                    <span>Ver Room Rental PRO en Acción</span>
                    <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Incluido en planes <strong>Professional</strong> y <strong>Business</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sistema de Cupones */}
          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-purple-200 hover:border-purple-400 bg-white relative overflow-hidden">
            {/* Badge de NUEVO */}
            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-2 rotate-12 shadow-lg">
              <span className="text-xs font-black">✨ NUEVO</span>
            </div>

            <CardHeader className="pb-6 pt-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Tag className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900">Sistema de Cupones</h3>
                  <p className="text-sm text-purple-600 font-bold">Marketing Automatizado Inteligente</p>
                </div>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                Lanza <strong>campañas de descuento profesionales</strong> con tracking en tiempo real, límites de uso y estadísticas avanzadas. Integrado con tu sistema de pagos.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-3">
                {couponSystemFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600 shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{feature.title}</div>
                      <div className="text-xs text-gray-600">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-600">+30%</div>
                  <div className="text-xs text-gray-600 font-semibold">Conversión leads</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-600">4x</div>
                  <div className="text-xs text-gray-600 font-semibold">ROI promedio</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-600">∞</div>
                  <div className="text-xs text-gray-600 font-semibold">Cupones posibles</div>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-4">
                <Link href="/cupones" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all group">
                    <span>Crear Tu Primera Campaña</span>
                    <Gift className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-gray-500 mt-2">
                  <strong>INCLUIDO GRATIS</strong> en plan Business • Add-on €29/mes en Professional
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Casos de Uso Reales */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h3 className="text-3xl font-black text-center mb-2">
            Casos de Uso Reales
          </h3>
          <p className="text-center text-gray-600 mb-8">
            Cómo nuestros clientes están usando estas características para transformar su negocio
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((useCase, i) => (
              <div key={i} className="p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all">
                <Badge className="mb-3 bg-indigo-100 text-indigo-700 border-indigo-200">
                  {useCase.type}
                </Badge>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1">❌ ANTES:</div>
                    <div className="text-sm text-gray-700">{useCase.problem}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-green-600 mb-1">✅ AHORA:</div>
                    <div className="text-sm text-gray-900 font-semibold">{useCase.solution}</div>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-sm font-black text-indigo-600">
                      📈 {useCase.savings}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6">
            ¿Quieres ver estas características en acción?
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-8 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
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
