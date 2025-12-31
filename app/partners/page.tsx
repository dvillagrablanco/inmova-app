'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Sparkles,
  TrendingUp,
  Users,
  Euro,
  Award,
  Zap,
  Target,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Briefcase,
  GraduationCap,
  Building2,
  Shield,
  Landmark,
  BadgeCheck,
  Rocket,
  Gift,
  Star,
  Trophy,
  Crown,
  Gem,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const partnerTypes = [
  {
    icon: Landmark,
    title: 'Bancos',
    description: 'Ofrece valor añadido a clientes hipotecarios',
    commission: '25%',
    bonus: '€200/cliente',
    color: 'bg-blue-500',
  },
  {
    icon: Shield,
    title: 'Aseguradoras',
    description: 'Bundle seguros + software de gestión',
    commission: '20% + €500/mes',
    bonus: '€50/lead',
    color: 'bg-green-500',
  },
  {
    icon: GraduationCap,
    title: 'Escuelas de Negocios',
    description: 'Software real para MBA y alumnos',
    commission: '30%',
    bonus: '€2,000/caso',
    color: 'bg-purple-500',
  },
  {
    icon: Building2,
    title: 'Inmobiliarias',
    description: 'Software gratis + comisiones por referir',
    commission: '25%',
    bonus: 'Plan gratis',
    color: 'bg-orange-500',
  },
  {
    icon: Briefcase,
    title: 'Constructoras',
    description: 'Gestión post-venta de proyectos',
    commission: '20%',
    bonus: '€5,000/proyecto',
    color: 'bg-red-500',
  },
  {
    icon: BadgeCheck,
    title: 'Abogados / Admins',
    description: 'Software complementario para clientes',
    commission: '30%',
    bonus: 'API gratis',
    color: 'bg-teal-500',
  },
];

