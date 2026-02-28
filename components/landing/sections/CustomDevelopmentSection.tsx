'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code2, Zap, Clock, ArrowRight, Wrench, Puzzle, Rocket } from 'lucide-react';

export function CustomDevelopmentSection() {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 border border-white rounded-full" />
        <div className="absolute bottom-10 right-10 w-48 h-48 border border-white rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white rounded-full" />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 px-4 py-2 text-sm font-bold backdrop-blur-sm">
            <Code2 className="h-4 w-4 mr-2" />
            Desarrollos a Medida
          </Badge>

          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            ¿Necesitas algo que no existe?{' '}
            <span className="text-amber-300">Lo desarrollamos para ti</span>
          </h2>

          <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            Nuestro equipo de desarrollo implementa funcionalidades personalizadas 
            adaptadas a las necesidades específicas de tu negocio inmobiliario. 
            Desde integraciones con tus sistemas hasta módulos completamente nuevos.
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Zap className="h-8 w-8 text-amber-300 mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">Desarrollo Ágil</h3>
              <p className="text-sm text-indigo-200">
                Sprints semanales con entregas incrementales. Ves resultados desde la primera semana.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Puzzle className="h-8 w-8 text-amber-300 mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">Integración Total</h3>
              <p className="text-sm text-indigo-200">
                Los desarrollos se integran nativamente con la plataforma. Sin parches ni soluciones temporales.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Rocket className="h-8 w-8 text-amber-300 mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">Entrega Rápida</h3>
              <p className="text-sm text-indigo-200">
                La mayoría de desarrollos personalizados se entregan en días, no en meses.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/landing/contacto">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-8 shadow-xl">
                Solicitar desarrollo a medida
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/landing/demo">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-bold px-8">
                Ver demo de la plataforma
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
