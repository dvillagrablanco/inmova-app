'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Building2,
  Euro,
  Percent,
  Loader2,
  ExternalLink,
  Home,
  Car,
  Store,
  Warehouse,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import Link from 'next/link';

interface BuildingOnMap {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  tipo: string;
  latitud: number | null;
  longitud: number | null;
  companyId: string;
  companyName: string;
  totalUnidades: number;
  unidadesOcupadas: number;
  rentaMensual: number;
  ocupacion: number;
}

const tipoIcon: Record<string, any> = {
  residencial: Home,
  comercial: Store,
  mixto: Building2,
  garaje: Car,
  industrial: Warehouse,
};

const COMPANY_COLORS: Record<string, string> = {};
const COLOR_PALETTE = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
];

function getCompanyColor(companyName: string): string {
  if (!COMPANY_COLORS[companyName]) {
    const idx = Object.keys(COMPANY_COLORS).length % COLOR_PALETTE.length;
    COMPANY_COLORS[companyName] = COLOR_PALETTE[idx];
  }
  return COMPANY_COLORS[companyName];
}

export default function MapaCarteraPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<BuildingOnMap[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingOnMap | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') loadData();
  }, [status, router]);

  // Extraer ciudad de la dirección (último segmento tras la última coma)
  const extractCiudad = (direccion: string): string => {
    if (!direccion) return 'Sin ciudad';
    const parts = direccion.split(',').map(p => p.trim());
    // La ciudad suele ser el último segmento (ej: "C/ Reina, 15, Madrid" → "Madrid")
    const last = parts[parts.length - 1];
    // Limpiar código postal si lo tiene
    return last.replace(/^\d{5}\s*/, '').trim() || 'Sin ciudad';
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/buildings?limit=200');
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list = (Array.isArray(data) ? data : data.data || [])
        // Filtrar edificios de test/demo
        .filter((b: any) => !b.isDemo && !b.nombre?.includes('Test E2E'))
        .map((b: any) => ({
          id: b.id,
          nombre: b.nombre,
          direccion: b.direccion,
          ciudad: extractCiudad(b.direccion || ''),
          tipo: b.tipo || 'residencial',
          latitud: b.latitud || null,
          longitud: b.longitud || null,
          companyId: b.companyId,
          companyName: b.company?.nombre || 'Sin sociedad',
          totalUnidades: b.metrics?.totalUnits || b.totalUnidades || 0,
          unidadesOcupadas: b.metrics?.occupiedUnits || b.unidadesOcupadas || 0,
          rentaMensual: b.metrics?.ingresosMensuales || 0,
          ocupacion: b.metrics?.ocupacionPct || 0,
        }));
      setBuildings(list);
    } catch {
      toast.error('Error cargando edificios');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n);

  // Agrupar por ciudad
  const ciudades = [...new Set(buildings.map((b) => b.ciudad || 'Sin ciudad'))].sort();
  const sociedades = [...new Set(buildings.map((b) => b.companyName))].sort();

  // KPIs totales
  const totalEdificios = buildings.length;
  const totalUnidades = buildings.reduce((s, b) => s + b.totalUnidades, 0);
  const totalOcupadas = buildings.reduce((s, b) => s + b.unidadesOcupadas, 0);
  const totalRenta = buildings.reduce((s, b) => s + b.rentaMensual, 0);
  const ocupacionMedia = totalUnidades > 0 ? (totalOcupadas / totalUnidades) * 100 : 0;

  // Edificios con coordenadas para mapa
  const conCoords = buildings.filter((b) => b.latitud && b.longitud);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Mapa de Cartera</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa de Cartera</h1>
          <p className="text-gray-500">
            Vista geográfica de {totalEdificios} inmuebles en {ciudades.length} ciudades
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500">Inmuebles</div>
              <div className="text-xl font-bold">{totalEdificios}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500">Unidades</div>
              <div className="text-xl font-bold">{totalUnidades}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500">Ocupación</div>
              <div className="text-xl font-bold text-green-600">{ocupacionMedia.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500">Renta mensual</div>
              <div className="text-xl font-bold text-indigo-600">{fmt(totalRenta)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500">Ciudades</div>
              <div className="text-xl font-bold">{ciudades.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Leyenda sociedades */}
        <div className="flex flex-wrap gap-3">
          {sociedades.map((s) => (
            <div key={s} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${getCompanyColor(s)}`} />
              <span className="font-medium text-gray-700">{s}</span>
              <Badge variant="secondary" className="text-xs">
                {buildings.filter((b) => b.companyName === s).length}
              </Badge>
            </div>
          ))}
        </div>

        {/* Mapa embebido */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Mapa de Cartera
              {conCoords.length > 0 && (
                <Badge variant="secondary" className="text-xs">{conCoords.length} con coordenadas</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conCoords.length > 0 ? (
              <div className="space-y-3">
                {/* Mapa visual con puntos posicionados */}
                <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-lg overflow-hidden border bg-gray-100">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                      Math.min(...conCoords.map((b) => b.longitud!)) - 0.5
                    }%2C${
                      Math.min(...conCoords.map((b) => b.latitud!)) - 0.3
                    }%2C${
                      Math.max(...conCoords.map((b) => b.longitud!)) + 0.5
                    }%2C${
                      Math.max(...conCoords.map((b) => b.latitud!)) + 0.3
                    }&layer=mapnik`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    title="Mapa de cartera"
                  />
                  {/* Overlay con pins posicionados sobre el iframe */}
                  <div className="absolute inset-0 pointer-events-none">
                    {(() => {
                      const minLat = Math.min(...conCoords.map(b => b.latitud!)) - 0.3;
                      const maxLat = Math.max(...conCoords.map(b => b.latitud!)) + 0.3;
                      const minLng = Math.min(...conCoords.map(b => b.longitud!)) - 0.5;
                      const maxLng = Math.max(...conCoords.map(b => b.longitud!)) + 0.5;
                      return conCoords.map((b) => {
                        const x = ((b.longitud! - minLng) / (maxLng - minLng)) * 100;
                        const y = ((maxLat - b.latitud!) / (maxLat - minLat)) * 100;
                        return (
                          <div
                            key={b.id}
                            className="absolute pointer-events-auto cursor-pointer group"
                            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -100%)' }}
                            onClick={() => setSelectedBuilding(b)}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[8px] font-bold hover:scale-150 transition-transform ${
                              b.ocupacion >= 80 ? 'bg-green-500' : b.ocupacion >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}>
                              {b.totalUnidades || '•'}
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              {b.nombre} · {b.ocupacion.toFixed(0)}% ocup. · {fmt(b.rentaMensual)}/mes
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Links para ver en Google Maps */}
                <div className="flex flex-wrap gap-2">
                  {conCoords.slice(0, 8).map((b) => (
                    <a
                      key={b.id}
                      href={`https://www.google.com/maps?q=${b.latitud},${b.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" /> {b.nombre}
                    </a>
                  ))}
                  {conCoords.length > 8 && (
                    <span className="text-xs text-gray-400">+{conCoords.length - 8} más</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-[16/9] md:aspect-[21/9] rounded-lg overflow-hidden border">
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-5.5%2C38.5%2C0.5%2C42.0&layer=mapnik"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Mapa de cartera"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista por ciudad */}
        {ciudades.map((ciudad) => {
          const edificios = buildings.filter(
            (b) => (b.ciudad || 'Sin ciudad') === ciudad
          );
          const ciudadRenta = edificios.reduce((s, b) => s + b.rentaMensual, 0);
          const ciudadUnidades = edificios.reduce((s, b) => s + b.totalUnidades, 0);

          return (
            <div key={ciudad}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  {ciudad}
                  <Badge variant="secondary">{edificios.length} inmuebles</Badge>
                </h3>
                <div className="text-sm text-gray-500">
                  {ciudadUnidades} uds · {fmt(ciudadRenta)}/mes
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {edificios.map((b) => {
                  const Icon = tipoIcon[b.tipo] || Building2;
                  return (
                    <Link key={b.id} href={`/edificios/${b.id}`}>
                      <Card className="hover:shadow-lg transition-all cursor-pointer group">
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCompanyColor(
                                  b.companyName
                                )} text-white`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm">
                                  {b.nombre}
                                </div>
                                <div className="text-xs text-gray-500">{b.companyName}</div>
                              </div>
                            </div>
                            <Badge
                              className={`text-xs ${
                                b.ocupacion >= 90
                                  ? 'bg-green-100 text-green-700'
                                  : b.ocupacion >= 70
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {b.ocupacion.toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">{b.direccion}</div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              {b.unidadesOcupadas}/{b.totalUnidades} uds
                            </span>
                            <span className="font-semibold text-indigo-600">
                              {fmt(b.rentaMensual)}/mes
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AuthenticatedLayout>
  );
}
