'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Home, MapPin, Building2, RefreshCw, Euro, TrendingUp, AlertTriangle, Shield,
} from 'lucide-react';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface BuildingMapData {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  lat: number;
  lng: number;
  company: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancy: number;
  monthlyRent: number;
  hasInsurance: boolean;
  insuranceExpiring: boolean;
  pendingMaintenance: number;
  yieldEstimated: number;
}

// Geocoding approximations for known addresses
const KNOWN_COORDS: Record<string, [number, number]> = {
  'hernandez de tejada': [40.4350, -3.6780],
  'candelaria mora': [41.6520, -4.7245],
  'reina': [40.4250, -3.7010],
  'piamonte': [40.4255, -3.6985],
  'manuel silvela': [40.4340, -3.6930],
  'menendez pelayo': [40.4100, -3.6830],
  'prado': [40.4140, -3.6930],
  'cuba': [41.6510, -4.7300],
  'metal': [41.6400, -4.7350],
  'constitución': [41.6530, -4.7260],
  'espronceda': [40.4320, -3.7000],
  'barquillo': [40.4230, -3.6950],
  'europa': [41.6480, -4.7210],
  'tomillar': [40.4500, -3.7500],
  'gemelos': [36.7200, -4.4100],
  'camilo jose cela': [36.5100, -4.8900],
  'grijota': [42.0100, -4.5700],
};

function getCoords(name: string): [number, number] {
  const lower = name.toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_COORDS)) {
    if (lower.includes(key)) return coords;
  }
  return [40.4168, -3.7038]; // Madrid default
}

function getOccupancyColor(occ: number): string {
  if (occ >= 90) return '#16a34a';
  if (occ >= 70) return '#d97706';
  if (occ >= 50) return '#ea580c';
  return '#dc2626';
}

