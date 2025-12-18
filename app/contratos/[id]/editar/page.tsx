'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Home as HomeIcon, ArrowLeft, Save } from 'lucide-react';
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
import logger from '@/lib/logger';

interface Unit {
  id: string;
  numero: string;
  building: { nombre: string };
}

interface Tenant {
  id: string;
  nombreCompleto: string;
  email: string;
}

export default function EditarContratoPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
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
    estado: 'activo',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch contract data
  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(`/api/contracts/${params?.id}`);
        if (response.ok) {
          const data = await response.json();
          const fechaInicio = data.fechaInicio
            ? new Date(data.fechaInicio).toISOString().split('T')[0]
            : '';
          const fechaFin = data.fechaFin
            ? new Date(data.fechaFin).toISOString().split('T')[0]
            : '';
          
          setFormData({
            unitId: data.unitId || '',
            tenantId: data.tenantId || '',
            fechaInicio,
            fechaFin,
            rentaMensual: data.rentaMensual?.toString() || '0',
            deposito: data.deposito?.toString() || '0',
            tipo: data.tipo || 'residencial',
            estado: data.estado || 'activo',
          });
        } else {
          toast.error('Error al cargar el contrato');
          router.push('/contratos');
        }
      } catch (error) {
        logger.error('Error fetching contract:', error);
        toast.error('Error al cargar el contrato');
      } finally {
        setIsFetching(false);
      }
    };

    if (status === 'authenticated' && params?.id) {
      fetchContract();
    }
  }, [status, params?.id, router]);

  // Fetch units and tenants
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsRes, tenantsRes] = await Promise.all([
          fetch('/api/units'),
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
        logger.error('Error fetching data:', error);
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
      const response = await fetch(`/api/contracts/${params?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: formData.unitId,
          tenantId: formData.tenantId,
          fechaInicio: new Date(formData.fechaInicio).toISOString(),
          fechaFin: new Date(formData.fechaFin).toISOString(),
          rentaMensual: parseFloat(formData.rentaMensual),
          deposito: parseFloat(formData.deposito),
          tipo: formData.tipo,
          estado: formData.estado,
        }),
      });

      if (response.ok) {
        toast.success('Contrato actualizado exitosamente');
        router.push('/contratos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar el contrato');
      }
    } catch (error) {
      logger.error('Error updating contract:', error);
      toast.error('Error al actualizar el contrato');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isFetching) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <p>Cargando...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/home">
                    <HomeIcon className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/contratos">Contratos</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Editar Contrato</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Contrato</h1>
                <p className="text-muted-foreground">Modifica los datos del contrato</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Información del Contrato</CardTitle>
                  <CardDescription>
                    Actualiza los campos necesarios y haz clic en guardar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
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
                              {tenant.nombreCompleto}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fecha Inicio */}
                    <div className="space-y-2">
                      <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                      <Input
                        id="fechaInicio"
                        type="date"
                        value={formData.fechaInicio}
                        onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                        required
                      />
                    </div>

                    {/* Fecha Fin */}
                    <div className="space-y-2">
                      <Label htmlFor="fechaFin">Fecha de Finalización *</Label>
                      <Input
                        id="fechaFin"
                        type="date"
                        value={formData.fechaFin}
                        onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                        required
                      />
                    </div>

                    {/* Renta Mensual */}
                    <div className="space-y-2">
                      <Label htmlFor="rentaMensual">Renta Mensual (€) *</Label>
                      <Input
                        id="rentaMensual"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.rentaMensual}
                        onChange={(e) => setFormData({ ...formData, rentaMensual: e.target.value })}
                        required
                      />
                    </div>

                    {/* Depósito */}
                    <div className="space-y-2">
                      <Label htmlFor="deposito">Depósito (€) *</Label>
                      <Input
                        id="deposito"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.deposito}
                        onChange={(e) => setFormData({ ...formData, deposito: e.target.value })}
                        required
                      />
                    </div>

                    {/* Tipo */}
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
                          <SelectItem value="turistico">Turístico</SelectItem>
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="terminado">Terminado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
