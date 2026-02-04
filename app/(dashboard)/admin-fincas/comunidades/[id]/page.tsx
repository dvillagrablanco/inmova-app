'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import { Building2, FileText, Wallet, BarChart3, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CommunityDetail {
  id: string;
  nombreComunidad: string;
  direccion: string;
  ciudad?: string;
  provincia?: string;
  activa: boolean;
  building: {
    nombre: string;
    direccion: string;
    numeroUnidades?: number;
  };
  facturas: Array<{
    id: string;
    numeroFactura: string;
    fechaEmision: string;
    totalFactura: number;
    estado: string;
  }>;
  movimientosCaja: Array<{
    id: string;
    fecha: string;
    tipo: string;
    concepto: string;
    importe: number;
  }>;
  informes: Array<{
    id: string;
    tipo: string;
    periodo: string;
    generadoEn: string;
  }>;
}

export default function ComunidadDetallePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const communityId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchCommunity();
    }
  }, [status, router, communityId]);

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin-fincas/communities/${communityId}`);
      if (!res.ok) throw new Error('Error cargando comunidad');
      const data = await res.json();
      setCommunity(data);
    } catch (error) {
      logger.error('Error fetching community:', error);
      toast.error('No se pudo cargar la comunidad');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async () => {
    if (!community) return;
    try {
      setToggling(true);
      const res = await fetch(`/api/admin-fincas/communities/${community.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !community.activa }),
      });
      if (!res.ok) throw new Error('Error actualizando comunidad');
      const updated = await res.json();
      setCommunity((prev) => (prev ? { ...prev, activa: updated.activa } : prev));
      toast.success(updated.activa ? 'Comunidad activada' : 'Comunidad desactivada');
    } catch (error) {
      logger.error('Error updating community:', error);
      toast.error('No se pudo actualizar la comunidad');
    } finally {
      setToggling(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!community) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h1 className="text-3xl font-bold">{community.nombreComunidad}</h1>
              <Badge variant={community.activa ? 'default' : 'secondary'}>
                {community.activa ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {community.direccion}
              {community.ciudad ? `, ${community.ciudad}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/admin-fincas/comunidades')}
            >
              Volver
            </Button>
            <Button
              variant={community.activa ? 'outline' : 'default'}
              onClick={toggleActive}
              disabled={toggling}
            >
              {toggling
                ? 'Actualizando...'
                : community.activa
                ? 'Desactivar'
                : 'Activar'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Edificio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{community.building.nombre}</p>
              <p className="text-sm text-muted-foreground">{community.building.direccion}</p>
              {community.building.numeroUnidades && (
                <p className="text-sm text-muted-foreground">
                  {community.building.numeroUnidades} unidades
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Facturas recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {community.facturas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin facturas recientes</p>
              ) : (
                community.facturas.slice(0, 3).map((factura) => (
                  <div key={factura.id} className="flex items-center justify-between text-sm">
                    <span>{factura.numeroFactura}</span>
                    <span>
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(factura.totalFactura)}
                    </span>
                  </div>
                ))
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() =>
                  router.push(`/admin-fincas/facturas?communityId=${community.id}`)
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver facturas
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Libro de caja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {community.movimientosCaja.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin movimientos recientes</p>
              ) : (
                community.movimientosCaja.slice(0, 3).map((mov) => (
                  <div key={mov.id} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[160px]">{mov.concepto}</span>
                    <span className={mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                      {mov.tipo === 'ingreso' ? '+' : '-'}
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(mov.importe)}
                    </span>
                  </div>
                ))
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() =>
                  router.push(`/admin-fincas/libro-caja?communityId=${community.id}`)
                }
              >
                <Wallet className="mr-2 h-4 w-4" />
                Ver libro de caja
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Informes recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {community.informes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin informes recientes</p>
              ) : (
                community.informes.slice(0, 3).map((report) => (
                  <div key={report.id} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{report.tipo}</span>
                    <span>
                      {format(new Date(report.generadoEn), 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                ))
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() =>
                  router.push(`/admin-fincas/informes?communityId=${community.id}`)
                }
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Ver informes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() =>
                  router.push(`/admin-fincas/facturas?communityId=${community.id}`)
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                Nueva factura
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(`/admin-fincas/libro-caja?communityId=${community.id}`)
                }
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Registrar movimiento
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(`/admin-fincas/informes?communityId=${community.id}`)
                }
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Generar informe
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
