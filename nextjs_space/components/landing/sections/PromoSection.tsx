'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Sparkles, Rocket, ArrowRight, AlertCircle } from 'lucide-react';

export function PromoSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 border-y-4 border-yellow-400">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-4 bg-yellow-400 text-gray-900 border-0 text-base px-4 py-1.5">
                <Sparkles className="h-4 w-4 mr-2" />
                OFERTA Q1 2026
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                50% DE DESCUENTO<br />Primer Mes
              </h2>
              <p className="text-xl text-indigo-100 mb-6">
                Únete a la campaña <strong className="text-yellow-300">LAUNCH2025</strong> y obtén acceso completo a los 56 módulos profesionales.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/landing/campanas/launch2025">
                  <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg h-14 px-8">
                    <Rocket className="mr-2 h-5 w-5" />
                    Ver Oferta Completa
                  </Button>
                </Link>
                <Link href="/landing/calculadora-roi">
                  <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold text-lg h-14 px-8">
                    Calcular Mi Ahorro
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
                Incluye:
              </h3>
              <div className="space-y-3 text-white">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p>Acceso a los <strong>56 módulos profesionales</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p>Migración asistida <strong>GRATIS</strong> (valor €500)</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p>Onboarding personalizado 1-a-1</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p>Sin permanencia - Cancela cuando quieras</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/20">
                <p className="text-sm text-indigo-200">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  Válido hasta el 31 de marzo de 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
