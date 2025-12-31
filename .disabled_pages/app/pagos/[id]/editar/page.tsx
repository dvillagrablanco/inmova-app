'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { CreditCard, Home, ArrowLeft, Save, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import { LoadingState } from '@/components/ui/loading-state';

export default function EditarPagoPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = params?.id as string;
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [formData, setFormData] = useState({
    periodo: '',
    monto: '',
    fechaVencimiento: '',
    fechaPago: '',
    estado: 'pendiente',
    metodoPago: '',
  });

  // Cargar datos existentes del pago
  useEffect(() => {
    const fetchPayment = async () => {
      if (!paymentId) return;

      try {
        setIsFetchingData(true);
        const response = await fetch(`/api/payments/${paymentId}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar el pago');
        }

        const payment = await response.json();
        
        setFormData({
          periodo: payment.periodo || '',
          monto: payment.monto?.toString() || '',
          fechaVencimiento: payment.fechaVencimiento 
            ? new Date(payment.fechaVencimiento).toISOString().split('T')[0] 
            : '',
          fechaPago: payment.fechaPago 
            ? new Date(payment.fechaPago).toISOString().split('T')[0] 
            : '',
          estado: payment.estado || 'pendiente',
          metodoPago: payment.metodoPago || '',
        });
      } catch (error) {
        logger.error('Error fetching payment:', error);
        toast.error('Error al cargar los datos del pago');
        router.push('/pagos');
      } finally {
        setIsFetchingData(false);
      }
    };

    if (session) {
      fetchPayment();
    }
  }, [paymentId, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodo: formData.periodo,
          monto: parseFloat(formData.monto),
          fechaVencimiento: formData.fechaVencimiento,
          fechaPago: formData.fechaPago || null,
          estado: formData.estado,
          metodoPago: formData.metodoPago,
        }),
      });

      if (response.ok) {
        toast.success('Pago actualizado correctamente');
        router.push('/pagos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar el pago');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al actualizar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (status === 'loading' || isFetchingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-bg">
        <LoadingState message="Cargando datos del pago..." size="lg" />
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <AuthenticatedLayout>
          <div className="container mx-auto p-6 space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/pagos')}
                className="gap-2 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Pagos
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/pagos">Pagos</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Editar Pago</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Pencil className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Pago</h1>
                <p className="text-muted-foreground">Actualiza la información del pago</p>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit}>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Período */}
                    <div className="space-y-2">
                      <Label htmlFor="periodo">Período</Label>
                      <Input
                        id="periodo"
                        name="periodo"
                        value={formData.periodo}
                        onChange={handleChange}
                        placeholder="Ej: Enero 2024"
                      />
                    </div>

                    {/* Monto */}
                    <div className="space-y-2">
                      <Label htmlFor="monto">Monto (€) *</Label>
                      <Input
                        id="monto"
                        name="monto"
                        type="number"
                        step="0.01"
                        value={formData.monto}
                        onChange={handleChange}
                        required
                        placeholder="1200.00"
                      />
                    </div>

                    {/* Estado */}
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado *</Label>
                      <Select
                        value={formData.estado}
                        onValueChange={(value) => setFormData({ ...formData, estado: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="pagado">Pagado</SelectItem>
                          <SelectItem value="vencido">Vencido</SelectItem>
                          <SelectItem value="parcial">Parcial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fecha de Vencimiento */}
                    <div className="space-y-2">
                      <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
                      <Input
                        id="fechaVencimiento"
                        name="fechaVencimiento"
                        type="date"
                        value={formData.fechaVencimiento}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Fecha de Pago */}
                    <div className="space-y-2">
                      <Label htmlFor="fechaPago">Fecha de Pago</Label>
                      <Input
                        id="fechaPago"
                        name="fechaPago"
                        type="date"
                        value={formData.fechaPago}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Método de Pago */}
                    <div className="space-y-2">
                      <Label htmlFor="metodoPago">Método de Pago</Label>
                      <Select
                        value={formData.metodoPago}
                        onValueChange={(value) => setFormData({ ...formData, metodoPago: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transferencia">Transferencia</SelectItem>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="tarjeta">Tarjeta</SelectItem>
                          <SelectItem value="domiciliacion">Domiciliación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/pagos')}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </AuthenticatedLayout>
  );
}
