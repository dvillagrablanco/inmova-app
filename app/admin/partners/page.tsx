'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Handshake, Plus, Edit, Trash2, Mail, Phone, Globe, Building2, TrendingUp, Users, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';


interface Partner {
  id: string;
  nombre: string;
  tipo: 'inmobiliaria' | 'constructora' | 'proveedor_servicios' | 'tecnologia' | 'financiero' | 'otro';
  estado: 'activo' | 'inactivo' | 'pendiente';
  email: string;
  telefono: string;
  sitioWeb?: string;
  descripcion?: string;
  comision?: number;
  clientesReferidos?: number;
  ingresoGenerado?: number;
  fechaInicio: string;
  contactoPrincipal?: string;
}

const TIPOS_PARTNER: Record<string, { label: string; icon: any }> = {
  inmobiliaria: { label: 'Inmobiliaria', icon: Building2 },
  constructora: { label: 'Constructora', icon: Building2 },
  proveedor_servicios: { label: 'Proveedor de Servicios', icon: Handshake },
  tecnologia: { label: 'Tecnología', icon: Globe },
  financiero: { label: 'Financiero', icon: DollarSign },
  otro: { label: 'Otro', icon: Users },
};

export default function PartnersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'inmobiliaria',
    estado: 'activo',
    email: '',
    telefono: '',
    sitioWeb: '',
    descripcion: '',
    comision: 0,
    contactoPrincipal: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/unauthorized');
      } else {
        loadPartners();
      }
    }
  }, [status, session, router]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/partners');
      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      } else {
        throw new Error('Error al cargar partners');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar partners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPartner
        ? `/api/admin/partners/${editingPartner.id}`
        : '/api/admin/partners';

      const response = await fetch(url, {
        method: editingPartner ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(`Partner ${editingPartner ? 'actualizado' : 'creado'} correctamente`);
        setShowDialog(false);
        resetForm();
        loadPartners();
      } else {
        throw new Error('Error al guardar partner');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar partner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este partner?')) return;

    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Partner eliminado correctamente');
        loadPartners();
      } else {
        throw new Error('Error al eliminar partner');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar partner');
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      nombre: partner.nombre,
      tipo: partner.tipo,
      estado: partner.estado,
      email: partner.email,
      telefono: partner.telefono,
      sitioWeb: partner.sitioWeb || '',
      descripcion: partner.descripcion || '',
      comision: partner.comision || 0,
      contactoPrincipal: partner.contactoPrincipal || '',
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingPartner(null);
    setFormData({
      nombre: '',
      tipo: 'inmobiliaria',
      estado: 'activo',
      email: '',
      telefono: '',
      sitioWeb: '',
      descripcion: '',
      comision: 0,
      contactoPrincipal: '',
    });
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      activo: { variant: 'default', icon: CheckCircle, label: 'Activo' },
      inactivo: { variant: 'secondary', icon: XCircle, label: 'Inactivo' },
      pendiente: { variant: 'outline', icon: Clock, label: 'Pendiente' },
    };

    const config = variants[estado] || variants.pendiente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const calculateStats = () => {
    return {
      total: partners.length,
      activos: partners.filter((p) => p.estado === 'activo').length,
      clientesReferidos: partners.reduce((sum, p) => sum + (p.clientesReferidos || 0), 0),
      ingresoTotal: partners.reduce((sum, p) => sum + (p.ingresoGenerado || 0), 0),
    };
  };

  if (status === 'loading' || loading) {
    return <LoadingState message="Cargando partners..." />;
  }

  const stats = calculateStats();

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Gestión de Partners
              </h1>
              <p className="mt-1 text-muted-foreground">
                Gestiona alianzas estratégicas y colaboraciones
              </p>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="gradient-primary" onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Partner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPartner ? 'Editar Partner' : 'Nuevo Partner'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TIPOS_PARTNER).map(([value, { label }]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sitioWeb">Sitio Web</Label>
                      <Input
                        id="sitioWeb"
                        value={formData.sitioWeb}
                        onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactoPrincipal">Contacto Principal</Label>
                      <Input
                        id="contactoPrincipal"
                        value={formData.contactoPrincipal}
                        onChange={(e) =>
                          setFormData({ ...formData, contactoPrincipal: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="comision">Comisión (%)</Label>
                      <Input
                        id="comision"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.comision}
                        onChange={(e) =>
                          setFormData({ ...formData, comision: parseFloat(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="estado">Estado</Label>
                      <Select
                        value={formData.estado}
                        onValueChange={(value) => setFormData({ ...formData, estado: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="inactivo">Inactivo</SelectItem>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="gradient-primary">
                      {editingPartner ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
                <Handshake className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Partners Activos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Clientes Referidos</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.clientesReferidos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ingreso Generado</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  €{stats.ingresoTotal.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Partners List */}
          {partners.length === 0 ? (
            <EmptyState
              icon={<Handshake className="h-12 w-12" />}
              title="No hay partners registrados"
              description="Comienza agregando tu primer partner estratégico"
              actions={[
                {
                  label: 'Crear Primer Partner',
                  onClick: () => {
                    resetForm();
                    setShowDialog(true);
                  },
                  icon: <Plus className="h-4 w-4" aria-hidden="true" />,
                },
              ]}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {partners.map((partner) => {
                const TipoIcon = TIPOS_PARTNER[partner.tipo]?.icon || Users;
                return (
                  <Card key={partner.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <TipoIcon className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{partner.nombre}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(partner)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(partner.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getEstadoBadge(partner.estado)}
                        <Badge variant="outline">{TIPOS_PARTNER[partner.tipo]?.label}</Badge>
                      </div>

                      {partner.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {partner.descripcion}
                        </p>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{partner.email}</span>
                        </div>
                        {partner.telefono && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{partner.telefono}</span>
                          </div>
                        )}
                        {partner.sitioWeb && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Globe className="h-4 w-4" />
                            <a
                              href={partner.sitioWeb}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:text-primary"
                            >
                              {partner.sitioWeb}
                            </a>
                          </div>
                        )}
                      </div>

                      {(partner.clientesReferidos! > 0 || partner.ingresoGenerado! > 0) && (
                        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2">
                          {partner.clientesReferidos! > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Clientes</p>
                              <p className="text-sm font-semibold">{partner.clientesReferidos}</p>
                            </div>
                          )}
                          {partner.ingresoGenerado! > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Ingresos</p>
                              <p className="text-sm font-semibold">
                                €{partner.ingresoGenerado?.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {partner.comision! > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            Comisión: {partner.comision}%
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
