'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  Users,
  Search,
  Plus,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Plane,
  Hotel,
  Eye,
  Edit,
  Award,
  TrendingUp,
  Coffee,
  Wifi,
  Car,
} from 'lucide-react';
import { toast } from 'sonner';

// Tipos
interface Huesped {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  departamento: string;
  cargo: string;
  nivelViajero: string;
  viajesAnuales: number;
  gastoAnual: number;
  ultimoViaje: string | null;
  proximoViaje: string | null;
  preferencias: {
    tipoHabitacion: string;
    piso: string;
    fumador: boolean;
    desayuno: boolean;
    wifi: boolean;
    parking: boolean;
    lateCheckout: boolean;
    dietaEspecial: string | null;
    asientoAvion: string;
  };
  documento: {
    tipo: string;
    numero: string;
    fechaExpiracion: string;
  };
  activo: boolean;
  fechaAlta: string;
  notas: string;
}

export default function ViajesCorporativosGuestsPage() {
  const [huespedes, setHuespedes] = useState<Huesped[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos');
  const [filtroNivel, setFiltroNivel] = useState('todos');

  useEffect(() => {
    const fetchHuespedes = async () => {
      try {
        const response = await fetch('/api/viajes-corporativos/guests');
        if (response.ok) {
          const data = await response.json();
          setHuespedes(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching guests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHuespedes();
  }, []);
  const [busqueda, setBusqueda] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    departamento: '',
    cargo: '',
  });

  const huespedesFiltrados = huespedes.filter((huesped) => {
    const matchDepartamento = filtroDepartamento === 'todos' || huesped.departamento === filtroDepartamento;
    const matchNivel = filtroNivel === 'todos' || huesped.nivelViajero === filtroNivel;
    const matchBusqueda = 
      huesped.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      huesped.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      huesped.departamento.toLowerCase().includes(busqueda.toLowerCase());
    return matchDepartamento && matchNivel && matchBusqueda;
  });

  const stats = {
    totalEmpleados: huespedes.length,
    activos: huespedes.filter(h => h.activo).length,
    viajesTotal: huespedes.reduce((sum, h) => sum + h.viajesAnuales, 0),
    gastoTotal: huespedes.reduce((sum, h) => sum + h.gastoAnual, 0),
  };

  const departamentos = [...new Set(huespedes.map(h => h.departamento))];

  const getNivelBadge = (nivel: string) => {
    switch (nivel) {
      case 'platinum':
        return <Badge className="bg-purple-100 text-purple-700"><Award className="h-3 w-3 mr-1" />Platinum</Badge>;
      case 'gold':
        return <Badge className="bg-yellow-100 text-yellow-700"><Star className="h-3 w-3 mr-1" />Gold</Badge>;
      case 'silver':
        return <Badge className="bg-gray-200 text-gray-700"><Star className="h-3 w-3 mr-1" />Silver</Badge>;
      default:
        return <Badge className="bg-orange-100 text-orange-700">Bronze</Badge>;
    }
  };

  const handleCrearEmpleado = () => {
    if (!formData.nombre || !formData.email || !formData.departamento) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    toast.success('Empleado añadido al sistema de viajes');
    setIsDialogOpen(false);
    setFormData({ nombre: '', email: '', telefono: '', departamento: '', cargo: '' });
  };

  const handleEnviarEmail = (huesped: Huesped) => {
    toast.success(`Abriendo correo para ${huesped.email}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Huéspedes Corporativos</h1>
          <p className="text-muted-foreground">Directorio de empleados y sus preferencias de viaje</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Añadir Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Añadir Empleado</DialogTitle>
              <DialogDescription>
                Registra un nuevo empleado en el sistema de viajes corporativos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nombre completo *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Nombre y apellidos"
                />
              </div>
              <div>
                <Label>Email corporativo *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  placeholder="+34 600 000 000"
                />
              </div>
              <div>
                <Label>Departamento *</Label>
                <Select value={formData.departamento} onValueChange={(v) => setFormData({...formData, departamento: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                    <SelectItem value="nuevo">+ Nuevo departamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  value={formData.cargo}
                  onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                  placeholder="Ej: Manager, Director..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCrearEmpleado}>Añadir Empleado</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{stats.totalEmpleados}</p>
              <p className="text-sm text-muted-foreground">Empleados Registrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Plane className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">{stats.viajesTotal}</p>
              <p className="text-sm text-muted-foreground">Viajes/Año</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{stats.gastoTotal.toLocaleString()}€</p>
              <p className="text-sm text-muted-foreground">Gasto Anual Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold">{huespedes.filter(h => h.nivelViajero === 'platinum' || h.nivelViajero === 'gold').length}</p>
              <p className="text-sm text-muted-foreground">Viajeros Premium</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o departamento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los departamentos</SelectItem>
                {departamentos.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroNivel} onValueChange={setFiltroNivel}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los niveles</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de empleados */}
      <div className="space-y-4">
        {huespedesFiltrados.map((huesped) => (
          <Card key={huesped.id}>
            <CardContent className="pt-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="text-lg">
                      {huesped.nombre.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-lg">{huesped.nombre}</p>
                      {getNivelBadge(huesped.nivelViajero)}
                    </div>
                    <p className="text-sm text-muted-foreground">{huesped.cargo} · {huesped.departamento}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {huesped.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {huesped.telefono}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  <div className="text-center px-4">
                    <p className="text-lg font-bold">{huesped.viajesAnuales}</p>
                    <p className="text-xs text-muted-foreground">viajes/año</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-lg font-bold">{huesped.gastoAnual.toLocaleString()}€</p>
                    <p className="text-xs text-muted-foreground">gasto anual</p>
                  </div>
                  {huesped.proximoViaje && (
                    <div className="text-center px-4">
                      <p className="text-sm font-medium text-blue-600">
                        {new Date(huesped.proximoViaje).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-muted-foreground">próximo viaje</p>
                    </div>
                  )}

                  <div className="flex gap-2 ml-auto">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Perfil de {huesped.nombre}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarFallback className="text-xl">
                                {huesped.nombre.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-lg">{huesped.nombre}</p>
                              <p className="text-muted-foreground">{huesped.cargo}</p>
                              {getNivelBadge(huesped.nivelViajero)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Email</p>
                              <p>{huesped.email}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Teléfono</p>
                              <p>{huesped.telefono}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Departamento</p>
                              <p>{huesped.departamento}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Fecha alta</p>
                              <p>{new Date(huesped.fechaAlta).toLocaleDateString('es-ES')}</p>
                            </div>
                          </div>

                          <div>
                            <p className="font-medium mb-2">Documento de identidad</p>
                            <div className="p-3 bg-muted rounded-lg text-sm">
                              <p>{huesped.documento.tipo}: {huesped.documento.numero}</p>
                              <p className="text-muted-foreground">
                                Expira: {new Date(huesped.documento.fechaExpiracion).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="font-medium mb-2">Preferencias de viaje</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Hotel className="h-4 w-4 text-muted-foreground" />
                                {huesped.preferencias.tipoHabitacion}
                              </div>
                              <div className="flex items-center gap-2">
                                <Plane className="h-4 w-4 text-muted-foreground" />
                                Asiento: {huesped.preferencias.asientoAvion}
                              </div>
                              {huesped.preferencias.desayuno && (
                                <div className="flex items-center gap-2">
                                  <Coffee className="h-4 w-4 text-green-500" />
                                  Desayuno incluido
                                </div>
                              )}
                              {huesped.preferencias.wifi && (
                                <div className="flex items-center gap-2">
                                  <Wifi className="h-4 w-4 text-blue-500" />
                                  WiFi premium
                                </div>
                              )}
                              {huesped.preferencias.parking && (
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4 text-purple-500" />
                                  Parking
                                </div>
                              )}
                              {huesped.preferencias.dietaEspecial && (
                                <div className="flex items-center gap-2 col-span-2">
                                  <span className="text-orange-500">🍽️</span>
                                  Dieta: {huesped.preferencias.dietaEspecial}
                                </div>
                              )}
                            </div>
                          </div>

                          {huesped.notas && (
                            <div>
                              <p className="font-medium mb-2">Notas</p>
                              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                {huesped.notas}
                              </p>
                            </div>
                          )}

                          <div className="pt-4 border-t">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold">{huesped.viajesAnuales}</p>
                                <p className="text-xs text-muted-foreground">Viajes/año</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold">{huesped.gastoAnual.toLocaleString()}€</p>
                                <p className="text-xs text-muted-foreground">Gasto anual</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold">{Math.round(huesped.gastoAnual / huesped.viajesAnuales)}€</p>
                                <p className="text-xs text-muted-foreground">Media/viaje</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Perfil
                          </Button>
                          <Button onClick={() => handleEnviarEmail(huesped)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => handleEnviarEmail(huesped)}>
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {huespedesFiltrados.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron empleados con los filtros aplicados</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
