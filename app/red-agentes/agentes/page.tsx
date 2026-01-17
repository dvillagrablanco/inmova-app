'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Star,
  Building2,
  Calendar,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Award,
  TrendingUp,
} from 'lucide-react';

// Array vacío - se llenará con datos reales de la BD
const agentesData: Array<{
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  zona: string;
  estado: string;
  operaciones: number;
  comisiones: number;
  rating: number;
  fechaAlta: string;
  certificaciones: string[];
  avatar: string;
}> = [];

export default function RedAgentesAgentesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroZona, setFiltroZona] = useState('todas');

  const agentesFiltrados = agentesData.filter(agente => {
    const matchSearch = agente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       agente.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || agente.estado === filtroEstado;
    const matchZona = filtroZona === 'todas' || agente.zona === filtroZona;
    return matchSearch && matchEstado && matchZona;
  });

  const zonasUnicas = [...new Set(agentesData.map(a => a.zona))];

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/red-agentes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestión de Agentes</h1>
              <p className="text-muted-foreground">
                Directorio y administración de agentes de la red
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/red-agentes/registro')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Agente
          </Button>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agentesData.length}</p>
                <p className="text-xs text-muted-foreground">Total Agentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agentesData.filter(a => a.estado === 'activo').length}</p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agentesData.filter(a => a.certificaciones.length > 0).length}</p>
                <p className="text-xs text-muted-foreground">Certificados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agentesData.reduce((sum, a) => sum + a.operaciones, 0)}</p>
                <p className="text-xs text-muted-foreground">Operaciones Totales</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="inactivo">Inactivos</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroZona} onValueChange={setFiltroZona}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las zonas</SelectItem>
                  {zonasUnicas.map(zona => (
                    <SelectItem key={zona} value={zona}>{zona}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de agentes */}
        <div className="grid gap-4">
          {agentesFiltrados.map((agente) => (
            <Card key={agente.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Avatar y nombre */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {agente.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{agente.nombre}</h3>
                        <Badge variant={
                          agente.estado === 'activo' ? 'default' :
                          agente.estado === 'inactivo' ? 'secondary' : 'outline'
                        }>
                          {agente.estado}
                        </Badge>
                        {agente.certificaciones.map((cert, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {agente.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {agente.telefono}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Zona */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{agente.zona}</span>
                  </div>

                  {/* Métricas */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold">{agente.operaciones}</p>
                      <p className="text-xs text-muted-foreground">Operaciones</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">€{agente.comisiones.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Comisiones</p>
                    </div>
                    {agente.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-semibold">{agente.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/red-agentes/agentes/${agente.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Phone className="h-4 w-4 mr-2" />
                        Llamar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar email
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Dar de baja
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {agentesFiltrados.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron agentes</h3>
              <p className="text-muted-foreground mb-4">
                Prueba con otros filtros o registra un nuevo agente
              </p>
              <Button onClick={() => router.push('/red-agentes/registro')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Registrar Agente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
