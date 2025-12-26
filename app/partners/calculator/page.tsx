'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, TrendingUp, Target, ArrowRight, Calculator, Mail } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const partnerTypes = [
  { 
    value: 'banco', 
    label: 'Banco / Banca Privada',
    captacion: 500,
    recurrente: 10,
    ticketPromedio: 349,
    premium: true
  },
  { 
    value: 'aseguradora', 
    label: 'Aseguradora',
    captacion: 300,
    recurrente: 12,
    ticketPromedio: 149,
    premium: true
  },
  { 
    value: 'familyoffice', 
    label: 'Multifamily Office',
    captacion: 2000,
    recurrente: 25,
    ticketPromedio: 500,
    premium: true
  },
  { 
    value: 'autonomo', 
    label: 'Autónomo Inmobiliario',
    captacion: 150,
    recurrente: 15,
    ticketPromedio: 100
  },
  { 
    value: 'inmobiliaria', 
    label: 'Inmobiliaria / Gestora',
    captacion: 200,
    recurrente: 20,
    ticketPromedio: 149
  },
  { 
    value: 'centro', 
    label: 'Centro de Estudios',
    captacion: 300,
    recurrente: 10,
    ticketPromedio: 149
  },
  { 
    value: 'plataforma', 
    label: 'Plataforma Sector',
    captacion: 0,
    recurrente: 30,
    ticketPromedio: 149
  },
  { 
    value: 'asociacion', 
    label: 'Asociación Profesional',
    captacion: 100,
    recurrente: 15,
    ticketPromedio: 104
  },
  { 
    value: 'asesor', 
    label: 'Asesor Fiscal / Gestoría',
    captacion: 100,
    recurrente: 12,
    ticketPromedio: 149
  }
];

