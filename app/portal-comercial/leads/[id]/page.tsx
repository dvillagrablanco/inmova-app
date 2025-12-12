'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  DollarSign,
  Home,
  Calendar,
  TrendingUp,
  Save,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';


interface Lead {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  empresa: string | null;
  cargo: string | null;
  presupuestoMensual: number | null;
  propiedadesEstimadas: number | null;
  estado: string;
  prioridad: string;
  fuente: string;
  notas: string | null;
  scoring: number | null;
  probabilidadCierre: number | null;
  convertido: boolean;
  fechaCreacion: Date;
  fechaContacto: Date | null;
  fechaConversion: Date | null;
  salesRepresentative: {
    id: string;
    nombre: string;
    apellidos: string;
  };
}

const estadosLeads = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'CONTACTADO', label: 'Contactado' },
  { value: 'CALIFICADO', label: 'Calificado' },
  { value: 'PROPUESTA', label: 'Propuesta Enviada' },
  { value: 'NEGOCIACION', label: 'En Negociación' },
  { value: 'CERRADO_GANADO', label: 'Cerrado Ganado' },
  { value: 'CERRADO_PERDIDO', label: 'Cerrado Perdido' },
];

const prioridades = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];

export default function LeadDetailPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [estado, setEstado] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && leadId) {
      loadLead();
    }
  }, [session, leadId]);

  const loadLead = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sales/leads/${leadId}`);
      if (response.ok) {
        const data = await response.json();
        setLead(data);
        setEstado(data.estado);
        setPrioridad(data.prioridad);
        setNotas(data.notas || '');
      } else {
        toast.error('Error al cargar el lead');
        router.push('/portal-comercial/leads');
      }
    } catch (error) {
      logger.error('Error loading lead:', error);
      toast.error('Error al cargar el lead');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/sales/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado,
          prioridad,
          notas,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setLead(updated);
        toast.success('Lead actualizado correctamente');
      } else {
        toast.error('Error al actualizar el lead');
      }
    } catch (error) {
      logger.error('Error saving lead:', error);
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const getBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      NUEVO: 'bg-blue-100 text-blue-700',
      CONTACTADO: 'bg-purple-100 text-purple-700',
      CALIFICADO: 'bg-indigo-100 text-indigo-700',
      PROPUESTA: 'bg-yellow-100 text-yellow-700',
      NEGOCIACION: 'bg-orange-100 text-orange-700',
      CERRADO_GANADO: 'bg-green-100 text-green-700',
      CERRADO_PERDIDO: 'bg-red-100 text-red-700',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (prioridad: string) => {
    const colors: Record<string, string> = {
      ALTA: 'text-red-600',
      MEDIA: 'text-yellow-600',
      BAJA: 'text-green-600',
    };
    return colors[prioridad] || 'text-gray-600';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <LoadingState message="Cargando lead..." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/portal-comercial/leads">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  {lead.nombreCompleto}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {lead.empresa || 'Sin empresa'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gradient-primary"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información de Contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-primary hover:underline"
                      >
                        {lead.email}
                      </a>
                    </div>
                  </div>

                  {lead.telefono && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Teléfono</p>
                        <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${lead.telefono}`}
                          className="text-primary hover:underline"
                        >
                          {lead.telefono}
                        </a>
                      </div>
                    </div>
                  )}

                  {lead.empresa && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Empresa</p>
                        <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p>{lead.empresa}</p>
                      </div>
                    </div>
                  )}

                  {lead.cargo && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Cargo</p>
                        <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <p>{lead.cargo}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información del Proyecto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="mr-2 h-5 w-5" />
                  Información del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.presupuestoMensual && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Presupuesto Mensual
                      </p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-semibold">
                          {lead.presupuestoMensual}€/mes
                        </p>
                      </div>
                    </div>
                  )}

                  {lead.propiedadesEstimadas && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Propiedades Estimadas
                      </p>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-semibold">
                          {lead.propiedadesEstimadas}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fuente</p>
                      <Badge variant="outline">{lead.fuente}</Badge>
                  </div>

                  {lead.scoring && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Scoring</p>
                        <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                              style={{ width: `${lead.scoring}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">
                            {lead.scoring}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notas */}
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Añade notas sobre el lead, conversaciones, acuerdos, etc."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estado y Prioridad */}
            <Card>
              <CardHeader>
                <CardTitle>Gestión del Lead</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Estado</label>
                    <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosLeads.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Prioridad</label>
                    <Select value={prioridad} onValueChange={setPrioridad}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {prioridades.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getBadgeColor(estado)}>
                      {estado.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(prioridad)}>
                      {prioridad}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fechas Importantes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Fechas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                    <p className="text-sm font-medium">
                    {lead.fechaCreacion
                      ? format(new Date(lead.fechaCreacion), "d 'de' MMMM 'de' yyyy", {
                          locale: es,
                        })
                      : 'Sin fecha'}
                  </p>
                </div>

                {lead.fechaContacto && (
                  <div>
                    <p className="text-sm text-muted-foreground">Primer Contacto</p>
                      <p className="text-sm font-medium">
                      {format(new Date(lead.fechaContacto), "d 'de' MMMM 'de' yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                )}

                {lead.fechaConversion && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Conversión</p>
                      <p className="text-sm font-medium">
                      {format(new Date(lead.fechaConversion), "d 'de' MMMM 'de' yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comercial Asignado */}
            <Card>
              <CardHeader>
                <CardTitle>Comercial Asignado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {lead.salesRepresentative.nombre} {lead.salesRepresentative.apellidos}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
