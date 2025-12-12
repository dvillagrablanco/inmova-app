'use client';
export const dynamic = 'force-dynamic';


import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {

  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  Users,
} from 'lucide-react';

export default function LegalCompliancePage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState([
    {
      id: '1',
      property: 'Apartamento Malasaña',
      licenseNumber: 'VT-12345-A',
      expiryDate: '2025-06-15',
      status: 'vigente',
      daysUntilExpiry: 192,
    },
    {
      id: '2',
      property: 'Loft Retiro',
      licenseNumber: 'VT-67890-B',
      expiryDate: '2025-01-10',
      status: 'proximo_vencimiento',
      daysUntilExpiry: 35,
    },
    {
      id: '3',
      property: 'Piso Salamanca',
      licenseNumber: 'Pendiente',
      expiryDate: null,
      status: 'sin_licencia',
      daysUntilExpiry: null,
    },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'vigente':
        return <Badge variant="default">Vigente</Badge>;
      case 'proximo_vencimiento':
        return <Badge variant="destructive">Próximo a Vencer</Badge>;
      case 'sin_licencia':
        return <Badge variant="secondary">Sin Licencia</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold">Cumplimiento Legal</h1>
                  <p className="text-muted-foreground">
                    Gestión de licencias y regulación turística
                  </p>
                </div>
                <Button onClick={() => router.push('/str-advanced')}>Volver al Dashboard</Button>
              </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cumplimiento Global</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">92%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Con Licencia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">11/12</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Próximas a Vencer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">1</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Partes Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">2</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="licenses" className="space-y-6">
              <TabsList>
                <TabsTrigger value="licenses">Licencias</TabsTrigger>
                <TabsTrigger value="registrations">Partes de Entrada</TabsTrigger>
                <TabsTrigger value="taxes">Tasas Turísticas</TabsTrigger>
                <TabsTrigger value="documents">Documentación</TabsTrigger>
              </TabsList>

              <TabsContent value="licenses" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Licencias Turísticas</CardTitle>
                        <CardDescription>Estado de licencias por propiedad</CardDescription>
                      </div>
                      <Button>
                        <FileText className="h-4 w-4 mr-2" />
                        Nueva Licencia
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {licenses.map((license) => (
                        <Card key={license.id} className="border-2">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                  <Shield className="h-5 w-5 text-muted-foreground" />
                                  <h3 className="font-semibold">{license.property}</h3>
                                  {getStatusBadge(license.status)}
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground block">Nº Licencia</span>
                                    <span className="font-medium">{license.licenseNumber}</span>
                                  </div>
                                  {license.expiryDate && (
                                    <>
                                      <div>
                                        <span className="text-muted-foreground block">
                                          Fecha Caducidad
                                        </span>
                                        <span className="font-medium">{license.expiryDate}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground block">
                                          Días Restantes
                                        </span>
                                        <span
                                          className={`font-medium ${
                                            (license.daysUntilExpiry ?? 0) < 30
                                              ? 'text-destructive'
                                              : ''
                                          }`}
                                        >
                                          {license.daysUntilExpiry} días
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                {license.status === 'proximo_vencimiento' && (
                                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                    <span className="text-sm text-destructive">
                                      ¡Atención! Esta licencia vence pronto. Gestiona la renovación.
                                    </span>
                                  </div>
                                )}
                                {license.status === 'sin_licencia' && (
                                  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm text-yellow-700">
                                      Propiedad sin licencia. Tramita la solicitud.
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button variant="outline" size="sm">
                                  Ver Documentación
                                </Button>
                                {license.status === 'proximo_vencimiento' && (
                                  <Button size="sm" variant="destructive">
                                    Renovar
                                  </Button>
                                )}
                                {license.status === 'sin_licencia' && (
                                  <Button size="sm">Tramitar</Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="registrations">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Partes de Entrada</CardTitle>
                        <CardDescription>Registro de viajeros ante las autoridades</CardDescription>
                      </div>
                      <Button>
                        <Users className="h-4 w-4 mr-2" />
                        Generar Parte
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground p-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Gestión de partes de entrada de viajeros</p>
                      <p className="text-sm mt-2">
                        Genera y envía automáticamente los partes ante las autoridades
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="taxes">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Tasas Turísticas</CardTitle>
                        <CardDescription>Cálculo y gestión de impuestos turísticos</CardDescription>
                      </div>
                      <Button>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Calcular Tasa
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Card className="border-2">
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <span className="text-muted-foreground text-sm block">Ciudad</span>
                              <span className="font-medium">Madrid</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-sm block">
                                Tasa por Noche
                              </span>
                              <span className="font-medium">€3.50</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-sm block">Este Mes</span>
                              <span className="font-medium">€1,245</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-sm block">Total Año</span>
                              <span className="font-medium">€14,890</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle>Documentación Legal</CardTitle>
                    <CardDescription>Archivo de documentación y certificados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground p-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Repositorio de documentación legal</p>
                      <p className="text-sm mt-2">
                        Almacena y gestiona toda la documentación necesaria
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
