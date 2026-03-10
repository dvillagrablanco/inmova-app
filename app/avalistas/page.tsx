'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, ExternalLink } from 'lucide-react';
import { ModuleAIAssistant } from '@/components/ai/ModuleAIAssistant';
import { toast } from 'sonner';
import Link from 'next/link';

interface Avalista {
  id: string;
  nombre: string;
  dni: string;
  telefono: string;
  email: string;
  contratoId: string;
  contratoRef: string;
  inmuebleNombre: string;
  tipoGarantia: string;
  importe: number;
  estado: string;
  fechaInicio?: string;
  fechaFin?: string;
}

const TIPO_LABELS: Record<string, string> = {
  personal: 'Personal',
  bancaria: 'Bancaria',
  seguro: 'Seguro',
};

export default function AvalistasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [avalistas, setAvalistas] = useState<Avalista[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/avalistas');
        if (res.ok) {
          const data = await res.json();
          setAvalistas(Array.isArray(data) ? data : data.data || []);
        }
      } catch {
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    if (status === 'authenticated') fetchData();
  }, [status]);

  return (
    <AuthenticatedLayout>
      <SmartBreadcrumbs
        customSegments={[
          { label: 'Avalistas', href: '/avalistas' },
        ]}
      />
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Avalistas (Garantes)
            </h1>
            <p className="text-muted-foreground">
              Garantes vinculados a contratos de arrendamiento
            </p>
          </div>
          <Button onClick={() => toast.info('Formulario nuevo avalista próximamente')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo avalista
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de avalistas</CardTitle>
            <CardDescription>
              Garantes personales, bancarios y de seguro
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                Cargando...
              </div>
            ) : avalistas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                No hay avalistas
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>DNI/NIF</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Inmueble</TableHead>
                    <TableHead>Tipo garantía</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {avalistas.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.nombre}</TableCell>
                      <TableCell>{a.dni}</TableCell>
                      <TableCell>{a.telefono}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>
                        <Link
                          href={`/contratos/${a.contratoId}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {a.contratoRef}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
                      <TableCell>{a.inmuebleNombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TIPO_LABELS[a.tipoGarantia] || a.tipoGarantia}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.importe.toLocaleString('es-ES')} €</TableCell>
                      <TableCell>
                        <Badge variant={a.estado === 'activo' ? 'default' : 'secondary'}>
                          {a.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/contratos/${a.contratoId}`}>
                            Ver contrato
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <ModuleAIAssistant module="avalistas" />
    </AuthenticatedLayout>
  );
}
