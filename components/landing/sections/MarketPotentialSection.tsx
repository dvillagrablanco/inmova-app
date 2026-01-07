'use client';

import { Card, CardContent } from '@/components/ui/card';

export function MarketPotentialSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Por qué elegir Inmova
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            La plataforma PropTech más completa del mercado español
          </p>
        </div>

        {/* Ventaja Competitiva */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="border-2 border-green-200 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Por qué somos diferentes
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Única multi-vertical:</strong> 8 verticales vs 1 de la competencia</span>
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
