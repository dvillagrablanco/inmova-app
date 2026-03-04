'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { ExportCSVButton } from '@/components/ui/export-csv-button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Euro, Clock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

interface Contract {
  id: string;
  estado: string;
  deposito?: number;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  tenant: { nombreCompleto: string };
  unit: { numero: string; building: { nombre: string } };
}

interface FianzaRow {
  id: string;
  inquilino: string;
  unidad: string;
  importeFianza: number;
  estado: 'depositada' | 'pendiente' | 'devuelta';
  organismo: string;
  fechaDeposito: string;
}

export default function FianzasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const fetchContracts = async () => {
      try {
        const res = await fetch('/api/contracts?limit=500');
        const json = await res.json();
        const data = Array.isArray(json) ? json : json.data || [];
        setContracts(data);
      } catch {
        toast.error('Error al cargar contratos');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContracts();
  }, [status]);

  const getEstadoFianza = (c: Contract): 'depositada' | 'pendiente' | 'devuelta' => {
    const est = c.estado?.toLowerCase();
    if (est === 'vencido' || est === 'cancelado') return 'devuelta';
    const fianza = Number(c.deposito ?? 0);
    return fianza > 0 ? 'depositada' : 'pendiente';
  };

  const rows: FianzaRow[] = contracts
    .filter((c) => c.estado?.toLowerCase() === 'activo' || c.estado?.toLowerCase() === 'vencido' || c.estado?.toLowerCase() === 'cancelado')
    .map((c) => {
      const renta = Number(c.rentaMensual ?? 0);
      const fianza = Number(c.deposito ?? 0) || renta;
      const estado = getEstadoFianza(c);
      return {
        id: c.id,
        inquilino: c.tenant?.nombreCompleto || '-',
        unidad: c.unit ? `${c.unit.building?.nombre || ''} - ${c.unit.numero}` : '-',
        importeFianza: fianza,
        estado,
        organismo: '-',
        fechaDeposito: estado === 'depositada' && c.fechaInicio ? format(new Date(c.fechaInicio), 'dd MMM yyyy', { locale: es }) : '-',
      };
    });

  const totalDepositadas = rows
    .filter((r) => r.estado === 'depositada')
    .reduce((s, r) => s + r.importeFianza, 0);
  const totalPendientes = rows
    .filter((r) => r.estado === 'pendiente')
    .reduce((s, r) => s + r.importeFianza, 0);
  const totalPorDevolver = rows
    .filter((r) => r.estado === 'devuelta')
    .reduce((s, r) => s + r.importeFianza, 0);

  const csvData = rows.map((r) => ({
    Inquilino: r.inquilino,
    Unidad: r.unidad,
    'Importe Fianza': r.importeFianza,
    Estado: r.estado,
    Organismo: r.organismo,
    'Fecha Depósito': r.fechaDeposito,
  }));

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      depositada: { variant: 'default', label: 'Depositada' },
      pendiente: { variant: 'outline', label: 'Pendiente' },
      devuelta: { variant: 'secondary', label: 'Devuelta' },
    };
    const c = config[estado] || { variant: 'outline' as const, label: estado };
    const cls =
      estado === 'depositada'
        ? 'bg-green-500/15 text-green-700 border-green-300'
        : estado === 'pendiente'
          ? 'bg-amber-500/15 text-amber-700 border-amber-300'
          : 'bg-blue-500/15 text-blue-700 border-blue-300';
    return <Badge variant="outline" className={cls}>{c.label}</Badge>;
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
          <LoadingState message="Cargando fianzas..." size="sm" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Fianzas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fianzas</h1>
            <p className="text-muted-foreground">Gestión de depósitos de garantía</p>
          </div>
          <ExportCSVButton
            data={csvData}
            filename="fianzas"
            columns={[
              { key: 'Inquilino', label: 'Inquilino' },
              { key: 'Unidad', label: 'Unidad' },
              { key: 'Importe Fianza', label: 'Importe Fianza' },
              { key: 'Estado', label: 'Estado' },
              { key: 'Organismo', label: 'Organismo' },
              { key: 'Fecha Depósito', label: 'Fecha Depósito' },
            ]}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fianzas Depositadas</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{totalDepositadas.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {rows.filter((r) => r.estado === 'depositada').length} contratos activos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes de Depositar</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                €{totalPendientes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {rows.filter((r) => r.estado === 'pendiente').length} contratos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fianzas por Devolver</CardTitle>
              <Euro className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                €{totalPorDevolver.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {rows.filter((r) => r.estado === 'devuelta').length} contratos finalizados
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Fianzas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Inquilino, unidad, importe y estado del depósito
            </p>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <EmptyState
                icon={<Shield className="h-16 w-16 text-muted-foreground" />}
                title="No hay fianzas"
                description="No hay contratos con información de fianza"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Inquilino</th>
                      <th className="text-left py-3 px-2 font-medium">Unidad</th>
                      <th className="text-right py-3 px-2 font-medium">Importe Fianza</th>
                      <th className="text-left py-3 px-2 font-medium">Estado</th>
                      <th className="text-left py-3 px-2 font-medium">Organismo</th>
                      <th className="text-left py-3 px-2 font-medium">Fecha Depósito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">{r.inquilino}</td>
                        <td className="py-3 px-2">{r.unidad}</td>
                        <td className="py-3 px-2 text-right font-medium">
                          €{r.importeFianza.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-2">{getEstadoBadge(r.estado)}</td>
                        <td className="py-3 px-2">{r.organismo}</td>
                        <td className="py-3 px-2">{r.fechaDeposito}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