const levels = [
  {
    name: 'Bronze',
    icon: Award,
    clients: '1-10',
    commission: '20%',
    perClient: '€29.80',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  {
    name: 'Silver',
    icon: Star,
    clients: '11-25',
    commission: '25%',
    perClient: '€37.25',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
  {
    name: 'Gold',
    icon: Trophy,
    clients: '26-50',
    commission: '30%',
    perClient: '€44.70',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  {
    name: 'Platinum',
    icon: Crown,
    clients: '51-100',
    commission: '35%',
    perClient: '€52.15',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Diamond',
    icon: Gem,
    clients: '100+',
    commission: '40%',
    perClient: '€59.60',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

const benefits = [
  'Comisiones recurrentes de por vida',
  'Bonos de alta por cada cliente',
  'Bonos trimestrales por volumen',
  'Sistema multinivel (hasta 3 niveles)',
  'Dashboard con métricas en tiempo real',
  'Materiales de marketing profesionales',
  'Account Manager dedicado (nivel Silver+)',
  'Acceso API prioritario (nivel Gold+)',
  'White-label disponible (nivel Gold+)',
  'Equity options (nivel Diamond)',
];

const testimonials = [
  {
    name: 'Carlos M.',
    role: 'Director, Banco Regional',
    level: 'Diamond',
    avatar: '👨‍💼',
    quote:
      '€203,000 en el primer año. Increíble cómo una simple recomendación se convierte en ingresos pasivos.',
    earnings: '€9,000/mes',
  },
  {
    name: 'Laura S.',
    role: 'Directora MBA, IE Business School',
    level: 'Gold',
    avatar: '👩‍🎓',
    quote: 'Mis alumnos usan software real y yo genero ingresos adicionales. Win-win perfecto.',
    earnings: '€2,011/mes',
  },
  {
    name: 'Miguel P.',
    role: 'CEO, Inmobiliaria Premium',
    level: 'Silver',
    avatar: '👨‍💻',
    quote:
      'Uso el software gratis y además gano €820/mes refiriendo a propietarios. Mejor imposible.',
    earnings: '€820/mes',
  },
];

export default function PartnersPage() {
  const router = useRouter();
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false);
  const [calculatorClients, setCalculatorClients] = useState(10);
  const [selectedPartnerType, setSelectedPartnerType] = useState('');

  const calculateEarnings = () => {
    let level = levels[0];
    if (calculatorClients >= 100) level = levels[4];
    else if (calculatorClients >= 51) level = levels[3];
    else if (calculatorClients >= 26) level = levels[2];
    else if (calculatorClients >= 11) level = levels[1];

    const monthlyPerClient = parseFloat(level.perClient.replace('€', ''));
    const monthlyTotal = monthlyPerClient * calculatorClients;
    const yearlyTotal = monthlyTotal * 12;
    const bonusAlta = calculatorClients * 300; // €300 promedio por alta

    return {
      level: level.name,
      monthlyPerClient,
      monthlyTotal,
      yearlyTotal,
      bonusAlta,
      total: yearlyTotal + bonusAlta,
    };
  };

  const earnings = calculateEarnings();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Solicitud enviada! Te contactaremos en 24h');
    setRegisterDialogOpen(false);
    router.push('/partners/dashboard');
  };

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 text-white py-20">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-8">
              <Badge className="mx-auto bg-white/20 text-white border-white/30 text-sm px-4 py-2">
                <Sparkles className="inline h-4 w-4 mr-2" />
                Primeros 100 partners: +5% comisión LIFETIME
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Gana hasta <span className="text-yellow-300">€203,000/año</span>
                <br />
                prescribiendo Inmova
              </h1>

              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
                Únete al programa de partners más rentable del sector PropTech.
                <br />
                <strong>Comisiones recurrentes de por vida + bonos ilimitados.</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
                  onClick={() => setRegisterDialogOpen(true)}
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Quiero ser Partner
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                  onClick={() => setCalculatorDialogOpen(true)}
                >
                  <Calculator className="mr-2 h-5 w-5" />
                  Calcular Ingresos
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-12">
                <div className="text-center">
                  <div className="text-4xl font-bold">40%</div>
                  <div className="text-white/80 mt-1">Comisión máxima</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">€50K</div>
                  <div className="text-white/80 mt-1">Bono trimestral</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">100+</div>
                  <div className="text-white/80 mt-1">Partners activos</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">24h</div>
                  <div className="text-white/80 mt-1">Setup rápido</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Types */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">¿Qué tipo de partner eres?</h2>
              <p className="text-xl text-muted-foreground">
                Programas personalizados según tu industria
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partnerTypes.map((type, index) => (
                <Card
                  key={index}
                  className="hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => router.push(`/partners/${type.title.toLowerCase()}`)}
                >
                  <CardHeader>
                    <div
                      className={`w-16 h-16 ${type.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <type.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{type.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground">{type.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">Comisión: {type.commission}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-purple-600" />
                        <span className="font-semibold">Bonus: {type.bonus}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full group-hover:bg-primary group-hover:text-white"
                    >
                      Ver detalles
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Levels Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Sube de nivel, gana más</h2>
              <p className="text-xl text-muted-foreground">
                Tu comisión crece automáticamente con cada cliente
              </p>
            </div>

            <div className="grid md:grid-cols-5 gap-4">
              {levels.map((level, index) => (
                <Card
                  key={index}
                  className={`text-center hover:shadow-lg transition-all ${level.bgColor}`}
                >
                  <CardHeader>
                    <level.icon className={`h-12 w-12 mx-auto ${level.color}`} />
                    <CardTitle className="text-xl mt-2">{level.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">{level.clients} clientes</div>
                    <div className="text-2xl font-bold">{level.commission}</div>
                    <div className="text-sm text-muted-foreground">
                      {level.perClient}/cliente/mes
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">¿Por qué elegir Inmova Partners?</h2>
              <p className="text-xl text-muted-foreground">El programa más completo del mercado</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                onClick={() => setRegisterDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 px-8 py-6 text-lg"
              >
                Empezar ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Partners que ya ganan con Inmova</h2>
              <p className="text-xl text-muted-foreground">
                Resultados reales de nuestros top performers
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{testimonial.avatar}</div>
                      <div>
                        <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        <Badge className="mt-1">{testimonial.level}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="italic text-muted-foreground">"{testimonial.quote}"</p>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-muted-foreground">Ingresos mensuales:</span>
                      <span className="text-xl font-bold text-green-600">
                        {testimonial.earnings}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              ¿Listo para generar ingresos pasivos?
            </h2>
            <p className="text-xl text-white/90">
              Únete a los primeros 100 partners y obtén +5% comisión de por vida
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
                onClick={() => setRegisterDialogOpen(true)}
              >
                Registrarse ahora
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                onClick={() => router.push('/partners/programa')}
              >
                Ver programa completo
              </Button>
            </div>
            <div className="text-white/80 text-sm pt-4">
              ✓ Sin costes ✓ Sin exclusividad ✓ Sin permanencia
            </div>
          </div>
        </section>

        {/* Register Dialog */}
        <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Registro de Partner</DialogTitle>
              <DialogDescription>
                Completa el formulario y empieza a ganar en 24 horas
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre completo *</Label>
                  <Input required placeholder="Juan García" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input required type="email" placeholder="juan@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono *</Label>
                  <Input required type="tel" placeholder="+34 600 000 000" />
                </div>
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Input placeholder="Mi Empresa SL" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de partner *</Label>
                <Tabs defaultValue="banco" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="banco">Banco</TabsTrigger>
                    <TabsTrigger value="aseguradora">Aseguradora</TabsTrigger>
                    <TabsTrigger value="escuela">Escuela</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <strong>Early Adopter Bonus:</strong> Como uno de los primeros 100 partners,
                    obtendrás +5% comisión de por vida en todos tus clientes.
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Enviar solicitud
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Al registrarte aceptas los{' '}
                <a
                  href="/partners/terminos"
                  className="underline hover:text-primary"
                  target="_blank"
                >
                  términos del programa
                </a>
                . Te contactaremos en menos de 24 horas.
              </p>
            </form>
          </DialogContent>
        </Dialog>

        {/* Calculator Dialog */}
        <Dialog open={calculatorDialogOpen} onOpenChange={setCalculatorDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Calculadora de Ingresos</DialogTitle>
              <DialogDescription>
                Descubre cuánto podrías ganar como partner de Inmova
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <Label className="text-lg">
                  ¿Cuántos clientes crees que puedes referir? {calculatorClients}
                </Label>
                <Input
                  type="range"
                  min="1"
                  max="150"
                  value={calculatorClients}
                  onChange={(e) => setCalculatorClients(parseInt(e.target.value))}
                  className="mt-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>1</span>
                  <span>150+</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
                  <CardHeader>
                    <CardTitle>Tu nivel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-purple-600">{earnings.level}</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Con {calculatorClients} clientes activos
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-teal-50">
                  <CardHeader>
                    <CardTitle>Ingresos mensuales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-green-600">
                      €{earnings.monthlyTotal.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">Comisiones recurrentes</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Ingresos por comisiones (año 1):</span>
                      <span className="font-bold">€{earnings.yearlyTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bonos de alta (€300/cliente):</span>
                      <span className="font-bold">€{earnings.bonusAlta.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-4 border-t">
                      <span>TOTAL AÑO 1:</span>
                      <span className="text-green-600">€{earnings.total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <strong>Nota:</strong> Estos cálculos son estimaciones basadas en el plan
                Professional (€149/mes). Bonos trimestrales y multinivel no incluidos.
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setCalculatorDialogOpen(false);
                  setRegisterDialogOpen(true);
                }}
              >
                Quiero ganar €{earnings.total.toLocaleString()}/año
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
