'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, Crown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const comparisonFeatures = [
  { feature: 'Alquiler Tradicional', inmova: true, competitorA: true, competitorB: true, competitorC: true },
  { feature: 'Alquiler por Habitaciones (Coliving)', inmova: true, competitorA: false, competitorB: false, competitorC: false },
  { feature: 'STR / Short Term Rental', inmova: true, competitorA: true, competitorB: false, competitorC: true },
  { feature: 'House Flipping', inmova: true, competitorA: false, competitorB: false, competitorC: false },
  { feature: 'Construcción (9 fases)', inmova: true, competitorA: false, competitorB: false, competitorC: false },
  { feature: 'Servicios Profesionales', inmova: true, competitorA: false, competitorB: false, competitorC: false },
  { feature: 'Portal Inquilinos PWA', inmova: true, competitorA: true, competitorB: false, competitorC: true },
  { feature: 'Portal Propietarios PWA', inmova: true, competitorA: false, competitorB: false, competitorC: true },
  { feature: 'Portal Proveedores', inmova: true, competitorA: false, competitorB: false, competitorC: false },
  { feature: 'Asistente IA GPT-4', inmova: true, competitorA: false, competitorB: false, competitorC: false },
  { feature: 'Blockchain & NFTs', inmova: true, competitorA: false, competitorB: false, competitorC: false },
  { feature: 'Mantenimiento Predictivo IA', inmova: true, competitorA: false, competitorB: false, competitorC: false },
  { feature: 'Firma Digital Integrada', inmova: true, competitorA: true, competitorB: false, competitorC: false },
  { feature: 'Open Banking', inmova: true, competitorA: false, competitorB: false, competitorC: false },
  { feature: 'ESG & Sostenibilidad', inmova: true, competitorA: false, competitorB: false, competitorC: false },
  { feature: 'Economía Circular', inmova: true, competitorA: false, competitorB: false, competitorC: false },
  { feature: 'Channel Manager STR', inmova: true, competitorA: true, competitorB: false, competitorC: true },
  { feature: 'Integración Stripe', inmova: true, competitorA: false, competitorB: true, competitorC: true },
  { feature: 'CRM Inmobiliario', inmova: true, competitorA: true, competitorB: false, competitorC: true },
  { feature: 'Business Intelligence', inmova: true, competitorA: true, competitorB: false, competitorC: false },
  { feature: 'Multi-Vertical (7 modelos)', inmova: true, competitorA: false, competitorB: false, competitorC: false },
];

const pricing = [
  { name: 'INMOVA', price: '€149/mes', modules: 56, color: 'indigo' },
  { name: 'Competidor A', price: '€199/mes', modules: 28, color: 'gray' },
  { name: 'Competidor B', price: '€129/mes', modules: 18, color: 'gray' },
  { name: 'Competidor C', price: '€179/mes', modules: 35, color: 'gray' },
];

export function CompetitorComparisonSection() {
  return (
    <section id="comparison" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200 px-4 py-2">
            <Crown className="h-4 w-4 mr-1 inline" />
            Líder del Mercado
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            ¿Por Qué Elegir INMOVA?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comparamos funcionalidad por funcionalidad para que veas claramente por qué somos la opción más completa del mercado
          </p>
        </div>

        {/* Price Comparison Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12 max-w-7xl mx-auto">
          {pricing.map((item, i) => (
            <Card 
              key={i} 
              className={`${
                item.color === 'indigo' 
                  ? 'border-indigo-500 border-4 shadow-2xl scale-105' 
                  : 'border-gray-300'
              } hover:shadow-lg transition-all`}
            >
              <CardHeader className="pb-4 text-center">
                {item.color === 'indigo' && (
                  <Badge className="mb-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0">
                    Mejor Opción
                  </Badge>
                )}
                <CardTitle className={`text-xl ${
                  item.color === 'indigo' ? 'text-indigo-600' : 'text-gray-700'
                }`}>
                  {item.name}
                </CardTitle>
                <p className={`text-3xl font-bold mt-2 ${
                  item.color === 'indigo' ? 'text-indigo-600' : 'text-gray-600'
                }`}>
                  {item.price}
                </p>
                <p className="text-sm text-gray-500 mt-1">{item.modules} módulos</p>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Features Comparison Table */}
        <div className="overflow-x-auto">
          <Card className="max-w-7xl mx-auto">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                    <tr>
                      <th className="text-left p-4 font-semibold sticky left-0 bg-gradient-to-r from-indigo-600 to-violet-600 z-10">
                        Funcionalidad
                      </th>
                      <th className="p-4 font-semibold text-center min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <Crown className="h-5 w-5" />
                          <span>INMOVA</span>
                        </div>
                      </th>
                      <th className="p-4 font-semibold text-center min-w-[120px]">Competidor A</th>
                      <th className="p-4 font-semibold text-center min-w-[120px]">Competidor B</th>
                      <th className="p-4 font-semibold text-center min-w-[120px]">Competidor C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((row, i) => (
                      <tr 
                        key={i} 
                        className={`border-b ${
                          i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-indigo-50/50 transition-colors`}
                      >
                        <td className="p-4 font-medium text-gray-700 sticky left-0 bg-inherit z-10">
                          {row.feature}
                        </td>
                        <td className="p-4 text-center">
                          {row.inmova ? (
                            <div className="flex justify-center">
                              <div className="bg-green-100 rounded-full p-1">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <div className="bg-red-100 rounded-full p-1">
                                <X className="h-6 w-6 text-red-600" />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {row.competitorA ? (
                            <div className="flex justify-center">
                              <div className="bg-gray-100 rounded-full p-1">
                                <CheckCircle className="h-6 w-6 text-gray-500" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <div className="bg-red-100 rounded-full p-1">
                                <X className="h-6 w-6 text-red-400" />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {row.competitorB ? (
                            <div className="flex justify-center">
                              <div className="bg-gray-100 rounded-full p-1">
                                <CheckCircle className="h-6 w-6 text-gray-500" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <div className="bg-red-100 rounded-full p-1">
                                <X className="h-6 w-6 text-red-400" />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {row.competitorC ? (
                            <div className="flex justify-center">
                              <div className="bg-gray-100 rounded-full p-1">
                                <CheckCircle className="h-6 w-6 text-gray-500" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <div className="bg-red-100 rounded-full p-1">
                                <X className="h-6 w-6 text-red-400" />
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left text-white">
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  56 Módulos vs 18-35 de la Competencia
                </h3>
                <p className="text-indigo-100">
                  Ahorra hasta un 70% consolidando múltiples herramientas en INMOVA
                </p>
              </div>
              <Link href="/register">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-bold px-8 py-6 text-lg whitespace-nowrap">
                  Prueba Gratis 30 Días
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 max-w-3xl mx-auto">
            *Comparativa basada en funcionalidades públicas de las principales plataformas PropTech del mercado español. 
            Los datos se actualizan trimestralmente. Última actualización: Q1 2026.
          </p>
        </div>
      </div>
    </section>
  );
}
