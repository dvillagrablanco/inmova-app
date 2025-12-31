'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Landmark,
  TrendingUp,
  Users,
  Euro,
  CheckCircle2,
  ArrowRight,
  Calculator,
  FileText,
  Zap,
  Shield,
  Target,
  PieChart,
  Award,
  Home,
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
import { toast } from 'sonner';

const caseStudy = {
  name: 'Banco Regional',
  branches: 50,
  clientsPerMonth: 1,
  results: {
    year1Clients: 600,
    monthlyMRR: 13500,
    year1Total: 203000,
    breakdown: {
      recurring: 162000,
      signupBonus: 36000,
      quarterlyBonus: 5000,
    },
  },
};

const benefits = [
  {
    icon: Users,
    title: 'Valor Añadido para Clientes',
    description:
      'Ofrece Inmova a clientes hipotecarios como herramienta para gestionar su inversión inmobiliaria',
    color: 'text-blue-600',
  },
  {
    icon: TrendingUp,
    title: 'Mejora la Retención',
    description:
      'Clientes que usan Inmova permanecen más tiempo con el banco (menor churn hipotecario)',
    color: 'text-green-600',
  },
  {
    icon: PieChart,
    title: 'Cross-Selling Inteligente',
    description:
      'Identifica oportunidades de seguros, inversión y productos financieros adicionales',
    color: 'text-purple-600',
  },
  {
    icon: Shield,
    title: 'Sin Coste ni Riesgo',
    description:
      '100% gratuito para el banco. No hay costes de implementación, licencias ni mantenimiento',
    color: 'text-orange-600',
  },
  {
    icon: Euro,
    title: 'Ingresos Pasivos Recurrentes',
    description: 'Comisiones mensuales de por vida por cada cliente que contrate Inmova',
    color: 'text-emerald-600',
  },
  {
    icon: Zap,
    title: 'Setup en 24 horas',
    description: 'Materiales listos para usar. Formación express para tu equipo comercial',
    color: 'text-yellow-600',
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Registro del Banco',
    description: 'Completa el formulario de registro. Aprobación en menos de 24h.',
    icon: FileText,
  },
  {
    step: 2,
    title: 'Formación Express',
    description: 'Sesión de 1 hora con tu equipo comercial para explicar la propuesta de valor.',
    icon: Users,
  },
  {
    step: 3,
    title: 'Materiales de Marketing',
    description: 'Descarga folletos, presentaciones y banners co-branded para tus oficinas.',
    icon: Zap,
  },
  {
    step: 4,
    title: 'Ofrece a Clientes',
    description: 'Ofrece Inmova a clientes hipotecarios como herramienta de gestión inmobiliaria.',
    icon: Home,
  },
  {
    step: 5,
    title: 'Track & Earn',
    description: 'Monitorea clientes referidos y comisiones en tiempo real en tu dashboard.',
    icon: PieChart,
  },
  {
    step: 6,
    title: 'Cobra Automáticamente',
    description: 'Recibe pagos mensuales automáticos en tu cuenta el día 5 de cada mes.',
    icon: Euro,
  },
];

