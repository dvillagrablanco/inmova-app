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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Store,
  MapPin,
  DollarSign,
  Ruler,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  Building,
  ShoppingBag,
  Coffee,
  Briefcase,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface RetailUnit {
  id: string;
  buildingId: string;
  nombre: string;
  tipo: string;
  superficie: number;
  precioAlquiler: number;
  estado: string;
  descripcion?: string;
  caracteristicas: string[];
  planta?: string;
  fachada: boolean;
  escaparate: boolean;
  almacen: boolean;
}

interface Stats {
  total: number;
  disponibles: number;
  alquilados: number;
  superficieTotal: number;
  ingresosMensuales: number;
}

const TIPOS_LOCAL = [
  { value: 'tienda', label: 'Tienda', icon: ShoppingBag },
  { value: 'restaurante', label: 'Restaurante', icon: Coffee },
  { value: 'oficina', label: 'Oficina', icon: Briefcase },
  { value: 'showroom', label: 'Showroom', icon: Eye },
  { value: 'almacen', label: 'Almacén', icon: Store },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function RetailPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [locales, setLocales] = useState<RetailUnit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [buildings, setBuildings] = useState<{ id: string; nombre: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');

  // Form state
  const [newLocal, setNewLocal] = useState({
    buildingId: '',
    nombre: '',
    tipo: 'tienda',
    superficie: 0,
    precioAlquiler: 0,
    descripcion: '',
    planta: '',
    fachada: false,
    escaparate: false,
    almacen: false,
    caracteristicas: [] as string[],
  });

  // Cargar datos
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

      // Cargar edificios
      const buildingsRes = await fetch('/api/buildings?limit=100');
      if (buildingsRes.ok) {
        const data = await buildingsRes.json();
        setBuildings(Array.isArray(data) ? data : data.data || []);
      }

      await loadLocales();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocales = async () => {
    try {
      let url = '/api/retail';
      const params = new URLSearchParams();
      if (filterEstado !== 'all') params.append('estado', filterEstado);
      if (filterTipo !== 'all') params.append('tipo', filterTipo);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLocales(data.data || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error loading locales:', error);
    }
  };

  // Crear local
  const handleCreate = async () => {
    if (!newLocal.buildingId || !newLocal.nombre || !newLocal.superficie) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/retail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocal),
      });

      if (response.ok) {
        toast.success('Local creado exitosamente');
        setShowNewDialog(false);
        resetForm();
        loadLocales();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear local');
      }
    } catch (error) {
      console.error('Error creating local:', error);
      toast.error('Error al crear local');
    }
  };

  const resetForm = () => {
    setNewLocal({
      buildingId: '',
      nombre: '',
      tipo: 'tienda',
      superficie: 0,
      precioAlquiler: 0,
      descripcion: '',
      planta: '',
      fachada: false,
      escaparate: false,
      almacen: false,
      caracteristicas: [],
    });
  };

  // Obtener color del estado
  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case 'disponible': return 'bg-green-100 text-green-700';
      case 'alquilado': return 'bg-blue-100 text-blue-700';
      case 'reservado': return 'bg-yellow-100 text-yellow-700';
      case 'mantenimiento': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Obtener ícono del tipo
  const getTipoIcon = (tipo: string) => {
    const t = TIPOS_LOCAL.find(tl => tl.value === tipo);
    return t?.icon || Store;
  };

  // Filtrar locales
  const filteredLocales = locales.filter(local => {
    const matchesSearch = local.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'todos' || local.estado === activeTab;
    return matchesSearch && matchesTab;
  });

  // Loading
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[500px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Store className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Gestión Retail</h1>
              <p className="text-muted-foreground">
                Locales comerciales y espacios de negocio
              </p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowNewDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Local
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Store className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total locales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.disponibles || 0}</p>
                  <p className="text-xs text-muted-foreground">Disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Building className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.alquilados || 0}</p>
                  <p className="text-xs text-muted-foreground">Alquilados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Ruler className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.superficieTotal || 0} m²</p>
                  <p className="text-xs text-muted-foreground">Superficie</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">€{((stats?.ingresosMensuales || 0) / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-muted-foreground">Ingresos/mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar locales..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterTipo} onValueChange={v => { setFilterTipo(v); loadLocales(); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {TIPOS_LOCAL.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadLocales}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="todos">Todos ({locales.length})</TabsTrigger>
            <TabsTrigger value="disponible">Disponibles ({locales.filter(l => l.estado === 'disponible').length})</TabsTrigger>
            <TabsTrigger value="alquilado">Alquilados ({locales.filter(l => l.estado === 'alquilado').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredLocales.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No hay locales</h3>
                  <p className="text-muted-foreground">Añade tu primer local comercial</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLocales.map(local => {
                  const Icon = getTipoIcon(local.tipo);
                  return (
                    <Card key={local.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Icon className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{local.nombre}</CardTitle>
                              <CardDescription className="capitalize">{local.tipo}</CardDescription>
                            </div>
                          </div>
                          <Badge className={getEstadoColor(local.estado)}>
                            {local.estado}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Superficie</span>
                          <span className="font-medium">{local.superficie} m²</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Alquiler</span>
                          <span className="font-bold text-green-600">€{local.precioAlquiler}/mes</span>
                        </div>
                        {local.planta && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Planta</span>
                            <span>{local.planta}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 pt-2">
                          {local.fachada && <Badge variant="outline" className="text-xs">Fachada</Badge>}
                          {local.escaparate && <Badge variant="outline" className="text-xs">Escaparate</Badge>}
                          {local.almacen && <Badge variant="outline" className="text-xs">Almacén</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Nuevo Local */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Local Comercial</DialogTitle>
            <DialogDescription>Añade un nuevo espacio comercial</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Edificio *</Label>
                <Select
                  value={newLocal.buildingId}
                  onValueChange={v => setNewLocal(prev => ({ ...prev, buildingId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar edificio" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Nombre del Local *</Label>
                <Input
                  placeholder="Local 1A"
                  value={newLocal.nombre}
                  onChange={e => setNewLocal(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newLocal.tipo}
                  onValueChange={v => setNewLocal(prev => ({ ...prev, tipo: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_LOCAL.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Planta</Label>
                <Input
                  placeholder="Planta baja"
                  value={newLocal.planta}
                  onChange={e => setNewLocal(prev => ({ ...prev, planta: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Superficie (m²) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={newLocal.superficie}
                  onChange={e => setNewLocal(prev => ({ ...prev, superficie: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Alquiler (€/mes)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newLocal.precioAlquiler}
                  onChange={e => setNewLocal(prev => ({ ...prev, precioAlquiler: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Características</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newLocal.fachada}
                    onCheckedChange={v => setNewLocal(prev => ({ ...prev, fachada: v }))}
                  />
                  <Label className="font-normal">Fachada</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newLocal.escaparate}
                    onCheckedChange={v => setNewLocal(prev => ({ ...prev, escaparate: v }))}
                  />
                  <Label className="font-normal">Escaparate</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newLocal.almacen}
                    onCheckedChange={v => setNewLocal(prev => ({ ...prev, almacen: v }))}
                  />
                  <Label className="font-normal">Almacén</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción del local..."
                value={newLocal.descripcion}
                onChange={e => setNewLocal(prev => ({ ...prev, descripcion: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Crear Local</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
