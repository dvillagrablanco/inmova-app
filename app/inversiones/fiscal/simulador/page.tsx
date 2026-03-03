'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Calculator, TrendingUp, TrendingDown, Home, Euro, Percent, ArrowRight,
  Building2, Landmark, Scale,
} from 'lucide-react';
import { toast } from 'sonner';

type SimResult = {
  escenario: string;
  descripcion: string;
  actual: Record<string, number>;
  simulado: Record<string, number>;
  diferencia: Record<string, number>;
  recomendacion: string;
};

export default function SimuladorFiscalPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);

  if (status === 'unauthenticated') router.push('/login');

  const year = new Date().getFullYear();
  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const simulate = async (body: Record<string, any>) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/investment/fiscal/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, year }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-3.5 w-3.5" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inversiones/fiscal">Fiscal</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Simulador Fiscal</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <h1 className="text-2xl font-bold">Simulador Fiscal What-If</h1>
          <p className="text-muted-foreground">Compara escenarios y su impacto en IS, cash-flow y rentabilidad</p>
        </div>

        <Tabs defaultValue="subida" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="subida"><Percent className="h-4 w-4 mr-1" />Subir alquiler</TabsTrigger>
            <TabsTrigger value="compra"><Building2 className="h-4 w-4 mr-1" />Comprar</TabsTrigger>
            <TabsTrigger value="venta"><Euro className="h-4 w-4 mr-1" />Vender</TabsTrigger>
            <TabsTrigger value="amortizar"><Landmark className="h-4 w-4 mr-1" />Amortizar</TabsTrigger>
          </TabsList>

          {/* SUBIDA ALQUILER */}
          <TabsContent value="subida">
            <Card>
              <CardHeader>
                <CardTitle>Simular subida de alquiler</CardTitle>
                <CardDescription>¿Cuánto más ingreso neto genera una subida del X%?</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); simulate({ escenario: 'subida_alquiler', porcentajeSubida: Number(fd.get('pct')) }); }} className="space-y-4">
                  <div><Label>Porcentaje de subida (%)</Label><Input name="pct" type="number" step="0.1" defaultValue="3" min="0.1" max="100" /></div>
                  <Button type="submit" disabled={loading}><Calculator className="h-4 w-4 mr-2" />Simular</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COMPRA */}
          <TabsContent value="compra">
            <Card>
              <CardHeader>
                <CardTitle>Simular compra de inmueble</CardTitle>
                <CardDescription>Impacto en rentabilidad global y fiscalidad del grupo</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault(); const fd = new FormData(e.currentTarget);
                  const fin = Number(fd.get('ltv')) > 0 ? { ltv: Number(fd.get('ltv')), tipoInteres: Number(fd.get('tipo')), plazoAnos: Number(fd.get('plazo')) } : undefined;
                  simulate({ escenario: 'compra_inmueble', precioCompra: Number(fd.get('precio')), gastosCompra: Number(fd.get('gastos')), rentaMensualEstimada: Number(fd.get('renta')), gastosAnualesEstimados: Number(fd.get('gastosAn')), financiacion: fin });
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Precio compra (€)</Label><Input name="precio" type="number" defaultValue="200000" /></div>
                    <div><Label>Gastos compra (€)</Label><Input name="gastos" type="number" defaultValue="20000" /></div>
                    <div><Label>Renta mensual estimada (€)</Label><Input name="renta" type="number" defaultValue="900" /></div>
                    <div><Label>Gastos anuales (€)</Label><Input name="gastosAn" type="number" defaultValue="3000" /></div>
                  </div>
                  <p className="text-sm font-medium mt-2">Financiación (opcional)</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>LTV (%)</Label><Input name="ltv" type="number" defaultValue="70" /></div>
                    <div><Label>Tipo interés (%)</Label><Input name="tipo" type="number" step="0.01" defaultValue="3.5" /></div>
                    <div><Label>Plazo (años)</Label><Input name="plazo" type="number" defaultValue="25" /></div>
                  </div>
                  <Button type="submit" disabled={loading}><Calculator className="h-4 w-4 mr-2" />Simular</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VENTA */}
          <TabsContent value="venta">
            <Card>
              <CardHeader>
                <CardTitle>Simular venta de inmueble</CardTitle>
                <CardDescription>Plusvalía, IS sobre ganancia patrimonial, impacto en cash-flow</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); simulate({ escenario: 'venta_inmueble', assetId: String(fd.get('assetId')), precioVenta: Number(fd.get('precioVenta')), gastosVenta: Number(fd.get('gastosVenta')), plusvaliaMunicipal: Number(fd.get('plusvalia')) }); }} className="space-y-4">
                  <div>
                    <Label>Activo a vender</Label>
                    <p className="text-xs text-muted-foreground mb-2">Selecciona desde <a href="/inversiones/activos" className="text-blue-600 underline">la lista de activos</a> y copia el ID, o introduce los datos manualmente</p>
                    <Input name="assetId" placeholder="ID del activo (ej: cmXXXXXX)" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>Precio de venta (€)</Label><Input name="precioVenta" type="number" defaultValue="300000" /></div>
                    <div><Label>Gastos venta (€)</Label><Input name="gastosVenta" type="number" defaultValue="10000" /></div>
                    <div><Label>Plusvalía municipal (€)</Label><Input name="plusvalia" type="number" defaultValue="2000" /></div>
                  </div>
                  <Button type="submit" disabled={loading}><Calculator className="h-4 w-4 mr-2" />Simular venta</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AMORTIZACIÓN ANTICIPADA */}
          <TabsContent value="amortizar">
            <Card>
              <CardHeader>
                <CardTitle>Simular amortización anticipada de hipoteca</CardTitle>
                <CardDescription>Ahorro de intereses vs pérdida de deducción fiscal</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); simulate({ escenario: 'amortizacion_anticipada', mortgageId: String(fd.get('mortgageId')), importeAmortizacion: Number(fd.get('importe')) }); }} className="space-y-4">
                  <div>
                    <Label>Hipoteca</Label>
                    <p className="text-xs text-muted-foreground mb-2">Consulta las hipotecas en <a href="/inversiones/hipotecas" className="text-blue-600 underline">la sección de hipotecas</a></p>
                    <Input name="mortgageId" placeholder="ID de la hipoteca" />
                  </div>
                  <div><Label>Importe a amortizar (€)</Label><Input name="importe" type="number" defaultValue="30000" /></div>
                  <Button type="submit" disabled={loading}><Calculator className="h-4 w-4 mr-2" />Simular amortización</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* RESULTADO */}
        {result && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Resultado: {result.descripcion}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comparación */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="font-medium text-muted-foreground">Métrica</div>
                <div className="font-medium text-center">Actual</div>
                <div className="font-medium text-center">Simulado</div>

                {[
                  { key: 'ingresosAnuales', label: 'Ingresos anuales' },
                  { key: 'gastosDeducibles', label: 'Gastos deducibles' },
                  { key: 'amortizaciones', label: 'Amortizaciones' },
                  { key: 'interesesHipoteca', label: 'Intereses hipoteca' },
                  { key: 'baseImponible', label: 'Base imponible' },
                  { key: 'cuotaIS', label: 'Cuota IS (25%)' },
                  { key: 'cashFlowAnual', label: 'Cash-flow anual' },
                ].map(({ key, label }) => (
                  <div key={key} className="contents">
                    <div className="py-1 border-b">{label}</div>
                    <div className="py-1 border-b text-center font-mono">{fmt(result.actual[key] || 0)}</div>
                    <div className={`py-1 border-b text-center font-mono ${
                      (result.simulado[key] || 0) > (result.actual[key] || 0)
                        ? key === 'cuotaIS' ? 'text-red-600' : 'text-green-600'
                        : key === 'cuotaIS' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {fmt(result.simulado[key] || 0)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recomendación */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-1">Recomendación</p>
                <p className="text-sm text-muted-foreground">{result.recomendacion}</p>
              </div>

              {/* Impacto neto */}
              <div className="flex items-center justify-center gap-3 py-3">
                <span className="text-sm text-muted-foreground">Impacto neto anual:</span>
                <Badge variant={result.diferencia.impactoTotal >= 0 ? 'default' : 'destructive'} className="text-lg px-4 py-1">
                  {result.diferencia.impactoTotal >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {fmt(result.diferencia.impactoTotal)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
