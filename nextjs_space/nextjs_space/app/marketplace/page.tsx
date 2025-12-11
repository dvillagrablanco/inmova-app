'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import {
  Home,
  ArrowLeft,
  Store,
  FileText,
  Briefcase,
  Star,
  Plus,
  Search,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { format } from 'date-fns';
import logger, { logError } from '@/lib/logger';

interface Provider {
  id: string;
  nombre: string;
  tipo: string;
  rating?: number;
}

interface Building {
  id: string;
  nombre: string;
}

interface Unit {
  id: string;
  numero: string;
  buildingId: string;
}

interface Quote {
  id: string;
  titulo: string;
  descripcion: string;
  servicioRequerido: string;
  urgencia: string;
  estado: string;
  fechaSolicitud: string;
  montoCotizado?: number;
  provider: Provider;
  building?: Building;
  unit?: Unit;
}

interface Job {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  fechaInicio: string;
  fechaFin?: string;
  montoTotal: number;
  montoPagado: number;
  provider: Provider;
  building?: Building;
  unit?: Unit;
  reviews: any[];
}

interface Review {
  id: string;
  calificacion: number;
  puntualidad?: number;
  calidad?: number;
  comunicacion?: number;
  comentario?: string;
  recomendaria: boolean;
  createdAt: string;
  provider: Provider;
  job: Job;
}

interface Stats {
  totalQuotes: number;
  pendingQuotes: number;
  activeJobs: number;
  completedJobs: number;
  totalReviews: number;
  avgRating: number;
  topProviders: any[];
}

