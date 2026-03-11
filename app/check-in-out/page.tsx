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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Send, Eye, ClipboardCheck, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CheckInOutItem {
  nombre: string;
  estado: string;
  valor?: string | null;
  foto?: string | null;
}

interface CheckInOutEntry {
  id: string;
  tipo: string;
  inquilinoId: string;
  inquilinoNombre: string;
  inmuebleId: string;
  inmuebleNombre: string;
  fecha: string;
  estado: string;
  token: string;
  items: CheckInOutItem[];
  createdAt: string;
}

export default function CheckInOutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<CheckInOutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('check-ins');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/check-in-out');
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

  const checkIns = entries.filter((e) => e.tipo === 'check-in');
  const checkOuts = entries.filter((e) => e.tipo === 'check-out');

  const pendientes = entries.filter((e) => e.estado === 'pendiente').length;
  const completadosMes = entries.filter((e) => {
    if (e.estado !== 'completado') return false;
    const d = new Date(e.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const handleEnviarFormulario = (entry: CheckInOutEntry) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${baseUrl}/check-in-out/formulario/${entry.token}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace copiado al portapapeles');
  };

  const filteredEntries = activeTab === 'check-ins' ? checkIns : checkOuts;

  return (
    <AuthenticatedLayout>
      <SmartBreadcrumbs
        customSegments={[
          { label: 'Check-in / Check-out', href: '/check-in-out' },
        ]}
      />
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Check-in / Check-out Digital
            </h1>
            <p className="text-muted-foreground">
              Gestión de registros de entrada y salida de inquilinos
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/check-in-out/nuevo?tipo=check-out')}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Nuevo Check-out
            </Button>
            <Button onClick={() => router.push('/check-in-out/nuevo?tipo=check-in')}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Nuevo Check-in
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendientes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completados este mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{completadosMes}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registros</CardTitle>
            <CardDescription>
              Lista de check-ins y check-outs programados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="check-ins">Check-ins</TabsTrigger>
                <TabsTrigger value="check-outs">Check-outs</TabsTrigger>
              </TabsList>
              <TabsContent value="check-ins" className="mt-4">
                <TableContent
                  entries={filteredEntries}
                  loading={loading}
                  onEnviar={handleEnviarFormulario}
                  onVerDetalles={(e) => router.push(`/check-in-out/${e.id}`)}
                />
              </TabsContent>
              <TabsContent value="check-outs" className="mt-4">
                <TableContent
                  entries={filteredEntries}
                  loading={loading}
                  onEnviar={handleEnviarFormulario}
                  onVerDetalles={(e) => router.push(`/check-in-out/${e.id}`)}
                />
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
  onEnviar,
  onVerDetalles,
}: {
  entries: CheckInOutEntry[];
  loading: boolean;
  onEnviar: (e: CheckInOutEntry) => void;
  onVerDetalles: (e: CheckInOutEntry) => void;
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
          <TableHead>Inquilino</TableHead>
          <TableHead>Inmueble</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Token</TableHead>
          <TableHead className="w-[80px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="font-medium">{entry.inquilinoNombre}</TableCell>
            <TableCell>{entry.inmuebleNombre}</TableCell>
            <TableCell>
              {format(new Date(entry.fecha), 'd MMM y', { locale: es })}
            </TableCell>
            <TableCell>
              <Badge variant={entry.estado === 'completado' ? 'default' : 'secondary'}>
                {entry.estado}
              </Badge>
            </TableCell>
            <TableCell>
              <code className="text-xs">{entry.token}</code>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEnviar(entry)}>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar formulario
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onVerDetalles(entry)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
