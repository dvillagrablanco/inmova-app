'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';


interface WorkOrder {
  id: string;
  titulo: string;
  building: {
    nombre: string;
  };
}

interface ConceptoItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export default function NuevaFacturaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [formData, setFormData] = useState({
    workOrderId: '',
    numeroFactura: '',
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

    if (!formData.workOrderId || !formData.numeroFactura) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (conceptos.some((c) => !c.descripcion || c.cantidad <= 0 || c.precioUnitario <= 0)) {
      toast.error('Por favor completa todos los conceptos correctamente');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/portal-proveedor/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          conceptos,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear factura');
      }

      const invoice = await response.json();
      toast.success('Factura creada correctamente');
      router.push(`/portal-proveedor/facturas/${invoice.id}`);
    } catch (error) {
      logger.error('Error creating invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear la factura');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Factura</h1>
          <p className="text-gray-600">Crea una nueva factura para una orden de trabajo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulario principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Factura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workOrderId">Orden de Trabajo *</Label>
                  <Select
                    value={formData.workOrderId}
                    onValueChange={(value) => setFormData({ ...formData, workOrderId: value })}
                  >
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

                <div>
                  <Label htmlFor="numeroFactura">Número de Factura *</Label>
                  <Input
                    id="numeroFactura"
                    value={formData.numeroFactura}
                    onChange={(e) => setFormData({ ...formData, numeroFactura: e.target.value })}
                    placeholder="Ej: FAC-2024-001"
                    required
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addConcepto}
                    className="gap-2"
                  >
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeConcepto(index)}
                          >
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
                            onChange={(e) =>
                              updateConcepto(index, 'cantidad', parseFloat(e.target.value) || 1)
                            }
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
                            onChange={(e) =>
                              updateConcepto(
                                index,
                                'precioUnitario',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600">
                          Subtotal:{' '}
                          <span className="font-semibold">
                            {formatCurrency(concepto.cantidad * concepto.precioUnitario)}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen */}
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
                  {loading ? 'Creando...' : 'Crear Factura'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
