// @ts-nocheck
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
    desc: 'Largo plazo (12+ meses) y media estancia (1-11 meses) con contratos LAU automatizados',
    features: [
      'Contratos LAU actualizados',
      'Screening IA de solvencia',
      'Check-in digital y firma electrónica',
    ],
    gradient: 'from-blue-500 to-teal-500',
    color: 'blue',
  },
  {
    icon: Hotel,
    title: 'Short-Term Rental',
    desc: 'Alquiler vacacional con channel manager integrado y pricing dinámico',
    features: ['Sync con plataformas vacacionales', 'Revenue management', 'Check-in automático'],
    gradient: 'from-orange-500 to-amber-500',
    color: 'orange',
  },
  {
    icon: Home,
    title: 'Coliving / Habitaciones',
    desc: 'Gestión individual por habitación con prorrateo de suministros y matching de roommates',
    features: [
      'Prorrateo automático luz/agua/gas',
      'Matching IA de compatibilidad',
      'Reglas de convivencia digitales',
    ],
    gradient: 'from-purple-500 to-pink-500',
    color: 'purple',
  },
  {
    icon: TrendingUp,
    title: 'House Flipping',
    desc: 'Control completo del ciclo compra-reforma-venta con análisis de rentabilidad',
    features: [
      'Cálculo ROI/TIR en tiempo real',
      'Timeline de reforma',
      'Control de presupuestos por partida',
    ],
    gradient: 'from-green-500 to-emerald-500',
    color: 'green',
  },
  {
    icon: Hammer,
    title: 'Construcción B2B',
    desc: 'Marketplace de subcontratación con compliance legal automático (ewoorker)',
    features: [
      'Compliance Ley 32/2006',
      'Escrow de pagos seguros',
      'Marketplace de subcontratistas',
    ],
    gradient: 'from-orange-600 to-yellow-500',
    color: 'orange',
    badge: 'B2B',
  },
  {
    icon: Building,
    title: 'Comunidades de Propietarios',
    desc: 'Administración de fincas con votaciones telemáticas y portal de comuneros',
    features: [
      'Juntas y votaciones online',
      'Gestión de cuotas y derramas',
      'Portal del comunero 24/7',
    ],
    gradient: 'from-cyan-500 to-blue-500',
    color: 'cyan',
  },
  {
    icon: DollarSign,
    title: 'Alquiler Comercial',
    desc: 'Locales, oficinas y naves industriales con IVA 21%, modelo 303 y facturación automática',
    features: [
      'Contratos comerciales con IVA',
      'Modelo 303 IVA trimestral',
      'Gestión de CAM y repercusión',
    ],
    gradient: 'from-rose-500 to-red-500',
    color: 'rose',
    badge: 'NUEVO',
  },
  {
    icon: Briefcase,
    title: 'Servicios Profesionales',
    desc: 'CRM inmobiliario, facturación y gestión multi-cartera para property managers',
    features: ['CRM con pipeline de ventas', 'Facturación automática', 'Multi-cartera ilimitada'],
    gradient: 'from-indigo-500 to-violet-500',
    color: 'indigo',
  },
  {
    icon: TrendingUp,
    title: 'Family Office & Wealth',
    desc: 'Control patrimonial 360°: inmuebles + carteras financieras + private equity + tesorería multi-banco',
    features: [
      'Dashboard patrimonial consolidado',
      'Integración bancaria universal (PSD2, SWIFT, OCR)',
      'Simulador fiscal y copiloto IA',
    ],
    gradient: 'from-amber-500 to-yellow-600',
    color: 'amber',
    badge: 'Add-on',
  },
];

