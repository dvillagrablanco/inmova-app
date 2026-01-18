'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Users,
  ArrowLeft,
  MoreVertical,
  Eye,
  Edit,
  Download,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Signature,
  Printer,
  Mail,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Acta {
  id: string;
  numero: string;
  titulo: string;
  tipo: 'ordinaria' | 'extraordinaria' | 'urgente';
  fecha: string;
  hora: string;
  lugar: string;
  estado: 'borrador' | 'pendiente_firma' | 'firmada' | 'enviada';
  asistentes: number;
  totalPropietarios: number;
  coeficienteAsistencia: number;
  puntos: PuntoOrden[];
  secretario?: string;
  presidente?: string;
  firmaDigital: boolean;
  archivoUrl?: string;
}

interface PuntoOrden {
  id: string;
  numero: number;
  titulo: string;
  descripcion: string;
  resultado?: 'aprobado' | 'rechazado' | 'aplazado' | 'informativo';
  votosAFavor?: number;
  votosEnContra?: number;
  abstenciones?: number;
}

const estadoColors: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-800',
  pendiente_firma: 'bg-amber-100 text-amber-800',
  firmada: 'bg-blue-100 text-blue-800',
  enviada: 'bg-green-100 text-green-800',
};

const tipoColors: Record<string, string> = {
  ordinaria: 'bg-blue-100 text-blue-800',
  extraordinaria: 'bg-purple-100 text-purple-800',
  urgente: 'bg-red-100 text-red-800',
};

const resultadoColors: Record<string, string> = {
  aprobado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
  aplazado: 'bg-amber-100 text-amber-800',
  informativo: 'bg-gray-100 text-gray-800',
};

