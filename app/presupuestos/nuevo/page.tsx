'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Euro, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface LineItem {
  id: string;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
}

export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', concepto: '', cantidad: 1, precioUnitario: 0 },
  ]);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), concepto: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const subtotal = items.reduce((sum, i) => sum + (i.cantidad * i.precioUnitario), 0);
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />Volver
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-600" />Nuevo Presupuesto
          </h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Datos Generales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente / Proveedor</Label>
                <Input placeholder="Nombre del destinatario" />
              </div>
              <div className="space-y-2">
                <Label>Referencia</Label>
                <Input placeholder="PRES-001" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea placeholder="Descripcion del presupuesto..." rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lineas del Presupuesto</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Linea</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Input className="flex-1" placeholder="Concepto" value={item.concepto} onChange={e => updateItem(item.id, 'concepto', e.target.value)} />
                  <Input className="w-20" type="number" placeholder="Ud." value={item.cantidad || ''} onChange={e => updateItem(item.id, 'cantidad', Number(e.target.value))} />
                  <Input className="w-28" type="number" placeholder="Precio" value={item.precioUnitario || ''} onChange={e => updateItem(item.id, 'precioUnitario', Number(e.target.value))} />
                  <span className="w-24 text-right font-medium">{(item.cantidad * item.precioUnitario).toFixed(2)} EUR</span>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length === 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t pt-4 space-y-2 text-right">
              <div className="flex justify-end gap-8"><span className="text-muted-foreground">Subtotal:</span><span className="font-medium w-28">{subtotal.toFixed(2)} EUR</span></div>
              <div className="flex justify-end gap-8"><span className="text-muted-foreground">IVA (21%):</span><span className="font-medium w-28">{iva.toFixed(2)} EUR</span></div>
              <div className="flex justify-end gap-8 text-lg"><span className="font-semibold">Total:</span><span className="font-bold w-28">{total.toFixed(2)} EUR</span></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button onClick={() => toast.info('Guardado de presupuestos en desarrollo')}>
            <Save className="h-4 w-4 mr-2" />Guardar Presupuesto
          </Button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