// Módulos transversales - funcionalidades reales
const modulosTransversales = [
  {
    icon: Calendar,
    title: 'Contratos y Workflows',
    desc: 'Alta rápida de inquilinos en 4 pasos, renovación automática con IPC, y workflow de salida',
    benefits: [
      'Wizard de alta: inquilino→unidad→contrato en minutos',
      'Actualización masiva de rentas por IPC',
      'Workflow de salida con liquidación de fianza',
      'Dashboard de vencimientos global',
    ],
    gradient: 'from-blue-600 to-cyan-600',
    usedBy: 'Todos los verticales',
    badge: 'INCLUIDO',
  },
  {
    icon: Shield,
    title: 'Gestión Documental',
    desc: 'Almacena, organiza y controla vencimientos de toda tu documentación',
    benefits: [
      'DNI, contratos, escrituras, seguros',
      'Alertas de vencimiento automáticas',
      'Exportación masiva en 1 clic',
    ],
    gradient: 'from-green-600 to-emerald-600',
    usedBy: 'Todos los verticales',
  },
  {
    icon: DollarSign,
    title: 'Cobros y Pagos',
    desc: 'Cobro en 1 click, cobro masivo, SEPA, facturación automática y control de morosidad',
    benefits: [
      'Cobro individual o masivo con 1 click',
      'Facturas automáticas con nº secuencial',
      'Informe de morosidad con días de retraso',
      'Previsión de tesorería a 12 meses',
    ],
    gradient: 'from-purple-500 to-pink-500',
    usedBy: 'Todos los verticales',
  },
  {
    icon: Camera,
    title: 'Galería y Multimedia',
    desc: 'Fotos, planos y documentos visuales asociados a cada propiedad',
    benefits: [
      'Fotos ilimitadas con organización',
      'Compartir galería con inquilinos',
      'Exportación para portales inmobiliarios',
    ],
    gradient: 'from-pink-500 to-rose-500',
    usedBy: 'Todos los verticales',
  },
  {
    icon: Wifi,
    title: 'Comunicación Multicanal',
    desc: 'Email, SMS y chat integrado con inquilinos, propietarios y proveedores',
    benefits: [
      'Chat directo desde la plataforma',
      'Notificaciones por email y SMS',
      'Historial completo de conversaciones',
    ],
    gradient: 'from-cyan-500 to-blue-500',
    usedBy: 'Todos los verticales',
  },
  {
    icon: Sparkles,
    title: 'Inteligencia Artificial Integrada',
    desc: 'IA predictiva que anticipa problemas, optimiza rentas y automatiza decisiones',
    benefits: [
      'Predicción de morosidad antes de que ocurra',
      'Valoración automática de inmuebles con IA',
      'Detección de anomalías financieras',
      'Sugerencia de renta óptima por zona',
    ],
    gradient: 'from-violet-600 to-fuchsia-600',
    usedBy: 'Todos los verticales',
    badge: 'IA',
  },
  {
    icon: Briefcase,
    title: 'Family Office & Holding',
    desc: 'Gestión patrimonial 360° para grupos de empresas con múltiples sociedades',
    benefits: [
      'Dashboard consolidado del grupo',
      'P&L por sociedad comparativo',
      'Portfolio Private Equity con TVPI/DPI',
      'Informes trimestrales PDF automáticos',
    ],
    gradient: 'from-amber-600 to-yellow-600',
    usedBy: 'Grupos inmobiliarios',
    badge: 'PREMIUM',
  },
  {
    icon: Zap,
    title: 'Automatización Total',
    desc: 'Workflows automáticos que eliminan tareas repetitivas y reducen errores',
    benefits: [
      'Facturación automática al cobrar',
      'Escalado inteligente de impagos (4 niveles)',
      'Generación automática de pagos mensuales',
      'Renovación de contratos con IPC',
    ],
    gradient: 'from-rose-500 to-red-500',
    usedBy: 'Todos los verticales',
  },
  {
    icon: Link2,
    title: 'Integraciones y API',
    desc: 'Conecta con Zucchetti/Altai, portales inmobiliarios y tu software contable',
    benefits: [
      'Sync contable automático con Zucchetti',
      'Remesas SEPA para cobros bancarios',
      'Conciliación bancaria con auto-matching',
      'API REST completa',
    ],
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
          <Badge className="mb-4 text-lg px-4 py-1">🚀 Ecosistema PropTech Multi-Vertical</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              7 Verticales de Negocio
            </span>
            <br />
            Una Sola Plataforma
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Desde alquiler residencial hasta construcción B2B. Inmova cubre todo el ciclo
            inmobiliario con módulos especializados para cada modelo de negocio.
          </p>
        </div>

        {/* Verticales de Negocio */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold">Verticales de Negocio</h3>
            <Badge variant="outline" className="text-sm">
              Un vertical para cada modelo de negocio
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
              Incluidos en todos los planes
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
          <h3 className="text-3xl font-bold mb-4">Todo Tu Negocio Inmobiliario en Un Solo Lugar</h3>
          <p className="text-xl mb-6 opacity-90 max-w-2xl mx-auto">
            Prueba Inmova 30 días gratis. Sin tarjeta de crédito, sin permanencia, sin sorpresas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 font-bold border-2 border-gray-300"
              >
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
