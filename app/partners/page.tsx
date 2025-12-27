'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Users, DollarSign, Award, CheckCircle, ArrowRight,
  Building2, GraduationCap, Globe, Briefcase, FileText, BarChart3,
  Zap, Star, Target, Rocket, Trophy, Shield, Landmark, Construction,
  Ruler, Wrench, ScrollText, Scale, Building, Coins, Home, TrendingDown,
  Bitcoin, Lightbulb, Package, Smartphone, Plug, Newspaper, Video,
  Palette, Leaf, LineChart, Laptop, Calculator, PaintBucket, Coffee, BriefcaseBusiness
} from 'lucide-react';

const partnerTypes = [
  // PREMIUM PARTNERS (Top 3)
  {
    icon: Landmark,
    title: 'Bancos',
    description: 'Entidades bancarias, banca privada, hipotecas',
    benefits: ['Acuerdo marco €50-200K/año', '10% revenue share', 'White-label + API'],
    highlight: 'Premium',
    color: 'emerald',
    arr: '€8.9M'
  },
  {
    icon: Shield,
    title: 'Aseguradoras',
    description: 'Seguros de hogar, alquiler, impagos',
    benefits: ['Acuerdo €30-100K/año', '12% revenue', 'Reduce siniestralidad 25%'],
    highlight: 'Premium',
    color: 'rose',
    arr: '€17.9M'
  },
  {
    icon: Trophy,
    title: 'Multifamily Offices',
    description: 'Family offices, gestoras patrimoniales UHNW',
    benefits: ['€2,000 por familia', '25% recurrente', 'Clientes premium'],
    highlight: 'Premium',
    color: 'amber',
    arr: '€2.4M'
  },
  
  // CADENA DE VALOR CONSTRUCCIÓN
  {
    icon: Construction,
    title: 'Promotoras y Constructoras',
    description: 'Developers, promotoras, constructoras',
    benefits: ['€100 por vivienda vendida', 'Post-venta diferenciador', '10% revenue share'],
    highlight: 'Top 5',
    color: 'orange',
    arr: '€1M'
  },
  {
    icon: Ruler,
    title: 'Arquitectos',
    description: 'Estudios de arquitectura, diseñadores',
    benefits: ['€200 captación', '15% recurrente', 'Bonus reformas'],
    color: 'purple',
    arr: '€389K'
  },
  {
    icon: Wrench,
    title: 'Empresas de Reformas',
    description: 'Reformas, mantenimiento, facility management',
    benefits: ['€150 captación', '12% recurrente', 'Aparecen en marketplace'],
    color: 'gray',
    arr: '€247K'
  },
  
  // SERVICIOS LEGALES Y NOTARIALES
  {
    icon: ScrollText,
    title: 'Notarías',
    description: 'Notarías, compraventas inmobiliarias',
    benefits: ['€300 por captación', 'Momento crítico', '10% recurrente'],
    highlight: 'Top 5',
    color: 'indigo',
    arr: '€960K'
  },
  {
    icon: Scale,
    title: 'Abogados Inmobiliarios',
    description: 'Despachos especializados, contencioso arrendaticio',
    benefits: ['€200 captación', '15% recurrente', 'Prevención litigios'],
    color: 'slate',
    arr: '€389K'
  },
  {
    icon: Building,
    title: 'Registradores de la Propiedad',
    description: 'Registros, Colegio de Registradores',
    benefits: ['Acuerdo institucional', '5% revenue share', 'Volumen alto'],
    color: 'zinc',
    arr: '€500K'
  },
  
  // PLATAFORMAS Y MARKETPLACES
  {
    icon: Coins,
    title: 'Crowdfunding Inmobiliario',
    description: 'Housers, Urbanitae, Civislend, Casacrowd',
    benefits: ['20% revenue share', 'Integración API', 'Target perfecto'],
    highlight: 'Top 5',
    color: 'yellow',
    arr: '€891K'
  },
  {
    icon: Home,
    title: 'Idealista y Fotocasa',
    description: 'Portales inmobiliarios líderes',
    benefits: ['Acuerdo €200K/año', '15% revenue share', '5M+ usuarios pro'],
    highlight: 'Strategic',
    color: 'blue',
    arr: '€2.7M'
  },
  {
    icon: TrendingDown,
    title: 'Franquicias Inmobiliarias',
    description: 'RE/MAX, Century 21, Engel & Völkers',
    benefits: ['Acuerdo central', 'Roll-out automático', '20% revenue share'],
    highlight: 'Strategic',
    color: 'red',
    arr: '€5.4M'
  },
  
  // INVERSORES Y FONDOS
  {
    icon: Building2,
    title: 'SOCIMIs y Fondos',
    description: 'Merlin, Colonial, fondos inmobiliarios',
    benefits: ['Plan Enterprise custom', '€50-200K/año', 'Cientos de propiedades'],
    color: 'emerald',
    arr: '€1M'
  },
  {
    icon: Zap,
    title: 'Business Angels',
    description: 'Redes de inversores, AEBAN',
    benefits: ['Acuerdo €10K/año', '€200 + 15% recurrente', 'Networking'],
    color: 'violet',
    arr: '€389K'
  },
  
  // SERVICIOS AL HOGAR
  {
    icon: Lightbulb,
    title: 'Empresas de Limpieza',
    description: 'Helpling, empresas profesionales',
    benefits: ['€100 captación', '10% recurrente', 'Marketplace'],
    color: 'cyan',
    arr: '€279K'
  },
  {
    icon: Package,
    title: 'Empresas de Mudanzas',
    description: 'Mudanzas profesionales',
    benefits: ['€100 captación', '10% recurrente', 'Momento clave'],
    color: 'lime',
    arr: '€279K'
  },
  {
    icon: Smartphone,
    title: 'Domótica y Smart Home',
    description: 'Somfy, Simon, instaladores',
    benefits: ['€200 captación', '15% recurrente', 'Integración IoT'],
    color: 'fuchsia',
    arr: '€233K'
  },
  {
    icon: Plug,
    title: 'Utilities (Luz, Gas, Internet)',
    description: 'Endesa, Iberdrola, Movistar, Vodafone',
    benefits: ['Acuerdo €150K/año', '8% revenue share', 'Base masiva'],
    highlight: 'Strategic',
    color: 'orange',
    arr: '€4.3M'
  },
  
  // MARKETING Y MEDIOS
  {
    icon: Newspaper,
    title: 'Medios del Sector',
    description: 'El Economista, Cinco Días, Expansión',
    benefits: ['€50K/año contenido', '€100 por lead', 'Publicidad nativa'],
    color: 'gray',
    arr: '€587K'
  },
  {
    icon: Video,
    title: 'Influencers Inmobiliarios',
    description: 'YouTubers, TikTokers, Instagramers',
    benefits: ['€150 captación', '20% recurrente', 'Código descuento'],
    highlight: 'Top 5',
    color: 'pink',
    arr: '€507K'
  },
  {
    icon: Palette,
    title: 'Agencias de Marketing',
    description: 'Agencias especializadas inmobiliario',
    benefits: ['€200 captación', '20% recurrente', 'White-label'],
    color: 'rose',
    arr: '€150K'
  },
  
  // CERTIFICACIONES Y TASACIONES
  {
    icon: Leaf,
    title: 'Certificadores Energéticos',
    description: 'Certificación energética obligatoria',
    benefits: ['€100 captación', 'Bonus ESG €50', 'Contacto natural'],
    highlight: 'Top 5',
    color: 'green',
    arr: '€558K'
  },
  {
    icon: LineChart,
    title: 'Tasadoras Inmobiliarias',
    description: 'Tinsa, Tecnitasa, Sociedad de Tasación',
    benefits: ['Acuerdo €30K/año', '€200 + 10% recurrente', 'Integración valoraciones'],
    color: 'blue',
    arr: '€627K'
  },
  
  // TECNOLOGÍA Y CONSULTORAS
  {
    icon: Laptop,
    title: 'Consultoras Tecnológicas',
    description: 'Accenture, Deloitte Digital, consultoras',
    benefits: ['30% margen reventa', 'Enterprise custom', 'Integraciones'],
    color: 'indigo',
    arr: '€1.2M'
  },
  {
    icon: Calculator,
    title: 'Software ERP y Contable',
    description: 'Sage, Holded, A3, Contasol',
    benefits: ['€20K/año partnership', 'Integración bidireccional', '10% recurrente'],
    color: 'slate',
    arr: '€620K'
  },
  
  // OTROS SERVICIOS
  {
    icon: PaintBucket,
    title: 'Home Staging',
    description: 'Interiorismo, home staging',
    benefits: ['€150 captación', '15% recurrente', 'Bonus Tours VR'],
    color: 'purple',
    arr: '€209K'
  },
  {
    icon: Coffee,
    title: 'Coworkings',
    description: 'Impact Hub, Wayco, Utopicus',
    benefits: ['€10K/año acuerdo', '25% descuento miembros', 'Networking'],
    color: 'amber',
    arr: '€369K'
  },
  {
    icon: BriefcaseBusiness,
    title: 'Portales de Empleo',
    description: 'InfoJobs sector inmobiliario',
    benefits: ['€15K/año partnership', '€100 por lead', 'Profesionales sector'],
    color: 'cyan',
    arr: '€279K'
  },
  
  // TIPOS ORIGINALES (mantenidos)
  {
    icon: Users,
    title: 'Autónomos Inmobiliarios',
    description: 'APIs, asesores y consultores inmobiliarios',
    benefits: ['€150-1,000 por captación', '15% recurrente', '€220/mes pasivo'],
    color: 'blue',
    arr: '€600K'
  },
  {
    icon: Building2,
    title: 'Inmobiliarias y Gestoras',
    description: 'Agencias y property managers',
    benefits: ['White-label disponible', '25% margen', '€596/mes con 20 clientes'],
    color: 'indigo',
    arr: '€894K'
  },
  {
    icon: GraduationCap,
    title: 'Centros de Estudios',
    description: 'IE, ESADE, Comillas, universidades',
    benefits: ['€5,000-15,000/año licencia', 'Casos prácticos', 'Co-branding'],
    color: 'purple',
    arr: '€179K'
  },
  {
    icon: Globe,
    title: 'Plataformas Sector',
    description: 'Zona 3, comunidades PropTech',
    benefits: ['30% revenue share', 'Integración API', '€4,470/mes potencial'],
    color: 'green',
    arr: '€536K'
  },
  {
    icon: FileText,
    title: 'Asociaciones Profesionales',
    description: 'Colegios de APIs, AEGI, asociaciones',
    benefits: ['30% descuento asociados', '€100 + 15% recurrente', '€1,560/mes'],
    color: 'orange',
    arr: '€1.2M'
  },
  {
    icon: Briefcase,
    title: 'Asesores Fiscales',
    description: 'Gestorías y asesores de inversores',
    benefits: ['€100-700 captación', '12% recurrente', 'Bonus ESG'],
    color: 'cyan',
    arr: '€447K'
  }
];

