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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';

interface Pago {
  id: string;
  fecha: string;
  inmueble: string;
  inquilino: string;
  concepto: string;
  importe: number;
  estado: 'cobrado' | 'pendiente' | 'impago';
}

const MOCK_PAGOS: Pago[] = [
  { id: '1', fecha: '2025-03-01', inmueble: 'Piso 1A', inquilino: 'Juan García', concepto: 'Renta marzo', importe: 950, estado: 'cobrado' },
  { id: '2', fecha: '2025-03-05', inmueble: 'Piso 3C', inquilino: 'María López', concepto: 'Renta marzo', importe: 1200, estado: 'cobrado' },
  { id: '3', fecha: '2025-03-10', inmueble: 'Piso 2B', inquilino: '—', concepto: 'Renta marzo', importe: 1100, estado: 'pendiente' },
  { id: '4', fecha: '2025-02-15', inmueble: 'Piso 1A', inquilino: 'Juan García', concepto: 'Renta febrero', importe: 950, estado: 'impago' },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('es-ES');
}

function getEstadoBadge(estado: Pago['estado']) {
  const variants: Record<Pago['estado'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    cobrado: 'default',
    pendiente: 'outline',
    impago: 'destructive',
  };
  return <Badge variant={variants[estado]}>{estado}</Badge>;
}

export default function PagosPage() {
  const [loading, setLoading] = useState(true);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [fechaDesde, setFechaDesde] = useState('2025-01-01');
  const [fechaHasta, setFechaHasta] = useState('2025-03-31');

  useEffect(() => {
    setTimeout(() => {
      setPagos(MOCK_PAGOS);
      setLoading(false);
    }, 400);
  }, []);

  const totalCobrado = pagos.filter((p) => p.estado === 'cobrado').reduce((acc, p) => acc + p.importe, 0);
  const totalPendiente = pagos.filter((p) => p.estado === 'pendiente').reduce((acc, p) => acc + p.importe, 0);
  const totalImpago = pagos.filter((p) => p.estado === 'impago').reduce((acc, p) => acc + p.importe, 0);

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
        <h1 className="text-2xl font-bold">Historial de pagos</h1>
        <p className="text-muted-foreground">Pagos recibidos y pendientes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total cobrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalCobrado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(totalPendiente)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Impagos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600">{formatCurrency(totalImpago)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Listado de pagos
          </CardTitle>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label htmlFor="desde">Desde</Label>
              <Input id="desde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-[140px]" />
            </div>
            <div>
              <Label htmlFor="hasta">Hasta</Label>
              <Input id="hasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-[140px]" />
            </div>
            <Button variant="secondary">Filtrar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Inmueble</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatDate(p.fecha)}</TableCell>
                  <TableCell className="font-medium">{p.inmueble}</TableCell>
                  <TableCell>{p.inquilino}</TableCell>
                  <TableCell>{p.concepto}</TableCell>
                  <TableCell>{formatCurrency(p.importe)}</TableCell>
                  <TableCell>{getEstadoBadge(p.estado)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
