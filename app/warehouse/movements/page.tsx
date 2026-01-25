'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Search,
  Home,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS
// ============================================================================

interface Movement {
  id: string;
  inventoryId: string;
  inventory?: {
    id: string;
    nombre: string;
    categoria: string;
  };
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo?: string;
  fecha: string;
  createdAt: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function WarehouseMovementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadMovements();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/warehouse/movements?limit=100');
      if (response.ok) {
        const data = await response.json();
        setMovements(data.data || []);
      }
    } catch (error) {
      console.error('Error loading movements:', error);
      toast.error('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = {
    total: movements.length,
    entradas: movements.filter(m => m.tipo === 'entrada').length,
    salidas: movements.filter(m => m.tipo === 'salida').length,
    ajustes: movements.filter(m => m.tipo === 'ajuste').length,
  };

  // Filtrar movimientos
  const filteredMovements = movements.filter(mov => {
    const matchesSearch = 
      mov.inventory?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.motivo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'all' || mov.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  // Obtener icono y color del tipo
  const getTypeInfo = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return {
          icon: <ArrowUpRight className="h-4 w-4" />,
          color: 'bg-green-100 text-green-700',
          label: 'Entrada',
        };
      case 'salida':
        return {
          icon: <ArrowDownRight className="h-4 w-4" />,
          color: 'bg-red-100 text-red-700',
          label: 'Salida',
        };
      case 'ajuste':
        return {
          icon: <ArrowLeftRight className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-700',
          label: 'Ajuste',
        };
      default:
        return {
          icon: <Package className="h-4 w-4" />,
          color: 'bg-gray-100 text-gray-700',
          label: tipo,
        };
    }
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
                <BreadcrumbPage>Movimientos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Movimientos</h1>
              <p className="text-muted-foreground">
                Historial de entradas, salidas y ajustes
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={loadMovements}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Movimientos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.entradas}</p>
                  <p className="text-xs text-muted-foreground">Entradas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.salidas}</p>
                  <p className="text-xs text-muted-foreground">Salidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <ArrowLeftRight className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.ajustes}</p>
                  <p className="text-xs text-muted-foreground">Ajustes</p>
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
              placeholder="Buscar por item o motivo..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="entrada">
                <span className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  Entradas
                </span>
              </SelectItem>
              <SelectItem value="salida">
                <span className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                  Salidas
                </span>
              </SelectItem>
              <SelectItem value="ajuste">
                <span className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-blue-600" />
                  Ajustes
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla de movimientos */}
        <Card>
          <CardContent className="p-0">
            {filteredMovements.length === 0 ? (
              <div className="py-16 text-center">
                <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No hay movimientos</h3>
                <p className="text-muted-foreground">
                  Los movimientos aparecerán cuando registres entradas o salidas
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map(mov => {
                    const typeInfo = getTypeInfo(mov.tipo);
                    return (
                      <TableRow key={mov.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(mov.fecha), "dd MMM yyyy HH:mm", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeInfo.color}>
                            {typeInfo.icon}
                            <span className="ml-1">{typeInfo.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{mov.inventory?.nombre || 'Item'}</p>
                            {mov.inventory?.categoria && (
                              <p className="text-xs text-muted-foreground capitalize">
                                {mov.inventory.categoria}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${
                            mov.tipo === 'entrada' ? 'text-green-600' :
                            mov.tipo === 'salida' ? 'text-red-600' : ''
                          }`}>
                            {mov.tipo === 'entrada' ? '+' : mov.tipo === 'salida' ? '-' : ''}
                            {mov.cantidad}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {mov.motivo || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