export default function ActasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actas, setActas] = useState<Acta[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [showCreateActa, setShowCreateActa] = useState(false);
  const [activeTab, setActiveTab] = useState('todas');

  const [newActa, setNewActa] = useState({
    titulo: '',
    tipo: 'ordinaria' as const,
    fecha: '',
    hora: '',
    lugar: '',
    puntos: [] as { titulo: string; descripcion: string }[],
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const response = await fetch('/api/comunidades/actas');
      // const data = await response.json();
      // setActas(data.actas);
      
      // Estado vacío inicial
      setActas([]);
    } catch (error) {
      toast.error('Error al cargar las actas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActa = async () => {
    try {
      // TODO: Integrar con API real
      toast.success('Acta creada correctamente');
      setShowCreateActa(false);
      setNewActa({
        titulo: '',
        tipo: 'ordinaria',
        fecha: '',
        hora: '',
        lugar: '',
        puntos: [],
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear el acta');
    }
  };

  const filteredActas = actas.filter((acta) => {
    const matchesSearch = acta.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acta.numero.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEstado = estadoFilter === 'todos' || acta.estado === estadoFilter;
    const matchesTipo = tipoFilter === 'todos' || acta.tipo === tipoFilter;
    return matchesSearch && matchesEstado && matchesTipo;
  });

  // KPIs
  const totalActas = actas.length;
  const actasBorrador = actas.filter(a => a.estado === 'borrador').length;
  const actasPendienteFirma = actas.filter(a => a.estado === 'pendiente_firma').length;
  const actasFirmadas = actas.filter(a => a.estado === 'firmada').length;
  const actasEnviadas = actas.filter(a => a.estado === 'enviada').length;

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/comunidades')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="h-8 w-8 text-indigo-600" />
                Actas de Juntas
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestión de actas de reuniones y juntas de propietarios
              </p>
            </div>
          </div>
          <Dialog open={showCreateActa} onOpenChange={setShowCreateActa}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Acta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nueva Acta de Junta</DialogTitle>
                <DialogDescription>
                  Crear acta para una nueva junta de propietarios
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Título de la Junta</Label>
                  <Input
                    value={newActa.titulo}
                    onChange={(e) => setNewActa({...newActa, titulo: e.target.value})}
                    placeholder="Ej: Junta General Ordinaria 2026"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={newActa.tipo} onValueChange={(v: any) => setNewActa({...newActa, tipo: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ordinaria">Ordinaria</SelectItem>
                        <SelectItem value="extraordinaria">Extraordinaria</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Lugar</Label>
                    <Input
                      value={newActa.lugar}
                      onChange={(e) => setNewActa({...newActa, lugar: e.target.value})}
                      placeholder="Sala de reuniones del edificio"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={newActa.fecha}
                      onChange={(e) => setNewActa({...newActa, fecha: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Hora</Label>
                    <Input
                      type="time"
                      value={newActa.hora}
                      onChange={(e) => setNewActa({...newActa, hora: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Puntos del Orden del Día</Label>
                  <Textarea
                    placeholder="Añade los puntos del orden del día separados por líneas..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Podrás añadir más puntos y detalles después de crear el acta
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateActa(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateActa}>
                  Crear Acta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Actas</p>
                  <p className="text-2xl font-bold">{totalActas}</p>
                </div>
                <FileText className="h-8 w-8 text-indigo-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Borradores</p>
                  <p className="text-2xl font-bold text-gray-600">{actasBorrador}</p>
                </div>
                <Edit className="h-8 w-8 text-gray-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pend. Firma</p>
                  <p className="text-2xl font-bold text-amber-600">{actasPendienteFirma}</p>
                </div>
                <Signature className="h-8 w-8 text-amber-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Firmadas</p>
                  <p className="text-2xl font-bold text-blue-600">{actasFirmadas}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Enviadas</p>
                  <p className="text-2xl font-bold text-green-600">{actasEnviadas}</p>
                </div>
                <Send className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="borradores">Borradores</TabsTrigger>
            <TabsTrigger value="pendientes">Pendientes de Firma</TabsTrigger>
            <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar acta..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="pendiente_firma">Pend. Firma</SelectItem>
                      <SelectItem value="firmada">Firmada</SelectItem>
                      <SelectItem value="enviada">Enviada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="ordinaria">Ordinaria</SelectItem>
                      <SelectItem value="extraordinaria">Extraordinaria</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Actas */}
            {filteredActas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay actas</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea la primera acta de junta de propietarios
                  </p>
                  <Button onClick={() => setShowCreateActa(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Acta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredActas.map((acta) => (
                  <Card key={acta.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{acta.numero}</Badge>
                            <Badge className={tipoColors[acta.tipo]}>
                              {acta.tipo}
                            </Badge>
                            <Badge className={estadoColors[acta.estado]}>
                              {acta.estado.replace('_', ' ')}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold">{acta.titulo}</h3>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {acta.fecha} - {acta.hora}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {acta.asistentes}/{acta.totalPropietarios} asistentes ({acta.coeficienteAsistencia}%)
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {acta.firmaDigital && (
                            <Badge variant="outline" className="text-green-600">
                              <Signature className="h-3 w-3 mr-1" />
                              Firma Digital
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver acta
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Signature className="h-4 w-4 mr-2" />
                                Solicitar firmas
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Enviar a propietarios
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Descargar PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Printer className="h-4 w-4 mr-2" />
                                Imprimir
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Puntos del orden del día */}
                      {acta.puntos.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">Puntos del Orden del Día</h4>
                          <div className="space-y-2">
                            {acta.puntos.slice(0, 3).map((punto) => (
                              <div key={punto.id} className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">{punto.numero}.</span>
                                <span>{punto.titulo}</span>
                                {punto.resultado && (
                                  <Badge className={resultadoColors[punto.resultado]} variant="outline">
                                    {punto.resultado}
                                  </Badge>
                                )}
                              </div>
                            ))}
                            {acta.puntos.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{acta.puntos.length - 3} puntos más
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="borradores" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay borradores</h3>
                <p className="text-muted-foreground">
                  Los borradores de actas aparecerán aquí
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pendientes" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <Signature className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay actas pendientes de firma</h3>
                <p className="text-muted-foreground">
                  Las actas que requieren firma aparecerán aquí
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finalizadas" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay actas finalizadas</h3>
                <p className="text-muted-foreground">
                  Las actas firmadas y enviadas aparecerán aquí
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
