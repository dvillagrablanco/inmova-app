'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ClipboardCheck,
  Plus,
  Home,
  Building2,
  Wrench,
  Zap,
  Droplets,
  Flame,
  PaintBucket,
  FileText,
  TrendingUp,
  Euro,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Download,
  Share2,
} from 'lucide-react';

// Definición de categorías y items del checklist
const CHECKLIST_TEMPLATE = {
  estructura: {
    nombre: 'Estado Estructural',
    icon: Building2,
    color: 'text-blue-600',
    items: [
      { id: 'cimientos', nombre: 'Estado de cimientos', critico: true },
      { id: 'pilares', nombre: 'Pilares y vigas', critico: true },
      { id: 'forjados', nombre: 'Forjados y techos', critico: true },
      { id: 'muros_carga', nombre: 'Muros de carga', critico: true },
      { id: 'grietas', nombre: 'Grietas estructurales', critico: true },
      { id: 'humedad_estructural', nombre: 'Humedades estructurales', critico: true },
      { id: 'cubierta', nombre: 'Estado de cubierta/tejado', critico: false },
      { id: 'fachada', nombre: 'Estado de fachada', critico: false },
    ],
  },
  instalaciones_electricas: {
    nombre: 'Instalación Eléctrica',
    icon: Zap,
    color: 'text-yellow-600',
    items: [
      { id: 'cuadro_electrico', nombre: 'Cuadro eléctrico', critico: true },
      { id: 'cableado', nombre: 'Estado del cableado', critico: true },
      { id: 'toma_tierra', nombre: 'Toma de tierra', critico: true },
      { id: 'enchufes', nombre: 'Enchufes y puntos de luz', critico: false },
      { id: 'potencia', nombre: 'Potencia contratada adecuada', critico: false },
      { id: 'boletin', nombre: 'Boletín eléctrico vigente', critico: true },
    ],
  },
  fontaneria: {
    nombre: 'Fontanería',
    icon: Droplets,
    color: 'text-cyan-600',
    items: [
      { id: 'tuberias', nombre: 'Estado de tuberías', critico: true },
      { id: 'presion_agua', nombre: 'Presión de agua', critico: false },
      { id: 'calentador', nombre: 'Calentador/Caldera', critico: false },
      { id: 'desagues', nombre: 'Desagües y saneamiento', critico: true },
      { id: 'griferia', nombre: 'Grifería', critico: false },
      { id: 'fugas', nombre: 'Fugas o humedades', critico: true },
    ],
  },
  gas: {
    nombre: 'Instalación de Gas',
    icon: Flame,
    color: 'text-orange-600',
    items: [
      { id: 'instalacion_gas', nombre: 'Instalación de gas', critico: true },
      { id: 'certificado_gas', nombre: 'Certificado de gas vigente', critico: true },
      { id: 'caldera_gas', nombre: 'Estado de caldera', critico: false },
      { id: 'ventilacion', nombre: 'Ventilación adecuada', critico: true },
    ],
  },
  acabados: {
    nombre: 'Acabados e Interiores',
    icon: PaintBucket,
    color: 'text-purple-600',
    items: [
      { id: 'suelos', nombre: 'Estado de suelos', critico: false },
      { id: 'paredes', nombre: 'Estado de paredes', critico: false },
      { id: 'techos', nombre: 'Estado de techos', critico: false },
      { id: 'carpinteria_int', nombre: 'Carpintería interior', critico: false },
      { id: 'ventanas', nombre: 'Ventanas y cerramientos', critico: false },
      { id: 'cocina', nombre: 'Estado de cocina', critico: false },
      { id: 'banos', nombre: 'Estado de baños', critico: false },
    ],
  },
  documentacion: {
    nombre: 'Documentación Legal',
    icon: FileText,
    color: 'text-green-600',
    items: [
      { id: 'escrituras', nombre: 'Escrituras en orden', critico: true },
      { id: 'cargas', nombre: 'Nota simple sin cargas', critico: true },
      { id: 'ibi', nombre: 'IBI al día', critico: true },
      { id: 'comunidad', nombre: 'Comunidad al día', critico: true },
      { id: 'licencias', nombre: 'Licencias y permisos', critico: false },
      { id: 'cee', nombre: 'Certificado energético', critico: true },
      { id: 'cedula', nombre: 'Cédula de habitabilidad', critico: true },
    ],
  },
  ubicacion: {
    nombre: 'Ubicación y Entorno',
    icon: MapPin,
    color: 'text-red-600',
    items: [
      { id: 'zona', nombre: 'Calidad de la zona', critico: false },
      { id: 'transporte', nombre: 'Transporte público', critico: false },
      { id: 'servicios', nombre: 'Servicios cercanos', critico: false },
      { id: 'ruido', nombre: 'Nivel de ruido', critico: false },
      { id: 'orientacion', nombre: 'Orientación solar', critico: false },
      { id: 'parking', nombre: 'Parking disponible', critico: false },
    ],
  },
  potencial: {
    nombre: 'Potencial de Inversión',
    icon: TrendingUp,
    color: 'text-emerald-600',
    items: [
      { id: 'precio_m2', nombre: 'Precio/m² vs mercado', critico: false },
      { id: 'potencial_reforma', nombre: 'Potencial de reforma', critico: false },
      { id: 'demanda_zona', nombre: 'Demanda en la zona', critico: false },
      { id: 'rentabilidad', nombre: 'Rentabilidad estimada', critico: false },
      { id: 'tiempo_venta', nombre: 'Tiempo estimado venta', critico: false },
    ],
  },
};

