'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Users, TrendingUp, Zap, Shield, Bot, Leaf, 
  CheckCircle, Star, ArrowRight, Play, Hotel, Hammer, Briefcase,
  Cloud, Calendar, MessageSquare, FileText, CreditCard, BarChart3,
  Home, Sparkles, Recycle, LinkIcon
} from 'lucide-react';

const features = [
  { icon: Building2, title: 'Gestión de Propiedades', desc: 'Edificios, unidades, contratos y pagos completos', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Home, title: 'Alquiler por Habitaciones', desc: 'Coliving completo con prorrateo automático de servicios y gestión individual', gradient: 'from-teal-500 to-green-600', featured: true },
  { icon: Users, title: 'Portal Inquilinos/Propietarios', desc: 'App móvil PWA + chat integrado + firma digital', gradient: 'from-purple-500 to-pink-500' },
  { icon: CreditCard, title: 'Pagos Stripe', desc: 'Cobros automáticos + suscripciones + portal de pago', gradient: 'from-green-500 to-emerald-500' },
  { icon: Hammer, title: 'Mantenimiento Pro', desc: 'IA predictiva + calendario + gestión proveedores', gradient: 'from-orange-500 to-red-500' },
  { icon: Bot, title: 'Asistente IA GPT-4', desc: 'Chat conversacional + comandos de voz + análisis sentiment', gradient: 'from-violet-500 to-indigo-500' },
  { icon: LinkIcon, title: 'Blockchain & NFTs', desc: 'Tokenización ERC-20 + certificados NFT + distribución renta', gradient: 'from-cyan-500 to-blue-500' },
  { icon: BarChart3, title: 'Business Intelligence', desc: 'Dashboards avanzados + forecasting + exportación', gradient: 'from-pink-500 to-rose-500' },
  { icon: Shield, title: 'Seguridad & Compliance', desc: 'Biometría + GDPR + detección fraude ML + auditorías', gradient: 'from-red-500 to-orange-500' },
  { icon: Calendar, title: 'Calendario Unificado', desc: 'Todos los eventos: pagos, mantenimientos, visitas', gradient: 'from-teal-500 to-green-500' },
  { icon: FileText, title: 'Firma Digital', desc: 'Signaturit/DocuSign integrado + múltiples firmantes', gradient: 'from-amber-500 to-yellow-500' },
  { icon: Cloud, title: 'Open Banking', desc: 'Verificación ingresos + conciliación bancaria automática', gradient: 'from-sky-500 to-blue-500' },
  { icon: Leaf, title: 'ESG Sostenibilidad', desc: 'Huella carbono + certificaciones LEED/BREEAM + economía circular', gradient: 'from-lime-500 to-green-500' },
  { icon: Hotel, title: 'STR Channel Manager', desc: 'Sincronización Airbnb, Booking + pricing dinámico', gradient: 'from-orange-500 to-amber-500' },
  { icon: TrendingUp, title: 'House Flipping', desc: 'ROI automático + timeline + gestión renovaciones', gradient: 'from-green-500 to-teal-500' },
  { icon: Recycle, title: 'Economía Circular', desc: 'Marketplace intercambio + huertos urbanos + reciclaje', gradient: 'from-emerald-500 to-green-500' },
];

const verticals = [
  {
    icon: Building2,
    title: 'Alquiler Residencial',
    desc: 'Gestión tradicional de largo plazo',
    features: ['Contratos', 'Pagos', 'Mantenimiento']
  },
  {
    icon: Hotel,
    title: 'STR Turístico',
    desc: 'Airbnb, Booking, VRBO',
    features: ['Channel Manager', 'Pricing dinámico', 'Reservas']
  },
  {
    icon: Hammer,
    title: 'House Flipping',
    desc: 'Inversión y renovación',
    features: ['ROI automático', 'Timeline', 'Presupuestos']
  },
  {
    icon: Building2,
    title: 'Construcción',
    desc: 'Obra nueva y promoción',
    features: ['Subcontratistas', 'Certificaciones', '9 fases']
  },
  {
    icon: Briefcase,
    title: 'Servicios Profesionales',
    desc: 'Arquitectos, aparejadores',
    features: ['Portfolio', 'Entregables', 'CRM']
  },
  {
    icon: Home,
    title: 'Alquiler por Habitaciones',
    desc: 'Coliving y gestión de habitaciones individuales',
    features: ['Prorrateo automático', 'Calendario limpieza', 'Gestión individual']
  },
  {
    icon: Hotel,
    title: 'Hoteles/Apart-hotels',
    desc: 'Gestión hotelera',
    features: ['PMS', 'Housekeeping', 'Revenue']
  }
];

export function FeaturesSection() {
  return (
    <>
      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 border-indigo-200 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-1 inline" />
              88 Módulos Profesionales
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Características que Revolucionan el PropTech
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Todo lo que necesitas para gestionar tu negocio inmobiliario en una sola plataforma potente e intuitiva
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className={`group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-transparent relative overflow-hidden ${
                  feature.featured ? 'border-indigo-300 shadow-lg' : ''
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                {feature.featured && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Nuevo
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className={`p-3 bg-gradient-to-br ${feature.gradient} rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/landing/demo">
              <Button variant="outline" className="gap-2 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-6">
                Ver Todos los 88 Módulos
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Multi-Vertical Section */}
      <section id="vertical" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">Multi-Vertical</Badge>
            <h2 className="text-4xl font-bold mb-4">7 Modelos de Negocio en Una Plataforma</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              La única solución del mercado que soporta todos los verticales inmobiliarios
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {verticals.map((vertical, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow border-2">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <vertical.icon className="h-10 w-10 text-primary" />
                    <Badge>Activo</Badge>
                  </div>
                  <CardTitle>{vertical.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{vertical.desc}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {vertical.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
