'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal,
  Mail,
  Phone,
  Home,
  Calendar,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface Tenant {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  dni: string;
  fechaNacimiento?: string;
  notas?: string;
  units?: Array<{
    id: string;
    numero: string;
    building?: {
      id: string;
      nombre: string;
    };
  }>;
  contracts?: Array<{
    id: string;
    estado: string;
    fechaInicio: string;
    fechaFin: string;
  }>;
  createdAt: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTenant, setNewTenant] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    dni: '',
  });

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tenants');
      if (response.ok) {
        const data = await response.json();
        setTenants(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Error al cargar inquilinos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTenant),
      });

      if (response.ok) {
        toast.success('Inquilino creado correctamente');
        setIsDialogOpen(false);
        setNewTenant({ nombre: '', apellidos: '', email: '', telefono: '', dni: '' });
        fetchTenants();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear inquilino');
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error('Error al crear inquilino');
    } finally {
      setSaving(false);
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.telefono?.includes(searchTerm) ||
    tenant.dni?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeContracts = tenants.filter(t => 
    t.contracts?.some(c => c.estado === 'activo')
  ).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inquilinos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus inquilinos y sus contratos
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={fetchTenants}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Inquilino
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Inquilino</DialogTitle>
                <DialogDescription>
                  Agrega un nuevo inquilino al sistema
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTenant}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={newTenant.nombre}
                        onChange={(e) => setNewTenant({ ...newTenant, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="apellidos">Apellidos</Label>
                      <Input
                        id="apellidos"
                        value={newTenant.apellidos}
                        onChange={(e) => setNewTenant({ ...newTenant, apellidos: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTenant.email}
                      onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={newTenant.telefono}
                        onChange={(e) => setNewTenant({ ...newTenant, telefono: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dni">DNI/NIE</Label>
                      <Input
                        id="dni"
                        value={newTenant.dni}
                        onChange={(e) => setNewTenant({ ...newTenant, dni: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Guardando...' : 'Crear Inquilino'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Inquilinos</p>
                <p className="text-2xl font-bold">{tenants.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Con Contrato Activo</p>
                <p className="text-2xl font-bold">{activeContracts}</p>
              </div>
              <Home className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Sin Contrato</p>
                <p className="text-2xl font-bold">{tenants.length - activeContracts}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, email, teléfono o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay inquilinos</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No se encontraron inquilinos con ese criterio' : 'Comienza agregando tu primer inquilino'}
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Inquilino
            </Button>
          </div>
        ) : (
          filteredTenants.map((tenant) => {
            const hasActiveContract = tenant.contracts?.some(c => c.estado === 'activo');
            return (
              <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {tenant.nombreCompleto}
                        {hasActiveContract ? (
                          <Badge className="bg-green-100 text-green-800">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Sin contrato</Badge>
                        )}
                      </CardTitle>
                      {tenant.dni && (
                        <CardDescription>DNI: {tenant.dni}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/inquilinos/${tenant.id}`}>Ver detalles</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/inquilinos/${tenant.id}/editar`}>Editar</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/contratos/nuevo?tenantId=${tenant.id}`}>Crear contrato</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tenant.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <a href={`mailto:${tenant.email}`} className="hover:text-blue-600">
                          {tenant.email}
                        </a>
                      </div>
                    )}
                    {tenant.telefono && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <a href={`tel:${tenant.telefono}`} className="hover:text-blue-600">
                          {tenant.telefono}
                        </a>
                      </div>
                    )}
                    {tenant.units && tenant.units.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Home className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {tenant.units[0].building?.nombre} - {tenant.units[0].numero}
                        </span>
                      </div>
                    )}
                  </div>
                  {tenant.contracts && tenant.contracts.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">Contrato activo</p>
                      <p className="text-sm">
                        {new Date(tenant.contracts[0].fechaInicio).toLocaleDateString()} - {new Date(tenant.contracts[0].fechaFin).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
