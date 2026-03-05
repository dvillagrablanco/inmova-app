'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp, Building2, Home, RefreshCw, Calculator, Bell, Euro, Search, Loader2,
  Star, StarOff, Download, ArrowUpDown, LayoutGrid, LayoutList, Filter, X,
  Clock, MapPin, BarChart3, FileDown, CheckSquare, Timer,
} from 'lucide-react';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

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
  superficieM2?: number;
  rentaMensualEstimada?: number;
  precioM2?: number;
  kpis: {
    cashFlowMensual: number;
    cashFlowAnual: number;
    gastosEstimados: number;
    hipotecaMensual: number;
  };
}

interface MarketOpp {
  id: string;
  source: string;
  sourceIcon: string;
  category: string;
  title: string;
  location: string;
  propertyType: string;
  price: number;
  marketValue: number;
  discount: number;
  surface?: number;
  estimatedYield?: number;
  riskLevel: string;
  description: string;
  url?: string;
  deadline?: string;
  tags: string[];
}

type SortField = 'discount' | 'yield' | 'price' | 'risk';
type ViewMode = 'cards' | 'table';

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function OportunidadesPage() {
  const { status } = useSession();
  const router = useRouter();

  // Data state
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [marketOpps, setMarketOpps] = useState<any>(null);
  const [portfolioStats, setPortfolioStats] = useState<any>(null);
  const [marketIndicators, setMarketIndicators] = useState<any[]>([]);
  const [marketSources, setMarketSources] = useState<any[]>([]);

  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [filterMinYield, setFilterMinYield] = useState<string>('');
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('discount');
  const [sortAsc, setSortAsc] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Compare state
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  // Simulator state
  const [simPrecio, setSimPrecio] = useState('');
  const [simRenta, setSimRenta] = useState('');
  const [simGastos, setSimGastos] = useState('');
  const [simResult, setSimResult] = useState<any>(null);

  // Alert config state
  const [alerts, setAlerts] = useState([
    { id: '1', desc: 'Edificio Madrid centro < €3.000/m²', active: true, province: 'Madrid', minYield: 6, maxPrice: 500000 },
    { id: '2', desc: 'Local comercial yield > 8%', active: false, province: '', minYield: 8, maxPrice: 0 },
    { id: '3', desc: 'Vivienda Marbella < €500.000', active: true, province: 'Málaga', minYield: 0, maxPrice: 500000 },
  ]);
  const [newAlertDesc, setNewAlertDesc] = useState('');

  // IA analysis loading
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('inmova-opp-favorites');
      if (stored) setFavorites(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  const saveFavorites = useCallback((newFavs: Set<string>) => {
    setFavorites(newFavs);
    localStorage.setItem('inmova-opp-favorites', JSON.stringify([...newFavs]));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/investment/opportunities');
      if (res.ok) {
        const data = await res.json();
        setPortfolioStats(data.portfolioStats || null);
        setOpportunities(data.opportunities || []);
        setMarketOpps(data.marketOpportunities || null);
        setMarketIndicators(data.marketIndicators || []);
        setMarketSources(data.marketSources || []);
      }
    } catch {
      toast.error('Error cargando oportunidades');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FORMAT HELPERS
  // ============================================================================

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const getRiesgoColor = (r: string) => {
    if (r === 'bajo') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (r === 'alto') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  };

  const getRecColor = (r: string) => {
    if (r === 'Comprar') return 'bg-green-600 text-white';
    if (r === 'Esperar') return 'bg-amber-500 text-white';
    return 'bg-blue-600 text-white';
  };

  // ============================================================================
  // FILTERED & SORTED MARKET OPPORTUNITIES
  // ============================================================================

  const allMarketItems: MarketOpp[] = useMemo(() => {
    if (!marketOpps) return [];
    return [
      ...(marketOpps.auctions || []),
      ...(marketOpps.bankProperties || []),
      ...(marketOpps.divergences || []),
      ...(marketOpps.trends || []),
      ...(marketOpps.crowdfunding || []),
    ];
  }, [marketOpps]);

  const provinces = useMemo(() => {
    const set = new Set<string>();
    allMarketItems.forEach(m => { if (m.location) set.add(m.location); });
    return [...set].sort();
  }, [allMarketItems]);

  const filteredMarket = useMemo(() => {
    let items = [...allMarketItems];

    if (filterCategory !== 'all') items = items.filter(m => m.category === filterCategory);
    if (filterProvince !== 'all') items = items.filter(m => m.location === filterProvince);
    if (filterMinYield) items = items.filter(m => (m.estimatedYield || 0) >= parseFloat(filterMinYield));
    if (filterMaxPrice) items = items.filter(m => m.price > 0 && m.price <= parseFloat(filterMaxPrice));
    if (filterRisk !== 'all') items = items.filter(m => m.riskLevel === filterRisk);
    if (showOnlyFavorites) items = items.filter(m => favorites.has(m.id));

    // Sort
    items.sort((a, b) => {
      let va = 0, vb = 0;
      if (sortField === 'discount') { va = a.discount; vb = b.discount; }
      else if (sortField === 'yield') { va = a.estimatedYield || 0; vb = b.estimatedYield || 0; }
      else if (sortField === 'price') { va = a.price; vb = b.price; }
      else if (sortField === 'risk') { va = a.riskLevel === 'bajo' ? 1 : a.riskLevel === 'medio' ? 2 : 3; vb = b.riskLevel === 'bajo' ? 1 : b.riskLevel === 'medio' ? 2 : 3; }
      return sortAsc ? va - vb : vb - va;
    });

    return items;
  }, [allMarketItems, filterCategory, filterProvince, filterMinYield, filterMaxPrice, filterRisk, showOnlyFavorites, favorites, sortField, sortAsc]);

  // KPI summary
  const marketKPIs = useMemo(() => {
    if (filteredMarket.length === 0) return null;
    const withDiscount = filteredMarket.filter(m => m.discount > 0);
    const withYield = filteredMarket.filter(m => (m.estimatedYield || 0) > 0);
    const avgDiscount = withDiscount.length > 0 ? withDiscount.reduce((s, m) => s + m.discount, 0) / withDiscount.length : 0;
    const bestYield = withYield.reduce((max, m) => Math.max(max, m.estimatedYield || 0), 0);
    const minPrice = filteredMarket.filter(m => m.price > 0).reduce((min, m) => Math.min(min, m.price), Infinity);
    return { total: filteredMarket.length, avgDiscount, bestYield, minPrice: minPrice === Infinity ? 0 : minPrice };
  }, [filteredMarket]);

  // ============================================================================
  // SIMULATE
  // ============================================================================

  const simulate = () => {
    const precio = parseFloat(simPrecio);
    const renta = parseFloat(simRenta);
    const gastos = parseFloat(simGastos) || 0;
    if (!precio || !renta) { toast.error('Introduce precio y renta'); return; }
    const yieldBruto = ((renta * 12) / precio) * 100;
    const yieldNeto = (((renta * 12) - gastos) / precio) * 100;
    const cashFlowAnual = renta * 12 - gastos;
    const payback = cashFlowAnual > 0 ? precio / cashFlowAnual : 0;
    setSimResult({ yieldBruto, yieldNeto, cashFlowAnual, cashFlowMensual: cashFlowAnual / 12, payback });
  };

  // Inline simulator for a market opp
  const simulateForOpp = (opp: MarketOpp) => {
    const estimatedMonthlyRent = opp.price > 0 && opp.estimatedYield
      ? (opp.price * (opp.estimatedYield / 100)) / 12
      : 0;
    const gastos = opp.price * 0.015; // 1.5% annual expenses estimate
    const cashFlowAnual = estimatedMonthlyRent * 12 - gastos;
    const payback = cashFlowAnual > 0 ? opp.price / cashFlowAnual : 0;
    return {
      rentaMensual: Math.round(estimatedMonthlyRent),
      cashFlowMensual: Math.round(cashFlowAnual / 12),
      cashFlowAnual: Math.round(cashFlowAnual),
      payback: payback.toFixed(1),
      roi5: ((cashFlowAnual * 5 + (opp.marketValue - opp.price)) / opp.price * 100).toFixed(0),
    };
  };

  // ============================================================================
  // EXPORT
  // ============================================================================

  const exportCSV = () => {
    const headers = ['Título', 'Fuente', 'Ubicación', 'Precio', 'Valor Mercado', 'Descuento %', 'Yield %', 'Superficie m²', 'Riesgo', 'Categoría'];
    const rows = filteredMarket.map(m => [
      m.title, m.source, m.location, m.price, m.marketValue, m.discount,
      m.estimatedYield || '', m.surface || '', m.riskLevel, m.category,
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `oportunidades-inmova-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  const exportPDF = () => {
    // Generate HTML report
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Informe Oportunidades - Inmova</title>
    <style>body{font-family:Arial,sans-serif;margin:40px;color:#333}h1{color:#1e40af;border-bottom:3px solid #1e40af;padding-bottom:10px}
    .kpi{display:inline-block;background:#f0f9ff;padding:12px 20px;border-radius:8px;margin:5px;text-align:center}
    .kpi .val{font-size:24px;font-weight:bold;color:#1e40af}.kpi .lbl{font-size:11px;color:#666}
    table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e40af;color:white;padding:8px;text-align:left;font-size:12px}
    td{padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px}.discount{color:#16a34a;font-weight:bold}
    .risk-bajo{color:#16a34a}.risk-medio{color:#d97706}.risk-alto{color:#dc2626}
    .footer{margin-top:30px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:10px;color:#999}</style></head>
    <body><h1>📊 Informe de Oportunidades de Inversión</h1>
    <p style="color:#666">Generado por Inmova App — ${new Date().toLocaleDateString('es-ES', { dateStyle: 'full' })}</p>
    ${marketKPIs ? `<div style="margin:20px 0">
      <div class="kpi"><div class="val">${marketKPIs.total}</div><div class="lbl">Oportunidades</div></div>
      <div class="kpi"><div class="val">${marketKPIs.avgDiscount.toFixed(0)}%</div><div class="lbl">Descuento medio</div></div>
      <div class="kpi"><div class="val">${marketKPIs.bestYield.toFixed(1)}%</div><div class="lbl">Mejor yield</div></div>
      <div class="kpi"><div class="val">${fmt(marketKPIs.minPrice)}</div><div class="lbl">Inversión mín.</div></div>
    </div>` : ''}
    <table><thead><tr><th>Oportunidad</th><th>Fuente</th><th>Ubicación</th><th>Precio</th><th>Dto.</th><th>Yield</th><th>Riesgo</th></tr></thead><tbody>
    ${filteredMarket.map(m => `<tr><td>${m.title}</td><td>${m.source}</td><td>${m.location}</td><td>${fmt(m.price)}</td>
    <td class="discount">${m.discount > 0 ? '-' + m.discount + '%' : '-'}</td><td>${m.estimatedYield ? m.estimatedYield + '%' : '-'}</td>
    <td class="risk-${m.riskLevel}">${m.riskLevel}</td></tr>`).join('')}
    </tbody></table>
    <div class="footer">© Inmova App ${new Date().getFullYear()} — Este informe es orientativo y no constituye asesoramiento financiero.</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
    toast.success('PDF generado — usa Ctrl+P para guardar');
  };

  // ============================================================================
  // AI DEEP ANALYSIS FOR MARKET OPP
  // ============================================================================

  const analyzeMarketOpp = async (opp: MarketOpp) => {
    setAnalyzingId(opp.id);
    toast.info('Analizando con IA... (~30s)');
    try {
      const res = await fetch('/api/ai/investment-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: {
            city: opp.location,
            price: opp.price,
            surface: opp.surface || 80,
            propertyType: opp.propertyType || 'vivienda',
            rooms: 0,
            estimatedRent: opp.price > 0 && opp.estimatedYield ? (opp.price * (opp.estimatedYield / 100)) / 12 : 0,
            estimatedYield: opp.estimatedYield || 0,
            pricePerM2: opp.surface ? Math.round(opp.price / opp.surface) : 0,
            source: opp.source,
            category: opp.category,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const a = data.analysis;
        const msg = [
          `🎯 ${a.recomendacion?.veredicto} (confianza ${a.recomendacion?.confianza}%)`,
          `\n📊 ${a.resumenEjecutivo}`,
          a.analisisFinanciero ? `\n💰 Yield neto: ${a.analisisFinanciero.yieldNetoEstimado}% | TIR: ${a.analisisFinanciero.tirEstimada}%` : '',
          a.analisisRiesgo ? `\n⚠️ Riesgo: ${a.analisisRiesgo.nivelGlobal} (${a.analisisRiesgo.puntuacion}/10)` : '',
          a.recomendacion?.precioMaximoRecomendado ? `\n💵 Precio máx: ${a.recomendacion.precioMaximoRecomendado.toLocaleString('es-ES')}€` : '',
        ].filter(Boolean).join('');
        toast.success(msg, { duration: 15000 });
      } else {
        toast.error('Error en análisis IA');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setAnalyzingId(null);
    }
  };

  // ============================================================================
  // COMPARE
  // ============================================================================

  const compareItems = useMemo(() => {
    return allMarketItems.filter(m => compareIds.has(m.id));
  }, [allMarketItems, compareIds]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}</div>
          <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Oportunidades</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Search className="h-6 w-6" /> Oportunidades de Inversión</h1>
            <p className="text-muted-foreground text-sm">Análisis de mercado con IA • {allMarketItems.length + opportunities.length} oportunidades detectadas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="h-4 w-4 mr-1" /> Actualizar</Button>
            <Button variant="outline" size="sm" onClick={exportCSV}><FileDown className="h-4 w-4 mr-1" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><Download className="h-4 w-4 mr-1" /> PDF</Button>
          </div>
        </div>

        {/* ===== KPIs DASHBOARD ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {portfolioStats && (<>
            <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Unidades</p><p className="text-xl font-bold">{portfolioStats.totalUnits}</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ocupación</p><p className="text-xl font-bold">{portfolioStats.occupancy}%</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Renta/mes</p><p className="text-xl font-bold text-green-600">{fmt(portfolioStats.monthlyRent)}</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Yield medio</p><p className="text-xl font-bold text-blue-600">{portfolioStats.avgYield}%</p></CardContent></Card>
          </>)}
          {marketKPIs && (<>
            <Card className="bg-blue-50 dark:bg-blue-950"><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Oportunidades</p><p className="text-xl font-bold text-blue-700 dark:text-blue-300">{marketKPIs.total}</p></CardContent></Card>
            <Card className="bg-green-50 dark:bg-green-950"><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Dto. medio</p><p className="text-xl font-bold text-green-700 dark:text-green-300">{marketKPIs.avgDiscount.toFixed(0)}%</p></CardContent></Card>
            <Card className="bg-emerald-50 dark:bg-emerald-950"><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Mejor yield</p><p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{marketKPIs.bestYield.toFixed(1)}%</p></CardContent></Card>
            <Card className="bg-purple-50 dark:bg-purple-950"><CardContent className="pt-4 pb-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Inv. mínima</p><p className="text-xl font-bold text-purple-700 dark:text-purple-300">{fmt(marketKPIs.minPrice)}</p></CardContent></Card>
          </>)}
        </div>

        {/* Market indicators */}
        {marketIndicators.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Indicadores de Mercado (INE + Notariado + BdE)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {marketIndicators.map((ind: any, i: number) => (
                  <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="font-medium">{ind.ccaa}</p>
                    <p className="text-muted-foreground">{ind.precioMedioM2 ? `${ind.precioMedioM2}€/m²` : ''}</p>
                    <p className={ind.variacionAnual > 10 ? 'text-red-600 font-bold' : ind.variacionAnual > 5 ? 'text-amber-600' : 'text-green-600'}>
                      {ind.variacionAnual > 0 ? '+' : ''}{ind.variacionAnual}% anual
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== TABS ===== */}
        <Tabs defaultValue="mercado">
          <TabsList className="w-full sm:w-auto flex-wrap">
            <TabsTrigger value="mercado">🏪 Mercado ({filteredMarket.length})</TabsTrigger>
            <TabsTrigger value="ia">🤖 IA ({opportunities.length})</TabsTrigger>
            <TabsTrigger value="propuestas">📄 Propuestas</TabsTrigger>
            <TabsTrigger value="buscar">🔍 Buscar</TabsTrigger>
            <TabsTrigger value="simulador">🧮 Simulador</TabsTrigger>
            <TabsTrigger value="alertas">🔔 Alertas</TabsTrigger>
            {showCompare && <TabsTrigger value="comparar">⚖️ Comparar ({compareIds.size})</TabsTrigger>}
          </TabsList>

          {/* ===== TAB: MERCADO ===== */}
          <TabsContent value="mercado" className="space-y-4">
            {/* Toolbar: Filters + Sort + View */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2 items-center flex-wrap">
                <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-3 w-3 mr-1" /> Filtros
                </Button>
                <Button variant={showOnlyFavorites ? 'default' : 'outline'} size="sm" onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}>
                  <Star className="h-3 w-3 mr-1" /> Favoritos ({favorites.size})
                </Button>
                {compareIds.size > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowCompare(true)}>
                    <CheckSquare className="h-3 w-3 mr-1" /> Comparar ({compareIds.size})
                  </Button>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Descuento</SelectItem>
                    <SelectItem value="yield">Yield</SelectItem>
                    <SelectItem value="price">Precio</SelectItem>
                    <SelectItem value="risk">Riesgo</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => setSortAsc(!sortAsc)}>
                  <ArrowUpDown className="h-3 w-3" /> {sortAsc ? '↑' : '↓'}
                </Button>
                <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('cards')}><LayoutGrid className="h-3 w-3" /></Button>
                <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')}><LayoutList className="h-3 w-3" /></Button>
              </div>
            </div>

            {/* Filter bar */}
            {showFilters && (
              <Card className="border-dashed">
                <CardContent className="pt-4 pb-3">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <Label className="text-xs">Categoría</Label>
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="subasta">⚖️ Subastas</SelectItem>
                          <SelectItem value="banca">🏦 Banca</SelectItem>
                          <SelectItem value="divergencia">🔍 Divergencia</SelectItem>
                          <SelectItem value="tendencia">📈 Tendencia</SelectItem>
                          <SelectItem value="crowdfunding">🏗️ Crowdfunding</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Provincia</Label>
                      <Select value={filterProvince} onValueChange={setFilterProvince}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Yield mín (%)</Label>
                      <Input type="number" className="h-8 text-xs" placeholder="5" value={filterMinYield} onChange={e => setFilterMinYield(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Precio máx (€)</Label>
                      <Input type="number" className="h-8 text-xs" placeholder="500000" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Riesgo</Label>
                      <Select value={filterRisk} onValueChange={setFilterRisk}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="bajo">🟢 Bajo</SelectItem>
                          <SelectItem value="medio">🟡 Medio</SelectItem>
                          <SelectItem value="alto">🔴 Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => { setFilterCategory('all'); setFilterProvince('all'); setFilterMinYield(''); setFilterMaxPrice(''); setFilterRisk('all'); }}>
                    <X className="h-3 w-3 mr-1" /> Limpiar filtros
                  </Button>
                </CardContent>
              </Card>
            )}

            {filteredMarket.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No hay oportunidades con los filtros actuales</CardContent></Card>
            ) : viewMode === 'table' ? (
              /* ===== TABLE VIEW ===== */
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left w-8">⭐</th>
                          <th className="p-2 text-left w-8">☑</th>
                          <th className="p-2 text-left">Oportunidad</th>
                          <th className="p-2 text-left">Fuente</th>
                          <th className="p-2 text-left">Ubicación</th>
                          <th className="p-2 text-right">Precio</th>
                          <th className="p-2 text-right">Dto.</th>
                          <th className="p-2 text-right">Yield</th>
                          <th className="p-2 text-center">Riesgo</th>
                          <th className="p-2 text-right">Cash-flow/mes</th>
                          <th className="p-2 text-center">IA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMarket.map(mo => {
                          const sim = simulateForOpp(mo);
                          return (
                            <tr key={mo.id} className="border-b hover:bg-muted/30">
                              <td className="p-2">
                                <button onClick={() => { const n = new Set(favorites); if (n.has(mo.id)) n.delete(mo.id); else n.add(mo.id); saveFavorites(n); }}>
                                  {favorites.has(mo.id) ? <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-3 w-3 text-gray-300" />}
                                </button>
                              </td>
                              <td className="p-2">
                                <input type="checkbox" checked={compareIds.has(mo.id)} onChange={() => { const n = new Set(compareIds); if (n.has(mo.id)) n.delete(mo.id); else { if (n.size >= 3) { toast.error('Máx 3 para comparar'); return; } n.add(mo.id); } setCompareIds(n); }} />
                              </td>
                              <td className="p-2 font-medium max-w-[200px] truncate" title={mo.title}>{mo.title}</td>
                              <td className="p-2 text-muted-foreground">{mo.sourceIcon} {mo.source.split(' ')[0]}</td>
                              <td className="p-2"><MapPin className="h-3 w-3 inline mr-0.5" />{mo.location}</td>
                              <td className="p-2 text-right font-medium">{mo.price > 0 ? fmt(mo.price) : '-'}</td>
                              <td className="p-2 text-right">{mo.discount > 0 ? <span className="text-green-600 font-bold">-{mo.discount}%</span> : '-'}</td>
                              <td className="p-2 text-right">{mo.estimatedYield ? <span className="text-emerald-600">{mo.estimatedYield}%</span> : '-'}</td>
                              <td className="p-2 text-center"><Badge variant="outline" className={`text-[10px] ${getRiesgoColor(mo.riskLevel)}`}>{mo.riskLevel}</Badge></td>
                              <td className="p-2 text-right">{sim.cashFlowMensual > 0 ? <span className="text-blue-600">{fmt(sim.cashFlowMensual)}</span> : '-'}</td>
                              <td className="p-2 text-center">
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" disabled={analyzingId === mo.id} onClick={() => analyzeMarketOpp(mo)}>
                                  {analyzingId === mo.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* ===== CARDS VIEW ===== */
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredMarket.map(mo => {
                  const sim = simulateForOpp(mo);
                  const isFav = favorites.has(mo.id);
                  const isCompared = compareIds.has(mo.id);
                  return (
                    <Card key={mo.id} className={`hover:shadow-md transition-shadow ${isCompared ? 'ring-2 ring-blue-500' : ''}`}>
                      <CardContent className="pt-4 pb-3 space-y-2">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex gap-1 mb-1">
                              <Badge variant="outline" className="text-[10px]">{mo.sourceIcon} {mo.category}</Badge>
                              {mo.discount > 0 && <Badge className="bg-green-600 text-white text-[10px]">-{mo.discount}%</Badge>}
                              <Badge variant="outline" className={`text-[10px] ${getRiesgoColor(mo.riskLevel)}`}>{mo.riskLevel}</Badge>
                            </div>
                            <p className="text-sm font-semibold leading-tight">{mo.title}</p>
                            <p className="text-xs text-muted-foreground"><MapPin className="h-3 w-3 inline" /> {mo.location} · {mo.source}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button onClick={() => { const n = new Set(favorites); if (n.has(mo.id)) n.delete(mo.id); else n.add(mo.id); saveFavorites(n); }}>
                              {isFav ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-4 w-4 text-gray-300 hover:text-yellow-400" />}
                            </button>
                            <input type="checkbox" checked={isCompared} title="Comparar" onChange={() => {
                              const n = new Set(compareIds);
                              if (n.has(mo.id)) n.delete(mo.id);
                              else { if (n.size >= 3) { toast.error('Máx 3'); return; } n.add(mo.id); }
                              setCompareIds(n);
                            }} />
                          </div>
                        </div>

                        {/* Financial KPIs */}
                        <div className="grid grid-cols-3 gap-1 text-[11px]">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded p-1.5 text-center">
                            <p className="text-muted-foreground">Precio</p>
                            <p className="font-bold">{mo.price > 0 ? fmt(mo.price) : '-'}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded p-1.5 text-center">
                            <p className="text-muted-foreground">Yield</p>
                            <p className="font-bold text-green-600">{mo.estimatedYield ? mo.estimatedYield + '%' : '-'}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded p-1.5 text-center">
                            <p className="text-muted-foreground">CF/mes</p>
                            <p className="font-bold text-blue-600">{sim.cashFlowMensual > 0 ? fmt(sim.cashFlowMensual) : '-'}</p>
                          </div>
                        </div>

                        {/* Simulator mini */}
                        {mo.price > 0 && (
                          <div className="flex gap-2 text-[10px] text-muted-foreground">
                            <span>Payback: <strong>{sim.payback}a</strong></span>
                            <span>ROI 5a: <strong>{sim.roi5}%</strong></span>
                            {mo.surface ? <span>{mo.surface}m² · {fmt(Math.round(mo.price / mo.surface))}/m²</span> : null}
                          </div>
                        )}

                        {/* Deadline / countdown for auctions */}
                        {mo.category === 'subasta' && mo.deadline && (
                          <div className="flex items-center gap-1 text-[10px] text-orange-600">
                            <Timer className="h-3 w-3" /> {mo.deadline}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground line-clamp-2">{mo.description}</p>

                        {/* Actions */}
                        <div className="flex gap-1.5 pt-1">
                          <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px]" disabled={analyzingId === mo.id} onClick={() => analyzeMarketOpp(mo)}>
                            {analyzingId === mo.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                            Análisis IA
                          </Button>
                          {mo.url && (
                            <Button variant="ghost" size="sm" className="h-7 text-[11px]" asChild>
                              <a href={mo.url} target="_blank" rel="noopener noreferrer">Fuente →</a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== TAB: COMPARAR ===== */}
          {showCompare && (
            <TabsContent value="comparar" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">⚖️ Comparación lado a lado</CardTitle></CardHeader>
                <CardContent>
                  {compareItems.length < 2 ? (
                    <p className="text-sm text-muted-foreground">Selecciona al menos 2 oportunidades para comparar (máx 3).</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b"><th className="p-2 text-left w-32">Métrica</th>
                            {compareItems.map(c => <th key={c.id} className="p-2 text-center min-w-[200px]">{c.title.slice(0, 40)}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: 'Fuente', fn: (c: MarketOpp) => `${c.sourceIcon} ${c.source}` },
                            { label: 'Ubicación', fn: (c: MarketOpp) => c.location },
                            { label: 'Precio', fn: (c: MarketOpp) => c.price > 0 ? fmt(c.price) : '-' },
                            { label: 'Valor mercado', fn: (c: MarketOpp) => c.marketValue > 0 ? fmt(c.marketValue) : '-' },
                            { label: 'Descuento', fn: (c: MarketOpp) => c.discount > 0 ? `-${c.discount}%` : '-' },
                            { label: 'Yield', fn: (c: MarketOpp) => c.estimatedYield ? `${c.estimatedYield}%` : '-' },
                            { label: 'Superficie', fn: (c: MarketOpp) => c.surface ? `${c.surface}m²` : '-' },
                            { label: 'Riesgo', fn: (c: MarketOpp) => c.riskLevel },
                            { label: 'Cash-flow/mes', fn: (c: MarketOpp) => { const s = simulateForOpp(c); return s.cashFlowMensual > 0 ? fmt(s.cashFlowMensual) : '-'; }},
                            { label: 'Payback', fn: (c: MarketOpp) => { const s = simulateForOpp(c); return `${s.payback} años`; }},
                            { label: 'ROI 5 años', fn: (c: MarketOpp) => { const s = simulateForOpp(c); return `${s.roi5}%`; }},
                          ].map(row => (
                            <tr key={row.label} className="border-b">
                              <td className="p-2 font-medium text-muted-foreground">{row.label}</td>
                              {compareItems.map(c => <td key={c.id} className="p-2 text-center">{row.fn(c)}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => { setCompareIds(new Set()); setShowCompare(false); }}>
                    <X className="h-3 w-3 mr-1" /> Limpiar comparación
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ===== TAB: IA (existing AI opps) ===== */}
          <TabsContent value="ia" className="space-y-4">
            {opportunities.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No se generaron oportunidades IA. Haz clic en Actualizar.</CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {opportunities.map(opp => (
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
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-center">
                          <p className="text-muted-foreground">Precio</p><p className="font-bold">{fmt(opp.precioEstimado)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-center">
                          <p className="text-muted-foreground">Yield</p><p className="font-bold text-green-600">{opp.yieldBruto ? opp.yieldBruto.toFixed(1) + '%' : '-'}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-center">
                          <p className="text-muted-foreground">CF/mes</p><p className="font-bold text-blue-600">{opp.kpis ? fmt(opp.kpis.cashFlowMensual) : '-'}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>Cap Rate: <strong>{opp.capRate ? opp.capRate.toFixed(1) + '%' : '-'}</strong></span>
                        <span>ROI 5a: <strong>{opp.roi5anos ? opp.roi5anos.toFixed(0) + '%' : '-'}</strong></span>
                        <span>Payback: <strong>{opp.paybackAnos || '-'} años</strong></span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{opp.argumentacion}</p>
                      {opp.factoresPositivos?.length > 0 && (
                        <div className="text-[11px] space-y-0.5">
                          {opp.factoresPositivos.map((f, i) => <p key={i} className="text-green-700">✓ {f}</p>)}
                          {opp.factoresRiesgo?.map((f, i) => <p key={i} className="text-red-600">✗ {f}</p>)}
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="w-full" onClick={async () => {
                        toast.info('Analizando con IA... (~30s)');
                        try {
                          const res = await fetch('/api/ai/investment-analysis', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ property: { city: opp.ubicacion, price: opp.precioEstimado, surface: opp.superficieM2 || 80, propertyType: opp.tipo, rooms: 0, estimatedRent: opp.rentaMensualEstimada, estimatedYield: opp.yieldBruto, pricePerM2: opp.precioM2 || 0 } }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            const a = data.analysis;
                            toast.success(`🎯 ${a.recomendacion?.veredicto} (${a.recomendacion?.confianza}%)\n${a.resumenEjecutivo}\nYield: ${a.analisisFinanciero?.yieldNetoEstimado}% | Riesgo: ${a.analisisRiesgo?.nivelGlobal}`, { duration: 15000 });
                          }
                        } catch { toast.error('Error IA'); }
                      }}>
                        <TrendingUp className="h-4 w-4 mr-2" /> Análisis IA Profundo
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== TAB: PROPUESTAS BROKER ===== */}
          <TabsContent value="propuestas" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Analizar Propuesta de Broker</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Sube PDF, Excel o imagen. La IA extraerá datos, identificará qué falta, y dará un veredicto.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Broker/Inmobiliaria</Label><Input placeholder="Engel & Völkers, Lucas Fox..." id="broker-name" /></div>
                  <div className="space-y-2"><Label>Documento</Label><input type="file" accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp" id="proposal-file" className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer w-full" /></div>
                </div>
                <div className="space-y-2"><Label>O describe en texto</Label><textarea id="proposal-text" className="w-full min-h-[80px] p-3 border rounded-lg text-sm resize-y" placeholder="Pega email del broker, datos financieros..." /></div>
                <Button className="w-full" onClick={async () => {
                  const fileEl = document.getElementById('proposal-file') as HTMLInputElement;
                  const textEl = document.getElementById('proposal-text') as HTMLTextAreaElement;
                  const brokerEl = document.getElementById('broker-name') as HTMLInputElement;
                  const file = fileEl?.files?.[0]; const text = textEl?.value;
                  if (!file && !text) { toast.error('Sube archivo o escribe propuesta'); return; }
                  toast.info('Analizando (~45s)...');
                  try {
                    const fd = new FormData();
                    if (file) fd.append('file', file);
                    if (text) fd.append('text', text);
                    fd.append('broker', brokerEl?.value || '');
                    const res = await fetch('/api/ai/analyze-proposal', { method: 'POST', body: fd });
                    if (res.ok) {
                      const data = await res.json(); const a = data.analysis; const v = a.veredicto;
                      const parts = [`🎯 ${v?.decision} (${v?.confianza}%)`, v?.resumen, '', `💰 Yield: ${a.analisisFinanciero?.yieldNetoEstimado || '?'}%`, `⚠️ Riesgo: ${a.analisisRiesgo?.nivel}`, a.datosQueFaltan?.length ? `\n❓ Faltan ${a.datosQueFaltan.length} datos` : '', a.alertasRojas?.length ? `\n🚨 ${a.alertasRojas.length} alertas rojas` : ''];
                      toast.success(parts.filter(Boolean).join('\n'), { duration: 20000 });
                    } else { const err = await res.json(); toast.error(err.error || 'Error'); }
                  } catch { toast.error('Error conexión'); }
                }}>
                  <TrendingUp className="h-4 w-4 mr-2" /> Analizar con IA
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: BUSCAR MERCADO ===== */}
          <TabsContent value="buscar" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Buscar en Portales Inmobiliarios</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Ciudad</Label><Input placeholder="Madrid" id="search-city" defaultValue="Madrid" /></div>
                  <div className="space-y-1"><Label className="text-xs">Tipo</Label><Input placeholder="vivienda" id="search-type" defaultValue="vivienda" /></div>
                  <div className="space-y-1"><Label className="text-xs">Precio máx</Label><Input placeholder="500000" type="number" id="search-max-price" /></div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={async () => {
                      const city = (document.getElementById('search-city') as HTMLInputElement)?.value || 'Madrid';
                      const propertyType = (document.getElementById('search-type') as HTMLInputElement)?.value || '';
                      const maxPrice = (document.getElementById('search-max-price') as HTMLInputElement)?.value || '';
                      toast.info('Buscando...');
                      try {
                        const params = new URLSearchParams({ city });
                        if (propertyType) params.set('propertyType', propertyType);
                        if (maxPrice) params.set('maxPrice', maxPrice);
                        const res = await fetch('/api/investment/search-listings?' + params.toString());
                        if (res.ok) { const data = await res.json(); toast.success(data.totalFound + ' resultados de ' + data.sources.join(', ')); }
                      } catch { toast.error('Error'); }
                    }}><Search className="h-4 w-4 mr-2" /> Buscar</Button>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-xs">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Fuentes:</p>
                  <ul className="mt-1 space-y-0.5 text-blue-700 dark:text-blue-300">
                    <li>✅ InmolinkCRM — MLS España</li>
                    <li>⏳ Idealista API — Pendiente API key</li>
                    <li>✅ INE — Índice Precios Vivienda</li>
                    <li>✅ Notariado — Precios escriturados</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: SIMULADOR ===== */}
          <TabsContent value="simulador" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" /> Simulador de Inversión</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Precio compra (€)</Label><Input type="number" placeholder="350000" value={simPrecio} onChange={e => setSimPrecio(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Renta mensual (€)</Label><Input type="number" placeholder="1500" value={simRenta} onChange={e => setSimRenta(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Gastos anuales (€)</Label><Input type="number" placeholder="3000" value={simGastos} onChange={e => setSimGastos(e.target.value)} /></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={simulate}><Calculator className="h-4 w-4 mr-2" /> Calcular</Button>
                  <Button variant="outline" onClick={async () => {
                    if (!simPrecio || !simRenta) { toast.error('Introduce precio y renta'); return; }
                    toast.info('Analizando con IA...');
                    try {
                      const res = await fetch('/api/ai/investment-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ property: { city: 'Madrid', price: parseFloat(simPrecio), surface: 80, propertyType: 'vivienda', estimatedRent: parseFloat(simRenta) } }) });
                      if (res.ok) { const data = await res.json(); const a = data.analysis; toast.success(`🎯 ${a.recomendacion?.veredicto}\n${a.resumenEjecutivo}`, { duration: 12000 }); }
                    } catch { toast.error('Error IA'); }
                  }}><TrendingUp className="h-4 w-4 mr-2" /> Análisis IA</Button>
                </div>
                {simResult && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                    {[
                      { label: 'Yield Bruto', value: simResult.yieldBruto.toFixed(2) + '%', color: 'text-green-600' },
                      { label: 'Yield Neto', value: simResult.yieldNeto.toFixed(2) + '%', color: 'text-blue-600' },
                      { label: 'CF/mes', value: fmt(simResult.cashFlowMensual), color: '' },
                      { label: 'CF/año', value: fmt(simResult.cashFlowAnual), color: '' },
                      { label: 'Payback', value: simResult.payback.toFixed(1) + ' años', color: '' },
                    ].map(kpi => (
                      <Card key={kpi.label}><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">{kpi.label}</p><p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p></CardContent></Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: ALERTAS ===== */}
          <TabsContent value="alertas" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Alertas de Inversión</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Configura alertas para recibir notificaciones cuando aparezcan oportunidades que cumplan tus criterios.</p>
                {/* New alert form */}
                <div className="p-3 border rounded-lg space-y-3">
                  <Label className="text-sm font-medium">Crear nueva alerta</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <Input placeholder="Descripción (ej: Piso Madrid < 300K)" value={newAlertDesc} onChange={e => setNewAlertDesc(e.target.value)} />
                    <Input placeholder="Provincia" id="alert-province" />
                    <Input placeholder="Yield mín %" type="number" id="alert-yield" />
                    <Button onClick={() => {
                      if (!newAlertDesc) { toast.error('Escribe una descripción'); return; }
                      const prov = (document.getElementById('alert-province') as HTMLInputElement)?.value || '';
                      const yld = parseFloat((document.getElementById('alert-yield') as HTMLInputElement)?.value) || 0;
                      setAlerts(prev => [...prev, { id: Date.now().toString(), desc: newAlertDesc, active: true, province: prov, minYield: yld, maxPrice: 0 }]);
                      setNewAlertDesc('');
                      toast.success('Alerta creada');
                    }}><Bell className="h-4 w-4 mr-1" /> Crear</Button>
                  </div>
                </div>
                {/* Existing alerts */}
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="text-sm font-medium">{alert.desc}</span>
                      <div className="text-xs text-muted-foreground">
                        {alert.province && `📍 ${alert.province}`} {alert.minYield > 0 && `· Yield ≥ ${alert.minYield}%`} {alert.maxPrice > 0 && `· Precio ≤ ${fmt(alert.maxPrice)}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.active ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => {
                        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, active: !a.active } : a));
                      }}>{alert.active ? 'Activa' : 'Inactiva'}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}><X className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic">Las alertas se evaluarán en cada actualización de datos. Las notificaciones push se activarán próximamente.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
