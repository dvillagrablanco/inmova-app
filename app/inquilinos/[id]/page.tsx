'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Euro,
  Home,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Tenant {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  dni: string;
  fechaNacimiento?: string;
  nacionalidad?: string;
  profesion?: string;
  estado?: string;
  units?: Array<{
    numero: string;
    building: {
      nombre: string;
      direccion: string;
    };
  }>;
  contracts?: Array<{
    id: string;
    fechaInicio: string;
    fechaFin: string;
    rentaMensual: number;
    estado: string;
    unit?: {
      id: string;
      numero: string;
      building?: {
        id: string;
        nombre: string;
      };
    };
  }>;
  payments?: Array<{
    id: string;
    monto: number;
    fechaPago: string | null;
    estado: string;
  }>;
}

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id && session) {
      fetchTenant();
    }
  }, [params.id, session]);

  const fetchTenant = async () => {
    try {
      const response = await fetch(`/api/tenants/${params.id}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setTenant(data);
    } catch (error) {
      console.error('Error fetching tenant:', error);
      toast.error('Error al cargar inquilino');
      router.push('/inquilinos');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/inquilinos">Inquilinos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{tenant.nombreCompleto}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">{tenant.nombreCompleto}</h1>
                <p className="text-sm text-muted-foreground">{tenant.email}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <Button onClick={() => router.push(`/inquilinos/${tenant.id}/editar`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Datos Personales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">{tenant.email}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Teléfono</div>
                      <div className="text-sm text-muted-foreground">{tenant.telefono}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">DNI/NIE</div>
                      <div className="text-sm text-muted-foreground">{tenant.dni}</div>
                    </div>
                  </div>

                  {tenant.fechaNacimiento && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">Fecha de Nacimiento</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(tenant.fechaNacimiento), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {tenant.units && tenant.units.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Propiedades Actuales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tenant.units.map((unit, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {unit.building.nombre} - Unidad {unit.numero}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {unit.building.direccion}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Contratos</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/contratos/nuevo?tenantId=${tenant.id}`)}
                >
                  Nuevo contrato
                </Button>
              </CardHeader>
              <CardContent>
                {!tenant.contracts || tenant.contracts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay contratos registrados
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tenant.contracts.map((contract) => (
                      <div
                        key={contract.id}
                        className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="font-medium">
                            {format(new Date(contract.fechaInicio), 'dd/MM/yyyy')} -{' '}
                            {format(new Date(contract.fechaFin), 'dd/MM/yyyy')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Intl.NumberFormat('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(contract.rentaMensual)}{' '}
                            /mes
                          </div>
                          {contract.unit && (
                            <div className="text-xs text-muted-foreground">
                              Unidad:{' '}
                              <button
                                className="text-primary hover:underline"
                                onClick={() => router.push(`/unidades/${contract.unit?.id}`)}
                              >
                                {contract.unit?.numero}
                              </button>
                              {contract.unit?.building?.nombre && (
                                <>
                                  {' '}
                                  ·{' '}
                                  <button
                                    className="text-primary hover:underline"
                                    onClick={() =>
                                      router.push(`/edificios/${contract.unit?.building?.id}`)
                                    }
                                  >
                                    {contract.unit?.building?.nombre}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>{contract.estado}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/contratos/${contract.id}`)}
                          >
                            Ver contrato
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                {!tenant.payments || tenant.payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay pagos registrados
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tenant.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <div className="font-medium">
                            {new Intl.NumberFormat('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(payment.monto)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.fechaPago
                              ? format(new Date(payment.fechaPago), 'dd/MM/yyyy')
                              : 'Pendiente'}
                          </div>
                        </div>
                        <Badge>{payment.estado}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
