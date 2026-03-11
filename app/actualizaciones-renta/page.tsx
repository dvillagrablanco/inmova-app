'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActualizacionRenta {
  id: string;
  contratoId: string;
  contratoRef: string;
  inquilinoNombre: string;
  inmuebleNombre: string;
  fechaRevision: string;
  tipo: string;
  rentaAnterior: number;
  rentaNueva: number;
  incrementoPorcentaje: number;
  estado: string;
  fechaComunicacion: string | null;
}

const TIPO_LABELS: Record<string, string> = {
  IPC: 'IPC',
  pactado: 'Pactado',
  renta_referencia: 'Renta referencia',
};

export default function ActualizacionesRentaPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [actualizaciones, setActualizaciones] = useState<ActualizacionRenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [comunicandoId, setComunicandoId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (filterEstado !== 'all') params.set('estado', filterEstado);
        if (filterTipo !== 'all') params.set('tipo', filterTipo);
        const res = await fetch(`/api/actualizaciones-renta?${params}`);
        if (res.ok) {
          const data = await res.json();
          setActualizaciones(Array.isArray(data) ? data : data.data || []);
        }
      } catch {
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    if (status === 'authenticated') fetchData();
  }, [status, filterEstado, filterTipo]);

  const pendientes = actualizaciones.filter((a) => a.estado === 'pendiente').length;
  const aplicadasAno = actualizaciones.filter((a) => {
    if (a.estado !== 'aplicada' && a.estado !== 'comunicada') return false;
    const d = new Date(a.fechaRevision);
    return d.getFullYear() === new Date().getFullYear();
  }).length;
  const incrementoMedio =
    actualizaciones.length > 0
      ? actualizaciones.reduce((acc, a) => acc + a.incrementoPorcentaje, 0) /
        actualizaciones.length
      : 0;
  const totalIncremento = actualizaciones.reduce(
    (acc, a) => acc + (a.rentaNueva - a.rentaAnterior),
    0
  );

  const handleComunicar = async (id: string) => {
    setComunicandoId(id);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setActualizaciones((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                estado: 'comunicada',
                fechaComunicacion: new Date().toISOString().split('T')[0],
              }
            : a
        )
      );
      toast.success('Marcada como comunicada al inquilino');
    } catch {
      toast.error('Error al comunicar');
    } finally {
      setComunicandoId(null);
    }
  };

  return (
    <AuthenticatedLayout>
      <SmartBreadcrumbs
        customSegments={[
          { label: 'Actualizaciones de Renta', href: '/actualizaciones-renta' },
        ]}
      />
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Actualizaciones de Renta (IPC)
          </h1>
          <p className="text-muted-foreground">
            Seguimiento de revisiones de renta por IPC y otros criterios
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendientes de aplicar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendientes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aplicadas este año
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{aplicadasAno}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Incremento medio (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{incrementoMedio.toFixed(2)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total incremento (€)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {totalIncremento.toLocaleString('es-ES')} €
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Actualizaciones</CardTitle>
                <CardDescription>
                  Revisiones de renta por IPC, pactado o renta de referencia
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="aplicada">Aplicada</SelectItem>
                    <SelectItem value="comunicada">Comunicada</SelectItem>
                    <SelectItem value="rechazada">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="IPC">IPC</SelectItem>
                    <SelectItem value="pactado">Pactado</SelectItem>
                    <SelectItem value="renta_referencia">Renta ref.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                Cargando...
              </div>
            ) : actualizaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                No hay actualizaciones
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Inmueble</TableHead>
                    <TableHead>Fecha revisión</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Renta anterior</TableHead>
                    <TableHead>Renta nueva</TableHead>
                    <TableHead>Incremento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha comunicación</TableHead>
                    <TableHead className="w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actualizaciones.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.contratoRef}</TableCell>
                      <TableCell>{a.inquilinoNombre}</TableCell>
                      <TableCell>{a.inmuebleNombre}</TableCell>
                      <TableCell>
                        {format(new Date(a.fechaRevision), 'd MMM y', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TIPO_LABELS[a.tipo] || a.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.rentaAnterior} €</TableCell>
                      <TableCell>{a.rentaNueva} €</TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">
                          +{a.incrementoPorcentaje.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.estado === 'aplicada' || a.estado === 'comunicada'
                              ? 'default'
                              : a.estado === 'rechazada'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {a.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.fechaComunicacion
                          ? format(new Date(a.fechaComunicacion), 'd MMM y', { locale: es })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {a.estado === 'pendiente' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleComunicar(a.id)}
                            disabled={comunicandoId === a.id}
                          >
                            <Send className="mr-1 h-4 w-4" />
                            {comunicandoId === a.id ? 'Enviando...' : 'Comunicar'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
