'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Home,
  Plus,
  Users,
  Phone,
  Mail,
  TrendingUp,
  Target,
  Award,
  Eye,
  Edit,
  Trash2,
  Filter,
  RefreshCw,
  Calendar,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import logger, { logError } from '@/lib/logger';

interface Lead {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  empresa: string | null;
  estado: string;
  etapa: string;
  scoring: number;
  probabilidadCierre: number;
  fuente: string;
  presupuestoMensual: number | null;
  urgencia: string | null;
  verticalesInteres: string[];
  notas: string | null;
  createdAt: string;
  updatedAt: string;
}

const ETAPA_COLORS: Record<string, string> = {
  prospecto: 'bg-blue-500',
  contactado: 'bg-cyan-500',
  calificado: 'bg-purple-500',
  demo: 'bg-yellow-500',
  propuesta: 'bg-orange-500',
  negociacion: 'bg-pink-500',
  cerrado_ganado: 'bg-green-500',
  cerrado_perdido: 'bg-gray-500',
};

const ETAPA_LABELS: Record<string, string> = {
  prospecto: 'Prospecto',
  contactado: 'Contactado',
  calificado: 'Calificado',
  demo: 'Demo',
  propuesta: 'Propuesta',
  negociacion: 'Negociación',
  cerrado_ganado: 'Ganado',
  cerrado_perdido: 'Perdido',
};

const ETAPAS_PIPELINE = [
  'prospecto',
  'contactado',
  'calificado',
  'demo',
  'propuesta',
  'negociacion',
  'cerrado_ganado',
];

