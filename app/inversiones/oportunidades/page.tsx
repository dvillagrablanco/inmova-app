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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  TrendingUp,
  Building2,
  Home,
  Store,
  CheckCircle,
  XCircle,
  Calculator,
  Bell,
  RefreshCw,
  Euro,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

const TIPO_BADGE_CLASS: Record<string, string> = {
  edificio: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  edificio_residencial: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  local: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  vivienda: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  oficina: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  garaje: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  reforma: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
};

const RIESGO_BADGE_CLASS: Record<string, string> = {
  bajo: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  medio: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  alto: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};

const RECOMENDACION_BADGE_CLASS: Record<string, string> = {
  Comprar: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  Analizar: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  Esperar: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
};

interface Opportunity {
  id: string;
  tipo: string;
  titulo: string;
  ubicacion: string;
  precioEstimado: number;
  superficieM2?: number;
  precioM2?: number;
  rentaMensualEstimada: number;
  yieldBruto: number;
  yieldNeto?: number;
  capRate?: number;
  roi5anos?: number;
  paybackAnos?: number;
  riesgo: string;
  argumentacion: string;
  kpis?: {
    cashFlowMensual?: number;
    cashFlowAnual?: number;
    gastosEstimados?: number;
    hipotecaMensual?: number;
  };
  factoresPositivos?: string[];
  factoresRiesgo?: string[];
  recomendacion: string;
}

interface PortfolioStats {
  totalUnits: number;
  occupancy: string;
  monthlyRent: number;
  avgYield: string;
}

