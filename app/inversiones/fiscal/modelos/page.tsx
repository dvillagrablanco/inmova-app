'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  FileText, Calculator, Download, Euro, Calendar, AlertTriangle,
  Building2, Receipt, Users, Home,
} from 'lucide-react';
import { toast } from 'sonner';

type ModeloData = Record<string, any>;

export default function ModelosTributariosPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ejercicio, setEjercicio] = useState(new Date().getFullYear());
  const [modelo202, setModelo202] = useState<ModeloData | null>(null);
  const [modelo200, setModelo200] = useState<ModeloData | null>(null);
  const [modelo303, setModelo303] = useState<ModeloData | null>(null);
  const [modelo347, setModelo347] = useState<ModeloData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchModelo = async (modelo: string, params: Record<string, string>) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ ejercicio: String(ejercicio), ...params }).toString();
      const res = await fetch(`/api/investment/fiscal/${modelo}?${qs}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    } catch (err: any) {
      toast.error(`Error generando ${modelo}: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadModelo202 = async (periodo: string) => {
    const data = await fetchModelo('modelo-202', { periodo });
    if (data) setModelo202(data);
  };

  const loadModelo200 = async () => {
    const data = await fetchModelo('modelo-200', {});
    if (data) setModelo200(data);
  };

  const loadModelo303 = async (trimestre: string) => {
    const data = await fetchModelo('modelo-303', { trimestre });
    if (data) setModelo303(data);
  };

  const loadModelo347 = async () => {
    const data = await fetchModelo('modelo-347', {});
    if (data) setModelo347(data);
  };

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

  if (status === 'loading') return null;

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
              <BreadcrumbPage>Modelos Tributarios</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Modelos Tributarios</h1>
            <p className="text-muted-foreground">Generación automática de borradores fiscales para sociedades patrimoniales</p>
          </div>
          <Select value={String(ejercicio)} onValueChange={(v) => setEjercicio(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="202" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="202">Modelo 202</TabsTrigger>
            <TabsTrigger value="200">Modelo 200</TabsTrigger>
            <TabsTrigger value="303">Modelo 303</TabsTrigger>
            <TabsTrigger value="347">Modelo 347</TabsTrigger>
          </TabsList>

          {/* MODELO 202 */}
          <TabsContent value="202" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Modelo 202 — Pago Fraccionado IS
                </CardTitle>
                <CardDescription>
                  Pago a cuenta del Impuesto de Sociedades. Trimestral: abril (1P), octubre (2P), diciembre (3P).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {['1P', '2P', '3P'].map(p => (
                    <Button key={p} variant="outline" onClick={() => loadModelo202(p)} disabled={loading}>
                      <Calendar className="h-4 w-4 mr-1" />
                      {p === '1P' ? 'Abril' : p === '2P' ? 'Octubre' : 'Diciembre'} ({p})
                    </Button>
                  ))}
                </div>
                {modelo202 && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Empresa</span>
                      <span className="font-medium">{modelo202.companyName} ({modelo202.cif})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Base imponible último IS</span>
                      <span className="font-mono">{fmt(modelo202.baseImponibleUltimoIS)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Porcentaje ({modelo202.porcentajePagoFraccionado}%)</span>
                      <span className="font-mono font-bold text-primary">{fmt(modelo202.importePagoFraccionado)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">A ingresar</span>
                      <span className="font-mono font-bold text-lg">{fmt(modelo202.resultadoAIngresar)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Fecha límite: {modelo202.fechaLimite}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODELO 200 */}
          <TabsContent value="200" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Modelo 200 — Declaración Anual IS
                </CardTitle>
                <CardDescription>
                  Declaración del Impuesto de Sociedades. Plazo: 1-25 de julio del año siguiente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={loadModelo200} disabled={loading}>
                  <Calculator className="h-4 w-4 mr-1" /> Generar borrador {ejercicio}
                </Button>
                {modelo200 && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold">{modelo200.companyName} — Ejercicio {modelo200.ejercicio}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-green-600 mb-2">Ingresos</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span>Alquiler residencial</span><span className="font-mono">{fmt(modelo200.ingresosAlquilerResidencial)}</span></div>
                          <div className="flex justify-between"><span>Alquiler comercial</span><span className="font-mono">{fmt(modelo200.ingresosAlquilerComercial)}</span></div>
                          <div className="flex justify-between font-semibold border-t pt-1"><span>Total ingresos</span><span className="font-mono">{fmt(modelo200.ingresosBrutos)}</span></div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-red-600 mb-2">Gastos deducibles</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span>IBI</span><span className="font-mono">{fmt(modelo200.ibi)}</span></div>
                          <div className="flex justify-between"><span>Comunidad</span><span className="font-mono">{fmt(modelo200.comunidad)}</span></div>
                          <div className="flex justify-between"><span>Seguros</span><span className="font-mono">{fmt(modelo200.seguros)}</span></div>
                          <div className="flex justify-between"><span>Reparaciones</span><span className="font-mono">{fmt(modelo200.reparacionesConservacion)}</span></div>
                          <div className="flex justify-between"><span>Amortizaciones</span><span className="font-mono">{fmt(modelo200.amortizaciones)}</span></div>
                          <div className="flex justify-between"><span>Intereses hipoteca</span><span className="font-mono">{fmt(modelo200.interesesHipoteca)}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between"><span>Base imponible</span><span className="font-mono">{fmt(modelo200.baseImponible)}</span></div>
                      <div className="flex justify-between"><span>Cuota íntegra (25%)</span><span className="font-mono">{fmt(modelo200.cuotaIntegra)}</span></div>
                      <div className="flex justify-between"><span>Pagos fraccionados (Mod. 202)</span><span className="font-mono">-{fmt(modelo200.pagosFraccionados)}</span></div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>{modelo200.resultadoDeclaracion === 'a_ingresar' ? 'A ingresar' : modelo200.resultadoDeclaracion === 'a_devolver' ? 'A devolver' : 'Cuota cero'}</span>
                        <span className={modelo200.resultadoDeclaracion === 'a_devolver' ? 'text-green-600' : 'text-primary'}>{fmt(modelo200.importeFinal)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Fecha límite: {modelo200.fechaLimite}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODELO 303 */}
          <TabsContent value="303" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Modelo 303 — IVA Trimestral
                </CardTitle>
                <CardDescription>
                  Solo aplica a alquileres de locales comerciales, oficinas y naves (21% IVA). Alquileres residenciales están exentos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(t => (
                    <Button key={t} variant="outline" onClick={() => loadModelo303(String(t))} disabled={loading}>
                      <Calendar className="h-4 w-4 mr-1" /> T{t}
                    </Button>
                  ))}
                </div>
                {modelo303 && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold">{modelo303.companyName} — T{modelo303.trimestre} {modelo303.ejercicio}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Base IVA repercutido</span><span className="font-mono">{fmt(modelo303.baseIVARepercutido)}</span></div>
                      <div className="flex justify-between"><span>IVA repercutido ({modelo303.tipoIVA}%)</span><span className="font-mono text-red-600">{fmt(modelo303.ivaRepercutido)}</span></div>
                      <div className="flex justify-between"><span>Base IVA soportado</span><span className="font-mono">{fmt(modelo303.baseIVASoportado)}</span></div>
                      <div className="flex justify-between"><span>IVA soportado ({modelo303.tipoIVA}%)</span><span className="font-mono text-green-600">-{fmt(modelo303.ivaSoportado)}</span></div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>A ingresar</span>
                        <span className="font-mono text-lg">{fmt(modelo303.resultadoAIngresar)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Fecha límite: {modelo303.fechaLimite}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODELO 347 */}
          <TabsContent value="347" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Modelo 347 — Operaciones con Terceros
                </CardTitle>
                <CardDescription>
                  Declaración anual de operaciones con terceros que superen 3.005,06€.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={loadModelo347} disabled={loading}>
                  <Calculator className="h-4 w-4 mr-1" /> Generar borrador {ejercicio}
                </Button>
                {modelo347 && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{modelo347.companyName}</h3>
                      <Badge variant="secondary">{modelo347.totalOperaciones} operaciones</Badge>
                    </div>
                    {modelo347.operaciones.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay operaciones que superen el umbral de {fmt(modelo347.umbral)}</p>
                    ) : (
                      <div className="space-y-2">
                        {modelo347.operaciones.map((op: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-sm border-b pb-1">
                            <div>
                              <span className="font-medium">{op.terceroNombre}</span>
                              <span className="text-muted-foreground ml-2">({op.terceroNIF})</span>
                              <Badge variant="outline" className="ml-2 text-xs">{op.clave === 'A' ? 'Compras' : 'Ventas'}</Badge>
                            </div>
                            <span className="font-mono">{fmt(op.importeAnual)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