const tiers = [
  {
    name: 'Bronce',
    clients: '0-10 clientes',
    commission: 'Comisión estándar',
    benefits: ['Materiales de marketing', 'Soporte por email', 'Dashboard de partners'],
    icon: '🥉'
  },
  {
    name: 'Plata',
    clients: '11-25 clientes',
    commission: '+5% comisión extra',
    benefits: ['White-label básico', 'Soporte prioritario', 'Formación mensual', 'Badge oficial'],
    icon: '🥈',
    popular: true
  },
  {
    name: 'Oro',
    clients: '26-50 clientes',
    commission: '+10% comisión extra',
    benefits: ['White-label completo + API', 'Account manager', 'Certificación', 'Co-marketing'],
    icon: '🥇'
  },
  {
    name: 'Platino',
    clients: '50+ clientes',
    commission: '+15% comisión extra',
    benefits: ['Revenue share custom', 'Roadmap participation', 'Logo en web', 'Caso de éxito'],
    icon: '💎'
  }
];

const stats = [
  { label: 'Tipos de Partners', value: '34', icon: Users },
  { label: 'Clientes Potenciales', value: '93,100', icon: Target },
  { label: 'Comisiones Año 1', value: '€10.5M', icon: DollarSign },
  { label: 'ARR Total Partners', value: '€56.9M', icon: TrendingUp }
];

