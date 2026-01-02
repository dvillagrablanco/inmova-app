'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Star, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  BarChart3,
  Menu,
  X
} from 'lucide-react';

export function SimpleLandingContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header/Navigation */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/landing" className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">INMOVA</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/landing#features">
                <Button variant="ghost" className="text-gray-700">
                  Características
                </Button>
              </Link>
              <Link href="/landing#pricing">
                <Button variant="ghost" className="text-gray-700">
                  Precios
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Empezar Gratis
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-gray-900">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-indigo-600" />
                    <span className="text-xl font-bold">INMOVA</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <Link href="/landing#features" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-lg">
                      Características
                    </Button>
                  </Link>
                  <Link href="/landing#pricing" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-lg">
                      Precios
                    </Button>
                  </Link>
                  <Link href="/ewoorker/landing" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-lg">
                      eWoorker
                    </Button>
                  </Link>
                  <div className="border-t pt-4 mt-4">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full mb-3 text-lg py-6">
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6">
                        Empezar Gratis
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 md:space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xs sm:text-sm font-semibold text-indigo-900">
                Plataforma PropTech Multi-Vertical
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight px-4">
              <span className="block text-gray-900 mb-2">
                6 Verticales + 10 Módulos
              </span>
              <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Poder Multiplicado
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              La única plataforma que combina verticales de negocio inmobiliario 
              con módulos transversales de IA, IoT y Blockchain. Todo en un solo lugar.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg min-h-[48px]">
                  Prueba Gratis 30 Días
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg min-h-[48px]">
                  Contactar Ventas
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 pt-6 md:pt-8 text-xs sm:text-sm text-gray-600 px-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">€850M Mercado España</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">34 Tipos de Partners</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">ROI Garantizado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 md:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              6 Verticales Especializados
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">
              Cada vertical con funcionalidades completas y específicas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🏢',
                title: 'Alquiler Tradicional',
                desc: 'Gestión completa de alquileres residenciales'
              },
              {
                icon: '🏖️',
                title: 'STR (Vacacional)',
                desc: 'Optimizado para rentas de corta estancia'
              },
              {
                icon: '🛏️',
                title: 'Coliving',
                desc: 'Gestión de habitaciones y espacios compartidos'
              },
              {
                icon: '💹',
                title: 'House Flipping',
                desc: 'Control de reformas y rentabilidad'
              },
              {
                icon: '🏗️',
                title: 'Construcción (eWoorker)',
                desc: 'Marketplace B2B para obras y reformas'
              },
              {
                icon: '💼',
                title: 'Servicios Profesionales',
                desc: 'CRM para agentes y gestores'
              }
            ].map((vertical, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{vertical.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {vertical.title}
                  </h3>
                  <p className="text-gray-600">{vertical.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 md:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              10 Módulos Transversales
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">
              Potenciadores que multiplican el valor de cada vertical
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Zap, title: 'Automatización con IA', color: 'text-yellow-600' },
              { icon: Shield, title: 'ESG & Sostenibilidad', color: 'text-green-600' },
              { icon: BarChart3, title: 'Analytics Avanzado', color: 'text-blue-600' },
              { icon: CheckCircle2, title: 'Marketplace B2C', color: 'text-purple-600' },
              { icon: Star, title: 'Pricing Dinámico IA', color: 'text-orange-600' },
              { icon: Building2, title: 'Tours AR/VR', color: 'text-indigo-600' },
              { icon: Users, title: 'IoT Inteligente', color: 'text-teal-600' },
              { icon: TrendingUp, title: 'Blockchain', color: 'text-pink-600' }
            ].map((module, idx) => {
              const Icon = module.icon;
              return (
                <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <Icon className={`h-8 w-8 ${module.color}`} />
                  <span className="text-lg font-semibold text-gray-900">{module.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 md:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Planes y Precios
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">
              Empieza gratis y escala según tu negocio crece
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '€49',
                period: '/mes',
                features: ['Hasta 10 propiedades', 'Módulos básicos', 'Soporte email', '1 usuario']
              },
              {
                name: 'Professional',
                price: '€149',
                period: '/mes',
                features: ['Hasta 100 propiedades', 'Todos los módulos', 'Soporte prioritario', '5 usuarios'],
                featured: true
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                features: ['Propiedades ilimitadas', 'White-label', 'Soporte dedicado', 'Usuarios ilimitados']
              }
            ].map((plan, idx) => (
              <Card key={idx} className={`${plan.featured ? 'border-2 border-indigo-600 shadow-xl ring-2 ring-indigo-200' : 'border border-gray-200'} hover:shadow-2xl transition-all`}>
                <CardContent className="p-6 md:p-8">
                  {plan.featured && (
                    <div className="text-center mb-4">
                      <span className="inline-block px-4 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-full">
                        Más Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl md:text-4xl font-extrabold text-indigo-600">{plan.price}</span>
                      {plan.period && <span className="text-base text-gray-600">{plan.period}</span>}
                    </div>
                  </div>
                  <ul className="space-y-2.5 md:space-y-3 mb-6 md:mb-8 min-h-[140px]">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm md:text-base text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="block">
                    <Button 
                      className="w-full min-h-[44px]" 
                      variant={plan.featured ? 'default' : 'outline'}
                      size="lg"
                    >
                      {plan.featured ? '🔥 ' : ''}Empezar Ahora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 md:py-20 px-4 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6 px-4">
            ¿Listo para transformar tu negocio inmobiliario?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 md:mb-8 px-4">
            Únete a las empresas que ya confían en INMOVA
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-gray-100 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg min-h-[48px]">
                Empezar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg min-h-[48px]">
                Hablar con Ventas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6" />
                <span className="text-xl font-bold">INMOVA</span>
              </div>
              <p className="text-gray-400">
                Plataforma PropTech Multi-Vertical para el futuro de la gestión inmobiliaria
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/landing">Características</Link></li>
                <li><Link href="/landing">Precios</Link></li>
                <li><Link href="/landing">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/landing">Sobre Nosotros</Link></li>
                <li><Link href="/contact">Contacto</Link></li>
                <li><Link href="/landing">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/landing">Privacidad</Link></li>
                <li><Link href="/landing">Términos</Link></li>
                <li><Link href="/landing">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 INMOVA. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
