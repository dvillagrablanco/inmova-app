'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  ClipboardCheck,
  Home,
  ArrowLeft,
  Plus,
  Calendar,
  Building2,
  MapPin,
  User,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePermissions } from '@/lib/hooks/usePermissions';
import logger from '@/lib/logger';


interface Inspection {
  id: string;
  tipo: string;
  estado: string;
  buildingId?: string;
  buildingName?: string;
  unitId?: string;
  unitNumber?: string;
  tenantId?: string;
  fechaProgramada: string;
  fechaRealizada?: string;
  inspector: string;
  observaciones?: string;
  daniosEncontrados?: string;
  costoEstimadoDanos?: number;
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

export default function InspeccionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate } = usePermissions();

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');

  const [form, setForm] = useState({
    tipo: 'entrada',
    buildingId: '',
    unitId: '',
    fechaProgramada: '',
    inspector: '',
    observaciones: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInspections();
      fetchBuildings();
    }
  }, [status]);

  const fetchInspections = async () => {
    try {
      const res = await fetch('/api/inspections');
      const data = await res.json();
      setInspections(data);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar inspecciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const res = await fetch('/api/buildings');
      const data = await res.json();
      setBuildings(data);
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const fetchUnits = async (buildingId: string) => {
    try {
      const res = await fetch(`/api/units?buildingId=${buildingId}`);
      const data = await res.json();
      setUnits(data);
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const handleBuildingChange = (buildingId: string) => {
    setForm({ ...form, buildingId, unitId: '' });
    fetchUnits(buildingId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.tipo || !form.fechaProgramada || !form.inspector) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success('Inspección programada exitosamente');
        setOpenDialog(false);
        setForm({
          tipo: 'entrada',
          buildingId: '',
          unitId: '',
          fechaProgramada: '',
          inspector: '',
          observaciones: '',
        });
        fetchInspections();
      } else {
        toast.error('Error al programar inspección');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al programar inspección');
    }
  };

  const filteredInspections = useMemo(() => {
    return inspections.filter((inspection) => {
      const matchesSearch =
        inspection.inspector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.buildingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTipo = filterTipo === 'all' || inspection.tipo === filterTipo;
      const matchesEstado = filterEstado === 'all' || inspection.estado === filterEstado;

      return matchesSearch && matchesTipo && matchesEstado;
    });
  }, [inspections, searchTerm, filterTipo, filterEstado]);

  // KPIs
  const totalInspections = inspections.length;
  const programadas = inspections.filter((i) => i.estado === 'programada').length;
  const completadas = inspections.filter((i) => i.estado === 'completada').length;
  const pendientes = inspections.filter((i) => i.estado === 'pendiente_accion').length;

  const getTipoLabel = (tipo: string) => {
    const labels: any = {
      entrada: 'Entrada',
      salida: 'Salida',
      periodica: 'Periódica',
      emergencia: 'Emergencia',
      precompra: 'Pre-compra',
      mantenimiento: 'Mantenimiento',
    };
    return labels[tipo] || tipo;
  };

  const getEstadoBadge = (estado: string) => {
    const variants: any = {
      programada: 'default',
      en_progreso: 'secondary',
      completada: 'outline',
      pendiente_accion: 'destructive',
      cancelada: 'destructive',
    };
    const labels: any = {
      programada: 'Programada',
      en_progreso: 'En Progreso',
      completada: 'Completada',
      pendiente_accion: 'Acción Requerida',
      cancelada: 'Cancelada',
    };
    return <Badge variant={variants[estado] || 'default'}>{labels[estado] || estado}</Badge>;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
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
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>

            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Inspecciones</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Inspecciones</h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona inspecciones de entrada, salida y periódicas
                </p>
              </div>
              {canCreate && (
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva Inspección
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Programar Nueva Inspección</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label>Tipo de Inspección *</Label>
                        <Select
                          value={form.tipo}
                          onValueChange={(value) => setForm({ ...form, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entrada">Entrada</SelectItem>
                            <SelectItem value="salida">Salida</SelectItem>
                            <SelectItem value="periodica">Periódica</SelectItem>
                            <SelectItem value="precompra">Pre-compra</SelectItem>
                            <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                            <SelectItem value="emergencia">Emergencia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Edificio</Label>
                        <Select value={form.buildingId} onValueChange={handleBuildingChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un edificio" />
                          </SelectTrigger>
                          <SelectContent>
                            {buildings.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {form.buildingId && (
                        <div>
                          <Label>Unidad</Label>
                          <Select
                            value={form.unitId}
                            onValueChange={(value) => setForm({ ...form, unitId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una unidad" />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.numero}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label>Fecha Programada *</Label>
                        <Input
                          type="datetime-local"
                          value={form.fechaProgramada}
                          onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label>Inspector *</Label>
                        <Input
                          value={form.inspector}
                          onChange={(e) => setForm({ ...form, inspector: e.target.value })}
                          placeholder="Nombre del inspector"
                          required
                        />
                      </div>

                      <div>
                        <Label>Observaciones</Label>
                        <Input
                          value={form.observaciones}
                          onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                          placeholder="Notas adicionales"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpenDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit">Programar</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inspecciones</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInspections}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Programadas</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{programadas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                <FileText className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completadas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acción Requerida</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendientes}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Buscar</Label>
                  <Input
                    placeholder="Inspector, edificio, unidad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={filterTipo} onValueChange={setFilterTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="salida">Salida</SelectItem>
                      <SelectItem value="periodica">Periódica</SelectItem>
                      <SelectItem value="precompra">Pre-compra</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="programada">Programada</SelectItem>
                      <SelectItem value="en_progreso">En Progreso</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="pendiente_accion">Acción Requerida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Inspecciones */}
          <div className="space-y-4">
            {filteredInspections.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No se encontraron inspecciones
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredInspections.map((inspection) => (
                <Card key={inspection.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline">{getTipoLabel(inspection.tipo)}</Badge>
                          {getEstadoBadge(inspection.estado)}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {inspection.buildingName && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{inspection.buildingName}</span>
                            </div>
                          )}
                          {inspection.unitNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>Unidad {inspection.unitNumber}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{inspection.inspector}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(inspection.fechaProgramada), "d 'de' MMMM, yyyy", {
                                locale: es,
                              })}
                            </span>
                          </div>
                        </div>

                        {inspection.observaciones && (
                          <p className="text-sm text-muted-foreground">
                            {inspection.observaciones}
                          </p>
                        )}

                        {inspection.costoEstimadoDanos && inspection.costoEstimadoDanos > 0 && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                              Daños estimados: €{inspection.costoEstimadoDanos.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/inspecciones/${inspection.id}`)}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
