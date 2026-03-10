'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { FileText, Loader2 } from 'lucide-react';

interface Contrato {
  id: string;
  inmueble: string;
  inquilino: string;
  inicio: string;
  fin: string;
  renta: number;
  estado: 'activo' | 'expirado' | 'pendiente';
}

const MOCK_CONTRATOS: Contrato[] = [
  { id: '1', inmueble: 'Piso 1A', inquilino: 'Juan García', inicio: '2024-01-15', fin: '2025-01-14', renta: 950, estado: 'activo' },
  { id: '2', inmueble: 'Piso 3C', inquilino: 'María López', inicio: '2023-06-01', fin: '2024-05-31', renta: 1200, estado: 'expirado' },
  { id: '3', inmueble: 'Piso 2B', inquilino: 'Pendiente', inicio: '2025-02-01', fin: '2026-01-31', renta: 1100, estado: 'pendiente' },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('es-ES');
}

function getEstadoBadge(estado: Contrato['estado']) {
  const variants: Record<Contrato['estado'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    activo: 'default',
    expirado: 'secondary',
    pendiente: 'outline',
  };
  return <Badge variant={variants[estado]}>{estado}</Badge>;
}

export default function ContratosPage() {
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  useEffect(() => {
    setTimeout(() => {
      setContratos(MOCK_CONTRATOS);
      setLoading(false);
    }, 400);
  }, []);

  const filtrados =
    filtroEstado === 'todos'
      ? contratos
      : contratos.filter((c) => c.estado === filtroEstado);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contratos</h1>
        <p className="text-muted-foreground">Contratos de tus propiedades</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Listado de contratos
          </CardTitle>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="expirado">Expirado</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inmueble</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Renta</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.inmueble}</TableCell>
                  <TableCell>{c.inquilino}</TableCell>
                  <TableCell>{formatDate(c.inicio)}</TableCell>
                  <TableCell>{formatDate(c.fin)}</TableCell>
                  <TableCell>{formatCurrency(c.renta)}</TableCell>
                  <TableCell>{getEstadoBadge(c.estado)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
