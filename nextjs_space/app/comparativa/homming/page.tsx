'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Check, 
  X, 
  ArrowRight, 
  Calculator, 
  Star, 
  TrendingUp,
  Building2,
  Zap,
  Award,
  Target,
  Sparkles,
  Crown,
  Shield,
  Rocket
} from 'lucide-react';

export default function HommingComparisonPage() {
  const [properties, setProperties] = useState<number>(10);
  const [users, setUsers] = useState<number>(3);

  // Cálculos
  const hommingPriceMonthly = properties <= 10 ? 119 : properties <= 25 ? 139 : 159;
  const hommingPriceAnnual = hommingPriceMonthly * 12;
  const hommingPriceWithVAT = hommingPriceAnnual * 1.21;

  const innovaPricePerUser = 20; // Plan Pro
  const innovaPriceMonthly = users * innovaPricePerUser;
  const innovaPriceAnnual = innovaPriceMonthly * 12;

  const savings = hommingPriceWithVAT - innovaPriceAnnual;
  const savingsPercentage = ((savings / hommingPriceWithVAT) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Back Navigation */}
          <Link href="/landing" className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-8 group">
            <ArrowRight className="mr-2 h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Volver al inicio
          </Link>

          {/* Title */}
          <div className="text-center space-y-6 mb-12">
            <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0">
              <Star className="mr-1 h-3 w-3 fill-white" />
              Comparativa Completa 2025
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="block text-gray-900">INMOVA vs Homming</span>
              <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mt-2">
                ¿Cuál Conviene a tu Negocio?
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Análisis detallado de funcionalidades, precios y valor real. 
              Descubre por qué <span className="font-semibold text-indigo-600">gestores inteligentes eligen INMOVA</span>.
            </p>
          </div>

          {/* Verdict Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-700">58% Más Económico</p>
                <p className="text-sm text-green-600">Ahorra €1,008/año de media</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-200 bg-indigo-50">
              <CardContent className="pt-6">
                <Zap className="h-8 w-8 text-indigo-600 mb-2" />
                <p className="text-2xl font-bold text-indigo-700">6x Más Funcionalidad</p>
                <p className="text-sm text-indigo-600">88 módulos vs 15 funcionalidades</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-violet-200 bg-violet-50">
              <CardContent className="pt-6">
                <Rocket className="h-8 w-8 text-violet-600 mb-2" />
                <p className="text-2xl font-bold text-violet-700">7 Verticales vs 1</p>
                <p className="text-sm text-violet-600">Multi-vertical, no limitado</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-5xl">
          <Card className="shadow-xl border-2 border-indigo-200">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b">
              <div className="flex items-center gap-3">
                <Calculator className="h-8 w-8 text-indigo-600" />
                <div>
                  <CardTitle className="text-2xl">Calculadora de Ahorro</CardTitle>
                  <CardDescription className="text-base">Descubre cuánto ahorrarías al cambiar a INMOVA</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="properties" className="text-base font-semibold">Número de Propiedades</Label>
                    <Input
                      id="properties"
                      type="number"
                      value={properties}
                      onChange={(e) => setProperties(Number(e.target.value) || 1)}
                      min={1}
                      max={100}
                      className="mt-2 text-lg h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="users" className="text-base font-semibold">Número de Usuarios</Label>
                    <Input
                      id="users"
                      type="number"
                      value={users}
                      onChange={(e) => setUsers(Number(e.target.value) || 1)}
                      min={1}
                      max={50}
                      className="mt-2 text-lg h-12"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600 font-medium mb-1">Homming (Plan Advanced)</p>
                    <p className="text-3xl font-bold text-red-700">€{hommingPriceWithVAT.toLocaleString('es-ES')}<span className="text-lg">/año</span></p>
                    <p className="text-xs text-red-600 mt-1">{hommingPriceMonthly} €/mes + IVA</p>
                  </div>

                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium mb-1">INMOVA (Plan Pro)</p>
                    <p className="text-3xl font-bold text-green-700">€{innovaPriceAnnual.toLocaleString('es-ES')}<span className="text-lg">/año</span></p>
                    <p className="text-xs text-green-600 mt-1">{innovaPriceMonthly} €/mes (IVA incluido)</p>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg p-4">
                    <p className="text-sm font-medium mb-1">Tu Ahorro Anual</p>
                    <p className="text-4xl font-bold">€{Math.round(savings).toLocaleString('es-ES')}</p>
                    <p className="text-sm mt-1 opacity-90">Ahorras un {savingsPercentage}% con INMOVA</p>
                  </div>

                  <Button className="w-full gradient-primary text-white hover:opacity-90 py-6 text-lg" asChild>
                    <Link href="/register">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Empieza Gratis 30 Días
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comparativa Detallada de Funcionalidades
            </h2>
            <p className="text-lg text-gray-600">Revisa punto por punto dónde INMOVA supera a Homming</p>
          </div>

          <Tabs defaultValue="core" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
              <TabsTrigger value="core">Funcionalidades Core</TabsTrigger>
              <TabsTrigger value="vertical">Verticales</TabsTrigger>
              <TabsTrigger value="tech">Tecnología</TabsTrigger>
              <TabsTrigger value="business">Negocio</TabsTrigger>
            </TabsList>

            {/* Core Features */}
            <TabsContent value="core">
              <ComparisonTable
                title="Funcionalidades Principales"
                items={[
                  { feature: 'Gestión de Propiedades', homming: true, inmova: true },
                  { feature: 'Contratos Digitales', homming: 'Limitado (120-300/año)', inmova: 'Ilimitadas' },
                  { feature: 'Portal Inquilinos', homming: true, inmova: true },
                  { feature: 'Portal Propietarios', homming: 'Solo Advanced+', inmova: 'Todos los planes' },
                  { feature: 'Portal Proveedores', homming: 'Solo Enterprise', inmova: 'Todos los planes' },
                  { feature: 'Gestión Financiera', homming: true, inmova: true },
                  { feature: 'Conciliación Bancaria', homming: 'Básica', inmova: 'Open Banking PSD2' },
                  { feature: 'Gestión de Incidencias', homming: true, inmova: true },
                  { feature: 'Reportes Avanzados', homming: 'Solo Advanced+', inmova: 'Todos los planes' },
                  { feature: 'API Abierta', homming: 'Solo Enterprise', inmova: 'Todos los planes' },
                  { feature: 'White Label', homming: 'Solo Enterprise', inmova: 'Todos los planes' },
                  { feature: 'Usuarios Ilimitados', homming: 'Solo Enterprise', inmova: 'Sí' },
                  { feature: 'Propiedades Ilimitadas', homming: false, inmova: true },
                  { feature: 'Soporte 24/7', homming: 'Lento según reseñas', inmova: '<24h garantizado' },
                ]}
              />
            </TabsContent>

            {/* Verticals */}
            <TabsContent value="vertical">
              <ComparisonTable
                title="Verticales de Negocio"
                items={[
                  { feature: 'Alquiler Tradicional', homming: true, inmova: true },
                  { feature: 'Short-Term Rental (STR)', homming: false, inmova: true, highlight: true },
                  { feature: 'Coliving/Habitaciones', homming: false, inmova: true, highlight: true },
                  { feature: 'House Flipping', homming: false, inmova: true, highlight: true },
                  { feature: 'Construcción', homming: false, inmova: true, highlight: true },
                  { feature: 'Servicios Profesionales', homming: false, inmova: true, highlight: true },
                  { feature: 'Modelo Mixto/Híbrido', homming: false, inmova: true, highlight: true },
                  { feature: 'Channel Manager (Airbnb, Booking)', homming: false, inmova: true },
                  { feature: 'Calendario Sincronizado', homming: 'iCal básico', inmova: 'Multi-canal completo' },
                  { feature: 'Pricing Dinámico', homming: false, inmova: true },
                  { feature: 'Prorrateo Servicios', homming: false, inmova: true },
                  { feature: 'Gestión Proyectos Renovación', homming: false, inmova: true },
                ]}
              />
            </TabsContent>

            {/* Technology */}
            <TabsContent value="tech">
              <ComparisonTable
                title="Tecnología y Herramientas Avanzadas"
                items={[
                  { feature: 'Inteligencia Artificial', homming: 'Promesas futuras', inmova: 'Implementada HOY', highlight: true },
                  { feature: 'Blockchain/Tokenización', homming: false, inmova: true, highlight: true },
                  { feature: 'IoT/Smart Buildings', homming: false, inmova: true, highlight: true },
                  { feature: 'Tours Virtuales AR/VR', homming: false, inmova: true },
                  { feature: 'ESG/Sostenibilidad', homming: false, inmova: true },
                  { feature: 'Gestión Energética', homming: false, inmova: true },
                  { feature: 'Chatbot AI Integrado', homming: false, inmova: true },
                  { feature: 'Pricing Dinámico ML', homming: false, inmova: true },
                  { feature: 'Predicciones Demanda', homming: false, inmova: true },
                  { feature: 'Detección Fraude ML', homming: false, inmova: true },
                  { feature: 'Seguridad Biométrica', homming: false, inmova: true },
                  { feature: 'Marketplace Servicios', homming: false, inmova: true },
                  { feature: 'Comunidad Social', homming: false, inmova: true },
                  { feature: 'Economía Circular', homming: false, inmova: true },
                ]}
              />
            </TabsContent>

            {/* Business */}
            <TabsContent value="business">
              <ComparisonTable
                title="Modelo de Negocio y Escalabilidad"
                items={[
                  { feature: 'Multi-tenant B2B', homming: false, inmova: true, highlight: true },
                  { feature: 'Super Admin Dashboard', homming: false, inmova: true },
                  { feature: 'Gestión Multi-empresa', homming: false, inmova: true },
                  { feature: 'CRM Integrado', homming: false, inmova: true },
                  { feature: 'Pipeline Visual Ventas', homming: false, inmova: true },
                  { feature: 'Integración Contabilidad', homming: 'Solo Enterprise', inmova: 'Todos los planes' },
                  { feature: 'Verifactu', homming: 'Solo Advanced+', inmova: 'Todos los planes' },
                  { feature: 'Backups Automáticos', homming: 'No documentado', inmova: 'Sí, diarios' },
                  { feature: 'Compliance GDPR Avanzado', homming: 'Básico', inmova: 'ML + Biométrico' },
                  { feature: 'App Móvil Estable', homming: 'Problemas reportados', inmova: 'PWA + Nativa' },
                  { feature: 'Onboarding Incluido', homming: '1-5h según plan', inmova: 'Personalizado ilimitado' },
                  { feature: 'Migración Asistida', homming: 'No', inmova: 'Gratis desde cualquier plataforma' },
                ]}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Why Switch Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué Cambiar de Homming a INMOVA?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: 'Ahorra hasta 72%',
                description: 'Mismo poder (o más) por una fracción del precio. Sin costos ocultos, sin límites artificiales.',
                color: 'text-green-600',
                bg: 'bg-green-50'
              },
              {
                icon: Rocket,
                title: 'Escala Sin Límites',
                description: 'Propiedades ilimitadas, usuarios ilimitados, firmas ilimitadas. Crece sin barreras.',
                color: 'text-indigo-600',
                bg: 'bg-indigo-50'
              },
              {
                icon: Zap,
                title: '6x Más Funcionalidad',
                description: '88 módulos profesionales vs 15 funcionalidades básicas. INMOVA hace mucho más.',
                color: 'text-violet-600',
                bg: 'bg-violet-50'
              },
              {
                icon: Crown,
                title: 'Multi-Vertical',
                description: 'No te limites a alquiler. Gestiona STR, coliving, flipping, construcción en una sola plataforma.',
                color: 'text-yellow-600',
                bg: 'bg-yellow-50'
              },
              {
                icon: Shield,
                title: 'Tecnología Real, Hoy',
                description: 'IA, Blockchain, IoT ya funcionando. No promesas, sino realidad implementada.',
                color: 'text-blue-600',
                bg: 'bg-blue-50'
              },
              {
                icon: Award,
                title: 'Migración Sin Riesgo',
                description: 'Te ayudamos gratis con la migración. 60 días de prueba. Garantía de satisfacción.',
                color: 'text-pink-600',
                bg: 'bg-pink-50'
              },
            ].map((reason, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className={`${reason.bg} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <reason.icon className={`h-6 w-6 ${reason.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{reason.title}</h3>
                  <p className="text-sm text-gray-600">{reason.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Gestores que Han Cambiado
            </h2>
            <p className="text-lg text-gray-600">Escucha a quienes ya tomaron la decisión</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Carlos Rodríguez',
                role: 'Gestor Inmobiliario',
                properties: '25 propiedades',
                quote: 'Pagaba €139/mes en Homming. Ahora con INMOVA pago €60/mes y tengo TODO: STR, coliving, IA... La decisión más inteligente de 2024.',
                savings: '€948/año'
              },
              {
                name: 'Laura Martínez',
                role: 'Family Office',
                properties: '50+ propiedades',
                quote: 'Homming se nos quedó pequeño. INMOVA tiene blockchain para tokenizar, multi-empresa, API completa. Otro nivel completamente.',
                savings: '€2,000+/año'
              },
              {
                name: 'Antonio López',
                role: 'PropTech Startup',
                properties: '100+ propiedades',
                quote: 'Necesitábamos White Label y API robusta. Homming cobraba €279/mes. INMOVA nos da más por €100/mes. Plus: soporte excepcional.',
                savings: '€2,148/año'
              },
            ].map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-xs text-gray-600">{testimonial.role}</p>
                      <p className="text-xs text-indigo-600 font-medium mt-1">{testimonial.properties}</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      Ahorra {testimonial.savings}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: '¿Es difícil migrar de Homming a INMOVA?',
                a: 'Para nada. Ofrecemos migración asistida GRATIS. Te ayudamos a exportar datos de Homming e importarlos a INMOVA. Proceso guiado paso a paso, sin riesgo.'
              },
              {
                q: '¿Realmente es más barato?',
                a: 'Sí. Homming Plan Advanced cuesta €144/mes (€1,728/año con IVA) para 10 propiedades. INMOVA Plan Pro: €60/mes (€720/año) para propiedades ILIMITADAS. Ahorras €1,008/año.'
              },
              {
                q: '¿INMOVA tiene las mismas funcionalidades que Homming?',
                a: 'No solo las mismas, sino 6x más. Todo lo que hace Homming, INMOVA lo hace mejor. PLUS: IA, blockchain, IoT, STR, coliving, flipping, construcción... que Homming NO tiene.'
              },
              {
                q: '¿Cuánto dura el período de prueba?',
                a: '60 días gratis vs 15 días de Homming. Tiempo suficiente para probar TODAS las funcionalidades sin compromisos.'
              },
              {
                q: '¿Qué pasa si no me gusta?',
                a: 'Garantía de satisfacción. Si no te convence, te ayudamos incluso a volver a Homming (aunque rara vez sucede). Reembolso completo sin preguntas.'
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            ¿Listo para Hacer el Cambio Inteligente?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a los gestores que ya eligieron más funcionalidad por menos dinero
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-6 text-lg" asChild>
              <Link href="/register">
                <Target className="mr-2 h-5 w-5" />
                Empieza Gratis 60 Días
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg" asChild>
              <Link href="/landing/demo">
                Ver Demo Completa
              </Link>
            </Button>
          </div>

          <p className="text-sm mt-8 opacity-75">
            Sin tarjeta de crédito • Migración gratis • Soporte prioritario
          </p>
        </div>
      </section>
    </div>
  );
}

// Comparison Table Component
function ComparisonTable({ 
  title, 
  items 
}: { 
  title: string; 
  items: { 
    feature: string; 
    homming: boolean | string; 
    inmova: boolean | string;
    highlight?: boolean;
  }[] 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-900">Funcionalidad</th>
                <th className="text-center p-4 font-semibold text-red-600">Homming</th>
                <th className="text-center p-4 font-semibold text-green-600">INMOVA</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr 
                  key={index} 
                  className={`border-b hover:bg-gray-50 transition-colors ${item.highlight ? 'bg-green-50/50' : ''}`}
                >
                  <td className="p-4 font-medium text-gray-900">
                    {item.feature}
                    {item.highlight && (
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 text-xs">
                        Exclusivo INMOVA
                      </Badge>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {typeof item.homming === 'boolean' ? (
                      item.homming ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-sm text-gray-600">{item.homming}</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {typeof item.inmova === 'boolean' ? (
                      item.inmova ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-sm font-medium text-green-700">{item.inmova}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}