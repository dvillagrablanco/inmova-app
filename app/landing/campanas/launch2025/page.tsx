'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Rocket,
  CheckCircle,
  TrendingUp,
  Zap,
  Shield,
  ArrowRight,
  DollarSign,
  Clock,
  Users,
  Star,
  Sparkles,
  Target,
  Award,
  AlertCircle,
  X,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export default function Launch2025Page() {
  const [email, setEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Countdown timer hasta fin de Q1 2026 (31 marzo 2026)
  useEffect(() => {
    const countDownDate = new Date('2026-03-31T23:59:59').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = countDownDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleEarlyAccess = async () => {
    if (!email) return;

    // Redirect to register with the email and LAUNCH2026 coupon
    window.location.href = `/register?email=${encodeURIComponent(email)}&coupon=LAUNCH2026`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-indigo-500/30 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-indigo-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                INMOVA
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-indigo-400">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register?coupon=LAUNCH2026">
                <Button className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white">
                  Comenzar Ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-gradient-to-r from-pink-500 to-violet-500 text-white border-0 text-lg px-6 py-2">
            <Rocket className="h-5 w-5 mr-2" />
            Campaña LAUNCH2026
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-white leading-tight">
            Tu Software Actual <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              Se Te Ha Quedado Pequeño
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-indigo-200 mb-8 max-w-4xl mx-auto">
            Pásate al primer ecosistema{' '}
            <strong className="text-white">Multi-Vertical PropTech</strong> con 88 módulos
            profesionales.
            <br />
            <span className="text-white font-semibold">Por el mismo precio que pagas ahora.</span>
          </p>

          {/* OFERTA DESTACADA */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 max-w-3xl mx-auto mb-12 border-4 border-yellow-400 shadow-2xl shadow-yellow-400/50">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-yellow-300" />
              <p className="text-4xl md:text-5xl font-black text-white">50% DE DESCUENTO</p>
              <Sparkles className="h-8 w-8 text-yellow-300" />
            </div>
            <p className="text-xl text-indigo-100 mb-6">
              En tu primer mes - Código: <strong className="text-yellow-300">LAUNCH2026</strong>
            </p>

            {/* COUNTDOWN TIMER */}
            <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-3xl font-bold text-white">{timeLeft.days}</p>
                <p className="text-sm text-indigo-200">Días</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-3xl font-bold text-white">{timeLeft.hours}</p>
                <p className="text-sm text-indigo-200">Horas</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-3xl font-bold text-white">{timeLeft.minutes}</p>
                <p className="text-sm text-indigo-200">Minutos</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-3xl font-bold text-white">{timeLeft.seconds}</p>
                <p className="text-sm text-indigo-200">Segundos</p>
              </div>
            </div>

            {/* EMAIL CAPTURE */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white text-gray-900 border-2 border-yellow-400 h-14 text-lg placeholder:text-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && handleEarlyAccess()}
              />
              <Button
                size="lg"
                onClick={handleEarlyAccess}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold h-14 px-8 whitespace-nowrap shadow-lg border-2 border-yellow-500"
              >
                🎁 Activar Oferta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARATIVA - Por qué INMOVA */}
      <section className="py-20 px-4 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">
            ¿Por Qué Cambiar a INMOVA?
          </h2>
          <p className="text-xl text-indigo-200 text-center mb-12 max-w-3xl mx-auto">
            Otros sistemas te obligan a contratar múltiples herramientas. <br />
            <strong className="text-white">INMOVA lo incluye TODO en una sola plataforma.</strong>
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Columna: Competencia */}
            <Card className="bg-red-900/20 border-red-500/50">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <X className="h-6 w-6 text-red-400" />
                  Otros Sistemas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-red-200">
                  <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-1" />
                  <p>Software fragmentado - necesitas 3-4 herramientas diferentes</p>
                </div>
                <div className="flex items-start gap-2 text-red-200">
                  <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-1" />
                  <p>Gestión vacacional por separado (€50-100/mes extra)</p>
                </div>
                <div className="flex items-start gap-2 text-red-200">
                  <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-1" />
                  <p>Sin módulos de obras o house flipping</p>
                </div>
                <div className="flex items-start gap-2 text-red-200">
                  <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-1" />
                  <p>Firma digital como add-on (€20-30/mes)</p>
                </div>
                <div className="flex items-start gap-2 text-red-200">
                  <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-1" />
                  <p>CRM básico o inexistente</p>
                </div>
                <div className="flex items-start gap-2 text-red-200">
                  <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-1" />
                  <p>Sin IA ni automatización inteligente</p>
                </div>
                <div className="bg-red-800/30 p-4 rounded-lg mt-4">
                  <p className="text-2xl font-bold text-white">~€400/mes</p>
                  <p className="text-red-200 text-sm">Coste real sumando todas las herramientas</p>
                </div>
              </CardContent>
            </Card>

            {/* Columna: INMOVA */}
            <Card className="bg-green-900/20 border-green-500/50">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  INMOVA - Todo Incluido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-1" />
                  <p>
                    <strong>88 módulos</strong> en una sola plataforma unificada
                  </p>
                </div>
                <div className="flex items-start gap-2 text-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-1" />
                  <p>
                    <strong>Channel Manager nativo</strong> (Airbnb, Booking, VRBO) incluido
                  </p>
                </div>
                <div className="flex items-start gap-2 text-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-1" />
                  <p>
                    <strong>House Flipping + Construcción</strong> con ROI en tiempo real
                  </p>
                </div>
                <div className="flex items-start gap-2 text-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-1" />
                  <p>
                    <strong>Firma Digital cualificada</strong> sin coste adicional
                  </p>
                </div>
                <div className="flex items-start gap-2 text-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-1" />
                  <p>
                    <strong>CRM Avanzado + Portal Propietario</strong> completo
                  </p>
                </div>
                <div className="flex items-start gap-2 text-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-1" />
                  <p>
                    <strong>IA GPT-4 + Mantenimiento Predictivo</strong> incluidos
                  </p>
                </div>
                <div className="bg-green-800/30 p-4 rounded-lg mt-4 border-2 border-green-400">
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl line-through text-green-300">€199/mes</p>
                    <p className="text-3xl font-bold text-white">€99.50/mes</p>
                  </div>
                  <p className="text-green-200 text-sm">Con código LAUNCH2026 (50% primer mes)</p>
                  <p className="text-xs text-green-300 mt-1">Coste por módulo: solo €1.66</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TCO COMPARISON */}
          <div className="mt-12 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto border border-indigo-500/30">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              <DollarSign className="inline h-6 w-6 mr-2" />
              Comparativa de Coste Total (TCO) - Primer Año
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-indigo-200 mb-2">Competencia Fragmentada</p>
                <p className="text-4xl font-bold text-red-400">€4,800</p>
                <p className="text-sm text-indigo-300 mt-1">Software + Add-ons</p>
              </div>
              <div className="text-center">
                <p className="text-indigo-200 mb-2">INMOVA Precio Normal</p>
                <p className="text-4xl font-bold text-white">€2,388</p>
                <p className="text-sm text-indigo-300 mt-1">Todo Incluido</p>
              </div>
              <div className="text-center border-2 border-green-400 rounded-lg p-4 bg-green-900/20">
                <p className="text-green-200 mb-2 font-semibold">Con LAUNCH2025</p>
                <p className="text-5xl font-bold text-green-400">€2,288</p>
                <p className="text-sm text-green-300 mt-1 font-semibold">¡Ahorra €2,512!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 VERTICALES */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">
            7 Modelos de Negocio, 1 Plataforma
          </h2>
          <p className="text-xl text-indigo-200 text-center mb-12 max-w-3xl mx-auto">
            La única plataforma PropTech que gestiona <strong className="text-white">todos</strong>{' '}
            los verticales inmobiliarios.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {[
              {
                icon: Building2,
                title: 'Alquiler Tradicional',
                desc: 'Gestión completa de contratos, IPC, morosidad',
              },
              {
                icon: Star,
                title: 'Short-Term Rental',
                desc: 'Channel Manager + Pricing Dinámico',
              },
              {
                icon: TrendingUp,
                title: 'House Flipping',
                desc: 'ROI en tiempo real + Pipeline de inversión',
              },
              {
                icon: Shield,
                title: 'Construcción',
                desc: '9 fases de obra + Control de subcontratas',
              },
              {
                icon: Users,
                title: 'Coliving Avanzado',
                desc: 'Prorrateo automático + Gestión de convivencia',
              },
              { icon: Award, title: 'Hoteles', desc: 'Reservas + Housekeeping integrado' },
              {
                icon: Target,
                title: 'Servicios Profesionales',
                desc: 'ITEs + Certificaciones para arquitectos',
              },
            ].map((vertical, idx) => (
              <Card
                key={idx}
                className="bg-white/5 backdrop-blur-sm border-indigo-500/30 hover:border-indigo-400 transition-all"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg">
                      <vertical.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-white">{vertical.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-indigo-200">{vertical.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20 px-4 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-white">
            Únete a los Innovadores del Sector
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            <div className="text-center">
              <p className="text-5xl font-bold text-indigo-400 mb-2">88</p>
              <p className="text-indigo-200">Módulos Profesionales</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-violet-400 mb-2">7</p>
              <p className="text-indigo-200">Verticales de Negocio</p>
            </div>
            <div className="text-center">
            <p className="text-5xl font-bold text-pink-400 mb-2">150+</p>
            <p className="text-indigo-200">Clientes Objetivo Q1 2026</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-8 w-8 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-center text-xl text-indigo-200 italic max-w-2xl mx-auto">
            "Finalmente una plataforma que entiende que gestiono alquileres tradicionales{' '}
            <strong className="text-white">Y</strong> vacacionales. Ya no necesito 3 softwares
            diferentes."
          </p>
          <p className="text-center text-indigo-300 mt-4">— Beta Tester, Agencia PropTech Madrid</p>
        </div>
      </section>

      {/* URGENCIA + CTA FINAL */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-br from-indigo-600 to-violet-600 border-0 max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-8 w-8 text-yellow-300" />
                <Badge className="bg-yellow-400 text-gray-900 text-lg px-4 py-1">
                  Oferta Limitada Q1 2026
                </Badge>
              </div>
              <CardTitle className="text-4xl md:text-5xl font-bold text-white mb-4">
                No Pierdas Esta Oportunidad
              </CardTitle>
              <CardDescription className="text-xl text-indigo-100">
                Solo <strong className="text-white">150 plazas disponibles</strong> con el descuento
                LAUNCH2026.
                <br />
                Sé parte de la revolución PropTech Multi-Vertical.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <p className="text-white font-semibold">50% de descuento primer mes</p>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <p className="text-white font-semibold">Migración asistida GRATIS (valor €500)</p>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <p className="text-white font-semibold">Onboarding personalizado 1-a-1</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <p className="text-white font-semibold">
                    Sin permanencia - Cancela cuando quieras
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Link href="/register?coupon=LAUNCH2026" className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg h-16 px-8"
                  >
                    <Rocket className="mr-2 h-6 w-6" />
                    Activar LAUNCH2026 Ahora
                  </Button>
                </Link>
                <Link href="/landing/migracion" className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold text-lg h-16 px-8 border-0"
                  >
                    <ChevronRight className="mr-2 h-5 w-5" />
                    Ver Guía de Migración
                  </Button>
                </Link>
              </div>

              <div className="text-center pt-4">
                <p className="text-indigo-100 text-sm">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  Código LAUNCH2026 válido solo hasta el 31 de marzo de 2026
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FOOTER MINIMO */}
      <footer className="py-12 px-4 bg-slate-950 border-t border-indigo-900/50">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-6 w-6 text-indigo-400" />
            <span className="text-xl font-bold text-white">INMOVA</span>
          </div>
          <p className="text-indigo-300 text-sm mb-4">
            La plataforma PropTech Multi-Vertical más completa del mercado
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-indigo-400">
            <Link href="/landing/legal/privacidad" className="hover:text-indigo-300">
              Privacidad
            </Link>
            <Link href="/landing/legal/terminos" className="hover:text-indigo-300">
              Términos
            </Link>
            <Link href="/landing/contacto" className="hover:text-indigo-300">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
