'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Star, 
  ArrowRight, 
  Play, 
  Rocket,
  Home,
  Briefcase,
  BarChart3,
  Shield,
  Zap,
  Target,
  Clock,
  DollarSign,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

interface PersonaContent {
  title: string;
  subtitle: string;
  painPoints: string[];
  benefits: string[];
  cta: {
    primary: { text: string; href: string };
    secondary: { text: string; href: string };
  };
  stats: Array<{ icon: any; value: string; label: string }>;
  image: string;
}

const personasContent: Record<string, PersonaContent> = {
  propietarios: {
    title: 'Simplifica tu gestión inmobiliaria',
    subtitle: 'Automatiza todo el proceso de alquiler y recupera tu tiempo. Sin complicaciones, sin morosidad, sin estrés.',
    painPoints: [
      'Gestión manual caótica con Excel y WhatsApp',
      'Morosidad de inquilinos (15% promedio)',
      '10 horas semanales perdidas en tareas administrativas',
      'Desconocimiento legal y fiscal'
    ],
    benefits: [
      'Screening automático de inquilinos con IA',
      'Alertas de pagos y recordatorios automáticos',
      'Contratos legales pre-aprobados',
      'Panel de control simple e intuitivo'
    ],
    cta: {
      primary: { text: 'Empezar Gratis', href: '/register' },
      secondary: { text: 'Ver Demo', href: '/landing/demo' }
    },
    stats: [
      { icon: Clock, value: '10h', label: 'Ahorro semanal' },
      { icon: Shield, value: '95%', label: 'Reducción morosidad' },
      { icon: Zap, value: '3min', label: 'Onboarding' }
    ],
    image: '/images/hero-propietarios.jpg'
  },
  gestores: {
    title: 'Escala tu negocio inmobiliario',
    subtitle: 'Todo-en-uno que elimina 5-7 herramientas. Ahorra €300-€1,000/mes y automatiza el 60% de tus tareas repetitivas.',
    painPoints: [
      'Software fragmentado (6-8 herramientas diferentes)',
      'Costos elevados (€500-€1,500/mes en software)',
      'Falta de automatización y reportes manuales',
      'Escalabilidad limitada'
    ],
    benefits: [
      'Todo-en-uno que elimina múltiples herramientas',
      'Ahorro de €300-€1,000/mes en software',
      'Automatización del 60% de tareas repetitivas',
      'Escalable a 1,000+ propiedades'
    ],
    cta: {
      primary: { text: 'Prueba 30 Días', href: '/register' },
      secondary: { text: 'Agendar Demo', href: '/contact?type=gestor' }
    },
    stats: [
      { icon: DollarSign, value: '€1K', label: 'Ahorro mensual' },
      { icon: TrendingUp, value: '60%', label: 'Automatización' },
      { icon: Target, value: '1-3meses', label: 'ROI garantizado' }
    ],
    image: '/images/hero-gestores.jpg'
  },
  inversores: {
    title: 'Maximiza tu rentabilidad patrimonial',
    subtitle: 'Dashboard ejecutivo en tiempo real con BI avanzado. Ahorra €30K-€150K/año en costos operativos.',
    painPoints: [
      'Sistemas legacy costosos (€50K-€200K/año)',
      'Falta de dashboard ejecutivo en tiempo real',
      'Analytics limitados y reportes manuales',
      'Integración contable compleja'
    ],
    benefits: [
      'Dashboard ejecutivo en tiempo real',
      'BI avanzado con predictive analytics',
      'Integración contable automática',
      'Blockchain para tokenización de activos'
    ],
    cta: {
      primary: { text: 'Agendar Demo Privada', href: '/contact?type=inversor' },
      secondary: { text: 'Descargar Brochure', href: '/downloads/inversores-brochure.pdf' }
    },
    stats: [
      { icon: BarChart3, value: '€150K', label: 'Ahorro anual' },
      { icon: Sparkles, value: 'Real-time', label: 'Analytics' },
      { icon: Building2, value: '10K+', label: 'Propiedades' }
    ],
    image: '/images/hero-inversores.jpg'
  }
};

