'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  Home,
  Crown,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface Propietario {
  id: string;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  dni: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  tipo: string;
  activo: boolean;
}

interface Unidad {
  id: string;
  unitNumber: string;
  type: string;
  status: string;
  squareMeters: number | null;
  tieneInquilino: boolean;
  inquilino: any | null;
}

export default function PropietariosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: _session, status } = useSession();
  const [propietarios, setPropietarios] = useState<Propietario[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [stats, setStats] = useState({
    totalPropietarios: 0,
    totalUnidades: 0,
    unidadesOcupadas: 0,
    unidadesDisponibles: 0,
  });

  const comunidadId = searchParams.get('comunidadId');
  const buildingId = searchParams.get('buildingId');

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    email: '',
    telefono: '',
    direccionCorrespondencia: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchPropietarios();
    }
  }, [status, router, comunidadId, buildingId]);

  const fetchPropietarios = async () => {
    try {
      const params = new URLSearchParams();
      if (comunidadId) params.append('comunidadId', comunidadId);
      if (buildingId) params.append('buildingId', buildingId);

      const res = await fetch(`/api/comunidades/propietarios?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPropietarios(data.propietarios || []);
        setUnidades(data.unidades || []);
        setStats(data.stats || {
          totalPropietarios: 0,
          totalUnidades: 0,
          unidadesOcupadas: 0,
          unidadesDisponibles: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching propietarios:', error);
      toast.error('Error al cargar propietarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.nombre || !formData.apellidos) {
      toast.error('Nombre y apellidos son obligatorios');
      return;
    }

    try {
      const res = await fetch('/api/comunidades/propietarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          buildingId: buildingId || '',
        }),
      });

      if (res.ok) {
        toast.success('Propietario creado correctamente');
        setShowDialog(false);
        setFormData({
          nombre: '',
          apellidos: '',
          dni: '',
          email: '',
          telefono: '',
          direccionCorrespondencia: '',
        });
        fetchPropietarios();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear propietario');
      }
    } catch (error) {
      toast.error('Error al crear propietario');
    }
  };

  const filteredPropietarios = propietarios.filter(
    (p) =>
      p.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.dni?.toLowerCase().includes(search.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
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
            <h1 className="text-3xl font-bold">Propietarios</h1>
            <p className="text-muted-foreground">
              Gestión de propietarios y unidades de la comunidad
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Propietario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Propietario</DialogTitle>
                <DialogDescription>Registra un nuevo propietario en la comunidad</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="apellidos">Apellidos *</Label>
                    <Input
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dni">DNI/NIE</Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    placeholder="12345678A"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="direccion">Dirección de Correspondencia</Label>
                  <Input
                    id="direccion"
                    value={formData.direccionCorrespondencia}
                    onChange={(e) =>
                      setFormData({ ...formData, direccionCorrespondencia: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Crear Propietario</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Propietarios</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPropietarios}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUnidades}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ocupadas</CardTitle>
              <UserCheck className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.unidadesOcupadas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
              <Home className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.unidadesDisponibles}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar propietarios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Propietarios Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Propietarios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPropietarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No hay propietarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPropietarios.map((propietario) => (
                    <TableRow key={propietario.id}>
                      <TableCell>
                        <div className="font-medium">{propietario.nombreCompleto}</div>
                      </TableCell>
                      <TableCell>{propietario.dni || '-'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {propietario.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3" />
                              {propietario.email}
                            </div>
                          )}
                          {propietario.telefono && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              {propietario.telefono}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={propietario.activo ? 'default' : 'secondary'}>
                          {propietario.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Unidades */}
        <Card>
          <CardHeader>
            <CardTitle>Unidades de la Comunidad</CardTitle>
            <CardDescription>Viviendas y locales del edificio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {unidades.map((unidad) => (
                <Card
                  key={unidad.id}
                  className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
                    unidad.tieneInquilino ? 'border-green-200 bg-green-50' : ''
                  }`}
                >
                  <div className="font-medium">{unidad.unitNumber}</div>
                  <div className="text-xs text-muted-foreground capitalize">{unidad.type}</div>
                  {unidad.squareMeters && (
                    <div className="text-xs text-muted-foreground">{unidad.squareMeters} m²</div>
                  )}
                  <Badge
                    variant={unidad.tieneInquilino ? 'default' : 'secondary'}
                    className="mt-2 text-xs"
                  >
                    {unidad.tieneInquilino ? 'Ocupada' : 'Disponible'}
                  </Badge>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
