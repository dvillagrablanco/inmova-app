'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Users, 
  Briefcase, 
  Crown,
  FileSignature,
  HardDrive,
  MessageSquare,
  Bot,
  Palette,
  Code,
  TrendingUp,
  Eye,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';

// Planes principales de INMOVA
const planes = [
  {
    id: 'starter',
    nombre: 'Starter',
    precio: 35,
    precioAnual: 350,
    periodo: '/mes',
    descripcion: 'Perfecto para propietarios particulares',
    anual: '€350/año · Ahorra 2 meses',
    features: [
      'Hasta 5 propiedades',
      'Gestión básica de inquilinos',
      'Contratos simples',
      '5 firmas digitales/mes incluidas',
      '2GB almacenamiento',
      'Soporte por email',
    ],
    cta: 'Empezar gratis',
    destacado: false,
    icon: Users,
    color: 'text-blue-600',
  },
  {
    id: 'profesional',
    nombre: 'Profesional',
    precio: 59,
    precioAnual: 590,
    periodo: '/mes',
    descripcion: 'Para propietarios activos y pequeñas agencias',
    anual: '€590/año · Ahorra 2 meses',
    features: [
      'Hasta 25 propiedades',
      'Gestión avanzada de inquilinos',
      'Contratos con firma digital',
      '20 firmas digitales/mes incluidas',
      '10GB almacenamiento',
      'Cobro automático de rentas',
      'Informes financieros',
      'Recordatorios automáticos',
      'Soporte prioritario',
    ],
    cta: 'Probar 30 días gratis',
    destacado: true,
    icon: Building2,
    color: 'text-indigo-600',
  },
  {
    id: 'business',
    nombre: 'Business',
    precio: 129,
    precioAnual: 1290,
    periodo: '/mes',
    descripcion: 'Para gestoras profesionales y agencias',
    anual: '€1.290/año · Ahorra 2 meses',
    features: [
      'Hasta 100 propiedades',
      'Multi-propietario',
      '50 firmas digitales/mes incluidas',
      '50GB almacenamiento',
      'CRM integrado',
      'API de integración',
      'Los 7 verticales inmobiliarios',
      'Reportes avanzados incluidos',
      'Multi-idioma incluido',
      'Account manager dedicado',
    ],
    cta: 'Probar 30 días gratis',
    destacado: false,
    icon: Briefcase,
    color: 'text-purple-600',
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    precio: 299,
    precioAnual: 2990,
    periodo: '/mes',
    descripcion: 'Para grandes empresas y SOCIMIs',
    anual: '€2.990/año · Ahorra 2 meses',
    features: [
      'Todo de Business',
      'Propiedades ilimitadas',
      'Firmas digitales ilimitadas',
      'Almacenamiento ilimitado',
      'White-label completo incluido',
      'API ilimitada incluida',
      'SLA garantizado 99.9%',
      'Integraciones personalizadas',
      'Todos los add-ons incluidos',
      'Soporte 24/7 dedicado',
    ],
    cta: 'Contactar ventas',
    destacado: false,
    icon: Crown,
    color: 'text-amber-600',
  },
];

// Add-ons destacados (sincronizados con seed-addons.ts)
const addonsDestacados = [
  {
    id: 'signatures',
    nombre: 'Firmas Digitales',
    descripcion: 'Packs de firmas con validez legal europea (eIDAS)',
    opciones: [
      { unidades: 10, precio: 15 },
      { unidades: 50, precio: 60 },
      { unidades: 100, precio: 100 },
    ],
    icon: FileSignature,
    color: 'bg-blue-50 text-blue-600',
    popular: true,
  },
  {
    id: 'sms',
    nombre: 'SMS/WhatsApp',
    descripcion: 'Notificaciones y recordatorios a inquilinos',
    opciones: [
      { unidades: 100, precio: 10 },
      { unidades: 500, precio: 40 },
      { unidades: 1000, precio: 70 },
    ],
    icon: MessageSquare,
    color: 'bg-green-50 text-green-600',
    popular: true,
  },
  {
    id: 'ai',
    nombre: 'IA Avanzada',
    descripcion: 'Valoraciones automáticas y asistente inteligente',
    opciones: [
      { unidades: '50K tokens', precio: 10 },
      { unidades: '200K tokens', precio: 35 },
      { unidades: '500K tokens', precio: 75 },
    ],
    icon: Bot,
    color: 'bg-purple-50 text-purple-600',
    popular: true,
  },
  {
    id: 'storage',
    nombre: 'Almacenamiento',
    descripcion: 'Espacio adicional para documentos y fotos',
    opciones: [
      { unidades: '10GB', precio: 5 },
      { unidades: '50GB', precio: 20 },
      { unidades: '100GB', precio: 35 },
    ],
    icon: HardDrive,
    color: 'bg-orange-50 text-orange-600',
    popular: false,
  },
];

