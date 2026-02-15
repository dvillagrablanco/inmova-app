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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  MapPin,
  Search,
  Home,
  ArrowLeft,
  Plus,
  Building2,
  Warehouse,
  RefreshCw,
  Package,
  Edit,
  Trash2,
  Grid,
  List,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface Location {
  id: string;
  nombre: string;
  tipo: 'almacen' | 'estanteria' | 'seccion' | 'otro';
  descripcion?: string;
  capacidad?: number;
  ocupacion: number;
  buildingId?: string;
  building?: { nombre: string };
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function WarehouseLocationsPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [buildings, setBuildings] = useState<{ id: string; nombre: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewLocationDialog, setShowNewLocationDialog] = useState(false);

  const [newLocation, setNewLocation] = useState({
    nombre: '',
    tipo: 'almacen' as const,
    descripcion: '',
    capacidad: 100,
    buildingId: '',
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

      // Cargar inventario para extraer ubicaciones únicas
      const inventoryRes = await fetch('/api/warehouse/inventory');
      if (inventoryRes.ok) {
        const data = await inventoryRes.json();
        const items = data.data || [];
        
        // Extraer ubicaciones únicas
        const locationMap = new Map<string, Location>();
        items.forEach((item: any) => {
          const locName = item.ubicacion || 'Sin asignar';
          if (!locationMap.has(locName)) {
            locationMap.set(locName, {
              id: locName,
              nombre: locName,
              tipo: 'estanteria',
              ocupacion: 1,
              buildingId: item.buildingId,
              building: item.building,
            });
          } else {
            const loc = locationMap.get(locName)!;
            loc.ocupacion += 1;
          }
        });
        
        setLocations(Array.from(locationMap.values()));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar ubicaciones
  const filteredLocations = locations.filter(loc =>
    loc.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener icono del tipo
  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'almacen': return <Warehouse className="h-8 w-8" />;
      case 'estanteria': return <Grid className="h-8 w-8" />;
      case 'seccion': return <MapPin className="h-8 w-8" />;
      default: return <Package className="h-8 w-8" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/warehouse')}>
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
                <BreadcrumbLink href="/warehouse">Warehouse</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Ubicaciones</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Ubicaciones</h1>
              <p className="text-muted-foreground">
                Gestión de almacenes y estanterías
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{locations.length}</p>
                  <p className="text-xs text-muted-foreground">Total Ubicaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Warehouse className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {locations.filter(l => l.tipo === 'almacen').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Almacenes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Grid className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {locations.filter(l => l.tipo === 'estanteria').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Estanterías</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {locations.reduce((sum, l) => sum + l.ocupacion, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Items Almacenados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ubicación..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grid de ubicaciones */}
        {filteredLocations.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No hay ubicaciones</h3>
              <p className="text-muted-foreground">
                Las ubicaciones se crean automáticamente al agregar items de inventario
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocations.map(location => (
              <Card key={location.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      {getTypeIcon(location.tipo)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{location.nombre}</h3>
                      <Badge variant="outline" className="capitalize mt-1">
                        {location.tipo}
                      </Badge>
                      {location.building && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {location.building.nombre}
                        </p>
                      )}
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Items almacenados</span>
                          <span className="font-medium">{location.ocupacion}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredLocations.map(location => (
                  <div key={location.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        {getTypeIcon(location.tipo)}
                      </div>
                      <div>
                        <p className="font-medium">{location.nombre}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="capitalize text-xs">
                            {location.tipo}
                          </Badge>
                          {location.building && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {location.building.nombre}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{location.ocupacion}</p>
                      <p className="text-xs text-muted-foreground">items</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
