'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { FileText, Home, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonWithLoading } from '@/components/ui/button-with-loading';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface Unit {
  id: string;
  numero: string;
  building: { nombre: string };
}

interface Tenant {
  id: string;
  nombre: string;
  email: string;
}

export default function NuevoContratoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [formData, setFormData] = useState({
    unitId: '',
    tenantId: '',
    fechaInicio: '',
    fechaFin: '',
    rentaMensual: '0',
    deposito: '0',
    tipo: 'residencial',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsRes, tenantsRes] = await Promise.all([
          fetch('/api/units?estado=disponible'),
          fetch('/api/tenants'),
        ]);

        if (unitsRes.ok) {
          const unitsData = await unitsRes.json();
          setUnits(unitsData);
        }

        if (tenantsRes.ok) {
          const tenantsData = await tenantsRes.json();
          setTenants(tenantsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: formData.unitId,
          tenantId: formData.tenantId,
          fechaInicio: new Date(formData.fechaInicio).toISOString(),
          fechaFin: new Date(formData.fechaFin).toISOString(),
          rentaMensual: parseFloat(formData.rentaMensual),
          deposito: parseFloat(formData.deposito),
          tipo: formData.tipo,
          estado: 'activo',
        }),
      });

      if (response.ok) {
        toast.success('Contrato creado correctamente');
        router.push('/contratos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear el contrato');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear el contrato');
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
                onClick={() => router.push('/contratos')}
                className="gap-2 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Contratos
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
                    <BreadcrumbLink href="/contratos">Contratos</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Nuevo Contrato</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nuevo Contrato</h1>
              <p className="text-muted-foreground">Crea un nuevo contrato de arrendamiento</p>
            </div>

            {/* Formulario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Información del Contrato
                </CardTitle>
                <CardDescription>
                  Completa los datos del contrato de arrendamiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Unidad */}
                    <div className="space-y-2">
                      <Label htmlFor="unitId">Unidad *</Label>
                      <Select
                        value={formData.unitId}
                        onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.building.nombre} - {unit.numero}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Inquilino */}
                    <div className="space-y-2">
                      <Label htmlFor="tenantId">Inquilino *</Label>
                      <Select
                        value={formData.tenantId}
                        onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un inquilino" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.nombre} - {tenant.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tipo de Contrato */}
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Contrato *</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residencial">Residencial</SelectItem>
                          <SelectItem value="comercial">Comercial</SelectItem>
                          <SelectItem value="temporal">Temporal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Renta Mensual */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="rentaMensual">Renta Mensual (€) *</Label>
                        <InfoTooltip content="Monto mensual que el inquilino debe pagar. Este valor se usará para generar automáticamente los pagos recurrentes." />
                      </div>
                      <Input
                        id="rentaMensual"
                        name="rentaMensual"
                        type="number"
                        step="0.01"
                        value={formData.rentaMensual}
                        onChange={handleChange}
                        required
                        min="0"
                      />
                    </div>

                    {/* Depósito */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="deposito">Depósito (€) *</Label>
                        <InfoTooltip content="Cantidad de dinero que se retiene como garantía. Típicamente equivale a 1-2 meses de renta." />
                      </div>
                      <Input
                        id="deposito"
                        name="deposito"
                        type="number"
                        step="0.01"
                        value={formData.deposito}
                        onChange={handleChange}
                        required
                        min="0"
                      />
                    </div>

                    {/* Fecha de Inicio */}
                    <div className="space-y-2">
                      <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                      <Input
                        id="fechaInicio"
                        name="fechaInicio"
                        type="date"
                        value={formData.fechaInicio}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Fecha de Fin */}
                    <div className="space-y-2">
                      <Label htmlFor="fechaFin">Fecha de Fin *</Label>
                      <Input
                        id="fechaFin"
                        name="fechaFin"
                        type="date"
                        value={formData.fechaFin}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <ButtonWithLoading
                      type="submit"
                      isLoading={isLoading}
                      disabled={!formData.unitId || !formData.tenantId}
                      loadingText="Guardando..."
                      icon={Save}
                    >
                      Crear Contrato
                    </ButtonWithLoading>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/contratos')}
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
