'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Euro, TrendingUp, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function ActivosGrupoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/investment/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data.data || []);
      }
    } catch { toast.error('Error cargando activos'); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const assetTypeLabel: Record<string, string> = {
    vivienda: 'Vivienda',
    local_comercial: 'Local Comercial',
    oficina: 'Oficina',
    garaje: 'Garaje',
    trastero: 'Trastero',
    nave_industrial: 'Nave Industrial',
    solar: 'Solar',
    otro: 'Otro',
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const totalInversion = assets.reduce((s, a) => s + (a.inversionTotal || a.precioCompra), 0);
  const totalValorMercado = assets.reduce((s, a) => s + (a.valorMercadoEstimado || a.precioCompra), 0);
  const totalAmortizacion = assets.reduce((s, a) => s + a.amortizacionAcumulada, 0);
  const totalDeudaHipotecaria = assets.reduce((s, a) =>
    s + (a.mortgages?.reduce((ms: number, m: any) => ms + m.capitalPendiente, 0) || 0), 0);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activos del Grupo</h1>
            <p className="text-gray-500">{assets.length} inmuebles en cartera</p>
          </div>
          <Button onClick={() => toast.info('Formulario de alta de activo pendiente')}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Activo
          </Button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Inversion Total</div>
              <div className="text-xl font-bold">{fmt(totalInversion)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Valor de Mercado</div>
              <div className="text-xl font-bold text-blue-600">{fmt(totalValorMercado)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Amortizacion Acumulada</div>
              <div className="text-xl font-bold text-orange-600">{fmt(totalAmortizacion)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Deuda Hipotecaria</div>
              <div className="text-xl font-bold text-red-600">{fmt(totalDeudaHipotecaria)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de activos */}
        <div className="space-y-3">
          {assets.map((asset) => {
            const plusvalia = (asset.valorMercadoEstimado || asset.precioCompra) -
              ((asset.inversionTotal || asset.precioCompra) - asset.amortizacionAcumulada);
            const deudaActivo = asset.mortgages?.reduce((s: number, m: any) => s + m.capitalPendiente, 0) || 0;
            const cuotaMensual = asset.mortgages?.reduce((s: number, m: any) => s + m.cuotaMensual, 0) || 0;

            return (
              <Card key={asset.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {asset.building?.nombre || asset.unit?.numero || 'Activo'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {asset.building?.direccion || '-'}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {assetTypeLabel[asset.assetType] || asset.assetType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Compra: {new Date(asset.fechaAdquisicion).getFullYear()}
                          </Badge>
                          {asset.referenciaCatastral && (
                            <Badge variant="outline" className="text-xs">
                              Ref: {asset.referenciaCatastral}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm text-gray-500">Compra</div>
                      <div className="font-medium">{fmt(asset.precioCompra)}</div>
                      <div className="text-xs text-gray-400">
                        V. Contable: {fmt((asset.inversionTotal || asset.precioCompra) - asset.amortizacionAcumulada)}
                      </div>
                      {plusvalia !== 0 && (
                        <div className={`text-xs flex items-center gap-1 justify-end ${plusvalia > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <TrendingUp className="h-3 w-3" />
                          Plusvalia: {fmt(plusvalia)}
                        </div>
                      )}
                      {deudaActivo > 0 && (
                        <div className="text-xs text-orange-600">
                          Hipoteca: {fmt(deudaActivo)} ({fmt(cuotaMensual)}/mes)
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {assets.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No hay activos registrados. Registra el primer inmueble del grupo.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