export default function OportunidadesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') fetchOpportunities();
  }, [status, router]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/investment/opportunities');
      if (!res.ok) throw new Error('Error cargando oportunidades');
      const data = await res.json();
      setPortfolioStats(data.portfolioStats ?? null);
      setOpportunities(data.opportunities ?? []);
    } catch {
      toast.error('Error al cargar oportunidades');
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const tipoBadgeClass = (tipo: string) => {
    const key = tipo?.toLowerCase().replace(/\s/g, '_') || 'otro';
    return TIPO_BADGE_CLASS[key] || 'bg-secondary text-secondary-foreground';
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Oportunidades</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Oportunidades de inversión</h1>
          <p className="text-muted-foreground">
            Oportunidades IA, simulador y alertas de mercado
          </p>
        </div>

        <Tabs defaultValue="oportunidades" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="oportunidades" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Oportunidades IA
            </TabsTrigger>
            <TabsTrigger value="simulador" className="gap-2">
              <Calculator className="h-4 w-4" />
              Simulador
            </TabsTrigger>
            <TabsTrigger value="alertas" className="gap-2">
              <Bell className="h-4 w-4" />
              Alertas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="oportunidades" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {portfolioStats && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{portfolioStats.totalUnits}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{portfolioStats.occupancy}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Renta Mensual</CardTitle>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {portfolioStats.monthlyRent.toLocaleString('es-ES')} €
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Yield Medio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{portfolioStats.avgYield}%</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {opportunities.map((opp) => (
                    <OpportunityCard key={opp.id} opp={opp} tipoBadgeClass={tipoBadgeClass} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="simulador">
            <SimuladorTab />
          </TabsContent>

          <TabsContent value="alertas">
            <AlertasTab />
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}

function OpportunityCard({
  opp,
  tipoBadgeClass,
}: {
  opp: Opportunity;
  tipoBadgeClass: (t: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const tipoClass = tipoBadgeClass(opp.tipo);
  const riesgoClass = RIESGO_BADGE_CLASS[opp.riesgo?.toLowerCase()] || 'bg-secondary text-secondary-foreground';
  const recClass = RECOMENDACION_BADGE_CLASS[opp.recomendacion] || 'bg-secondary text-secondary-foreground';

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={tipoClass}>
            {opp.tipo === 'edificio_residencial' ? 'Edificio' : opp.tipo}
          </Badge>
          <Badge variant="outline" className={riesgoClass}>{opp.riesgo}</Badge>
          <Badge variant="outline" className={recClass}>{opp.recomendacion}</Badge>
        </div>
        <CardTitle className="mt-2 text-base">{opp.titulo}</CardTitle>
        <p className="text-sm text-muted-foreground">{opp.ubicacion}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3 text-sm">
          <span>
            <strong>Precio:</strong>{' '}
            {opp.precioEstimado.toLocaleString('es-ES')} €
          </span>
          <span>
            <strong>Yield Bruto:</strong> {opp.yieldBruto?.toFixed(1)}%
          </span>
          <span>
            <strong>Cap Rate:</strong> {opp.capRate?.toFixed(1) ?? '-'}%
          </span>
          <span>
            <strong>ROI 5 años:</strong> {opp.roi5anos?.toFixed(0) ?? '-'}%
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{opp.argumentacion}</p>

        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              Ver detalles
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {opp.factoresPositivos?.length ? (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Factores positivos</p>
                <ul className="space-y-1">
                  {opp.factoresPositivos.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {opp.factoresRiesgo?.length ? (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Factores de riesgo</p>
                <ul className="space-y-1">
                  {opp.factoresRiesgo.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {opp.kpis && (
              <div className="rounded-md border bg-muted/50 p-3 text-sm">
                <p className="mb-1 font-medium">Cash-flow</p>
                <div className="grid grid-cols-2 gap-2">
                  <span>Mensual: {opp.kpis.cashFlowMensual?.toLocaleString('es-ES') ?? '-'} €</span>
                  <span>Anual: {opp.kpis.cashFlowAnual?.toLocaleString('es-ES') ?? '-'} €</span>
                  <span>Gastos: {opp.kpis.gastosEstimados?.toLocaleString('es-ES') ?? '-'} €</span>
                  <span>Hipoteca: {opp.kpis.hipotecaMensual?.toLocaleString('es-ES') ?? '0'} €</span>
                </div>
                {opp.paybackAnos != null && (
                  <p className="mt-2 text-muted-foreground">
                    Payback: {opp.paybackAnos.toFixed(1)} años
                  </p>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function SimuladorTab() {
  const [precioCompra, setPrecioCompra] = useState(300000);
  const [superficie, setSuperficie] = useState(80);
  const [rentaMensual, setRentaMensual] = useState(1200);
  const [ibi, setIbi] = useState(800);
  const [comunidad, setComunidad] = useState(80);
  const [seguro, setSeguro] = useState(300);
  const [mantenimiento, setMantenimiento] = useState(500);
  const [hipotecaCapital, setHipotecaCapital] = useState(0);
  const [hipotecaInteres, setHipotecaInteres] = useState(3.5);
  const [hipotecaPlazo, setHipotecaPlazo] = useState(25);
  const [results, setResults] = useState<{
    yieldBruto: number;
    gastosAnuales: number;
    yieldNeto: number;
    cashFlowMensual: number;
    roi: number;
    payback: number;
  } | null>(null);

  const simular = () => {
    const rentaAnual = rentaMensual * 12;
    const yieldBruto = precioCompra > 0 ? (rentaAnual / precioCompra) * 100 : 0;
    const gastosAnuales = ibi + comunidad * 12 + seguro + mantenimiento;
    const yieldNeto = precioCompra > 0 ? ((rentaAnual - gastosAnuales) / precioCompra) * 100 : 0;

    let hipotecaMensual = 0;
    if (hipotecaCapital > 0 && hipotecaPlazo > 0) {
      const r = hipotecaInteres / 100 / 12;
      const n = hipotecaPlazo * 12;
      hipotecaMensual = (hipotecaCapital * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const cashFlowMensual = rentaMensual - comunidad - hipotecaMensual;
    const revalorizacion = 3;
    const roi = yieldNeto + revalorizacion;
    const beneficioAnual = rentaAnual - gastosAnuales - hipotecaMensual * 12;
    const payback = beneficioAnual > 0 ? precioCompra / beneficioAnual : 0;

    setResults({
      yieldBruto,
      gastosAnuales,
      yieldNeto,
      cashFlowMensual,
      roi,
      payback,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parámetros de la inversión</CardTitle>
          <p className="text-sm text-muted-foreground">
            Introduce los datos para simular la rentabilidad
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio de compra (€)</Label>
              <Input
                id="precio"
                type="number"
                value={precioCompra}
                onChange={(e) => setPrecioCompra(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="superficie">Superficie (m²)</Label>
              <Input
                id="superficie"
                type="number"
                value={superficie}
                onChange={(e) => setSuperficie(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renta">Renta mensual estimada (€)</Label>
              <Input
                id="renta"
                type="number"
                value={rentaMensual}
                onChange={(e) => setRentaMensual(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Gastos anuales</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="ibi">IBI (€/año)</Label>
                <Input
                  id="ibi"
                  type="number"
                  value={ibi}
                  onChange={(e) => setIbi(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comunidad">Comunidad (€/mes)</Label>
                <Input
                  id="comunidad"
                  type="number"
                  value={comunidad}
                  onChange={(e) => setComunidad(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seguro">Seguro (€/año)</Label>
                <Input
                  id="seguro"
                  type="number"
                  value={seguro}
                  onChange={(e) => setSeguro(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mantenimiento">Mantenimiento (€/año)</Label>
                <Input
                  id="mantenimiento"
                  type="number"
                  value={mantenimiento}
                  onChange={(e) => setMantenimiento(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Hipoteca (opcional)</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="hipCapital">Capital financiado (€)</Label>
                <Input
                  id="hipCapital"
                  type="number"
                  value={hipotecaCapital}
                  onChange={(e) => setHipotecaCapital(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hipInteres">Interés (%)</Label>
                <Input
                  id="hipInteres"
                  type="number"
                  step={0.1}
                  value={hipotecaInteres}
                  onChange={(e) => setHipotecaInteres(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hipPlazo">Plazo (años)</Label>
                <Input
                  id="hipPlazo"
                  type="number"
                  value={hipotecaPlazo}
                  onChange={(e) => setHipotecaPlazo(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <Button onClick={simular} className="w-full sm:w-auto">
            <Calculator className="mr-2 h-4 w-4" />
            Simular
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Yield Bruto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.yieldBruto.toFixed(2)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Yield Neto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.yieldNeto.toFixed(2)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cash-flow Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {results.cashFlowMensual.toLocaleString('es-ES')} €
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">ROI (neto + 3% revalorización)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.roi.toFixed(2)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Payback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.payback.toFixed(1)} años</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Gastos Anuales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {results.gastosAnuales.toLocaleString('es-ES')} €
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function AlertasTab() {
  const alerts = [
    { id: 1, text: 'Edificio Madrid centro < €3.000/m²', icon: Building2 },
    { id: 2, text: 'Local comercial yield > 8%', icon: Store },
    { id: 3, text: 'Vivienda Marbella < €500.000', icon: Home },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <p className="mb-6 text-sm text-muted-foreground">
            Las alertas se activarán próximamente con integración de APIs de portales inmobiliarios
          </p>
          <div className="space-y-4">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <a.icon className="h-5 w-5 text-muted-foreground" />
                  <span>{a.text}</span>
                </div>
                <Switch disabled />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
