'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Landmark,
  TrendingUp,
  Shield,
  Building2,
  PieChart,
  Brain,
  ArrowRight,
  CheckCircle2,
  Globe,
  Banknote,
  Briefcase,
  BarChart3,
} from 'lucide-react';

const features = [
  {
    icon: PieChart,
    title: 'Dashboard Patrimonial 360°',
    desc: 'Inmuebles + carteras financieras + private equity + tesorería en una sola pantalla. Asset allocation en tiempo real.',
  },
  {
    icon: Globe,
    title: 'Integración Bancaria Universal',
    desc: 'Conecta con cualquier entidad bancaria: banca privada, gestoras, custodios y banca comercial. Vía PSD2, SWIFT o OCR con IA.',
  },
  {
    icon: Briefcase,
    title: 'Private Equity Completo',
    desc: 'Capital calls, distribuciones, DPI, TVPI, IRR, J-curve. Tracking de participaciones societarias y coinversiones.',
  },
  {
    icon: Banknote,
    title: 'Tesorería 12 Meses',
    desc: 'Saldos consolidados de todos tus bancos. Previsión mensual de cobros, pagos, hipotecas y fiscal. Alertas de liquidez.',
  },
  {
    icon: Brain,
    title: 'Simulador Fiscal What-If',
    desc: '¿Vendo este inmueble? ¿Subo alquileres? ¿Amortizo hipoteca? Compara escenarios con impacto en IS y cash-flow.',
  },
  {
    icon: BarChart3,
    title: 'Modelos Tributarios + Reporting',
    desc: 'Genera Modelo 202, 200, 303 y 347 automáticamente. Export contable PGC para tu gestoría. Reporting adaptado a las necesidades de tu family office.',
  },
];

const connectionTypes = [
  'Banca Privada',
  'Gestoras de Fondos',
  'Custodios Internacionales',
  'Banca Comercial',
  'Plataformas de Inversión',
  'Entidades Extranjeras',
];

export function FamilyOfficeSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-2 text-sm font-bold">
            <Landmark className="h-4 w-4 mr-2" />
            Add-on Premium — Family Office
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Control Patrimonial Total
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            La <strong>única plataforma</strong> que consolida gestión inmobiliaria operativa + carteras financieras + private equity + tesorería multi-banco.
            Para family offices y holdings patrimoniales.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((f, i) => (
            <Card key={i} className="group hover:shadow-xl transition-all border-2 hover:border-amber-300 bg-white">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Connection Types Strip */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-amber-100 mb-12">
          <div className="text-center mb-4">
            <h3 className="font-bold text-gray-900">Compatible con cualquier entidad bancaria</h3>
            <p className="text-sm text-gray-500">3 niveles de integración: PSD2 automático · SWIFT MT940/MT535 · OCR de extractos PDF con IA</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {connectionTypes.map((type) => (
              <div key={type} className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border text-sm font-medium text-gray-700">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                {type}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { name: 'FO Starter', price: '€299', features: ['Dashboard 360°', 'Import manual + OCR', 'Modelos tributarios', 'Reporting básico'] },
            { name: 'FO Professional', price: '€599', popular: true, features: ['Bancos ilimitados (PSD2/SWIFT)', 'Private Equity completo', 'Simulador fiscal + Copiloto IA', 'Tesorería 12 meses'] },
            { name: 'FO Enterprise', price: '€999', features: ['Todo Professional', 'API para gestoría y reporting', 'Informes personalizados', 'SLA dedicado', 'Onboarding presencial'] },
          ].map((plan, i) => (
            <Card key={i} className={`text-center ${plan.popular ? 'border-amber-500 border-2 shadow-xl ring-2 ring-amber-200' : 'border-2'}`}>
              {plan.popular && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-1.5 text-sm font-bold rounded-t-lg">
                  Más Popular
                </div>
              )}
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <div className="text-3xl font-black text-amber-600 mb-1">{plan.price}</div>
                <div className="text-sm text-gray-500 mb-4">/mes</div>
                <ul className="text-sm text-left space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register?addon=family-office">
                  <Button className={`w-full ${plan.popular ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                    Empezar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            ¿Gestionas un family office con +€10M en activos? <Link href="/landing/contacto" className="text-amber-600 font-semibold hover:underline">Habla con nuestro equipo →</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
