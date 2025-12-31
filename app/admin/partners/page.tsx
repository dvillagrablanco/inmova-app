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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from API /api/admin/partners
      const mockPartners: Partner[] = [
        {
          id: '1',
          name: 'Banco Santander',
          email: 'partners@santander.com',
          phone: '+34 912 000 000',
          company: 'Banco Santander',
          website: 'https://santander.com',
          type: 'BANK',
          status: 'PENDING_APPROVAL',
          referralCode: 'SANT2025',
          totalClients: 0,
          totalEarned: 0,
          commissionRate: 25,
          level: 'BRONZE',
          createdAt: '2025-01-02T10:00:00Z',
        },
        {
          id: '2',
          name: 'Mapfre Seguros',
          email: 'partners@mapfre.com',
          phone: '+34 913 000 000',
          company: 'Mapfre',
          type: 'INSURANCE',
          status: 'PENDING_APPROVAL',
          referralCode: 'MAPFRE2025',
          totalClients: 0,
          totalEarned: 0,
          commissionRate: 25,
          level: 'BRONZE',
          createdAt: '2025-01-02T11:00:00Z',
        },
        {
          id: '3',
          name: 'IE Business School',
          email: 'partners@ie.edu',
          phone: '+34 915 000 000',
          company: 'IE Business School',
          website: 'https://ie.edu',
          type: 'BUSINESS_SCHOOL',
          status: 'ACTIVE',
          referralCode: 'IEBSCHOOL',
          totalClients: 15,
          totalEarned: 12500,
          commissionRate: 25,
          level: 'SILVER',
          createdAt: '2024-11-15T09:00:00Z',
        },
      ];

      setPartners(mockPartners);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast.error('Error al cargar partners');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedPartner || !actionType) return;

    try {
      // TODO: Call API to approve/reject/suspend
      let newStatus: Partner['status'] = selectedPartner.status;
      let message = '';

      switch (actionType) {
        case 'approve':
          newStatus = 'ACTIVE';
          message = 'Partner aprobado correctamente. Email de bienvenida enviado.';
          break;
        case 'reject':
          newStatus = 'INACTIVE';
          message = 'Partner rechazado.';
          break;
        case 'suspend':
          newStatus = 'SUSPENDED';
          message = 'Partner suspendido.';
          break;
      }

      setPartners(
        partners.map((p) => (p.id === selectedPartner.id ? { ...p, status: newStatus } : p))
      );

      toast.success(message);
      setActionDialogOpen(false);
      setActionType(null);
      setActionNotes('');
      setSelectedPartner(null);
    } catch (error) {
      console.error('Error processing action:', error);
      toast.error('Error al procesar acción');
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
        <div>
          <h1 className="text-3xl font-bold">Administración de Partners</h1>
          <p className="text-muted-foreground">Aprueba y gestiona solicitudes de partners</p>
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
      </div>
    </AuthenticatedLayout>
  );
}
