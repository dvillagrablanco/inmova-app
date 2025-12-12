'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CreditCard, Home, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import logger, { logError } from '@/lib/logger';


interface Contract {
  id: string;
  unit: { numero: string; building: { nombre: string } };
  tenant: { nombre: string };
}

export default function NuevoPagoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [formData, setFormData] = useState({
    contractId: '',
    periodo: '',
    monto: '0',
    fechaVencimiento: '',
    fechaPago: '',
    estado: 'pendiente',
    metodoPago: 'transferencia',
  });

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch('/api/contracts');
        if (response.ok) {
          const data = await response.json();
          setContracts(data.filter((c: any) => c.estado === 'activo'));
        }
      } catch (error) {
        logger.error('Error fetching contracts:', error);
      }
    };

    if (status === 'authenticated') {
      fetchContracts();
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: formData.contractId,
          periodo: formData.periodo,
          monto: parseFloat(formData.monto),
          fechaVencimiento: new Date(formData.fechaVencimiento).toISOString(),
          fechaPago: formData.fechaPago ? new Date(formData.fechaPago).toISOString() : null,
          estado: formData.estado,
          metodoPago: formData.metodoPago,
        }),
      });

      if (response.ok) {
        toast.success('Pago registrado correctamente');
        router.push('/pagos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al registrar el pago');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al registrar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto">
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
                    <BreadcrumbPage>Nuevo Pago</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nuevo Pago</h1>
              <p className="text-muted-foreground">Registra un nuevo pago o cuota de alquiler</p>
            </div>

            {/* Formulario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Información del Pago
                </CardTitle>
                <CardDescription>Completa los datos del pago o cuota de alquiler</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Contrato */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="contractId">Contrato *</Label>
                      <Select
                        value={formData.contractId}
                        onValueChange={(value) => setFormData({ ...formData, contractId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un contrato" />
                        </SelectTrigger>
                        <SelectContent>
                          {contracts.map((contract) => (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contract.unit.building.nombre} - {contract.unit.numero} (
                              {contract.tenant.nombre})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Periodo */}
                    <div className="space-y-2">
                      <Label htmlFor="periodo">Periodo *</Label>
                      <Input
                        id="periodo"
                        name="periodo"
                        value={formData.periodo}
                        onChange={handleChange}
                        required
                        placeholder="Enero 2024"
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
                        min="0"
                      />
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
                      <Label htmlFor="fechaPago">Fecha de Pago (opcional)</Label>
                      <Input
                        id="fechaPago"
                        name="fechaPago"
                        type="date"
                        value={formData.fechaPago}
                        onChange={handleChange}
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
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Método de Pago */}
                    <div className="space-y-2">
                      <Label htmlFor="metodoPago">Método de Pago</Label>
                      <Select
                        value={formData.metodoPago}
                        onValueChange={(value) => setFormData({ ...formData, metodoPago: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
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

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={isLoading || !formData.contractId}>
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Registrar Pago
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
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
