'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

interface Permit {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  deadline: string;
  issuer: string;
  cost: number;
  required: boolean;
}

interface ConstructionPhase {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  budget: number;
  spent: number;
  milestones: string[];
}

export default function ConstructionGanttPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [phases, setPhases] = useState<ConstructionPhase[]>([]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data - TODO: Cargar desde API
      setPermits([
        {
          id: 'p1',
          name: 'Licencia de Obra Mayor',
          type: 'Construcción',
          status: 'approved',
          deadline: '2025-02-15',
          issuer: 'Ayuntamiento',
          cost: 8500,
          required: true,
        },
        {
          id: 'p2',
          name: 'Proyecto Técnico Visado',
          type: 'Técnico',
          status: 'approved',
          deadline: '2025-01-30',
          issuer: 'Colegio de Arquitectos',
          cost: 3200,
          required: true,
        },
        {
          id: 'p3',
          name: 'Estudio Geotécnico',
          type: 'Técnico',
          status: 'submitted',
          deadline: '2025-02-10',
          issuer: 'Laboratorio Acreditado',
          cost: 2500,
          required: true,
        },
        {
          id: 'p4',
          name: 'Certificado Eficiencia Energética',
          type: 'Sostenibilidad',
          status: 'pending',
          deadline: '2025-06-30',
          issuer: 'Técnico Certificador',
          cost: 800,
          required: true,
        },
        {
          id: 'p5',
          name: 'Certificación BREEAM',
          type: 'Sostenibilidad',
          status: 'pending',
          deadline: '2025-08-15',
          issuer: 'BRE Global',
          cost: 15000,
          required: false,
        },
      ]);

      setPhases([
        {
          id: 'ph1',
          name: 'Cimentación',
          description: 'Excavación, saneamiento y cimentación',
          startDate: '2025-03-01',
          endDate: '2025-04-15',
          duration: 45,
          progress: 0,
          status: 'not_started',
          budget: 125000,
          spent: 0,
          milestones: ['Excavación completada', 'Cimentación hormigonada', 'Muros contención'],
        },
        {
          id: 'ph2',
          name: 'Estructura',
          description: 'Pilares, forjados y cubierta',
          startDate: '2025-04-16',
          endDate: '2025-07-15',
          duration: 90,
          progress: 0,
          status: 'not_started',
          budget: 280000,
          spent: 0,
          milestones: ['Planta baja', 'Planta primera', 'Planta segunda', 'Cubierta'],
        },
        {
          id: 'ph3',
          name: 'Cerramientos',
          description: 'Fachadas, carpintería exterior',
          startDate: '2025-07-16',
          endDate: '2025-09-30',
          duration: 76,
          progress: 0,
          status: 'not_started',
          budget: 180000,
          spent: 0,
          milestones: ['Fachada principal', 'Fachada posterior', 'Carpintería'],
        },
        {
          id: 'ph4',
          name: 'Instalaciones',
          description: 'Electricidad, fontanería, climatización',
          startDate: '2025-08-01',
          endDate: '2025-11-15',
          duration: 106,
          progress: 0,
          status: 'not_started',
          budget: 220000,
          spent: 0,
          milestones: ['Electricidad', 'Fontanería', 'Climatización', 'Telecomunicaciones'],
        },
        {
          id: 'ph5',
          name: 'Acabados',
          description: 'Alicatados, pavimentos, pintura',
          startDate: '2025-10-01',
          endDate: '2025-12-31',
          duration: 91,
          progress: 0,
          status: 'not_started',
          budget: 150000,
          spent: 0,
          milestones: ['Alicatados', 'Pavimentos', 'Pintura', 'Carpintería interior'],
        },
        {
          id: 'ph6',
          name: 'Urbanización',
          description: 'Exteriores, jardines, accesos',
          startDate: '2025-12-01',
          endDate: '2026-01-31',
          duration: 61,
          progress: 0,
          status: 'not_started',
          budget: 85000,
          spent: 0,
          milestones: ['Pavimentación', 'Jardines', 'Iluminación exterior'],
        },
      ]);
      
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getPermitStatusBadge = (status: string) => {
    const config = {
      pending: { color: 'bg-gray-500', label: 'Pendiente', icon: Clock },
      submitted: { color: 'bg-blue-500', label: 'Tramitando', icon: FileCheck },
      approved: { color: 'bg-green-500', label: 'Aprobado', icon: CheckCircle },
      rejected: { color: 'bg-red-500', label: 'Rechazado', icon: AlertTriangle },
    };
    const { color, label, icon: Icon } = config[status as keyof typeof config] || config.pending;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getPhaseStatusBadge = (status: string) => {
    const config = {
      not_started: { color: 'bg-gray-500', label: 'Pendiente' },
      in_progress: { color: 'bg-blue-500', label: 'En Curso' },
      completed: { color: 'bg-green-500', label: 'Completado' },
      delayed: { color: 'bg-red-500', label: 'Retrasado' },
    };
    const { color, label } = config[status as keyof typeof config] || config.not_started;
    return <Badge className={color}>{label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const totalBudget = phases.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = phases.reduce((sum, p) => sum + p.spent, 0);
  const overallProgress = phases.length > 0
    ? Math.round(phases.reduce((sum, p) => sum + p.progress, 0) / phases.length)
    : 0;

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando proyecto...</p>
            </div>
          </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Gestión de Obra y Permisos</h1>
                <p className="text-muted-foreground mt-2">
                  Edificio Residencial - 24 viviendas - C/ Príncipe 123
                </p>
              </div>
              <Button onClick={() => router.push('/construction')}>
                Volver a Proyectos
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Progreso General</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{overallProgress}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(totalSpent)} ejecutado ({Math.round((totalSpent / totalBudget) * 100)}%)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Permisos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {permits.filter((p) => p.status === 'approved').length} / {permits.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Aprobados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Fases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {phases.filter((p) => p.status === 'completed').length} / {phases.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Completadas</p>
                </CardContent>
              </Card>
            </div>

            {/* Permits Checklist */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Checklist de Permisos y Licencias
                  </CardTitle>
                  <Badge variant="outline">
                    {permits.filter((p) => p.status === 'approved').length} de {permits.filter((p) => p.required).length} obligatorios
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {permits.map((permit) => (
                    <div
                      key={permit.id}
                      className={`flex items-start gap-4 p-4 border rounded-lg ${
                        permit.status === 'rejected' ? 'border-red-300 bg-red-50' :
                        permit.status === 'approved' ? 'border-green-300 bg-green-50' :
                        'border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{permit.name}</h4>
                          {permit.required && (
                            <Badge variant="destructive" className="text-xs">
                              Obligatorio
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Tipo:</span> {permit.type}
                          </div>
                          <div>
                            <span className="font-medium">Emisor:</span> {permit.issuer}
                          </div>
                          <div>
                            <span className="font-medium">Plazo:</span> {formatDate(permit.deadline)}
                          </div>
                          <div>
                            <span className="font-medium">Coste:</span> {formatCurrency(permit.cost)}
                          </div>
                        </div>
                      </div>
                      {getPermitStatusBadge(permit.status)}
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-2">
                    <FileCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900">Documentación Pendiente</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Recuerda solicitar el Certificado de Eficiencia Energética antes del plazo límite
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Construction Phases */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Fases de Construcción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phases.map((phase) => (
                    <div key={phase.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-lg">{phase.name}</h4>
                            {getPhaseStatusBadge(phase.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{phase.progress}%</p>
                          <p className="text-xs text-muted-foreground">{phase.duration} días</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Periodo</p>
                          <p className="text-sm font-medium">
                            {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Presupuesto</p>
                          <p className="text-sm font-medium">{formatCurrency(phase.budget)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ejecutado</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(phase.spent)} ({Math.round((phase.spent / phase.budget) * 100)}%)
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-medium">{phase.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${phase.progress}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Hitos:</p>
                        <div className="flex flex-wrap gap-2">
                          {phase.milestones.map((milestone, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {milestone}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </AuthenticatedLayout>
  );
}
