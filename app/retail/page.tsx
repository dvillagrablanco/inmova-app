'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Store,
  Plus,
  Search,
  Filter,
  MapPin,
  Euro,
  Users,
  Ruler,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  MoreVertical,
  Eye,
  Edit,
  FileText,
  BarChart3,
  ShoppingBag,
  Percent,
  Calendar,
  Clock,
  Building2,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface LocalRetail {
  id: string;
  nombre: string;
  direccion: string;
  tipoUbicacion: 'centro_comercial' | 'calle' | 'outlet' | 'galeria';
  superficie: number;
  superficieUtil: number;
  longitudFachada: number;
  estado: 'ocupado' | 'disponible' | 'reservado' | 'reforma';
  rentaBase: number;
  rentaVariable: number;
  porcentajeVentas: number;
  arrendatario?: string;
  sector?: string;
  ventasMensuales?: number;
  horarioComercial: string;
  caracteristicas: string[];
  contratoInicio?: string;
  contratoFin?: string;
}

interface ContratoRetail {
  id: string;
  localId: string;
  localNombre: string;
  arrendatario: string;
  rentaBase: number;
  rentaVariable: number;
  porcentajeVentas: number;
  fechaInicio: string;
  fechaFin: string;
  estado: 'activo' | 'pendiente' | 'vencido' | 'renovacion';
  ultimaFacturacion: number;
  ventasReportadas: number;
}

const estadoColors: Record<string, string> = {
  ocupado: 'bg-green-100 text-green-800',
  disponible: 'bg-blue-100 text-blue-800',
  reservado: 'bg-amber-100 text-amber-800',
  reforma: 'bg-gray-100 text-gray-800',
};

const contratoEstadoColors: Record<string, string> = {
  activo: 'bg-green-100 text-green-800',
  pendiente: 'bg-amber-100 text-amber-800',
  vencido: 'bg-red-100 text-red-800',
  renovacion: 'bg-blue-100 text-blue-800',
};

const tipoUbicacionLabels: Record<string, string> = {
  centro_comercial: 'Centro Comercial',
  calle: 'A pie de calle',
  outlet: 'Outlet',
  galeria: 'Galería Comercial',
};

