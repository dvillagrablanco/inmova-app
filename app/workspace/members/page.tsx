'use client';

/**
 * Workspace - Miembros
 * 
 * Gestión de miembros del coworking (conectado a API real)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Building,
  Calendar,
  CreditCard,
  Star,
  Filter,
  Edit,
  Eye,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';

interface Miembro {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  empresa: string | null;
  plan: 'hot_desk' | 'dedicated_desk' | 'oficina_privada' | 'sala_reuniones';
  estado: 'activo' | 'inactivo' | 'pendiente' | 'vencido';
  fechaInicio: string;
  fechaFin: string | null;
  creditosRestantes: number;
  pagosAlDia: boolean;
  valoracion: number;
}

// Datos cargados desde API /api/workspace/members

const PLANES = [
  { value: 'hot_desk', label: 'Hot Desk', precio: '€15/día', color: 'bg-blue-100 text-blue-700' },
  { value: 'dedicated_desk', label: 'Dedicated Desk', precio: '€250/mes', color: 'bg-green-100 text-green-700' },
  { value: 'oficina_privada', label: 'Oficina Privada', precio: 'Desde €800/mes', color: 'bg-purple-100 text-purple-700' },
  { value: 'sala_reuniones', label: 'Solo Salas', precio: '€25/hora', color: 'bg-orange-100 text-orange-700' },
];

export default function WorkspaceMembersPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  // Cargar miembros desde API
  const fetchMiembros = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workspace/members');
      if (response.ok) {
        const data = await response.json();
        setMiembros(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMiembros();
  }, []);
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [selectedMiembro, setSelectedMiembro] = useState<Miembro | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    plan: 'hot_desk' as Miembro['plan'],
  });

  const filteredMiembros = miembros.filter((m) => {
    const matchSearch =
      m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.empresa && m.empresa.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchPlan = filterPlan === 'all' || m.plan === filterPlan;
    const matchEstado = filterEstado === 'all' || m.estado === filterEstado;
    return matchSearch && matchPlan && matchEstado;
  });

  const getPlanBadge = (plan: string) => {
    const planInfo = PLANES.find((p) => p.value === plan);
    return planInfo ? (
      <Badge className={planInfo.color}>{planInfo.label}</Badge>
    ) : (
      <Badge variant="outline">{plan}</Badge>
    );
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-green-100 text-green-700">Activo</Badge>;
      case 'inactivo':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>;
      case 'vencido':
        return <Badge className="bg-red-100 text-red-700">Vencido</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const handleCrearMiembro = () => {
    if (!formData.nombre || !formData.email) {
      toast.error('Nombre y email son obligatorios');
      return;
    }

    const nuevoMiembro: Miembro = {
      id: Date.now().toString(),
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      empresa: formData.empresa || null,
      plan: formData.plan,
      estado: 'pendiente',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: null,
      creditosRestantes: 0,
      pagosAlDia: true,
      valoracion: 0,
    };

    setMiembros([nuevoMiembro, ...miembros]);
    setIsDialogOpen(false);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      empresa: '',
      plan: 'hot_desk',
    });
    toast.success('Miembro creado correctamente');
  };

  const handleActivar = (id: string) => {
    setMiembros(
      miembros.map((m) => (m.id === id ? { ...m, estado: 'activo' as const } : m))
    );
    toast.success('Miembro activado');
  };

  const handleDesactivar = (id: string) => {
    setMiembros(
      miembros.map((m) => (m.id === id ? { ...m, estado: 'inactivo' as const } : m))
    );
    toast.info('Miembro desactivado');
  };

  const handleSendEmail = (miembro: Miembro) => {
    toast.success(`Email enviado a ${miembro.email}`);
  };

  const stats = {
    activos: miembros.filter((m) => m.estado === 'activo').length,
    pendientes: miembros.filter((m) => m.estado === 'pendiente').length,
    pagosVencidos: miembros.filter((m) => !m.pagosAlDia).length,
    ingresosMensuales: miembros
      .filter((m) => m.estado === 'activo')
      .reduce((acc, m) => {
        switch (m.plan) {
          case 'dedicated_desk':
            return acc + 250;
          case 'oficina_privada':
            return acc + 800;
          default:
            return acc;
        }
      }, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Miembros
          </h1>
          <p className="text-muted-foreground">
            Gestión de miembros del coworking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Miembro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Miembro</DialogTitle>
              <DialogDescription>
                Registra un nuevo miembro del coworking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>
              <div>
                <Label>Empresa (opcional)</Label>
                <Input
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <Label>Plan</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(value) =>
                    setFormData({ ...formData, plan: value as Miembro['plan'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANES.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label} - {plan.precio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCrearMiembro}>Crear Miembro</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Miembros Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activos}</p>
              </div>
              <Users className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagos Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.pagosVencidos}</p>
              </div>
              <CreditCard className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos/mes</p>
                <p className="text-2xl font-bold text-green-600">
                  €{stats.ingresosMensuales.toLocaleString()}
                </p>
              </div>
              <Star className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o empresa..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los planes</SelectItem>
                {PLANES.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Miembros List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Miembros ({filteredMiembros.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMiembros.map((miembro) => (
              <div
                key={miembro.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {miembro.nombre
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{miembro.nombre}</p>
                      {getPlanBadge(miembro.plan)}
                      {getEstadoBadge(miembro.estado)}
                      {!miembro.pagosAlDia && (
                        <Badge variant="destructive" className="text-xs">
                          Pago pendiente
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {miembro.email}
                      </span>
                      {miembro.empresa && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {miembro.empresa}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Desde {miembro.fechaInicio}
                      </span>
                      {miembro.valoracion > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {miembro.valoracion}/5
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMiembro(miembro)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{miembro.nombre}</DialogTitle>
                        <DialogDescription>
                          {miembro.empresa || 'Freelancer'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="flex gap-2">
                          {getPlanBadge(miembro.plan)}
                          {getEstadoBadge(miembro.estado)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> Email
                            </p>
                            <p className="font-medium">{miembro.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" /> Teléfono
                            </p>
                            <p className="font-medium">{miembro.telefono || 'No registrado'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Inicio</p>
                            <p className="font-medium">{miembro.fechaInicio}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Créditos Salas</p>
                            <p className="font-medium">{miembro.creditosRestantes} horas</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pagos al día</p>
                            <p className="font-medium">
                              {miembro.pagosAlDia ? (
                                <span className="text-green-600">Sí ✓</span>
                              ) : (
                                <span className="text-red-600">No ✗</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valoración</p>
                            <p className="font-medium flex items-center gap-1">
                              {miembro.valoracion > 0 ? (
                                <>
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  {miembro.valoracion}/5
                                </>
                              ) : (
                                'Sin valorar'
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => handleSendEmail(miembro)}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                          </Button>
                          {miembro.estado === 'pendiente' && (
                            <Button onClick={() => handleActivar(miembro.id)}>
                              Activar
                            </Button>
                          )}
                          {miembro.estado === 'activo' && (
                            <Button
                              variant="destructive"
                              onClick={() => handleDesactivar(miembro.id)}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Desactivar
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendEmail(miembro)}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  {miembro.estado === 'pendiente' && (
                    <Button size="sm" onClick={() => handleActivar(miembro.id)}>
                      Activar
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredMiembros.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No se encontraron miembros
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
