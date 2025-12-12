'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  DollarSign,
  Target,
  UserCheck,
  RefreshCw,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/logger';


interface Representative {
  id: string;
  nombre: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string | null;
  comisionPorcentaje: number;
  estado: string;
  activo: boolean;
  createdAt: string;
  _count?: {
    leads: number;
    commissions: number;
  };
}

interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  estado: string;
  origen: string;
  createdAt: string;
  representative?: {
    nombre: string;
    apellidos: string;
  };
}

interface Commission {
  id: string;
  monto: number;
  estado: string;
  concepto: string;
  createdAt: string;
  representative: {
    nombre: string;
    apellidos: string;
  };
}

interface Dashboard {
  totalRepresentatives: number;
  activeRepresentatives: number;
  totalLeads: number;
  convertedLeads: number;
  pendingCommissions: number;
  totalCommissionsAmount: number;
  monthlyStats: any;
}

export default function SalesTeamPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Dialog states
  const [showRepDialog, setShowRepDialog] = useState(false);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [repToDelete, setRepToDelete] = useState<Representative | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: '',
    password: '',
    comisionPorcentaje: 5,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin' && session?.user?.role !== 'administrador') {
        router.push('/unauthorized');
      } else {
        fetchData();
      }
    }
  }, [status, session, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, repsRes, leadsRes, commissionsRes] = await Promise.all([
        fetch('/api/sales-team/dashboard'),
        fetch('/api/sales-team/representatives'),
        fetch('/api/sales-team/leads'),
        fetch('/api/sales-team/commissions'),
      ]);

      if (dashboardRes.ok) setDashboard(await dashboardRes.json());
      if (repsRes.ok) setRepresentatives(await repsRes.json());
      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (commissionsRes.ok) setCommissions(await commissionsRes.json());
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRepDialog = (rep?: Representative) => {
    if (rep) {
      setEditingRep(rep);
      setFormData({
        nombre: rep.nombre,
        apellidos: rep.apellidos,
        dni: rep.dni,
        email: rep.email,
        telefono: rep.telefono,
        direccion: rep.direccion || '',
        password: '',
        comisionPorcentaje: rep.comisionPorcentaje,
      });
    } else {
      setEditingRep(null);
      setFormData({
        nombre: '',
        apellidos: '',
        dni: '',
        email: '',
        telefono: '',
        direccion: '',
        password: '',
        comisionPorcentaje: 5,
      });
    }
    setShowRepDialog(true);
  };

  const handleSubmitRep = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.apellidos || !formData.dni || !formData.email || !formData.telefono) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    if (!editingRep && !formData.password) {
      toast.error('La contraseña es requerida para nuevos representantes');
      return;
    }

    try {
      const url = editingRep
        ? `/api/sales-team/representatives/${editingRep.id}`
        : '/api/sales-team/representatives';
      const method = editingRep ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      toast.success(editingRep ? 'Representante actualizado' : 'Representante creado');
      setShowRepDialog(false);
      fetchData();
    } catch (error: any) {
      logger.error('Error:', error);
      toast.error(error.message || 'Error al guardar el representante');
    }
  };

  const handleDeleteRep = async () => {
    if (!repToDelete) return;

    try {
      const response = await fetch(`/api/sales-team/representatives/${repToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      toast.success('Representante eliminado');
      setShowDeleteDialog(false);
      setRepToDelete(null);
      fetchData();
    } catch (error: any) {
      logger.error('Error:', error);
      toast.error(error.message || 'Error al eliminar el representante');
    }
  };

  const filteredRepresentatives = representatives.filter((rep) =>
    searchTerm
      ? rep.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.dni.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  if (loading || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    activo: 'bg-green-100 text-green-700',
    inactivo: 'bg-gray-100 text-gray-700',
    suspendido: 'bg-red-100 text-red-700',
  };

  const leadStatusColors: Record<string, string> = {
    nuevo: 'bg-blue-100 text-blue-700',
    contactado: 'bg-yellow-100 text-yellow-700',
    calificado: 'bg-purple-100 text-purple-700',
    convertido: 'bg-green-100 text-green-700',
    perdido: 'bg-red-100 text-red-700',
  };

  const commissionStatusColors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobada: 'bg-blue-100 text-blue-700',
    pagada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Users2 className="h-8 w-8" />
                  Equipo Comercial Externo
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gestión de representantes, leads y comisiones
                </p>
              </div>
              <Button onClick={() => handleOpenRepDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Representante
              </Button>
            </div>

            {/* KPIs */}
            {dashboard && (
              <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Representantes</CardTitle>
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard.totalRepresentatives}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.activeRepresentatives} activos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Leads Totales</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard.totalLeads}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.convertedLeads} convertidos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Comisiones Pendientes</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard.pendingCommissions}</div>
                    <p className="text-xs text-muted-foreground">Por aprobar</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Comisiones</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      €{dashboard.totalCommissionsAmount.toLocaleString('es-ES')}
                    </div>
                    <p className="text-xs text-muted-foreground">Este mes</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Representantes</TabsTrigger>
                <TabsTrigger value="leads">Leads</TabsTrigger>
                <TabsTrigger value="commissions">Comisiones</TabsTrigger>
              </TabsList>

              {/* Representantes Tab */}
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Representantes Comerciales</CardTitle>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar representante..."
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredRepresentatives.length === 0 ? (
                      <div className="text-center py-12">
                        <Users2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No hay representantes registrados</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Contacto</TableHead>
                              <TableHead>DNI</TableHead>
                              <TableHead>Comisión</TableHead>
                              <TableHead>Leads</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRepresentatives.map((rep) => (
                              <TableRow key={rep.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {rep.nombre} {rep.apellidos}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Desde {format(new Date(rep.createdAt), 'MMM yyyy', { locale: es })}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {rep.email}
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      {rep.telefono}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{rep.dni}</TableCell>
                                <TableCell>{rep.comisionPorcentaje}%</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {rep._count?.leads || 0}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={statusColors[rep.estado]}>
                                    {rep.estado}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleOpenRepDialog(rep)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setRepToDelete(rep);
                                        setShowDeleteDialog(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Leads Tab */}
              <TabsContent value="leads">
                <Card>
                  <CardHeader>
                    <CardTitle>Leads Comerciales</CardTitle>
                    <CardDescription>
                      Gestión de oportunidades de venta del equipo externo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {leads.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No hay leads registrados</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Contacto</TableHead>
                              <TableHead>Representante</TableHead>
                              <TableHead>Origen</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Fecha</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {leads.map((lead) => (
                              <TableRow key={lead.id}>
                                <TableCell className="font-medium">{lead.nombre}</TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>{lead.email}</div>
                                    <div className="text-muted-foreground">{lead.telefono}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {lead.representative
                                    ? `${lead.representative.nombre} ${lead.representative.apellidos}`
                                    : 'Sin asignar'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{lead.origen}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={leadStatusColors[lead.estado]}>
                                    {lead.estado}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {format(new Date(lead.createdAt), 'dd/MM/yyyy', { locale: es })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Comisiones Tab */}
              <TabsContent value="commissions">
                <Card>
                  <CardHeader>
                    <CardTitle>Comisiones del Equipo</CardTitle>
                    <CardDescription>
                      Seguimiento y pago de comisiones del equipo comercial
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {commissions.length === 0 ? (
                      <div className="text-center py-12">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No hay comisiones registradas</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Representante</TableHead>
                              <TableHead>Concepto</TableHead>
                              <TableHead>Monto</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Fecha</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {commissions.map((commission) => (
                              <TableRow key={commission.id}>
                                <TableCell className="font-medium">
                                  {commission.representative.nombre} {commission.representative.apellidos}
                                </TableCell>
                                <TableCell>{commission.concepto}</TableCell>
                                <TableCell className="font-bold">
                                  €{commission.monto.toLocaleString('es-ES')}
                                </TableCell>
                                <TableCell>
                                  <Badge className={commissionStatusColors[commission.estado]}>
                                    {commission.estado}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {format(new Date(commission.createdAt), 'dd/MM/yyyy', {
                                    locale: es,
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Dialog para crear/editar representante */}
            <Dialog open={showRepDialog} onOpenChange={setShowRepDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRep ? 'Editar Representante' : 'Nuevo Representante Comercial'}
                  </DialogTitle>
                  <DialogDescription>
                    Complete la información del representante comercial externo
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitRep}>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellidos">Apellidos *</Label>
                        <Input
                          id="apellidos"
                          value={formData.apellidos}
                          onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dni">DNI/NIE *</Label>
                        <Input
                          id="dni"
                          value={formData.dni}
                          onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono *</Label>
                        <Input
                          id="telefono"
                          type="tel"
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="direccion">Dirección</Label>
                      <Input
                        id="direccion"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="comision">Porcentaje de Comisión (%) *</Label>
                        <Input
                          id="comision"
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={formData.comisionPorcentaje}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              comisionPorcentaje: parseFloat(e.target.value) || 0,
                            })
                          }
                          required
                        />
                      </div>
                      {!editingRep && (
                        <div className="space-y-2">
                          <Label htmlFor="password">Contraseña *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowRepDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingRep ? 'Actualizar' : 'Crear'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Dialog de confirmación de eliminación */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Eliminación</DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro de que deseas eliminar a {repToDelete?.nombre}{' '}
                    {repToDelete?.apellidos}? Esta acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setRepToDelete(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteRep}>
                    Eliminar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
