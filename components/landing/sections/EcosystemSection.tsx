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

const ecosystem = [
  {
    category: 'GESTIÓN INMOBILIARIA',
    color: 'from-blue-600 to-cyan-600',
    verticales: [
      {
        icon: Building2,
        name: 'Alquiler Tradicional',
        desc: 'Contratos, pagos, inquilinos',
        users: '1,500+',
      },
      { 
        icon: Calendar, 
        name: 'Media Estancia', 
        desc: '1-11 meses, profesionales', 
        users: '400+', 
        badge: 'NUEVO',
        highlight: true,
      },
      { icon: Hotel, name: 'Vacacional (STR)', desc: 'Airbnb, Booking integrado', users: '800+' },
      {
        icon: Home,
        name: 'Coliving & Habitaciones',
        desc: 'Prorrateo automático',
        users: '600+',
        badge: 'PRO',
      },
      { icon: TrendingUp, name: 'House Flipping', desc: 'ROI y presupuestos', users: '200+' },
    ],
  },
  {
    category: 'CONSTRUCCIÓN B2B',
    color: 'from-orange-600 to-yellow-500',
    badge: '🚀 NOVEDADES 2026',
    verticales: [
      {
        icon: Hammer,
        name: 'ewoorker',
        desc: 'Subcontratación + IA + Gamificación',
        users: '2,500+',
        highlight: true,
        badge: 'IA',
      },
    ],
  },
  {
    category: 'SERVICIOS COMPLEMENTARIOS',
    color: 'from-purple-600 to-pink-600',
    verticales: [
      {
        icon: Shield,
        name: 'Seguros',
        desc: 'Pólizas y siniestros',
        users: 'Todos',
        badge: 'NUEVO',
      },
      {
        icon: Users,
        name: 'Partners',
        desc: 'Bancos, Aseguradoras',
        users: '15+',
        badge: 'NUEVO',
      },
    ],
  },
];

const keyNumbers = [
  { value: '8', label: 'Verticales de Negocio', icon: Building2 },
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

        {/* Ecosistema por Categoría */}
        <div className="space-y-8 mb-12">
          {ecosystem.map((category, i) => (
            <Card key={i} className="border-2 hover:shadow-2xl transition-all overflow-hidden">
              <div
                className={`bg-gradient-to-r ${category.color} p-6 text-white flex items-center justify-between`}
              >
                <div>
                  <h3 className="text-2xl font-black mb-1">{category.category}</h3>
                  <p className="text-sm opacity-90">Soluciones especializadas</p>
                </div>
                {category.badge && (
                  <Badge className="bg-white/20 text-white">{category.badge}</Badge>
                )}
              </div>

              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.verticales.map((vertical, j) => {
                    const Icon = vertical.icon;
                    return (
                      <div
                        key={j}
                        className={`p-4 rounded-xl border-2 ${vertical.highlight ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'} hover:shadow-lg transition-all group relative`}
                      >
                        {vertical.badge && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500 text-white text-xs">
                              {vertical.badge}
                            </Badge>
                          </div>
                        )}
                        <Icon
                          className={`h-8 w-8 mb-3 ${vertical.highlight ? 'text-orange-600' : 'text-gray-700'} group-hover:scale-110 transition-transform`}
                        />
                        <h4 className="font-bold text-gray-900 mb-1">{vertical.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{vertical.desc}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="h-3 w-3" />
                          <span>{vertical.users} usuarios</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
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
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Zap className="h-5 w-5 mr-2" />
                Empezar Gratis
              </Button>
            </Link>
            <Link href="#pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/20"
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
