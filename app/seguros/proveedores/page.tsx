'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Globe,
  CheckCircle2,
  XCircle,
  Shield,
  FileText,
  Send,
  Home,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const INSURANCE_TYPE_OPTIONS = [
  { value: 'incendio', label: 'Incendio' },
  { value: 'robo', label: 'Robo' },
  { value: 'responsabilidad_civil', label: 'Responsabilidad Civil' },
  { value: 'hogar', label: 'Hogar' },
  { value: 'comunidad', label: 'Comunidad' },
  { value: 'vida', label: 'Vida' },
  { value: 'accidentes', label: 'Accidentes' },
  { value: 'impago_alquiler', label: 'Impago Alquiler' },
  { value: 'otro', label: 'Otro' },
];

const TIPO_SEGURO_LABELS: Record<string, string> = Object.fromEntries(
  INSURANCE_TYPE_OPTIONS.map((t) => [t.value, t.label])
);

interface InsuranceProvider {
  id: string;
  nombre: string;
  cif?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  codigoPostal?: string | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  contactoNombre?: string | null;
  contactoEmail?: string | null;
  contactoTelefono?: string | null;
  contactoCargo?: string | null;
  tiposSeguro: string[];
  activo: boolean;
  notas?: string | null;
  logoUrl?: string | null;
  _count?: {
    quotations: number;
    quoteRequests: number;
  };
}

interface ProviderFormData {
  nombre: string;
  cif: string;
  email: string;
  telefono: string;
  web: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  contactoCargo: string;
  tiposSeguro: string[];
  notas: string;
  activo: boolean;
}

const EMPTY_FORM: ProviderFormData = {
  nombre: '',
  cif: '',
  email: '',
  telefono: '',
  web: '',
  direccion: '',
  ciudad: '',
  codigoPostal: '',
  contactoNombre: '',
  contactoEmail: '',
  contactoTelefono: '',
  contactoCargo: '',
  tiposSeguro: [],
  notas: '',
  activo: true,
};

