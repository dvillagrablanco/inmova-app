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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Package,
  Search,
  Home,
  ArrowLeft,
  Plus,
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  Truck,
  Building2,
  User,
  Calendar,
  MapPin,
  Snowflake,
  PenTool,
  Camera,
  RefreshCw,
  Eye,
  Send,
  Archive,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS
// ============================================================================

interface ColivingPackage {
  id: string;
  companyId: string;
  tenantId: string;
  buildingId: string;
  numeroSeguimiento?: string;
  remitente: string;
  empresa?: string;
  fechaLlegada: string;
  fechaRecogida?: string;
  estado: 'pendiente' | 'notificado' | 'recogido';
  ubicacionAlmacen?: string;
  tamano?: string;
  requiereRefrigeracion: boolean;
  requiereFirma: boolean;
  fotoComprobante?: string;
  notificado: boolean;
  notas?: string;
  tenant?: {
    nombreCompleto: string;
    telefono?: string;
    email?: string;
  };
}

interface Building {
  id: string;
  nombre: string;
  direccion: string;
}

interface Tenant {
  id: string;
  nombreCompleto: string;
  telefono?: string;
  email?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ColivingPaquetesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<ColivingPackage[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [showNewPackageDialog, setShowNewPackageDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ColivingPackage | null>(null);
  const [activeTab, setActiveTab] = useState('pendientes');
  const [searchTerm, setSearchTerm] = useState('');

  // Estado formulario nuevo paquete
  const [newPackage, setNewPackage] = useState({
    tenantId: '',
    buildingId: '',
    remitente: '',
    empresa: '',
    numeroSeguimiento: '',
    tamano: 'mediano',
    ubicacionAlmacen: '',
    requiereRefrigeracion: false,
    requiereFirma: false,
    notas: '',
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar edificios
      const buildingsRes = await fetch('/api/buildings?limit=100');
      if (buildingsRes.ok) {
        const buildingsData = await buildingsRes.json();
        setBuildings(Array.isArray(buildingsData) ? buildingsData : buildingsData.data || []);
      }

      // Cargar inquilinos
      const tenantsRes = await fetch('/api/tenants?limit=200');
      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        setTenants(Array.isArray(tenantsData) ? tenantsData : tenantsData.data || []);
      }

      // Cargar paquetes (intentar por edificio si hay uno seleccionado)
      await loadPackages();

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar paquetes
  const loadPackages = async () => {
    try {
      let url = '/api/coliving/packages';
      if (selectedBuilding && selectedBuilding !== 'all') {
        url += `?buildingId=${selectedBuilding}`;
      } else if (buildings.length > 0) {
        url += `?buildingId=${buildings[0].id}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPackages(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  // Efecto para recargar cuando cambia el edificio
  useEffect(() => {
    if (!loading && buildings.length > 0) {
      loadPackages();
    }
  }, [selectedBuilding]);

  // Registrar nuevo paquete
  const handleCreatePackage = async () => {
    if (!newPackage.tenantId || !newPackage.buildingId || !newPackage.remitente) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/coliving/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPackage,
          companyId: session?.user?.companyId,
        }),
      });

      if (response.ok) {
        toast.success('Paquete registrado exitosamente');
        setShowNewPackageDialog(false);
        resetNewPackageForm();
        loadPackages();
      } else {
        toast.error('Error al registrar paquete');
      }
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error('Error al registrar paquete');
    }
  };

  // Notificar paquete
  const handleNotify = async (packageId: string) => {
    try {
      const response = await fetch(`/api/coliving/packages/${packageId}/notify`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Notificación enviada al inquilino');
        loadPackages();
      } else {
        toast.error('Error al enviar notificación');
      }
    } catch (error) {
      console.error('Error notifying:', error);
      toast.error('Error al enviar notificación');
    }
  };

  // Marcar como recogido
  const handleCollect = async (packageId: string) => {
    try {
      const response = await fetch(`/api/coliving/packages/${packageId}/collect`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Paquete marcado como recogido');
        loadPackages();
      } else {
        toast.error('Error al marcar como recogido');
      }
    } catch (error) {
      console.error('Error collecting:', error);
      toast.error('Error al marcar como recogido');
    }
  };

  // Reset formulario
  const resetNewPackageForm = () => {
    setNewPackage({
      tenantId: '',
      buildingId: selectedBuilding !== 'all' ? selectedBuilding : '',
      remitente: '',
      empresa: '',
      numeroSeguimiento: '',
      tamano: 'mediano',
      ubicacionAlmacen: '',
      requiereRefrigeracion: false,
      requiereFirma: false,
      notas: '',
    });
  };

  // Obtener color del estado
  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-700';
      case 'notificado': return 'bg-blue-100 text-blue-700';
      case 'recogido': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Obtener icono del estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Clock className="h-4 w-4" />;
      case 'notificado': return <Bell className="h-4 w-4" />;
      case 'recogido': return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  // Filtrar paquetes
  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = 
      pkg.remitente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.tenant?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.numeroSeguimiento?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = 
      activeTab === 'todos' ||
      (activeTab === 'pendientes' && (pkg.estado === 'pendiente' || pkg.estado === 'notificado')) ||
      (activeTab === 'recogidos' && pkg.estado === 'recogido');

    return matchesSearch && matchesTab;
  });

  // Estadísticas
  const stats = {
    total: packages.length,
    pendientes: packages.filter(p => p.estado === 'pendiente').length,
    notificados: packages.filter(p => p.estado === 'notificado').length,
    recogidos: packages.filter(p => p.estado === 'recogido').length,
    refrigerados: packages.filter(p => p.requiereRefrigeracion && p.estado !== 'recogido').length,
  };

  // Loading state
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[500px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/coliving')}>
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
                <BreadcrumbLink href="/coliving">Coliving</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Paquetería</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Package className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Paquetería</h1>
              <p className="text-muted-foreground">
                Control de paquetes y entregas para residentes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Seleccionar edificio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los edificios</SelectItem>
                {buildings.map(building => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => {
              resetNewPackageForm();
              setShowNewPackageDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Paquete
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendientes}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.notificados}</p>
                  <p className="text-xs text-muted-foreground">Notificados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.recogidos}</p>
                  <p className="text-xs text-muted-foreground">Recogidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={stats.refrigerados > 0 ? 'border-blue-200 bg-blue-50' : ''}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Snowflake className={`h-8 w-8 ${stats.refrigerados > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <p className="text-2xl font-bold">{stats.refrigerados}</p>
                  <p className="text-xs text-muted-foreground">Refrigerados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por remitente, destinatario o nº seguimiento..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={loadPackages}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Tabs y tabla */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pendientes" className="gap-2">
              <Clock className="h-4 w-4" />
              Pendientes ({stats.pendientes + stats.notificados})
            </TabsTrigger>
            <TabsTrigger value="recogidos" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Recogidos ({stats.recogidos})
            </TabsTrigger>
            <TabsTrigger value="todos" className="gap-2">
              <Archive className="h-4 w-4" />
              Todos ({stats.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {filteredPackages.length === 0 ? (
                  <div className="py-16 text-center">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No hay paquetes</h3>
                    <p className="text-muted-foreground">
                      {activeTab === 'pendientes' 
                        ? 'No hay paquetes pendientes de recoger'
                        : 'No se encontraron paquetes'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estado</TableHead>
                        <TableHead>Destinatario</TableHead>
                        <TableHead>Remitente</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Fecha Llegada</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Notas</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPackages.map(pkg => (
                        <TableRow key={pkg.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={getEstadoColor(pkg.estado)}>
                                {getEstadoIcon(pkg.estado)}
                                <span className="ml-1 capitalize">{pkg.estado}</span>
                              </Badge>
                              {pkg.requiereRefrigeracion && (
                                <Badge variant="outline" className="text-blue-600">
                                  <Snowflake className="h-3 w-3" />
                                </Badge>
                              )}
                              {pkg.requiereFirma && (
                                <Badge variant="outline" className="text-purple-600">
                                  <PenTool className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{pkg.tenant?.nombreCompleto || 'Desconocido'}</p>
                              {pkg.tenant?.telefono && (
                                <p className="text-xs text-muted-foreground">{pkg.tenant.telefono}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{pkg.remitente}</TableCell>
                          <TableCell>{pkg.empresa || '-'}</TableCell>
                          <TableCell>
                            {format(new Date(pkg.fechaLlegada), "dd MMM yyyy HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell>{pkg.ubicacionAlmacen || '-'}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                              {pkg.notas || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {pkg.estado === 'pendiente' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleNotify(pkg.id)}
                                >
                                  <Bell className="h-4 w-4 mr-1" />
                                  Notificar
                                </Button>
                              )}
                              {(pkg.estado === 'pendiente' || pkg.estado === 'notificado') && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCollect(pkg.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Recogido
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPackage(pkg);
                                  setShowDetailDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Nuevo Paquete */}
      <Dialog open={showNewPackageDialog} onOpenChange={setShowNewPackageDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Paquete</DialogTitle>
            <DialogDescription>
              Ingresa los datos del paquete recibido
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Edificio */}
            <div className="space-y-2">
              <Label>Edificio *</Label>
              <Select
                value={newPackage.buildingId}
                onValueChange={v => setNewPackage(prev => ({ ...prev, buildingId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar edificio" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map(building => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destinatario */}
            <div className="space-y-2">
              <Label>Destinatario *</Label>
              <Select
                value={newPackage.tenantId}
                onValueChange={v => setNewPackage(prev => ({ ...prev, tenantId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar inquilino" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.nombreCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Remitente */}
            <div className="space-y-2">
              <Label>Remitente *</Label>
              <Input
                placeholder="Nombre del remitente"
                value={newPackage.remitente}
                onChange={e => setNewPackage(prev => ({ ...prev, remitente: e.target.value }))}
              />
            </div>

            {/* Empresa de envío */}
            <div className="space-y-2">
              <Label>Empresa de envío</Label>
              <Input
                placeholder="Amazon, Correos, SEUR, etc."
                value={newPackage.empresa}
                onChange={e => setNewPackage(prev => ({ ...prev, empresa: e.target.value }))}
              />
            </div>

            {/* Número de seguimiento */}
            <div className="space-y-2">
              <Label>Número de seguimiento</Label>
              <Input
                placeholder="Número de tracking"
                value={newPackage.numeroSeguimiento}
                onChange={e => setNewPackage(prev => ({ ...prev, numeroSeguimiento: e.target.value }))}
              />
            </div>

            {/* Tamaño */}
            <div className="space-y-2">
              <Label>Tamaño del paquete</Label>
              <Select
                value={newPackage.tamano}
                onValueChange={v => setNewPackage(prev => ({ ...prev, tamano: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pequeño">Pequeño (sobre/caja pequeña)</SelectItem>
                  <SelectItem value="mediano">Mediano (caja estándar)</SelectItem>
                  <SelectItem value="grande">Grande (caja grande)</SelectItem>
                  <SelectItem value="muy_grande">Muy grande (palet/voluminoso)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ubicación */}
            <div className="space-y-2">
              <Label>Ubicación de almacenamiento</Label>
              <Input
                placeholder="Ej: Estantería A, Casillero 12"
                value={newPackage.ubicacionAlmacen}
                onChange={e => setNewPackage(prev => ({ ...prev, ubicacionAlmacen: e.target.value }))}
              />
            </div>

            {/* Opciones especiales */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPackage.requiereRefrigeracion}
                  onChange={e => setNewPackage(prev => ({ ...prev, requiereRefrigeracion: e.target.checked }))}
                  className="rounded"
                />
                <Snowflake className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Requiere refrigeración</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPackage.requiereFirma}
                  onChange={e => setNewPackage(prev => ({ ...prev, requiereFirma: e.target.checked }))}
                  className="rounded"
                />
                <PenTool className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Requiere firma</span>
              </label>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label>Notas adicionales</Label>
              <Textarea
                placeholder="Observaciones sobre el paquete..."
                value={newPackage.notas}
                onChange={e => setNewPackage(prev => ({ ...prev, notas: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPackageDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePackage}>
              <Package className="h-4 w-4 mr-2" />
              Registrar Paquete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalle de Paquete */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Paquete</DialogTitle>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Package className="h-12 w-12 text-amber-600" />
                <div>
                  <Badge className={getEstadoColor(selectedPackage.estado)}>
                    {getEstadoIcon(selectedPackage.estado)}
                    <span className="ml-1 capitalize">{selectedPackage.estado}</span>
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(selectedPackage.fechaLlegada), "dd MMMM yyyy HH:mm", { locale: es })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Destinatario</Label>
                  <p className="font-medium">{selectedPackage.tenant?.nombreCompleto}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Remitente</Label>
                  <p className="font-medium">{selectedPackage.remitente}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Empresa</Label>
                  <p className="font-medium">{selectedPackage.empresa || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nº Seguimiento</Label>
                  <p className="font-medium font-mono">{selectedPackage.numeroSeguimiento || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tamaño</Label>
                  <p className="font-medium capitalize">{selectedPackage.tamano || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ubicación</Label>
                  <p className="font-medium">{selectedPackage.ubicacionAlmacen || '-'}</p>
                </div>
              </div>

              {(selectedPackage.requiereRefrigeracion || selectedPackage.requiereFirma) && (
                <div className="flex gap-2">
                  {selectedPackage.requiereRefrigeracion && (
                    <Badge variant="outline" className="text-blue-600">
                      <Snowflake className="h-3 w-3 mr-1" />
                      Requiere refrigeración
                    </Badge>
                  )}
                  {selectedPackage.requiereFirma && (
                    <Badge variant="outline" className="text-purple-600">
                      <PenTool className="h-3 w-3 mr-1" />
                      Requiere firma
                    </Badge>
                  )}
                </div>
              )}

              {selectedPackage.notas && (
                <div>
                  <Label className="text-muted-foreground">Notas</Label>
                  <p className="text-sm">{selectedPackage.notas}</p>
                </div>
              )}

              {selectedPackage.fechaRecogida && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Recogido el {format(new Date(selectedPackage.fechaRecogida), "dd MMMM yyyy HH:mm", { locale: es })}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
