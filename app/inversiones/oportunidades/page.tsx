'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp, Building2, Home, RefreshCw, Calculator, Bell, Euro, Search, Loader2,
  Star, StarOff, Download, ArrowUpDown, LayoutGrid, LayoutList, Filter, X,
  MapPin, FileDown, CheckSquare, Timer, MessageSquare, Share2, Tag,
  Shield, BarChart3, ChevronDown, ChevronUp, Send, Landmark,
  FileText, StickyNote, Save, Hammer, DoorOpen, Target, Crosshair,
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { RadarChart } from '@/components/investment/RadarChart';
import { FunnelMetrics } from '@/components/investment/FunnelMetrics';
import { ExitStrategySimulator } from '@/components/investment/ExitStrategySimulator';
import { RenovationCalculator } from '@/components/investment/RenovationCalculator';
import { NeighborhoodAnalysis } from '@/components/investment/NeighborhoodAnalysis';

// ============================================================================
// TYPES
// ============================================================================
interface Opportunity { id: string; tipo: string; titulo: string; ubicacion: string; precioEstimado: number; yieldBruto: number; yieldNeto: number; capRate: number; roi5anos: number; paybackAnos: number; riesgo: string; argumentacion: string; recomendacion: string; factoresPositivos: string[]; factoresRiesgo: string[]; superficieM2?: number; rentaMensualEstimada?: number; precioM2?: number; kpis: { cashFlowMensual: number; cashFlowAnual: number; gastosEstimados: number; hipotecaMensual: number; }; }
interface MarketOpp { id: string; source: string; sourceIcon: string; category: string; title: string; location: string; propertyType: string; price: number; marketValue: number; discount: number; surface?: number; estimatedYield?: number; riskLevel: string; description: string; url?: string; deadline?: string; tags: string[]; }
type SortField = 'discount' | 'yield' | 'price' | 'risk' | 'score';
type ViewMode = 'cards' | 'table';
type PipelineStage = 'descubierta' | 'analizada' | 'negociacion' | 'ofertada' | 'adquirida' | 'descartada';
const PIPELINE_STAGES: { key: PipelineStage; label: string; icon: string; color: string }[] = [
  { key: 'descubierta', label: 'Descubierta', icon: '🔍', color: 'bg-gray-100 dark:bg-gray-800' },
  { key: 'analizada', label: 'Analizada', icon: '📊', color: 'bg-blue-100 dark:bg-blue-900' },
  { key: 'negociacion', label: 'Negociación', icon: '🤝', color: 'bg-amber-100 dark:bg-amber-900' },
  { key: 'ofertada', label: 'Ofertada', icon: '📝', color: 'bg-purple-100 dark:bg-purple-900' },
  { key: 'adquirida', label: 'Adquirida', icon: '✅', color: 'bg-green-100 dark:bg-green-900' },
  { key: 'descartada', label: 'Descartada', icon: '❌', color: 'bg-red-100 dark:bg-red-900' },
];

// ============================================================================
// MAIN PAGE
// ============================================================================
// ============================================================================
// PANEL DE BÚSQUEDA DE OPORTUNIDADES (Idealista + BOE)
// ============================================================================

