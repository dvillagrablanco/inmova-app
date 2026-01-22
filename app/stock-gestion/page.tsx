'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Package,
  Home,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface UnidadStock {
  id: string;
  nombre: string;
  edificio: string;
  tipo: string;
  estado: 'disponible' | 'ocupada' | 'reservada' | 'mantenimiento';
  precio: number;
  ultimaActualizacion: string;
}

export default function StockGestionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [unidades, setUnidades] = useState<UnidadStock[]>([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchStock();
    }
  }, [status, router]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/units');
      if (res.ok) {
        const data = await res.json();
        const unidadesData = (Array.isArray(data) ? data : data.units || []).map((u: any) => ({
          id: u.id,
          nombre: u.nombre || u.codigo || `Unidad ${u.id.slice(-4)}`,
          edificio: u.building?.nombre || u.edificio || 'Sin asignar',
          tipo: u.tipo || 'vivienda',
          estado: u.estado || 'disponible',
          precio: u.precioRenta || u.precio || 0,
          ultimaActualizacion: u.updatedAt || u.createdAt,
        }));
        setUnidades(unidadesData);
      }
    } catch (error) {
      console.error('Error al cargar stock:', error);
      toast.error('Error al cargar datos de stock');
    } finally {
      setLoading(false);
    }
  };

  const unidadesFiltradas = unidades.filter(u =>
    !busqueda || u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.edificio.toLowerCase().includes(busqueda.toLowerCase())
  );

  const estadisticas = {
    total: unidades.length,
    disponibles: unidades.filter(u => u.estado === 'disponible').length,
    ocupadas: unidades.filter(u => u.estado === 'ocupada').length,
    reservadas: unidades.filter(u => u.estado === 'reservada').length,
    mantenimiento: unidades.filter(u => u.estado === 'mantenimiento').length,
  };

  const tasaOcupacion = estadisticas.total > 0
    ? Math.round((estadisticas.ocupadas / estadisticas.total) * 100)
    : 0;

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'ocupada': return 'bg-blue-100 text-blue-800';
      case 'reservada': return 'bg-yellow-100 text-yellow-800';
      case 'mantenimiento': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Stock</h1>
            <p className="text-muted-foreground">Control de inventario de propiedades disponibles</p>
          </div>
          <Button onClick={fetchStock} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.total}</p>
                  <p className="text-sm text-muted-foreground">Total Unidades</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.disponibles}</p>
                  <p className="text-sm text-muted-foreground">Disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.ocupadas}</p>
                  <p className="text-sm text-muted-foreground">Ocupadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.reservadas}</p>
                  <p className="text-sm text-muted-foreground">Reservadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Ocupación</p>
                  <p className="text-sm font-medium">{tasaOcupacion}%</p>
                </div>
                <Progress value={tasaOcupacion} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar unidades..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Edificio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Actualización</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unidadesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No hay unidades que mostrar</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  unidadesFiltradas.map((unidad) => (
                    <TableRow key={unidad.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{unidad.nombre}</TableCell>
                      <TableCell>{unidad.edificio}</TableCell>
                      <TableCell className="capitalize">{unidad.tipo}</TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(unidad.estado)}>
                          {unidad.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(unidad.precio)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {unidad.ultimaActualizacion
                          ? new Date(unidad.ultimaActualizacion).toLocaleDateString('es-ES')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
