'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Building2,
  Eye,
  Filter,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Partner {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  type: string;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  referralCode: string;
  totalClients: number;
  totalEarned: number;
  commissionRate: number;
  level: string;
  createdAt: string;
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  
  // CRUD state
  const [createEditDialogOpen, setCreateEditDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    type: 'REAL_ESTATE',
    commissionRate: '25',
  });

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/partners');
      
      if (!response.ok) {
        throw new Error('Error al cargar partners');
      }
      
      const data = await response.json();
      
      // Mapear status del backend al frontend
      const mappedPartners = (data.partners || []).map((p: any) => ({
        ...p,
        status: mapStatus(p.status),
        type: mapType(p.type),
      }));
      
      setPartners(mappedPartners);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast.error('Error al cargar partners');
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  // Mapear estados del backend al frontend
  const mapStatus = (status: string): Partner['status'] => {
    const statusMap: Record<string, Partner['status']> = {
      PENDING: 'PENDING_APPROVAL',
      ACTIVE: 'ACTIVE',
      SUSPENDED: 'SUSPENDED',
    };
    return statusMap[status] || 'INACTIVE';
  };

  // Mapear tipos del backend al frontend
  const mapType = (type: string): string => {
    const typeMap: Record<string, string> = {
      BANCO: 'BANK',
      INMOBILIARIA: 'REAL_ESTATE',
      CONSULTORA: 'LAW_FIRM',
      ASOCIACION: 'BUSINESS_SCHOOL',
      PLATAFORMA_MEMBRESIA: 'INSURANCE',
      MULTIFAMILY_OFFICE: 'BANK',
      OTRO: 'OTHER',
    };
    return typeMap[type] || type;
  };

  const handleAction = async () => {
    if (!selectedPartner || !actionType) return;

    try {
      let newStatus: string;
      let message = '';

      switch (actionType) {
        case 'approve':
          newStatus = 'ACTIVE';
          message = 'Partner aprobado correctamente. Email de bienvenida enviado.';
          break;
        case 'reject':
          newStatus = 'SUSPENDED';
          message = 'Partner rechazado.';
          break;
        case 'suspend':
          newStatus = 'SUSPENDED';
          message = 'Partner suspendido.';
          break;
        default:
          return;
      }

      const response = await fetch(`/api/admin/partners/${selectedPartner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: newStatus,
          notas: actionNotes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al procesar acción');
      }

      toast.success(message);
      setActionDialogOpen(false);
      setActionType(null);
      setActionNotes('');
      setSelectedPartner(null);
      loadPartners(); // Recargar datos
    } catch (error: any) {
      console.error('Error processing action:', error);
      toast.error(error.message || 'Error al procesar acción');
    }
  };

  const handleOpenCreateEdit = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name,
        email: partner.email,
        phone: partner.phone || '',
        company: partner.company || '',
        website: partner.website || '',
        type: partner.type,
        commissionRate: partner.commissionRate.toString(),
      });
    } else {
      setEditingPartner(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        website: '',
        type: 'REAL_ESTATE',
        commissionRate: '25',
      });
    }
    setCreateEditDialogOpen(true);
  };

  const handleSavePartner = async () => {
    try {
      const backendTypeMap: Record<string, string> = {
        BANK: 'BANCO',
        REAL_ESTATE: 'INMOBILIARIA',
        LAW_FIRM: 'CONSULTORA',
        BUSINESS_SCHOOL: 'ASOCIACION',
        INSURANCE: 'PLATAFORMA_MEMBRESIA',
        CONSTRUCTION: 'OTRO',
        OTHER: 'OTRO',
      };

      if (editingPartner) {
        // Update existing partner
        const response = await fetch(`/api/admin/partners/${editingPartner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: formData.name,
            razonSocial: formData.company || formData.name,
            tipo: backendTypeMap[formData.type] || 'OTRO',
            contactoNombre: formData.name,
            contactoEmail: formData.email,
            contactoTelefono: formData.phone,
            comisionPorcentaje: parseFloat(formData.commissionRate),
            dominioPersonalizado: formData.website,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al actualizar');
        }

        toast.success('Partner actualizado correctamente');
      } else {
        // Create new partner
        const response = await fetch('/api/admin/partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: formData.name,
            razonSocial: formData.company || formData.name,
            cif: `B${Date.now().toString().slice(-8)}`, // CIF temporal si no se proporciona
            tipo: backendTypeMap[formData.type] || 'OTRO',
            contactoNombre: formData.name,
            contactoEmail: formData.email,
            contactoTelefono: formData.phone,
            email: formData.email,
            comisionPorcentaje: parseFloat(formData.commissionRate),
            dominioPersonalizado: formData.website,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al crear');
        }

        toast.success('Partner creado correctamente');
      }

      setCreateEditDialogOpen(false);
      setEditingPartner(null);
      loadPartners(); // Recargar datos
    } catch (error: any) {
      console.error('Error saving partner:', error);
      toast.error(error.message || 'Error al guardar partner');
    }
  };

  const handleDeletePartner = async () => {
    if (!deletingPartner) return;

    try {
      const response = await fetch(`/api/admin/partners/${deletingPartner.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      const result = await response.json();
      toast.success(result.message || 'Partner eliminado correctamente');
      setDeleteDialogOpen(false);
      setDeletingPartner(null);
      loadPartners(); // Recargar datos
    } catch (error: any) {
      console.error('Error deleting partner:', error);
      toast.error(error.message || 'Error al eliminar partner');
    }
  };

  const getStatusBadge = (status: Partner['status']) => {
    const variants = {
      PENDING_APPROVAL: { variant: 'secondary' as const, label: 'Pendiente', icon: Clock },
      ACTIVE: { variant: 'default' as const, label: 'Activo', icon: CheckCircle2 },
      SUSPENDED: { variant: 'destructive' as const, label: 'Suspendido', icon: XCircle },
      INACTIVE: { variant: 'outline' as const, label: 'Inactivo', icon: XCircle },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      BANK: 'Banco',
      INSURANCE: 'Aseguradora',
      BUSINESS_SCHOOL: 'Escuela',
      REAL_ESTATE: 'Inmobiliaria',
      CONSTRUCTION: 'Constructora',
      LAW_FIRM: 'Despacho Legal',
      OTHER: 'Otro',
    };

    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const filteredPartners = partners.filter((p) =>
    statusFilter === 'all' ? true : p.status === statusFilter
  );

  const stats = {
    total: partners.length,
    pending: partners.filter((p) => p.status === 'PENDING_APPROVAL').length,
    active: partners.filter((p) => p.status === 'ACTIVE').length,
    totalClients: partners.reduce((sum, p) => sum + p.totalClients, 0),
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administración de Partners</h1>
            <p className="text-muted-foreground">Aprueba y gestiona solicitudes de partners</p>
          </div>
          <Button onClick={() => handleOpenCreateEdit()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Partner
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalClients}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pendientes</SelectItem>
                  <SelectItem value="ACTIVE">Activos</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
                  <SelectItem value="INACTIVE">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Ganado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay partners registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{partner.name}</p>
                          {partner.company && (
                            <p className="text-sm text-muted-foreground">{partner.company}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(partner.type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {partner.email}
                          </p>
                          {partner.phone && (
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {partner.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{partner.totalClients}</TableCell>
                      <TableCell className="font-medium">
                        €{partner.totalEarned.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(partner.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPartner(partner);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCreateEdit(partner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {partner.status === 'PENDING_APPROVAL' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedPartner(partner);
                                  setActionType('approve');
                                  setActionDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedPartner(partner);
                                  setActionType('reject');
                                  setActionDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </>
                          )}
                          {partner.status === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPartner(partner);
                                setActionType('suspend');
                                setActionDialogOpen(true);
                              }}
                            >
                              Suspender
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingPartner(partner);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalle del Partner</DialogTitle>
            </DialogHeader>
            {selectedPartner && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{selectedPartner.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedPartner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{selectedPartner.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    {getTypeBadge(selectedPartner.type)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Código de Referido</p>
                    <p className="font-mono font-bold">{selectedPartner.referralCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nivel</p>
                    <Badge>{selectedPartner.level}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Comisión</p>
                    <p className="font-medium">{selectedPartner.commissionRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha Registro</p>
                    <p className="font-medium">
                      {format(new Date(selectedPartner.createdAt), 'dd MMM yyyy', {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="grid md:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{selectedPartner.totalClients}</p>
                      <p className="text-sm text-muted-foreground">Clientes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        €{selectedPartner.totalEarned.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Ganado</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{getStatusBadge(selectedPartner.status)}</p>
                      <p className="text-sm text-muted-foreground">Estado</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' && 'Aprobar Partner'}
                {actionType === 'reject' && 'Rechazar Partner'}
                {actionType === 'suspend' && 'Suspender Partner'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve' &&
                  'El partner recibirá un email con sus credenciales y podrá empezar a generar comisiones.'}
                {actionType === 'reject' &&
                  'El partner será notificado del rechazo. Esta acción es irreversible.'}
                {actionType === 'suspend' &&
                  'El partner será suspendido temporalmente. Podrás reactivarlo más tarde.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas (opcional)</label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Añade notas internas sobre esta acción..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant={actionType === 'approve' ? 'default' : 'destructive'}
                onClick={handleAction}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create/Edit Dialog */}
        <Dialog open={createEditDialogOpen} onOpenChange={setCreateEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPartner ? 'Editar Partner' : 'Nuevo Partner'}</DialogTitle>
              <DialogDescription>
                {editingPartner
                  ? 'Modifica los datos del partner'
                  : 'Completa los datos del nuevo partner'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre del partner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Nombre de la empresa"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://ejemplo.com"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Partner *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANK">Banco</SelectItem>
                      <SelectItem value="INSURANCE">Aseguradora</SelectItem>
                      <SelectItem value="BUSINESS_SCHOOL">Escuela de Negocios</SelectItem>
                      <SelectItem value="REAL_ESTATE">Inmobiliaria</SelectItem>
                      <SelectItem value="CONSTRUCTION">Constructora</SelectItem>
                      <SelectItem value="LAW_FIRM">Despacho Legal</SelectItem>
                      <SelectItem value="OTHER">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionRate">Comisión (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePartner}>
                {editingPartner ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Partner</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar al partner "{deletingPartner?.name}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeletePartner}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
