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
import { Wrench, Loader2 } from 'lucide-react';

interface Incidencia {
  id: string;
  fecha: string;
  inmueble: string;
  titulo: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estado: 'abierta' | 'en_curso' | 'resuelta' | 'cerrada';
  proveedor: string;
}

const MOCK_INCIDENCIAS: Incidencia[] = [
  {
    id: '1',
    fecha: '2025-03-08',
    inmueble: 'Piso 1A',
    titulo: 'Fuga de agua en baño',
    prioridad: 'alta',
    estado: 'en_curso',
    proveedor: 'Fontanería García',
  },
  {
    id: '2',
    fecha: '2025-03-05',
    inmueble: 'Piso 3C',
    titulo: 'Cambio de cerradura',
    prioridad: 'media',
    estado: 'resuelta',
    proveedor: 'Cerrajería López',
  },
  {
    id: '3',
    fecha: '2025-03-10',
    inmueble: 'Piso 2B',
    titulo: 'Revisión calefacción',
    prioridad: 'baja',
    estado: 'abierta',
    proveedor: '—',
  },
  {
    id: '4',
    fecha: '2025-03-01',
    inmueble: 'Piso 1A',
    titulo: 'Reparación persiana',
    prioridad: 'media',
    estado: 'cerrada',
    proveedor: 'Persianas Madrid',
  },
];

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('es-ES');
}

function getPrioridadBadge(prioridad: Incidencia['prioridad']) {
  const labels: Record<Incidencia['prioridad'], string> = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    urgente: 'Urgente',
  };
  const variants: Record<Incidencia['prioridad'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    baja: 'outline',
    media: 'secondary',
    alta: 'default',
    urgente: 'destructive',
  };
  return <Badge variant={variants[prioridad]}>{labels[prioridad]}</Badge>;
}

function getEstadoBadge(estado: Incidencia['estado']) {
  const labels: Record<Incidencia['estado'], string> = {
    abierta: 'Abierta',
    en_curso: 'En curso',
    resuelta: 'Resuelta',
    cerrada: 'Cerrada',
  };
  const variants: Record<Incidencia['estado'], 'default' | 'secondary' | 'outline'> = {
    abierta: 'outline',
    en_curso: 'default',
    resuelta: 'secondary',
    cerrada: 'secondary',
  };
  return <Badge variant={variants[estado]}>{labels[estado]}</Badge>;
}

export default function IncidenciasPage() {
  const [loading, setLoading] = useState(true);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  useEffect(() => {
    setTimeout(() => {
      setIncidencias(MOCK_INCIDENCIAS);
      setLoading(false);
    }, 400);
  }, []);

  const filtradas =
    filtroEstado === 'todos'
      ? incidencias
      : incidencias.filter((i) => i.estado === filtroEstado);

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
        <h1 className="text-2xl font-bold">Incidencias</h1>
        <p className="text-muted-foreground">Incidencias de mantenimiento en tus propiedades</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Listado de incidencias
          </CardTitle>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="abierta">Abierta</SelectItem>
              <SelectItem value="en_curso">En curso</SelectItem>
              <SelectItem value="resuelta">Resuelta</SelectItem>
              <SelectItem value="cerrada">Cerrada</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Inmueble</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Proveedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{formatDate(i.fecha)}</TableCell>
                  <TableCell className="font-medium">{i.inmueble}</TableCell>
                  <TableCell>{i.titulo}</TableCell>
                  <TableCell>{getPrioridadBadge(i.prioridad)}</TableCell>
                  <TableCell>{getEstadoBadge(i.estado)}</TableCell>
                  <TableCell>{i.proveedor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
