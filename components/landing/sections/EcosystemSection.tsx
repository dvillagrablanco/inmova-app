'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Home,
  Hotel,
  Hammer,
  TrendingUp,
  Shield,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
  Globe,
  Calendar,
} from 'lucide-react';

// 7 Verticales de Negocio
const verticales = [
  { icon: Building2, name: 'Alquiler Residencial', desc: 'Tradicional + Media Estancia', color: 'from-blue-500 to-cyan-500' },
  { icon: Hotel, name: 'STR (Vacacional)', desc: 'Airbnb, Booking, VRBO', color: 'from-orange-500 to-amber-500' },
  { icon: Home, name: 'Coliving', desc: 'Habitaciones y prorrateo', color: 'from-purple-500 to-pink-500' },
  { icon: TrendingUp, name: 'House Flipping', desc: 'Compra-reforma-venta', color: 'from-green-500 to-emerald-500' },
  { icon: Hammer, name: 'Construcción B2B', desc: 'ewoorker marketplace', color: 'from-orange-600 to-yellow-500' },
  { icon: Shield, name: 'Comunidades', desc: 'Admin de fincas', color: 'from-cyan-500 to-blue-500' },
  { icon: Users, name: 'Servicios Pro', desc: 'Property management', color: 'from-indigo-500 to-violet-500' },
];

const keyNumbers = [
  { value: '7', label: 'Verticales de Negocio', icon: Building2 },
  { value: '100+', label: 'Módulos Incluidos', icon: Zap },
  { value: '5,000+', label: 'Usuarios Activos', icon: Users },
  { value: '€15M+', label: 'Gestionado Mensual', icon: TrendingUp },
];

export function EcosystemSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 text-base">
            <Globe className="h-5 w-5 mr-2 inline" />
            ECOSISTEMA COMPLETO
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Todo el Ciclo Inmobiliario
            </span>
            <br />
            en Una Sola Plataforma
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Desde la gestión de alquileres hasta la construcción B2B. Inmova es el único ecosistema
            que cubre <strong>cada etapa</strong> de tu negocio inmobiliario.
          </p>
        </div>

        {/* Key Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {keyNumbers.map((num, i) => {
            const Icon = num.icon;
            return (
              <Card key={i} className="text-center border-2 hover:shadow-xl transition-all">
                <CardContent className="pt-6">
                  <Icon className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                  <div className="text-4xl font-black text-gray-900 mb-1">{num.value}</div>
                  <div className="text-sm text-gray-600">{num.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 7 Verticales en Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center mb-8">7 Verticales de Negocio</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {verticales.map((vertical, i) => {
              const Icon = vertical.icon;
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl border-2 border-gray-200 bg-white hover:shadow-lg hover:border-blue-300 transition-all group text-center"
                >
                  <div className={`bg-gradient-to-br ${vertical.color} p-3 rounded-xl w-fit mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{vertical.name}</h4>
                  <p className="text-xs text-gray-500">{vertical.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-10 text-center text-white">
          <Sparkles className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-4">¿Listo para el Ecosistema Completo?</h3>
          <p className="text-xl mb-6 opacity-90 max-w-2xl mx-auto">
            Prueba Inmova 30 días gratis. Acceso completo a todas las verticales y módulos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-bold">
                <Zap className="h-5 w-5 mr-2" />
                Empezar Gratis
              </Button>
            </Link>
            <Link href="#pricing">
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold border-0"
              >
                Ver Planes
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm opacity-75">
            ✓ Sin tarjeta · ✓ Setup 10 min · ✓ Cancela cuando quieras
          </p>
        </div>
      </div>
    </section>
  );
}