export default function MarketplacePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { canCreate } = usePermissions();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [openQuoteDialog, setOpenQuoteDialog] = useState(false);
  const [openJobDialog, setOpenJobDialog] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingItem, setDeletingItem] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [quoteForm, setQuoteForm] = useState({
    providerId: 'auto-suggest',
    buildingId: 'no-building',
    unitId: 'no-unit',
    titulo: '',
    descripcion: '',
    servicioRequerido: '',
    urgencia: 'media',
  });

  const [jobForm, setJobForm] = useState({
    providerId: '',
    quoteId: '',
    buildingId: '',
    unitId: '',
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    montoTotal: '',
    garantiaMeses: '',
    notasTrabajo: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quotesRes, jobsRes, reviewsRes, statsRes, providersRes, buildingsRes, unitsRes] =
        await Promise.all([
          fetch('/api/marketplace/quotes'),
          fetch('/api/marketplace/jobs'),
          fetch('/api/marketplace/reviews'),
          fetch('/api/marketplace/stats'),
          fetch('/api/providers'),
          fetch('/api/buildings'),
          fetch('/api/units'),
        ]);

      const [
        quotesData,
        jobsData,
        reviewsData,
        statsData,
        providersData,
        buildingsData,
        unitsData,
      ] = await Promise.all([
        quotesRes.json(),
        jobsRes.json(),
        reviewsRes.json(),
        statsRes.json(),
        providersRes.json(),
        buildingsRes.json(),
        unitsRes.json(),
      ]);

      setQuotes(quotesData);
      setJobs(jobsData);
      setReviews(reviewsData);
      setStats(statsData);
      setProviders(providersData);
      setBuildings(buildingsData);
      setUnits(unitsData);
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Map special values to null
      const formData = {
        ...quoteForm,
        providerId: quoteForm.providerId === 'auto-suggest' ? null : quoteForm.providerId,
        buildingId: quoteForm.buildingId === 'no-building' ? null : quoteForm.buildingId,
        unitId: quoteForm.unitId === 'no-unit' ? null : quoteForm.unitId,
      };

      const res = await fetch('/api/marketplace/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Error al crear cotización');

      toast.success('Cotización creada exitosamente');
      setOpenQuoteDialog(false);
      setQuoteForm({
        providerId: 'auto-suggest',
        buildingId: 'no-building',
        unitId: 'no-unit',
        titulo: '',
        descripcion: '',
        servicioRequerido: '',
        urgencia: 'media',
      });
      fetchData();
    } catch (error) {
      logger.error('Error creating quote:', error);
      toast.error('Error al crear la cotización');
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/marketplace/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm),
      });

      if (!res.ok) throw new Error('Error al crear trabajo');

      toast.success('Trabajo creado exitosamente');
      setOpenJobDialog(false);
      setJobForm({
        providerId: '',
        quoteId: '',
        buildingId: '',
        unitId: '',
        titulo: '',
        descripcion: '',
        fechaInicio: '',
        montoTotal: '',
        garantiaMeses: '',
        notasTrabajo: '',
      });
      fetchData();
    } catch (error) {
      logger.error('Error creating job:', error);
      toast.error('Error al crear el trabajo');
    }
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setQuoteForm({
      providerId: quote.provider.id,
      buildingId: quote.building?.id || '',
      unitId: quote.unit?.id || '',
      titulo: quote.titulo,
      descripcion: quote.descripcion,
      servicioRequerido: quote.servicioRequerido,
      urgencia: quote.urgencia,
    });
    setOpenQuoteDialog(true);
  };

  const handleUpdateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;

    try {
      const res = await fetch(`/api/marketplace/quotes/${editingQuote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteForm),
      });

      if (!res.ok) throw new Error('Error al actualizar cotización');

      toast.success('Cotización actualizada exitosamente');
      setOpenQuoteDialog(false);
      setEditingQuote(null);
      setQuoteForm({
        providerId: '',
        buildingId: '',
        unitId: '',
        titulo: '',
        descripcion: '',
        servicioRequerido: '',
        urgencia: 'media',
      });
      fetchData();
    } catch (error) {
      logger.error('Error updating quote:', error);
      toast.error('Error al actualizar la cotización');
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setJobForm({
      providerId: job.provider.id,
      quoteId: '',
      buildingId: job.building?.id || '',
      unitId: job.unit?.id || '',
      titulo: job.titulo,
      descripcion: job.descripcion,
      fechaInicio: job.fechaInicio ? new Date(job.fechaInicio).toISOString().split('T')[0] : '',
      montoTotal: job.montoTotal.toString(),
      garantiaMeses: '',
      notasTrabajo: '',
    });
    setOpenJobDialog(true);
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      const res = await fetch(`/api/marketplace/jobs/${editingJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm),
      });

      if (!res.ok) throw new Error('Error al actualizar trabajo');

      toast.success('Trabajo actualizado exitosamente');
      setOpenJobDialog(false);
      setEditingJob(null);
      setJobForm({
        providerId: '',
        quoteId: '',
        buildingId: '',
        unitId: '',
        titulo: '',
        descripcion: '',
        fechaInicio: '',
        montoTotal: '',
        garantiaMeses: '',
        notasTrabajo: '',
      });
      fetchData();
    } catch (error) {
      logger.error('Error updating job:', error);
      toast.error('Error al actualizar el trabajo');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      const endpoint =
        deletingItem.type === 'quote'
          ? `/api/marketplace/quotes/${deletingItem.id}`
          : deletingItem.type === 'job'
            ? `/api/marketplace/jobs/${deletingItem.id}`
            : `/api/marketplace/reviews/${deletingItem.id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error(`Error al eliminar ${deletingItem.type}`);

      toast.success(
        `${deletingItem.type === 'quote' ? 'Cotización' : deletingItem.type === 'job' ? 'Trabajo' : 'Reseña'} eliminado exitosamente`
      );
      setDeletingItem(null);
      fetchData();
    } catch (error) {
      logger.error(`Error deleting ${deletingItem.type}:`, error);
      toast.error(`Error al eliminar ${deletingItem.type}`);
    }
  };

  const handleDialogClose = (open: boolean, type: 'quote' | 'job') => {
    if (!open) {
      if (type === 'quote') {
        setEditingQuote(null);
        setQuoteForm({
          providerId: '',
          buildingId: '',
          unitId: '',
          titulo: '',
          descripcion: '',
          servicioRequerido: '',
          urgencia: 'media',
        });
      } else {
        setEditingJob(null);
        setJobForm({
          providerId: '',
          quoteId: '',
          buildingId: '',
          unitId: '',
          titulo: '',
          descripcion: '',
          fechaInicio: '',
          montoTotal: '',
          garantiaMeses: '',
          notasTrabajo: '',
        });
      }
    }
    if (type === 'quote') {
      setOpenQuoteDialog(open);
    } else {
      setOpenJobDialog(open);
    }
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter(
      (quote) =>
        quote.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.provider.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quotes, searchTerm]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(
      (job) =>
        job.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.provider.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobs, searchTerm]);

  const getQuoteStatusBadge = (estado: string) => {
    const variants: Record<string, string> = {
      solicitada: 'bg-blue-100 text-blue-800',
      en_revision: 'bg-yellow-100 text-yellow-800',
      cotizada: 'bg-purple-100 text-purple-800',
      aceptada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800',
      expirada: 'bg-gray-100 text-gray-800',
    };
    return variants[estado] || 'bg-gray-100 text-gray-800';
  };

  const getJobStatusBadge = (estado: string) => {
    const variants: Record<string, string> = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_progreso: 'bg-blue-100 text-blue-800',
      completado: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800',
    };
    return variants[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Breadcrumbs y Botón Volver */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
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
                    <BreadcrumbPage>Marketplace</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Marketplace de Servicios</h1>
            </div>
            <p className="text-muted-foreground">
              Gestiona cotizaciones, trabajos y reseñas de proveedores de servicios
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cotizaciones</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalQuotes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingQuotes || 0} pendientes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trabajos Activos</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeJobs || 0}</div>
                <p className="text-xs text-muted-foreground">En progreso</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completados</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.completedJobs || 0}</div>
                <p className="text-xs text-muted-foreground">Trabajos finalizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.avgRating ? stats.avgRating.toFixed(1) : '0.0'}
                </div>
                <p className="text-xs text-muted-foreground">{stats?.totalReviews || 0} reseñas</p>
              </CardContent>
            </Card>
          </div>

          {/* Barra de búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar cotizaciones, trabajos o proveedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="quotes" className="space-y-6">
            <TabsList>
              <TabsTrigger value="quotes" className="gap-2">
                <FileText className="h-4 w-4" />
                Cotizaciones
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Trabajos
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <Star className="h-4 w-4" />
                Reseñas
              </TabsTrigger>
            </TabsList>

            {/* Cotizaciones Tab */}
            <TabsContent value="quotes" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Cotizaciones Solicitadas</h2>
                {canCreate && (
                  <Dialog
                    open={openQuoteDialog}
                    onOpenChange={(open) => handleDialogClose(open, 'quote')}
                  >
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nueva Cotización
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingQuote ? 'Editar Cotización' : 'Solicitar Cotización'}
                        </DialogTitle>
                        <DialogDescription>
                          Solicita una cotización de servicio a un proveedor
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={editingQuote ? handleUpdateQuote : handleCreateQuote}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="titulo">Título *</Label>
                            <Input
                              id="titulo"
                              required
                              value={quoteForm.titulo}
                              onChange={(e) =>
                                setQuoteForm({ ...quoteForm, titulo: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="servicioRequerido">Tipo de Servicio *</Label>
                            <Input
                              id="servicioRequerido"
                              required
                              value={quoteForm.servicioRequerido}
                              onChange={(e) =>
                                setQuoteForm({
                                  ...quoteForm,
                                  servicioRequerido: e.target.value,
                                })
                              }
                              placeholder="Ej: Plomería, Electricidad"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="descripcion">Descripción *</Label>
                          <Textarea
                            id="descripcion"
                            required
                            value={quoteForm.descripcion}
                            onChange={(e) =>
                              setQuoteForm({ ...quoteForm, descripcion: e.target.value })
                            }
                            rows={4}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="providerId">Proveedor (Opcional)</Label>
                            <Select
                              value={quoteForm.providerId}
                              onValueChange={(value) =>
                                setQuoteForm({ ...quoteForm, providerId: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar proveedor" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto-suggest">Auto-sugerir</SelectItem>
                                {providers.map((provider) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    {provider.nombre} - {provider.tipo}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="urgencia">Urgencia</Label>
                            <Select
                              value={quoteForm.urgencia}
                              onValueChange={(value) =>
                                setQuoteForm({ ...quoteForm, urgencia: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="baja">Baja</SelectItem>
                                <SelectItem value="media">Media</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="buildingId">Edificio (Opcional)</Label>
                            <Select
                              value={quoteForm.buildingId}
                              onValueChange={(value) =>
                                setQuoteForm({ ...quoteForm, buildingId: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar edificio" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no-building">Ninguno</SelectItem>
                                {buildings.map((building) => (
                                  <SelectItem key={building.id} value={building.id}>
                                    {building.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="unitId">Unidad (Opcional)</Label>
                            <Select
                              value={quoteForm.unitId}
                              onValueChange={(value) =>
                                setQuoteForm({ ...quoteForm, unitId: value })
                              }
                              disabled={!quoteForm.buildingId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar unidad" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no-unit">Ninguna</SelectItem>
                                {units
                                  .filter((u) => u.buildingId === quoteForm.buildingId)
                                  .map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                      {unit.numero}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenQuoteDialog(false)}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit">
                            {editingQuote ? 'Actualizar Cotización' : 'Solicitar Cotización'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredQuotes.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No hay cotizaciones solicitadas
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredQuotes.map((quote) => (
                    <Card key={quote.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{quote.titulo}</CardTitle>
                            <CardDescription className="mt-1">
                              {quote.servicioRequerido}
                            </CardDescription>
                          </div>
                          <Badge className={getQuoteStatusBadge(quote.estado)}>
                            {quote.estado.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {quote.descripcion}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>{quote.provider.nombre}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {quote.fechaSolicitud
                                ? format(new Date(quote.fechaSolicitud), 'dd/MM/yyyy')
                                : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {quote.building && (
                          <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {quote.building.nombre}
                              {quote.unit && ` - Unidad ${quote.unit.numero}`}
                            </span>
                          </div>
                        )}

                        {quote.montoCotizado && (
                          <div className="flex items-center gap-2 text-lg font-semibold text-green-600">
                            <DollarSign className="h-5 w-5" />
                            {quote.montoCotizado.toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                            })}
                            €
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              quote.urgencia === 'alta'
                                ? 'border-red-500 text-red-500'
                                : quote.urgencia === 'media'
                                  ? 'border-yellow-500 text-yellow-500'
                                  : 'border-green-500 text-green-500'
                            }
                          >
                            {quote.urgencia === 'alta'
                              ? 'Urgente'
                              : quote.urgencia === 'media'
                                ? 'Media'
                                : 'Baja'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Trabajos Tab */}
            <TabsContent value="jobs" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Trabajos</h2>
                {canCreate && (
                  <Dialog
                    open={openJobDialog}
                    onOpenChange={(open) => handleDialogClose(open, 'job')}
                  >
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nuevo Trabajo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingJob ? 'Editar Trabajo' : 'Registrar Trabajo'}
                        </DialogTitle>
                        <DialogDescription>Registra un nuevo trabajo de servicio</DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={editingJob ? handleUpdateJob : handleCreateJob}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="job-titulo">Título *</Label>
                            <Input
                              id="job-titulo"
                              required
                              value={jobForm.titulo}
                              onChange={(e) => setJobForm({ ...jobForm, titulo: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="job-providerId">Proveedor *</Label>
                            <Select
                              value={jobForm.providerId}
                              onValueChange={(value) =>
                                setJobForm({ ...jobForm, providerId: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {providers.map((provider) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    {provider.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="job-descripcion">Descripción *</Label>
                          <Textarea
                            id="job-descripcion"
                            required
                            value={jobForm.descripcion}
                            onChange={(e) =>
                              setJobForm({ ...jobForm, descripcion: e.target.value })
                            }
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="job-fechaInicio">Fecha Inicio *</Label>
                            <Input
                              id="job-fechaInicio"
                              type="date"
                              required
                              value={jobForm.fechaInicio}
                              onChange={(e) =>
                                setJobForm({ ...jobForm, fechaInicio: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="job-montoTotal">Monto Total *</Label>
                            <Input
                              id="job-montoTotal"
                              type="number"
                              step="0.01"
                              required
                              value={jobForm.montoTotal}
                              onChange={(e) =>
                                setJobForm({ ...jobForm, montoTotal: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="job-garantia">Garantía (meses)</Label>
                            <Input
                              id="job-garantia"
                              type="number"
                              value={jobForm.garantiaMeses}
                              onChange={(e) =>
                                setJobForm({ ...jobForm, garantiaMeses: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="job-notas">Notas del Trabajo</Label>
                          <Textarea
                            id="job-notas"
                            value={jobForm.notasTrabajo}
                            onChange={(e) =>
                              setJobForm({ ...jobForm, notasTrabajo: e.target.value })
                            }
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenJobDialog(false)}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit">
                            {editingJob ? 'Actualizar Trabajo' : 'Crear Trabajo'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredJobs.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No hay trabajos registrados
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredJobs.map((job) => (
                    <Card key={job.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{job.titulo}</CardTitle>
                            <CardDescription className="mt-1">
                              {job.provider.nombre}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getJobStatusBadge(job.estado)}>
                              {job.estado.replace('_', ' ')}
                            </Badge>
                            {canCreate && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditJob(job)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setDeletingItem({ type: 'job', id: job.id, name: job.titulo })
                                    }
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {job.descripcion}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {job.fechaInicio
                                ? format(new Date(job.fechaInicio), 'dd/MM/yyyy')
                                : 'N/A'}
                            </span>
                          </div>
                          {job.fechaFin && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>{format(new Date(job.fechaFin), 'dd/MM/yyyy')}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Monto Total:</span>
                            <span className="font-semibold">
                              {job.montoTotal.toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                              })}
                              €
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Pagado:</span>
                            <span className="font-semibold text-green-600">
                              {job.montoPagado.toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                              })}
                              €
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  (job.montoPagado / job.montoTotal) * 100,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        {job.building && (
                          <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {job.building.nombre}
                              {job.unit && ` - Unidad ${job.unit.numero}`}
                            </span>
                          </div>
                        )}

                        {job.reviews && job.reviews.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-yellow-600">
                            <Star className="h-4 w-4 fill-current" />
                            <span>Reseña disponible</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Reseñas Tab */}
            <TabsContent value="reviews" className="space-y-4">
              <h2 className="text-xl font-semibold">Reseñas de Proveedores</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {reviews.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Star className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No hay reseñas registradas
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  reviews.map((review) => (
                    <Card key={review.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{review.provider.nombre}</CardTitle>
                            <CardDescription className="mt-1">{review.job.titulo}</CardDescription>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="text-lg font-bold">
                              {review.calificacion.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {review.comentario && (
                          <p className="text-sm text-muted-foreground">"{review.comentario}"</p>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          {review.puntualidad && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Puntualidad:</span>
                              <span className="ml-2 font-medium">{review.puntualidad}/5</span>
                            </div>
                          )}
                          {review.calidad && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Calidad:</span>
                              <span className="ml-2 font-medium">{review.calidad}/5</span>
                            </div>
                          )}
                          {review.comunicacion && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Comunicación:</span>
                              <span className="ml-2 font-medium">{review.comunicacion}/5</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {review.recomendaria ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Recomendado
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              No recomendado
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {review.createdAt
                            ? format(new Date(review.createdAt), "dd/MM/yyyy 'a las' HH:mm")
                            : 'N/A'}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Top Proveedores */}
          {stats?.topProviders && stats.topProviders.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Mejores Proveedores</CardTitle>
                <CardDescription>
                  Proveedores con mejor calificación y más trabajos completados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.topProviders.map((provider: any, index: number) => (
                    <div
                      key={provider.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{provider.nombre}</h4>
                        <p className="text-sm text-muted-foreground">{provider.tipo}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {provider.stats.avgRating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {provider.stats.completedJobs} trabajos
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
