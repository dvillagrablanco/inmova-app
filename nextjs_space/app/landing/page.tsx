'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LandingChatbot } from '@/components/LandingChatbot';
import { 
  Building2, Users, TrendingUp, Zap, Shield, Bot, Leaf, Wallet, 
  CheckCircle, Star, ArrowRight, Play, Hotel, Hammer, Briefcase,
  Cloud, Calendar, MessageSquare, FileText, CreditCard, BarChart3,
  Lock, Globe, Smartphone, Award, Target, Rocket, ChevronDown,
  Link as LinkIcon, Recycle, Phone, Mail, MapPin, Sparkles, 
  TrendingDown, DollarSign, Home, X, Menu
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('todos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* NAVIGATION - Menú superior siempre visible */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/50 z-[100] shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Building2 className="h-8 w-8 text-indigo-600" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-pulse" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">INMOVA</span>
              <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 hidden sm:inline-flex">
                <Sparkles className="h-3 w-3 mr-1" />
                PropTech
              </Badge>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">Características</a>
              <a href="#vertical" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">Verticales</a>
              <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">Precios</a>
              <a href="#integraciones" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">Integraciones</a>
              <Link href="/login">
                <Button variant="ghost" className="hover:bg-indigo-50">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/50">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Building2 className="h-6 w-6 text-indigo-600" />
                      <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        INMOVA
                      </span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-8">
                    <a 
                      href="#features" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-gray-700 hover:text-indigo-600 transition-colors py-2 px-4 hover:bg-indigo-50 rounded-lg"
                    >
                      Características
                    </a>
                    <a 
                      href="#vertical" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-gray-700 hover:text-indigo-600 transition-colors py-2 px-4 hover:bg-indigo-50 rounded-lg"
                    >
                      Verticales
                    </a>
                    <a 
                      href="#pricing" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-gray-700 hover:text-indigo-600 transition-colors py-2 px-4 hover:bg-indigo-50 rounded-lg"
                    >
                      Precios
                    </a>
                    <a 
                      href="#integraciones" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-gray-700 hover:text-indigo-600 transition-colors py-2 px-4 hover:bg-indigo-50 rounded-lg"
                    >
                      Integraciones
                    </a>
                    <div className="border-t border-gray-200 mt-4 pt-4 space-y-3">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button 
                          variant="outline" 
                          className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                        >
                          Iniciar Sesión
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        <Button 
                          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/50"
                        >
                          Comenzar Gratis
                        </Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
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
            
            {/* VIDEO DEMO HERO - Reemplaza el icono enorme */}
            <div className="relative">
              <div className="space-y-6">
                {/* Video Container Principal */}
                <div className="relative aspect-video bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 rounded-3xl p-1 shadow-2xl hover:shadow-3xl transition-shadow duration-300">
                  <div className="w-full h-full bg-black rounded-3xl overflow-hidden">
                    {process.env.NEXT_PUBLIC_VIDEO_URL ? (
                      // Si hay una URL externa configurada, usar iframe o video según el tipo
                      process.env.NEXT_PUBLIC_VIDEO_URL.includes('youtube.com') || 
                      process.env.NEXT_PUBLIC_VIDEO_URL.includes('youtu.be') ||
                      process.env.NEXT_PUBLIC_VIDEO_URL.includes('vimeo.com') ||
                      process.env.NEXT_PUBLIC_VIDEO_URL.includes('drive.google.com') ? (
                        <iframe
                          src={process.env.NEXT_PUBLIC_VIDEO_URL}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="INMOVA Demo Video - 90 segundos"
                        />
                      ) : (
                        <video 
                          controls 
                          className="w-full h-full object-contain"
                          poster="/inmova-logo-cover.jpg"
                        >
                          <source src={process.env.NEXT_PUBLIC_VIDEO_URL} type="video/mp4" />
                        </video>
                      )
                    ) : (
                      // Si no hay URL configurada, mostrar placeholder atractivo
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600">
                        <div className="text-center px-6">
                          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4 animate-pulse">
                            <Play className="h-10 w-10 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Demo Video 90s</h3>
                          <p className="text-white/90 text-sm">
                            Descubre INMOVA en acción
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Badge flotante sobre el video */}
                  <div className="absolute -top-3 -right-3 z-20">
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 shadow-lg px-3 py-1.5 text-xs font-bold">
                      <Play className="h-3 w-3 mr-1 inline animate-pulse" />
                      90 SEGUNDOS
                    </Badge>
                  </div>
                </div>
                
                {/* Stats Cards Grid - Debajo del video */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="shadow-xl border-2 border-green-200 bg-white hover:shadow-2xl transition-shadow">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="p-2 bg-green-100 rounded-lg inline-block mb-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-xs text-gray-600">Ahorro</div>
                        <div className="text-lg font-bold text-green-600">70%</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-xl border-2 border-blue-200 bg-white hover:shadow-2xl transition-shadow">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="p-2 bg-blue-100 rounded-lg inline-block mb-2">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-xs text-gray-600">Empresas</div>
                        <div className="text-lg font-bold text-blue-600">500+</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-xl border-2 border-violet-200 bg-white hover:shadow-2xl transition-shadow">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="p-2 bg-violet-100 rounded-lg inline-block mb-2">
                          <Star className="h-5 w-5 text-violet-600" />
                        </div>
                        <div className="text-xs text-gray-600">ROI</div>
                        <div className="text-lg font-bold text-violet-600">+45%</div>
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
              { icon: Home, title: 'Alquiler por Habitaciones', desc: 'Coliving completo: prorrateo automático de utilidades (luz, agua, gas), gestión de habitaciones individuales, calendario de limpieza rotativo', gradient: 'from-teal-500 to-green-600', featured: true },
              { icon: Wallet, title: 'Cupones de Descuento', desc: 'Sistema completo de cupones con validación, límites de uso, fechas de expiración, aplicación automática y estadísticas', gradient: 'from-fuchsia-500 to-pink-600', featured: true },
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
            ].map((feature: any, i: number) => (
              <Card key={i} className={`group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-transparent relative overflow-hidden ${feature.featured ? 'border-indigo-300 shadow-lg' : ''}`}>
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

      {/* ROOM RENTAL / COLIVING DESTACADO */}
      <section id="room-rental" className="py-24 px-4 bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-teal-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-teal-500 to-green-600 text-white border-0 px-4 py-2 text-base">
              <Home className="h-5 w-5 mr-2 inline" />
              Modelo Innovador de Negocio
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-green-700 bg-clip-text text-transparent">
              Alquiler por Habitaciones & Coliving
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              <strong className="text-teal-600">Revoluciona la gestión de coliving y alquiler de habitaciones</strong> con prorrateo automático de utilidades, gestión inteligente de espacios compartidos y calendario de limpieza rotativo. El modelo de negocio más rentable del sector inmobiliario, ahora completamente automatizado.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start mb-12">
            {/* Left Column - Key Features */}
            <div className="space-y-6">
              <Card className="border-2 border-teal-200 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-green-600 rounded-xl">
                      <DollarSign className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-teal-700">Prorrateo Automático de Utilidades</CardTitle>
                      <CardDescription className="text-base">Olvídate de cálculos manuales</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">División inteligente de costes</p>
                      <p className="text-sm text-gray-600">Luz, agua, gas, internet, limpieza - todo calculado automáticamente según ocupación y consumo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">Facturación por inquilino</p>
                      <p className="text-sm text-gray-600">Cada residente recibe su desglose personalizado con conceptos claros</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">Ajustes proporcionales</p>
                      <p className="text-sm text-gray-600">Entrada/salida mid-mes calculada automáticamente con precisión al día</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-200 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-emerald-700">Calendario de Limpieza Rotativo</CardTitle>
                      <CardDescription className="text-base">Espacios compartidos siempre impecables</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">Turnos automáticos equitativos</p>
                      <p className="text-sm text-gray-600">Sistema de rotación justo para cocina, baños y áreas comunes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">Notificaciones y recordatorios</p>
                      <p className="text-sm text-gray-600">Alertas push y email para cada inquilino en su turno asignado</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">Servicio de limpieza profesional opcional</p>
                      <p className="text-sm text-gray-600">Integra proveedores externos con facturación automática prorrateada</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-green-700">Gestión de Habitaciones Individuales</CardTitle>
                      <CardDescription className="text-base">Control total de cada espacio</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">Contratos independientes por habitación</p>
                      <p className="text-sm text-gray-600">Renovación flexible sin afectar a otros residentes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">Precios diferenciados</p>
                      <p className="text-sm text-gray-600">Cada habitación puede tener precio y condiciones únicas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">Portal del inquilino individualizado</p>
                      <p className="text-sm text-gray-600">Cada residente accede solo a su información y áreas comunes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Benefits & Use Cases */}
            <div className="space-y-6">
              <Card className="border-2 border-teal-300 shadow-2xl bg-gradient-to-br from-white to-teal-50">
                <CardHeader className="bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-t-lg">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    Rentabilidad Máxima
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="bg-white rounded-xl p-6 shadow-md border border-teal-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-semibold">ROI promedio coliving</span>
                      <span className="text-3xl font-black text-green-600">+35%</span>
                    </div>
                    <p className="text-sm text-gray-600">vs alquiler tradicional completo</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md border border-teal-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-semibold">Ocupación promedio</span>
                      <span className="text-3xl font-black text-teal-600">92%</span>
                    </div>
                    <p className="text-sm text-gray-600">Mayor demanda que alquiler completo</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md border border-teal-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-semibold">Reducción costes gestión</span>
                      <span className="text-3xl font-black text-emerald-600">-60%</span>
                    </div>
                    <p className="text-sm text-gray-600">Automatización total de procesos</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-300 shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="text-2xl text-emerald-700 flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Casos de Uso Ideales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
                    <h4 className="font-bold text-teal-700 mb-2 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Coliving Urbano
                    </h4>
                    <p className="text-sm text-gray-700">Jóvenes profesionales en ciudades grandes. 4-8 habitaciones por piso. Espacios compartidos premium.</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                    <h4 className="font-bold text-emerald-700 mb-2 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Residencias Estudiantes
                    </h4>
                    <p className="text-sm text-gray-700">Campus universitarios. Contratos anuales renovables. Gestión de depósitos individuales.</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
                    <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                      <Hotel className="h-5 w-5" />
                      Media Estancia
                    </h4>
                    <p className="text-sm text-gray-700">Nómadas digitales. Flexibilidad 1-6 meses. Servicios incluidos. All-inclusive con utilidades.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-300 shadow-xl bg-gradient-to-br from-green-500 to-teal-600 text-white">
                <CardContent className="pt-6 text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-2xl font-bold mb-3">¿Listo para Maximizar tu ROI?</h3>
                  <p className="mb-6 text-white/90">Comienza a gestionar coliving y room rental con INMOVA hoy mismo</p>
                  <Link href="/register">
                    <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 shadow-xl text-lg px-8 py-6">
                      <Rocket className="h-5 w-5 mr-2" />
                      Activa Room Rental Ahora
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-teal-200 p-8 max-w-5xl mx-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shrink-0">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Funcionalidades Adicionales Exclusivas</h3>
                <p className="text-gray-600">INMOVA es la única plataforma que integra todo lo que necesitas para coliving profesional</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-teal-600" />
                <h4 className="font-bold text-gray-800 mb-2">Chat Grupal Integrado</h4>
                <p className="text-sm text-gray-600">Comunicación entre residentes y gestor en tiempo real</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-emerald-600" />
                <h4 className="font-bold text-gray-800 mb-2">Reserva Espacios Comunes</h4>
                <p className="text-sm text-gray-600">Cocina, salón, terraza - sistema de turnos automático</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl">
                <Award className="h-10 w-10 mx-auto mb-3 text-green-600" />
                <h4 className="font-bold text-gray-800 mb-2">Sistema de Valoraciones</h4>
                <p className="text-sm text-gray-600">Reputación de inquilinos y gestor para transparencia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARATIVA SECTION */}
      <section id="comparativa" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200 px-4 py-2">
              <Target className="h-4 w-4 mr-1 inline" />
              Comparativa Completa
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              INMOVA vs Competencia Principal
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Análisis detallado frente a Homming, Rentger, Nester y Buildium/AppFolio
            </p>
          </div>

          <div className="overflow-x-auto shadow-2xl rounded-2xl border-2">
            <table className="w-full bg-white">
              <thead className="bg-gradient-to-r from-indigo-50 to-violet-50">
                <tr className="border-b-2">
                  <th className="text-left p-4 font-bold text-gray-700">Característica</th>
                  <th className="p-4">
                    <div className="font-bold text-indigo-600 text-lg">INMOVA</div>
                    <div className="text-xs text-gray-500">Multi-Vertical</div>
                  </th>
                  <th className="p-4">
                    <div className="text-gray-600">Homming</div>
                    <div className="text-xs text-gray-400">Mono-Vertical</div>
                  </th>
                  <th className="p-4">
                    <div className="text-gray-600">Rentger</div>
                    <div className="text-xs text-gray-400">Admin</div>
                  </th>
                  <th className="p-4">
                    <div className="text-gray-600">Nester</div>
                    <div className="text-xs text-gray-400">Automatización</div>
                  </th>
                  <th className="p-4">
                    <div className="text-gray-600">Buildium</div>
                    <div className="text-xs text-gray-400">USA</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Total Módulos', inmova: '88', homming: '10-15', rentger: '15-20', nester: '12-18', buildium: '20-25' },
                  { feature: 'Verticales de Negocio', inmova: '7', homming: '1', rentger: '1-2', nester: '1-2', buildium: '2-3' },
                  { feature: 'Blockchain & NFTs', inmova: '✓', homming: '✗', rentger: '✗', nester: '✗', buildium: '✗' },
                  { feature: 'IA GPT-4 Nativa', inmova: '✓', homming: '✗', rentger: '✗', nester: '✗', buildium: '✗' },
                  { feature: 'STR + Residencial', inmova: '✓', homming: '✗', rentger: '⚠️', nester: '⚠️', buildium: '✓' },
                  { feature: 'House Flipping', inmova: '✓ ROI Auto', homming: '✗', rentger: '✗', nester: '✗', buildium: '✗' },
                  { feature: 'Room Rental / Coliving', inmova: '✓', homming: '✗', rentger: '✗', nester: '✗', buildium: '⚠️' },
                  { feature: 'White Label Completo', inmova: '✓', homming: '⚠️', rentger: '✗', nester: '✗', buildium: '⚠️' },
                  { feature: 'IoT & Smart Buildings', inmova: '✓', homming: '✗', rentger: '✗', nester: '⚠️', buildium: '✗' },
                  { feature: 'ESG & Sostenibilidad', inmova: '✓', homming: '✗', rentger: '✗', nester: '✗', buildium: '✗' },
                  { feature: 'Precio/Módulo (€)', inmova: '€3.32', homming: '€5-7', rentger: '€6-8', nester: '€5-9', buildium: '€6.96' },
                  { feature: 'Fiscalidad España', inmova: '✓ AEAT', homming: '✓', rentger: '✓', nester: '✓', buildium: '✗' },
                ].map((row, i) => (
                  <tr key={i} className="border-b hover:bg-indigo-50/50 transition-colors">
                    <td className="p-4 font-semibold text-gray-700">{row.feature}</td>
                    <td className="p-4 text-center">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">{row.inmova}</Badge>
                    </td>
                    <td className="p-4 text-center text-gray-600 text-sm">{row.homming}</td>
                    <td className="p-4 text-center text-gray-600 text-sm">{row.rentger}</td>
                    <td className="p-4 text-center text-gray-600 text-sm">{row.nester}</td>
                    <td className="p-4 text-center text-gray-600 text-sm">{row.buildium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 italic mb-6">
              ✓ = Incluido | ⚠️ = Limitado | ✗ = No disponible. Datos actualizados a Enero 2026.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl">
                <CheckCircle className="h-5 w-5 mr-2" />
                Prueba INMOVA Gratis 30 Días
              </Button>
            </Link>
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
            <Link href="/landing/contacto">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent text-white border-white hover:bg-white/10">
                <Phone className="h-5 w-5" />
                Hablar con Ventas
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {/* INTEGRACIONES SECTION */}
      <section id="integraciones" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 px-4 py-2">
              <LinkIcon className="h-4 w-4 mr-1 inline" />
              Integraciones
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Conecta con tus Herramientas Favoritas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              INMOVA se integra perfectamente con las principales plataformas del sector inmobiliario y financiero
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Integraciones Financieras */}
            <Card className="group hover:shadow-2xl transition-all border-2">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl w-fit mb-3">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Pagos y Finanzas</CardTitle>
                <CardDescription>Procesa pagos de forma segura</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Stripe:</strong> Pagos recurrentes y one-time
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Open Banking:</strong> Verificación de ingresos
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Zucchetti:</strong> Integración ERP/contabilidad
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Integraciones Portales */}
            <Card className="group hover:shadow-2xl transition-all border-2">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl w-fit mb-3">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Portales Inmobiliarios</CardTitle>
                <CardDescription>Publicación automática</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Idealista:</strong> Sincronización automática
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Fotocasa:</strong> Anuncios optimizados
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Habitaclia:</strong> Multi-publicación
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Integraciones STR */}
            <Card className="group hover:shadow-2xl transition-all border-2">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl w-fit mb-3">
                  <Hotel className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Short-Term Rental</CardTitle>
                <CardDescription>Channel Manager nativo</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Airbnb:</strong> Sincronización calendario
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Booking.com:</strong> Gestión reservas
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>VRBO:</strong> Pricing dinámico
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Integraciones Comunicación */}
            <Card className="group hover:shadow-2xl transition-all border-2">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl w-fit mb-3">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Comunicación</CardTitle>
                <CardDescription>Centraliza conversaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>WhatsApp:</strong> Chat integrado
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Email:</strong> Notificaciones automáticas
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>SMS:</strong> Recordatorios y alertas
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Integraciones Documentación */}
            <Card className="group hover:shadow-2xl transition-all border-2">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl w-fit mb-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Firma y Documentos</CardTitle>
                <CardDescription>Digitaliza procesos</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>DocuSign:</strong> Firma electrónica
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Signaturit:</strong> Certificados legales
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>AWS S3:</strong> Almacenamiento cloud
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Integraciones IoT */}
            <Card className="group hover:shadow-2xl transition-all border-2">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl w-fit mb-3">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">IoT y Smart Home</CardTitle>
                <CardDescription>Edificios inteligentes</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Cerraduras:</strong> Nuki, Tedee, Salto
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Sensores:</strong> Temperatura, humedad
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong>Domótica:</strong> Control remoto
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">
              ¿Necesitas una integración específica? Nuestro equipo puede desarrollar integraciones personalizadas
            </p>
            <Link href="/landing/contacto">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600">
                Solicitar Integración
              </Button>
            </Link>
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
                  <Button size="sm" variant="ghost" className="text-white hover:text-indigo-400">Twitter</Button>
                </a>
                <a href="https://linkedin.com/company/inmova" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost" className="text-white hover:text-indigo-400">LinkedIn</Button>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
                <li><Link href="/landing/demo" className="hover:text-white transition-colors">Ver Demo</Link></li>
                <li><a href="#integraciones" className="hover:text-white transition-colors">Integraciones</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/landing/sobre-nosotros" className="hover:text-white transition-colors">Sobre Nosotros</Link></li>
                <li><Link href="/landing/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/landing/casos-exito" className="hover:text-white transition-colors">Casos de Éxito</Link></li>
                <li><Link href="/landing/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/landing/legal/privacidad" className="hover:text-white transition-colors">Privacidad</Link></li>
                <li><Link href="/landing/legal/terminos" className="hover:text-white transition-colors">Términos</Link></li>
                <li><Link href="/landing/legal/gdpr" className="hover:text-white transition-colors">GDPR</Link></li>
                <li><Link href="/landing/legal/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 INMOVA. Todos los derechos reservados.</p>
            <p className="mt-2">Powered by <span className="text-indigo-400 font-semibold">Enxames Investments SL</span></p>
          </div>
        </div>
      </footer>

      {/* Chatbot y WhatsApp flotantes */}
      <LandingChatbot />
    </div>
  );
}