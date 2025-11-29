'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Calendar } from '@/components/ui/calendar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Home,
  MapPin,
  Phone,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Visit {
  id: string;
  fechaVisita: string;
  confirmada: boolean;
  asistio?: boolean | null;
  feedback?: string | null;
  candidate: {
    id: string;
    nombreCompleto: string;
    email: string;
    telefono: string;
    unit: {
      id: string;
      numero: string;
      building: {
        id: string;
        nombre: string;
        direccion: string;
      };
    };
  };
}

interface Candidate {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  unit: {
    id: string;
    numero: string;
    building: {
      nombre: string;
    };
  };
}

export default function VisitasPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { canCreate } = usePermissions();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    candidateId: '',
    fechaVisita: '',
    hora: '10:00',
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchVisits();
      fetchCandidates();
    }
  }, [session]);

  const fetchVisits = async () => {
    try {
      const res = await fetch('/api/visits');
      if (!res.ok) throw new Error('Error al cargar visitas');
      const data = await res.json();
      setVisits(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las visitas');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/candidates');
      if (!res.ok) throw new Error('Error al cargar candidatos');
      const data = await res.json();
      // Filtrar solo candidatos sin visitas o con visitas no realizadas
      const availableCandidates = data.filter((c: any) => c.estado !== 'rechazado');
      setCandidates(availableCandidates);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreateVisit = async () => {
    if (!formData.candidateId || !formData.fechaVisita || !formData.hora) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const fechaVisita = `${formData.fechaVisita}T${formData.hora}:00`;
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: formData.candidateId,
          fechaVisita,
          confirmada: false,
        }),
      });

      if (!res.ok) throw new Error('Error al crear visita');
      
      toast.success('Visita programada correctamente');
      setOpenDialog(false);
      setFormData({ candidateId: '', fechaVisita: '', hora: '10:00', notas: '' });
      fetchVisits();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al programar la visita');
    }
  };

  const handleConfirmVisit = async (visitId: string, confirmada: boolean) => {
    try {
      const res = await fetch(`/api/visits/${visitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmada }),
      });

      if (!res.ok) throw new Error('Error al actualizar visita');
      
      toast.success(confirmada ? 'Visita confirmada' : 'Confirmación cancelada');
      fetchVisits();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la visita');
    }
  };

  const handleMarkAsCompleted = async (visitId: string) => {
    try {
      const res = await fetch(`/api/visits/${visitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistio: true }),
      });

      if (!res.ok) throw new Error('Error al actualizar visita');
      
      toast.success('Visita marcada como realizada');
      fetchVisits();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la visita');
    }
  };

  // Filtrar visitas
  const filteredVisits = useMemo(() => {
    let filtered = visits;

    if (filterStatus === 'pendientes') {
      filtered = filtered.filter(v => !v.confirmada && !v.asistio);
    } else if (filterStatus === 'confirmadas') {
      filtered = filtered.filter(v => v.confirmada && !v.asistio);
    } else if (filterStatus === 'realizadas') {
      filtered = filtered.filter(v => v.asistio);
    }

    return filtered.sort((a, b) => 
      new Date(a.fechaVisita).getTime() - new Date(b.fechaVisita).getTime()
    );
  }, [visits, filterStatus]);

  // Visitas del día seleccionado
  const visitsForSelectedDate = useMemo(() => {
    return filteredVisits.filter(visit => 
      isSameDay(parseISO(visit.fechaVisita), selectedDate)
    );
  }, [filteredVisits, selectedDate]);

  // Días con visitas para el calendario
  const daysWithVisits = useMemo(() => {
    return visits.map(v => parseISO(v.fechaVisita));
  }, [visits]);

  // KPIs
  const stats = useMemo(() => {
    const total = visits.length;
    const pendientes = visits.filter(v => !v.confirmada && !v.asistio).length;
    const confirmadas = visits.filter(v => v.confirmada && !v.asistio).length;
    const realizadas = visits.filter(v => v.asistio).length;

    return { total, pendientes, confirmadas, realizadas };
  }, [visits]);

  const getStatusBadge = (visit: Visit) => {
    if (visit.asistio) {
      return <Badge className="bg-green-500">Realizada</Badge>;
    } else if (visit.confirmada) {
      return <Badge className="bg-blue-500">Confirmada</Badge>;
    } else {
      return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Breadcrumbs y Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink>Visitas</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Dashboard
                </Button>
                <h1 className="text-2xl font-bold sm:text-3xl">Visitas a Propiedades</h1>
              </div>
            </div>
            {canCreate && (
              <Button onClick={() => setOpenDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Programar Visita
              </Button>
            )}
          </div>

          {/* KPI Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visitas</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendientes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.confirmadas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Realizadas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.realizadas}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="mb-6">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las visitas</SelectItem>
                <SelectItem value="pendientes">Pendientes</SelectItem>
                <SelectItem value="confirmadas">Confirmadas</SelectItem>
                <SelectItem value="realizadas">Realizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calendario y Lista */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Calendario */}
            <Card>
              <CardHeader>
                <CardTitle>Calendario de Visitas</CardTitle>
                <CardDescription>
                  Selecciona un día para ver las visitas programadas
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={es}
                  className="rounded-md border"
                  modifiers={{
                    hasVisit: daysWithVisits,
                  }}
                  modifiersStyles={{
                    hasVisit: {
                      fontWeight: 'bold',
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Visitas del Día Seleccionado */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Visitas del {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
                </CardTitle>
                <CardDescription>
                  {visitsForSelectedDate.length} visita(s) programada(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {visitsForSelectedDate.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay visitas programadas para este día
                  </p>
                ) : (
                  visitsForSelectedDate.map((visit) => (
                    <Card key={visit.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(visit)}
                              <span className="text-sm font-medium">
                                {format(parseISO(visit.fechaVisita), 'HH:mm')}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{visit.candidate.nombreCompleto}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {visit.candidate.unit.building.nombre} - Unidad {visit.candidate.unit.numero}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{visit.candidate.telefono}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {!visit.asistio && (
                              <>
                                {!visit.confirmada ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleConfirmVisit(visit.id, true)}
                                  >
                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                    Confirmar
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkAsCompleted(visit.id)}
                                  >
                                    Marcar Realizada
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lista Completa de Visitas */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Todas las Visitas</CardTitle>
              <CardDescription>
                Lista completa de visitas programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredVisits.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    No hay visitas programadas
                  </p>
                ) : (
                  filteredVisits.map((visit) => (
                    <Card key={visit.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {getStatusBadge(visit)}
                              <span className="text-sm font-medium">
                                {format(parseISO(visit.fechaVisita), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                              </span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{visit.candidate.nombreCompleto}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>{visit.candidate.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{visit.candidate.telefono}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {visit.candidate.unit.building.nombre} - Unidad {visit.candidate.unit.numero}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 sm:flex-col">
                            {!visit.asistio && (
                              <>
                                {!visit.confirmada ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleConfirmVisit(visit.id, true)}
                                  >
                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                    Confirmar
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleMarkAsCompleted(visit.id)}
                                  >
                                    Marcar Realizada
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Dialog para Nueva Visita */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Programar Nueva Visita</DialogTitle>
            <DialogDescription>
              Programa una visita para un candidato interesado
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="candidate">Candidato</Label>
              <Select
                value={formData.candidateId}
                onValueChange={(value) => setFormData({ ...formData, candidateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un candidato" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.nombreCompleto} - {candidate.unit.building.nombre} ({candidate.unit.numero})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fechaVisita}
                onChange={(e) => setFormData({ ...formData, fechaVisita: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hora">Hora</Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateVisit}>
              Programar Visita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