type ChecklistItemStatus = 'pendiente' | 'ok' | 'problema' | 'critico';

interface ChecklistItem {
  id: string;
  nombre: string;
  critico: boolean;
  status: ChecklistItemStatus;
  notas: string;
  costeEstimado?: number;
}

interface ChecklistCategory {
  nombre: string;
  items: ChecklistItem[];
  completado: number;
}

interface PropertyChecklist {
  id: string;
  direccion: string;
  referencia?: string;
  precioVenta: number;
  metrosCuadrados: number;
  fechaVisita: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'descartado';
  puntuacion: number;
  categorias: Record<string, ChecklistCategory>;
  notasGenerales: string;
  costeReformaEstimado: number;
  createdAt: string;
  updatedAt: string;
}

export default function FlippingChecklistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState<PropertyChecklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<PropertyChecklist | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('estructura');

  const [newProperty, setNewProperty] = useState({
    direccion: '',
    referencia: '',
    precioVenta: 0,
    metrosCuadrados: 0,
    fechaVisita: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/flipping/checklist');
    } else if (status === 'authenticated') {
      loadChecklists();
    }
  }, [status, router]);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/flipping/checklist');
      if (res.ok) {
        const data = await res.json();
        setChecklists(data.checklists || []);
      }
    } catch (error) {
      console.error('Error loading checklists:', error);
      toast.error('Error al cargar los checklists');
    } finally {
      setLoading(false);
    }
  };

  const createNewChecklist = (): PropertyChecklist => {
    const categorias: Record<string, ChecklistCategory> = {};

    Object.entries(CHECKLIST_TEMPLATE).forEach(([key, cat]) => {
      categorias[key] = {
        nombre: cat.nombre,
        completado: 0,
        items: cat.items.map((item) => ({
          ...item,
          status: 'pendiente' as ChecklistItemStatus,
          notas: '',
          costeEstimado: 0,
        })),
      };
    });

    return {
      id: `temp-${Date.now()}`,
      direccion: newProperty.direccion,
      referencia: newProperty.referencia,
      precioVenta: newProperty.precioVenta,
      metrosCuadrados: newProperty.metrosCuadrados,
      fechaVisita: newProperty.fechaVisita,
      estado: 'pendiente',
      puntuacion: 0,
      categorias,
      notasGenerales: '',
      costeReformaEstimado: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleCreateChecklist = async () => {
    if (!newProperty.direccion) {
      toast.error('La dirección es obligatoria');
      return;
    }

    try {
      const checklist = createNewChecklist();

      const res = await fetch('/api/flipping/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checklist),
      });

      if (res.ok) {
        const data = await res.json();
        setChecklists((prev) => [data.checklist, ...prev]);
        setDialogOpen(false);
        setNewProperty({
          direccion: '',
          referencia: '',
          precioVenta: 0,
          metrosCuadrados: 0,
          fechaVisita: new Date().toISOString().split('T')[0],
        });
        toast.success('Checklist creado exitosamente');
      } else {
        throw new Error('Error al crear checklist');
      }
    } catch (error) {
      toast.error('Error al crear el checklist');
    }
  };

  const updateItemStatus = (
    checklistId: string,
    categoryKey: string,
    itemId: string,
    status: ChecklistItemStatus,
    notas?: string,
    coste?: number
  ) => {
    setChecklists((prev) =>
      prev.map((cl) => {
        if (cl.id !== checklistId) return cl;

        const newCategorias = { ...cl.categorias };
        const category = newCategorias[categoryKey];

        if (category) {
          category.items = category.items.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              status,
              notas: notas !== undefined ? notas : item.notas,
              costeEstimado: coste !== undefined ? coste : item.costeEstimado,
            };
          });

          // Recalcular completado
          const completados = category.items.filter((i) => i.status !== 'pendiente').length;
          category.completado = Math.round((completados / category.items.length) * 100);
        }

        // Recalcular puntuación general y coste
        let totalItems = 0;
        let itemsOk = 0;
        let costeTotal = 0;

        Object.values(newCategorias).forEach((cat) => {
          cat.items.forEach((item) => {
            totalItems++;
            if (item.status === 'ok') itemsOk++;
            costeTotal += item.costeEstimado || 0;
          });
        });

        return {
          ...cl,
          categorias: newCategorias,
          puntuacion: Math.round((itemsOk / totalItems) * 100),
          costeReformaEstimado: costeTotal,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    // También actualizar selectedChecklist si está abierto
    if (selectedChecklist?.id === checklistId) {
      setSelectedChecklist((prev) => {
        if (!prev) return null;
        const updated = checklists.find((c) => c.id === checklistId);
        return updated || prev;
      });
    }
  };

  const saveChecklist = async (checklist: PropertyChecklist) => {
    try {
      const res = await fetch('/api/flipping/checklist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checklist),
      });

      if (res.ok) {
        toast.success('Checklist guardado');
      }
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const deleteChecklist = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este checklist?')) return;

    try {
      const res = await fetch(`/api/flipping/checklist?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setChecklists((prev) => prev.filter((c) => c.id !== id));
        toast.success('Checklist eliminado');
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const getStatusIcon = (status: ChecklistItemStatus) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'problema':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critico':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getEstadoBadge = (estado: string) => {
    const config: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      pendiente: { label: 'Pendiente', variant: 'outline' },
      en_proceso: { label: 'En Proceso', variant: 'secondary' },
      completado: { label: 'Completado', variant: 'default' },
      descartado: { label: 'Descartado', variant: 'destructive' },
    };
    const c = config[estado] || config.pendiente;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPuntuacionColor = (puntuacion: number) => {
    if (puntuacion >= 80) return 'text-green-600';
    if (puntuacion >= 60) return 'text-yellow-600';
    if (puntuacion >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              Checklist de Análisis
            </h1>
            <p className="text-muted-foreground">Evalúa viviendas para proyectos de flipping</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Evaluación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Vivienda a Analizar</DialogTitle>
                <DialogDescription>Introduce los datos básicos de la vivienda</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Dirección *</Label>
                  <Input
                    value={newProperty.direccion}
                    onChange={(e) => setNewProperty({ ...newProperty, direccion: e.target.value })}
                    placeholder="Calle, número, ciudad"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Referencia (opcional)</Label>
                  <Input
                    value={newProperty.referencia}
                    onChange={(e) => setNewProperty({ ...newProperty, referencia: e.target.value })}
                    placeholder="Ref. portal inmobiliario"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Precio de Venta (€)</Label>
                    <Input
                      type="number"
                      value={newProperty.precioVenta || ''}
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          precioVenta: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>m² Construidos</Label>
                    <Input
                      type="number"
                      value={newProperty.metrosCuadrados || ''}
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          metrosCuadrados: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Visita</Label>
                  <Input
                    type="date"
                    value={newProperty.fechaVisita}
                    onChange={(e) =>
                      setNewProperty({ ...newProperty, fechaVisita: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateChecklist}>Crear Checklist</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{checklists.length}</div>
              <div className="text-sm text-muted-foreground">Total Evaluaciones</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">
                {checklists.filter((c) => c.estado === 'en_proceso').length}
              </div>
              <div className="text-sm text-muted-foreground">En Proceso</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {checklists.filter((c) => c.estado === 'completado').length}
              </div>
              <div className="text-sm text-muted-foreground">Completados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {checklists.length > 0
                  ? Math.round(
                      checklists.reduce((sum, c) => sum + c.puntuacion, 0) / checklists.length
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-muted-foreground">Puntuación Media</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Checklists */}
        {checklists.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No hay evaluaciones</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primer checklist para evaluar una vivienda
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Evaluación
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checklists.map((checklist) => (
              <Card key={checklist.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-1">
                        {checklist.direccion}
                      </CardTitle>
                      {checklist.referencia && (
                        <CardDescription className="text-xs">
                          Ref: {checklist.referencia}
                        </CardDescription>
                      )}
                    </div>
                    {getEstadoBadge(checklist.estado)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Precio:</span>
                      <span className="font-medium">{formatCurrency(checklist.precioVenta)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Superficie:</span>
                      <span className="font-medium">{checklist.metrosCuadrados} m²</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">€/m²:</span>
                      <span className="font-medium">
                        {checklist.metrosCuadrados > 0
                          ? formatCurrency(checklist.precioVenta / checklist.metrosCuadrados)
                          : '-'}
                      </span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Puntuación:</span>
                        <span className={`font-bold ${getPuntuacionColor(checklist.puntuacion)}`}>
                          {checklist.puntuacion}%
                        </span>
                      </div>
                      <Progress value={checklist.puntuacion} className="h-2" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coste Reforma Est.:</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(checklist.costeReformaEstimado)}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedChecklist(checklist);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Evaluar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteChecklist(checklist.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Evaluación Detallada */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {selectedChecklist && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    {selectedChecklist.direccion}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-4">
                    <span>{formatCurrency(selectedChecklist.precioVenta)}</span>
                    <span>{selectedChecklist.metrosCuadrados} m²</span>
                    <span
                      className={`font-bold ${getPuntuacionColor(selectedChecklist.puntuacion)}`}
                    >
                      Puntuación: {selectedChecklist.puntuacion}%
                    </span>
                  </DialogDescription>
                </DialogHeader>

                <Tabs
                  value={activeCategory}
                  onValueChange={setActiveCategory}
                  className="flex-1 overflow-hidden flex flex-col"
                >
                  <TabsList className="flex flex-wrap h-auto gap-1">
                    {Object.entries(CHECKLIST_TEMPLATE).map(([key, cat]) => {
                      const Icon = cat.icon;
                      const categoria = selectedChecklist.categorias[key];
                      return (
                        <TabsTrigger
                          key={key}
                          value={key}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Icon className={`h-3 w-3 ${cat.color}`} />
                          <span className="hidden sm:inline">{cat.nombre}</span>
                          <Badge variant="outline" className="ml-1 text-xs">
                            {categoria?.completado || 0}%
                          </Badge>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  <ScrollArea className="flex-1 mt-4">
                    {Object.entries(CHECKLIST_TEMPLATE).map(([key, cat]) => {
                      const categoria = selectedChecklist.categorias[key];
                      if (!categoria) return null;

                      return (
                        <TabsContent key={key} value={key} className="mt-0 space-y-3">
                          {categoria.items.map((item) => (
                            <Card key={item.id} className={item.critico ? 'border-red-200' : ''}>
                              <CardContent className="py-3">
                                <div className="flex items-start gap-3">
                                  <div className="pt-1">{getStatusIcon(item.status)}</div>
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{item.nombre}</span>
                                        {item.critico && (
                                          <Badge variant="destructive" className="text-xs">
                                            Crítico
                                          </Badge>
                                        )}
                                      </div>
                                      <Select
                                        value={item.status}
                                        onValueChange={(value: ChecklistItemStatus) => {
                                          updateItemStatus(
                                            selectedChecklist.id,
                                            key,
                                            item.id,
                                            value
                                          );
                                        }}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pendiente">Pendiente</SelectItem>
                                          <SelectItem value="ok">OK</SelectItem>
                                          <SelectItem value="problema">Problema</SelectItem>
                                          <SelectItem value="critico">Crítico</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Notas..."
                                        value={item.notas}
                                        onChange={(e) => {
                                          updateItemStatus(
                                            selectedChecklist.id,
                                            key,
                                            item.id,
                                            item.status,
                                            e.target.value
                                          );
                                        }}
                                        className="flex-1 text-sm"
                                      />
                                      <Input
                                        type="number"
                                        placeholder="Coste €"
                                        value={item.costeEstimado || ''}
                                        onChange={(e) => {
                                          updateItemStatus(
                                            selectedChecklist.id,
                                            key,
                                            item.id,
                                            item.status,
                                            item.notas,
                                            parseFloat(e.target.value) || 0
                                          );
                                        }}
                                        className="w-24 text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </TabsContent>
                      );
                    })}
                  </ScrollArea>
                </Tabs>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Coste Total Reforma Estimado:
                      </div>
                      <div className="text-xl font-bold text-orange-600">
                        {formatCurrency(selectedChecklist.costeReformaEstimado)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={selectedChecklist.estado}
                        onValueChange={(value: PropertyChecklist['estado']) => {
                          setChecklists((prev) =>
                            prev.map((c) =>
                              c.id === selectedChecklist.id ? { ...c, estado: value } : c
                            )
                          );
                          setSelectedChecklist((prev) =>
                            prev ? { ...prev, estado: value } : null
                          );
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_proceso">En Proceso</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                          <SelectItem value="descartado">Descartado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          const current = checklists.find((c) => c.id === selectedChecklist.id);
                          if (current) saveChecklist(current);
                        }}
                      >
                        Guardar Cambios
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
