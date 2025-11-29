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
  Link as LinkIcon, Recycle, Phone, Mail, MapPin
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('todos');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              <span className="text-2xl font-bold">INMOVA</span>
              <Badge variant="secondary" className="ml-2">PropTech</Badge>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium hover:text-primary">Características</a>
              <a href="#vertical" className="text-sm font-medium hover:text-primary">Multi-Vertical</a>
              <a href="#pricing" className="text-sm font-medium hover:text-primary">Precios</a>
              <a href="#comparativa" className="text-sm font-medium hover:text-primary">Comparativa</a>
              <Link href="/login">
                <Button variant="ghost">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button>Comenzar Gratis</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="secondary">
                <Zap className="h-3 w-3 mr-1" />
                #1 PropTech Multi-Vertical en España
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                La Plataforma <span className="text-primary">Todo-en-Uno</span> para Gestión Inmobiliaria
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                88 módulos profesionales. 7 verticales de negocio. Blockchain, IA GPT-4, y tecnologías punta. 
                Gestiona alquileres, flipping, construcción, servicios profesionales y más desde una sola plataforma.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    <Rocket className="h-5 w-5" />
                    Prueba Gratis 30 Días
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Play className="h-5 w-5" />
                    Ver Demo
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <div className="text-3xl font-bold">88</div>
                  <div className="text-sm text-muted-foreground">Módulos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">7</div>
                  <div className="text-sm text-muted-foreground">Verticales</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                <div className="relative w-full h-full bg-muted/30 rounded-2xl p-8 flex items-center justify-center">
                  <Building2 className="h-32 w-32 text-primary" />
                </div>
              </div>
              {/* Floating Cards */}
              <Card className="absolute -left-4 top-8 w-48 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">+45% ROI</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="absolute -right-4 bottom-12 w-52 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">5,000+ Propiedades</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-12 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-primary-foreground/80">Unidades Gestionadas</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-primary-foreground/80">Empresas Inmobiliarias</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">€50M+</div>
              <div className="text-primary-foreground/80">Ingresos Procesados</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9/5</div>
              <div className="text-primary-foreground/80">Satisfacción Cliente</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">88 Módulos Profesionales</Badge>
            <h2 className="text-4xl font-bold mb-4">Características que Revolucionan el PropTech</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tu negocio inmobiliario en una sola plataforma
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Building2, title: 'Gestión de Propiedades', desc: 'Edificios, unidades, contratos' },
              { icon: Users, title: 'Portal Inquilinos', desc: 'App móvil + portal web' },
              { icon: CreditCard, title: 'Pagos Stripe', desc: 'Cobros automáticos recurrentes' },
              { icon: Hammer, title: 'Mantenimiento Pro', desc: 'IA predictiva + calendario' },
              { icon: Bot, title: 'Asistente IA GPT-4', desc: 'Chat + comandos de voz' },
              { icon: LinkIcon, title: 'Blockchain', desc: 'Tokenización de propiedades' },
              { icon: BarChart3, title: 'Business Intelligence', desc: 'Dashboards avanzados' },
              { icon: Shield, title: 'Seguridad Biométrica', desc: 'GDPR + detección fraude ML' },
              { icon: Calendar, title: 'Calendario Unificado', desc: 'Todos los eventos en uno' },
              { icon: FileText, title: 'Firma Digital', desc: 'Signaturit integrado' },
              { icon: Cloud, title: 'Open Banking', desc: 'Verificación de ingresos' },
              { icon: Leaf, title: 'ESG Sostenibilidad', desc: 'Huella carbono + certificaciones' },
            ].map((feature, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/login">
              <Button variant="outline" className="gap-2">
                Ver Todos los 88 Módulos
                <ArrowRight className="h-4 w-4" />
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
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">Precios</Badge>
            <h2 className="text-4xl font-bold mb-4">Planes para Cada Necesidad</h2>
            <p className="text-xl text-muted-foreground">Comienza gratis, escala cuando lo necesites</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Básico',
                price: '€29',
                period: '/mes',
                features: [
                  'Hasta 50 propiedades',
                  'Módulos core',
                  '3 usuarios',
                  'Soporte email',
                  'Integraciones básicas'
                ]
              },
              {
                name: 'Profesional',
                price: '€79',
                period: '/mes',
                popular: true,
                features: [
                  'Hasta 500 propiedades',
                  '70+ módulos',
                  '10 usuarios',
                  'Soporte prioritario',
                  'White Label básico',
                  'IA + Blockchain'
                ]
              },
              {
                name: 'Empresarial',
                price: 'Custom',
                period: '',
                features: [
                  'Propiedades ilimitadas',
                  'TODOS los 88 módulos',
                  'Usuarios ilimitados',
                  'Soporte 24/7',
                  'White Label completo',
                  'Todas las integraciones',
                  'Servidor dedicado'
                ]
              }
            ].map((plan, i) => (
              <Card key={i} className={plan.popular ? 'border-primary border-2 shadow-lg' : ''}>
                {plan.popular && (
                  <div className="bg-primary text-white text-center py-2 rounded-t-lg text-sm font-medium">
                    Más Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="w-full">
                    <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                      Comenzar Ahora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
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