export default function PartnersBancosPage() {
  const router = useRouter();
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [branches, setBranches] = useState(50);
  const [clientsPerBranch, setClientsPerBranch] = useState(1);

  const totalClients = branches * clientsPerBranch * 12; // Por año
  const monthlyMRR = totalClients * 149 * 0.25; // Professional plan, 25% comisión
  const year1Total = monthlyMRR * 12 + totalClients * 200; // Recurring + bonos

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
        <section className="relative bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-800 text-white py-20">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Landmark className="h-16 w-16" />
                <h1 className="text-5xl md:text-7xl font-bold">
                  Programa para
                  <br />
                  <span className="text-yellow-300">Bancos</span>
                </h1>
              </div>

              <p className="text-2xl md:text-3xl font-semibold max-w-4xl mx-auto">
                Genera hasta <span className="text-yellow-300">€203,000/año</span> en ingresos
                pasivos
                <br />
                ofreciendo Inmova a tus clientes hipotecarios
              </p>

              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Sin coste. Sin riesgo. Sin implementación técnica.
                <br />
                <strong>Solo valor añadido para tus clientes + comisiones para ti.</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
                  onClick={() => setRegisterDialogOpen(true)}
                >
                  <Award className="mr-2 h-5 w-5" />
                  Registrar mi Banco
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                  onClick={() => setCalculatorOpen(true)}
                >
                  <Calculator className="mr-2 h-5 w-5" />
                  Calcular Potencial
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-12">
                <div className="text-center">
                  <div className="text-4xl font-bold">25%</div>
                  <div className="text-white/80 mt-1">Comisión base</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">€200</div>
                  <div className="text-white/80 mt-1">Bono/cliente</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">30%</div>
                  <div className="text-white/80 mt-1">Con 50+ clientes</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">24h</div>
                  <div className="text-white/80 mt-1">Setup completo</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Remuneración Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Modelo de Remuneración</h2>
              <p className="text-xl text-muted-foreground">
                Múltiples fuentes de ingresos por cada cliente
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <Badge className="w-fit mb-2">Recurrente</Badge>
                  <CardTitle className="text-2xl">25% Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-4xl font-bold text-blue-600">€37.25</div>
                    <div className="text-sm text-muted-foreground">
                      Por cliente/mes (plan Professional €149)
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        De por vida
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Pago automático día 5
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        30% con 50+ clientes
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardHeader>
                  <Badge className="w-fit mb-2 bg-green-600">Bono Alta</Badge>
                  <CardTitle className="text-2xl">€200/Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-4xl font-bold text-green-600">€300</div>
                    <div className="text-sm text-muted-foreground">
                      Pago único + €200 por hipoteca activa
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        €300 base (plan Pro)
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        +€200 si hipoteca activa
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Pago a 30 días
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <Badge className="w-fit mb-2 bg-purple-600">Volumen</Badge>
                  <CardTitle className="text-2xl">Bonos Trimestrales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-4xl font-bold text-purple-600">€5K+</div>
                    <div className="text-sm text-muted-foreground">
                      Bonos por volumen cada 90 días
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        20-49: €5,000
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        50-99: €15,000
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        100+: €50,000
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">¿Por qué tu banco debería ser partner?</h2>
              <p className="text-xl text-muted-foreground">
                Beneficios reales para el banco y sus clientes
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <benefit.icon className={`h-12 w-12 ${benefit.color} mb-4`} />
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">¿Cómo funciona?</h2>
              <p className="text-xl text-muted-foreground">
                6 pasos para empezar a ganar comisiones
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {howItWorks.map((item) => (
                <div key={item.step} className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                        {item.step}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Case Study */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4">Caso Real</Badge>
              <h2 className="text-4xl font-bold mb-4">Banco Regional - Caso de Éxito</h2>
              <p className="text-xl text-muted-foreground">Resultados reales en el primer año</p>
            </div>

            <Card className="border-2 border-blue-300">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{caseStudy.name}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {caseStudy.branches} oficinas - {caseStudy.clientsPerMonth}{' '}
                      cliente/mes/oficina
                    </p>
                  </div>
                  <Target className="h-12 w-12 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {caseStudy.results.year1Clients}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Clientes referidos</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        €{caseStudy.results.monthlyMRR.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">MRR (mes 12)</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">
                        €{caseStudy.results.year1Total.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Total año 1</div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-4">Desglose de ingresos:</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Comisiones recurrentes:</span>
                        <span className="font-bold">
                          €{caseStudy.results.breakdown.recurring.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonos de alta:</span>
                        <span className="font-bold">
                          €{caseStudy.results.breakdown.signupBonus.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonos trimestrales:</span>
                        <span className="font-bold">
                          €{caseStudy.results.breakdown.quarterlyBonus.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              ¿Listo para que tu banco genere ingresos adicionales?
            </h2>
            <p className="text-xl text-white/90">
              Sin coste, sin riesgo, sin complejidad técnica.
              <br />
              Solo valor añadido para tus clientes y comisiones para ti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
                onClick={() => setRegisterDialogOpen(true)}
              >
                Registrar mi Banco
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                onClick={() => router.push('/partners/programa')}
              >
                Ver Programa Completo
              </Button>
            </div>
            <div className="text-white/80 text-sm pt-4">
              ✓ Setup en 24h ✓ Materiales listos ✓ Formación incluida
            </div>
          </div>
        </section>

        {/* Register Dialog */}
        <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Registro de Banco Partner</DialogTitle>
              <DialogDescription>
                Completa el formulario y empieza a ganar en 24 horas
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Banco *</Label>
                  <Input required placeholder="Banco Regional" />
                </div>
                <div className="space-y-2">
                  <Label>Contacto Principal *</Label>
                  <Input required placeholder="Juan García" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input required type="email" placeholder="juan@banco.com" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono *</Label>
                  <Input required type="tel" placeholder="+34 600 000 000" />
                </div>
                <div className="space-y-2">
                  <Label>Número de Oficinas</Label>
                  <Input type="number" placeholder="50" />
                </div>
                <div className="space-y-2">
                  <Label>Hipotecas/mes (aprox)</Label>
                  <Input type="number" placeholder="200" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Aprobación rápida:</strong> Revisaremos tu solicitud y te contactaremos
                    en menos de 24 horas con materiales de marketing listos para usar.
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Enviar solicitud
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Calculator Dialog */}
        <Dialog open={calculatorOpen} onOpenChange={setCalculatorOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Calculadora para Bancos</DialogTitle>
              <DialogDescription>Calcula el potencial de ingresos para tu banco</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <Label className="text-lg">Número de Oficinas: {branches}</Label>
                <Input
                  type="range"
                  min="1"
                  max="200"
                  value={branches}
                  onChange={(e) => setBranches(parseInt(e.target.value))}
                  className="mt-4"
                />
              </div>

              <div>
                <Label className="text-lg">Clientes por Oficina/Mes: {clientsPerBranch}</Label>
                <Input
                  type="range"
                  min="1"
                  max="10"
                  value={clientsPerBranch}
                  onChange={(e) => setClientsPerBranch(parseInt(e.target.value))}
                  className="mt-4"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardHeader>
                    <CardTitle>Clientes Año 1</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-blue-600">{totalClients}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle>MRR (Mes 12)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-green-600">
                      €{Math.round(monthlyMRR).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-lg font-bold pt-4 border-t">
                      <span>TOTAL AÑO 1:</span>
                      <span className="text-green-600">
                        €{Math.round(year1Total).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setCalculatorOpen(false);
                  setRegisterDialogOpen(true);
                }}
              >
                Quiero ganar €{Math.round(year1Total).toLocaleString()}/año
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