export default function CRMPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    nuevos: 0,
    contactados: 0,
    calificados: 0,
    tasaConversion: 0,
    valorPipeline: 0,
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    empresa: '',
    fuente: 'landing',
    presupuestoMensual: '',
    urgencia: 'media',
    verticalesInteres: [] as string[],
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchLeads();
      fetchStats();
    }
  }, [status, router]);

  const fetchLeads = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const res = await fetch('/api/crm/leads?limit=50', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        // Mapear respuesta de la API a formato esperado por la página
        const leadsArray = Array.isArray(data) ? data : (data.leads || []);
        const mappedLeads = leadsArray.map((lead: any) => ({
          id: lead.id,
          nombreCompleto: lead.name || lead.nombreCompleto || `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
          email: lead.email,
          telefono: lead.phone || lead.telefono,
          empresa: lead.companyName || lead.empresa,
          estado: lead.status || lead.estado || 'nuevo',
          etapa: lead.etapa || lead.status || lead.estado || 'prospecto',
          scoring: lead.score || lead.scoring || 0,
          probabilidadCierre: lead.probabilidadCierre || Math.min(100, (lead.score || 0) * 1.5),
          fuente: lead.source || lead.fuente || 'web',
          presupuestoMensual: lead.budget || lead.presupuestoMensual,
          urgencia: lead.priority || lead.urgencia,
          verticalesInteres: lead.verticalesInteres || [],
          notas: lead.notes || lead.notas,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        }));
        setLeads(mappedLeads);
      } else {
        toast.error('Error al cargar los leads');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        logger.error('Request timeout fetching leads');
        toast.error('Tiempo de espera agotado');
      } else {
        logger.error('Error fetching leads:', error);
        toast.error('Error al cargar los leads');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const res = await fetch('/api/crm/stats', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        logger.error('Error fetching stats:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLead ? `/api/crm/leads/${editingLead.id}` : '/api/crm/leads';
      const method = editingLead ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          presupuestoMensual: formData.presupuestoMensual
            ? parseFloat(formData.presupuestoMensual)
            : null,
        }),
      });

      if (res.ok) {
        toast.success(editingLead ? 'Lead actualizado correctamente' : 'Lead creado correctamente');
        setOpenDialog(false);
        resetForm();
        fetchLeads();
        fetchStats();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Error al guardar el lead');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al guardar el lead');
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      nombreCompleto: lead.nombreCompleto,
      email: lead.email,
      telefono: lead.telefono || '',
      empresa: lead.empresa || '',
      fuente: lead.fuente,
      presupuestoMensual: lead.presupuestoMensual?.toString() || '',
      urgencia: lead.urgencia || 'media',
      verticalesInteres: lead.verticalesInteres || [],
      notas: lead.notas || '',
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este lead?')) return;

    try {
      const res = await fetch(`/api/crm/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Lead eliminado correctamente');
        fetchLeads();
        fetchStats();
      }
    } catch (error) {
      toast.error('Error al eliminar el lead');
    }
  };

  const handleChangeEtapa = async (leadId: string, newEtapa: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa: newEtapa }),
      });

      if (res.ok) {
        toast.success('Etapa actualizada correctamente');
        fetchLeads();
        fetchStats();
      }
    } catch (error) {
      toast.error('Error al actualizar la etapa');
    }
  };

  const resetForm = () => {
    setFormData({
      nombreCompleto: '',
      email: '',
      telefono: '',
      empresa: '',
      fuente: 'landing',
      presupuestoMensual: '',
      urgencia: 'media',
      verticalesInteres: [],
      notas: '',
    });
    setEditingLead(null);
  };

  const getLeadsByEtapa = (etapa: string) => {
    return leads.filter((lead) => lead.etapa === etapa);
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Cargando CRM..." />
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      {/* Header */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>CRM</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center mt-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">CRM - Pipeline de Ventas</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona y haz seguimiento de tus leads potenciales
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                fetchLeads();
                fetchStats();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Dialog
              open={openDialog}
              onOpenChange={(open) => {
                setOpenDialog(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingLead ? 'Editar Lead' : 'Nuevo Lead'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombreCompleto">Nombre Completo *</Label>
                      <Input
                        id="nombreCompleto"
                        value={formData.nombreCompleto}
                        onChange={(e) =>
                          setFormData({ ...formData, nombreCompleto: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="empresa">Empresa</Label>
                      <Input
                        id="empresa"
                        value={formData.empresa}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fuente">Fuente</Label>
                      <Select
                        value={formData.fuente}
                        onValueChange={(value) => setFormData({ ...formData, fuente: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landing">Landing</SelectItem>
                          <SelectItem value="chatbot">Chatbot</SelectItem>
                          <SelectItem value="formulario_contacto">
                            Formulario de Contacto
                          </SelectItem>
                          <SelectItem value="referido">Referido</SelectItem>
                          <SelectItem value="social_media">Redes Sociales</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="urgencia">Urgencia</Label>
                      <Select
                        value={formData.urgencia}
                        onValueChange={(value) => setFormData({ ...formData, urgencia: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="presupuesto">Presupuesto Mensual (€)</Label>
                      <Input
                        id="presupuesto"
                        type="number"
                        value={formData.presupuestoMensual}
                        onChange={(e) =>
                          setFormData({ ...formData, presupuestoMensual: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notas">Notas</Label>
                    <Textarea
                      id="notas"
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOpenDialog(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="gradient-primary">
                      {editingLead ? 'Actualizar' : 'Crear'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nuevos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contactados</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contactados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificados</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.calificados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasaConversion}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Kanban */}
      {leads.length === 0 ? (
        <EmptyState
          icon={<Users className="h-16 w-16 text-gray-400" />}
          title="No hay leads registrados"
          description="Comienza agregando tu primer lead al CRM"
          action={{
            label: 'Crear Primer Lead',
            onClick: () => setOpenDialog(true),
            icon: <Plus className="h-4 w-4 mr-2" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 overflow-x-auto pb-4">
          {ETAPAS_PIPELINE.map((etapa) => {
            const leadsInEtapa = getLeadsByEtapa(etapa);
            const color = ETAPA_COLORS[etapa];

            return (
              <div key={etapa} className="min-w-[280px]">
                <Card className="h-full">
                  <CardHeader className={`${color} text-white`}>
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <span>{ETAPA_LABELS[etapa]}</span>
                      <Badge variant="secondary" className="bg-white text-black">
                        {leadsInEtapa.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                    {leadsInEtapa.map((lead) => (
                      <Card
                        key={lead.id}
                        className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-sm">{lead.nombreCompleto}</h4>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleEdit(lead)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500"
                                onClick={() => handleDelete(lead.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {lead.empresa && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {lead.empresa}
                            </div>
                          )}

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>

                          {lead.telefono && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {lead.telefono}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium">Scoring:</span>
                              <Badge
                                variant={
                                  lead.scoring >= 70
                                    ? 'default'
                                    : lead.scoring >= 40
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {lead.scoring}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {lead.probabilidadCierre}%
                            </span>
                          </div>

                          {lead.presupuestoMensual && (
                            <div className="text-xs font-medium text-green-600">
                              €{lead.presupuestoMensual}/mes
                            </div>
                          )}

                          {/* Botones de cambio de etapa */}
                          <div className="flex gap-1 pt-2">
                            {ETAPAS_PIPELINE.indexOf(etapa) > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-7 text-xs"
                                onClick={() =>
                                  handleChangeEtapa(
                                    lead.id,
                                    ETAPAS_PIPELINE[ETAPAS_PIPELINE.indexOf(etapa) - 1]
                                  )
                                }
                              >
                                ←
                              </Button>
                            )}
                            {ETAPAS_PIPELINE.indexOf(etapa) < ETAPAS_PIPELINE.length - 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-7 text-xs"
                                onClick={() =>
                                  handleChangeEtapa(
                                    lead.id,
                                    ETAPAS_PIPELINE[ETAPAS_PIPELINE.indexOf(etapa) + 1]
                                  )
                                }
                              >
                                →
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}

                    {leadsInEtapa.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-8">
                        No hay leads en esta etapa
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </AuthenticatedLayout>
  );
}