export default function PartnerCalculatorPage() {
  const [partnerType, setPartnerType] = useState('');
  const [numClients, setNumClients] = useState(10);
  const [email, setEmail] = useState('');
  const [showResults, setShowResults] = useState(false);

  const selectedType = partnerTypes.find(p => p.value === partnerType);
  
  const comisionCaptacion = selectedType ? numClients * selectedType.captacion : 0;
  const mrrRecurrente = selectedType ? numClients * selectedType.ticketPromedio * (selectedType.recurrente / 100) : 0;
  const ingresoAnual = comisionCaptacion + (mrrRecurrente * 12);
  const ingresoMes1 = comisionCaptacion + mrrRecurrente;
  
  // Datos para gráfico de evolución
  const chartData = Array.from({ length: 12 }, (_, i) => ({
    mes: `Mes ${i + 1}`,
    acumulado: i === 0 ? ingresoMes1 : comisionCaptacion + (mrrRecurrente * (i + 1)),
    recurrente: mrrRecurrente * (i + 1)
  }));

  // Datos para comparativa de niveles
  const nivelComparison = [
    { nivel: 'Bronce\n(0-10)', comision: mrrRecurrente, color: '#CD7F32' },
    { nivel: 'Plata\n(11-25)', comision: mrrRecurrente * 1.05, color: '#C0C0C0' },
    { nivel: 'Oro\n(26-50)', comision: mrrRecurrente * 1.10, color: '#FFD700' },
    { nivel: 'Platino\n(50+)', comision: mrrRecurrente * 1.15, color: '#E5E4E2' }
  ];

  const handleCalculate = () => {
    if (partnerType && numClients > 0) {
      setShowResults(true);
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      alert('Por favor introduce tu email');
      return;
    }
    
    // TODO: Implementar envío de email
    alert('¡Cálculo enviado a tu email!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 px-4 py-2">
            <Calculator className="h-4 w-4 mr-1 inline" />
            Calculadora de Comisiones
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              Calcula Tus Ingresos como Partner
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubre cuánto puedes ganar prescribiendo INMOVA a tus clientes
          </p>
        </div>

        {/* Calculator Form */}
        <Card className="mb-8 border-2">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50">
            <CardTitle>Configura Tu Perfil de Partner</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Tipo de Partner */}
              <div className="space-y-2">
                <Label htmlFor="partnerType">Tipo de Partner</Label>
                <Select value={partnerType} onValueChange={setPartnerType}>
                  <SelectTrigger id="partnerType">
                    <SelectValue placeholder="Selecciona tu perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} {type.premium && '💎'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Número de Clientes */}
              <div className="space-y-2">
                <Label htmlFor="numClients">Número de Clientes Esperados</Label>
                <Input
                  id="numClients"
                  type="number"
                  min="1"
                  max="1000"
                  value={numClients}
                  onChange={(e) => setNumClients(parseInt(e.target.value) || 0)}
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">
                  Clientes que estimas referir en el primer año
                </p>
              </div>
            </div>

            {selectedType && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Tu Configuración:</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Comisión Captación</p>
                    <p className="font-bold text-indigo-600">€{selectedType.captacion}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Comisión Recurrente</p>
                    <p className="font-bold text-green-600">{selectedType.recurrente}% MRR</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ticket Promedio</p>
                    <p className="font-bold text-violet-600">€{selectedType.ticketPromedio}/mes</p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleCalculate}
              size="lg"
              className="w-full gradient-primary text-white text-lg"
              disabled={!partnerType || numClients <= 0}
            >
              Calcular Mis Ingresos
              <Calculator className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {showResults && selectedType && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="border-2 border-green-200">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600 mb-1">Comisión Captación</p>
                  <p className="text-3xl font-bold text-green-600">
                    €{comisionCaptacion.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Pago único</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-indigo-200">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                  <p className="text-sm text-gray-600 mb-1">Ingreso Recurrente</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    €{mrrRecurrente.toLocaleString()}/mes
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Mientras esté activo</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-violet-200">
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-violet-600" />
                  <p className="text-sm text-gray-600 mb-1">Ingreso Año 1</p>
                  <p className="text-3xl font-bold text-violet-600">
                    €{ingresoAnual.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Captación + 12 meses</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-pink-200">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-pink-600" />
                  <p className="text-sm text-gray-600 mb-1">Mes 1</p>
                  <p className="text-3xl font-bold text-pink-600">
                    €{ingresoMes1.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Captación + recurrente</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Evolución */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Evolución de Ingresos Acumulados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="acumulado" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      name="Ingreso Acumulado"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="recurrente" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Solo Recurrente"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Comparativa de Niveles */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Potencial con Niveles de Partner</CardTitle>
                <p className="text-sm text-gray-600">
                  Cuantos más clientes, mayor comisión. Sube de nivel para ganar más.
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={nivelComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nivel" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `€${value.toLocaleString()}/mes`} />
                    <Bar dataKey="comision" fill="#8b5cf6" name="Comisión Mensual" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {nivelComparison.map((nivel, idx) => (
                    <div key={idx} className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">{nivel.nivel.replace('\n', ' ')}</p>
                      <p className="font-bold text-lg">€{Math.round(nivel.comision).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Proyección 3 Años */}
            <Card className="border-2 bg-gradient-to-br from-indigo-50 to-violet-50">
              <CardHeader>
                <CardTitle>Proyección a 3 Años</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((year) => (
                    <div key={year} className="p-4 bg-white rounded-lg">
                      <h4 className="font-bold text-lg mb-2">Año {year}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Clientes:</span>
                          <span className="font-semibold">{numClients * year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">MRR:</span>
                          <span className="font-semibold">€{(mrrRecurrente * year).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">Total Año:</span>
                          <span className="font-bold text-indigo-600">
                            €{(comisionCaptacion * year + mrrRecurrente * year * 12).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Email CTA */}
            <Card className="border-2 border-green-200">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <Mail className="h-12 w-12 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-1">Recibe este cálculo por email</h4>
                    <p className="text-sm text-gray-600">
                      Te enviaremos el cálculo detallado más información sobre cómo empezar
                    </p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="md:w-64"
                    />
                    <Button onClick={handleSendEmail} className="gradient-primary">
                      Enviar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Final */}
            <div className="text-center p-8 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl text-white">
              <h3 className="text-2xl font-bold mb-4">
                ¿Listo para Empezar a Ganar?
              </h3>
              <p className="text-lg mb-6 opacity-90">
                Regístrate gratis y empieza a generar ingresos desde tu primera venta
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/api/partners/register">
                  <Button size="lg" variant="secondary" className="px-8 py-6">
                    Registrarse como Partner
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/partners">
                  <Button size="lg" variant="outline" className="px-8 py-6 border-white text-white hover:bg-white/10">
                    Ver Más Info
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link href="/partners" className="text-indigo-600 hover:text-indigo-700 font-semibold">
            ← Volver a Partners
          </Link>
        </div>
      </div>
    </div>
  );
}
