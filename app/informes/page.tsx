'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Download,
  FileText,
  Plus,
  Search,
  Calendar,
  Clock,
  Settings,
  Play,
  Pause,
  Trash2,
  Copy,
  Eye,
  Edit,
  MoreHorizontal,
  Mail,
  Printer,
  BarChart3,
  PieChart,
  LineChart,
  Table as TableIcon,
  Filter,
  RefreshCw,
  Layers,
  Layout,
  FileSpreadsheet,
  FilePdf,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Informe {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'financiero' | 'operacional' | 'inquilinos' | 'propiedades' | 'personalizado';
  formato: 'pdf' | 'excel' | 'ambos';
  programado: boolean;
  frecuencia?: 'diario' | 'semanal' | 'mensual' | 'trimestral';
  proximaEjecucion?: string;
  ultimaEjecucion?: string;
  destinatarios?: string[];
  estado: 'activo' | 'pausado' | 'error';
  createdAt: string;
  campos: string[];
  filtros: Record<string, any>;
}

interface Plantilla {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  campos: string[];
  preview: string;
  usada: number;
}

interface Ejecucion {
  id: string;
  informeId: string;
  informeNombre: string;
  fechaEjecucion: string;
  estado: 'completado' | 'error' | 'en_progreso';
  registros: number;
  tiempoEjecucion: number; // en segundos
  archivoUrl?: string;
  error?: string;
}

const CAMPOS_DISPONIBLES = {
  propiedades: [
    { id: 'nombre', label: 'Nombre' },
    { id: 'direccion', label: 'Dirección' },
    { id: 'tipo', label: 'Tipo' },
    { id: 'estado', label: 'Estado' },
    { id: 'precio', label: 'Precio' },
    { id: 'superficie', label: 'Superficie' },
    { id: 'habitaciones', label: 'Habitaciones' },
    { id: 'ocupacion', label: 'Ocupación' },
  ],
  inquilinos: [
    { id: 'nombre', label: 'Nombre' },
    { id: 'email', label: 'Email' },
    { id: 'telefono', label: 'Teléfono' },
    { id: 'propiedad', label: 'Propiedad' },
    { id: 'contrato_inicio', label: 'Inicio Contrato' },
    { id: 'contrato_fin', label: 'Fin Contrato' },
    { id: 'renta', label: 'Renta Mensual' },
    { id: 'saldo_pendiente', label: 'Saldo Pendiente' },
  ],
  pagos: [
    { id: 'fecha', label: 'Fecha' },
    { id: 'inquilino', label: 'Inquilino' },
    { id: 'concepto', label: 'Concepto' },
    { id: 'monto', label: 'Monto' },
    { id: 'estado', label: 'Estado' },
    { id: 'metodo_pago', label: 'Método de Pago' },
  ],
  mantenimiento: [
    { id: 'fecha_solicitud', label: 'Fecha Solicitud' },
    { id: 'propiedad', label: 'Propiedad' },
    { id: 'categoria', label: 'Categoría' },
    { id: 'prioridad', label: 'Prioridad' },
    { id: 'estado', label: 'Estado' },
    { id: 'costo', label: 'Costo' },
    { id: 'tiempo_resolucion', label: 'Tiempo Resolución' },
  ],
};

