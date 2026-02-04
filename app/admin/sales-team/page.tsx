'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus,
  Users,
  Target,
  TrendingUp,
  Euro,
  Phone,
  Mail,
  Calendar,
  Award,
  Star,
  Pencil,
  Trash2,
  Eye,
  BarChart3,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SalesRep {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  avatar: string | null;
  rol: 'junior' | 'senior' | 'manager';
  estado: 'active' | 'inactive';
  metaMensual: number;
  ventasMes: number;
  clientesCaptados: number;
  tasaConversion: number;
  comisionAcumulada: number;
  fechaIngreso: string;
}

interface SalesStats {
  totalVendedores: number;
  ventasMes: number;
  metaGlobal: number;
  progresoMeta: number;
  mejorVendedor: string;
  clientesNuevos: number;
}

export default function SalesTeamPage() {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'junior',
    metaMensual: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: Conectar con API real del equipo comercial
      const response = await fetch('/api/admin/sales-team');
      if (response.ok) {
        const data = await response.json();
        setStats(
          data.stats || {
            totalVendedores: 0,
            ventasMes: 0,
            metaGlobal: 0,
            progresoMeta: 0,
            mejorVendedor: '-',
            clientesNuevos: 0,
          }
        );
        setSalesReps(data.salesReps || []);
      } else {
        // Si no hay API, mostrar estado vacío
        setStats({
          totalVendedores: 0,
          ventasMes: 0,
          metaGlobal: 0,
          progresoMeta: 0,
          mejorVendedor: '-',
          clientesNuevos: 0,
        });
        setSalesReps([]);
      }
    } catch (error) {
      // En caso de error, mostrar estado vacío
      setStats({
        totalVendedores: 0,
        ventasMes: 0,
        metaGlobal: 0,
        progresoMeta: 0,
        mejorVendedor: '-',
        clientesNuevos: 0,
      });
      setSalesReps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSalesRep = async () => {
    if (!formData.nombre || !formData.email || !formData.metaMensual) {
      toast.error('Nombre, email y meta mensual son obligatorios');
      return;
    }
    toast.success('Vendedor añadido correctamente');
    setCreateDialogOpen(false);
    setFormData({ nombre: '', email: '', telefono: '', rol: 'junior', metaMensual: '' });
    loadData();
  };

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'manager':
        return (
          <Badge className="bg-purple-100 text-purple-700">
            <Trophy className="w-3 h-3 mr-1" />
            Manager
          </Badge>
        );
      case 'senior':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Star className="w-3 h-3 mr-1" />
            Senior
          </Badge>
        );
      case 'junior':
        return <Badge className="bg-gray-100 text-gray-700">Junior</Badge>;
      default:
        return <Badge variant="outline">{rol}</Badge>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const activeReps = salesReps.filter((r) => r.estado === 'active');

  const handleViewRep = (repName: string) => {
    toast.info(`Detalle de ${repName}`);
  };

  const handleEditRep = (repName: string) => {
    toast.info(`Editar vendedor: ${repName}`);
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Equipo Comercial</h1>
            <p className="text-gray-600 mt-1">Gestiona tu equipo de ventas y sus objetivos</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Nuevo Vendedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Añadir Vendedor</DialogTitle>
                <DialogDescription>Añade un nuevo miembro al equipo comercial</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre Completo *</Label>
                  <Input
                    placeholder="Juan García"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="email@inmovaapp.com"
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
                    <Label>Rol</Label>
                    <Select
                      value={formData.rol}
                      onValueChange={(v) => setFormData({ ...formData, rol: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Mensual (€) *</Label>
                    <Input
                      type="number"
                      placeholder="6000"
                      value={formData.metaMensual}
                      onChange={(e) => setFormData({ ...formData, metaMensual: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSalesRep}>Añadir Vendedor</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Equipo</p>
                    <p className="text-xl font-bold">{stats.totalVendedores}</p>
                  </div>
                  <Users className="w-6 h-6 text-indigo-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Ventas Mes</p>
                    <p className="text-xl font-bold">€{stats.ventasMes.toLocaleString()}</p>
                  </div>
                  <Euro className="w-6 h-6 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Meta Global</p>
                    <p className="text-xl font-bold">€{stats.metaGlobal.toLocaleString()}</p>
                  </div>
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Progreso</p>
                    <p className="text-xl font-bold text-indigo-600">{stats.progresoMeta}%</p>
                  </div>
                  <BarChart3 className="w-6 h-6 text-indigo-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Top Vendedor</p>
                    <p className="text-sm font-bold truncate">{stats.mejorVendedor}</p>
                  </div>
                  <Trophy className="w-6 h-6 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Clientes Nuevos</p>
                    <p className="text-xl font-bold text-green-600">{stats.clientesNuevos}</p>
                  </div>
                  <UserPlus className="w-6 h-6 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Global */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progreso hacia la meta mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    €{stats.ventasMes.toLocaleString()} de €{stats.metaGlobal.toLocaleString()}
                  </span>
                  <span className="font-semibold">{stats.progresoMeta}%</span>
                </div>
                <Progress value={stats.progresoMeta} className="h-3" />
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="team">
          <TabsList>
            <TabsTrigger value="team">Equipo</TabsTrigger>
            <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-4">
            {/* Team Table */}
            <Card>
              <CardHeader>
                <CardTitle>Miembros del Equipo</CardTitle>
              </CardHeader>
              <CardContent>
                {salesReps.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sin vendedores registrados
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Añade miembros al equipo comercial para gestionar las ventas.
                    </p>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir vendedor
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead className="text-right">Meta</TableHead>
                        <TableHead className="text-right">Ventas</TableHead>
                        <TableHead>Progreso</TableHead>
                        <TableHead className="text-right">Conversión</TableHead>
                        <TableHead className="text-right">Comisión</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesReps.map((rep) => {
                        const progress = Math.round((rep.ventasMes / rep.metaMensual) * 100);
                        return (
                          <TableRow
                            key={rep.id}
                            className={rep.estado === 'inactive' ? 'opacity-50' : ''}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={rep.avatar || undefined} />
                                  <AvatarFallback>
                                    {rep.nombre
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{rep.nombre}</p>
                                  <p className="text-xs text-gray-500">
                                    Desde{' '}
                                    {format(new Date(rep.fechaIngreso), 'MMM yyyy', { locale: es })}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getRolBadge(rep.rol)}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  {rep.email}
                                </p>
                                <p className="text-sm flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  {rep.telefono}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              €{rep.metaMensual.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              €{rep.ventasMes.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="w-24">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{progress}%</span>
                                </div>
                                <Progress value={Math.min(progress, 100)} className="h-2" />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{rep.tasaConversion}%</TableCell>
                            <TableCell className="text-right text-green-600 font-semibold">
                              €{rep.comisionAcumulada.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewRep(rep.nombre)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRep(rep.nombre)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Ranking del Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeReps
                    .sort((a, b) => b.ventasMes - a.ventasMes)
                    .map((rep, index) => (
                      <div
                        key={rep.id}
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          index === 0
                            ? 'bg-yellow-50 border border-yellow-200'
                            : index === 1
                              ? 'bg-gray-50 border border-gray-200'
                              : index === 2
                                ? 'bg-orange-50 border border-orange-200'
                                : 'bg-white border'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0
                              ? 'bg-yellow-500 text-white'
                              : index === 1
                                ? 'bg-gray-400 text-white'
                                : index === 2
                                  ? 'bg-orange-400 text-white'
                                  : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <Avatar>
                          <AvatarFallback>
                            {rep.nombre
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{rep.nombre}</p>
                          <p className="text-sm text-gray-500">
                            {rep.clientesCaptados} clientes captados
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">€{rep.ventasMes.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">
                            {Math.round((rep.ventasMes / rep.metaMensual) * 100)}% de meta
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
