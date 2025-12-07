'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, TrendingUp, Star, ArrowRight, Play, Rocket } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 px-4 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 opacity-70" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="container mx-auto relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Main Content */}
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 backdrop-blur-sm border border-indigo-200 rounded-full">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                #1 PropTech Multi-Vertical en España
              </span>
              <Rocket className="h-4 w-4 text-indigo-600" />
            </div>

            {/* Competitive Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-100 border-2 border-green-300 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-700" />
              <span className="text-sm font-bold text-green-700">
                70% más económico que Homming • 6x más funcionalidad
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
              <span className="block text-gray-900 mb-2">7 Verticales. 88 Módulos.</span>
              <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                Una Sola Plataforma.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              La plataforma <span className="font-semibold text-indigo-600">multi-vertical más completa</span> del mercado.
              Gestiona <span className="font-semibold text-violet-600">Alquiler, STR, Coliving, Flipping, Construcción</span> y más en un solo lugar.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="gradient-primary text-white px-8 py-6 text-lg font-semibold hover:opacity-90 transition-all shadow-primary w-full sm:w-auto group"
                >
                  Prueba Gratis 30 Días
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/landing/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-lg font-semibold border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 w-full sm:w-auto group"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Ver Demo
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                <span className="font-medium">500+ Empresas</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-600" />
                <span className="font-medium">10,000+ Propiedades</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-pink-600" />
                <span className="font-medium">98% Satisfacción</span>
              </div>
            </div>

            {/* Video Demo Hero */}
            <div className="mt-12 max-w-5xl mx-auto">
              <Card className="overflow-hidden shadow-2xl border-4 border-indigo-200">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-black">
                    <iframe 
                      src="https://www.youtube.com/embed/zm55Gdl5G1Q?si=XZe1uSGRtyAUzLGX" 
                      title="INMOVA Platform Demo" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid Below Video */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { number: '88', label: 'Módulos Profesionales', icon: Building2 },
                  { number: '7', label: 'Verticales de Negocio', icon: TrendingUp },
                  { number: '€60', label: 'Desde €60/mes', icon: Star },
                  { number: '<24h', label: 'Respuesta Soporte', icon: Users },
                ].map((stat, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <stat.icon className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        {stat.number}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
