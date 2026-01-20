'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Home,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ClipboardCheck,
  ArrowRight,
  Building,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Stats {
  totalViviendas: number;
  ocupadas: number;
  ocupacion: number;
  solicitudesPendientes: number;
  listaEspera: number;
  cumplimientoNormativo: number;
}

export default function ViviendaSocialDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vivienda-social/stats');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error cargando estadísticas');
      }
      
      setStats(result.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message);
      setStats({
        totalViviendas: 0,
        ocupadas: 0,
        ocupacion: 0,
        solicitudesPendientes: 0,
        listaEspera: 0,
        cumplimientoNormativo: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Vivienda Social</h1>
          <p className="text-muted-foreground">Gestión de vivienda protegida y programas sociales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/vivienda-social/applications">
              <FileText className="h-4 w-4 mr-2" />
              Ver Solicitudes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/vivienda-social/eligibility">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Verificar Elegibilidad
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-sm">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Mostrando datos de ejemplo. {error}
          </p>
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Viviendas</p>
                <p className="text-2xl font-bold">{stats?.totalViviendas || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.ocupadas || 0} ocupadas
                </p>
              </div>
              <Home className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupación</p>
                <p className="text-2xl font-bold">{stats?.ocupacion || 0}%</p>
                <Progress value={stats?.ocupacion || 0} className="mt-2 h-2" />
              </div>
              <Building className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solicitudes</p>
                <p className="text-2xl font-bold">{stats?.solicitudesPendientes || 0}</p>
                <p className="text-xs text-yellow-600">Pendientes de revisión</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cumplimiento</p>
                <p className="text-2xl font-bold">{stats?.cumplimientoNormativo || 0}%</p>
                <p className="text-xs text-green-600">Normativo</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas y acciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pendientes
            </CardTitle>
            <CardDescription>Tareas que requieren atención</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/vivienda-social/applications"
              className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-sm">Solicitudes pendientes</p>
                  <p className="text-xs text-muted-foreground">Requieren revisión</p>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-700">
                {stats?.solicitudesPendientes || 0}
              </Badge>
            </Link>

            <Link
              href="/vivienda-social/applications?estado=lista_espera"
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">Lista de espera</p>
                  <p className="text-xs text-muted-foreground">Solicitantes en cola</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-700">
                {stats?.listaEspera || 0}
              </Badge>
            </Link>

            <Link
              href="/vivienda-social/compliance"
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Cumplimiento normativo</p>
                  <p className="text-xs text-muted-foreground">Verificar requisitos</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700">
                {stats?.cumplimientoNormativo || 0}%
              </Badge>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/vivienda-social/applications">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Solicitudes</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/vivienda-social/eligibility">
                  <ClipboardCheck className="h-6 w-6 mb-2" />
                  <span>Elegibilidad</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/vivienda-social/compliance">
                  <Shield className="h-6 w-6 mb-2" />
                  <span>Cumplimiento</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/vivienda-social/reporting">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <span>Informes</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
