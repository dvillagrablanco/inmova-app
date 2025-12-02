"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Send,
  Copy,
  AlertCircle,
  CheckCircle2,
  Eye,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SMSTemplate {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  mensaje: string;
  variables: any[];
  activa: boolean;
  envioAutomatico: boolean;
  eventoTrigger?: string;
  anticipacionDias?: number;
  horaEnvio?: string;
  vecesUsada: number;
  ultimoEnvio?: Date;
}

const tiposSMS = [
  { value: 'recordatorio_pago', label: 'Recordatorio de Pago' },
  { value: 'confirmacion_visita', label: 'Confirmación de Visita' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'alerta', label: 'Alerta' },
  { value: 'bienvenida', label: 'Bienvenida' },
  { value: 'general', label: 'General' }
];

const variablesDisponibles = [
  { nombre: '{{nombre}}', descripcion: 'Nombre completo del inquilino', ejemplo: 'Juan Pérez' },
  { nombre: '{{unidad}}', descripcion: 'Número de unidad', ejemplo: '3A' },
  { nombre: '{{edificio}}', descripcion: 'Nombre del edificio', ejemplo: 'Edificio Central' },
  { nombre: '{{monto}}', descripcion: 'Monto económico', ejemplo: '850,00€' },
  { nombre: '{{fecha}}', descripcion: 'Fecha formateada', ejemplo: '15/12/2024' },
  { nombre: '{{email}}', descripcion: 'Email del inquilino', ejemplo: 'juan@email.com' },
  { nombre: '{{telefono}}', descripcion: 'Teléfono del inquilino', ejemplo: '+34 600 123 456' }
];

export default function PlantillasSMSPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plantillas, setPlantillas] = useState<SMSTemplate[]>([]);
  const [editando, setEditando] = useState<SMSTemplate | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<SMSTemplate | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'general',
    mensaje: '',
    activa: true,
    envioAutomatico: false,
    eventoTrigger: '',
    anticipacionDias: 0,
    horaEnvio: '10:00'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchPlantillas();
    }
  }, [status, router]);

  const fetchPlantillas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sms/templates');
      if (response.ok) {
        const data = await response.json();
        setPlantillas(data.plantillas || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editando ? `/api/sms/templates/${editando.id}` : '/api/sms/templates';
      const method = editando ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editando ? 'Plantilla actualizada' : 'Plantilla creada');
        setEditando(null);
        resetForm();
        fetchPlantillas();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al guardar plantilla');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error al guardar plantilla');
    }
  };

  const handleEdit = (plantilla: SMSTemplate) => {
    setEditando(plantilla);
    setFormData({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion || '',
      tipo: plantilla.tipo,
      mensaje: plantilla.mensaje,
      activa: plantilla.activa,
      envioAutomatico: plantilla.envioAutomatico,
      eventoTrigger: plantilla.eventoTrigger || '',
      anticipacionDias: plantilla.anticipacionDias || 0,
      horaEnvio: plantilla.horaEnvio || '10:00'
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sms/templates/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Plantilla eliminada');
        fetchPlantillas();
      } else {
        toast.error('Error al eliminar plantilla');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error al eliminar plantilla');
    }
  };

  const handleDuplicate = (plantilla: SMSTemplate) => {
    setEditando(null);
    setFormData({
      nombre: `${plantilla.nombre} (Copia)`,
      descripcion: plantilla.descripcion || '',
      tipo: plantilla.tipo,
      mensaje: plantilla.mensaje,
      activa: plantilla.activa,
      envioAutomatico: false,
      eventoTrigger: '',
      anticipacionDias: 0,
      horaEnvio: '10:00'
    });
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      tipo: 'general',
      mensaje: '',
      activa: true,
      envioAutomatico: false,
      eventoTrigger: '',
      anticipacionDias: 0,
      horaEnvio: '10:00'
    });
  };

  const insertarVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      mensaje: prev.mensaje + variable
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-96" />
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plantillas SMS</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las plantillas de mensajes SMS para comunicarte con tus inquilinos.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar' : 'Nueva'} Plantilla SMS</DialogTitle>
              <DialogDescription>
                Crea plantillas reutilizables con variables dinámicas
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Recordatorio de Pago Mensual"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Breve descripción de cuándo usar esta plantilla"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de SMS *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposSMS.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensaje">Mensaje *</Label>
                <Textarea
                  id="mensaje"
                  value={formData.mensaje}
                  onChange={(e) => setFormData(prev => ({ ...prev, mensaje: e.target.value }))}
                  placeholder="Escribe tu mensaje aquí..."
                  rows={5}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Longitud: {formData.mensaje.length} caracteres | SMS: {Math.ceil(formData.mensaje.length / 160)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Variables Disponibles</Label>
                <div className="grid grid-cols-2 gap-2">
                  {variablesDisponibles.map(v => (
                    <Button
                      key={v.nombre}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertarVariable(v.nombre)}
                      className="justify-start"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {v.nombre}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activa"
                  checked={formData.activa}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activa: checked }))}
                />
                <Label htmlFor="activa">Plantilla activa</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="envioAutomatico"
                  checked={formData.envioAutomatico}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, envioAutomatico: checked }))}
                />
                <Label htmlFor="envioAutomatico">Envío automático</Label>
              </div>

              {formData.envioAutomatico && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    El envío automático requiere configurar eventos y horarios específicos.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editando ? 'Actualizar' : 'Crear'} Plantilla
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setEditando(null);
                  resetForm();
                }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plantillas.map(plantilla => (
          <Card key={plantilla.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{plantilla.nombre}</CardTitle>
                  <CardDescription className="text-sm">
                    {plantilla.descripcion || 'Sin descripción'}
                  </CardDescription>
                </div>
                <Badge variant={plantilla.activa ? 'default' : 'secondary'}>
                  {plantilla.activa ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                {plantilla.mensaje.substring(0, 100)}
                {plantilla.mensaje.length > 100 && '...'}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Usado {plantilla.vecesUsada} veces</span>
                {plantilla.envioAutomatico && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Automático
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(plantilla)}>
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDuplicate(plantilla)}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setVistaPrevia(plantilla)}>
                  <Eye className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(plantilla.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plantillas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No hay plantillas</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera plantilla SMS para comenzar a comunicarte con tus inquilinos.
            </p>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Plantilla
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Vista Previa */}
      {vistaPrevia && (
        <Dialog open={!!vistaPrevia} onOpenChange={() => setVistaPrevia(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{vistaPrevia.nombre}</DialogTitle>
              <DialogDescription>{vistaPrevia.descripcion}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Tipo:</Label>
                <p className="mt-1">{tiposSMS.find(t => t.value === vistaPrevia.tipo)?.label || vistaPrevia.tipo}</p>
              </div>
              <div>
                <Label>Mensaje:</Label>
                <div className="p-4 bg-muted rounded-lg mt-1">
                  {vistaPrevia.mensaje}
                </div>
              </div>
              {vistaPrevia.variables && vistaPrevia.variables.length > 0 && (
                <div>
                  <Label>Variables utilizadas:</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {vistaPrevia.variables.map((v: any, i: number) => (
                      <Badge key={i} variant="outline">{v.nombre}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
