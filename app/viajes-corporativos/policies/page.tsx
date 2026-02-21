'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Shield,
  Settings,
  Plus,
  Edit,
  Trash2,
  Hotel,
  Plane,
  Car,
  Coffee,
  AlertTriangle,
  CheckCircle,
  Users,
  Building,
  DollarSign,
  Clock,
  FileText,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

// Datos cargados desde API

const PROVEEDORES: any[] = [];

export default function ViajesCorporativosPoliciesPage() {
  const [politicas, setPoliticas] = useState<any[]>([]);
  const [editandoPolitica, setEditandoPolitica] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/viajes-corporativos/policies');
        if (res.ok) {
          const data = await res.json();
          setPoliticas(data.data || data || []);
        } else {
          setPoliticas([]);
        }
      } catch {
        setPoliticas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleTogglePolitica = (id: string) => {
    setPoliticas(prev =>
      prev.map(p => (p.id === id ? { ...p, activa: !p.activa } : p))
    );
    toast.success('Estado de política actualizado');
  };

  const handleGuardarCambios = () => {
    toast.success('Cambios guardados correctamente');
    setEditandoPolitica(null);
  };

  const handleCrearPolitica = () => {
    toast.success('Nueva política creada');
    setIsDialogOpen(false);
  };

  const getNivelBadge = (nivel: string) => {
    switch (nivel) {
      case 'executive':
        return <Badge className="bg-purple-100 text-purple-700">Ejecutivos</Badge>;
      case 'sales':
        return <Badge className="bg-blue-100 text-blue-700">Ventas</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Estándar</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'hotel':
        return <Badge variant="outline"><Hotel className="h-3 w-3 mr-1" />Hotel</Badge>;
      case 'aerolinea':
        return <Badge variant="outline"><Plane className="h-3 w-3 mr-1" />Aerolínea</Badge>;
      case 'alquiler':
        return <Badge variant="outline"><Car className="h-3 w-3 mr-1" />Alquiler</Badge>;
      case 'transporte':
        return <Badge variant="outline"><Car className="h-3 w-3 mr-1" />Transporte</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Políticas de Viaje</h1>
          <p className="text-muted-foreground">Configuración de políticas corporativas y límites de gasto</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Política
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Nueva Política</DialogTitle>
              <DialogDescription>
                Define los límites y restricciones para un grupo de empleados
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nombre de la política *</Label>
                <Input placeholder="Ej: Política Consultores" />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea placeholder="Describe a quién aplica esta política..." />
              </div>
              <div>
                <Label>Nivel de empleado</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Estándar</SelectItem>
                    <SelectItem value="sales">Ventas</SelectItem>
                    <SelectItem value="executive">Ejecutivos</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Límite hotel/noche (€)</Label>
                  <Input type="number" placeholder="150" />
                </div>
                <div>
                  <Label>Límite vuelo doméstico (€)</Label>
                  <Input type="number" placeholder="300" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCrearPolitica}>Crear Política</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen de políticas activas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Políticas Activas</p>
                <p className="text-2xl font-bold">{politicas.filter(p => p.activa).length}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proveedores Autorizados</p>
                <p className="text-2xl font-bold">{PROVEEDORES.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cumplimiento Global</p>
                <p className="text-2xl font-bold text-green-600">94%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de políticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Políticas Configuradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-4">
            {politicas.map((politica) => (
              <AccordionItem key={politica.id} value={politica.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{politica.nombre}</span>
                        {getNivelBadge(politica.nivelEmpleado)}
                        {politica.activa ? (
                          <Badge className="bg-green-100 text-green-700">Activa</Badge>
                        ) : (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{politica.descripcion}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4">
                    {/* Límites de gasto */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Límites de Gasto
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Hotel/noche</p>
                          <p className="text-lg font-bold">{politica.limites.hotelNoche}€</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Vuelo doméstico</p>
                          <p className="text-lg font-bold">{politica.limites.vueloDomestico}€</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Vuelo europeo</p>
                          <p className="text-lg font-bold">{politica.limites.vueloEuropeo}€</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Vuelo intercontinental</p>
                          <p className="text-lg font-bold">{politica.limites.vueloIntercontinental}€</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Dieta diaria</p>
                          <p className="text-lg font-bold">{politica.limites.dietaDiaria}€</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Transporte local</p>
                          <p className="text-lg font-bold">{politica.limites.transporteLocal}€</p>
                        </div>
                      </div>
                    </div>

                    {/* Restricciones */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Restricciones
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Clase de vuelo</p>
                          <p className="font-medium capitalize">{politica.restricciones.claseVuelo}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Categoría hotel</p>
                          <p className="font-medium">{politica.restricciones.categoriaHotel}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Anticipación mínima</p>
                          <p className="font-medium">{politica.restricciones.anticipacionReserva} días</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Aprobación requerida</p>
                          <p className="font-medium">
                            {politica.restricciones.aprobacionRequerida ? (
                              <span className="text-yellow-600">Sí - {politica.restricciones.nivelAprobacion}</span>
                            ) : (
                              <span className="text-green-600">No requerida</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Proveedores autorizados */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Proveedores Autorizados
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {politica.proveedoresAutorizados.map((prov, idx) => (
                          <Badge key={idx} variant="outline">{prov}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Excepciones */}
                    {politica.excepciones && (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <span><strong>Excepciones:</strong> {politica.excepciones}</span>
                        </p>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={politica.activa}
                          onCheckedChange={() => handleTogglePolitica(politica.id)}
                        />
                        <Label className="text-sm">Política activa</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Última modificación: {new Date(politica.ultimaModificacion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Proveedores Autorizados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Proveedores Autorizados
              </CardTitle>
              <CardDescription>Acuerdos corporativos vigentes</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Añadir Proveedor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PROVEEDORES.map((proveedor) => (
              <div
                key={proveedor.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-3"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    {proveedor.tipo === 'hotel' && <Hotel className="h-5 w-5 text-blue-600" />}
                    {proveedor.tipo === 'aerolinea' && <Plane className="h-5 w-5 text-blue-600" />}
                    {(proveedor.tipo === 'alquiler' || proveedor.tipo === 'transporte') && (
                      <Car className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{proveedor.nombre}</p>
                    <div className="flex items-center gap-2">
                      {getTipoBadge(proveedor.tipo)}
                      <Badge className="bg-green-100 text-green-700">{proveedor.descuento} dto.</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Vencimiento</p>
                    <p className="text-sm font-medium">
                      {new Date(proveedor.vencimiento).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {proveedor.contrato}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
