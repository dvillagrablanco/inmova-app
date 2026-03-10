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
import { Building2, Home, Loader2 } from 'lucide-react';

interface Propiedad {
  id: string;
  inmueble: string;
  direccion: string;
  inquilinoActual: string;
  rentaMensual: number;
  estado: 'ocupado' | 'vacío' | 'mantenimiento';
}

const MOCK_PROPIEDADES: Propiedad[] = [
  { id: '1', inmueble: 'Piso 1A', direccion: 'Calle Mayor 123, Madrid', inquilinoActual: 'Juan García', rentaMensual: 950, estado: 'ocupado' },
  { id: '2', inmueble: 'Piso 2B', direccion: 'Calle Mayor 123, Madrid', inquilinoActual: '—', rentaMensual: 1100, estado: 'vacío' },
  { id: '3', inmueble: 'Piso 3C', direccion: 'Calle Mayor 123, Madrid', inquilinoActual: 'María López', rentaMensual: 1200, estado: 'ocupado' },
  { id: '4', inmueble: 'Local 1', direccion: 'Calle Comercial 45, Barcelona', inquilinoActual: '—', rentaMensual: 1500, estado: 'mantenimiento' },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function getEstadoBadge(estado: Propiedad['estado']) {
  const variants: Record<Propiedad['estado'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ocupado: 'default',
    vacío: 'secondary',
    mantenimiento: 'destructive',
  };
  return <Badge variant={variants[estado]}>{estado}</Badge>;
}

export default function PropiedadesPage() {
  const [loading, setLoading] = useState(true);
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setPropiedades(MOCK_PROPIEDADES);
      setLoading(false);
    }, 400);
  }, []);

  const totalPropiedades = propiedades.length;
  const ocupadas = propiedades.filter((p) => p.estado === 'ocupado').length;
  const ocupacion = totalPropiedades > 0 ? Math.round((ocupadas / totalPropiedades) * 100) : 0;
  const rentaTotal = propiedades.reduce((acc, p) => acc + (p.estado === 'ocupado' ? p.rentaMensual : 0), 0);

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
        <h1 className="text-2xl font-bold">Propiedades</h1>
        <p className="text-muted-foreground">Listado de tus inmuebles</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-4 w-4" />
              Total propiedades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalPropiedades}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Ocupación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{ocupacion}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              Renta total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(rentaTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de propiedades</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inmueble</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Inquilino actual</TableHead>
                <TableHead>Renta mensual</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propiedades.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.inmueble}</TableCell>
                  <TableCell>{p.direccion}</TableCell>
                  <TableCell>{p.inquilinoActual}</TableCell>
                  <TableCell>{formatCurrency(p.rentaMensual)}</TableCell>
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
