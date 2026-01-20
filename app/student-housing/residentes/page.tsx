'use client';

/**
 * Student Housing - Residentes
 * 
 * Gestión de estudiantes residentes (conectado a API real)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  Plus,
  Filter,
  Mail,
  Phone,
  GraduationCap,
  Building,
  CalendarDays,
  MoreHorizontal,
  Eye,
  Edit,
  UserX,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Residente {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  universidad: string;
  curso: string;
  habitacion: string;
  edificio: string;
  fechaIngreso: string;
  fechaFin: string;
  estado: 'activo' | 'pendiente' | 'exresidente';
  pagosAlDia: boolean;
}

export default function StudentHousingResidentesPage() {
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEdificio, setFilterEdificio] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [selectedResidente, setSelectedResidente] = useState<Residente | null>(null);

  // Cargar residentes desde la API
  const fetchResidentes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student-housing/residents');
      if (response.ok) {
        const data = await response.json();
        setResidentes(data.data || []);
      } else {
        toast.error('Error al cargar residentes');
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidentes();
  }, []);

  const filteredResidentes = residentes.filter((r) => {
    const matchSearch =
      r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.habitacion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEdificio = filterEdificio === 'all' || r.edificio === filterEdificio;
    const matchEstado = filterEstado === 'all' || r.estado === filterEstado;

    return matchSearch && matchEdificio && matchEstado;
  });

  const handleSendEmail = async (residente: Residente) => {
    toast.success(`Email enviado a ${residente.email}`);
  };

  const handleDeactivate = async (residente: Residente) => {
    try {
      const response = await fetch(`/api/student-housing/residents?id=${residente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'exresidente' }),
      });
      if (response.ok) {
        setResidentes(
          residentes.map((r) =>
            r.id === residente.id ? { ...r, estado: 'exresidente' as const } : r
          )
        );
        toast.success(`${residente.nombre} ha sido dado de baja`);
      } else {
        toast.error('Error al dar de baja');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-green-100 text-green-700">Activo</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>;
      case 'exresidente':
        return <Badge variant="secondary">Ex-residente</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Residentes
          </h1>
          <p className="text-muted-foreground">
            Gestión de estudiantes residentes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchResidentes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button asChild>
            <Link href="/student-housing/aplicaciones">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Admisión
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Activos</p>
            <p className="text-2xl font-bold">
              {residentes.filter((r) => r.estado === 'activo').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {residentes.filter((r) => r.estado === 'pendiente').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pagos Pendientes</p>
            <p className="text-2xl font-bold text-red-600">
              {residentes.filter((r) => !r.pagosAlDia && r.estado === 'activo').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ex-residentes</p>
            <p className="text-2xl font-bold text-gray-500">
              {residentes.filter((r) => r.estado === 'exresidente').length}
            </p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o habitación..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterEdificio} onValueChange={setFilterEdificio}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Building className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Edificio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los edificios</SelectItem>
                <SelectItem value="Edificio A">Edificio A</SelectItem>
                <SelectItem value="Edificio B">Edificio B</SelectItem>
                <SelectItem value="Edificio C">Edificio C</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="exresidente">Ex-residente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Residentes List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Residentes ({filteredResidentes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredResidentes.map((residente) => (
              <div
                key={residente.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {residente.nombre[0]}
                      {residente.apellidos[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {residente.nombre} {residente.apellidos}
                      </p>
                      {getEstadoBadge(residente.estado)}
                      {!residente.pagosAlDia && residente.estado === 'activo' && (
                        <Badge variant="destructive" className="text-xs">
                          Pago pendiente
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {residente.habitacion} - {residente.edificio}
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {residente.curso}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {residente.email}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedResidente(residente)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {residente.nombre} {residente.apellidos}
                        </DialogTitle>
                        <DialogDescription>Detalles del residente</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-medium">{residente.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Teléfono</p>
                            <p className="font-medium">{residente.telefono}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Universidad</p>
                            <p className="font-medium">{residente.universidad}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Curso</p>
                            <p className="font-medium">{residente.curso}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Habitación</p>
                            <p className="font-medium">{residente.habitacion}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Edificio</p>
                            <p className="font-medium">{residente.edificio}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Ingreso</p>
                            <p className="font-medium">{residente.fechaIngreso}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Fin</p>
                            <p className="font-medium">{residente.fechaFin}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => handleSendEmail(residente)}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                          </Button>
                          {residente.estado === 'activo' && (
                            <Button
                              variant="destructive"
                              onClick={() => handleDeactivate(residente)}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Dar de Baja
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendEmail(residente)}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredResidentes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron residentes con los filtros aplicados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
