'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Rocket } from 'lucide-react';

export function MarketPotentialSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 border-indigo-200 px-4 py-2">
            <Target className="h-4 w-4 mr-1 inline" />
            Potencial de Mercado España
          </Badge>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              €850M
            </span>
            {' '}de Mercado Disponible
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            El mercado español de PropTech está listo para ser liderado por una plataforma multi-vertical
          </p>
        </div>

        {/* TAM/SAM/SOM Visual */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-2xl transition-all border-2 border-indigo-200">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">€850M</h3>
              <p className="text-sm font-semibold text-indigo-600 mb-3">TAM (Total Market)</p>
              <p className="text-sm text-gray-600">
                Mercado total de gestión inmobiliaria profesional en España
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all border-2 border-violet-200 scale-105">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">€285M</h3>
              <p className="text-sm font-semibold text-violet-600 mb-3">SAM (33% del TAM)</p>
              <p className="text-sm text-gray-600">
                Segmento direccionable con nuestra propuesta de valor
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all border-2 border-green-200">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mb-4">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">€150M</h3>
              <p className="text-sm font-semibold text-green-600 mb-3">SOM (53% del SAM en 5 años)</p>
              <p className="text-sm text-gray-600">
                Objetivo alcanzable convirtiéndonos en líderes del mercado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ventaja Competitiva */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-green-200 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Por qué somos diferentes
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Única multi-vertical:</strong> 6 verticales vs 1 de la competencia</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Módulos transversales:</strong> IA, IoT, Blockchain (nadie más los tiene)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Desde €49/mes:</strong> Sin límites de propiedades</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Dual-channel:</strong> Directo + 34 tipos de partners</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-200 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Oportunidad de mercado
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">→</span>
                  <span><strong>88.5% fragmentado:</strong> Sin líder dominante actual</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">→</span>
                  <span><strong>1.17M propiedades:</strong> Gestionadas profesionalmente en España</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">→</span>
                  <span><strong>Competencia limitada:</strong> Solo productos mono-verticales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">→</span>
                  <span><strong>Momento ideal:</strong> Mercado maduro para consolidación</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
