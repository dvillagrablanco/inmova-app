'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  GraduationCap,
  TrendingUp,
  Users,
  Euro,
  CheckCircle2,
  Zap,
  Target,
  Award,
  BookOpen,
  Briefcase,
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

export default function PartnersEscuelasPage() {
  const router = useRouter();
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [students, setStudents] = useState(200);
  const conversionRate = 0.15;
  const clients = Math.round(students * conversionRate);
  const monthlyCommission = clients * 149 * 0.25;
  const yearlyTotal = monthlyCommission * 12 + clients * 200;

  const benefits = [
    {
      icon: GraduationCap,
      title: 'Valor Educativo',
      description: 'Herramienta real para casos prácticos en clases',
      color: 'text-blue-600',
    },
    {
      icon: Briefcase,
      title: 'Empleabilidad Alumni',
      description: 'Prepara a estudiantes con software profesional',
      color: 'text-green-600',
    },
    {
      icon: TrendingUp,
      title: 'Ingresos Pasivos',
      description: '25% comisión mensual recurrente',
      color: 'text-purple-600',
    },
    {
      icon: Target,
      title: 'Lead Generation',
      description: 'Convierte estudiantes/alumni en clientes de pago',
      color: 'text-orange-600',
    },
  ];

  const programs = [
    { name: 'MBA Inmobiliario', potential: '80-100 alumnos/año', commission: '€35K-€45K/año' },
    { name: 'Máster PropTech', potential: '50-70 alumnos/año', commission: '€22K-€31K/año' },
    { name: 'Executive Programs', potential: '100-150 alumnos/año', commission: '€45K-€67K/año' },
  ];

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen">
        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-white text-purple-600">
                Programa de Partners - Escuelas de Negocios
              </Badge>
              <h1 className="text-5xl font-bold mb-6">
                Genera €{(yearlyTotal / 1000).toFixed(0)}K/año con Tus Estudiantes y Alumni
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Ofrece Inmova a programas inmobiliarios. Formación + Ingresos recurrentes
              </p>
              <Button
                size="lg"
                onClick={() => setRegisterDialogOpen(true)}
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Quiero Ser Partner Académico
              </Button>
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">3 Formas de Monetizar</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    Licencias Académicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Acceso gratuito para estudiantes durante el programa
                  </p>
                  <Badge variant="outline">100% Gratis para la Escuela</Badge>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-center">
                    <Euro className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    Comisiones Alumni
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold text-blue-600 mb-2">25%/mes</p>
                  <p className="text-sm text-muted-foreground">
                    Cuando alumni contratan tras graduarse
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    Bonos Conversión
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold text-green-600 mb-2">€200</p>
                  <p className="text-sm text-muted-foreground">
                    Por cada estudiante que se convierta en cliente
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Programs */}
        <div className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Potencial por Tipo de Programa</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {programs.map((prog, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{prog.name}</h3>
                        <p className="text-sm text-muted-foreground">{prog.potential}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{prog.commission}</p>
                        <p className="text-xs text-muted-foreground">Ingresos potenciales</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="py-16 bg-purple-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Beneficios para Tu Escuela</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {benefits.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-gray-50 ${benefit.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold mb-2">{benefit.title}</h3>
                          <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Calculator */}
        <div className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Calculadora de Ingresos</h2>
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <Label>Nº de Estudiantes/Año en Programas Inmobiliarios</Label>
                    <input
                      type="range"
                      min="20"
                      max="500"
                      value={students}
                      onChange={(e) => setStudents(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-center text-2xl font-bold mt-2">{students} estudiantes</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground text-center mb-2">
                      Tasa de Conversión Estimada: 15%
                    </p>
                    <p className="text-center text-xl font-bold">≈ {clients} clientes de pago</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Ingresos Mensuales</p>
                      <p className="text-3xl font-bold text-green-600">
                        €{monthlyCommission.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Año 1</p>
                      <p className="text-3xl font-bold text-purple-600">
                        €{yearlyTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button className="w-full" size="lg" onClick={() => setRegisterDialogOpen(true)}>
                    Quiero Ser Partner Académico
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Case Study */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <Badge className="mb-4 mx-auto block w-fit">Caso Real</Badge>
            <h2 className="text-3xl font-bold text-center mb-8">
              IE Business School - Resultados Año 1
            </h2>
            <Card className="border-2 border-purple-200">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-4xl font-bold text-purple-600 mb-2">350</p>
                    <p className="text-sm text-muted-foreground">Estudiantes formados</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-green-600 mb-2">52</p>
                    <p className="text-sm text-muted-foreground">Alumni convertidos (15%)</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-blue-600 mb-2">€29K</p>
                    <p className="text-sm text-muted-foreground">Ingresos generados año 1</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="py-20 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">¿Listo para Monetizar Tu Programa?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Únete a escuelas líderes que ya generan ingresos con Inmova
            </p>
            <Button
              size="lg"
              onClick={() => setRegisterDialogOpen(true)}
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              Solicitar Asociación Ahora
            </Button>
          </div>
        </div>

        {/* Dialog */}
        <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registro Escuela Partner</DialogTitle>
              <DialogDescription>Completa tus datos y te contactaremos en 24h</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success('Solicitud enviada correctamente');
                setRegisterDialogOpen(false);
              }}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la Escuela *</Label>
                  <Input placeholder="IE Business School, ESADE..." required />
                </div>
                <div className="space-y-2">
                  <Label>Persona de Contacto *</Label>
                  <Input placeholder="Director del Programa" required />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="contacto@escuela.com" required />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono *</Label>
                  <Input type="tel" placeholder="+34 600 000 000" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Programas Inmobiliarios (describe brevemente)</Label>
                  <Input placeholder="MBA Inmobiliario, Máster PropTech..." />
                </div>
                <div className="space-y-2">
                  <Label>Nº de Estudiantes/Año (aprox)</Label>
                  <Input type="number" placeholder="200" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRegisterDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Enviar Solicitud</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