const testimonials = [
  {
    name: 'María González',
    role: 'API - Barcelona',
    image: '/avatars/maria.jpg',
    text: 'Genero €440/mes pasivos con 20 clientes. INMOVA es la herramienta que siempre recomiendo a mis inversores.',
    clients: 20,
    earnings: '€440/mes'
  },
  {
    name: 'Inmobiliaria Vanguard',
    role: 'Gestora - Madrid',
    image: '/avatars/vanguard.jpg',
    text: 'El white-label nos permite diferenciarnos. Facturamos directamente y obtenemos 25% de margen.',
    clients: 35,
    earnings: '€1,305/mes'
  },
  {
    name: 'IE Business School',
    role: 'Centro de Estudios',
    image: '/avatars/ie.jpg',
    text: 'Nuestros alumnos del Máster Inmobiliario usan INMOVA como caso práctico. Colaboración perfecta.',
    clients: 80,
    earnings: '€24,576/año'
  }
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-violet-500/10" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 px-4 py-2">
              <Rocket className="h-4 w-4 mr-1 inline" />
              Programa de Partners 2026
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              <span className="block text-gray-900 mb-2">Gana Hasta €440/Mes</span>
              <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                Prescribiendo INMOVA
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Únete al programa de partners más rentable del PropTech español. 
              <span className="font-semibold text-indigo-600"> Sin inversión, solo beneficios.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/api/partners/register">
                <Button size="lg" className="gradient-primary text-white px-8 py-6 text-lg font-semibold">
                  Quiero Ser Partner
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#calculator">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-semibold border-2">
                  Calcular Mis Ingresos
                  <DollarSign className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                    <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">6 Tipos de Partners</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Encuentra el modelo que mejor se adapte a tu perfil profesional
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partnerTypes.map((type, idx) => (
              <Card key={idx} className={`group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 ${type.highlight ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50' : ''}`}>
                {type.highlight && (
                  <div className="absolute -top-3 -right-3">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 py-1 shadow-lg">
                      {type.highlight}
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className={`p-3 bg-gradient-to-br from-${type.color}-500 to-${type.color}-600 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform`}>
                    <type.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{type.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {type.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4 gradient-primary">
                    Ver Detalles
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Niveles de Partner */}
      <section className="py-24 px-4 bg-gradient-to-br from-indigo-50 to-violet-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 border-indigo-200 px-4 py-2">
              <Trophy className="h-4 w-4 mr-1 inline" />
              Programa de Incentivos
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Crece y Gana Más</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Cuantos más clientes referencias, mayor es tu comisión
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, idx) => (
              <Card 
                key={idx} 
                className={`relative ${tier.popular ? 'border-indigo-500 border-4 shadow-2xl scale-105' : 'border-2'}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0">
                      Más Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="text-5xl mb-2">{tier.icon}</div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <p className="text-sm text-gray-600">{tier.clients}</p>
                  <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                    <p className="text-sm font-bold text-indigo-600">{tier.commission}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tier.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Star className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 p-6 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Bonos Adicionales</h3>
            <p className="text-lg mb-4">10 clientes en Q1 = <span className="font-bold text-yellow-300">€1,000 bonus</span></p>
            <p className="text-lg">50 clientes en año = <span className="font-bold text-yellow-300">€10,000 bonus</span></p>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Partners de Éxito</h2>
            <p className="text-xl text-gray-600">
              Historias reales de partners que ya están ganando con INMOVA
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-2 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.text}"</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600">Clientes</p>
                      <p className="text-2xl font-bold text-indigo-600">{testimonial.clients}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Ingresos</p>
                      <p className="text-2xl font-bold text-green-600">{testimonial.earnings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Herramientas */}
      <section className="py-24 px-4 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">
              <Zap className="h-4 w-4 mr-1 inline" />
              Todo lo que Necesitas
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Herramientas para Vender Más</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: 'Dashboard Avanzado', desc: 'Tracking de leads, conversiones y comisiones en tiempo real' },
              { icon: FileText, title: 'Kit de Ventas', desc: 'Presentaciones, one-pagers, videos y casos de éxito' },
              { icon: Globe, title: 'Landing Personalizada', desc: 'Tu propia URL con tracking automático' },
              { icon: Award, title: 'Certificación Oficial', desc: 'Conviértete en Partner Certificado INMOVA' },
              { icon: Users, title: 'CRM Integrado', desc: 'Gestiona tus leads y seguimiento' },
              { icon: Shield, title: 'White-Label', desc: 'Personaliza con tu marca (Plata+)' }
            ].map((tool, idx) => (
              <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl w-fit mb-3">
                    <tool.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{tool.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Empieza a Generar Ingresos Hoy
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Registro gratuito. Sin compromiso. Comisiones desde la primera venta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/api/partners/register">
              <Button size="lg" variant="secondary" className="px-8 py-6 text-lg font-semibold">
                Registrarse como Partner
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/partners/guia">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-semibold border-white text-white hover:bg-white/10">
                Descargar Guía Completa
                <FileText className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-sm opacity-90">
            ¿Preguntas? Escríbenos a <a href="mailto:partners@inmova.com" className="underline font-semibold">partners@inmova.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}
