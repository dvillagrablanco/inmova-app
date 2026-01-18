'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Shield,
  Plus,
  Search,
  Calendar,
  ArrowLeft,
  MoreVertical,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Upload,
  AlertCircle,
  Clipboard,
  Bell,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

interface Normativa {
  id: string;
  nombre: string;
  categoria: 'seguridad' | 'medioambiente' | 'accesibilidad' | 'fiscal' | 'laboral' | 'proteccion_datos';
  descripcion: string;
  estado: 'cumplido' | 'pendiente' | 'no_cumplido' | 'en_revision' | 'no_aplica';
  fechaRevision: string;
  proximaRevision: string;
  responsable?: string;
  documentos: string[];
  observaciones?: string;
}

interface Auditoria {
  id: string;
  tipo: 'interna' | 'externa';
  fecha: string;
  auditor: string;
  resultado: 'favorable' | 'con_observaciones' | 'desfavorable';
  hallazgos: number;
  recomendaciones: number;
  estado: 'planificada' | 'en_curso' | 'completada';
}

interface Incidencia {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string;
  estado: 'abierta' | 'en_proceso' | 'cerrada';
  prioridad: 'alta' | 'media' | 'baja';
  responsable?: string;
}

const estadoNormativaColors: Record<string, string> = {
  cumplido: 'bg-green-100 text-green-800',
  pendiente: 'bg-amber-100 text-amber-800',
  no_cumplido: 'bg-red-100 text-red-800',
  en_revision: 'bg-blue-100 text-blue-800',
  no_aplica: 'bg-gray-100 text-gray-800',
};

const categoriaConfig: Record<string, { color: string; label: string }> = {
  seguridad: { color: 'bg-red-100 text-red-800', label: 'Seguridad' },
  medioambiente: { color: 'bg-green-100 text-green-800', label: 'Medio Ambiente' },
  accesibilidad: { color: 'bg-blue-100 text-blue-800', label: 'Accesibilidad' },
  fiscal: { color: 'bg-purple-100 text-purple-800', label: 'Fiscal' },
  laboral: { color: 'bg-amber-100 text-amber-800', label: 'Laboral' },
  proteccion_datos: { color: 'bg-indigo-100 text-indigo-800', label: 'LOPD/RGPD' },
};

