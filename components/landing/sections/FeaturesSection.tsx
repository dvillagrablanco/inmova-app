'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Home, Hotel, Hammer, Briefcase, TrendingUp,
  Leaf, ShoppingCart, DollarSign, Camera, Wifi, Link2,
  Sparkles, ArrowRight, Zap, CheckCircle
} from 'lucide-react';

const verticales = [
  {
    icon: Building2,
    title: 'Alquiler Tradicional',
    desc: 'Gestión completa de alquileres residenciales de largo plazo',
    features: ['Contratos', 'Pagos recurrentes', 'Garantías', 'Portal inquilino'],
    gradient: 'from-blue-500 to-cyan-500',
    color: 'blue'
  },
  {
    icon: Hotel,
    title: 'STR (Vacacional)',
    desc: 'Gestión profesional de alquileres vacacionales y corta estancia',
    features: ['Multi-canal (Airbnb, Booking)', 'Reviews centralizadas', 'Auto check-in', 'Limpieza'],
    gradient: 'from-orange-500 to-amber-500',
    color: 'orange'
  },
  {
    icon: Home,
    title: 'Coliving / Habitaciones',
    desc: 'Gestión individual de habitaciones con espacios compartidos',
    features: ['Por habitación', 'Espacios comunes', 'Prorrateo suministros', 'Normas convivencia'],
    gradient: 'from-purple-500 to-pink-500',
    color: 'purple'
  },
  {
    icon: TrendingUp,
    title: 'House Flipping',
    desc: 'Compra-reforma-venta con control total de ROI',
    features: ['Calculadora ROI/TIR', 'Timeline Gantt', 'Comparador propiedades', 'Presupuestos'],
    gradient: 'from-green-500 to-emerald-500',
    color: 'green'
  },
  {
    icon: Hammer,
    title: 'Construcción',
    desc: 'Gestión completa de obra nueva y promoción inmobiliaria',
    features: ['Permisos y licencias', 'Fases de obra', 'Control de calidad', 'Subcontratistas'],
    gradient: 'from-yellow-500 to-orange-500',
    color: 'yellow'
  },
  {
    icon: Briefcase,
    title: 'Servicios Profesionales',
    desc: 'Property management B2B para gestoras y agencias',
    features: ['CRM clientes', 'Facturación automática', 'Multi-cartera', 'Reporting'],
    gradient: 'from-indigo-500 to-violet-500',
    color: 'indigo'
  },
];

const modulosTransversales = [
  {
    icon: Leaf,
    title: 'ESG & Sostenibilidad',
    desc: 'Compliance europeo y reporting sostenible',
    benefits: ['Huella de carbono', 'Reportes CSRD', 'Certificaciones'],
    price: '+€50/mes',
    gradient: 'from-green-500 to-teal-500',
    usedBy: 'Todos los verticales'
  },
  {
    icon: ShoppingCart,
    title: 'Marketplace B2C',
    desc: 'Monetiza con servicios para inquilinos',
    benefits: ['Comisión 12%', 'Proveedores verificados', 'Nuevo canal ingresos'],
    price: 'Comisión',
    gradient: 'from-blue-500 to-indigo-500',
    usedBy: 'Alquiler, STR, Coliving'
  },
  {
    icon: DollarSign,
    title: 'Pricing Dinámico IA',
    desc: 'Optimiza tarifas con machine learning',
    benefits: ['+15-30% ingresos', 'Análisis competencia', 'Auto-ajuste'],
    price: '+€30/mes',
    gradient: 'from-purple-500 to-pink-500',
    usedBy: 'STR, Coliving'
  },
  {
    icon: Camera,
    title: 'Tours Virtuales AR/VR',
    desc: 'Tours 360° y realidad virtual/aumentada',
    benefits: ['+40% conversión', 'Home staging virtual', 'Multi-plataforma'],
    price: '+€30/mes',
    gradient: 'from-pink-500 to-rose-500',
    usedBy: 'Todos los verticales'
  },
  {
    icon: Wifi,
    title: 'IoT & Smart Buildings',
    desc: 'Automatización con dispositivos inteligentes',
    benefits: ['Termostatos', 'Cerraduras', 'Sensores', '-25% costes'],
    price: '+€100/mes',
    gradient: 'from-cyan-500 to-blue-500',
    usedBy: 'Alquiler, STR, Coliving'
  },
  {
    icon: Link2,
    title: 'Blockchain & Tokenización',
    desc: 'Inversión fraccionada y smart contracts',
    benefits: ['Tokeniza propiedades', 'Smart contracts', 'Nuevos inversores'],
    price: 'Comisión',
    gradient: 'from-violet-500 to-purple-500',
    usedBy: 'Inversión multi-vertical'
  },
];

export function FeaturesSection() {
  return (
    <>
      {/* Verticales Section */}
      <section id="verticales" className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700 border-indigo-200 px-4 py-2">
              <Building2 className="h-4 w-4 mr-1 inline" />
              Modelos de Negocio
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              6 Verticales de Negocio Inmobiliario
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Elige tu vertical y gestiona todo desde una sola plataforma. Puedes activar múltiples verticales según tu plan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {verticales.map((vertical, i) => (
              <Card 
                key={i} 
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-indigo-400 relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${vertical.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <CardHeader>
                  <div className={`p-3 bg-gradient-to-br ${vertical.gradient} rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform`}>
                    <vertical.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                    {vertical.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{vertical.desc}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {vertical.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className={`h-4 w-4 text-${vertical.color}-600 flex-shrink-0`} />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-indigo-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Arquitectura Modular</h3>
                  <p className="text-gray-600">Activa solo los verticales que necesites. Añade más cuando crezcas.</p>
                </div>
              </div>
              <Link href="/register">
                <Button size="lg" className="gradient-primary">
                  Empezar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Módulos Transversales Section */}
      <section id="modulos" className="py-24 px-4 bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-violet-100 to-pink-100 text-violet-700 border-violet-200 px-4 py-2">
              <Zap className="h-4 w-4 mr-1 inline" />
              Multiplicadores de Valor
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              6 Módulos Transversales de Última Generación
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Add-ons opcionales que amplifican el valor de tus verticales. Añade IA, IoT, Blockchain y más.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modulosTransversales.map((modulo, i) => (
              <Card 
                key={i} 
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-violet-400 relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${modulo.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-violet-500 to-pink-500 text-white border-0 text-xs">
                    {modulo.price}
                  </Badge>
                </div>
                <CardHeader>
                  <div className={`p-3 bg-gradient-to-br ${modulo.gradient} rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform`}>
                    <modulo.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-violet-600 transition-colors">
                    {modulo.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{modulo.desc}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {modulo.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-violet-600 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold">Usado por:</span> {modulo.usedBy}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-violet-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-violet-600 mb-2">Ninguno</div>
                <p className="text-sm text-gray-600">Competidor tiene estos 6 módulos</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-indigo-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">100%</div>
                <p className="text-sm text-gray-600">Compatible con todos los verticales</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-pink-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-pink-600 mb-2">+40%</div>
                <p className="text-sm text-gray-600">Aumento promedio de valor</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="container mx-auto text-center text-white">
          <h3 className="text-3xl font-bold mb-4">La Arquitectura que Ningún Competidor Tiene</h3>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            6 verticales completos + 6 módulos transversales únicos = La plataforma PropTech más completa de España
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="px-8 py-6">
                Prueba Gratis 30 Días
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline" className="px-8 py-6 border-white text-white hover:bg-white/10">
                Ver Planes y Precios
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
