'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowLeft,
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Users,
  Percent,
} from 'lucide-react';

// Estructura de comisiones (configuración por defecto)
const estructuraComisiones = [
  { tipo: 'Venta Residencial', porcentaje: 3, split: '70/30', descripcion: 'Comisión estándar venta pisos y casas' },
  { tipo: 'Venta Lujo', porcentaje: 2.5, split: '75/25', descripcion: 'Propiedades > €500.000' },
  { tipo: 'Alquiler Anual', porcentaje: 100, split: '60/40', descripcion: '1 mes de renta' },
  { tipo: 'Alquiler Temporal', porcentaje: 15, split: '65/35', descripcion: '15% del total contrato' },
  { tipo: 'Gestión Patrimonial', porcentaje: 5, split: '50/50', descripcion: '5% mensual sobre rentas' },
];

// Arrays vacíos - se llenarán con datos reales de la BD
const comisionesPendientes: Array<{ id: number; agente: string; operacion: string; valor: number; comision: number; fecha: string; estado: string }> = [];

const historialPagos: Array<{ id: number; agente: string; monto: number; fecha: string; concepto: string; estado: string }> = [];

export default function RedAgentesComisionesPage() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState('mes');

  const totalPendiente = comisionesPendientes.filter(c => c.estado !== 'pagada').reduce((sum, c) => sum + c.comision, 0);
  const totalPagado = historialPagos.reduce((sum, p) => sum + p.monto, 0);

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/red-agentes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Sistema de Comisiones</h1>
              <p className="text-muted-foreground">
                Gestión de comisiones y pagos a agentes
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button>
              <DollarSign className="h-4 w-4 mr-2" />
              Procesar Pagos
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">€{totalPendiente.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Pendiente de pago</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">€{totalPagado.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Pagado este mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{comisionesPendientes.length}</p>
                  <p className="text-xs text-muted-foreground">Operaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Percent className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">2.8%</p>
                  <p className="text-xs text-muted-foreground">Comisión media</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pendientes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
            <TabsTrigger value="historial">Historial de Pagos</TabsTrigger>
            <TabsTrigger value="estructura">Estructura de Comisiones</TabsTrigger>
          </TabsList>

          <TabsContent value="pendientes">
            <Card>
              <CardHeader>
                <CardTitle>Comisiones Pendientes</CardTitle>
                <CardDescription>Operaciones pendientes de liquidación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Agente</th>
                        <th className="text-left py-3 px-4 font-medium">Operación</th>
                        <th className="text-right py-3 px-4 font-medium">Valor</th>
                        <th className="text-right py-3 px-4 font-medium">Comisión</th>
                        <th className="text-center py-3 px-4 font-medium">Fecha</th>
                        <th className="text-center py-3 px-4 font-medium">Estado</th>
                        <th className="text-center py-3 px-4 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comisionesPendientes.map((comision) => (
                        <tr key={comision.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{comision.agente}</td>
                          <td className="py-3 px-4">{comision.operacion}</td>
                          <td className="py-3 px-4 text-right">€{comision.valor.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">€{comision.comision.toLocaleString()}</td>
                          <td className="py-3 px-4 text-center">{comision.fecha}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={
                              comision.estado === 'pagada' ? 'default' :
                              comision.estado === 'aprobada' ? 'secondary' : 'outline'
                            }>
                              {comision.estado === 'pagada' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {comision.estado === 'aprobada' && <Clock className="h-3 w-3 mr-1" />}
                              {comision.estado === 'pendiente' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {comision.estado}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {comision.estado === 'pendiente' && (
                              <Button size="sm" variant="outline">Aprobar</Button>
                            )}
                            {comision.estado === 'aprobada' && (
                              <Button size="sm">Pagar</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>Pagos realizados a agentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Agente</th>
                        <th className="text-left py-3 px-4 font-medium">Concepto</th>
                        <th className="text-right py-3 px-4 font-medium">Monto</th>
                        <th className="text-center py-3 px-4 font-medium">Fecha</th>
                        <th className="text-center py-3 px-4 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialPagos.map((pago) => (
                        <tr key={pago.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{pago.agente}</td>
                          <td className="py-3 px-4">{pago.concepto}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">€{pago.monto.toLocaleString()}</td>
                          <td className="py-3 px-4 text-center">{pago.fecha}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="default">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {pago.estado}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estructura">
            <Card>
              <CardHeader>
                <CardTitle>Estructura de Comisiones</CardTitle>
                <CardDescription>Porcentajes y splits por tipo de operación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {estructuraComisiones.map((estructura, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/50 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold">{estructura.tipo}</h4>
                        <p className="text-sm text-muted-foreground">{estructura.descripcion}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{estructura.porcentaje}%</p>
                          <p className="text-xs text-muted-foreground">Comisión</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">{estructura.split}</p>
                          <p className="text-xs text-muted-foreground">Agente/Empresa</p>
                        </div>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
