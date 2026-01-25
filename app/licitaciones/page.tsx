'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Gavel, Plus, Calendar, Euro, FileText, Users, 
  Clock, CheckCircle2, XCircle, AlertCircle, Eye, Building2
} from 'lucide-react';

interface Tender {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: string;
  prioridad: string;
  fechaAsignacion: string;
  fechaEstimada?: string;
  presupuesto?: number;
  notas?: string;
  building?: {
    id: string;
    nombre: string;
    direccion: string;
  };
  provider?: {
    id: string;
    nombre: string;
    email?: string;
    rating?: number;
  };
  ofertas: Array<{
    id: string;
    total: number;
    estado: string;
    provider: {
      id: string;
      nombre: string;
      rating?: number;
    };
  }>;
  numOfertas: number;
  mejorOferta?: number;
  estadoLicitacion: string;
}

interface Stats {
  total: number;
  abiertas: number;
  cerradas: number;
  adjudicadas: number;
  totalOfertas: number;
}

export default function LicitacionesPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailTender, setDetailTender] = useState<Tender | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'mantenimiento',
    presupuestoMaximo: 0,
    fechaLimiteOfertas: '',
    requisitos: [] as string[],
  });

  const [newRequisito, setNewRequisito] = useState('');

  useEffect(() => {
    loadTenders();
  }, []);

  async function loadTenders() {
    try {
      setLoading(true);
      const response = await fetch('/api/licitaciones');
      if (!response.ok) throw new Error('Error al cargar licitaciones');
      
      const data = await response.json();
      setTenders(data.data || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las licitaciones');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      if (!formData.titulo || !formData.descripcion || !formData.fechaLimiteOfertas) {
        toast.error('Completa los campos obligatorios');
        return;
      }

      const response = await fetch('/api/licitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear licitación');
      }

      toast.success('Licitación publicada');
      setDialogOpen(false);
      setFormData({
        titulo: '',
        descripcion: '',
        tipo: 'mantenimiento',
        presupuestoMaximo: 0,
        fechaLimiteOfertas: '',
        requisitos: [],
      });
      loadTenders();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const addRequisito = () => {
    if (newRequisito.trim()) {
      setFormData({
        ...formData,
        requisitos: [...formData.requisitos, newRequisito.trim()],
      });
      setNewRequisito('');
    }
  };

  const removeRequisito = (index: number) => {
    setFormData({
      ...formData,
      requisitos: formData.requisitos.filter((_, i) => i !== index),
    });
  };

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      abierta: { label: 'Abierta', variant: 'default', icon: <Clock className="h-3 w-3" /> },
      cerrada: { label: 'Cerrada', variant: 'secondary', icon: <XCircle className="h-3 w-3" /> },
      adjudicada: { label: 'Adjudicada', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
      sin_ofertas: { label: 'Sin Ofertas', variant: 'outline', icon: <AlertCircle className="h-3 w-3" /> },
      completada: { label: 'Completada', variant: 'secondary', icon: <CheckCircle2 className="h-3 w-3" /> },
    };
    const c = config[estado] || config.abierta;
    return (
      <Badge variant={c.variant} className="flex items-center gap-1">
        {c.icon}
        {c.label}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const tipoLabels: Record<string, string> = {
      mantenimiento: 'Mantenimiento',
      renovacion: 'Renovación',
      limpieza: 'Limpieza',
      seguridad: 'Seguridad',
      jardineria: 'Jardinería',
      otro: 'Otro',
    };
    return <Badge variant="outline">{tipoLabels[tipo] || tipo}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Licitaciones</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gavel className="h-6 w-6 text-indigo-500" />
              Licitaciones
            </h1>
            <p className="text-muted-foreground">
              Gestión de procesos de contratación y ofertas
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Licitación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Licitación</DialogTitle>
                <DialogDescription>
                  Publica una nueva solicitud de ofertas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Mantenimiento ascensores 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción detallada del trabajo requerido..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="renovacion">Renovación</SelectItem>
                        <SelectItem value="limpieza">Limpieza</SelectItem>
                        <SelectItem value="seguridad">Seguridad</SelectItem>
                        <SelectItem value="jardineria">Jardinería</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Presupuesto Máximo (€)</Label>
                    <Input
                      type="number"
                      value={formData.presupuestoMaximo}
                      onChange={(e) => setFormData({ ...formData, presupuestoMaximo: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fecha Límite Ofertas *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.fechaLimiteOfertas}
                    onChange={(e) => setFormData({ ...formData, fechaLimiteOfertas: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Requisitos</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newRequisito}
                      onChange={(e) => setNewRequisito(e.target.value)}
                      placeholder="Añadir requisito..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequisito())}
                    />
                    <Button type="button" onClick={addRequisito} size="sm">
                      Añadir
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.requisitos.map((req, i) => (
                      <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeRequisito(i)}>
                        {req} ✕
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>
                  Publicar Licitación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{stats.abiertas}</div>
                <div className="text-sm text-muted-foreground">Abiertas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-gray-600">{stats.cerradas}</div>
                <div className="text-sm text-muted-foreground">Cerradas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">{stats.adjudicadas}</div>
                <div className="text-sm text-muted-foreground">Adjudicadas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-indigo-600">{stats.totalOfertas}</div>
                <div className="text-sm text-muted-foreground">Total Ofertas</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tenders List */}
        {tenders.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No hay licitaciones</h3>
                <p className="text-muted-foreground mb-4">
                  Publica tu primera licitación para empezar a recibir ofertas
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Licitación
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tenders.map((tender) => (
              <Card key={tender.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{tender.titulo}</h3>
                        {getEstadoBadge(tender.estadoLicitacion)}
                        {getTipoBadge(tender.tipo)}
                      </div>
                      {tender.building && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          {tender.building.nombre || tender.building.direccion}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tender.descripcion}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        {tender.fechaEstimada && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Fecha límite: {new Date(tender.fechaEstimada).toLocaleDateString('es-ES')}
                          </span>
                        )}
                        {tender.presupuesto && tender.presupuesto > 0 && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Euro className="h-4 w-4" />
                            Presupuesto máx: {formatCurrency(tender.presupuesto)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="text-center px-4">
                        <div className="text-2xl font-bold text-indigo-600">{tender.numOfertas}</div>
                        <div className="text-xs text-muted-foreground">Ofertas</div>
                      </div>
                      {tender.mejorOferta && (
                        <div className="text-center px-4 border-l">
                          <div className="text-lg font-bold text-green-600">{formatCurrency(tender.mejorOferta)}</div>
                          <div className="text-xs text-muted-foreground">Mejor Oferta</div>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setDetailTender(tender)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!detailTender} onOpenChange={() => setDetailTender(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {detailTender && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {detailTender.titulo}
                    {getEstadoBadge(detailTender.estadoLicitacion)}
                  </DialogTitle>
                  <DialogDescription>
                    {getTipoBadge(detailTender.tipo)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div>
                    <h4 className="font-semibold mb-2">Descripción</h4>
                    <p className="text-sm text-muted-foreground">{detailTender.descripcion}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {detailTender.presupuesto && (
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <div className="text-xl font-bold">{formatCurrency(detailTender.presupuesto)}</div>
                          <div className="text-xs text-muted-foreground">Presupuesto Máximo</div>
                        </CardContent>
                      </Card>
                    )}
                    {detailTender.fechaEstimada && (
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <div className="text-xl font-bold">
                            {new Date(detailTender.fechaEstimada).toLocaleDateString('es-ES')}
                          </div>
                          <div className="text-xs text-muted-foreground">Fecha Límite</div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Ofertas */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Ofertas Recibidas ({detailTender.numOfertas})
                    </h4>
                    {detailTender.ofertas && detailTender.ofertas.length > 0 ? (
                      <div className="space-y-2">
                        {detailTender.ofertas.map((oferta, index) => (
                          <div key={oferta.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${index === 0 ? 'bg-green-500' : 'bg-gray-400'}`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium">{oferta.provider.nombre}</div>
                                {oferta.provider.rating && (
                                  <div className="text-xs text-muted-foreground">
                                    ⭐ {oferta.provider.rating.toFixed(1)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold ${index === 0 ? 'text-green-600' : ''}`}>
                                {formatCurrency(oferta.total)}
                              </div>
                              <Badge variant={oferta.estado === 'aceptada' ? 'default' : 'secondary'} className="text-xs">
                                {oferta.estado}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No se han recibido ofertas todavía.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