export default function ProveedoresPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: _session, status } = useSession();
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<InsuranceProvider | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<InsuranceProvider | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const dashboardHref = pathname?.startsWith('/admin') ? '/admin/dashboard' : '/dashboard';

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProviders();
    }
  }, [status]);

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/seguros/proveedores');
      if (!response.ok) throw new Error('Error al obtener proveedores');
      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contactoNombre?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'activo' && p.activo) ||
      (statusFilter === 'inactivo' && !p.activo);

    const matchesTipo =
      tipoFilter === 'all' || (p.tiposSeguro && p.tiposSeguro.includes(tipoFilter));

    return matchesSearch && matchesStatus && matchesTipo;
  });

  const stats = {
    total: providers.length,
    activos: providers.filter((p) => p.activo).length,
    cotizacionesRecibidas: providers.reduce((sum, p) => sum + (p._count?.quotations ?? 0), 0),
    solicitudesEnviadas: providers.reduce((sum, p) => sum + (p._count?.quoteRequests ?? 0), 0),
  };

  const openCreateDialog = () => {
    setEditingProvider(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (provider: InsuranceProvider) => {
    setEditingProvider(provider);
    setFormData({
      nombre: provider.nombre,
      cif: provider.cif ?? '',
      email: provider.email ?? '',
      telefono: provider.telefono ?? '',
      web: provider.web ?? '',
      direccion: provider.direccion ?? '',
      ciudad: provider.ciudad ?? '',
      codigoPostal: provider.codigoPostal ?? '',
      contactoNombre: provider.contactoNombre ?? '',
      contactoEmail: provider.contactoEmail ?? '',
      contactoTelefono: provider.contactoTelefono ?? '',
      contactoCargo: provider.contactoCargo ?? '',
      tiposSeguro: provider.tiposSeguro ?? [],
      notas: provider.notas ?? '',
      activo: provider.activo,
    });
    setDialogOpen(true);
  };

  const handleFormChange = (field: keyof ProviderFormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTipoSeguro = (tipo: string) => {
    setFormData((prev) => ({
      ...prev,
      tiposSeguro: prev.tiposSeguro.includes(tipo)
        ? prev.tiposSeguro.filter((t) => t !== tipo)
        : [...prev.tiposSeguro, tipo],
    }));
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        cif: formData.cif || null,
        email: formData.email || null,
        telefono: formData.telefono || null,
        web: formData.web || null,
        direccion: formData.direccion || null,
        ciudad: formData.ciudad || null,
        codigoPostal: formData.codigoPostal || null,
        contactoNombre: formData.contactoNombre || null,
        contactoEmail: formData.contactoEmail || null,
        contactoTelefono: formData.contactoTelefono || null,
        contactoCargo: formData.contactoCargo || null,
        notas: formData.notas || null,
      };

      if (editingProvider) {
        const response = await fetch(`/api/seguros/proveedores/${editingProvider.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Error al actualizar');
        toast.success('Proveedor actualizado');
      } else {
        const response = await fetch('/api/seguros/proveedores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Error al crear');
        toast.success('Proveedor creado');
      }

      setDialogOpen(false);
      setEditingProvider(null);
      setFormData(EMPTY_FORM);
      await fetchProviders();
    } catch (error) {
      console.error('Error saving provider:', error);
      toast.error(editingProvider ? 'Error al actualizar proveedor' : 'Error al crear proveedor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!providerToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/seguros/proveedores/${providerToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');

      toast.success('Proveedor eliminado');
      setProviders((prev) => prev.filter((p) => p.id !== providerToDelete.id));
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast.error('Error al eliminar proveedor');
    } finally {
      setIsDeleting(false);
    }
  };

  const getQuotationCount = (provider: InsuranceProvider) =>
    (provider._count?.quotations ?? 0) + (provider._count?.quoteRequests ?? 0);

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-72" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={dashboardHref}>
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/seguros">Seguros</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Proveedores</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Proveedores de Seguros</h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona tus proveedores y aseguradoras
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchProviders()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button onClick={() => router.push('/seguros/proveedores/nuevo')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Proveedores registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
              <p className="text-xs text-muted-foreground">Proveedores activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cotizaciones Recibidas</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.cotizacionesRecibidas}</div>
              <p className="text-xs text-muted-foreground">Total de cotizaciones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitudes Enviadas</CardTitle>
              <Send className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.solicitudesEnviadas}</div>
              <p className="text-xs text-muted-foreground">Solicitudes de cotización</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, CIF, email o contacto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de seguro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {INSURANCE_TYPE_OPTIONS.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="inactivo">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || statusFilter !== 'all' || tipoFilter !== 'all') && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Mostrando {filteredProviders.length} de {providers.length} proveedores
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTipoFilter('all');
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Proveedores</CardTitle>
            <CardDescription>
              Listado de aseguradoras y proveedores de seguros registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProviders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay proveedores</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Añade tu primer proveedor de seguros
                </p>
                <Button onClick={() => router.push('/seguros/proveedores/nuevo')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Proveedor
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>CIF</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipos de Seguro</TableHead>
                      <TableHead>Cotizaciones</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProviders.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{provider.nombre}</div>
                            {provider.ciudad && (
                              <div className="text-xs text-muted-foreground">{provider.ciudad}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {provider.cif || '—'}
                        </TableCell>
                        <TableCell>
                          {provider.contactoNombre ? (
                            <div className="space-y-0.5">
                              <div className="text-sm">{provider.contactoNombre}</div>
                              {provider.contactoCargo && (
                                <div className="text-xs text-muted-foreground">
                                  {provider.contactoCargo}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {provider.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {provider.email}
                              </div>
                            )}
                            {provider.telefono && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {provider.telefono}
                              </div>
                            )}
                            {!provider.email && !provider.telefono && (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {provider.tiposSeguro?.length > 0 ? (
                              provider.tiposSeguro.map((tipo) => (
                                <Badge key={tipo} variant="secondary" className="text-xs">
                                  {TIPO_SEGURO_LABELS[tipo] || tipo}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{getQuotationCount(provider)}</span>
                        </TableCell>
                        <TableCell>
                          {provider.activo ? (
                            <Badge
                              variant="default"
                              className="gap-1 bg-green-100 text-green-800 hover:bg-green-100"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(provider)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(provider)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {provider.web && (
                                <DropdownMenuItem
                                  onClick={() => window.open(provider.web!, '_blank')}
                                >
                                  <Globe className="mr-2 h-4 w-4" />
                                  Visitar Web
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setProviderToDelete(provider);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
              <DialogDescription>
                {editingProvider
                  ? 'Modifica los datos del proveedor de seguros'
                  : 'Registra un nuevo proveedor de seguros'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Datos Generales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dlg-nombre">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dlg-nombre"
                      value={formData.nombre}
                      onChange={(e) => handleFormChange('nombre', e.target.value)}
                      placeholder="Nombre de la aseguradora"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dlg-cif">CIF</Label>
                    <Input
                      id="dlg-cif"
                      value={formData.cif}
                      onChange={(e) => handleFormChange('cif', e.target.value)}
                      placeholder="B12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dlg-email">Email</Label>
                    <Input
                      id="dlg-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="contacto@aseguradora.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dlg-telefono">Teléfono</Label>
                    <Input
                      id="dlg-telefono"
                      value={formData.telefono}
                      onChange={(e) => handleFormChange('telefono', e.target.value)}
                      placeholder="+34 900 000 000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dlg-web">Web</Label>
                    <Input
                      id="dlg-web"
                      value={formData.web}
                      onChange={(e) => handleFormChange('web', e.target.value)}
                      placeholder="https://www.aseguradora.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Dirección</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="dlg-direccion">Dirección</Label>
                    <Input
                      id="dlg-direccion"
                      value={formData.direccion}
                      onChange={(e) => handleFormChange('direccion', e.target.value)}
                      placeholder="Calle, número, piso"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dlg-ciudad">Ciudad</Label>
                    <Input
                      id="dlg-ciudad"
                      value={formData.ciudad}
                      onChange={(e) => handleFormChange('ciudad', e.target.value)}
                      placeholder="Madrid"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dlg-codigoPostal">Código Postal</Label>
                    <Input
                      id="dlg-codigoPostal"
                      value={formData.codigoPostal}
                      onChange={(e) => handleFormChange('codigoPostal', e.target.value)}
                      placeholder="28001"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Persona de Contacto</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dlg-contactoNombre">Nombre</Label>
                    <Input
                      id="dlg-contactoNombre"
                      value={formData.contactoNombre}
                      onChange={(e) => handleFormChange('contactoNombre', e.target.value)}
                      placeholder="Juan García"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dlg-contactoCargo">Cargo</Label>
                    <Input
                      id="dlg-contactoCargo"
                      value={formData.contactoCargo}
                      onChange={(e) => handleFormChange('contactoCargo', e.target.value)}
                      placeholder="Director Comercial"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dlg-contactoEmail">Email de contacto</Label>
                    <Input
                      id="dlg-contactoEmail"
                      type="email"
                      value={formData.contactoEmail}
                      onChange={(e) => handleFormChange('contactoEmail', e.target.value)}
                      placeholder="juan@aseguradora.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dlg-contactoTelefono">Teléfono de contacto</Label>
                    <Input
                      id="dlg-contactoTelefono"
                      value={formData.contactoTelefono}
                      onChange={(e) => handleFormChange('contactoTelefono', e.target.value)}
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Tipos de Seguro</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INSURANCE_TYPE_OPTIONS.map((tipo) => (
                    <div key={tipo.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dlg-tipo-${tipo.value}`}
                        checked={formData.tiposSeguro.includes(tipo.value)}
                        onCheckedChange={() => toggleTipoSeguro(tipo.value)}
                      />
                      <Label
                        htmlFor={`dlg-tipo-${tipo.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tipo.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dlg-notas">Notas</Label>
                <Textarea
                  id="dlg-notas"
                  value={formData.notas}
                  onChange={(e) => handleFormChange('notas', e.target.value)}
                  placeholder="Observaciones adicionales sobre el proveedor..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dlg-activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => handleFormChange('activo', !!checked)}
                />
                <Label htmlFor="dlg-activo" className="cursor-pointer">
                  Proveedor activo
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving
                  ? 'Guardando...'
                  : editingProvider
                    ? 'Guardar Cambios'
                    : 'Crear Proveedor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar proveedor?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. El proveedor{' '}
                <strong>{providerToDelete?.nombre}</strong> será eliminado permanentemente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
