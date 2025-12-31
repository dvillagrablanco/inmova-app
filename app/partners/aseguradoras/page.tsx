'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Shield,
  TrendingUp,
  Users,
  Euro,
  CheckCircle2,
  Zap,
  Target,
  Award,
  FileText,
  Calculator,
  ArrowRight,
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

export default function PartnersAseguradorasPage() {
  const router = useRouter();
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [clients, setClients] = useState(100);
  const monthlyCommission = clients * 149 * 0.25;
  const yearlyTotal = monthlyCommission * 12 + clients * 200;

  const benefits = [
    {
      icon: Users,
      title: 'Base de Clientes Potencial',
      description: 'Acceso a propietarios que ya aseguran con ustedes',
      color: 'text-blue-600',
    },
    {
      icon: Shield,
      title: 'Complemento Perfecto',
      description: 'Gestión digital para propiedades aseguradas',
      color: 'text-green-600',
    },
    {
      icon: TrendingUp,
      title: 'Retención Mejorada',
      description: 'Clientes digitalizados son más fieles',
      color: 'text-purple-600',
    },
    {
      icon: Euro,
      title: 'Ingresos Recurrentes',
      description: '25% comisión mensual de por vida',
      color: 'text-emerald-600',
    },
  ];

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-white text-blue-600">
                Programa de Partners - Aseguradoras
              </Badge>
              <h1 className="text-5xl font-bold mb-6">
                Genera hasta €{(yearlyTotal / 1000).toFixed(0)}K/año con Tus Clientes Existentes
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Ofrece Inmova a propietarios asegurados. Comisiones del 25% mensuales + bonos por
                firma
              </p>
              <Button
                size="lg"
                onClick={() => setRegisterDialogOpen(true)}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Quiero Ser Partner
              </Button>
            </div>
          </div>
        </div>

        {/* Remuneration */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Modelo de Remuneración</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-center">
                    <Euro className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    25% Recurrente
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold text-blue-600 mb-2">€37.25/mes</p>
                  <p className="text-sm text-muted-foreground">Por cliente (plan Pro €149)</p>
                  <p className="text-xs mt-4 text-muted-foreground">
                    De por vida mientras cliente activo
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    Bono Alta
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold text-green-600 mb-2">€200</p>
                  <p className="text-sm text-muted-foreground">Por cada nuevo cliente</p>
                  <p className="text-xs mt-4 text-muted-foreground">Pago único al contratar</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    Bonos Volumen
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold text-purple-600 mb-2">Hasta 30%</p>
                  <p className="text-sm text-muted-foreground">Con 50+ clientes activos</p>
                  <p className="text-xs mt-4 text-muted-foreground">Comisión trimestral extra</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              ¿Por Qué Tu Aseguradora Debe Ser Partner?
            </h2>
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
        <div className="py-16 bg-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Calculadora de Ingresos</h2>
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <Label>Nº de Clientes Potenciales</Label>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      value={clients}
                      onChange={(e) => setClients(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-center text-2xl font-bold mt-2">{clients} clientes</p>
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
                      <p className="text-3xl font-bold text-blue-600">
                        €{yearlyTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button className="w-full" size="lg" onClick={() => setRegisterDialogOpen(true)}>
                    Calcular Mi Potencial
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">¿Listo para Generar Ingresos Adicionales?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Únete a nuestro programa de partners y empieza a monetizar tu base de clientes
              existente
            </p>
            <Button
              size="lg"
              onClick={() => setRegisterDialogOpen(true)}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Solicitar Asociación Ahora
            </Button>
          </div>
        </div>

        {/* Dialog */}
        <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registro de Aseguradora Partner</DialogTitle>
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
                  <Label>Nombre de la Aseguradora *</Label>
                  <Input placeholder="Mapfre, Allianz..." required />
                </div>
                <div className="space-y-2">
                  <Label>Persona de Contacto *</Label>
                  <Input placeholder="Juan García" required />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="contacto@aseguradora.com" required />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono *</Label>
                  <Input type="tel" placeholder="+34 600 000 000" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Nº de Clientes Propietarios (aprox)</Label>
                  <Input type="number" placeholder="1000" />
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
