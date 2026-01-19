'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Plus,
  Search,
  Eye,
  Edit,
  MoreHorizontal,
  Users,
  Euro,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Comunidad {
  id: string;
  nombreComunidad: string;
  cif: string | null;
  direccion: string;
  ciudad: string | null;
  activa: boolean;
  totalUnidades: number;
  facturasPendientes: number;
  importePendiente: number;
  building: {
    id: string;
    name: string;
  } | null;
}

interface Building {
  id: string;
  name: string;
  address: string;
}

export default function ListaComunidadesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [stats, setStats] = useState({ total: 0, activas: 0, inactivas: 0 });

  // Form state
  const [formData, setFormData] = useState({
    buildingId: '',
    nombreComunidad: '',
    cif: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchComunidades();
      fetchBuildings();
    }
  }, [status, router]);

  const fetchComunidades = async () => {
    try {
      const res = await fetch(`/api/comunidades?search=${search}`);
      if (res.ok) {
        const data = await res.json();
        setComunidades(data.comunidades || []);
        setStats(data.stats || { total: 0, activas: 0, inactivas: 0 });
      }
    } catch (error) {
      console.error('Error fetching comunidades:', error);
      toast.error('Error al cargar comunidades');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const res = await fetch('/api/buildings');
      if (res.ok) {
        const data = await res.json();
        setBuildings(data.buildings || data || []);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.buildingId || !formData.nombreComunidad || !formData.direccion) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const res = await fetch('/api/comunidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Comunidad creada correctamente');
        setShowDialog(false);
        setFormData({
          buildingId: '',
          nombreComunidad: '',
          cif: '',
          direccion: '',
          ciudad: '',
          provincia: '',
          codigoPostal: '',
        });
        fetchComunidades();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear comunidad');
      }
    } catch (error) {
      toast.error('Error al crear comunidad');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Comunidades de Propietarios</h1>
            <p className="text-muted-foreground">
              Gestiona todas las comunidades bajo tu administración
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Comunidad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva Comunidad</DialogTitle>
                <DialogDescription>
                  Crea una nueva comunidad de propietarios asociada a un edificio
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="building">Edificio *</Label>
                  <Select
                    value={formData.buildingId}
                    onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un edificio" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre de la Comunidad *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombreComunidad}
                    onChange={(e) => setFormData({ ...formData, nombreComunidad: e.target.value })}
                    placeholder="Comunidad de Propietarios..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cif">CIF</Label>
                  <Input
                    id="cif"
                    value={formData.cif}
                    onChange={(e) => setFormData({ ...formData, cif: e.target.value })}
                    placeholder="H12345678"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="direccion">Dirección *</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Calle Example, 123"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="codigoPostal">Código Postal</Label>
                    <Input
                      id="codigoPostal"
                      value={formData.codigoPostal}
                      onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Crear Comunidad</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Comunidades</CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comunidades Activas</CardTitle>
              <Users className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inactivas</CardTitle>
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.inactivas}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar comunidades..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchComunidades()}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={fetchComunidades}>
            Buscar
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comunidad</TableHead>
                  <TableHead>Edificio</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comunidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay comunidades registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  comunidades.map((comunidad) => (
                    <TableRow key={comunidad.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{comunidad.nombreComunidad}</div>
                          <div className="text-sm text-muted-foreground">{comunidad.direccion}</div>
                        </div>
                      </TableCell>
                      <TableCell>{comunidad.building?.name || '-'}</TableCell>
                      <TableCell>{comunidad.totalUnidades}</TableCell>
                      <TableCell>
                        <Badge variant={comunidad.activa ? 'default' : 'secondary'}>
                          {comunidad.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {comunidad.importePendiente > 0 ? (
                          <span className="text-red-600 font-medium">
                            {comunidad.importePendiente.toLocaleString('es-ES')}€
                          </span>
                        ) : (
                          <span className="text-green-600">Al día</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/comunidades/${comunidad.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/comunidades/${comunidad.id}/editar`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
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
