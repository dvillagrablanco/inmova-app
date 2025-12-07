'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Euro,
  TrendingUp,
  Users,
  Vote,
  AlertTriangle,
  Calendar,
  BarChart3,
  Shield,
  RefreshCw,
} from 'lucide-react';

export default function ComunidadesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    // TODO: Cargar estadísticas desde la API cuando se seleccione un edificio
    setLoading(false);
  }, []);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  const modulos = [
    {
      id: 'actas',
      titulo: 'Libro de Actas Digital',
      descripcion: 'Gestión de actas de junta y reuniones',
      icono: FileText,
      ruta: '/comunidades/actas',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'cuotas',
      titulo: 'Cuotas de Comunidad',
      descripcion: 'Cálculo, registro y seguimiento de cuotas',
      icono: Euro,
      ruta: '/comunidades/cuotas',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'fondos',
      titulo: 'Fondos y Derramas',
      descripcion: 'Gestión de fondos de reserva',
      icono: TrendingUp,
      ruta: '/comunidades/fondos',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'votaciones',
      titulo: 'Votaciones Telemáticas',
      descripcion: 'Sistema de votación online',
      icono: Vote,
      ruta: '/comunidades/votaciones',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'finanzas',
      titulo: 'Finanzas Avanzadas',
      descripcion: 'Cash flow, fianzas e impagos',
      icono: BarChart3,
      ruta: '/comunidades/finanzas',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      id: 'cumplimiento',
      titulo: 'Cumplimiento Legal',
      descripcion: 'CEE, ITE, cédulas y modelos fiscales',
      icono: Shield,
      ruta: '/comunidades/cumplimiento',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      id: 'renovaciones',
      titulo: 'Renovaciones Inteligentes',
      descripcion: 'Análisis IPC y predicciones',
      icono: RefreshCw,
      ruta: '/comunidades/renovaciones',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      id: 'presidente',
      titulo: 'Portal del Presidente',
      descripcion: 'Panel de control ejecutivo',
      icono: Users,
      ruta: '/comunidades/presidente',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Gestión de Comunidades</h1>
                <p className="text-muted-foreground mt-1">
                  Sistema completo de administración de comunidades de propietarios
                </p>
              </div>
            </div>

            {/* Módulos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {modulos.map((modulo) => {
                const Icon = modulo.icono;
                return (
                  <Card
                    key={modulo.id}
                    className="cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => router.push(modulo.ruta)}
                  >
                    <CardHeader>
                      <div
                        className={`w-12 h-12 rounded-lg ${modulo.bgColor} flex items-center justify-center mb-2`}
                      >
                        <Icon className={`w-6 h-6 ${modulo.color}`} />
                      </div>
                      <CardTitle className="text-lg">{modulo.titulo}</CardTitle>
                      <CardDescription className="text-sm">{modulo.descripcion}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {/* Resumen y Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen General</CardTitle>
                <CardDescription>Visión global de la gestión de comunidades</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
                    <TabsTrigger value="legal">Legal</TabsTrigger>
                    <TabsTrigger value="renovaciones">Renovaciones</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Cuotas Pendientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">-</div>
                          <p className="text-xs text-muted-foreground">Selecciona un edificio</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Votaciones Activas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">-</div>
                          <p className="text-xs text-muted-foreground">Selecciona un edificio</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Actas Pendientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">-</div>
                          <p className="text-xs text-muted-foreground">Selecciona un edificio</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="finanzas" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Dashboard de finanzas avanzadas disponible en el módulo correspondiente.
                    </p>
                    <Button onClick={() => router.push('/comunidades/finanzas')}>
                      Ir a Finanzas Avanzadas
                    </Button>
                  </TabsContent>

                  <TabsContent value="legal" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Dashboard de cumplimiento legal disponible en el módulo correspondiente.
                    </p>
                    <Button onClick={() => router.push('/comunidades/cumplimiento')}>
                      Ir a Cumplimiento Legal
                    </Button>
                  </TabsContent>

                  <TabsContent value="renovaciones" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Dashboard de renovaciones inteligentes disponible en el módulo
                      correspondiente.
                    </p>
                    <Button onClick={() => router.push('/comunidades/renovaciones')}>
                      Ir a Renovaciones Inteligentes
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Acceso Rápido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push('/comunidades/actas')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Nueva Acta
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push('/comunidades/cuotas')}
                  >
                    <Euro className="w-4 h-4 mr-2" />
                    Generar Cuotas
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push('/comunidades/votaciones')}
                  >
                    <Vote className="w-4 h-4 mr-2" />
                    Nueva Votación
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
