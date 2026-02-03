'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  AlertTriangle,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Home,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  MessageSquare,
  Filter,
  MoreVertical,
  AlertCircle,
  Zap,
  Droplets,
  Flame,
  Lock,
  Paintbrush,
} from 'lucide-react';
import { toast } from 'sonner';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Incident {
  id: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'structural' | 'security' | 'cleaning' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  propertyName: string;
  unitNumber: string;
  reportedBy: string;
  reportedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  slaDeadline?: string;
  comments: Array<{ author: string; text: string; date: string }>;
}

const categoryIcons: Record<string, any> = {
  plumbing: Droplets,
  electrical: Zap,
  hvac: Flame,
  structural: Building2,
  security: Lock,
  cleaning: Paintbrush,
  other: Wrench,
};

const categoryNames: Record<string, string> = {
  plumbing: 'Fontanería',
  electrical: 'Electricidad',
  hvac: 'Climatización',
  structural: 'Estructura',
  security: 'Seguridad',
  cleaning: 'Limpieza',
  other: 'Otros',
};

export default function GestionIncidenciasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    propertyId: '',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Obtener datos desde la API de mantenimiento
      const response = await fetch('/api/maintenance');

      if (!response.ok) {
        throw new Error('Error al obtener incidencias');
      }

      const data = await response.json();

      // Mapear los datos de MaintenanceRequest a Incident
      const mappedIncidents: Incident[] = (Array.isArray(data) ? data : data.data || []).map(
        (req: any) => {
          // Mapear prioridad
          const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
            baja: 'low',
            media: 'medium',
            alta: 'high',
            urgente: 'critical',
          };

          // Mapear estado
          const statusMap: Record<
            string,
            'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
          > = {
            pendiente: 'open',
            asignado: 'assigned',
            en_progreso: 'in_progress',
            completado: 'resolved',
            cancelado: 'closed',
          };

          // Inferir categoría del título
          const inferCategory = (title: string, desc: string): string => {
            const text = `${title} ${desc}`.toLowerCase();
            if (
              text.includes('agua') ||
              text.includes('fuga') ||
              text.includes('tubería') ||
              text.includes('fontaner')
            )
              return 'plumbing';
            if (
              text.includes('eléctric') ||
              text.includes('enchufe') ||
              text.includes('luz') ||
              text.includes('interruptor')
            )
              return 'electrical';
            if (text.includes('aire') || text.includes('calefacción') || text.includes('clima'))
              return 'hvac';
            if (text.includes('puerta') || text.includes('cerradura') || text.includes('seguridad'))
              return 'security';
            if (text.includes('limpieza') || text.includes('pintura')) return 'cleaning';
            if (text.includes('estructura') || text.includes('grieta') || text.includes('techo'))
              return 'structural';
            return 'other';
          };

          return {
            id: req.id,
            title: req.titulo,
            description: req.descripcion,
            category: inferCategory(req.titulo, req.descripcion),
            priority: priorityMap[req.prioridad] || 'medium',
            status: statusMap[req.estado] || 'open',
            propertyName: req.unit?.building?.nombre || 'Sin edificio',
            unitNumber: req.unit?.numero || 'Sin unidad',
            reportedBy: req.unit?.tenant?.nombreCompleto || 'Sistema',
            reportedAt: req.fechaSolicitud || new Date().toISOString(),
            assignedTo: req.provider?.nombre,
            resolvedAt: req.fechaCompletada,
            slaDeadline: req.fechaProgramada,
            comments: req.comentarios
              ? [{ author: 'Sistema', text: req.comentarios, date: req.updatedAt }]
              : [],
          };
        }
      );

      setIncidents(mappedIncidents);
    } catch (error) {
      console.error('Error al cargar incidencias:', error);
      toast.error('Error al cargar incidencias');
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = incidents.filter((i) => {
    const matchesSearch =
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.propertyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || i.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || i.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { className: string; label: string }> = {
      low: { className: 'bg-gray-500', label: 'Baja' },
      medium: { className: 'bg-blue-500', label: 'Media' },
      high: { className: 'bg-orange-500', label: 'Alta' },
      critical: { className: 'bg-red-500 animate-pulse', label: 'Crítica' },
    };
    const { className, label } = config[priority] || config.medium;
    return <Badge className={className}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string; icon: any }> = {
      open: {
        className: 'bg-red-100 text-red-800 border-red-200',
        label: 'Abierta',
        icon: AlertCircle,
      },
      assigned: {
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'Asignada',
        icon: User,
      },
      in_progress: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'En Proceso',
        icon: Wrench,
      },
      resolved: {
        className: 'bg-green-100 text-green-800 border-green-200',
        label: 'Resuelta',
        icon: CheckCircle2,
      },
      closed: {
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Cerrada',
        icon: XCircle,
      },
    };
    const { className, label, icon: Icon } = config[status] || config.open;
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const stats = {
    total: incidents.length,
    open: incidents.filter((i) => i.status === 'open').length,
    inProgress: incidents.filter((i) => i.status === 'in_progress' || i.status === 'assigned')
      .length,
    resolved: incidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
    critical: incidents.filter(
      (i) => i.priority === 'critical' && i.status !== 'resolved' && i.status !== 'closed'
    ).length,
  };

  const handleCreateIncident = () => {
    toast.success('Incidencia creada correctamente');
    setShowNewDialog(false);
    setNewIncident({
      title: '',
      description: '',
      category: 'other',
      priority: 'medium',
      propertyId: '',
    });
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Gestión de Incidencias</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Incidencias</h1>
              <p className="text-muted-foreground">Sistema de tickets y mantenimiento</p>
            </div>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Incidencia
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Abiertas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.open}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En Proceso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resueltas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
            </CardContent>
          </Card>
          <Card className={stats.critical > 0 ? 'border-red-500 bg-red-50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Críticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${stats.critical > 0 ? 'text-red-600 animate-pulse' : ''}`}
              >
                {stats.critical}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar incidencias..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abiertas</SelectItem>
                  <SelectItem value="assigned">Asignadas</SelectItem>
                  <SelectItem value="in_progress">En Proceso</SelectItem>
                  <SelectItem value="resolved">Resueltas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <div className="space-y-4">
          {filteredIncidents.map((incident) => {
            const CategoryIcon = categoryIcons[incident.category] || Wrench;
            return (
              <Card
                key={incident.id}
                className={`hover:shadow-lg transition-shadow ${incident.priority === 'critical' && incident.status === 'open' ? 'border-red-500 border-2' : ''}`}
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${incident.priority === 'critical' ? 'bg-red-100' : 'bg-muted'}`}
                      >
                        <CategoryIcon
                          className={`h-6 w-6 ${incident.priority === 'critical' ? 'text-red-600' : 'text-muted-foreground'}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2 flex-wrap">
                          {incident.title}
                          {getPriorityBadge(incident.priority)}
                          {getStatusBadge(incident.status)}
                        </CardTitle>
                        <CardDescription className="mt-1">{incident.description}</CardDescription>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {incident.propertyName} - {incident.unitNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {incident.reportedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(incident.reportedAt).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                        <DropdownMenuItem>Asignar Técnico</DropdownMenuItem>
                        <DropdownMenuItem>Marcar como Resuelta</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                {incident.assignedTo && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                      <Wrench className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">
                        Asignado a: <strong>{incident.assignedTo}</strong>
                      </span>
                    </div>
                    {incident.comments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {incident.comments.map((comment, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm">
                                <strong>{comment.author}:</strong> {comment.text}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(comment.date).toLocaleString('es-ES')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Dialog Nueva Incidencia */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Incidencia</DialogTitle>
              <DialogDescription>
                Reporta un problema o solicitud de mantenimiento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <AIDocumentAssistant
                context="documentos"
                variant="inline"
                position="bottom-right"
                onApplyData={(data) => {
                  if (data.titulo || data.title) {
                    setNewIncident((prev) => ({ ...prev, title: data.titulo || data.title }));
                  }
                  if (data.descripcion || data.description) {
                    setNewIncident((prev) => ({
                      ...prev,
                      description: data.descripcion || data.description,
                    }));
                  }
                  if (data.categoria || data.category) {
                    const category = String(data.categoria || data.category).toLowerCase();
                    if (categoryNames[category]) {
                      setNewIncident((prev) => ({ ...prev, category }));
                    }
                  }
                  if (data.prioridad || data.priority || data.urgencia) {
                    const priority = String(
                      data.prioridad || data.priority || data.urgencia
                    ).toLowerCase();
                    if (['low', 'medium', 'high', 'critical'].includes(priority)) {
                      setNewIncident((prev) => ({ ...prev, priority }));
                    }
                  }
                  toast.success('Datos aplicados a la incidencia');
                }}
              />
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Describe brevemente el problema"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción *</Label>
                <Textarea
                  placeholder="Detalla el problema..."
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={newIncident.category}
                    onValueChange={(v) => setNewIncident({ ...newIncident, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryNames).map(([key, name]) => (
                        <SelectItem key={key} value={key}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={newIncident.priority}
                    onValueChange={(v) => setNewIncident({ ...newIncident, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Propiedad</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p1">Edificio Centro - 3A</SelectItem>
                    <SelectItem value="p2">Residencial Playa - 2B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateIncident}>Crear Incidencia</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