// Módulos premium (funcionalidades avanzadas)
const modulosPremium = [
  {
    id: 'portals',
    nombre: 'Publicación en Portales',
    descripcion: 'Publica automáticamente en Idealista, Fotocasa, Habitaclia',
    precio: 25,
    icon: Zap,
  },
  {
    id: 'whitelabel',
    nombre: 'White-Label',
    descripcion: 'Tu marca, tu dominio. Personalización total',
    precio: 35,
    icon: Palette,
  },
  {
    id: 'pricing_ai',
    nombre: 'Pricing Dinámico IA',
    descripcion: 'Optimiza precios de alquiler con Machine Learning',
    precio: 45,
    icon: TrendingUp,
  },
  {
    id: 'tours',
    nombre: 'Tours Virtuales 360°',
    descripcion: 'Tours interactivos con integración Matterport',
    precio: 35,
    icon: Eye,
  },
  {
    id: 'api',
    nombre: 'Acceso API REST',
    descripcion: 'API completa para integraciones personalizadas',
    precio: 49,
    icon: Code,
  },
  {
    id: 'screening',
    nombre: 'Screening Inquilinos',
    descripcion: 'Verificación de solvencia y puntuación de riesgo',
    precio: 20,
    icon: Shield,
  },
];

export default function PreciosPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const getPrice = (plan: typeof planes[0]) => {
    return billingPeriod === 'annual' ? Math.round(plan.precioAnual / 12) : plan.precio;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 hover:bg-white/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Sin permanencia · Cancela cuando quieras
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Planes y Precios
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Elige el plan que mejor se adapte a tus necesidades. Todos incluyen prueba gratuita de 30 días.
          </p>
          
          {/* Toggle mensual/anual */}
          <div className="flex items-center justify-center gap-4">
            <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as 'monthly' | 'annual')}>
              <TabsList className="bg-white/10">
                <TabsTrigger value="monthly" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                  Mensual
                </TabsTrigger>
                <TabsTrigger value="annual" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                  Anual
                  <Badge className="ml-2 bg-green-500 text-white text-xs">-17%</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Planes principales */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
          {planes.map((plan) => (
            <Card 
              key={plan.nombre}
              className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
                plan.destacado 
                  ? 'border-2 border-indigo-500 shadow-xl ring-2 ring-indigo-500 ring-offset-2 scale-[1.02]' 
                  : 'border hover:border-gray-300'
              }`}
            >
              {plan.destacado && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600">
                  Más Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <plan.icon className={`w-12 h-12 mx-auto mb-3 ${plan.color}`} />
                <CardTitle className="text-xl">{plan.nombre}</CardTitle>
                <p className="text-gray-500 text-sm">{plan.descripcion}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    €{getPrice(plan)}
                  </span>
                  <span className="text-gray-500">{plan.periodo}</span>
                </div>
                {billingPeriod === 'annual' && (
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    {plan.anual}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Link href={plan.nombre === 'Enterprise' ? '/landing/contacto' : '/register'} className="w-full">
                  <Button 
                    className={`w-full ${plan.destacado ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                    variant={plan.destacado ? 'default' : 'outline'}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Sección Add-ons */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">Add-ons</Badge>
            <h2 className="text-3xl font-bold mb-4">Amplía tu plan con extras</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Packs de consumo que puedes añadir según tus necesidades. Paga solo por lo que uses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addonsDestacados.map((addon) => (
              <Card key={addon.id} className="relative">
                {addon.popular && (
                  <Badge className="absolute -top-2 right-4 bg-green-500">Popular</Badge>
                )}
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${addon.color}`}>
                    <addon.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{addon.nombre}</CardTitle>
                  <CardDescription>{addon.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {addon.opciones.map((opcion, i) => (
                      <div key={i} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                        <span className="text-gray-600">{opcion.unidades}</span>
                        <span className="font-semibold">€{opcion.precio}/mes</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sección Módulos Premium */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-100 text-purple-700" variant="outline">
              <Sparkles className="w-3 h-3 mr-1" />
              Módulos Premium
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Funcionalidades avanzadas</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Activa módulos premium para potenciar tu gestión inmobiliaria. Incluidos en Enterprise.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modulosPremium.map((modulo) => (
              <Card key={modulo.id} className="flex items-start p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mr-4 flex-shrink-0">
                  <modulo.icon className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{modulo.nombre}</h3>
                  <p className="text-sm text-gray-600 mb-2">{modulo.descripcion}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-indigo-600">€{modulo.precio}/mes</span>
                    <Badge variant="outline" className="text-xs">Por plan</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-24 text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">¿No sabes qué plan elegir?</h2>
          <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
            Agenda una demo personalizada y te ayudamos a encontrar el plan perfecto para tus necesidades.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/landing/demo">
              <Button size="lg" variant="secondary">
                Solicitar Demo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/landing/contacto">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Hablar con ventas
              </Button>
            </Link>
          </div>
        </div>

        {/* FAQ rápido */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            ¿Tienes preguntas? Consulta nuestras{' '}
            <Link href="/landing/faq" className="text-indigo-600 hover:underline">
              preguntas frecuentes
            </Link>{' '}
            o{' '}
            <Link href="/landing/contacto" className="text-indigo-600 hover:underline">
              contacta con nosotros
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
