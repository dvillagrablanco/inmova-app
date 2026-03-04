'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Provider {
  id: string;
  nombre: string;
  tipo: string;
  rating?: number | null;
  _count?: { maintenanceRequests?: number; expenses?: number };
}

const MOCK_PROVIDERS: Provider[] = [
  { id: '1', nombre: 'Fontanería García', tipo: 'Fontanería', rating: 4.8 },
  { id: '2', nombre: 'Electricidad López', tipo: 'Electricidad', rating: 4.2 },
  { id: '3', nombre: 'Limpieza Express', tipo: 'Limpieza', rating: 4.9 },
  { id: '4', nombre: 'Pinturas Martínez', tipo: 'Pintura', rating: 4.5 },
  { id: '5', nombre: 'Cerrajería Segura', tipo: 'Cerrajería', rating: 4.0 },
];

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  const filled = Math.round(Math.min(Math.max(value, 0), max));
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );
}

export default function ProveedoresEvaluacionPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingValue, setRatingValue] = useState(0);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch('/api/providers');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          const sorted = [...list].sort(
            (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
          );
          setProviders(sorted);
        } else {
          setProviders(MOCK_PROVIDERS);
        }
      } catch {
        setProviders(MOCK_PROVIDERS);
      } finally {
        setLoading(false);
      }
    }
    fetchProviders();
  }, []);

  const sortedProviders = [...providers].sort(
    (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
  );

  const totalProveedores = providers.length;
  const ratingMedio =
    providers.length > 0
      ? providers.reduce((s, p) => s + (p.rating ?? 0), 0) / providers.length
      : 0;
  const mejorProveedor =
    providers.length > 0
      ? providers.reduce((best, p) =>
          (p.rating ?? 0) > (best.rating ?? 0) ? p : best
        )
      : null;

  const handleOpenEvaluar = () => {
    setRatingValue(0);
    setComentario('');
  };

  const handleSubmitEvaluacion = () => {
    toast.success('Evaluación guardada', {
      description: `Rating: ${ratingValue} estrellas${comentario ? ' - Comentario registrado' : ''}`,
    });
    setRatingValue(0);
    setComentario('');
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/proveedores">Proveedores</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Evaluación</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Evaluación de Proveedores</h1>
          <p className="text-muted-foreground">
            Valoraciones, trabajos realizados y tiempo de respuesta
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Proveedores</CardDescription>
              <CardTitle className="text-3xl">{totalProveedores}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rating Medio</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-1">
                <StarRating value={ratingMedio} />
                <span className="text-lg font-normal text-muted-foreground">
                  ({ratingMedio.toFixed(1)})
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Mejor Proveedor</CardDescription>
              <CardTitle className="text-lg">
                {mejorProveedor ? (
                  <>
                    {mejorProveedor.nombre}
                    <Badge variant="secondary" className="ml-2">
                      {(mejorProveedor.rating ?? 0).toFixed(1)}
                    </Badge>
                  </>
                ) : (
                  '-'
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Listado de Proveedores</CardTitle>
              <CardDescription>Ordenado por rating descendente</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Servicios</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Trabajos Realizados</TableHead>
                    <TableHead>Tiempo Respuesta</TableHead>
                    <TableHead>Último Trabajo</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProviders.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        <StarRating value={p.rating ?? 0} />
                      </TableCell>
                      <TableCell>
                        {p._count?.maintenanceRequests ?? p._count?.expenses ?? '-'}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <Dialog
                          onOpenChange={(open) => {
                            if (open) handleOpenEvaluar();
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Evaluar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Evaluar a {p.nombre}</DialogTitle>
                              <DialogDescription>
                                Valoración de 1 a 5 estrellas y comentario opcional
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setRatingValue(n)}
                                    className="p-1 rounded hover:bg-muted"
                                  >
                                    <Star
                                      className={`h-8 w-8 ${
                                        n <= ratingValue
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Comentario</label>
                                <textarea
                                  className="w-full min-h-[80px] rounded-md border px-3 py-2 text-sm"
                                  placeholder="Comentario opcional..."
                                  value={comentario}
                                  onChange={(e) => setComentario(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleSubmitEvaluacion}
                                disabled={ratingValue === 0}
                              >
                                Guardar evaluación
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