function SearchOpportunitiesPanel() {
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchMeta, setSearchMeta] = useState<{ totalFound: number; sources: string[] } | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    cities: ['Madrid'],
    propertyTypes: ['vivienda'],
    maxPrice: '',
    minSurface: '',
    minDiscount: '',
    minYield: '',
    includeBOE: true,
    includeIdealista: true,
  });

  const cityOptions = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Bilbao', 'Zaragoza', 'Valladolid', 'Palencia', 'Alicante', 'Marbella', 'Murcia', 'Granada', 'Córdoba', 'Vigo'];
  const typeOptions = [
    { value: 'vivienda', label: 'Vivienda' },
    { value: 'local_comercial', label: 'Local comercial' },
    { value: 'oficina', label: 'Oficina' },
    { value: 'nave_industrial', label: 'Nave industrial' },
    { value: 'garaje', label: 'Garaje' },
    { value: 'terreno', label: 'Terreno / Solar' },
    { value: 'trastero', label: 'Trastero' },
  ];

  const handleSearch = async () => {
    setSearching(true);
    setSearchResults([]);
    setSearchMeta(null);
    try {
      const res = await fetch('/api/investment/search-opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...searchFilters,
          maxPrice: searchFilters.maxPrice ? Number(searchFilters.maxPrice) : undefined,
          minSurface: searchFilters.minSurface ? Number(searchFilters.minSurface) : undefined,
          minDiscount: searchFilters.minDiscount ? Number(searchFilters.minDiscount) : undefined,
          minYield: searchFilters.minYield ? Number(searchFilters.minYield) : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
        setSearchMeta({ totalFound: data.totalFound || 0, sources: data.sources || [] });
      }
    } catch (e: any) {
      console.error('Search error:', e);
    } finally {
      setSearching(false);
    }
  };

  const toggleCity = (city: string) => {
    setSearchFilters(prev => ({
      ...prev,
      cities: prev.cities.includes(city) ? prev.cities.filter(c => c !== city) : [...prev.cities, city],
    }));
  };

  const toggleType = (type: string) => {
    setSearchFilters(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type) ? prev.propertyTypes.filter(t => t !== type) : [...prev.propertyTypes, type],
    }));
  };

  const fmt = (n: number) => n?.toLocaleString('es-ES', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Oportunidades de Inversión
          </CardTitle>
          <CardDescription>
            Busca activos infravalorados en Idealista y subastas judiciales del BOE.
            Cada resultado se compara con el precio de mercado de la zona.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ciudades */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ciudades</Label>
            <div className="flex flex-wrap gap-1.5">
              {cityOptions.map(city => (
                <Button key={city} size="sm" variant={searchFilters.cities.includes(city) ? 'default' : 'outline'}
                  className="h-7 text-xs" onClick={() => toggleCity(city)}>
                  {city}
                </Button>
              ))}
            </div>
          </div>

          {/* Tipo de activo */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo de activo</Label>
            <div className="flex flex-wrap gap-1.5">
              {typeOptions.map(t => (
                <Button key={t.value} size="sm" variant={searchFilters.propertyTypes.includes(t.value) ? 'default' : 'outline'}
                  className="h-7 text-xs" onClick={() => toggleType(t.value)}>
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Filtros numéricos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Precio máximo (€)</Label>
              <Input type="number" placeholder="500.000" value={searchFilters.maxPrice}
                onChange={e => setSearchFilters(p => ({ ...p, maxPrice: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Superficie mín (m²)</Label>
              <Input type="number" placeholder="50" value={searchFilters.minSurface}
                onChange={e => setSearchFilters(p => ({ ...p, minSurface: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descuento mín (%)</Label>
              <Input type="number" placeholder="10" value={searchFilters.minDiscount}
                onChange={e => setSearchFilters(p => ({ ...p, minDiscount: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Yield mín (%)</Label>
              <Input type="number" placeholder="5" value={searchFilters.minYield}
                onChange={e => setSearchFilters(p => ({ ...p, minYield: e.target.value }))} />
            </div>
          </div>

          {/* Fuentes */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={searchFilters.includeIdealista}
                onChange={e => setSearchFilters(p => ({ ...p, includeIdealista: e.target.checked }))}
                className="rounded" />
              Idealista (listings)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={searchFilters.includeBOE}
                onChange={e => setSearchFilters(p => ({ ...p, includeBOE: e.target.checked }))}
                className="rounded" />
              Subastas BOE
            </label>
          </div>

          <Button onClick={handleSearch} disabled={searching} className="w-full">
            {searching ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Buscando oportunidades...</>
            ) : (
              <><Search className="h-4 w-4 mr-2" /> Buscar oportunidades</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {searchMeta && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{searchMeta.totalFound} oportunidades encontradas</span>
          <span>Fuentes: {searchMeta.sources.join(', ')}</span>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {searchResults.map((r: any) => (
            <Card key={r.id} className={`overflow-hidden ${r.discountVsMarket > 20 ? 'border-green-300 bg-green-50/30' : r.discountVsMarket > 10 ? 'border-amber-200' : ''}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {r.source === 'boe' ? '⚖️ BOE' : '🏠 Idealista'}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {r.propertyType === 'vivienda' ? 'Vivienda' :
                         r.propertyType === 'local_comercial' ? 'Local' :
                         r.propertyType === 'oficina' ? 'Oficina' :
                         r.propertyType === 'nave_industrial' ? 'Nave' :
                         r.propertyType === 'garaje' ? 'Garaje' :
                         r.propertyType === 'terreno' ? 'Terreno' : r.propertyType}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm mt-1 truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.city}{r.surface ? ` — ${r.surface}m²` : ''}{r.rooms ? ` — ${r.rooms} hab.` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg">{fmt(r.price)}€</p>
                    {r.pricePerM2 > 0 && <p className="text-xs text-muted-foreground">{fmt(r.pricePerM2)}€/m²</p>}
                  </div>
                </div>

                {/* Métricas de oportunidad */}
                <div className="grid grid-cols-3 gap-2">
                  {r.discountVsMarket !== null && (
                    <div className={`p-2 rounded text-center ${r.discountVsMarket > 15 ? 'bg-green-100' : r.discountVsMarket > 0 ? 'bg-amber-50' : 'bg-red-50'}`}>
                      <p className="text-[10px] text-muted-foreground uppercase">vs Mercado</p>
                      <p className={`text-sm font-bold ${r.discountVsMarket > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {r.discountVsMarket > 0 ? '-' : '+'}{Math.abs(r.discountVsMarket)}%
                      </p>
                    </div>
                  )}
                  {r.estimatedYield && (
                    <div className="p-2 rounded bg-blue-50 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Yield</p>
                      <p className="text-sm font-bold text-blue-700">{r.estimatedYield}%</p>
                    </div>
                  )}
                  <div className={`p-2 rounded text-center ${r.opportunityScore > 60 ? 'bg-emerald-100' : r.opportunityScore > 40 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                    <p className="text-[10px] text-muted-foreground uppercase">Score</p>
                    <p className={`text-sm font-bold ${r.opportunityScore > 60 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {r.opportunityScore}/100
                    </p>
                  </div>
                </div>

                {r.marketPricePerM2 && (
                  <p className="text-xs text-muted-foreground">
                    Precio mercado zona: {fmt(r.marketPricePerM2)}€/m²
                    {r.zoneYield ? ` · Yield zona: ${r.zoneYield}%` : ''}
                  </p>
                )}

                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    Ver en {r.source === 'boe' ? 'BOE' : 'Idealista'} →
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searching && (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
          <p className="text-sm">Buscando en Idealista y BOE...</p>
          <p className="text-xs mt-1">Comparando con precios de mercado de Idealista Data</p>
        </div>
      )}
    </div>
  );
}

export default function OportunidadesPage() {
  const { status } = useSession();
  const router = useRouter();

  // Data
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [marketOpps, setMarketOpps] = useState<any>(null);
  const [portfolioStats, setPortfolioStats] = useState<any>(null);
  const [marketIndicators, setMarketIndicators] = useState<any[]>([]);
  const [marketSources, setMarketSources] = useState<any[]>([]);

  // Filters
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterProvince, setFilterProvince] = useState('all');
  const [filterMinYield, setFilterMinYield] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Sort/View
  const [sortField, setSortField] = useState<SortField>('discount');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Favorites & Compare
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  // Pipeline
  const [pipeline, setPipeline] = useState<Record<string, PipelineStage>>({});

  // Tags
  const [userTags, setUserTags] = useState<Record<string, string[]>>({});

  // Checklist
  const [checklist, setChecklist] = useState<Record<string, Set<string>>>({});

  // Chat
  const [chatOpp, setChatOpp] = useState<MarketOpp | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Mortgage calculator
  const [mortgageDown, setMortgageDown] = useState('20');
  const [mortgageRate, setMortgageRate] = useState('3.5');
  const [mortgageTerm, setMortgageTerm] = useState('25');

  // Fiscal
  const [ownerType] = useState<'persona_fisica' | 'sociedad'>('sociedad');

  // Expanded card
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // History
  const [viewHistory, setViewHistory] = useState<{ id: string; date: string; action: string }[]>([]);

  // Notes
  const [notes, setNotes] = useState<Record<string, string[]>>({});

  // Saved filters
  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: any }[]>([]);
  const [filterPresetName, setFilterPresetName] = useState('');

  // Bulk selection
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Watchlist
  const [watchlist, setWatchlist] = useState<Record<string, number>>({}); // id → target price

  // Documents
  const [oppDocs, setOppDocs] = useState<Record<string, { name: string; date: string }[]>>({});

  // Simulator
  const [simPrecio, setSimPrecio] = useState('');
  const [simRenta, setSimRenta] = useState('');
  const [simGastos, setSimGastos] = useState('');
  const [simResult, setSimResult] = useState<any>(null);

  // Alerts
  const [alerts, setAlerts] = useState([
    { id: '1', desc: 'Edificio Madrid < €3.000/m²', active: true },
    { id: '2', desc: 'Local yield > 8%', active: false },
    { id: '3', desc: 'Vivienda Marbella < €500K', active: true },
  ]);
  const [newAlertDesc, setNewAlertDesc] = useState('');

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); if (status === 'authenticated') loadData(); }, [status, router]);
  useEffect(() => { try {
    const s = localStorage.getItem('inmova-opp-favs'); if (s) setFavorites(new Set(JSON.parse(s)));
    const p = localStorage.getItem('inmova-opp-pipeline'); if (p) setPipeline(JSON.parse(p));
    const t = localStorage.getItem('inmova-opp-tags'); if (t) setUserTags(JSON.parse(t));
    const c = localStorage.getItem('inmova-opp-checks'); if (c) { const parsed = JSON.parse(c); const rebuilt: Record<string, Set<string>> = {}; Object.entries(parsed).forEach(([k, v]) => { rebuilt[k] = new Set(v as string[]); }); setChecklist(rebuilt); }
    const h = localStorage.getItem('inmova-opp-history'); if (h) setViewHistory(JSON.parse(h));
    const n = localStorage.getItem('inmova-opp-notes'); if (n) setNotes(JSON.parse(n));
    const sf = localStorage.getItem('inmova-opp-savedfilters'); if (sf) setSavedFilters(JSON.parse(sf));
    const w = localStorage.getItem('inmova-opp-watchlist'); if (w) setWatchlist(JSON.parse(w));
    const d = localStorage.getItem('inmova-opp-docs'); if (d) setOppDocs(JSON.parse(d));
  } catch {} }, []);

  const persist = useCallback((key: string, val: any) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, []);
  const saveFavs = useCallback((n: Set<string>) => { setFavorites(n); persist('inmova-opp-favs', [...n]); }, [persist]);
  const savePipeline = useCallback((n: Record<string, PipelineStage>) => { setPipeline(n); persist('inmova-opp-pipeline', n); }, [persist]);
  const saveTags = useCallback((n: Record<string, string[]>) => { setUserTags(n); persist('inmova-opp-tags', n); }, [persist]);
  const saveChecks = useCallback((n: Record<string, Set<string>>) => { setChecklist(n); const serialized: Record<string, string[]> = {}; Object.entries(n).forEach(([k, v]) => { serialized[k] = [...v]; }); persist('inmova-opp-checks', serialized); }, [persist]);
  const saveNotes = useCallback((n: Record<string, string[]>) => { setNotes(n); persist('inmova-opp-notes', n); }, [persist]);
  const saveSavedFilters = useCallback((n: { name: string; filters: any }[]) => { setSavedFilters(n); persist('inmova-opp-savedfilters', n); }, [persist]);
  const saveWatchlist = useCallback((n: Record<string, number>) => { setWatchlist(n); persist('inmova-opp-watchlist', n); }, [persist]);
  const saveDocs = useCallback((n: Record<string, { name: string; date: string }[]>) => { setOppDocs(n); persist('inmova-opp-docs', n); }, [persist]);
  const addHistory = useCallback((id: string, action: string) => { const entry = { id, date: new Date().toISOString(), action }; setViewHistory(prev => { const n = [entry, ...prev].slice(0, 50); persist('inmova-opp-history', n); return n; }); }, [persist]);

  const loadData = async () => { setLoading(true); try { const res = await fetch('/api/investment/opportunities'); if (res.ok) { const d = await res.json(); setPortfolioStats(d.portfolioStats || null); setOpportunities(d.opportunities || []); setMarketOpps(d.marketOpportunities || null); setMarketIndicators(d.marketIndicators || []); setMarketSources(d.marketSources || []); } } catch { toast.error('Error cargando'); } finally { setLoading(false); } };

  // Helpers
  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const getRiesgoColor = (r: string) => r === 'bajo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : r === 'alto' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  const getScoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 65 ? 'text-blue-600' : s >= 50 ? 'text-amber-600' : 'text-red-600';

  // Calculate score client-side
  const calcScore = useCallback((m: MarketOpp) => {
    const yS = Math.min(25, (m.estimatedYield || 0) * 2.5);
    const dS = Math.min(25, (m.discount || 0) * 0.5);
    const rS = m.riskLevel === 'bajo' ? 20 : m.riskLevel === 'medio' ? 12 : 5;
    const liq = ['Madrid', 'Barcelona', 'Málaga', 'Valencia', 'Sevilla'].some(c => m.location.includes(c)) ? 15 : 8;
    const pot: Record<string, number> = { tendencia: 15, divergencia: 13, subasta: 10, banca: 8, crowdfunding: 7 };
    const pS = pot[m.category] || 8;
    return Math.min(100, Math.round(yS + dS + rS + liq + pS));
  }, []);

  // All market items
  const allMarketItems: MarketOpp[] = useMemo(() => {
    if (!marketOpps) return [];
    return [...(marketOpps.auctions || []), ...(marketOpps.bankProperties || []), ...(marketOpps.divergences || []), ...(marketOpps.trends || []), ...(marketOpps.crowdfunding || [])];
  }, [marketOpps]);

  const provinces = useMemo(() => [...new Set(allMarketItems.map(m => m.location))].sort(), [allMarketItems]);
  const allTags = useMemo(() => { const s = new Set<string>(); Object.values(userTags).flat().forEach(t => s.add(t)); return [...s].sort(); }, [userTags]);

  // Filtered & sorted
  const filteredMarket = useMemo(() => {
    let items = [...allMarketItems];
    if (filterCategory !== 'all') items = items.filter(m => m.category === filterCategory);
    if (filterProvince !== 'all') items = items.filter(m => m.location === filterProvince);
    if (filterMinYield) items = items.filter(m => (m.estimatedYield || 0) >= parseFloat(filterMinYield));
    if (filterMaxPrice) items = items.filter(m => m.price > 0 && m.price <= parseFloat(filterMaxPrice));
    if (filterRisk !== 'all') items = items.filter(m => m.riskLevel === filterRisk);
    if (filterTag !== 'all') items = items.filter(m => (userTags[m.id] || []).includes(filterTag));
    if (showOnlyFavorites) items = items.filter(m => favorites.has(m.id));
    items.sort((a, b) => {
      let va = 0, vb = 0;
      if (sortField === 'discount') { va = a.discount; vb = b.discount; }
      else if (sortField === 'yield') { va = a.estimatedYield || 0; vb = b.estimatedYield || 0; }
      else if (sortField === 'price') { va = a.price; vb = b.price; }
      else if (sortField === 'risk') { va = a.riskLevel === 'bajo' ? 1 : a.riskLevel === 'medio' ? 2 : 3; vb = b.riskLevel === 'bajo' ? 1 : b.riskLevel === 'medio' ? 2 : 3; }
      else if (sortField === 'score') { va = calcScore(a); vb = calcScore(b); }
      return sortAsc ? va - vb : vb - va;
    });
    return items;
  }, [allMarketItems, filterCategory, filterProvince, filterMinYield, filterMaxPrice, filterRisk, filterTag, showOnlyFavorites, favorites, sortField, sortAsc, userTags, calcScore]);

  // KPIs
  const marketKPIs = useMemo(() => {
    if (filteredMarket.length === 0) return null;
    const wd = filteredMarket.filter(m => m.discount > 0);
    const wy = filteredMarket.filter(m => (m.estimatedYield || 0) > 0);
    return { total: filteredMarket.length, avgDiscount: wd.length > 0 ? wd.reduce((s, m) => s + m.discount, 0) / wd.length : 0, bestYield: wy.reduce((max, m) => Math.max(max, m.estimatedYield || 0), 0), minPrice: filteredMarket.filter(m => m.price > 0).reduce((min, m) => Math.min(min, m.price), Infinity) };
  }, [filteredMarket]);

  // Simulate for opp
  const simForOpp = (o: MarketOpp) => {
    const rent = o.price > 0 && o.estimatedYield ? (o.price * (o.estimatedYield / 100)) / 12 : 0;
    const exp = o.price * 0.015;
    const cf = rent * 12 - exp;
    const pb = cf > 0 ? o.price / cf : 0;
    return { rent: Math.round(rent), cfm: Math.round(cf / 12), cfa: Math.round(cf), pb: pb.toFixed(1), roi5: ((cf * 5 + (o.marketValue - o.price)) / (o.price || 1) * 100).toFixed(0) };
  };

  // Mortgage calc
  const calcMortgage = (opp: MarketOpp) => {
    const p = opp.price; const dp = p * (parseFloat(mortgageDown) / 100); const loan = p - dp;
    const mr = parseFloat(mortgageRate) / 100 / 12; const n = parseFloat(mortgageTerm) * 12;
    const mp = mr > 0 ? loan * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1) : loan / n;
    const rent = simForOpp(opp).rent;
    return { dp: Math.round(dp), loan: Math.round(loan), mp: Math.round(mp), cfNet: Math.round(rent - mp), levYield: dp > 0 ? (((rent - mp) * 12) / dp * 100).toFixed(1) : '0' };
  };

  // Sensitivity
  const calcSensitivity = (opp: MarketOpp) => {
    const rent = simForOpp(opp).rent; const exp = opp.price * 0.015;
    const base = ((rent * 12 - exp) / (opp.price || 1)) * 100;
    return [
      { name: 'Base', yld: base.toFixed(2), cf: Math.round(rent * 12 - exp), note: 'Actual' },
      { name: 'Vacío 2m', yld: (((rent * 10 - exp) / (opp.price || 1)) * 100).toFixed(2), cf: Math.round(rent * 10 - exp), note: '2 meses sin inquilino' },
      { name: 'Gastos +20%', yld: (((rent * 12 - exp * 1.2) / (opp.price || 1)) * 100).toFixed(2), cf: Math.round(rent * 12 - exp * 1.2), note: 'Subida gastos' },
      { name: 'IPC +5%', yld: (((rent * 1.05 * 12 - exp * 1.05) / (opp.price || 1)) * 100).toFixed(2), cf: Math.round(rent * 1.05 * 12 - exp * 1.05), note: 'Inflación 5%' },
      { name: 'Peor caso', yld: (((rent * 10 * 0.9 - exp * 1.3) / (opp.price || 1)) * 100).toFixed(2), cf: Math.round(rent * 10 * 0.9 - exp * 1.3), note: 'Vacío+renta baja+gastos altos' },
      { name: 'Mejor caso', yld: (((rent * 1.1 * 12 - exp * 0.9) / (opp.price || 1)) * 100).toFixed(2), cf: Math.round(rent * 1.1 * 12 - exp * 0.9), note: 'Renta +10%, gastos -10%' },
    ];
  };

  // Fiscal
  const calcFiscal = (opp: MarketOpp) => {
    const p = opp.price; const rent = simForOpp(opp).rent * 12; const exp = p * 0.015;
    const itpRate = opp.location.includes('Madrid') ? 0.06 : opp.location.includes('Barcelona') ? 0.10 : opp.location.includes('Málaga') ? 0.07 : 0.08;
    const itp = Math.round(p * itpRate);
    const notaria = Math.round(p * 0.003 + 300);
    const registro = Math.round(p * 0.002 + 200);
    const totalCompra = itp + notaria + registro + 500;
    const ibi = Math.round(p * 0.005);
    const amort = Math.round(p * 0.03);
    const baseImp = Math.max(0, rent - exp - amort - ibi);
    const baseRed = ownerType === 'persona_fisica' ? baseImp * 0.4 : baseImp;
    const rate = ownerType === 'sociedad' ? 0.25 : 0.30;
    const irpf = Math.round(baseRed * rate);
    const netoFiscal = Math.round(rent - exp - ibi - irpf);
    return { itp, itpRate: (itpRate * 100).toFixed(0), notaria, registro, totalCompra, ibi, irpf, netoFiscal, tipoEfectivo: rent > 0 ? ((irpf / rent) * 100).toFixed(1) : '0' };
  };

  // Portfolio impact
  const calcImpact = (opp: MarketOpp) => {
    if (!portfolioStats) return null;
    const cy = parseFloat(portfolioStats.avgYield || '0');
    const cu = portfolioStats.totalUnits || 0;
    const ny = cu > 0 ? (cy * cu + (opp.estimatedYield || 0)) / (cu + 1) : opp.estimatedYield || 0;
    return { cy, ny: ny.toFixed(2), change: (ny - cy).toFixed(2), cu, nu: cu + 1 };
  };

  // Due diligence
  const getChecklist = (opp: MarketOpp) => {
    const base = [
      { id: 'nota', text: 'Nota simple Registro Propiedad', critical: true },
      { id: 'cargas', text: 'Verificar cargas/hipotecas/embargos', critical: true },
      { id: 'catastro', text: 'Datos catastrales (superficie, uso)', critical: true },
      { id: 'ibi', text: 'Último recibo IBI', critical: true },
      { id: 'comunidad', text: 'Certificado deudas comunidad', critical: true },
      { id: 'cee', text: 'Certificado energético en vigor', critical: false },
      { id: 'visita', text: 'Visita presencial', critical: true },
      { id: 'comps', text: 'Comparables en la zona', critical: true },
    ];
    if (opp.category === 'subasta') {
      base.push({ id: 'deposito', text: 'Depósito 5% para participar', critical: true });
      base.push({ id: 'ocupacion', text: 'Verificar si está ocupado', critical: true });
      base.push({ id: 'cargas-ant', text: 'Cargas anteriores (no se cancelan)', critical: true });
    }
    if (opp.category === 'banca') {
      base.push({ id: 'negociar', text: 'Negociar 10-15% adicional', critical: false });
      base.push({ id: 'estado', text: 'Estado conservación (posible reforma)', critical: true });
    }
    return base;
  };

  // Chat
  const sendChat = async () => {
    if (!chatInput.trim() || !chatOpp) return;
    const msg = chatInput.trim(); setChatInput('');
    const newMsgs = [...chatMessages, { role: 'user', content: msg }]; setChatMessages(newMsgs);
    setChatLoading(true);
    addHistory(chatOpp.id, 'Chat IA');
    try {
      const res = await fetch('/api/ai/opportunity-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, opportunity: chatOpp, history: newMsgs.slice(-6) }) });
      if (res.ok) { const d = await res.json(); setChatMessages([...newMsgs, { role: 'assistant', content: d.reply }]); }
      else { setChatMessages([...newMsgs, { role: 'assistant', content: 'Error en la respuesta. Verifica ANTHROPIC_API_KEY.' }]); }
    } catch { setChatMessages([...newMsgs, { role: 'assistant', content: 'Error de conexión.' }]); }
    finally { setChatLoading(false); }
  };

  // Share
  const shareOpp = (opp: MarketOpp) => {
    const sim = simForOpp(opp);
    const text = `📊 Oportunidad de inversión - Inmova\n\n${opp.title}\n📍 ${opp.location}\n💰 ${fmt(opp.price)} (${opp.discount}% dto.)\n📈 Yield: ${opp.estimatedYield}%\n💵 CF/mes: ${fmt(sim.cfm)}\n⚠️ Riesgo: ${opp.riskLevel}\n\nFuente: ${opp.source}`;
    if (navigator.share) { navigator.share({ title: opp.title, text }).catch(() => {}); }
    else { navigator.clipboard.writeText(text).then(() => toast.success('Copiado al portapapeles')); }
  };

  // Export
  const exportCSV = () => {
    const h = ['Título', 'Fuente', 'Ubicación', 'Precio', 'Valor', 'Dto%', 'Yield%', 'm²', 'Riesgo', 'Score', 'Etapa'];
    const r = filteredMarket.map(m => [m.title, m.source, m.location, m.price, m.marketValue, m.discount, m.estimatedYield || '', m.surface || '', m.riskLevel, calcScore(m), pipeline[m.id] || 'descubierta']);
    const csv = [h.join(';'), ...r.map(x => x.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `oportunidades-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    toast.success('CSV exportado');
  };

  const exportPDF = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Informe Oportunidades</title><style>body{font-family:Arial;margin:40px;color:#333}h1{color:#1e40af;border-bottom:3px solid #1e40af;padding-bottom:10px}.kpi{display:inline-block;background:#f0f9ff;padding:12px 20px;border-radius:8px;margin:5px;text-align:center}.kpi .v{font-size:24px;font-weight:bold;color:#1e40af}.kpi .l{font-size:11px;color:#666}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e40af;color:white;padding:8px;text-align:left;font-size:12px}td{padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px}.g{color:#16a34a;font-weight:bold}.foot{margin-top:30px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:10px;color:#999}</style></head><body><h1>📊 Informe de Oportunidades de Inversión</h1><p style="color:#666">Generado por Inmova App — ${new Date().toLocaleDateString('es-ES', { dateStyle: 'full' })}</p>${marketKPIs ? `<div style="margin:20px 0"><div class="kpi"><div class="v">${marketKPIs.total}</div><div class="l">Oportunidades</div></div><div class="kpi"><div class="v">${marketKPIs.avgDiscount.toFixed(0)}%</div><div class="l">Dto. medio</div></div><div class="kpi"><div class="v">${marketKPIs.bestYield.toFixed(1)}%</div><div class="l">Mejor yield</div></div></div>` : ''}<table><thead><tr><th>Oportunidad</th><th>Score</th><th>Fuente</th><th>Ubicación</th><th>Precio</th><th>Dto.</th><th>Yield</th><th>Riesgo</th><th>Etapa</th></tr></thead><tbody>${filteredMarket.map(m => `<tr><td>${m.title}</td><td>${calcScore(m)}/100</td><td>${m.source}</td><td>${m.location}</td><td>${fmt(m.price)}</td><td class="g">${m.discount > 0 ? '-' + m.discount + '%' : '-'}</td><td>${m.estimatedYield || '-'}%</td><td>${m.riskLevel}</td><td>${pipeline[m.id] || 'descubierta'}</td></tr>`).join('')}</tbody></table><div class="foot">© Inmova App ${new Date().getFullYear()} — Orientativo, no constituye asesoramiento financiero.</div></body></html>`;
    const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  // Simulate
  const simulate = () => { const p = parseFloat(simPrecio); const r = parseFloat(simRenta); const g = parseFloat(simGastos) || 0; if (!p || !r) { toast.error('Precio y renta requeridos'); return; } const yb = ((r * 12) / p) * 100; const yn = ((r * 12 - g) / p) * 100; const cf = r * 12 - g; setSimResult({ yb, yn, cfm: cf / 12, cfa: cf, pb: cf > 0 ? p / cf : 0 }); };

  // AI analysis
  const analyzeOpp = async (opp: MarketOpp) => {
    setAnalyzingId(opp.id); addHistory(opp.id, 'Análisis IA');
    toast.info('Analizando con IA... (~30s)');
    try {
      const res = await fetch('/api/ai/investment-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ property: { city: opp.location, price: opp.price, surface: opp.surface || 80, propertyType: opp.propertyType || 'vivienda', estimatedRent: simForOpp(opp).rent, estimatedYield: opp.estimatedYield || 0, source: opp.source, category: opp.category } }) });
      if (res.ok) { const d = await res.json(); const a = d.analysis; toast.success(`🎯 ${a.recomendacion?.veredicto} (${a.recomendacion?.confianza}%)\n${a.resumenEjecutivo}`, { duration: 15000 }); savePipeline({ ...pipeline, [opp.id]: 'analizada' }); }
      else toast.error('Error IA');
    } catch { toast.error('Error conexión'); }
    finally { setAnalyzingId(null); }
  };

  if (loading) return <AuthenticatedLayout><div className="max-w-7xl mx-auto space-y-4"><Skeleton className="h-8 w-64" /><div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div></div></AuthenticatedLayout>;

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Breadcrumb */}
        <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Oportunidades</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Search className="h-6 w-6" /> Oportunidades de Inversión</h1>
            <p className="text-muted-foreground text-sm">{allMarketItems.length + opportunities.length} oportunidades · {Object.values(pipeline).filter(v => v === 'analizada' || v === 'negociacion').length} en análisis</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="h-4 w-4 mr-1" /> Actualizar</Button>
            <Button variant="outline" size="sm" onClick={exportCSV}><FileDown className="h-4 w-4 mr-1" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><Download className="h-4 w-4 mr-1" /> PDF</Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {portfolioStats && (<>
            <Card><CardContent className="pt-3 pb-2 text-center"><p className="text-[10px] text-muted-foreground uppercase">Unidades</p><p className="text-lg font-bold">{portfolioStats.totalUnits}</p></CardContent></Card>
            <Card><CardContent className="pt-3 pb-2 text-center"><p className="text-[10px] text-muted-foreground uppercase">Ocupación</p><p className="text-lg font-bold">{portfolioStats.occupancy}%</p></CardContent></Card>
            <Card><CardContent className="pt-3 pb-2 text-center"><p className="text-[10px] text-muted-foreground uppercase">Renta/mes</p><p className="text-lg font-bold text-green-600">{fmt(portfolioStats.monthlyRent)}</p></CardContent></Card>
            <Card><CardContent className="pt-3 pb-2 text-center"><p className="text-[10px] text-muted-foreground uppercase">Yield</p><p className="text-lg font-bold text-blue-600">{portfolioStats.avgYield}%</p></CardContent></Card>
          </>)}
          {marketKPIs && (<>
            <Card className="bg-blue-50 dark:bg-blue-950"><CardContent className="pt-3 pb-2 text-center"><p className="text-[10px] text-muted-foreground uppercase">Opps.</p><p className="text-lg font-bold text-blue-700 dark:text-blue-300">{marketKPIs.total}</p></CardContent></Card>
            <Card className="bg-green-50 dark:bg-green-950"><CardContent className="pt-3 pb-2 text-center"><p className="text-[10px] text-muted-foreground uppercase">Dto. medio</p><p className="text-lg font-bold text-green-700 dark:text-green-300">{marketKPIs.avgDiscount.toFixed(0)}%</p></CardContent></Card>
            <Card className="bg-emerald-50 dark:bg-emerald-950"><CardContent className="pt-3 pb-2 text-center"><p className="text-[10px] text-muted-foreground uppercase">Mejor yield</p><p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{marketKPIs.bestYield.toFixed(1)}%</p></CardContent></Card>
            <Card className="bg-purple-50 dark:bg-purple-950"><CardContent className="pt-3 pb-2 text-center"><p className="text-[10px] text-muted-foreground uppercase">Inv. mín</p><p className="text-lg font-bold text-purple-700 dark:text-purple-300">{marketKPIs.minPrice !== Infinity ? fmt(marketKPIs.minPrice) : '-'}</p></CardContent></Card>
          </>)}
        </div>

        {/* TABS */}
        <Tabs defaultValue="mercado">
          <TabsList className="w-full sm:w-auto flex-wrap h-auto">
            <TabsTrigger value="mercado">🏪 Mercado</TabsTrigger>
            <TabsTrigger value="buscar">🔍 Buscar</TabsTrigger>
            <TabsTrigger value="pipeline">📋 Pipeline</TabsTrigger>
            <TabsTrigger value="ia">🤖 IA</TabsTrigger>
            <TabsTrigger value="propuestas">📄 Propuestas</TabsTrigger>
            <TabsTrigger value="simulador">🧮 Simulador</TabsTrigger>
            <TabsTrigger value="alertas">🔔 Alertas</TabsTrigger>
            <TabsTrigger value="historial">📜 Historial</TabsTrigger>
            {showCompare && <TabsTrigger value="comparar">⚖️ Comparar ({compareIds.size})</TabsTrigger>}
          </TabsList>

          {/* ===== BUSCAR TAB — Búsqueda real en Idealista + BOE ===== */}
          <TabsContent value="buscar" className="space-y-4">
            <SearchOpportunitiesPanel />
          </TabsContent>

          {/* ===== MERCADO TAB ===== */}
          <TabsContent value="mercado" className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-1.5 items-center flex-wrap">
                <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)}><Filter className="h-3 w-3 mr-1" /> Filtros</Button>
                <Button variant={showOnlyFavorites ? 'default' : 'outline'} size="sm" onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}><Star className="h-3 w-3 mr-1" /> ({favorites.size})</Button>
                {compareIds.size > 0 && <Button variant="outline" size="sm" onClick={() => setShowCompare(true)}><CheckSquare className="h-3 w-3 mr-1" /> Comp. ({compareIds.size})</Button>}
              </div>
              <div className="flex gap-1.5 items-center">
                <Select value={sortField} onValueChange={v => setSortField(v as SortField)}><SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="score">Score</SelectItem><SelectItem value="discount">Descuento</SelectItem><SelectItem value="yield">Yield</SelectItem><SelectItem value="price">Precio</SelectItem><SelectItem value="risk">Riesgo</SelectItem></SelectContent></Select>
                <Button variant="ghost" size="sm" onClick={() => setSortAsc(!sortAsc)}><ArrowUpDown className="h-3 w-3" /></Button>
                <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('cards')}><LayoutGrid className="h-3 w-3" /></Button>
                <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')}><LayoutList className="h-3 w-3" /></Button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <Card className="border-dashed"><CardContent className="pt-3 pb-2">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  <div><Label className="text-[10px]">Categoría</Label><Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="subasta">⚖️ Subasta</SelectItem><SelectItem value="banca">🏦 Banca</SelectItem><SelectItem value="divergencia">🔍 Divergencia</SelectItem><SelectItem value="tendencia">📈 Tendencia</SelectItem><SelectItem value="crowdfunding">🏗️ Crowdfunding</SelectItem></SelectContent></Select></div>
                  <div><Label className="text-[10px]">Provincia</Label><Select value={filterProvince} onValueChange={setFilterProvince}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem>{provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-[10px]">Yield mín %</Label><Input type="number" className="h-7 text-xs" placeholder="5" value={filterMinYield} onChange={e => setFilterMinYield(e.target.value)} /></div>
                  <div><Label className="text-[10px]">Precio máx €</Label><Input type="number" className="h-7 text-xs" placeholder="500000" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} /></div>
                  <div><Label className="text-[10px]">Riesgo</Label><Select value={filterRisk} onValueChange={setFilterRisk}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="bajo">🟢 Bajo</SelectItem><SelectItem value="medio">🟡 Medio</SelectItem><SelectItem value="alto">🔴 Alto</SelectItem></SelectContent></Select></div>
                  {allTags.length > 0 && <div><Label className="text-[10px]">Tag</Label><Select value={filterTag} onValueChange={setFilterTag}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>}
                </div>
                <div className="flex gap-1 mt-1 flex-wrap items-center">
                  <Button variant="ghost" size="sm" className="text-[10px]" onClick={() => { setFilterCategory('all'); setFilterProvince('all'); setFilterMinYield(''); setFilterMaxPrice(''); setFilterRisk('all'); setFilterTag('all'); }}><X className="h-3 w-3 mr-1" /> Limpiar</Button>
                  <span className="text-[9px] text-muted-foreground">|</span>
                  <Input className="h-5 w-24 text-[9px] px-1" placeholder="Nombre preset" value={filterPresetName} onChange={e => setFilterPresetName(e.target.value)} />
                  <Button variant="ghost" size="sm" className="text-[10px] h-5" onClick={() => { if (!filterPresetName) return; saveSavedFilters([...savedFilters, { name: filterPresetName, filters: { filterCategory, filterProvince, filterMinYield, filterMaxPrice, filterRisk, filterTag } }]); setFilterPresetName(''); toast.success('Filtro guardado'); }}><Save className="h-2.5 w-2.5 mr-0.5" /> Guardar</Button>
                  {savedFilters.map((sf, i) => (
                    <Badge key={i} variant="outline" className="text-[9px] cursor-pointer hover:bg-blue-50" onClick={() => { const f = sf.filters; setFilterCategory(f.filterCategory || 'all'); setFilterProvince(f.filterProvince || 'all'); setFilterMinYield(f.filterMinYield || ''); setFilterMaxPrice(f.filterMaxPrice || ''); setFilterRisk(f.filterRisk || 'all'); setFilterTag(f.filterTag || 'all'); }}>
                      {sf.name} <button className="ml-0.5" onClick={e => { e.stopPropagation(); saveSavedFilters(savedFilters.filter((_, j) => j !== i)); }}>×</button>
                    </Badge>
                  ))}
                </div>
              </CardContent></Card>
            )}

            {/* TABLE VIEW */}
            {filteredMarket.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Sin resultados</CardContent></Card>
            : viewMode === 'table' ? (
              <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-[11px]"><thead><tr className="border-b bg-muted/50"><th className="p-1.5 w-7">⭐</th><th className="p-1.5 w-7">☑</th><th className="p-1.5 text-left">Oportunidad</th><th className="p-1.5">Score</th><th className="p-1.5">Etapa</th><th className="p-1.5 text-right">Precio</th><th className="p-1.5 text-right">Dto.</th><th className="p-1.5 text-right">Yield</th><th className="p-1.5">Riesgo</th><th className="p-1.5 text-right">CF/mes</th><th className="p-1.5">Acciones</th></tr></thead>
              <tbody>{filteredMarket.map(mo => { const sim = simForOpp(mo); const sc = calcScore(mo); return (
                <tr key={mo.id} className="border-b hover:bg-muted/30">
                  <td className="p-1.5"><button onClick={() => { const n = new Set(favorites); if (n.has(mo.id)) n.delete(mo.id); else n.add(mo.id); saveFavs(n); }}>{favorites.has(mo.id) ? <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-3 w-3 text-gray-300" />}</button></td>
                  <td className="p-1.5"><input type="checkbox" checked={compareIds.has(mo.id)} onChange={() => { const n = new Set(compareIds); if (n.has(mo.id)) n.delete(mo.id); else { if (n.size >= 3) return; n.add(mo.id); } setCompareIds(n); }} /></td>
                  <td className="p-1.5 font-medium max-w-[180px] truncate" title={mo.title}>{mo.sourceIcon} {mo.title}</td>
                  <td className="p-1.5 text-center"><span className={`font-bold ${getScoreColor(sc)}`}>{sc}</span></td>
                  <td className="p-1.5"><Select value={pipeline[mo.id] || 'descubierta'} onValueChange={v => savePipeline({ ...pipeline, [mo.id]: v as PipelineStage })}><SelectTrigger className="h-6 text-[10px] w-[100px]"><SelectValue /></SelectTrigger><SelectContent>{PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.icon} {s.label}</SelectItem>)}</SelectContent></Select></td>
                  <td className="p-1.5 text-right">{mo.price > 0 ? fmt(mo.price) : '-'}</td>
                  <td className="p-1.5 text-right">{mo.discount > 0 ? <span className="text-green-600 font-bold">-{mo.discount}%</span> : '-'}</td>
                  <td className="p-1.5 text-right">{mo.estimatedYield ? <span className="text-emerald-600">{mo.estimatedYield}%</span> : '-'}</td>
                  <td className="p-1.5"><Badge variant="outline" className={`text-[9px] ${getRiesgoColor(mo.riskLevel)}`}>{mo.riskLevel}</Badge></td>
                  <td className="p-1.5 text-right text-blue-600">{sim.cfm > 0 ? fmt(sim.cfm) : '-'}</td>
                  <td className="p-1.5"><div className="flex gap-0.5">
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" disabled={analyzingId === mo.id} onClick={() => analyzeOpp(mo)} title="Análisis IA">{analyzingId === mo.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />}</Button>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => { setChatOpp(mo); setChatMessages([]); }} title="Chat IA"><MessageSquare className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => shareOpp(mo)} title="Compartir"><Share2 className="h-3 w-3" /></Button>
                  </div></td>
                </tr>); })}</tbody></table></div></CardContent></Card>
            ) : (
              /* CARDS VIEW */
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredMarket.map(mo => {
                  const sim = simForOpp(mo); const sc = calcScore(mo); const expanded = expandedId === mo.id;
                  return (
                    <Card key={mo.id} className={`hover:shadow-md transition-shadow ${compareIds.has(mo.id) ? 'ring-2 ring-blue-500' : ''}`}>
                      <CardContent className="pt-3 pb-2 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex gap-1 mb-1 flex-wrap">
                              <Badge variant="outline" className="text-[9px]">{mo.sourceIcon} {mo.category}</Badge>
                              {mo.discount > 0 && <Badge className="bg-green-600 text-white text-[9px]">-{mo.discount}%</Badge>}
                              <Badge variant="outline" className={`text-[9px] ${getRiesgoColor(mo.riskLevel)}`}>{mo.riskLevel}</Badge>
                              <span className={`text-xs font-bold ${getScoreColor(sc)}`}>{sc}/100</span>
                            </div>
                            <p className="text-sm font-semibold leading-tight">{mo.title}</p>
                            <p className="text-[11px] text-muted-foreground"><MapPin className="h-3 w-3 inline" /> {mo.location} · {mo.source}</p>
                          </div>
                          <div className="flex flex-col gap-0.5 items-center">
                            <button onClick={() => { const n = new Set(favorites); if (n.has(mo.id)) n.delete(mo.id); else n.add(mo.id); saveFavs(n); }}>{favorites.has(mo.id) ? <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-3.5 w-3.5 text-gray-300" />}</button>
                            <input type="checkbox" checked={compareIds.has(mo.id)} onChange={() => { const n = new Set(compareIds); if (n.has(mo.id)) n.delete(mo.id); else { if (n.size >= 3) return; n.add(mo.id); } setCompareIds(n); }} />
                          </div>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-3 gap-1 text-[10px]">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded p-1 text-center"><p className="text-muted-foreground">Precio</p><p className="font-bold">{mo.price > 0 ? fmt(mo.price) : '-'}</p></div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded p-1 text-center"><p className="text-muted-foreground">Yield</p><p className="font-bold text-green-600">{mo.estimatedYield ? mo.estimatedYield + '%' : '-'}</p></div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded p-1 text-center"><p className="text-muted-foreground">CF/mes</p><p className="font-bold text-blue-600">{sim.cfm > 0 ? fmt(sim.cfm) : '-'}</p></div>
                        </div>
                        <div className="flex gap-2 text-[9px] text-muted-foreground"><span>Payback: <strong>{sim.pb}a</strong></span><span>ROI 5a: <strong>{sim.roi5}%</strong></span>{mo.surface ? <span>{mo.surface}m²</span> : null}</div>

                        {/* Pipeline stage selector */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-muted-foreground">Etapa:</span>
                          <Select value={pipeline[mo.id] || 'descubierta'} onValueChange={v => { savePipeline({ ...pipeline, [mo.id]: v as PipelineStage }); addHistory(mo.id, `Etapa → ${v}`); }}><SelectTrigger className="h-6 text-[10px] w-[110px]"><SelectValue /></SelectTrigger><SelectContent>{PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.icon} {s.label}</SelectItem>)}</SelectContent></Select>
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {(userTags[mo.id] || []).map(t => <Badge key={t} variant="secondary" className="text-[9px] h-4 cursor-pointer" onClick={() => { const n = { ...userTags }; n[mo.id] = (n[mo.id] || []).filter(x => x !== t); saveTags(n); }}><Tag className="h-2 w-2 mr-0.5" />{t} ×</Badge>)}
                          <Input className="h-5 w-16 text-[9px] px-1" placeholder="+tag" id={`tag-${mo.id}`} onKeyDown={e => { if (e.key === 'Enter') { const el = e.target as HTMLInputElement; if (el.value.trim()) { const n = { ...userTags }; n[mo.id] = [...(n[mo.id] || []), el.value.trim()]; saveTags(n); el.value = ''; } } }} />
                        </div>

                        {/* Expand/Collapse */}
                        <button className="text-[10px] text-blue-600 flex items-center gap-0.5" onClick={() => { setExpandedId(expanded ? null : mo.id); if (!expanded) addHistory(mo.id, 'Vista detalle'); }}>
                          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} {expanded ? 'Menos' : 'Más detalles'}
                        </button>

                        {expanded && (
                          <div className="space-y-2 pt-1 border-t">
                            <p className="text-[11px] text-muted-foreground">{mo.description}</p>

                            {/* Mortgage mini */}
                            {mo.price > 0 && (() => { const mg = calcMortgage(mo); return (
                              <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded text-[10px]">
                                <p className="font-medium mb-1"><Landmark className="h-3 w-3 inline mr-1" />Hipoteca ({mortgageDown}% entrada, {mortgageRate}%, {mortgageTerm}a)</p>
                                <div className="grid grid-cols-3 gap-1">
                                  <span>Entrada: {fmt(mg.dp)}</span>
                                  <span>Cuota: {fmt(mg.mp)}/mes</span>
                                  <span className={mg.cfNet >= 0 ? 'text-green-600' : 'text-red-600'}>CF neto: {fmt(mg.cfNet)}/mes</span>
                                </div>
                                <span>Yield apalancado: <strong>{mg.levYield}%</strong> sobre equity</span>
                              </div>
                            ); })()}

                            {/* Fiscal mini */}
                            {mo.price > 0 && (() => { const fx = calcFiscal(mo); return (
                              <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded text-[10px]">
                                <p className="font-medium mb-1"><Landmark className="h-3 w-3 inline mr-1" />Fiscal ({ownerType === 'sociedad' ? 'Sociedad 25%' : 'Persona física'})</p>
                                <div className="grid grid-cols-2 gap-1">
                                  <span>ITP: {fmt(fx.itp)} ({fx.itpRate}%)</span><span>Total compra: {fmt(fx.totalCompra)}</span>
                                  <span>IBI anual: {fmt(fx.ibi)}</span><span>IRPF/IS renta: {fmt(fx.irpf)}</span>
                                </div>
                                <span>Renta neta fiscal: <strong className="text-green-600">{fmt(fx.netoFiscal)}/año</strong> (tipo ef. {fx.tipoEfectivo}%)</span>
                              </div>
                            ); })()}

                            {/* Portfolio impact */}
                            {portfolioStats && (() => { const imp = calcImpact(mo); if (!imp) return null; return (
                              <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded text-[10px]">
                                <p className="font-medium mb-1"><BarChart3 className="h-3 w-3 inline mr-1" />Impacto en portfolio</p>
                                <span>Yield: {imp.cy}% → <strong>{imp.ny}%</strong> ({parseFloat(imp.change) >= 0 ? '+' : ''}{imp.change}pp) · Unidades: {imp.cu} → {imp.nu}</span>
                              </div>
                            ); })()}

                            {/* Sensitivity mini */}
                            {mo.price > 0 && (
                              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-[10px]">
                                <p className="font-medium mb-1">📉 Sensibilidad</p>
                                <div className="grid grid-cols-3 gap-1">
                                  {calcSensitivity(mo).slice(0, 3).map(s => (
                                    <span key={s.name}>{s.name}: <strong>{s.yld}%</strong> ({fmt(s.cf)})</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Due diligence */}
                            <div className="text-[10px]">
                              <p className="font-medium mb-1"><Shield className="h-3 w-3 inline mr-1" />Due Diligence</p>
                              {getChecklist(mo).map(item => {
                                const checked = checklist[mo.id]?.has(item.id);
                                return (
                                  <label key={item.id} className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={!!checked} onChange={() => { const n = { ...checklist }; if (!n[mo.id]) n[mo.id] = new Set(); if (n[mo.id].has(item.id)) n[mo.id].delete(item.id); else n[mo.id].add(item.id); saveChecks(n); }} />
                                    <span className={checked ? 'line-through text-muted-foreground' : item.critical ? 'font-medium' : ''}>{item.text}</span>
                                    {item.critical && !checked && <span className="text-red-500">*</span>}
                                  </label>
                                );
                              })}
                            </div>

                            {/* Exit strategy */}
                            {mo.price > 0 && (
                              <div className="text-[10px]">
                                <p className="font-medium mb-1"><DoorOpen className="h-3 w-3 inline mr-1" />Estrategia de salida</p>
                                <ExitStrategySimulator price={mo.price} estimatedYield={mo.estimatedYield || 0} location={mo.location} />
                              </div>
                            )}

                            {/* Renovation calculator */}
                            {mo.price > 0 && (
                              <div className="text-[10px]">
                                <p className="font-medium mb-1"><Hammer className="h-3 w-3 inline mr-1" />Calculadora de reforma</p>
                                <RenovationCalculator surface={mo.surface || 80} currentPrice={mo.price} location={mo.location} />
                              </div>
                            )}

                            {/* Neighborhood analysis */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-[10px]">
                              <NeighborhoodAnalysis location={mo.location} category={mo.category} />
                            </div>

                            {/* Notes */}
                            <div className="text-[10px]">
                              <p className="font-medium mb-1"><StickyNote className="h-3 w-3 inline mr-1" />Notas</p>
                              {(notes[mo.id] || []).map((n, i) => <div key={i} className="p-1 bg-yellow-50 dark:bg-yellow-950 rounded mb-0.5 flex justify-between"><span>{n}</span><button onClick={() => { const upd = { ...notes }; upd[mo.id] = (upd[mo.id] || []).filter((_, j) => j !== i); saveNotes(upd); }} className="text-red-400">×</button></div>)}
                              <div className="flex gap-1 mt-1">
                                <Input className="h-5 flex-1 text-[9px] px-1" placeholder="Añadir nota..." id={`note-${mo.id}`} onKeyDown={e => { if (e.key === 'Enter') { const el = document.getElementById(`note-${mo.id}`) as HTMLInputElement; if (el.value.trim()) { const upd = { ...notes }; upd[mo.id] = [...(upd[mo.id] || []), el.value.trim()]; saveNotes(upd); el.value = ''; addHistory(mo.id, 'Nota añadida'); } } }} />
                              </div>
                            </div>

                            {/* Documents */}
                            <div className="text-[10px]">
                              <p className="font-medium mb-1"><FileText className="h-3 w-3 inline mr-1" />Documentos ({(oppDocs[mo.id] || []).length})</p>
                              {(oppDocs[mo.id] || []).map((d, i) => <div key={i} className="text-muted-foreground flex justify-between"><span>📄 {d.name} ({d.date})</span><button onClick={() => { const upd = { ...oppDocs }; upd[mo.id] = (upd[mo.id] || []).filter((_, j) => j !== i); saveDocs(upd); }} className="text-red-400">×</button></div>)}
                              <input type="file" className="hidden" id={`doc-${mo.id}`} onChange={e => { const f = e.target.files?.[0]; if (f) { const upd = { ...oppDocs }; upd[mo.id] = [...(upd[mo.id] || []), { name: f.name, date: new Date().toLocaleDateString('es-ES') }]; saveDocs(upd); addHistory(mo.id, `Doc: ${f.name}`); toast.success('Documento registrado'); } }} />
                              <Button variant="ghost" size="sm" className="h-5 text-[9px] mt-0.5" onClick={() => document.getElementById(`doc-${mo.id}`)?.click()}><FileText className="h-2.5 w-2.5 mr-0.5" /> Adjuntar</Button>
                            </div>

                            {/* Watchlist / target price */}
                            <div className="flex items-center gap-1 text-[10px]">
                              <Target className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Precio objetivo:</span>
                              {watchlist[mo.id] ? (
                                <span className="flex items-center gap-1"><strong>{fmt(watchlist[mo.id])}</strong><button onClick={() => { const n = { ...watchlist }; delete n[mo.id]; saveWatchlist(n); }} className="text-red-400">×</button>{mo.price <= watchlist[mo.id] && <Badge className="bg-green-600 text-white text-[8px]">✓ Alcanzado</Badge>}</span>
                              ) : (
                                <div className="flex gap-0.5"><Input className="h-5 w-20 text-[9px] px-1" type="number" placeholder="€" id={`watch-${mo.id}`} /><Button variant="ghost" size="sm" className="h-5 text-[9px] px-1" onClick={() => { const el = document.getElementById(`watch-${mo.id}`) as HTMLInputElement; const val = el?.value; if (val) { saveWatchlist({ ...watchlist, [mo.id]: parseFloat(val) }); el.value = ''; addHistory(mo.id, `Watch: ${val}€`); } }}>Set</Button></div>
                              )}
                            </div>

                            {/* Scoring vs portfolio */}
                            {portfolioStats && (
                              <div className="flex items-center gap-2 text-[10px]">
                                <Crosshair className="h-3 w-3 text-muted-foreground" />
                                <span>Score vs portfolio: <strong className={sc > 60 ? 'text-green-600' : 'text-amber-600'}>{sc}/100</strong> (yield portfolio: {portfolioStats.avgYield}% → esta: {mo.estimatedYield || 0}%)</span>
                              </div>
                            )}

                            {/* Link to valuation */}
                            <Button variant="outline" size="sm" className="h-6 text-[10px] w-full" onClick={() => router.push(`/valoracion-ia?ciudad=${encodeURIComponent(mo.location)}&precio=${mo.price}&superficie=${mo.surface || 80}`)}>
                              <TrendingUp className="h-3 w-3 mr-1" /> Valorar con IA →
                            </Button>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-1 pt-1 flex-wrap">
                          <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1" disabled={analyzingId === mo.id} onClick={() => analyzeOpp(mo)}>
                            {analyzingId === mo.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />} IA
                          </Button>
                          <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => { setChatOpp(mo); setChatMessages([]); }}><MessageSquare className="h-3 w-3 mr-1" /> Chat</Button>
                          <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => shareOpp(mo)}><Share2 className="h-3 w-3" /></Button>
                          {mo.url && <Button variant="ghost" size="sm" className="h-6 text-[10px]" asChild><a href={mo.url} target="_blank" rel="noopener noreferrer">→</a></Button>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== PIPELINE TAB ===== */}
          <TabsContent value="pipeline" className="space-y-4">
            {/* Funnel metrics */}
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">📊 Métricas de funnel</CardTitle></CardHeader><CardContent>
              <FunnelMetrics pipeline={pipeline} totalOpps={allMarketItems.length} />
              <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center"><p className="text-muted-foreground">En análisis</p><p className="font-bold text-blue-600">{Object.values(pipeline).filter(v => v === 'analizada' || v === 'negociacion').length}</p></div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center"><p className="text-muted-foreground">Valor pipeline</p><p className="font-bold text-green-600">{fmt(allMarketItems.filter(m => ['analizada', 'negociacion', 'ofertada'].includes(pipeline[m.id])).reduce((s, m) => s + m.price, 0))}</p></div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center"><p className="text-muted-foreground">Adquiridas</p><p className="font-bold">{Object.values(pipeline).filter(v => v === 'adquirida').length}</p></div>
              </div>
            </CardContent></Card>

            {/* Bulk actions */}
            <div className="flex gap-2 items-center flex-wrap">
              <Button variant={bulkMode ? 'default' : 'outline'} size="sm" onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }}>
                <CheckSquare className="h-3 w-3 mr-1" /> {bulkMode ? 'Cancelar selección' : 'Selección múltiple'}
              </Button>
              {bulkMode && bulkSelected.size > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">{bulkSelected.size} seleccionadas</span>
                  <Select onValueChange={v => { bulkSelected.forEach(id => { savePipeline({ ...pipeline, [id]: v as PipelineStage }); }); setBulkSelected(new Set()); toast.success(`${bulkSelected.size} oportunidades → ${v}`); }}>
                    <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue placeholder="Mover a..." /></SelectTrigger>
                    <SelectContent>{PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.icon} {s.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => { const tag = prompt('Tag para todas:'); if (tag) { bulkSelected.forEach(id => { const upd = { ...userTags }; upd[id] = [...(upd[id] || []), tag]; saveTags(upd); }); toast.success(`Tag "${tag}" añadido a ${bulkSelected.size}`); } }}>
                    <Tag className="h-3 w-3 mr-1" /> Tag
                  </Button>
                </>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {PIPELINE_STAGES.map(stage => {
                const items = allMarketItems.filter(m => (pipeline[m.id] || 'descubierta') === stage.key);
                return (
                  <Card key={stage.key} className={stage.color}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{stage.icon} {stage.label} ({items.length})</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {items.length === 0 && <p className="text-xs text-muted-foreground italic">Vacío</p>}
                      {items.map(mo => (
                        <div key={mo.id} className="p-2 bg-white dark:bg-gray-900 rounded border text-[10px] space-y-1">
                          <div className="flex items-center gap-1">
                            {bulkMode && <input type="checkbox" checked={bulkSelected.has(mo.id)} onChange={() => { const n = new Set(bulkSelected); if (n.has(mo.id)) n.delete(mo.id); else n.add(mo.id); setBulkSelected(n); }} />}
                            <p className="font-medium truncate flex-1">{mo.title}</p>
                          </div>
                          <p className="text-muted-foreground">{mo.location} · {fmt(mo.price)}</p>
                          <div className="flex gap-1">
                            {mo.estimatedYield ? <Badge variant="outline" className="text-[8px]">{mo.estimatedYield}%</Badge> : null}
                            <Badge variant="outline" className={`text-[8px] ${getRiesgoColor(mo.riskLevel)}`}>{mo.riskLevel}</Badge>
                          </div>
                          <Select value={stage.key} onValueChange={v => savePipeline({ ...pipeline, [mo.id]: v as PipelineStage })}><SelectTrigger className="h-5 text-[9px]"><SelectValue /></SelectTrigger><SelectContent>{PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.icon} {s.label}</SelectItem>)}</SelectContent></Select>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ===== COMPARAR TAB ===== */}
          {showCompare && (
            <TabsContent value="comparar" className="space-y-4">
              <Card><CardHeader><CardTitle className="text-sm">⚖️ Comparación</CardTitle></CardHeader><CardContent>
                {compareIds.size < 2 ? <p className="text-sm text-muted-foreground">Selecciona 2-3 oportunidades.</p> : (
                  <div className="space-y-4">
                  {/* Radar Chart */}
                  <div className="flex justify-center">
                    <RadarChart
                      data={allMarketItems.filter(m => compareIds.has(m.id)).map((c, i) => {
                        const yS = Math.min(100, (c.estimatedYield || 0) * 10);
                        const dS = Math.min(100, c.discount * 2);
                        const rS = c.riskLevel === 'bajo' ? 100 : c.riskLevel === 'medio' ? 60 : 20;
                        const liq = ['Madrid', 'Barcelona', 'Málaga', 'Valencia'].some(x => c.location.includes(x)) ? 90 : 50;
                        const pot = c.category === 'tendencia' ? 95 : c.category === 'divergencia' ? 85 : c.category === 'subasta' ? 65 : 50;
                        return { label: c.title.slice(0, 20), color: ['#3b82f6', '#10b981', '#f59e0b'][i], values: [yS, dS, rS, liq, pot] };
                      })}
                    />
                  </div>
                  {/* Table */}
                  {(
                  <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b"><th className="p-2 text-left w-28">Métrica</th>
                    {allMarketItems.filter(m => compareIds.has(m.id)).map(c => <th key={c.id} className="p-2 text-center min-w-[180px]">{c.title.slice(0, 35)}</th>)}
                  </tr></thead><tbody>
                    {[
                      { l: 'Score IA', fn: (c: MarketOpp) => <span className={`font-bold ${getScoreColor(calcScore(c))}`}>{calcScore(c)}/100</span> },
                      { l: 'Fuente', fn: (c: MarketOpp) => `${c.sourceIcon} ${c.source}` },
                      { l: 'Precio', fn: (c: MarketOpp) => c.price > 0 ? fmt(c.price) : '-' },
                      { l: 'Descuento', fn: (c: MarketOpp) => c.discount > 0 ? <span className="text-green-600 font-bold">-{c.discount}%</span> : '-' },
                      { l: 'Yield', fn: (c: MarketOpp) => c.estimatedYield ? `${c.estimatedYield}%` : '-' },
                      { l: 'Riesgo', fn: (c: MarketOpp) => <Badge className={getRiesgoColor(c.riskLevel)}>{c.riskLevel}</Badge> },
                      { l: 'CF/mes', fn: (c: MarketOpp) => { const s = simForOpp(c); return s.cfm > 0 ? fmt(s.cfm) : '-'; } },
                      { l: 'Payback', fn: (c: MarketOpp) => `${simForOpp(c).pb} años` },
                      { l: 'ROI 5a', fn: (c: MarketOpp) => `${simForOpp(c).roi5}%` },
                      { l: 'Hipoteca (cuota)', fn: (c: MarketOpp) => c.price > 0 ? fmt(calcMortgage(c).mp) + '/mes' : '-' },
                      { l: 'CF neto hipoteca', fn: (c: MarketOpp) => c.price > 0 ? <span className={calcMortgage(c).cfNet >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(calcMortgage(c).cfNet)}/mes</span> : '-' },
                      { l: 'Impuestos compra', fn: (c: MarketOpp) => c.price > 0 ? fmt(calcFiscal(c).totalCompra) : '-' },
                      { l: 'Renta neta fiscal', fn: (c: MarketOpp) => c.price > 0 ? fmt(calcFiscal(c).netoFiscal) + '/año' : '-' },
                    ].map(row => (
                      <tr key={row.l} className="border-b"><td className="p-2 font-medium text-muted-foreground">{row.l}</td>
                        {allMarketItems.filter(m => compareIds.has(m.id)).map(c => <td key={c.id} className="p-2 text-center">{typeof row.fn(c) === 'string' ? row.fn(c) : row.fn(c)}</td>)}
                      </tr>
                    ))}
                  </tbody></table></div>
                  )}
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => { setCompareIds(new Set()); setShowCompare(false); }}><X className="h-3 w-3 mr-1" /> Limpiar</Button>
                  </div>
                )}
              </CardContent></Card>
            </TabsContent>
          )}

          {/* ===== IA TAB ===== */}
          <TabsContent value="ia" className="space-y-4">
            {opportunities.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Sin oportunidades IA. Haz clic en Actualizar.</CardContent></Card> : (
              <div className="grid gap-4 md:grid-cols-2">
                {opportunities.map(opp => (
                  <Card key={opp.id}><CardHeader className="pb-2">
                    <div className="flex flex-wrap gap-1 mb-1"><Badge variant="outline" className="text-xs capitalize">{opp.tipo.replace('_', ' ')}</Badge><Badge className={getRiesgoColor(opp.riesgo) + ' text-xs'}>{opp.riesgo}</Badge></div>
                    <CardTitle className="text-base">{opp.titulo}</CardTitle><p className="text-sm text-muted-foreground">{opp.ubicacion}</p>
                  </CardHeader><CardContent className="space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-1"><div className="bg-gray-50 dark:bg-gray-800 rounded p-1.5 text-center"><p className="text-muted-foreground">Precio</p><p className="font-bold">{fmt(opp.precioEstimado)}</p></div><div className="bg-gray-50 dark:bg-gray-800 rounded p-1.5 text-center"><p className="text-muted-foreground">Yield</p><p className="font-bold text-green-600">{opp.yieldBruto?.toFixed(1)}%</p></div><div className="bg-gray-50 dark:bg-gray-800 rounded p-1.5 text-center"><p className="text-muted-foreground">CF/mes</p><p className="font-bold text-blue-600">{opp.kpis ? fmt(opp.kpis.cashFlowMensual) : '-'}</p></div></div>
                    <p className="text-muted-foreground">{opp.argumentacion}</p>
                    {opp.factoresPositivos?.length > 0 && <div className="text-[10px]">{opp.factoresPositivos.map((f, i) => <p key={i} className="text-green-700">✓ {f}</p>)}{opp.factoresRiesgo?.map((f, i) => <p key={i} className="text-red-600">✗ {f}</p>)}</div>}
                  </CardContent></Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== PROPUESTAS TAB ===== */}
          <TabsContent value="propuestas" className="space-y-4">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Analizar Propuesta Broker</CardTitle></CardHeader><CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="space-y-1"><Label>Broker</Label><Input placeholder="Engel & Völkers..." id="broker-name" /></div><div className="space-y-1"><Label>Documento</Label><input type="file" accept=".pdf,.xlsx,.xls,.csv,.jpg,.png" id="proposal-file" className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary file:text-primary-foreground w-full" /></div></div>
              <textarea id="proposal-text" className="w-full min-h-[60px] p-2 border rounded text-sm" placeholder="O pega la propuesta aquí..." />
              <Button className="w-full" onClick={async () => {
                const f = (document.getElementById('proposal-file') as HTMLInputElement)?.files?.[0];
                const t = (document.getElementById('proposal-text') as HTMLTextAreaElement)?.value;
                if (!f && !t) { toast.error('Sube archivo o escribe'); return; }
                toast.info('Analizando (~45s)...');
                try { const fd = new FormData(); if (f) fd.append('file', f); if (t) fd.append('text', t); fd.append('broker', (document.getElementById('broker-name') as HTMLInputElement)?.value || '');
                  const res = await fetch('/api/ai/analyze-proposal', { method: 'POST', body: fd }); if (res.ok) { const d = await res.json(); toast.success(`🎯 ${d.analysis?.veredicto?.decision} (${d.analysis?.veredicto?.confianza}%)\n${d.analysis?.veredicto?.resumen}`, { duration: 20000 }); } else toast.error('Error');
                } catch { toast.error('Error conexión'); }
              }}><TrendingUp className="h-4 w-4 mr-2" /> Analizar con IA</Button>
            </CardContent></Card>
          </TabsContent>

          {/* ===== SIMULADOR TAB ===== */}
          <TabsContent value="simulador" className="space-y-4">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" /> Simulador de Inversión</CardTitle></CardHeader><CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div><Label>Precio (€)</Label><Input type="number" placeholder="350000" value={simPrecio} onChange={e => setSimPrecio(e.target.value)} /></div><div><Label>Renta/mes (€)</Label><Input type="number" placeholder="1500" value={simRenta} onChange={e => setSimRenta(e.target.value)} /></div><div><Label>Gastos/año (€)</Label><Input type="number" placeholder="3000" value={simGastos} onChange={e => setSimGastos(e.target.value)} /></div></div>
              <div className="flex gap-2"><Button onClick={simulate}><Calculator className="h-4 w-4 mr-2" /> Calcular</Button></div>
              {simResult && <div className="grid grid-cols-2 md:grid-cols-5 gap-2">{[{ l: 'Yield Bruto', v: simResult.yb.toFixed(2) + '%', c: 'text-green-600' }, { l: 'Yield Neto', v: simResult.yn.toFixed(2) + '%', c: 'text-blue-600' }, { l: 'CF/mes', v: fmt(simResult.cfm), c: '' }, { l: 'CF/año', v: fmt(simResult.cfa), c: '' }, { l: 'Payback', v: simResult.pb.toFixed(1) + ' años', c: '' }].map(k => <Card key={k.l}><CardContent className="pt-3 text-center"><p className="text-xs text-muted-foreground">{k.l}</p><p className={`text-lg font-bold ${k.c}`}>{k.v}</p></CardContent></Card>)}</div>}
              {/* Mortgage calculator section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-3"><Landmark className="h-4 w-4" /> Calculadora Hipotecaria</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">Entrada (%)</Label><Input type="number" value={mortgageDown} onChange={e => setMortgageDown(e.target.value)} /></div>
                  <div><Label className="text-xs">Tipo interés (%)</Label><Input type="number" step="0.1" value={mortgageRate} onChange={e => setMortgageRate(e.target.value)} /></div>
                  <div><Label className="text-xs">Plazo (años)</Label><Input type="number" value={mortgageTerm} onChange={e => setMortgageTerm(e.target.value)} /></div>
                </div>
                {simPrecio && simRenta && (() => {
                  const p = parseFloat(simPrecio); const dp = p * (parseFloat(mortgageDown) / 100); const loan = p - dp;
                  const mr = parseFloat(mortgageRate) / 100 / 12; const n = parseFloat(mortgageTerm) * 12;
                  const mp = mr > 0 ? loan * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1) : loan / n;
                  const rent = parseFloat(simRenta); const cfNet = rent - mp;
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                      <Card><CardContent className="pt-3 text-center"><p className="text-xs text-muted-foreground">Entrada</p><p className="text-lg font-bold">{fmt(dp)}</p></CardContent></Card>
                      <Card><CardContent className="pt-3 text-center"><p className="text-xs text-muted-foreground">Cuota/mes</p><p className="text-lg font-bold">{fmt(Math.round(mp))}</p></CardContent></Card>
                      <Card><CardContent className="pt-3 text-center"><p className="text-xs text-muted-foreground">CF neto/mes</p><p className={`text-lg font-bold ${cfNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(Math.round(cfNet))}</p></CardContent></Card>
                      <Card><CardContent className="pt-3 text-center"><p className="text-xs text-muted-foreground">Yield s/equity</p><p className="text-lg font-bold text-purple-600">{dp > 0 ? ((cfNet * 12 / dp) * 100).toFixed(1) : '0'}%</p></CardContent></Card>
                    </div>
                  );
                })()}
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* ===== ALERTAS TAB ===== */}
          <TabsContent value="alertas" className="space-y-4">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Alertas</CardTitle></CardHeader><CardContent className="space-y-3">
              <div className="flex gap-2"><Input placeholder="Descripción alerta..." value={newAlertDesc} onChange={e => setNewAlertDesc(e.target.value)} className="flex-1" /><Button onClick={() => { if (!newAlertDesc) return; setAlerts(p => [...p, { id: Date.now().toString(), desc: newAlertDesc, active: true }]); setNewAlertDesc(''); toast.success('Alerta creada'); }}><Bell className="h-4 w-4 mr-1" /> Crear</Button></div>
              {alerts.map(a => <div key={a.id} className="flex items-center justify-between p-2 border rounded"><span className="text-sm">{a.desc}</span><div className="flex gap-1.5"><Badge variant={a.active ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setAlerts(p => p.map(x => x.id === a.id ? { ...x, active: !x.active } : x))}>{a.active ? 'Activa' : 'Off'}</Badge><Button variant="ghost" size="sm" onClick={() => setAlerts(p => p.filter(x => x.id !== a.id))}><X className="h-3 w-3" /></Button></div></div>)}
              <p className="text-xs text-muted-foreground">Las notificaciones push/email se activarán próximamente.</p>
            </CardContent></Card>
          </TabsContent>

          {/* ===== HISTORIAL TAB ===== */}
          <TabsContent value="historial" className="space-y-4">
            <Card><CardHeader><CardTitle className="text-sm">📜 Historial de actividad</CardTitle></CardHeader><CardContent>
              {viewHistory.length === 0 ? <p className="text-sm text-muted-foreground">Sin actividad registrada.</p> : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {viewHistory.map((h, i) => {
                    const opp = allMarketItems.find(m => m.id === h.id);
                    return <div key={i} className="flex items-center gap-2 text-xs p-1.5 border-b"><span className="text-muted-foreground w-32 shrink-0">{new Date(h.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span><span className="font-medium">{h.action}</span><span className="text-muted-foreground truncate">{opp?.title || h.id}</span></div>;
                  })}
                </div>
              )}
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        {/* ===== CHAT MODAL ===== */}
        {chatOpp && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <Card className="w-full max-w-lg max-h-[80vh] flex flex-col">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <div><CardTitle className="text-sm"><MessageSquare className="h-4 w-4 inline mr-1" /> Chat IA — {chatOpp.title.slice(0, 40)}</CardTitle><CardDescription className="text-xs">{chatOpp.location} · {chatOpp.source}</CardDescription></div>
                <Button variant="ghost" size="sm" onClick={() => setChatOpp(null)}><X className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
                {chatMessages.length === 0 && <p className="text-xs text-muted-foreground">Pregunta lo que quieras sobre esta oportunidad. Ej: "¿Cuáles son los riesgos principales?", "¿Qué hipoteca necesitaría?", "¿Merece la pena?"</p>}
                {chatMessages.map((m, i) => (
                  <div key={i} className={`text-xs p-2 rounded-lg max-w-[85%] ${m.role === 'user' ? 'bg-blue-100 dark:bg-blue-900 ml-auto' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))}
                {chatLoading && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Pensando...</div>}
              </CardContent>
              <div className="p-3 border-t flex gap-2">
                <Input className="flex-1 text-sm" placeholder="Escribe tu pregunta..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendChat(); }} />
                <Button size="sm" onClick={sendChat} disabled={chatLoading}><Send className="h-4 w-4" /></Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
