'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, Building2, Home, RefreshCw, Calculator, Bell, Euro, Search, Loader2,
} from 'lucide-react';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface Opportunity {
  id: string;
  tipo: string;
  titulo: string;
  ubicacion: string;
  precioEstimado: number;
  yieldBruto: number;
  yieldNeto: number;
  capRate: number;
  roi5anos: number;
  paybackAnos: number;
  riesgo: string;
  argumentacion: string;
  recomendacion: string;
  factoresPositivos: string[];
  factoresRiesgo: string[];
  kpis: { cashFlowMensual: number; cashFlowAnual: number; gastosEstimados: number; hipotecaMensual: number };
}

export default function OportunidadesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<any>(null);
  const [marketIndicators, setMarketIndicators] = useState<any[]>([]);
  const [marketSources, setMarketSources] = useState<any[]>([]);

  // Simulator state
  const [simPrecio, setSimPrecio] = useState('');
  const [simRenta, setSimRenta] = useState('');
  const [simGastos, setSimGastos] = useState('');
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/investment/opportunities');
      if (res.ok) {
        const data = await res.json();
        setPortfolioStats(data.portfolioStats || null);
        setOpportunities(data.opportunities || []);
        setMarketIndicators(data.marketIndicators || []);
        setMarketSources(data.marketSources || []);
      }
    } catch {
      toast.error('Error cargando oportunidades');
    } finally {
      setLoading(false);
    }
  };

  const simulate = () => {
    const precio = parseFloat(simPrecio);
    const renta = parseFloat(simRenta);
    const gastos = parseFloat(simGastos) || 0;
    if (!precio || !renta) { toast.error('Introduce precio y renta'); return; }
    const yieldBruto = (renta * 12 / precio) * 100;
    const yieldNeto = ((renta * 12 - gastos) / precio) * 100;
    const cashFlowAnual = renta * 12 - gastos;
    const payback = cashFlowAnual > 0 ? precio / cashFlowAnual : 0;
    setSimResult({ yieldBruto, yieldNeto, cashFlowAnual, cashFlowMensual: cashFlowAnual / 12, payback });
  };

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const getRiesgoColor = (r: string) => {
    if (r === 'bajo') return 'bg-green-100 text-green-800';
    if (r === 'alto') return 'bg-red-100 text-red-800';
    return 'bg-amber-100 text-amber-800';
  };

  const getRecColor = (r: string) => {
    if (r === 'Comprar') return 'bg-green-600 text-white';
    if (r === 'Esperar') return 'bg-amber-500 text-white';
    return 'bg-blue-600 text-white';
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Oportunidades</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Search className="h-6 w-6" /> Oportunidades de Inversión</h1>
            <p className="text-muted-foreground">Análisis de mercado con IA para detectar las mejores inversiones</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="h-4 w-4 mr-2" /> Actualizar</Button>
        </div>

        {portfolioStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground">Unidades</p><p className="text-2xl font-bold">{portfolioStats.totalUnits}</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground">Ocupación</p><p className="text-2xl font-bold">{portfolioStats.occupancy}%</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground">Renta/mes</p><p className="text-2xl font-bold text-green-600">{fmt(portfolioStats.monthlyRent)}</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground">Yield Medio</p><p className="text-2xl font-bold text-blue-600">{portfolioStats.avgYield}%</p></CardContent></Card>
          </div>
        )}

        {/* Market indicators from public APIs */}
        {marketIndicators.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Indicadores de Mercado (INE + Notariado + Banco España)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {marketIndicators.map((ind: any, i: number) => (
                  <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="font-medium">{ind.ccaa}</p>
                    <p className="text-muted-foreground">{ind.precioMedioM2 ? `${ind.precioMedioM2}€/m²` : ''}</p>
                    <p className={ind.variacionAnual > 10 ? 'text-red-600 font-bold' : ind.variacionAnual > 5 ? 'text-amber-600' : 'text-green-600'}>
                      {ind.variacionAnual > 0 ? '+' : ''}{ind.variacionAnual}% anual
                    </p>
                    <p className="text-muted-foreground capitalize">{ind.tendencia}</p>
                  </div>
                ))}
              </div>
              {marketSources.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Fuentes: {marketSources.map((s: any) => s.name).join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="oportunidades">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="oportunidades">Oportunidades IA</TabsTrigger>
            <TabsTrigger value="mercado">Buscar Mercado</TabsTrigger>
            <TabsTrigger value="simulador">Simulador</TabsTrigger>
            <TabsTrigger value="alertas">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="oportunidades" className="space-y-4">
            {opportunities.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No se generaron oportunidades. Haz clic en Actualizar.</CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {opportunities.map((opp) => (
                  <Card key={opp.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge variant="outline" className="text-xs capitalize">{opp.tipo.replace('_', ' ')}</Badge>
                        <Badge className={getRiesgoColor(opp.riesgo) + ' text-xs'}>{opp.riesgo}</Badge>
                        <Badge className={getRecColor(opp.recomendacion) + ' text-xs'}>{opp.recomendacion}</Badge>
                      </div>
                      <CardTitle className="text-base">{opp.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground">{opp.ubicacion}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Precio:</span> <strong>{fmt(opp.precioEstimado)}</strong></div>
                        <div><span className="text-muted-foreground">Yield:</span> <strong className="text-green-600">{opp.yieldBruto ? opp.yieldBruto.toFixed(1) : '-'}%</strong></div>
                        <div><span className="text-muted-foreground">Cap Rate:</span> <strong>{opp.capRate ? opp.capRate.toFixed(1) : '-'}%</strong></div>
                        <div><span className="text-muted-foreground">ROI 5a:</span> <strong>{opp.roi5anos ? opp.roi5anos.toFixed(0) : '-'}%</strong></div>
                        <div><span className="text-muted-foreground">Payback:</span> <strong>{opp.paybackAnos || '-'} años</strong></div>
                        <div><span className="text-muted-foreground">Cash-flow:</span> <strong>{opp.kpis ? fmt(opp.kpis.cashFlowMensual) + '/mes' : '-'}</strong></div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{opp.argumentacion}</p>
                      {opp.factoresPositivos && opp.factoresPositivos.length > 0 && (
                        <div className="text-xs space-y-1">
                          {opp.factoresPositivos.map((f, i) => <p key={i} className="text-green-700">✓ {f}</p>)}
                          {opp.factoresRiesgo && opp.factoresRiesgo.map((f, i) => <p key={i} className="text-red-600">✗ {f}</p>)}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={async () => {
                          toast.info('Analizando con IA... (puede tardar ~30 segundos)');
                          try {
                            const res = await fetch('/api/ai/investment-analysis', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ property: {
                                city: opp.ubicacion, price: opp.precioEstimado,
                                surface: opp.precioEstimado / (opp.precioEstimado / (opp.superficieM2 || 80)),
                                propertyType: opp.tipo, rooms: 0,
                                estimatedRent: opp.rentaMensualEstimada, estimatedYield: opp.yieldBruto,
                                pricePerM2: opp.precioM2 || 0,
                              }}),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              const a = data.analysis;
                              const msg = [
                                `🎯 ${a.recomendacion?.veredicto} (confianza ${a.recomendacion?.confianza}%)`,
                                `\n📊 ${a.resumenEjecutivo}`,
                                `\n💰 Yield neto: ${a.analisisFinanciero?.yieldNetoEstimado}% | TIR: ${a.analisisFinanciero?.tirEstimada}%`,
                                `\n⚠️ Riesgo: ${a.analisisRiesgo?.nivelGlobal} (${a.analisisRiesgo?.puntuacion}/10)`,
                                `\n💵 Precio máx recomendado: ${a.recomendacion?.precioMaximoRecomendado?.toLocaleString('es-ES')}€`,
                                a.recomendacion?.proximosPasos ? `\n📋 Próximos pasos: ${a.recomendacion.proximosPasos.join(', ')}` : '',
                              ].join('');
                              toast.success(msg, { duration: 15000 });
                            } else { toast.error('Error en análisis IA'); }
                          } catch { toast.error('Error de conexión'); }
                        }}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Análisis IA Profundo
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mercado" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Buscar en Portales Inmobiliarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Ciudad</Label>
                    <Input placeholder="Madrid" id="search-city" defaultValue="Madrid" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Input placeholder="vivienda" id="search-type" defaultValue="vivienda" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Precio máx</Label>
                    <Input placeholder="500000" type="number" id="search-max-price" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={async () => {
                      const city = (document.getElementById('search-city') as HTMLInputElement)?.value || 'Madrid';
                      const propertyType = (document.getElementById('search-type') as HTMLInputElement)?.value || '';
                      const maxPrice = (document.getElementById('search-max-price') as HTMLInputElement)?.value || '';
                      toast.info('Buscando en portales...');
                      try {
                        const params = new URLSearchParams({ city });
                        if (propertyType) params.set('propertyType', propertyType);
                        if (maxPrice) params.set('maxPrice', maxPrice);
                        const res = await fetch('/api/investment/search-listings?' + params.toString());
                        if (res.ok) {
                          const data = await res.json();
                          if (data.listings?.length > 0) {
                            toast.success(data.totalFound + ' resultados de ' + data.sources.join(', '));
                          } else {
                            toast.info('Sin resultados. Configura IDEALISTA_API_KEY o INMOLINK_API_KEY para activar las búsquedas.');
                          }
                        }
                      } catch { toast.error('Error en la búsqueda'); }
                    }}><Search className="h-4 w-4 mr-2" /> Buscar</Button>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Fuentes conectadas:</p>
                  <ul className="mt-1 text-blue-700 dark:text-blue-300 text-xs space-y-1">
                    <li>{'✅'} InmolinkCRM — MLS España (REST API)</li>
                    <li>{process.env.NEXT_PUBLIC_IDEALISTA_CONFIGURED === 'true' ? '✅' : '⏳'} Idealista API — {process.env.NEXT_PUBLIC_IDEALISTA_CONFIGURED === 'true' ? 'Conectado' : 'Pendiente API key (solicitar en developers.idealista.com)'}</li>
                    <li>{'✅'} INE — Índice Precios Vivienda (datos públicos)</li>
                    <li>{'✅'} Notariado — Precios escriturados (datos públicos)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulador" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" /> Simulador de Inversión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Precio compra (€)</Label>
                    <Input type="number" placeholder="350000" value={simPrecio} onChange={e => setSimPrecio(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Renta mensual (€)</Label>
                    <Input type="number" placeholder="1500" value={simRenta} onChange={e => setSimRenta(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gastos anuales (€)</Label>
                    <Input type="number" placeholder="3000" value={simGastos} onChange={e => setSimGastos(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={simulate}><Calculator className="h-4 w-4 mr-2" /> Calcular</Button>
                  <Button variant="outline" onClick={async () => {
                    if (!simPrecio || !simRenta) { toast.error('Introduce precio y renta'); return; }
                    toast.info('Analizando inversión con IA...');
                    try {
                      const res = await fetch('/api/ai/investment-analysis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ property: {
                          city: 'Madrid', price: parseFloat(simPrecio),
                          surface: 80, propertyType: 'vivienda',
                          estimatedRent: parseFloat(simRenta),
                        }}),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        const a = data.analysis;
                        toast.success(
                          `🎯 ${a.recomendacion?.veredicto} (${a.recomendacion?.confianza}%)\n${a.resumenEjecutivo}\nYield neto: ${a.analisisFinanciero?.yieldNetoEstimado}% | Riesgo: ${a.analisisRiesgo?.nivelGlobal}`,
                          { duration: 12000 }
                        );
                      }
                    } catch { toast.error('Error IA'); }
                  }}><TrendingUp className="h-4 w-4 mr-2" /> Análisis IA</Button>
                </div>

                {simResult && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                    <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Yield Bruto</p><p className="text-xl font-bold text-green-600">{simResult.yieldBruto.toFixed(2)}%</p></CardContent></Card>
                    <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Yield Neto</p><p className="text-xl font-bold text-blue-600">{simResult.yieldNeto.toFixed(2)}%</p></CardContent></Card>
                    <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Cash-flow/mes</p><p className="text-xl font-bold">{fmt(simResult.cashFlowMensual)}</p></CardContent></Card>
                    <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Cash-flow/año</p><p className="text-xl font-bold">{fmt(simResult.cashFlowAnual)}</p></CardContent></Card>
                    <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Payback</p><p className="text-xl font-bold">{simResult.payback.toFixed(1)} años</p></CardContent></Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alertas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Alertas de Inversión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Configura alertas para recibir notificaciones cuando se detecten oportunidades que cumplan tus criterios.</p>
                {[
                  { desc: 'Edificio Madrid centro < €3.000/m²', active: true },
                  { desc: 'Local comercial yield > 8%', active: false },
                  { desc: 'Vivienda Marbella < €500.000', active: true },
                ].map((alert, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{alert.desc}</span>
                    <Badge variant={alert.active ? 'default' : 'secondary'}>{alert.active ? 'Activa' : 'Inactiva'}</Badge>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic">Las alertas se activarán próximamente con integración de APIs de portales inmobiliarios.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