export default function MapaPatrimonioPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<BuildingMapData[]>([]);
  const [colorBy, setColorBy] = useState<'occupancy' | 'yield' | 'insurance'>('occupancy');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingMapData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, segurosRes] = await Promise.all([
        fetch('/api/buildings'),
        fetch('/api/seguros'),
      ]);
      const insuredBuildingIds = new Set<string>();
      if (segurosRes.ok) {
        const rawSeguros = await segurosRes.json();
        const segurosList = Array.isArray(rawSeguros) ? rawSeguros : [];
        for (const s of segurosList) {
          if (s.buildingId) insuredBuildingIds.add(s.buildingId);
          else if (s.unit?.buildingId) insuredBuildingIds.add(s.unit.buildingId);
        }
      }
      if (res.ok) {
        const data = await res.json();
        const blds = (data.buildings || data || []).map((b: any) => {
          const totalUnits = b.totalUnidades || b.units?.length || b._count?.units || b.numeroUnidades || 0;
          const occupiedUnits = b.unidadesOcupadas || b.units?.filter((u: any) => u.tenantId || u.estado === 'ocupada').length || 0;
          const occupancy = b.metrics?.ocupacionPct || (totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0);
          const monthlyRent = b.metrics?.ingresosMensuales || b.units?.reduce((s: number, u: any) => s + (u.rentaMensual || 0), 0) || 0;
          // Use DB coordinates if available, otherwise fallback to name-based geocoding
          const dbLat = b.latitud || b.lat;
          const dbLng = b.longitud || b.lng;
          const coords = (dbLat && dbLng) ? [dbLat, dbLng] : getCoords(b.nombre || b.direccion || '');
          const valorMercado = b.metrics?.valorMercado || b.valorMercado || 0;
          return {
            id: b.id,
            nombre: b.nombre || b.direccion || 'Sin nombre',
            direccion: b.direccion || '',
            ciudad: b.ciudad || (coords[0] > 41 ? 'Valladolid' : coords[0] < 37 ? 'Marbella' : 'Madrid'),
            lat: coords[0],
            lng: coords[1],
            company: b.company?.nombre || '',
            totalUnits,
            occupiedUnits,
            occupancy,
            monthlyRent,
            hasInsurance: insuredBuildingIds.has(b.id),
            insuranceExpiring: false,
            pendingMaintenance: b.maintenanceRequests?.filter((m: any) => m.status !== 'completado').length || 0,
            yieldEstimated: b.metrics?.yieldBruto || (monthlyRent > 0 && valorMercado > 0 ? ((monthlyRent * 12) / valorMercado) * 100 : 0),
          };
        });
        setBuildings(blds);
      }
    } catch {
      toast.error('Error cargando edificios');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  // Aggregate KPIs
  const totalUnits = buildings.reduce((s, b) => s + b.totalUnits, 0);
  const totalOccupied = buildings.reduce((s, b) => s + b.occupiedUnits, 0);
  const totalRent = buildings.reduce((s, b) => s + b.monthlyRent, 0);
  const insuredCount = buildings.filter(b => b.hasInsurance).length;
  const avgOccupancy = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  // Group by city
  const cities = [...new Set(buildings.map(b => b.ciudad))].sort();

  if (loading) return <AuthenticatedLayout><div className="max-w-7xl mx-auto space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[500px]" /></div></AuthenticatedLayout>;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <Breadcrumb><BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Mapa de Patrimonio</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList></Breadcrumb>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><MapPin className="h-6 w-6" /> Mapa de Patrimonio</h1>
            <p className="text-sm text-muted-foreground">{buildings.length} edificios · {totalUnits} unidades · {cities.length} ciudades</p>
          </div>
          <div className="flex gap-2">
            <Select value={colorBy} onValueChange={(v) => setColorBy(v as any)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="occupancy">Color: Ocupación</SelectItem>
                <SelectItem value="yield">Color: Yield</SelectItem>
                <SelectItem value="insurance">Color: Seguro</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="h-4 w-4 mr-1" /> Actualizar</Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase">Edificios</p><p className="text-xl font-bold">{buildings.length}</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase">Unidades</p><p className="text-xl font-bold">{totalUnits}</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase">Ocupación</p><p className={`text-xl font-bold ${avgOccupancy >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{avgOccupancy}%</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase">Renta/mes</p><p className="text-xl font-bold text-green-600">{fmt(totalRent)}</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase">Asegurados</p><p className="text-xl font-bold">{insuredCount}/{buildings.length}</p></CardContent></Card>
        </div>

        {/* Map visualization (SVG-based since Mapbox may not have token) */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Vista geográfica</CardTitle></CardHeader>
          <CardContent>
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ height: 420 }}>
              {/* SVG Map of Spain with building pins */}
              <svg viewBox="35.5 35.5 7 7" width="100%" height="100%" className="absolute inset-0">
                {/* Spain simplified outline */}
                <rect x="35.5" y="35.5" width="7" height="7" fill="transparent" />
                
                {/* City labels */}
                {cities.map(city => {
                  const cityBuildings = buildings.filter(b => b.ciudad === city);
                  if (cityBuildings.length === 0) return null;
                  const avgLat = cityBuildings.reduce((s, b) => s + b.lat, 0) / cityBuildings.length;
                  const avgLng = cityBuildings.reduce((s, b) => s + b.lng, 0) / cityBuildings.length;
                  // Transform to SVG coords (longitude = x, latitude = y inverted)
                  const x = avgLng + 7; // Shift longitude to positive
                  const y = 83.5 - avgLat; // Invert latitude
                  return (
                    <g key={city}>
                      <text x={x} y={y - 0.15} textAnchor="middle" className="text-[0.12px] fill-current font-bold">{city}</text>
                      <text x={x} y={y + 0.05} textAnchor="middle" className="text-[0.08px] fill-muted-foreground">{cityBuildings.length} edificios</text>
                    </g>
                  );
                })}

                {/* Building pins */}
                {buildings.map(b => {
                  const x = b.lng + 7;
                  const y = 83.5 - b.lat;
                  const color = colorBy === 'occupancy' ? getOccupancyColor(b.occupancy)
                    : colorBy === 'yield' ? (b.yieldEstimated > 7 ? '#16a34a' : b.yieldEstimated > 4 ? '#d97706' : '#dc2626')
                    : b.hasInsurance ? '#16a34a' : '#dc2626';
                  const isSelected = selectedBuilding?.id === b.id;
                  return (
                    <g key={b.id} onClick={() => setSelectedBuilding(isSelected ? null : b)} className="cursor-pointer">
                      <circle cx={x} cy={y} r={isSelected ? 0.08 : 0.05} fill={color} stroke="white" strokeWidth={0.015} opacity={0.9} />
                      {isSelected && (
                        <text x={x} y={y - 0.1} textAnchor="middle" className="text-[0.06px] fill-current font-medium">{b.nombre.slice(0, 20)}</text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-gray-900/90 rounded p-2 text-[10px]">
                <p className="font-bold mb-1">{colorBy === 'occupancy' ? 'Ocupación' : colorBy === 'yield' ? 'Yield' : 'Seguro'}</p>
                {colorBy === 'occupancy' ? (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-600" /> ≥90%</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> 70-90%</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> 50-70%</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-600" /> &lt;50%</div>
                  </div>
                ) : colorBy === 'yield' ? (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-600" /> &gt;7%</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> 4-7%</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-600" /> &lt;4%</div>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-600" /> Asegurado</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-600" /> Sin seguro</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected building detail */}
        {selectedBuilding && (
          <Card className="border-blue-500 border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" /> {selectedBuilding.nombre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                <div><p className="text-muted-foreground">Dirección</p><p className="font-medium">{selectedBuilding.direccion}</p></div>
                <div><p className="text-muted-foreground">Sociedad</p><p className="font-medium">{selectedBuilding.company}</p></div>
                <div><p className="text-muted-foreground">Unidades</p><p className="font-bold">{selectedBuilding.occupiedUnits}/{selectedBuilding.totalUnits}</p></div>
                <div><p className="text-muted-foreground">Ocupación</p><p className={`font-bold ${selectedBuilding.occupancy >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{selectedBuilding.occupancy}%</p></div>
                <div><p className="text-muted-foreground">Renta/mes</p><p className="font-bold text-green-600">{fmt(selectedBuilding.monthlyRent)}</p></div>
                <div><p className="text-muted-foreground">Seguro</p>{selectedBuilding.hasInsurance ? <Badge className="bg-green-600 text-white">✓</Badge> : <Badge variant="destructive">Sin seguro</Badge>}</div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => router.push(`/edificios/${selectedBuilding.id}`)}>Ver edificio</Button>
                <Button variant="outline" size="sm" onClick={() => router.push(`/seguros?building=${selectedBuilding.id}`)}>Ver seguro</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buildings by city */}
        {cities.map(city => {
          const cityBuildings = buildings.filter(b => b.ciudad === city);
          return (
            <Card key={city}>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{city} ({cityBuildings.length} edificios)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {cityBuildings.map(b => (
                    <div key={b.id} className="p-3 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelectedBuilding(b)}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{b.nombre}</p>
                          <p className="text-xs text-muted-foreground">{b.company}</p>
                        </div>
                        <div className="flex gap-1">
                          {b.hasInsurance ? <Shield className="h-3 w-3 text-green-600" /> : <AlertTriangle className="h-3 w-3 text-red-500" />}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span>{b.occupiedUnits}/{b.totalUnits} uds</span>
                        <span className={b.occupancy >= 80 ? 'text-green-600' : 'text-amber-600'}>{b.occupancy}%</span>
                        <span className="text-green-600">{fmt(b.monthlyRent)}/mes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AuthenticatedLayout>
  );
}
