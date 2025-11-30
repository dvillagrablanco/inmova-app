'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Users, TrendingUp, Zap, Shield, Bot, Leaf, Wallet, 
  CheckCircle, Star, ArrowRight, Play, Hotel, Hammer, Briefcase,
  Cloud, Calendar, MessageSquare, FileText, CreditCard, BarChart3,
  Lock, Globe, Smartphone, Award, Target, Rocket, ChevronDown,
  Link as LinkIcon, Recycle, Phone, Mail, MapPin, Sparkles, 
  TrendingDown, DollarSign, Home, X
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('todos');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Building2 className="h-8 w-8 text-indigo-600" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-pulse" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">INMOVA</span>
              <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                PropTech
              </Badge>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">Características</a>
              <a href="#vertical" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">Verticales</a>
              <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">Precios</a>
              <a href="#comparativa" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">Comparativa</a>
              <Link href="/login">
                <Button variant="ghost" className="hover:bg-indigo-50">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/50">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full text-white shadow-lg">
                <Zap className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-semibold">#1 PropTech Multi-Vertical en España</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                  Elimina la Fragmentación
                </span>{' '}
                <br />
                Una Plataforma, 7 Modelos de Negocio
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Las gestoras operan con <span className="font-semibold text-red-600">5-8 plataformas desconectadas</span>, gastando 2.000-5.000€/mes. INMOVA elimina la fragmentación: <span className="font-semibold text-indigo-600">88 módulos profesionales.</span> <span className="font-semibold text-violet-600">7 verticales de negocio.</span> Blockchain + IA GPT-4 + IoT + Room Rental con prorrateo automático. Gestiona alquileres, coliving, STR turístico con Channel Manager nativo, flipping, construcción y servicios profesionales. <span className="font-bold text-green-600">Ahorra 70%, aumenta ROI 25%.</span>
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-xl shadow-indigo-500/50 text-lg px-8 py-6">
                    <Rocket className="h-5 w-5" />
                    Prueba Gratis 30 Días
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="gap-2 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-lg px-8 py-6">
                    <Play className="h-5 w-5" />
                    Ver Demo en Vivo
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-gradient">
                <div className="text-center">
                  <div className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">88</div>
                  <div className="text-sm text-gray-600 font-medium mt-1">Módulos</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">7</div>
                  <div className="text-sm text-gray-600 font-medium mt-1">Verticales</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">99.9%</div>
                  <div className="text-sm text-gray-600 font-medium mt-1">Uptime</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="space-y-6">
                {/* Main Visual */}
                <div className="relative aspect-square bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 rounded-3xl p-1 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-3xl p-8 flex items-center justify-center">
                    <Building2 className="h-40 w-40 text-indigo-600" />
                  </div>
                </div>
                
                {/* Stats Cards Grid - Better positioned */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="shadow-xl border-2 border-green-200 bg-white">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="p-2 bg-green-100 rounded-lg inline-block mb-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-xs text-gray-600">ROI Promedio</div>
                        <div className="text-lg font-bold text-green-600">+45%</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-xl border-2 border-blue-200 bg-white">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="p-2 bg-blue-100 rounded-lg inline-block mb-2">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-xs text-gray-600">Propiedades</div>
                        <div className="text-lg font-bold text-blue-600">10,000+</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-xl border-2 border-violet-200 bg-white">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="p-2 bg-violet-100 rounded-lg inline-block mb-2">
                          <Star className="h-5 w-5 text-violet-600" />
                        </div>
                        <div className="text-xs text-gray-600">Valoración</div>
                        <div className="text-lg font-bold text-violet-600">4.9/5</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group hover:scale-105 transition-transform">
              <div className="flex items-center justify-center mb-3">
                <Building2 className="h-6 w-6 mr-2 group-hover:animate-bounce" />
              </div>
              <div className="text-5xl font-black mb-2 bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent">10,000+</div>
              <div className="text-white/90 font-medium">Propiedades Gestionadas</div>
            </div>
            <div className="group hover:scale-105 transition-transform">
              <div className="flex items-center justify-center mb-3">
                <Users className="h-6 w-6 mr-2 group-hover:animate-bounce" />
              </div>
              <div className="text-5xl font-black mb-2 bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">500+</div>
              <div className="text-white/90 font-medium">Gestoras Inmobiliarias</div>
            </div>
            <div className="group hover:scale-105 transition-transform">
              <div className="flex items-center justify-center mb-3">
                <TrendingDown className="h-6 w-6 mr-2 group-hover:animate-bounce" />
              </div>
              <div className="text-5xl font-black mb-2 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">-70%</div>
              <div className="text-white/90 font-medium">Reducción Costes Software</div>
            </div>
            <div className="group hover:scale-105 transition-transform">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 mr-2 group-hover:animate-bounce" />
              </div>
              <div className="text-5xl font-black mb-2 bg-gradient-to-r from-pink-300 to-rose-300 bg-clip-text text-transparent">+25%</div>
              <div className="text-white/90 font-medium">Aumento ROI Promedio</div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPETITIVE ADVANTAGE SECTION */}
      <section id="comparativa" className="py-24 px-4 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200 px-4 py-2">
              <Target className="h-4 w-4 mr-1 inline" />
              Ventaja Competitiva
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Por Qué Elegir INMOVA vs la Competencia
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              <strong className="text-indigo-600">Reduce tu software un 70%.</strong> Aumenta el ROI un 25%. €3.32/módulo vs €6.96 de Buildium.
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* INMOVA vs Homming */}
            <Card className="group hover:shadow-2xl transition-all border-2 hover:border-indigo-500">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl w-fit mb-3">
                  <X className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">vs Homming</CardTitle>
                <CardDescription className="text-sm font-semibold text-gray-500">Mono-Vertical Residencial</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>Multi-Vertical:</strong> 7 modelos vs 1</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>STR Nativo:</strong> Channel Manager integrado</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>White Label Total:</strong> Tu propia app</p>
                </div>
              </CardContent>
            </Card>

            {/* INMOVA vs Rentger */}
            <Card className="group hover:shadow-2xl transition-all border-2 hover:border-violet-500">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl w-fit mb-3">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">vs Rentger</CardTitle>
                <CardDescription className="text-sm font-semibold text-gray-500">Gestión Administrativa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>Fiscalidad + IA:</strong> AEAT + IoT + Blockchain</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>House Flipping:</strong> ROI automático en tiempo real</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>Innovación:</strong> Inversión optimizada, no solo gestión</p>
                </div>
              </CardContent>
            </Card>

            {/* INMOVA vs Nester */}
            <Card className="group hover:shadow-2xl transition-all border-2 hover:border-cyan-500">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl w-fit mb-3">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">vs Nester</CardTitle>
                <CardDescription className="text-sm font-semibold text-gray-500">Automatización Carteras</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>IoT Físico:</strong> Sensores + cerraduras + automatización real</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>Tokenización:</strong> Web3 + distribución renta automática</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>BI Predictivo:</strong> Roles CFO + Director Regional</p>
                </div>
              </CardContent>
            </Card>

            {/* INMOVA vs Buildium/AppFolio */}
            <Card className="group hover:shadow-2xl transition-all border-2 hover:border-amber-500">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl w-fit mb-3">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">vs Buildium/AppFolio</CardTitle>
                <CardDescription className="text-sm font-semibold text-gray-500">Gigantes USA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>Precio/Valor:</strong> €3.32/módulo vs €6.96/módulo</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>Fiscal España:</strong> Modelo 347, 100, LAU, RGPD nativo</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>Tecnología:</strong> IA GPT-4 + Blockchain vs código legacy</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="text-center bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <CardHeader>
                <div className="p-3 bg-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                  <TrendingDown className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-black text-green-600">-70%</CardTitle>
                <CardDescription className="text-gray-700 font-semibold">
                  Reducción de Costes de Software
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">De 2.000-5.000€/mes con 5-8 herramientas a una sola plataforma unificada</p>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <CardHeader>
                <div className="p-3 bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-black text-blue-600">+25%</CardTitle>
                <CardDescription className="text-gray-700 font-semibold">
                  Incremento de ROI Inmobiliario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Optimización automatizada + pricing dinámico + mantenimiento predictivo</p>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200">
              <CardHeader>
                <div className="p-3 bg-violet-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-black text-violet-600">€3.32</CardTitle>
                <CardDescription className="text-gray-700 font-semibold">
                  Coste por Módulo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">vs €6.96 de Buildium. 88 módulos incluidos en todos los planes</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-gray-500 italic mb-6">
              *Datos basados en análisis de mercado PropTech 2024-2025
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl">
                <Award className="h-5 w-5" />
                Prueba INMOVA Gratis 30 Días
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
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
            {[
              { icon: Building2, title: 'Gestión de Propiedades', desc: 'Edificios, unidades, contratos y pagos completos', gradient: 'from-blue-500 to-cyan-500' },
              { icon: Home, title: 'Alquiler por Habitaciones', desc: 'Coliving con prorrateo de suministros, normas de convivencia y calendario de limpieza', gradient: 'from-teal-500 to-green-600' },
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
            ].map((feature, i) => (
              <Card key={i} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-transparent relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
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
            <Link href="/login">
              <Button variant="outline" className="gap-2 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-6">
                Ver Todos los 88 Módulos
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* MULTI-VERTICAL SECTION */}
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
            {[
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
                icon: Users,
                title: 'Coliving/Media Estancia',
                desc: 'Alquileres flexibles',
                features: ['Comunidad', 'Espacios compartidos', 'Eventos']
              },
              {
                icon: Hotel,
                title: 'Hoteles/Apart-hotels',
                desc: 'Gestión hotelera',
                features: ['PMS', 'Housekeeping', 'Revenue']
              }
            ].map((vertical, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow border-2">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <vertical.icon className="h-10 w-10 text-primary" />
                    <Badge>Activo</Badge>
                  </div>
                  <CardTitle>{vertical.title}</CardTitle>
                  <CardDescription>{vertical.desc}</CardDescription>
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

      {/* COMPARATIVA SECTION */}
      <section id="comparativa" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">Comparativa</Badge>
            <h2 className="text-4xl font-bold mb-4">INMOVA vs Competencia</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Por qué somos la mejor opción del mercado
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Característica</th>
                  <th className="p-4">
                    <div className="font-bold text-primary">INMOVA</div>
                  </th>
                  <th className="p-4">
                    <div className="text-muted-foreground">Homming</div>
                  </th>
                  <th className="p-4">
                    <div className="text-muted-foreground">Otros</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Total Módulos', inmova: '88', homming: '10-15', otros: '10-20' },
                  { feature: 'Multi-Vertical', inmova: '7 modelos', homming: '1-2', otros: '1-2' },
                  { feature: 'Blockchain', inmova: '✓', homming: '✗', otros: '✗' },
                  { feature: 'IA GPT-4', inmova: '✓', homming: '✗', otros: '✗' },
                  { feature: 'STR + Residencial', inmova: '✓', homming: '✗', otros: '✗' },
                  { feature: 'House Flipping', inmova: '✓ ROI Auto', homming: '✗', otros: '✗' },
                  { feature: 'White Label', inmova: '✓ Completo', homming: '⚠️ Limitado', otros: '⚠️' },
                  { feature: 'ESG/Sostenibilidad', inmova: '✓', homming: '✗', otros: '✗' },
                ].map((row, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">
                      <Badge className="bg-green-500">{row.inmova}</Badge>
                    </td>
                    <td className="p-4 text-center text-muted-foreground">{row.homming}</td>
                    <td className="p-4 text-center text-muted-foreground">{row.otros}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">Testimonios</Badge>
            <h2 className="text-4xl font-bold mb-4">Lo Que Dicen Nuestros Clientes</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'María González',
                company: 'Inmobiliaria MGonzalez',
                text: 'INMOVA transformó nuestra gestión. El módulo de STR nos permitió expandir a Airbnb sin complicaciones.',
                rating: 5
              },
              {
                name: 'Carlos Ruiz',
                company: 'Flipping Pro',
                text: 'El cálculo automático de ROI en house flipping nos ahorra horas. La mejor inversión de 2024.',
                rating: 5
              },
              {
                name: 'Ana Martínez',
                company: 'Construcciones AM',
                text: 'Gestionar 12 obras simultáneas nunca fue tan fácil. El módulo de construcción es impresionante.',
                rating: 5
              }
            ].map((testimonial, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>{testimonial.company}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-white via-indigo-50 to-violet-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 px-4 py-2">
              <DollarSign className="h-4 w-4 mr-1 inline" />
              Mejor Precio/Valor del Mercado
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Planes para Cada Necesidad
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              <strong className="text-indigo-600">€3.32 por módulo</strong> vs €6.96 de Buildium. Ahorra hasta un 70% consolidando 5-8 herramientas en una sola.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '€89',
                period: '/mes',
                modules: '30 módulos',
                properties: 'Hasta 25 propiedades',
                costPerModule: '€2.97/módulo',
                features: [
                  '30 módulos básicos',
                  'Hasta 25 propiedades',
                  'Gestión residencial + coliving',
                  '5 usuarios',
                  'Soporte email 48h',
                  'Dashboard BI básico'
                ],
                cta: 'Ideal para emprendedores'
              },
              {
                name: 'Profesional',
                price: '€199',
                period: '/mes',
                modules: '60 módulos',
                properties: '26-200 propiedades',
                costPerModule: '€3.32/módulo',
                popular: true,
                features: [
                  '60 módulos profesionales',
                  '26-200 propiedades',
                  'Todos los verticales (STR, Flipping, etc.)',
                  'Stripe + CRM + Firma Digital',
                  'Mantenimiento Predictivo IA',
                  'Soporte chat 24h',
                  'White Label básico'
                ],
                cta: 'Gestoras en crecimiento'
              },
              {
                name: 'Empresarial',
                price: '€499',
                period: '/mes',
                modules: '88 módulos',
                properties: '201-1000 propiedades',
                costPerModule: '€5.67/módulo',
                features: [
                  'TODOS los 88 módulos',
                  '201-1000 propiedades',
                  '7 verticales completos',
                  'Blockchain + Tokenización Web3',
                  'IoT + Edificios Inteligentes',
                  'IA GPT-4 completa',
                  'White Label TOTAL (App propia)',
                  'Soporte teléfono + Account Manager'
                ],
                cta: 'Empresas consolidadas'
              },
              {
                name: 'Enterprise+',
                price: '€1,999+',
                period: '/mes',
                modules: '88+ módulos',
                properties: '+1000 propiedades',
                costPerModule: 'Personalizado',
                features: [
                  'Propiedades ilimitadas',
                  'Todos los módulos + Custom',
                  'Infraestructura dedicada',
                  'SLA 99.95%',
                  'Desarrollos a medida',
                  'Integraciones ERP (SAP, Sage)',
                  'Multi-región + Multi-moneda',
                  'Account Manager dedicado 24/7'
                ],
                cta: 'Grandes corporaciones'
              }
            ].map((plan, i) => (
              <Card key={i} className={`group hover:shadow-2xl transition-all ${plan.popular ? 'border-indigo-500 border-2 shadow-xl relative' : 'hover:border-indigo-300 border-2'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    ⭐ Más Popular
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    <div>
                      <span className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{plan.price}</span>
                      <span className="text-gray-500 text-sm">{plan.period}</span>
                    </div>
                    <div className="text-xs text-gray-500 font-semibold">{plan.costPerModule}</div>
                  </div>
                  <Badge variant="secondary" className="mt-3 w-fit text-xs">{plan.modules}</Badge>
                  <div className="text-sm text-indigo-600 font-semibold mt-2">{plan.properties}</div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                    <p className="text-xs text-gray-700 font-semibold text-center">{plan.cta}</p>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="w-full">
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.popular ? '🚀 Comenzar Ahora' : 'Comenzar Ahora'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12 space-y-4">
            <p className="text-sm text-gray-600">
              💳 <strong>30 días de prueba gratis.</strong> Sin tarjeta de crédito. Cancela cuando quieras.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">LAUNCH2025</Badge>
                <span>50% dto. 1er mes</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">ANNUAL30</Badge>
                <span>30% dto. pago anual</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">REFIERE100</Badge>
                <span>€100 para ti y tu referido</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-4 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">¿Listo para Revolucionar tu Negocio?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Únete a más de 500 empresas que ya confían en INMOVA
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                <Rocket className="h-5 w-5" />
                Comenzar Gratis 30 Días
              </Button>
            </Link>
            <a href="mailto:ventas@inmova.com?subject=Consulta%20sobre%20INMOVA">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent text-white border-white hover:bg-white/10">
                <Phone className="h-5 w-5" />
                Hablar con Ventas
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6" />
                <span className="text-xl font-bold">INMOVA</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                La plataforma PropTech multi-vertical más avanzada de España
              </p>
              <div className="flex gap-3">
                <a href="https://twitter.com/inmova" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost" className="text-white">Twitter</Button>
                </a>
                <a href="https://linkedin.com/company/inmova" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost" className="text-white">LinkedIn</Button>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features">Características</a></li>
                <li><a href="#pricing">Precios</a></li>
                <li><a href="#comparativa">Comparativa</a></li>
                <li><a>Integraciones</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a>Sobre Nosotros</a></li>
                <li><a>Blog</a></li>
                <li><a>Casos de Éxito</a></li>
                <li><a>Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a>Privacidad</a></li>
                <li><a>Términos</a></li>
                <li><a>GDPR</a></li>
                <li><a>Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2025 INMOVA. Todos los derechos reservados. Powered by Vidaro Inversiones.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}