export default function InformesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('informes');
  const [searchTerm, setSearchTerm] = useState('');

  const [informes, setInformes] = useState<Informe[]>([]);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [ejecuciones, setEjecuciones] = useState<Ejecucion[]>([]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedInforme, setSelectedInforme] = useState<Informe | null>(null);

  // Formulario de nuevo informe
  const [nuevoInforme, setNuevoInforme] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'propiedades' as keyof typeof CAMPOS_DISPONIBLES,
    formato: 'pdf' as 'pdf' | 'excel' | 'ambos',
    campos: [] as string[],
    programado: false,
    frecuencia: 'mensual' as 'diario' | 'semanal' | 'mensual' | 'trimestral',
    destinatarios: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const [informesRes, plantillasRes, ejecucionesRes] = await Promise.all([
      //   fetch('/api/informes'),
      //   fetch('/api/informes/plantillas'),
      //   fetch('/api/informes/ejecuciones'),
      // ]);

      // Estado vacío inicial
      setInformes([]);
      setPlantillas([]);
      setEjecuciones([]);
    } catch (error) {
      console.error('Error cargando informes:', error);
      toast.error('Error al cargar informes');
    } finally {
      setLoading(false);
    }
  };

  const crearInforme = async () => {
    if (!nuevoInforme.nombre || nuevoInforme.campos.length === 0) {
      toast.error('Completa el nombre y selecciona al menos un campo');
      return;
    }

    try {
      // TODO: Integrar con API real
      // await fetch('/api/informes', {
      //   method: 'POST',
      //   body: JSON.stringify(nuevoInforme),
      // });

      toast.success('Informe creado exitosamente');
      setShowCreateDialog(false);
      setNuevoInforme({
        nombre: '',
        descripcion: '',
        tipo: 'propiedades',
        formato: 'pdf',
        campos: [],
        programado: false,
        frecuencia: 'mensual',
        destinatarios: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear informe');
    }
  };

  const ejecutarInforme = async (id: string) => {
    try {
      // TODO: Integrar con API real
      // await fetch(`/api/informes/${id}/ejecutar`, { method: 'POST' });
      toast.success('Informe en proceso de generación');
      loadData();
    } catch (error) {
      toast.error('Error al ejecutar informe');
    }
  };

  const pausarInforme = async (id: string) => {
    try {
      // TODO: Integrar con API real
      toast.success('Programación de informe pausada');
      loadData();
    } catch (error) {
      toast.error('Error al pausar informe');
    }
  };

  const eliminarInforme = async (id: string) => {
    try {
      // TODO: Integrar con API real
      toast.success('Informe eliminado');
      loadData();
    } catch (error) {
      toast.error('Error al eliminar informe');
    }
  };

  const toggleCampo = (campo: string) => {
    setNuevoInforme(prev => ({
      ...prev,
      campos: prev.campos.includes(campo)
        ? prev.campos.filter(c => c !== campo)
        : [...prev.campos, campo]
    }));
  };

  const filteredInformes = informes.filter(i =>
    i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando informes...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="h-8 w-8 text-blue-600" />
                Informes Personalizados
              </h1>
              <p className="text-muted-foreground mt-1">
                Crea, programa y exporta informes a medida
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Informe
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Informes</span>
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{informes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Programados</span>
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold">
                {informes.filter(i => i.programado && i.estado === 'activo').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Ejecutados Hoy</span>
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">
                {ejecuciones.filter(e => 
                  new Date(e.fechaEjecucion).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Plantillas</span>
                <Layers className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold">{plantillas.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="informes">
              <FileText className="h-4 w-4 mr-2" />
              Mis Informes
            </TabsTrigger>
            <TabsTrigger value="plantillas">
              <Layers className="h-4 w-4 mr-2" />
              Plantillas
            </TabsTrigger>
            <TabsTrigger value="historial">
              <Clock className="h-4 w-4 mr-2" />
              Historial de Ejecuciones
            </TabsTrigger>
          </TabsList>

          {/* Mis Informes */}
          <TabsContent value="informes" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar informes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredInformes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay informes personalizados</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Crea tu primer informe personalizado para exportar datos según tus necesidades específicas.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Informe
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInformes.map((informe) => (
                  <Card key={informe.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{informe.nombre}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">
                            {informe.descripcion}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => ejecutarInforme(informe.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Ejecutar Ahora
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedInforme(informe);
                              setShowConfigDialog(true);
                            }}>
                              <Settings className="h-4 w-4 mr-2" />
                              Configurar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(informe.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => eliminarInforme(informe.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{informe.tipo}</Badge>
                          <Badge variant={informe.formato === 'pdf' ? 'destructive' : informe.formato === 'excel' ? 'default' : 'secondary'}>
                            {informe.formato.toUpperCase()}
                          </Badge>
                          {informe.programado && (
                            <Badge variant={informe.estado === 'activo' ? 'default' : 'secondary'}>
                              <Clock className="h-3 w-3 mr-1" />
                              {informe.frecuencia}
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <p>{informe.campos.length} campos seleccionados</p>
                          {informe.ultimaEjecucion && (
                            <p>Última ejecución: {new Date(informe.ultimaEjecucion).toLocaleDateString('es-ES')}</p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button size="sm" onClick={() => ejecutarInforme(informe.id)}>
                            <Play className="h-3 w-3 mr-1" />
                            Ejecutar
                          </Button>
                          {informe.programado && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => pausarInforme(informe.id)}
                            >
                              {informe.estado === 'activo' ? (
                                <><Pause className="h-3 w-3 mr-1" /> Pausar</>
                              ) : (
                                <><Play className="h-3 w-3 mr-1" /> Activar</>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Plantillas */}
          <TabsContent value="plantillas" className="space-y-4">
            {plantillas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Layers className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Plantillas predefinidas</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Utiliza nuestras plantillas predefinidas para crear informes rápidamente.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-3xl mx-auto">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCreateDialog(true)}>
                      <CardContent className="p-4 text-center">
                        <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h4 className="font-medium">Resumen Financiero</h4>
                        <p className="text-xs text-muted-foreground">Ingresos, gastos y rentabilidad</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCreateDialog(true)}>
                      <CardContent className="p-4 text-center">
                        <PieChart className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h4 className="font-medium">Ocupación</h4>
                        <p className="text-xs text-muted-foreground">Estado de todas las unidades</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCreateDialog(true)}>
                      <CardContent className="p-4 text-center">
                        <LineChart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <h4 className="font-medium">Cobranza</h4>
                        <p className="text-xs text-muted-foreground">Estado de pagos e impagos</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plantillas.map((plantilla) => (
                  <Card key={plantilla.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{plantilla.nombre}</CardTitle>
                      <CardDescription className="line-clamp-2">{plantilla.descripcion}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="outline">{plantilla.tipo}</Badge>
                        <p className="text-xs text-muted-foreground">
                          {plantilla.campos.length} campos • Usada {plantilla.usada} veces
                        </p>
                        <Button size="sm" className="w-full">
                          Usar Plantilla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Historial de Ejecuciones */}
          <TabsContent value="historial" className="space-y-4">
            {ejecuciones.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin ejecuciones registradas</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Aquí aparecerá el historial de todas las ejecuciones de tus informes.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Ejecuciones</CardTitle>
                  <CardDescription>Últimas ejecuciones de informes</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Informe</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Registros</TableHead>
                        <TableHead>Tiempo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ejecuciones.map((ejecucion) => (
                        <TableRow key={ejecucion.id}>
                          <TableCell className="font-medium">{ejecucion.informeNombre}</TableCell>
                          <TableCell>
                            {new Date(ejecucion.fechaEjecucion).toLocaleString('es-ES')}
                          </TableCell>
                          <TableCell>{ejecucion.registros.toLocaleString('es-ES')}</TableCell>
                          <TableCell>{ejecucion.tiempoEjecucion}s</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                ejecucion.estado === 'completado' ? 'default' :
                                ejecucion.estado === 'error' ? 'destructive' : 'secondary'
                              }
                            >
                              {ejecucion.estado === 'completado' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {ejecucion.estado === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {ejecucion.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {ejecucion.archivoUrl && (
                              <Button size="sm" variant="outline">
                                <Download className="h-3 w-3 mr-1" />
                                Descargar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog Crear Informe */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Informe</DialogTitle>
              <DialogDescription>
                Configura los campos y opciones para tu informe personalizado
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Nombre y Descripción */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Informe *</Label>
                  <Input
                    id="nombre"
                    value={nuevoInforme.nombre}
                    onChange={(e) => setNuevoInforme({...nuevoInforme, nombre: e.target.value})}
                    placeholder="Ej: Reporte mensual de ocupación"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={nuevoInforme.descripcion}
                    onChange={(e) => setNuevoInforme({...nuevoInforme, descripcion: e.target.value})}
                    placeholder="Describe brevemente el contenido del informe..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Tipo y Formato */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Datos</Label>
                  <Select 
                    value={nuevoInforme.tipo} 
                    onValueChange={(v) => setNuevoInforme({...nuevoInforme, tipo: v as any, campos: []})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="propiedades">Propiedades</SelectItem>
                      <SelectItem value="inquilinos">Inquilinos</SelectItem>
                      <SelectItem value="pagos">Pagos</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Formato de Exportación</Label>
                  <Select 
                    value={nuevoInforme.formato} 
                    onValueChange={(v) => setNuevoInforme({...nuevoInforme, formato: v as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <div className="flex items-center">
                          <FilePdf className="h-4 w-4 mr-2 text-red-600" />
                          PDF
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center">
                          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                          Excel
                        </div>
                      </SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Campos a incluir */}
              <div className="space-y-2">
                <Label>Campos a Incluir *</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {CAMPOS_DISPONIBLES[nuevoInforme.tipo]?.map((campo) => (
                      <div key={campo.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={campo.id}
                          checked={nuevoInforme.campos.includes(campo.id)}
                          onCheckedChange={() => toggleCampo(campo.id)}
                        />
                        <Label htmlFor={campo.id} className="text-sm font-normal cursor-pointer">
                          {campo.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {nuevoInforme.campos.length} campos seleccionados
                </p>
              </div>

              {/* Programación */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="programado"
                    checked={nuevoInforme.programado}
                    onCheckedChange={(checked) => setNuevoInforme({...nuevoInforme, programado: !!checked})}
                  />
                  <Label htmlFor="programado" className="cursor-pointer">
                    Programar generación automática
                  </Label>
                </div>

                {nuevoInforme.programado && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label>Frecuencia</Label>
                      <Select 
                        value={nuevoInforme.frecuencia} 
                        onValueChange={(v) => setNuevoInforme({...nuevoInforme, frecuencia: v as any})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diario">Diario</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="mensual">Mensual</SelectItem>
                          <SelectItem value="trimestral">Trimestral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Destinatarios (emails)</Label>
                      <Input
                        value={nuevoInforme.destinatarios}
                        onChange={(e) => setNuevoInforme({...nuevoInforme, destinatarios: e.target.value})}
                        placeholder="email1@ejemplo.com, email2@ejemplo.com"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={crearInforme}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Informe
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
