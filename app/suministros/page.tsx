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
import { Zap, Droplets, Flame, Wifi, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Lectura {
  fecha: string;
  valor: number;
  consumo: number;
}

interface Suministro {
  id: string;
  inmuebleId: string;
  inmuebleNombre: string;
  tipo: string;
  proveedor: string;
  numeroContrato: string;
  titular: string;
  estado: string;
  ultimaLectura: string | null;
  ultimaLecturaFecha: string | null;
  lecturas: Lectura[];
}

const TIPO_ICONS: Record<string, React.ElementType> = {
  agua: Droplets,
  electricidad: Zap,
  gas: Flame,
  internet: Wifi,
};

const TIPO_LABELS: Record<string, string> = {
  agua: 'Agua',
  electricidad: 'Electricidad',
  gas: 'Gas',
  internet: 'Internet',
};

export default function SuministrosPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [supplies, setSupplies] = useState<Suministro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/suministros');
        if (res.ok) {
          const data = await res.json();
          setSupplies(Array.isArray(data) ? data : data.data || []);
        }
      } catch {
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    if (status === 'authenticated') fetchData();
  }, [status]);

  const consumoTotal = supplies.reduce((acc, s) => {
    const last = s.lecturas[s.lecturas.length - 1];
    return acc + (last?.consumo || 0);
  }, 0);
  const repercutidoTotal = supplies.reduce((acc, s) => {
    const last = s.lecturas[s.lecturas.length - 1];
    return acc + (last?.consumo || 0) * 0.8;
  }, 0);

  return (
    <AuthenticatedLayout>
      <SmartBreadcrumbs
        customSegments={[
          { label: 'Suministros', href: '/suministros' },
        ]}
      />
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Suministros y Lecturas
            </h1>
            <p className="text-muted-foreground">
              Gestión de agua, electricidad, gas e internet por inmueble
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => toast.info('Nueva lectura próximamente')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Nueva lectura
            </Button>
            <Button onClick={() => toast.info('Nuevo suministro próximamente')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo suministro
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Consumo total (últimas lecturas)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{consumoTotal} kWh/m³</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Repercutido al inquilino (estimado)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{repercutidoTotal.toFixed(0)} €</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Suministros</CardTitle>
            <CardDescription>
              Lista de suministros por inmueble
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                Cargando...
              </div>
            ) : supplies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                No hay suministros
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inmueble</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Nº contrato</TableHead>
                    <TableHead>Titular</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última lectura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplies.map((s) => {
                    const Icon = TIPO_ICONS[s.tipo] || Zap;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.inmuebleNombre}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {TIPO_LABELS[s.tipo] || s.tipo}
                          </span>
                        </TableCell>
                        <TableCell>{s.proveedor}</TableCell>
                        <TableCell>
                          <code className="text-xs">{s.numeroContrato}</code>
                        </TableCell>
                        <TableCell>{s.titular}</TableCell>
                        <TableCell>
                          <Badge variant={s.estado === 'activo' ? 'default' : 'secondary'}>
                            {s.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {s.ultimaLectura
                            ? `${s.ultimaLectura}${s.ultimaLecturaFecha ? ` (${format(new Date(s.ultimaLecturaFecha), 'd MMM y', { locale: es })})` : ''}`
                            : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