export default function RetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [locales, setLocales] = useState<LocalRetail[]>([]);
  const [contratos, setContratos] = useState<ContratoRetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [showCreateLocal, setShowCreateLocal] = useState(false);
  const [activeTab, setActiveTab] = useState('locales');
  
  const [newLocal, setNewLocal] = useState({
    nombre: '',
    direccion: '',
    tipoUbicacion: 'centro_comercial' as const,
    superficie: 0,
    superficieUtil: 0,
    longitudFachada: 0,
    rentaBase: 0,
    porcentajeVentas: 0,
    horarioComercial: '10:00-22:00',
    caracteristicas: [] as string[],
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const response = await fetch('/api/retail');
      // const data = await response.json();
      // setLocales(data.locales);
      // setContratos(data.contratos);
      
      // Estado vacío inicial
      setLocales([]);
      setContratos([]);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocal = async () => {
    try {
      // TODO: Integrar con API real
      // const response = await fetch('/api/retail', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newLocal),
      // });
      
      toast.success('Local comercial creado correctamente');
      setShowCreateLocal(false);
      setNewLocal({
        nombre: '',
        direccion: '',
        tipoUbicacion: 'centro_comercial',
        superficie: 0,
        superficieUtil: 0,
        longitudFachada: 0,
        rentaBase: 0,
        porcentajeVentas: 0,
        horarioComercial: '10:00-22:00',
        caracteristicas: [],
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear el local');
    }
  };

  const filteredLocales = locales.filter((local) => {
    const matchesSearch = local.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      local.direccion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEstado = estadoFilter === 'todos' || local.estado === estadoFilter;
    const matchesTipo = tipoFilter === 'todos' || local.tipoUbicacion === tipoFilter;
    return matchesSearch && matchesEstado && matchesTipo;
  });

  // KPIs
  const totalLocales = locales.length;
  const localesOcupados = locales.filter(l => l.estado === 'ocupado').length;
  const tasaOcupacion = totalLocales > 0 ? (localesOcupados / totalLocales) * 100 : 0;
  const ingresosMensuales = locales.reduce((sum, l) => sum + l.rentaBase + (l.rentaVariable || 0), 0);
  const ventasTotales = locales.reduce((sum, l) => sum + (l.ventasMensuales || 0), 0);

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Store className="h-8 w-8 text-green-600" />
                Retail & Locales Comerciales
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestión de locales comerciales y retail
              </p>
            </div>
          </div>
          <Dialog open={showCreateLocal} onOpenChange={setShowCreateLocal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Local
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nuevo Local Comercial</DialogTitle>
                <DialogDescription>
                  Añade un nuevo local comercial o espacio retail
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Nombre del Local</Label>
                    <Input
                      value={newLocal.nombre}
                      onChange={(e) => setNewLocal({...newLocal, nombre: e.target.value})}
                      placeholder="Ej: Local 12B - CC Norte"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tipo de Ubicación</Label>
                    <Select 
                      value={newLocal.tipoUbicacion} 
                      onValueChange={(v: any) => setNewLocal({...newLocal, tipoUbicacion: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="centro_comercial">Centro Comercial</SelectItem>
                        <SelectItem value="calle">A pie de calle</SelectItem>
                        <SelectItem value="outlet">Outlet</SelectItem>
                        <SelectItem value="galeria">Galería Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Dirección</Label>
                  <Input
                    value={newLocal.direccion}
                    onChange={(e) => setNewLocal({...newLocal, direccion: e.target.value})}
                    placeholder="Dirección completa"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Superficie Total (m²)</Label>
                    <Input
                      type="number"
                      value={newLocal.superficie || ''}
                      onChange={(e) => setNewLocal({...newLocal, superficie: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Superficie Útil (m²)</Label>
                    <Input
                      type="number"
                      value={newLocal.superficieUtil || ''}
                      onChange={(e) => setNewLocal({...newLocal, superficieUtil: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fachada (m)</Label>
                    <Input
                      type="number"
                      value={newLocal.longitudFachada || ''}
                      onChange={(e) => setNewLocal({...newLocal, longitudFachada: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Renta Base (€/mes)</Label>
                    <Input
                      type="number"
                      value={newLocal.rentaBase || ''}
                      onChange={(e) => setNewLocal({...newLocal, rentaBase: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>% sobre Ventas</Label>
                    <Input
                      type="number"
                      value={newLocal.porcentajeVentas || ''}
                      onChange={(e) => setNewLocal({...newLocal, porcentajeVentas: parseFloat(e.target.value) || 0})}
                      placeholder="Ej: 5"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Horario Comercial</Label>
                    <Input
                      value={newLocal.horarioComercial}
                      onChange={(e) => setNewLocal({...newLocal, horarioComercial: e.target.value})}
                      placeholder="10:00-22:00"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Características</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Fachada', 'Escaparate', 'Climatización', 'Salida Humos', 'Almacén', 'Doble Altura', 'Acceso Carga'].map((carac) => (
                      <Badge
                        key={carac}
                        variant={newLocal.caracteristicas.includes(carac) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          if (newLocal.caracteristicas.includes(carac)) {
                            setNewLocal({...newLocal, caracteristicas: newLocal.caracteristicas.filter(c => c !== carac)});
                          } else {
                            setNewLocal({...newLocal, caracteristicas: [...newLocal.caracteristicas, carac]});
                          }
                        }}
                      >
                        {carac}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateLocal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateLocal}>
                  Crear Local
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Locales</p>
                  <p className="text-2xl font-bold">{totalLocales}</p>
                </div>
                <Store className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ocupados</p>
                  <p className="text-2xl font-bold text-green-600">{localesOcupados}</p>
                </div>
                <Users className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasa Ocupación</p>
                  <p className="text-2xl font-bold">{tasaOcupacion.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos/mes</p>
                  <p className="text-2xl font-bold">{ingresosMensuales.toLocaleString('es-ES')}€</p>
                </div>
                <Euro className="h-8 w-8 text-amber-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ventas Totales</p>
                  <p className="text-2xl font-bold">{ventasTotales.toLocaleString('es-ES')}€</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="locales">Locales</TabsTrigger>
            <TabsTrigger value="contratos">Contratos</TabsTrigger>
            <TabsTrigger value="facturacion">Facturación Variable</TabsTrigger>
            <TabsTrigger value="analisis">Análisis Ventas</TabsTrigger>
          </TabsList>

          <TabsContent value="locales" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar local..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="disponible">Disponibles</SelectItem>
                      <SelectItem value="ocupado">Ocupados</SelectItem>
                      <SelectItem value="reservado">Reservados</SelectItem>
                      <SelectItem value="reforma">En reforma</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="centro_comercial">Centro Comercial</SelectItem>
                      <SelectItem value="calle">A pie de calle</SelectItem>
                      <SelectItem value="outlet">Outlet</SelectItem>
                      <SelectItem value="galeria">Galería</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Locales */}
            {filteredLocales.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay locales comerciales</h3>
                  <p className="text-muted-foreground mb-4">
                    Añade tu primer local comercial para empezar
                  </p>
                  <Button onClick={() => setShowCreateLocal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Local
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLocales.map((local) => (
                  <Card key={local.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-40 bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                      <Store className="h-16 w-16 text-green-300" />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{local.nombre}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {local.direccion}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 mr-2" />
                              Ver contrato
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Análisis ventas
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={estadoColors[local.estado]}>
                          {local.estado.charAt(0).toUpperCase() + local.estado.slice(1)}
                        </Badge>
                        <Badge variant="outline">
                          {tipoUbicacionLabels[local.tipoUbicacion]}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Ruler className="h-4 w-4" />
                          {local.superficieUtil} m² útiles
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Euro className="h-4 w-4" />
                          {local.rentaBase.toLocaleString('es-ES')}€/mes
                        </div>
                      </div>

                      {local.porcentajeVentas > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Percent className="h-4 w-4" />
                          +{local.porcentajeVentas}% sobre ventas
                        </div>
                      )}

                      {local.arrendatario && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-muted-foreground">{local.arrendatario}</span>
                            {local.sector && (
                              <Badge variant="outline" className="text-xs">{local.sector}</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <Button variant="outline" className="w-full" size="sm">
                        Ver detalles
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contratos" className="space-y-4">
            {contratos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay contratos</h3>
                  <p className="text-muted-foreground">
                    Los contratos de locales aparecerán aquí
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium">Local</th>
                          <th className="text-left p-4 font-medium">Arrendatario</th>
                          <th className="text-left p-4 font-medium">Renta Base</th>
                          <th className="text-left p-4 font-medium">% Ventas</th>
                          <th className="text-left p-4 font-medium">Vigencia</th>
                          <th className="text-left p-4 font-medium">Estado</th>
                          <th className="text-right p-4 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contratos.map((contrato) => (
                          <tr key={contrato.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-medium">{contrato.localNombre}</td>
                            <td className="p-4">{contrato.arrendatario}</td>
                            <td className="p-4">{contrato.rentaBase.toLocaleString('es-ES')}€</td>
                            <td className="p-4">{contrato.porcentajeVentas}%</td>
                            <td className="p-4">{contrato.fechaInicio} - {contrato.fechaFin}</td>
                            <td className="p-4">
                              <Badge className={contratoEstadoColors[contrato.estado]}>
                                {contrato.estado}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="facturacion" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <Percent className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Facturación Variable</h3>
                <p className="text-muted-foreground mb-4">
                  Control de facturación sobre ventas
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analisis" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Análisis de Ventas</h3>
                <p className="text-muted-foreground mb-4">
                  Estadísticas y métricas de rendimiento por local
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
