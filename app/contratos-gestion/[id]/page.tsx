'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, FileText, User, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const TIPO_LABELS: Record<string, string> = {
  integral: 'Gestión integral',
  parcial: 'Gestión parcial',
  subarriendo: 'Subarriendo',
};

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  activo: 'Activo',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
};

export default function ContratoGestionDetallePage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !id) return;
    (async () => {
      try {
        const res = await fetch(`/api/contratos-gestion/${id}`);
        if (!res.ok) {
          toast.error('Contrato no encontrado');
          router.push('/contratos-gestion');
          return;
        }
        const json = await res.json().catch(() => null);
        setData(json);
      } catch {
        toast.error('Error al cargar');
        router.push('/contratos-gestion');
      } finally {
        setLoading(false);
      }
    })();
  }, [status, id, router]);

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-3xl mx-auto p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!data) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/contratos-gestion')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button size="sm" onClick={() => router.push(`/contratos-gestion/${id}/editar`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contrato de gestión
              </CardTitle>
              <Badge variant={data.estado === 'activo' ? 'default' : 'secondary'}>
                {ESTADO_LABELS[data.estado] || data.estado}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{data.propietario}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tipo</p>
              <p>{TIPO_LABELS[data.tipo] || data.tipo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Inmuebles</p>
              <ul className="space-y-1">
                {(data.inmuebles || []).map((inv: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Building2 className="h-3 w-3" />
                    {inv}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Honorarios</p>
                <p>
                  {data.honorarios != null
                    ? `€${data.honorarios}/mes`
                    : data.honorariosPorcentaje != null
                      ? `${data.honorariosPorcentaje}%`
                      : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vigencia</p>
                <p className="text-sm">
                  {(() => {
                    const fmt = (iso: string | undefined | null) => {
                      try {
                        if (!iso) return '—';
                        const d = new Date(iso);
                        if (isNaN(d.getTime())) return '—';
                        return format(d, 'dd MMM yyyy', { locale: es });
                      } catch {
                        return '—';
                      }
                    };
                    return `${fmt(data.fechaInicio)} — ${fmt(data.fechaFin)}`;
                  })()}
                </p>
              </div>
            </div>
            {data.condiciones && (
              <div>
                <p className="text-sm text-muted-foreground">Condiciones</p>
                <p className="text-sm whitespace-pre-wrap">{data.condiciones}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
