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
import { Button } from '@/components/ui/button';
import { Receipt, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Liquidacion {
  id: string;
  periodo: string;
  inmueble: string;
  rentaCobrada: number;
  honorariosGestion: number;
  gastos: number;
  netoRecibir: number;
  estado: 'liquidado' | 'pendiente' | 'en_proceso';
}

const MOCK_LIQUIDACIONES: Liquidacion[] = [
  {
    id: '1',
    periodo: 'Marzo 2025',
    inmueble: 'Piso 1A',
    rentaCobrada: 950,
    honorariosGestion: 95,
    gastos: 45,
    netoRecibir: 810,
    estado: 'liquidado',
  },
  {
    id: '2',
    periodo: 'Marzo 2025',
    inmueble: 'Piso 3C',
    rentaCobrada: 1200,
    honorariosGestion: 120,
    gastos: 0,
    netoRecibir: 1080,
    estado: 'liquidado',
  },
  {
    id: '3',
    periodo: 'Marzo 2025',
    inmueble: 'Piso 2B',
    rentaCobrada: 1100,
    honorariosGestion: 110,
    gastos: 80,
    netoRecibir: 910,
    estado: 'en_proceso',
  },
  {
    id: '4',
    periodo: 'Abril 2025',
    inmueble: 'Piso 1A',
    rentaCobrada: 950,
    honorariosGestion: 95,
    gastos: 0,
    netoRecibir: 855,
    estado: 'pendiente',
  },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function getEstadoBadge(estado: Liquidacion['estado']) {
  const labels: Record<Liquidacion['estado'], string> = {
    liquidado: 'Liquidado',
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
  };
  const variants: Record<Liquidacion['estado'], 'default' | 'secondary' | 'outline'> = {
    liquidado: 'default',
    pendiente: 'outline',
    en_proceso: 'secondary',
  };
  return <Badge variant={variants[estado]}>{labels[estado]}</Badge>;
}

export default function LiquidacionesPage() {
  const [loading, setLoading] = useState(true);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setLiquidaciones(MOCK_LIQUIDACIONES);
      setLoading(false);
    }, 400);
  }, []);

  const totalLiquidado = liquidaciones
    .filter((l) => l.estado === 'liquidado')
    .reduce((acc, l) => acc + l.netoRecibir, 0);
  const pendienteCobro = liquidaciones
    .filter((l) => l.estado === 'pendiente' || l.estado === 'en_proceso')
    .reduce((acc, l) => acc + l.netoRecibir, 0);

  const handleDescargar = (id: string) => {
    toast.info('Descarga de PDF próximamente');
  };

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
        <h1 className="text-2xl font-bold">Liquidaciones</h1>
        <p className="text-muted-foreground">Resumen de liquidaciones por periodo</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total liquidado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalLiquidado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pendiente de cobro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(pendienteCobro)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Listado de liquidaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periodo</TableHead>
                <TableHead>Inmueble</TableHead>
                <TableHead>Renta cobrada</TableHead>
                <TableHead>Honorarios gestión</TableHead>
                <TableHead>Gastos</TableHead>
                <TableHead>Neto a recibir</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[100px]">Descargar PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liquidaciones.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.periodo}</TableCell>
                  <TableCell>{l.inmueble}</TableCell>
                  <TableCell>{formatCurrency(l.rentaCobrada)}</TableCell>
                  <TableCell>{formatCurrency(l.honorariosGestion)}</TableCell>
                  <TableCell>{formatCurrency(l.gastos)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(l.netoRecibir)}</TableCell>
                  <TableCell>{getEstadoBadge(l.estado)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDescargar(l.id)}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
