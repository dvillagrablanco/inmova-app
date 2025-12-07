'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface WorkOrder {
  id: string;
  titulo: string;
  building: { nombre: string };
}

interface ConceptoItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [formData, setFormData] = useState({
    workOrderId: '',
    validezDias: '30',
    condicionesPago: '',
    tiempoEjecucion: '',
    notas: '',
  });
  const [conceptos, setConceptos] = useState<ConceptoItem[]>([
    { descripcion: '', cantidad: 1, precioUnitario: 0 },
  ]);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch('/api/portal-proveedor/work-orders', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setWorkOrders(data.workOrders || data);
      }
    } catch (error) {
      logger.error('Error fetching work orders:', error);
    }
  };

  const addConcepto = () => {
    setConceptos([...conceptos, { descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const removeConcepto = (index: number) => {
    if (conceptos.length > 1) {
      setConceptos(conceptos.filter((_, i) => i !== index));
    }
  };

  const updateConcepto = (index: number, field: keyof ConceptoItem, value: any) => {
    const newConceptos = [...conceptos];
    newConceptos[index] = { ...newConceptos[index], [field]: value };
    setConceptos(newConceptos);
  };

  const calculateSubtotal = () => {
    return conceptos.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);
  };

  const calculateIVA = () => {
    return calculateSubtotal() * 0.21;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateIVA();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.workOrderId) {
      toast.error('Por favor selecciona una orden de trabajo');
      return;
    }

    if (conceptos.some((c) => !c.descripcion || c.cantidad <= 0 || c.precioUnitario <= 0)) {
      toast.error('Por favor completa todos los conceptos correctamente');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/portal-proveedor/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, conceptos }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear presupuesto');
      }

      const quote = await response.json();
      toast.success('Presupuesto creado correctamente');
      router.push(`/portal-proveedor/presupuestos/${quote.id}`);
    } catch (error) {
      logger.error('Error creating quote:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Nuevo Presupuesto</h1>
                <p className="text-gray-600">Crea un nuevo presupuesto para una orden de trabajo</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Presupuesto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workOrderId">Orden de Trabajo *</Label>
                    <Select value={formData.workOrderId} onValueChange={(value) => setFormData({ ...formData, workOrderId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una orden" />
                    </SelectTrigger>
                    <SelectContent>
                      {workOrders.map((wo) => (
                        <SelectItem key={wo.id} value={wo.id}>
                          {wo.titulo} - {wo.building.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="validezDias">Validez (días)</Label>
                      <Input
                      id="validezDias"
                      type="number"
                      min="1"
                      value={formData.validezDias}
                      onChange={(e) => setFormData({ ...formData, validezDias: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tiempoEjecucion">Tiempo de Ejecución</Label>
                      <Input
                      id="tiempoEjecucion"
                      value={formData.tiempoEjecucion}
                      onChange={(e) => setFormData({ ...formData, tiempoEjecucion: e.target.value })}
                      placeholder="Ej: 5 días laborables"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="condicionesPago">Condiciones de Pago</Label>
                    <Input
                    id="condicionesPago"
                    value={formData.condicionesPago}
                    onChange={(e) => setFormData({ ...formData, condicionesPago: e.target.value })}
                    placeholder="Ej: 50% al inicio, 50% al finalizar"
                  />
                </div>

                <div>
                  <Label htmlFor="notas">Notas</Label>
                    <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Notas adicionales..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Conceptos</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addConcepto} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Añadir Concepto
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conceptos.map((concepto, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                      <div className="flex justify-between items-start">
                        <Label className="text-sm font-medium">Concepto {index + 1}</Label>
                          {conceptos.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeConcepto(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`descripcion-${index}`}>Descripción *</Label>
                          <Input
                          id={`descripcion-${index}`}
                          value={concepto.descripcion}
                          onChange={(e) => updateConcepto(index, 'descripcion', e.target.value)}
                          placeholder="Descripción del servicio..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`cantidad-${index}`}>Cantidad *</Label>
                            <Input
                            id={`cantidad-${index}`}
                            type="number"
                            min="1"
                            step="1"
                            value={concepto.cantidad}
                            onChange={(e) => updateConcepto(index, 'cantidad', parseFloat(e.target.value) || 1)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`precioUnitario-${index}`}>Precio Unitario (€) *</Label>
                            <Input
                            id={`precioUnitario-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={concepto.precioUnitario}
                            onChange={(e) => updateConcepto(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600">
                          Subtotal: <span className="font-semibold">{formatCurrency(concepto.cantidad * concepto.precioUnitario)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA (21%):</span>
                      <span className="font-medium">{formatCurrency(calculateIVA())}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Presupuesto'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
          </div>
        </main>
      </div>
    </div>
  );
}