export function HeroSectionSegmentado() {
  const [activeTab, setActiveTab] = useState('propietarios');

  const currentContent = personasContent[activeTab];

  return (
    <section className="relative pt-24 pb-20 px-4 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 opacity-70" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="container mx-auto relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Badge Superior */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 backdrop-blur-sm border border-indigo-200 rounded-full">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                #1 PropTech Multi-Vertical en España
              </span>
              <Rocket className="h-4 w-4 text-indigo-600" />
            </div>
          </div>

          {/* Hero Title Paragua */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4">
              <span className="block text-gray-900 mb-2">La plataforma PropTech</span>
              <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                que se adapta a ti
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              6 verticales de negocio + 6 módulos transversales de IA, IoT y Blockchain.
              <span className="font-semibold text-indigo-600"> Todo en un solo lugar.</span>
            </p>
          </div>

          {/* Tabs de Segmentación */}
          <div className="max-w-5xl mx-auto mb-12">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl p-1.5 h-auto">
                <TabsTrigger 
                  value="propietarios" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white rounded-lg py-3 px-6 text-base font-semibold transition-all"
                >
                  <Home className="h-5 w-5 mr-2 inline" />
                  Propietarios
                </TabsTrigger>
                <TabsTrigger 
                  value="gestores"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white rounded-lg py-3 px-6 text-base font-semibold transition-all"
                >
                  <Briefcase className="h-5 w-5 mr-2 inline" />
                  Gestores
                </TabsTrigger>
                <TabsTrigger 
                  value="inversores"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white rounded-lg py-3 px-6 text-base font-semibold transition-all"
                >
                  <BarChart3 className="h-5 w-5 mr-2 inline" />
                  Inversores
                </TabsTrigger>
              </TabsList>

              {/* Contenido Dinámico por Tab */}
              <TabsContent value={activeTab} className="mt-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Columna Izquierda: Contenido */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        {currentContent.title}
                      </h2>
                      <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                        {currentContent.subtitle}
                      </p>
                    </div>

                    {/* Pain Points */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Problemas que resolvemos
                      </h3>
                      <div className="space-y-2">
                        {currentContent.painPoints.map((point, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                              <span className="text-red-600 text-xs">✕</span>
                            </div>
                            <span className="text-gray-700 text-sm">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Beneficios que obtienes
                      </h3>
                      <div className="space-y-2">
                        {currentContent.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 text-sm font-medium">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      {currentContent.stats.map((stat, idx) => (
                        <div key={idx} className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200">
                          <stat.icon className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Link href={currentContent.cta.primary.href}>
                        <Button
                          size="lg"
                          className="w-full sm:w-auto gradient-primary text-white px-8 py-6 text-lg font-semibold hover:opacity-90 transition-all shadow-primary group"
                        >
                          {currentContent.cta.primary.text}
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      <Link href={currentContent.cta.secondary.href}>
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full sm:w-auto px-8 py-6 text-lg font-semibold border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 group"
                        >
                          <Play className="mr-2 h-5 w-5" />
                          {currentContent.cta.secondary.text}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Columna Derecha: Imagen/Visual */}
                  <div className="relative">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                      {/* Placeholder para imagen - en producción usar Image de Next.js */}
                      <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 via-violet-100 to-pink-100 flex items-center justify-center">
                        <div className="text-center p-8">
                          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 mb-6">
                            {activeTab === 'propietarios' && <Home className="h-12 w-12 text-white" />}
                            {activeTab === 'gestores' && <Briefcase className="h-12 w-12 text-white" />}
                            {activeTab === 'inversores' && <BarChart3 className="h-12 w-12 text-white" />}
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {activeTab === 'propietarios' && 'Gestión Simplificada'}
                            {activeTab === 'gestores' && 'Escalabilidad Total'}
                            {activeTab === 'inversores' && 'Analytics Avanzado'}
                          </h3>
                          <p className="text-gray-600">
                            {activeTab === 'propietarios' && 'Todo lo que necesitas en un solo lugar'}
                            {activeTab === 'gestores' && 'Gestiona miles de propiedades sin límites'}
                            {activeTab === 'inversores' && 'Toma decisiones basadas en datos en tiempo real'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Badge flotante */}
                    <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl p-4 border-2 border-indigo-200">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500 text-white">ROI en 1-3 meses</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-gray-600 border-t border-gray-200 mt-12">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <span className="font-medium">€850M Mercado España</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              <span className="font-medium">34 Tipos de Partners</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-pink-600" />
              <span className="font-medium">€150M Potencial 5 Años</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
