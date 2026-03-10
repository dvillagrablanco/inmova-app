'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
import { ArrowLeft, FileText, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Propietario {
  id: string;
  nombre: string;
  email?: string;
}

interface Inmueble {
  id: string;
  nombre: string;
  direccion?: string;
  propietarioId: string;
}

export default function NuevaLiquidacionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [propietarios, setPropietarios] = useState<Propietario[]>([]);
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [propietarioId, setPropietarioId] = useState('');
  const [inmuebleId, setInmuebleId] = useState('');
  const [periodoMes, setPeriodoMes] = useState('');
  const [periodoAnio, setPeriodoAnio] = useState(new Date().getFullYear().toString());
  const [rentaCobrada, setRentaCobrada] = useState('');
  const [honorariosGestion, setHonorariosGestion] = useState('10');
  const [gastosRepercutidos, setGastosRepercutidos] = useState('0');
  const [notas, setNotas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch('/api/liquidaciones/options');
        const json = await res.json();
        if (json.success && json.data) {
          setPropietarios(json.data.propietarios || []);
          setInmuebles(json.data.inmuebles || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar opciones');
      }
    };
    if (status === 'authenticated') fetchOptions();
  }, [status]);

  const inmueblesFiltrados = propietarioId
    ? inmuebles.filter((i) => i.propietarioId === propietarioId)
    : inmuebles;

  const propietario = propietarios.find((p) => p.id === propietarioId);
  const inmueble = inmuebles.find((i) => i.id === inmuebleId);

  const renta = parseFloat(rentaCobrada) || 0;
  const honorariosPct = parseFloat(honorariosGestion) || 0;
  const gastos = parseFloat(gastosRepercutidos) || 0;
  const honorariosMonto = (renta * honorariosPct) / 100;
  const importeNeto = renta - honorariosMonto - gastos;

  const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propietarioId || !inmuebleId || !periodoMes || !periodoAnio || !propietario || !inmueble) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    if (renta <= 0) {
      toast.error('La renta cobrada debe ser mayor que 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/liquidaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propietarioId,
          propietarioNombre: propietario.nombre,
          propietarioEmail: propietario.email || '',
          inmuebleId,
          inmuebleNombre: inmueble.nombre,
          inmuebleDireccion: inmueble.direccion || inmueble.nombre,
          periodoMes: parseInt(periodoMes, 10),
          periodoAnio: parseInt(periodoAnio, 10),
          rentaCobrada: renta,
          honorariosGestion: honorariosPct,
          gastosRepercutibles: gastos,
          otrosGastos: 0,
          notas,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al crear');
      }
      toast.success('Liquidación creada correctamente');
      router.push('/liquidaciones');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error al crear liquidación');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout maxWidth="5xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SmartBreadcrumbs
            customSegments={[
              { label: 'Inicio', href: '/dashboard', icon: Home },
              { label: 'Liquidaciones', href: '/liquidaciones', icon: FileText },
              { label: 'Nueva liquidación', href: '/liquidaciones/nueva' },
            ]}
          />
          <Button variant="outline" asChild>
            <Link href="/liquidaciones" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nueva liquidación a propietario</CardTitle>
            <p className="text-sm text-muted-foreground">
              Rellena los datos para generar una nueva liquidación de rentas.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="propietario">Propietario *</Label>
                  <Select value={propietarioId} onValueChange={(v) => { setPropietarioId(v); setInmuebleId(''); }}>
                    <SelectTrigger id="propietario">
                      <SelectValue placeholder="Seleccionar propietario" />
                    </SelectTrigger>
                    <SelectContent>
                      {propietarios.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} {p.email ? `(${p.email})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inmueble">Inmueble *</Label>
                  <Select value={inmuebleId} onValueChange={setInmuebleId} disabled={!propietarioId}>
                    <SelectTrigger id="inmueble">
                      <SelectValue placeholder="Seleccionar inmueble" />
                    </SelectTrigger>
                    <SelectContent>
                      {inmueblesFiltrados.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="periodoMes">Mes *</Label>
                  <Select value={periodoMes} onValueChange={setPeriodoMes}>
                    <SelectTrigger id="periodoMes">
                      <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodoAnio">Año *</Label>
                  <Input
                    id="periodoAnio"
                    type="number"
                    min={2020}
                    max={2030}
                    value={periodoAnio}
                    onChange={(e) => setPeriodoAnio(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rentaCobrada">Renta cobrada (€) *</Label>
                  <Input
                    id="rentaCobrada"
                    type="number"
                    min={0}
                    step={0.01}
                    value={rentaCobrada}
                    onChange={(e) => setRentaCobrada(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="honorariosGestion">Honorarios gestión (%)</Label>
                  <Input
                    id="honorariosGestion"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={honorariosGestion}
                    onChange={(e) => setHonorariosGestion(e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gastosRepercutidos">Gastos repercutidos (€)</Label>
                <Input
                  id="gastosRepercutidos"
                  type="number"
                  min={0}
                  step={0.01}
                  value={gastosRepercutidos}
                  onChange={(e) => setGastosRepercutidos(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="font-medium mb-2">Resumen</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Renta cobrada:</span>
                    <span>{renta.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Honorarios ({honorariosPct}%):</span>
                    <span>-{honorariosMonto.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gastos repercutidos:</span>
                    <span>-{gastos.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Importe neto a pagar:</span>
                    <span>{importeNeto.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observaciones opcionales..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando...' : 'Crear liquidación'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/liquidaciones">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
