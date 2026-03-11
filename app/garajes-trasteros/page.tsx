'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Car, Package, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface GarajeTrastero {
  id: string;
  tipo: string;
  numero: string;
  edificioId: string;
  edificioNombre: string;
  unidadVinculada?: string | null;
  inquilinoNombre?: string | null;
  precioMensual: number;
  estado: string;
  planta: number;
  metros2: number;
}

export default function GarajesTrasterosPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<GarajeTrastero[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('garajes');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/garajes-trasteros');
        if (res.ok) {
          const data = await res.json();
          setEntries(Array.isArray(data) ? data : data.data || []);
        }
      } catch {
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    if (status === 'authenticated') fetchData();
  }, [status]);

  const garajes = entries.filter((e) => e.tipo === 'garaje');
  const trasteros = entries.filter((e) => e.tipo === 'trastero');

  const totalGarajes = garajes.length;
  const ocupadosGarajes = garajes.filter((e) => e.estado === 'ocupado').length;
  const totalTrasteros = trasteros.length;
  const ocupadosTrasteros = trasteros.filter((e) => e.estado === 'ocupado').length;

  const filteredEntries = activeTab === 'garajes' ? garajes : trasteros;

  return (
    <AuthenticatedLayout>
      <SmartBreadcrumbs
        customSegments={[
          { label: 'Garajes y Trasteros', href: '/garajes-trasteros' },
        ]}
      />
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Garajes y Trasteros
            </h1>
            <p className="text-muted-foreground">
              Gestión de plazas de garaje y trasteros vinculados a propiedades
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => toast.info('Formulario nuevo trastero próximamente')}
            >
              <Package className="mr-2 h-4 w-4" />
              Nuevo trastero
            </Button>
            <Button onClick={() => toast.info('Formulario nuevo garaje próximamente')}>
              <Car className="mr-2 h-4 w-4" />
              Nuevo garaje
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total garajes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalGarajes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Garajes ocupados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{ocupadosGarajes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total trasteros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalTrasteros}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trasteros ocupados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{ocupadosTrasteros}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
            <CardDescription>
              Garajes y trasteros por edificio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="garajes">Garajes</TabsTrigger>
                <TabsTrigger value="trasteros">Trasteros</TabsTrigger>
              </TabsList>
              <TabsContent value="garajes" className="mt-4">
                <TableContent entries={filteredEntries} loading={loading} />
              </TabsContent>
              <TabsContent value="trasteros" className="mt-4">
                <TableContent entries={filteredEntries} loading={loading} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

function TableContent({
  entries,
  loading,
}: {
  entries: GarajeTrastero[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        Cargando...
      </div>
    );
  }
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        No hay registros
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Edificio</TableHead>
          <TableHead>Vinculado a</TableHead>
          <TableHead>Precio/mes</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="font-medium">{entry.numero}</TableCell>
            <TableCell>{entry.edificioNombre}</TableCell>
            <TableCell>
              {entry.unidadVinculada
                ? `${entry.unidadVinculada}${entry.inquilinoNombre ? ` (${entry.inquilinoNombre})` : ''}`
                : '-'}
            </TableCell>
            <TableCell>{entry.precioMensual} €</TableCell>
            <TableCell>
              <Badge
                variant={
                  entry.estado === 'libre'
                    ? 'secondary'
                    : entry.estado === 'ocupado'
                    ? 'default'
                    : 'outline'
                }
              >
                {entry.estado}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
