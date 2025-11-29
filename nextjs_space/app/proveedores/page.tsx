'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Users, Plus, Phone, Mail, Star, ArrowLeft, Home, Search, Briefcase, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Provider {
  id: string;
  nombre: string;
  tipo: string;
  telefono: string;
  email?: string;
  rating?: number;
  _count?: {
    maintenanceRequests: number;
    expenses: number;
  };
}

export default function ProveedoresPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { canCreate } = usePermissions();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    tipo: '',
    telefono: '',
    email: '',
    direccion: '',
    rating: '',
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchProviders();
    }
  }, [session]);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.tipo || !form.telefono) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rating: form.rating ? parseFloat(form.rating) : null,
        }),
      });

      if (res.ok) {
        toast.success('Proveedor creado exitosamente');
        setOpenDialog(false);
        setForm({ nombre: '', tipo: '', telefono: '', email: '', direccion: '', rating: '', notas: '' });
        fetchProviders();
      } else {
        toast.error('Error al crear proveedor');
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      toast.error('Error al crear proveedor');
    }
  };

  // Filtrado de proveedores
  const filteredProviders = useMemo(() => {
    return providers.filter(provider =>
      searchTerm === '' ||
      provider.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [providers, searchTerm]);

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: providers.length,
      conTrabajos: providers.filter(p => (p._count?.maintenanceRequests || 0) > 0).length,
      rating5: providers.filter(p => p.rating === 5).length,
      totalTrabajos: providers.reduce((sum, p) => sum + (p._count?.maintenanceRequests || 0), 0),
    };
  }, [providers]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
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
                    <BreadcrumbPage>Proveedores</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
                <p className="text-muted-foreground">
                  Gestiona los proveedores de servicios
                </p>
              </div>
              {canCreate && (
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Proveedor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuevo Proveedor</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input
                          id="nombre"
                          value={form.nombre}
                          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipo">Tipo de servicio *</Label>
                        <Input
                          id="tipo"
                          value={form.tipo}
                          onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                          placeholder="Ej: Fontanería, Electricidad, Limpieza..."
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefono">Teléfono *</Label>
                        <Input
                          id="telefono"
                          type="tel"
                          value={form.telefono}
                          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="direccion">Dirección</Label>
                        <Input
                          id="direccion"
                          value={form.direccion}
                          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="rating">Valoración (1-5)</Label>
                        <Input
                          id="rating"
                          type="number"
                          min="1"
                          max="5"
                          step="0.5"
                          value={form.rating}
                          onChange={(e) => setForm({ ...form, rating: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="notas">Notas</Label>
                        <Input
                          id="notas"
                          value={form.notas}
                          onChange={(e) => setForm({ ...form, notas: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          Crear Proveedor
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Con Trabajos
                  </CardTitle>
                  <Briefcase className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.conTrabajos}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Rating 5⭐
                  </CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.rating5}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Trabajos
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTrabajos}</div>
                </CardContent>
              </Card>
            </div>

            {/* Búsqueda */}
            <Card>
              <CardHeader>
                <CardTitle>Buscar Proveedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, tipo o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lista de Proveedores */}
            <div className="space-y-4">
              {filteredProviders.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center mb-2">
                      {searchTerm
                        ? 'No se encontraron proveedores con los filtros aplicados'
                        : 'No hay proveedores registrados'}
                    </p>
                    {canCreate && !searchTerm && (
                      <Button
                        onClick={() => setOpenDialog(true)}
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Primer Proveedor
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredProviders.map((provider) => (
                  <Card key={provider.id} className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Icono */}
                        <div className="flex-shrink-0">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <Briefcase className="h-6 w-6 text-primary" />
                          </div>
                        </div>

                        {/* Información Principal */}
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h3 className="text-lg font-semibold break-words flex-1">
                              {provider.nombre}
                            </h3>
                            <Badge variant="outline">{provider.tipo}</Badge>
                          </div>

                          {/* Contacto */}
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-primary" />
                              <a href={`tel:${provider.telefono}`} className="font-medium hover:underline">
                                {provider.telefono}
                              </a>
                            </div>
                            {provider.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-primary" />
                                <a href={`mailto:${provider.email}`} className="font-medium hover:underline">
                                  {provider.email}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Estadísticas */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {provider.rating && (
                              <div className="space-y-1">
                                <div className="text-muted-foreground flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  Valoración
                                </div>
                                <div className="font-bold text-lg">
                                  {provider.rating}/5
                                </div>
                              </div>
                            )}
                            {provider._count && (
                              <div className="space-y-1">
                                <div className="text-muted-foreground">Trabajos Realizados</div>
                                <div className="font-bold text-lg">
                                  {provider._count.maintenanceRequests || 0}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
