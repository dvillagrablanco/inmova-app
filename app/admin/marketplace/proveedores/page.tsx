'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Building2,
  Mail,
  Phone,
  Globe,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Pencil,
  Trash2,
  Eye,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Provider {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  website: string | null;
  direccion: string | null;
  descripcion: string | null;
  categoria: string;
  serviciosCount: number;
  rating: number;
  transaccionesTotal: number;
  estado: 'active' | 'pending' | 'suspended';
  createdAt: string;
}

export default function MarketplaceProveedoresPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    website: '',
    categoria: '',
    descripcion: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      setProviders([
        {
          id: '1',
          nombre: 'Mapfre Seguros',
          email: 'partners@mapfre.es',
          telefono: '+34 900 100 100',
          website: 'https://www.mapfre.es',
          direccion: 'Madrid, España',
          descripcion: 'Líder en seguros de alquiler y protección del hogar',
          categoria: 'Seguros',
          serviciosCount: 5,
          rating: 4.8,
          transaccionesTotal: 12500,
          estado: 'active',
          createdAt: '2025-06-15',
        },
        {
          id: '2',
          nombre: 'CertiHome',
          email: 'colaboradores@certihome.es',
          telefono: '+34 912 345 678',
          website: 'https://www.certihome.es',
          direccion: 'Barcelona, España',
          descripcion: 'Certificados energéticos y tasaciones homologadas',
          categoria: 'Certificaciones',
          serviciosCount: 3,
          rating: 4.6,
          transaccionesTotal: 8900,
          estado: 'active',
          createdAt: '2025-07-20',
        },
        {
          id: '3',
          nombre: 'CleanPro Services',
          email: 'comercial@cleanpro.com',
          telefono: '+34 666 123 456',
          website: 'https://www.cleanpro.com',
          direccion: 'Valencia, España',
          descripcion: 'Servicios de limpieza profesional para inmuebles',
          categoria: 'Mantenimiento',
          serviciosCount: 8,
          rating: 4.5,
          transaccionesTotal: 5600,
          estado: 'active',
          createdAt: '2025-08-10',
        },
        {
          id: '4',
          nombre: 'StageIt Design',
          email: 'info@stageit.es',
          telefono: '+34 934 567 890',
          website: null,
          direccion: 'Málaga, España',
          descripcion: 'Home Staging y fotografía inmobiliaria profesional',
          categoria: 'Marketing',
          serviciosCount: 4,
          rating: 4.9,
          transaccionesTotal: 3200,
          estado: 'pending',
          createdAt: '2026-01-02',
        },
      ]);
    } catch (error) {
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async () => {
    if (!formData.nombre || !formData.email || !formData.categoria) {
      toast.error('Nombre, email y categoría son obligatorios');
      return;
    }
    toast.success('Proveedor creado correctamente');
    setCreateDialogOpen(false);
    setFormData({ nombre: '', email: '', telefono: '', website: '', categoria: '', descripcion: '' });
    loadData();
  };

  const handleApprove = async (id: string) => {
    toast.success('Proveedor aprobado');
    loadData();
  };

  const handleSuspend = async (id: string) => {
    toast.success('Proveedor suspendido');
    loadData();
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Activo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Suspendido</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proveedores del Marketplace</h1>
            <p className="text-gray-600 mt-1">Gestiona los proveedores de servicios del marketplace</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Proveedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Añadir Proveedor</DialogTitle>
                <DialogDescription>
                  Registra un nuevo proveedor en el marketplace
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre Empresa *</Label>
                  <Input
                    placeholder="Nombre del proveedor"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="email@proveedor.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      placeholder="+34 600 000 000"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoría *</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Seguros">Seguros</SelectItem>
                        <SelectItem value="Certificaciones">Certificaciones</SelectItem>
                        <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="Limpieza">Limpieza</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                        <SelectItem value="Otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      placeholder="https://..."
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Breve descripción del proveedor..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateProvider}>
                  Crear Proveedor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Proveedores</p>
                  <p className="text-2xl font-bold">{providers.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {providers.filter(p => p.estado === 'active').length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {providers.filter(p => p.estado === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Rating Medio</p>
                  <p className="text-2xl font-bold">
                    {(providers.reduce((acc, p) => acc + p.rating, 0) / providers.length || 0).toFixed(1)} ⭐
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar proveedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="suspended">Suspendidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Servicios</TableHead>
                  <TableHead className="text-right">Transacciones</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{provider.nombre}</p>
                        {provider.direccion && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {provider.direccion}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{provider.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {provider.email}
                        </p>
                        {provider.telefono && (
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {provider.telefono}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{provider.serviciosCount}</TableCell>
                    <TableCell className="text-right">{provider.transaccionesTotal.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        {provider.rating}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(provider.estado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" title="Ver detalles">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {provider.estado === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(provider.id)}
                          >
                            Aprobar
                          </Button>
                        )}
                        {provider.estado === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuspend(provider.id)}
                            className="text-red-600"
                          >
                            Suspender
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
