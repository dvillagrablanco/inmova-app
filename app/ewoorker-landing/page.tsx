'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Shield,
  Euro,
  CheckCircle2,
  Users,
  FileCheck,
  TrendingUp,
  Zap,
  Award,
  ArrowRight,
  Clock,
  Star,
  Briefcase,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EwoorkerLanding() {
  const router = useRouter();
  const [registerType, setRegisterType] = useState<'constructor' | 'subcontratista' | null>(null);

  const planes = [
    {
      nombre: 'OBRERO',
      precio: 'Gratis',
      descripcion: 'Para empezar',
      color: 'from-gray-500 to-gray-600',
      features: [
        'Perfil básico',
        'Ver obras públicas',
        '3 ofertas/mes',
        'Chat básico',
        'Soporte email',
      ],
      cta: 'Empezar Gratis',
    },
    {
      nombre: 'CAPATAZ',
      precio: '€49',
      descripcion: '/mes',
      color: 'from-orange-500 to-orange-600',
      popular: true,
      features: [
        'Todo de Obrero',
        'Ofertas ilimitadas',
        'Compliance Hub completo',
        'Chat prioritario',
        'Sistema escrow',
        'Certificaciones digitales',
      ],
      cta: 'Probar 14 días gratis',
    },
    {
      nombre: 'CONSTRUCTOR',
      precio: '€149',
      descripcion: '/mes',
      color: 'from-blue-600 to-blue-700',
      features: [
        'Todo de Capataz',
        'Obras ilimitadas',
        'Marketplace destacado',
        'API access',
        'Equipo ilimitado',
        'Account manager',
        'White-label',
      ],
      cta: 'Hablar con Ventas',
    },
  ];

  const beneficios = [
    {
      icon: Shield,
      title: 'Compliance Automático',
      desc: 'Ley 32/2006 cumplida sin esfuerzo',
      color: 'text-green-600',
    },
    {
      icon: Euro,
      title: 'Pago Seguro (Escrow)',
      desc: 'Tu dinero protegido hasta final obra',
      color: 'text-blue-600',
    },
    {
      icon: FileCheck,
      title: 'Docs Siempre al Día',
      desc: 'Alertas de vencimiento REA, TC1, TC2',
      color: 'text-purple-600',
    },
    {
      icon: TrendingUp,
      title: 'Encuentra Trabajo Rápido',
      desc: 'Marketplace con 500+ obras activas',
      color: 'text-orange-600',
    },
  ];

  const stats = [
    { value: '2,500+', label: 'Empresas Registradas' },
    { value: '€12M', label: 'Facturado en Plataforma' },
    { value: '4,800', label: 'Obras Completadas' },
    { value: '4.8/5', label: 'Valoración Media' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 text-lg px-4 py-2">
              <Building2 className="h-5 w-5 mr-2 inline" />
              La Plataforma B2B Nº1 en Construcción
            </Badge>

            <h1 className="text-6xl font-extrabold mb-6 leading-tight">
              Subcontrata con <span className="text-yellow-300">Seguridad Legal</span> y Pago
              Garantizado
            </h1>

            <p className="text-2xl mb-10 text-orange-50">
              Marketplace + Compliance Hub + Escrow. Todo en uno para constructores y
              subcontratistas profesionales.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => router.push('/registro?type=constructor')}
                className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-6"
              >
                <Briefcase className="h-6 w-6 mr-2" />
                Soy Constructor
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="lg"
                onClick={() => router.push('/registro?type=subcontratista')}
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/20 text-lg px-8 py-6"
              >
                <Users className="h-6 w-6 mr-2" />
                Soy Subcontratista
              </Button>
            </div>

            <p className="mt-6 text-orange-100 text-sm">
              ✓ Sin tarjeta de crédito ✓ 14 días gratis ✓ Cancela cuando quieras
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <p className="text-4xl font-bold text-orange-600 mb-2">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Beneficios Principales */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">¿Por qué ewoorker?</Badge>
            <h2 className="text-4xl font-bold mb-4">El Único que Resuelve lo Importante</h2>
            <p className="text-xl text-gray-600">
              Compliance + Pagos + Marketplace en una sola plataforma
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((b, i) => {
              const Icon = b.icon;
              return (
                <Card key={i} className="border-2 hover:shadow-xl transition-all">
                  <CardContent className="pt-6">
                    <div className={`${b.color} bg-gray-50 p-4 rounded-lg w-fit mb-4`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{b.title}</h3>
                    <p className="text-gray-600 text-sm">{b.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Planes */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Planes para Cada Fase de Tu Negocio</h2>
            <p className="text-xl text-gray-600">Desde freelance hasta empresa consolidada</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {planes.map((plan, i) => (
              <Card
                key={i}
                className={`relative ${plan.popular ? 'border-4 border-orange-500 shadow-2xl scale-105' : 'border-2'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white px-4 py-1 text-sm">
                      MÁS POPULAR
                    </Badge>
                  </div>
                )}
                <CardHeader
                  className={`bg-gradient-to-r ${plan.color} text-white rounded-t-lg pb-8`}
                >
                  <CardTitle className="text-center">
                    <p className="text-xl font-bold mb-2">{plan.nombre}</p>
                    <p className="text-5xl font-extrabold mb-1">{plan.precio}</p>
                    <p className="text-sm opacity-80">{plan.descripcion}</p>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{f}</span>
                    </div>
                  ))}
                  <Button
                    className="w-full mt-6"
                    size="lg"
                    onClick={() => router.push('/registro')}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Casos de Uso */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-orange-100 text-orange-600">Para Constructores</Badge>
              <h2 className="text-4xl font-bold mb-6">
                Encuentra Subcontratistas Verificados en Minutos
              </h2>
              <div className="space-y-4">
                <Feature text="Publica tu obra en 2 minutos" />
                <Feature text="Recibe ofertas de empresas verificadas con REA" />
                <Feature text="Compara presupuestos lado a lado" />
                <Feature text="Libro de subcontratación automático (Ley 32/2006)" />
                <Feature text="Paga solo cuando el trabajo esté perfecto" />
              </div>
              <Button className="mt-8" size="lg" onClick={() => router.push('/ewoorker/dashboard')}>
                <Building2 className="h-5 w-5 mr-2" />
                Publicar Mi Primera Obra
              </Button>
            </div>
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-600">Para Subcontratistas</Badge>
              <h2 className="text-4xl font-bold mb-6">
                Más Trabajo, Menos Papeleo, Cobro Garantizado
              </h2>
              <div className="space-y-4">
                <Feature text="Accede a 500+ obras activas cada semana" />
                <Feature text="Tus docs (REA, TC1, TC2, PRL) siempre actualizados" />
                <Feature text="Alertas automáticas de vencimiento" />
                <Feature text="Escrow: cobra aunque el constructor no pague" />
                <Feature text="Construye reputación con reviews verificadas" />
              </div>
              <Button className="mt-8" size="lg" onClick={() => router.push('/ewoorker/dashboard')}>
                <Users className="h-5 w-5 mr-2" />
                Ver Obras Disponibles
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonios */}
      <div className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Lo que dicen nuestros clientes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Carlos Ruiz',
                empresa: 'Construcciones Ruiz SL',
                stars: 5,
                text: 'Adiós al caos del papeleo. Todo mi REA, TC1 y seguros en un solo lugar con alertas automáticas.',
              },
              {
                name: 'María López',
                empresa: 'Reformas Premium',
                stars: 5,
                text: 'He conseguido 12 obras en 3 meses. El escrow me da tranquilidad total.',
              },
              {
                name: 'José García',
                empresa: 'Edificaciones García',
                stars: 5,
                text: 'El libro de subcontratación automático me ahorra 5 horas a la semana.',
              },
            ].map((t, i) => (
              <Card key={i} className="bg-white/10 border-white/20 text-white">
                <CardContent className="pt-6">
                  <div className="flex mb-3">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <p className="font-bold">{t.name}</p>
                    <p className="text-sm text-gray-300">{t.empresa}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="py-24 bg-gradient-to-r from-orange-600 to-yellow-500 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-5xl font-bold mb-6">¿Listo para Profesionalizar tu Negocio?</h2>
          <p className="text-2xl mb-10 text-orange-50">
            Únete a 2,500+ empresas que ya gestionan sus obras con ewoorker
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/registro')}
              className="bg-white text-orange-600 hover:bg-orange-50 text-xl px-10 py-7"
            >
              Empezar Gratis Ahora
              <ArrowRight className="h-6 w-6 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/ewoorker/demo')}
              className="border-2 border-white text-white hover:bg-white/20 text-xl px-10 py-7"
            >
              Ver Demo
            </Button>
          </div>
          <p className="mt-6 text-orange-100">14 días gratis • Sin tarjeta • Soporte 24/7</p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-white mb-4">
                <Building2 className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold">ewoorker</span>
              </div>
              <p className="text-sm">
                La plataforma B2B para subcontratación segura en construcción.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Producto</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/ewoorker/marketplace">Marketplace</a>
                </li>
                <li>
                  <a href="/ewoorker/compliance">Compliance Hub</a>
                </li>
                <li>
                  <a href="/ewoorker/pagos">Sistema de Pagos</a>
                </li>
                <li>
                  <a href="/precios">Precios</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/sobre-nosotros">Sobre nosotros</a>
                </li>
                <li>
                  <a href="/blog">Blog</a>
                </li>
                <li>
                  <a href="/contacto">Contacto</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/legal/terminos">Términos</a>
                </li>
                <li>
                  <a href="/legal/privacidad">Privacidad</a>
                </li>
                <li>
                  <a href="/legal/cookies">Cookies</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 ewoorker by Inmova. Todos los derechos reservados.</p>
            <p className="mt-2 text-xs">
              Powered by <span className="text-orange-500">Inmova App</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
      <span className="text-lg">{text}</span>
    </div>
  );
}
