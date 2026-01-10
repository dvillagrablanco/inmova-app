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
  Send,
  Plus,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Copy,
  RefreshCw,
  Link as LinkIcon,
  Calendar,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Invitation {
  id: string;
  email: string;
  nombre?: string;
  empresa?: string;
  mensaje?: string;
  estado: 'pending' | 'accepted' | 'expired' | 'rejected';
  tokenExpira: string;
  invitationLink: string;
  enviadoPor: string;
  creadoEn: string;
  aceptadoEn?: string;
  comisionOfrecida: number;
}

interface InvitationStats {
  total: number;
  pendientes: number;
  aceptadas: number;
  expiradas: number;
  tasaConversion: number;
}

export default function PartnerInvitacionesPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    nombre: '',
    empresa: '',
    mensaje: '',
    comisionOfrecida: 15,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Datos de ejemplo - conectar con API real
      setStats({
        total: 45,
        pendientes: 12,
        aceptadas: 28,
        expiradas: 5,
        tasaConversion: 62,
      });

      setInvitations([
        {
          id: '1',
          email: 'nuevaagencia@gmail.com',
          nombre: 'María López',
          empresa: 'Agencia Inmobiliaria López',
          estado: 'pending',
          tokenExpira: '2026-01-20',
          invitationLink: 'https://inmovaapp.com/partners/join?token=abc123',
          enviadoPor: 'Admin',
          creadoEn: '2026-01-08',
          comisionOfrecida: 15,
        },
        {
          id: '2',
          email: 'carlos@fincasexpress.com',
          nombre: 'Carlos Ruiz',
          empresa: 'Fincas Express',
          estado: 'accepted',
          tokenExpira: '2026-01-15',
          invitationLink: 'https://inmovaapp.com/partners/join?token=def456',
          enviadoPor: 'Admin',
          creadoEn: '2026-01-01',
          aceptadoEn: '2026-01-03',
          comisionOfrecida: 12,
        },
        {
          id: '3',
          email: 'info@propiedadesvalencia.es',
          nombre: 'Ana Martínez',
          empresa: 'Propiedades Valencia',
          estado: 'expired',
          tokenExpira: '2025-12-28',
          invitationLink: 'https://inmovaapp.com/partners/join?token=ghi789',
          enviadoPor: 'Admin',
          creadoEn: '2025-12-14',
          comisionOfrecida: 15,
        },
      ]);
    } catch (error) {
      toast.error('Error al cargar invitaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    if (!newInvitation.email) {
      toast.error('El email es obligatorio');
      return;
    }

    try {
      // Aquí conectar con API real
      toast.success(`Invitación enviada a ${newInvitation.email}`);
      setCreateDialogOpen(false);
      setNewInvitation({
        email: '',
        nombre: '',
        empresa: '',
        mensaje: '',
        comisionOfrecida: 15,
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear invitación');
    }
  };

  const handleResend = async (id: string) => {
    toast.success('Invitación reenviada');
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Enlace copiado al portapapeles');
  };

  const handleDelete = async (id: string) => {
    toast.success('Invitación eliminada');
    loadData();
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Aceptada</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Expirada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const filteredInvitations = invitations.filter(inv => {
    const matchesSearch = inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.empresa?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invitaciones de Partners</h1>
            <p className="text-gray-600 mt-1">Gestiona las invitaciones al programa de partners</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Invitación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Invitar Nuevo Partner</DialogTitle>
                <DialogDescription>
                  Envía una invitación al programa de partners de Inmova
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="partner@empresa.com"
                    value={newInvitation.email}
                    onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de Contacto</Label>
                  <Input
                    id="nombre"
                    placeholder="Juan García"
                    value={newInvitation.nombre}
                    onChange={(e) => setNewInvitation({ ...newInvitation, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    placeholder="Agencia Inmobiliaria XYZ"
                    value={newInvitation.empresa}
                    onChange={(e) => setNewInvitation({ ...newInvitation, empresa: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comision">Comisión Ofrecida (%)</Label>
                  <Select
                    value={String(newInvitation.comisionOfrecida)}
                    onValueChange={(v) => setNewInvitation({ ...newInvitation, comisionOfrecida: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="15">15% (Estándar)</SelectItem>
                      <SelectItem value="20">20% (Premium)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mensaje">Mensaje Personalizado</Label>
                  <Textarea
                    id="mensaje"
                    placeholder="Mensaje opcional para el partner..."
                    value={newInvitation.mensaje}
                    onChange={(e) => setNewInvitation({ ...newInvitation, mensaje: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateInvitation}>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Invitación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Mail className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Aceptadas</p>
                    <p className="text-2xl font-bold text-green-600">{stats.aceptadas}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Expiradas</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.expiradas}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tasa Conversión</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.tasaConversion}%</p>
                  </div>
                  <UserPlus className="w-8 h-8 text-indigo-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por email, nombre o empresa..."
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
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="accepted">Aceptadas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Invitaciones</CardTitle>
            <CardDescription>
              {filteredInvitations.length} invitaciones encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email / Contacto</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Envío</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        {invitation.nombre && (
                          <p className="text-sm text-gray-500">{invitation.nombre}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{invitation.empresa || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invitation.comisionOfrecida}%</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(invitation.estado)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {format(new Date(invitation.creadoEn), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${new Date(invitation.tokenExpira) < new Date() ? 'text-red-500' : 'text-gray-500'}`}>
                        {format(new Date(invitation.tokenExpira), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(invitation.invitationLink)}
                          title="Copiar enlace"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        {invitation.estado === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResend(invitation.id)}
                            title="Reenviar"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(invitation.id)}
                          title="Eliminar"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
