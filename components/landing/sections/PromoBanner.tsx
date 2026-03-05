'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, TrendingUp, ArrowRightLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface PromoCampaign {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  ctaHref: string;
  icon: React.ReactNode;
  gradient: string;
  textGradient: string;
}

const campaigns: PromoCampaign[] = [
  {
    id: 'launch2026',
    code: 'LAUNCH2026',
    title: '🚀 Lanzamiento: 3 meses al 50%',
    subtitle: 'Cualquier plan al 50% de descuento los 3 primeros meses',
    description: 'Celebramos el lanzamiento de 88+ módulos con IA predictiva. Starter desde €44,50/mes, Profesional desde €99,50/mes. Sin permanencia.',
    cta: 'Activar oferta',
    ctaHref: '/register?coupon=LAUNCH2026',
    icon: <Sparkles className="h-6 w-6" />,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    textGradient: 'from-amber-600 to-red-600'
  },
  {
    id: 'ia-free',
    code: 'IAFREE2026',
    title: '🤖 Addon IA Inmobiliaria GRATIS 2 meses',
    subtitle: 'Valoración IA + Predicción morosidad + Renta óptima sin coste',
    description: 'Activa el addon IA Inmobiliaria (€149/mes) gratis durante 2 meses con cualquier plan. Descubre la IA predictiva que anticipa impagos.',
    cta: 'Probar IA gratis',
    ctaHref: '/register?coupon=IAFREE2026',
    icon: <TrendingUp className="h-6 w-6" />,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    textGradient: 'from-violet-600 to-fuchsia-600'
  },
  {
    id: 'switch26',
    code: 'SWITCH2026',
    title: '🔄 ¿Vienes de otra plataforma?',
    subtitle: 'Migración gratis + 30% dto. 6 meses + Upgrade de plan',
    description: 'Te migramos los datos sin coste y te damos un 30% de descuento durante 6 meses. Más módulos, más verticales, mejor precio.',
    cta: 'Solicitar migración',
    ctaHref: '/landing/contacto?motivo=migracion',
    icon: <ArrowRightLeft className="h-6 w-6" />,
    gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
    textGradient: 'from-indigo-600 to-cyan-600'
  },
  {
    id: 'pack-completo',
    code: 'PACK2026',
    title: '💎 Pack Completo: primer mes a €249',
    subtitle: 'Los 5 addons premium al 50% el primer mes (después €499/mes)',
    description: 'IA + Family Office + Automatización + Analytics + Operaciones. Todo por €249 el primer mes. La suite más completa del mercado.',
    cta: 'Activar Pack Completo',
    ctaHref: '/register?coupon=PACK2026',
    icon: <Sparkles className="h-6 w-6" />,
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    textGradient: 'from-emerald-600 to-teal-600'
  },
];

export function PromoBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 8000); // Cambiar cada 8 segundos

    return () => clearInterval(interval);
  }, [currentIndex]);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const current = campaigns[currentIndex];

  return (
    <section className="py-4 px-4 overflow-hidden">
      <div className="container mx-auto">
        <div className="relative">
          {/* Banner Principal */}
          <div 
            className={`relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-r ${current.gradient} transition-all duration-500 ${isAnimating ? 'scale-[0.98] opacity-90' : 'scale-100 opacity-100'}`}
          >
            {/* Patrón de fondo animado */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.5),transparent_70%)] animate-pulse"></div>
            </div>

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 p-5 sm:p-8 md:p-12">
              {/* Contenido */}
              <div className="flex-1 text-white space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    {current.icon}
                  </div>
                  <div>
                    <Badge className="mb-2 bg-white/30 text-white border-white/50 backdrop-blur-sm px-3 py-1 text-xs font-bold">
                      Código: {current.code}
                    </Badge>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black">
                      {current.title}
                    </h3>
                  </div>
                </div>
                
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold opacity-95">
                  {current.subtitle}
                </p>
                
                <p className="text-sm sm:text-base md:text-lg opacity-90 max-w-2xl leading-relaxed">
                  {current.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link href={current.ctaHref}>
                    <Button 
                      size="lg"
                      className="bg-white hover:bg-gray-100 text-gray-900 font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                    >
                      {current.cta}
                      <Sparkles className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  
                  <span className="text-sm font-semibold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    ⏰ Oferta por tiempo limitado
                  </span>
                </div>
              </div>

              {/* Decoración */}
              <div className="hidden lg:block relative">
                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-black">🎉</div>
                    <div className="text-xs font-bold mt-2">AHORRA</div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>

          {/* Controles de Navegación */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {/* Botón Anterior */}
            <button
              onClick={prevSlide}
              disabled={isAnimating}
              className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Campaña anterior"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>

            {/* Indicadores */}
            <div className="flex gap-2">
              {campaigns.map((campaign, index) => (
                <button
                  key={campaign.id}
                  onClick={() => goToSlide(index)}
                  disabled={isAnimating}
                  className={`transition-all rounded-full ${
                    index === currentIndex
                      ? 'w-12 h-3 bg-gradient-to-r ' + campaign.gradient
                      : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                  } disabled:cursor-not-allowed`}
                  aria-label={`Ir a ${campaign.title}`}
                />
              ))}
            </div>

            {/* Botón Siguiente */}
            <button
              onClick={nextSlide}
              disabled={isAnimating}
              className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Siguiente campaña"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </div>

          {/* Miniaturas de Campañas */}
          <div className="hidden md:grid grid-cols-3 gap-4 mt-6">
            {campaigns.map((campaign, index) => (
              <button
                key={campaign.id}
                onClick={() => goToSlide(index)}
                disabled={isAnimating}
                style={{ backgroundColor: '#ffffff' }}
                className={`group p-4 rounded-xl border-2 transition-all ${
                  index === currentIndex
                    ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-100'
                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                } disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${campaign.gradient} text-white`}>
                    {campaign.icon}
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {campaign.title}
                    </div>
                    <div className="text-xs text-gray-900 font-semibold">
                      {campaign.code}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
