'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Target, Rocket, Award, TrendingUp, Zap, Heart } from 'lucide-react';

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                INMOVA
              </span>
            </Link>
            <div className="flex gap-4">
              <Link href="/landing">
                <Button variant="ghost">Inicio</Button>
              </Link>
              <Link href="/login">
                <Button>Iniciar Sesión</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white text-gray-900 border-2 border-indigo-400 px-4 py-2 font-bold shadow-sm">
              <Heart className="h-4 w-4 mr-1 inline text-indigo-600" />
              Sobre Nosotros
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              Revolucionando la
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                {' '}
                Gestión Inmobiliaria
              </span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              INMOVA es la plataforma PropTech líder en España, diseñada para unificar todos los
              modelos de negocio inmobiliario en una sola solución integral.
            </p>
          </div>
        </div>
      </section>

      {/* NUESTRA MISIÓN */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-indigo-200 bg-white">
              <CardHeader>
                <Target className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle className="text-2xl">Nuestra Misión</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Eliminar la fragmentación tecnológica del sector inmobiliario, proporcionando una
                  plataforma única que integra 88 módulos profesionales y 7 verticales de negocio,
                  permitiendo a las gestoras reducir sus costes de software en un 70% y aumentar su
                  ROI en un 25%.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-violet-200 bg-white">
              <CardHeader>
                <Rocket className="h-12 w-12 text-violet-600 mb-4" />
                <CardTitle className="text-2xl">Nuestra Visión</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Convertirnos en la plataforma PropTech de referencia en Europa, impulsando la
                  transformación digital del sector inmobiliario mediante tecnologías de vanguardia
                  como IA, Blockchain, IoT y automatización inteligente.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Nuestros Valores</h2>
            <p className="text-xl text-gray-600">Los principios que guían nuestro trabajo</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Innovación Constante',
                desc: 'Siempre a la vanguardia tecnológica, integrando las últimas tendencias PropTech.',
              },
              {
                icon: Users,
                title: 'Cliente Primero',
                desc: 'Escuchamos activamente a nuestros usuarios para evolucionar según sus necesidades reales.',
              },
              {
                icon: Award,
                title: 'Excelencia Operativa',
                desc: 'Compromiso con la calidad, el uptime del 99.9% y el soporte excepcional.',
              },
              {
                icon: TrendingUp,
                title: 'Crecimiento Sostenible',
                desc: 'Desarrollo responsable que beneficia a clientes, equipo y medio ambiente.',
              },
              {
                icon: Heart,
                title: 'Transparencia Total',
                desc: 'Comunicación clara, precios justos y sin costes ocultos.',
              },
              {
                icon: Rocket,
                title: 'Agilidad y Eficiencia',
                desc: 'Optimizamos procesos para que nuestros clientes sean más productivos.',
              },
            ].map((valor, i) => (
              <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto p-4 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                    <valor.icon className="h-10 w-10 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg">{valor.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{valor.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Nuestro Equipo</h2>
            <p className="text-xl text-gray-600">Expertos en PropTech, tecnología e innovación</p>
          </div>
          <Card className="border-2">
            <CardContent className="p-8">
              <p className="text-lg text-gray-700 leading-relaxed text-center">
                INMOVA es desarrollado por <strong>Enxames Investments SL</strong>, una empresa
                especializada en soluciones tecnológicas para el sector inmobiliario. Nuestro equipo
                multidisciplinar combina experiencia en desarrollo de software, gestión
                inmobiliaria, inteligencia artificial y blockchain para crear la plataforma PropTech
                más completa del mercado.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-black mb-2">88</div>
              <div className="text-white/90">Módulos Profesionales</div>
            </div>
            <div>
              <div className="text-5xl font-black mb-2">7</div>
              <div className="text-white/90">Verticales de Negocio</div>
            </div>
            <div>
              <div className="text-5xl font-black mb-2">500+</div>
              <div className="text-white/90">Empresas Confían</div>
            </div>
            <div>
              <div className="text-5xl font-black mb-2">10,000+</div>
              <div className="text-white/90">Propiedades Gestionadas</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-6">¿Listo para Unirte a la Revolución PropTech?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a las 500+ empresas que ya confían en INMOVA para gestionar su negocio
            inmobiliario
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
              >
                Prueba Gratis 30 Días
              </Button>
            </Link>
            <Link href="/landing/contacto">
              <Button size="lg" variant="outline">
                Contactar Ventas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">
            &copy; 2026 INMOVA. Powered by Enxames Investments SL. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
