'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Visit {
  id: string;
  propertyAddress: string;
  propertyId: string;
  candidateId?: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  feedback?: string;
  agentName?: string;
  createdAt: string;
}

interface CandidateOption {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  unit?: {
    numero: string;
    building?: {
      direccion?: string | null;
    } | null;
  } | null;
}

export default function VisitasPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    propertyAddress: '',
    visitorName: '',
    visitorPhone: '',
    visitorEmail: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
    agentName: '',
  });

  useEffect(() => {
    loadVisits();
    loadCandidates();
  }, []);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/visits');
      if (response.ok) {
        const data = await response.json();
        setVisits(Array.isArray(data) ? data : (data.visits || []));
      } else {
        setVisits([]);
      }
    } catch (error) {
      console.error('Error loading visits:', error);
      toast.error('Error al cargar visitas');
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async () => {
    try {
      const response = await fetch('/api/candidates');
      if (!response.ok) {
        setCandidates([]);
        return;
      }
      const data = await response.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading candidates:', error);
      setCandidates([]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const candidate = candidates.find(
        (item) => item.email.toLowerCase() === formData.visitorEmail.toLowerCase()
      );

      if (!candidate) {
        toast.error('Candidato no encontrado. Registra el candidato antes de programar la visita.');
        return;
      }

      const fechaVisita = new Date(
        `${formData.scheduledDate}T${formData.scheduledTime || '00:00'}:00`
      );
      if (Number.isNaN(fechaVisita.getTime())) {
        toast.error('Fecha u hora inválida');
        return;
      }

      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          fechaVisita,
          confirmada: false,
          feedback: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Error al crear visita');
      }

      await loadVisits();
      toast.success('Visita programada correctamente');
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating visit:', error);
      toast.error('Error al crear visita');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingVisit) return;

    try {
      const fechaVisita = new Date(
        `${formData.scheduledDate}T${formData.scheduledTime || '00:00'}:00`
      );
      if (Number.isNaN(fechaVisita.getTime())) {
        toast.error('Fecha u hora inválida');
        return;
      }

      const response = await fetch('/api/visits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingVisit.id,
          fechaVisita,
          feedback: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Error al actualizar visita');
      }

      await loadVisits();
      toast.success('Visita actualizada correctamente');
      setEditingVisit(null);
      resetForm();
    } catch (error) {
      console.error('Error updating visit:', error);
      toast.error('Error al actualizar visita');
    }
  };

  const handleDelete = async () => {
    if (!visitToDelete) return;

    try {
      const response = await fetch(`/api/visits/${visitToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Error al eliminar visita');
      }

      setVisits(visits.filter((v) => v.id !== visitToDelete));
      toast.success('Visita eliminada correctamente');
      setDeleteDialogOpen(false);
      setVisitToDelete(null);
    } catch (error) {
      console.error('Error deleting visit:', error);
      toast.error('Error al eliminar visita');
    }
  };

  const handleStatusChange = async (visitId: string, newStatus: Visit['status']) => {
    try {
      const updated = visits.map((v) => (v.id === visitId ? { ...v, status: newStatus } : v));
      setVisits(updated);
      toast.success('Estado actualizado');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const resetForm = () => {
    setFormData({
      propertyAddress: '',
      visitorName: '',
      visitorPhone: '',
      visitorEmail: '',
      scheduledDate: '',
      scheduledTime: '',
      notes: '',
      agentName: '',
    });
  };

  const openEditDialog = (visit: Visit) => {
    setEditingVisit(visit);
    setFormData({
      propertyAddress: visit.propertyAddress,
      visitorName: visit.visitorName,
      visitorPhone: visit.visitorPhone,
      visitorEmail: visit.visitorEmail,
      scheduledDate: visit.scheduledDate,
      scheduledTime: visit.scheduledTime,
      notes: visit.notes || '',
      agentName: visit.agentName || '',
    });
  };

  const getStatusBadge = (status: Visit['status']) => {
    const variants = {
      scheduled: { variant: 'secondary' as const, label: 'Programada', icon: Clock },
      confirmed: { variant: 'default' as const, label: 'Confirmada', icon: CheckCircle2 },
      completed: { variant: 'default' as const, label: 'Completada', icon: CheckCircle2 },
      cancelled: { variant: 'destructive' as const, label: 'Cancelada', icon: XCircle },
      no_show: { variant: 'outline' as const, label: 'No Asistió', icon: AlertCircle },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredVisits = visits.filter((visit) => {
    const matchesSearch =
      visit.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visitorEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: visits.length,
    scheduled: visits.filter((v) => v.status === 'scheduled').length,
    confirmed: visits.filter((v) => v.status === 'confirmed').length,
    completed: visits.filter((v) => v.status === 'completed').length,
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Visitas</h1>
            <p className="text-muted-foreground">Coordina y gestiona visitas a propiedades</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Visita
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Visitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Programadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por visitante, propiedad o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="scheduled">Programada</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="no_show">No Asistió</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitante</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Fecha & Hora</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay visitas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{visit.visitorName}</p>
                          <p className="text-sm text-muted-foreground">{visit.visitorPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-sm">{visit.propertyAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {format(new Date(visit.scheduledDate), 'dd MMM yyyy', {
                              locale: es,
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">{visit.scheduledTime}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{visit.agentName || 'Sin asignar'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={visit.status}
                          onValueChange={(value) =>
                            handleStatusChange(visit.id, value as Visit['status'])
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Programada</SelectItem>
                            <SelectItem value="confirmed">Confirmada</SelectItem>
                            <SelectItem value="completed">Completada</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                            <SelectItem value="no_show">No Asistió</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(visit)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setVisitToDelete(visit.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog
          open={createDialogOpen || editingVisit !== null}
          onOpenChange={(open) => {
            if (!open) {
              setCreateDialogOpen(false);
              setEditingVisit(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingVisit ? 'Editar Visita' : 'Nueva Visita'}</DialogTitle>
              <DialogDescription>
                {editingVisit
                  ? 'Actualiza los datos de la visita'
                  : 'Programa una nueva visita a una propiedad'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingVisit ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Propiedad *</Label>
                  <Input
                    value={formData.propertyAddress}
                    onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                    placeholder="Dirección de la propiedad"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nombre del Visitante *</Label>
                  <Input
                    value={formData.visitorName}
                    onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                    placeholder="Juan García"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Teléfono *</Label>
                  <Input
                    type="tel"
                    value={formData.visitorPhone}
                    onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                    placeholder="+34 600 000 000"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.visitorEmail}
                    onChange={(e) => setFormData({ ...formData, visitorEmail: e.target.value })}
                    placeholder="ejemplo@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hora *</Label>
                  <Input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Agente Asignado</Label>
                  <Input
                    value={formData.agentName}
                    onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                    placeholder="Nombre del agente"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Información adicional sobre la visita..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setEditingVisit(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">{editingVisit ? 'Actualizar' : 'Crear'} Visita</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar visita?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la visita programada.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