export default function CumplimientoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [normativas, setNormativas] = useState<Normativa[]>([]);
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');
  const [showCreateNormativa, setShowCreateNormativa] = useState(false);
  const [activeTab, setActiveTab] = useState('normativas');

  const [newNormativa, setNewNormativa] = useState({
    nombre: '',
    categoria: 'seguridad' as const,
    descripcion: '',
    proximaRevision: '',
    responsable: '',
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
      // const response = await fetch('/api/comunidades/cumplimiento');
      // const data = await response.json();
      // setNormativas(data.normativas);
      // setAuditorias(data.auditorias);
      // setIncidencias(data.incidencias);
      
      // Estado vacío inicial
      setNormativas([]);
      setAuditorias([]);
      setIncidencias([]);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNormativa = async () => {
    try {
      // TODO: Integrar con API real
      toast.success('Normativa añadida correctamente');
      setShowCreateNormativa(false);
      setNewNormativa({
        nombre: '',
        categoria: 'seguridad',
        descripcion: '',
        proximaRevision: '',
        responsable: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al añadir la normativa');
    }
  };

  const filteredNormativas = normativas.filter((normativa) => {
    const matchesSearch = normativa.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategoria = categoriaFilter === 'todos' || normativa.categoria === categoriaFilter;
    return matchesSearch && matchesCategoria;
  });

  // KPIs
  const totalNormativas = normativas.length;
  const cumplidas = normativas.filter(n => n.estado === 'cumplido').length;
  const pendientes = normativas.filter(n => n.estado === 'pendiente').length;
  const noCumplidas = normativas.filter(n => n.estado === 'no_cumplido').length;
  const tasaCumplimiento = totalNormativas > 0 ? (cumplidas / totalNormativas) * 100 : 0;
  const incidenciasAbiertas = incidencias.filter(i => i.estado === 'abierta').length;

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
                <Shield className="h-8 w-8 text-green-600" />
                Cumplimiento Normativo
              </h1>
              <p className="text-muted-foreground mt-1">
                Control de normativas, auditorías y compliance
              </p>
            </div>
          </div>
          <Dialog open={showCreateNormativa} onOpenChange={setShowCreateNormativa}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Normativa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Normativa</DialogTitle>
                <DialogDescription>
                  Añadir requisito normativo para seguimiento
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nombre</Label>
                  <Input
                    value={newNormativa.nombre}
                    onChange={(e) => setNewNormativa({...newNormativa, nombre: e.target.value})}
                    placeholder="Ej: Certificado de eficiencia energética"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Categoría</Label>
                  <Select value={newNormativa.categoria} onValueChange={(v: any) => setNewNormativa({...newNormativa, categoria: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seguridad">Seguridad</SelectItem>
                      <SelectItem value="medioambiente">Medio Ambiente</SelectItem>
                      <SelectItem value="accesibilidad">Accesibilidad</SelectItem>
                      <SelectItem value="fiscal">Fiscal</SelectItem>
                      <SelectItem value="laboral">Laboral</SelectItem>
                      <SelectItem value="proteccion_datos">LOPD/RGPD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={newNormativa.descripcion}
                    onChange={(e) => setNewNormativa({...newNormativa, descripcion: e.target.value})}
                    placeholder="Descripción del requisito..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Próxima Revisión</Label>
                    <Input
                      type="date"
                      value={newNormativa.proximaRevision}
                      onChange={(e) => setNewNormativa({...newNormativa, proximaRevision: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Responsable</Label>
                    <Input
                      value={newNormativa.responsable}
                      onChange={(e) => setNewNormativa({...newNormativa, responsable: e.target.value})}
                      placeholder="Nombre del responsable"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateNormativa(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateNormativa}>
                  Añadir Normativa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{totalNormativas}</p>
                </div>
                <Clipboard className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cumplidas</p>
                  <p className="text-2xl font-bold text-green-600">{cumplidas}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-600">{pendientes}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">No Cumplidas</p>
                  <p className="text-2xl font-bold text-red-600">{noCumplidas}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cumplimiento</p>
                  <p className="text-2xl font-bold">{tasaCumplimiento.toFixed(0)}%</p>
                </div>
                <Shield className="h-8 w-8 text-green-600 opacity-20" />
              </div>
              <Progress value={tasaCumplimiento} className="h-1 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Incidencias</p>
                  <p className="text-2xl font-bold text-orange-600">{incidenciasAbiertas}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="normativas">Normativas</TabsTrigger>
            <TabsTrigger value="auditorias">Auditorías</TabsTrigger>
            <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="normativas" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar normativa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las categorías</SelectItem>
                      <SelectItem value="seguridad">Seguridad</SelectItem>
                      <SelectItem value="medioambiente">Medio Ambiente</SelectItem>
                      <SelectItem value="accesibilidad">Accesibilidad</SelectItem>
                      <SelectItem value="fiscal">Fiscal</SelectItem>
                      <SelectItem value="laboral">Laboral</SelectItem>
                      <SelectItem value="proteccion_datos">LOPD/RGPD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Normativas */}
            {filteredNormativas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay normativas</h3>
                  <p className="text-muted-foreground mb-4">
                    Añade requisitos normativos para hacer seguimiento
                  </p>
                  <Button onClick={() => setShowCreateNormativa(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Normativa
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNormativas.map((normativa) => {
                  const catConfig = categoriaConfig[normativa.categoria];
                  
                  return (
                    <Card key={normativa.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{normativa.nombre}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={catConfig.color}>
                                {catConfig.label}
                              </Badge>
                              <Badge className={estadoNormativaColors[normativa.estado]}>
                                {normativa.estado.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Upload className="h-4 w-4 mr-2" />
                                Adjuntar documento
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {normativa.descripcion}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Próxima revisión: {normativa.proximaRevision}
                          </div>
                          {normativa.responsable && (
                            <div className="text-muted-foreground">
                              Responsable: {normativa.responsable}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="auditorias" className="space-y-4">
            {auditorias.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clipboard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay auditorías</h3>
                  <p className="text-muted-foreground">
                    Las auditorías aparecerán aquí
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="incidencias" className="space-y-4">
            {incidencias.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay incidencias</h3>
                  <p className="text-muted-foreground">
                    Las incidencias de cumplimiento aparecerán aquí
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="documentos" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Documentos de Cumplimiento</h3>
                <p className="text-muted-foreground">
                  Repositorio de documentos relacionados con normativas
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
