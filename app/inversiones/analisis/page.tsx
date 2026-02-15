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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2, Plus, Trash2, Calculator, Euro, TrendingUp, Landmark,
  ArrowUpRight, ArrowDownRight, Table2, Save, ParkingCircle, Store, Home,
} from 'lucide-react';
import { toast } from 'sonner';

interface RentRollEntry {
  tipo: 'vivienda' | 'garaje' | 'local' | 'trastero' | 'oficina' | 'otro';
  referencia: string;
  superficie: number;
  rentaMensual: number;
  estado: 'alquilado' | 'vacio' | 'reforma';
}

const TIPO_ICONS: Record<string, any> = {
  vivienda: Home,
  garaje: ParkingCircle,
  local: Store,
  trastero: Building2,
  oficina: Building2,
  otro: Building2,
};

const TIPO_LABELS: Record<string, string> = {
  vivienda: 'Vivienda',
  garaje: 'Garaje',
  local: 'Local',
  trastero: 'Trastero',
  oficina: 'Oficina',
  otro: 'Otro',
};

export default function AnalisisInversionPage() {
  const { status } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [askingPrice, setAskingPrice] = useState<number>(0);

  // Gastos compra
  const [gastosNotaria, setGastosNotaria] = useState(3000);
  const [gastosRegistro, setGastosRegistro] = useState(1500);
  const [impuestoCompra, setImpuestoCompra] = useState(10); // ITP %
  const [comisionCompra, setComisionCompra] = useState(0);
  const [otrosGastosCompra, setOtrosGastosCompra] = useState(0);

  // CAPEX
  const [capexReforma, setCapexReforma] = useState(0);
  const [capexImprevistos, setCapexImprevistos] = useState(10);
  const [capexOtros, setCapexOtros] = useState(0);

  // OPEX
  const [ibiAnual, setIbiAnual] = useState(0);
  const [comunidadMensual, setComunidadMensual] = useState(0);
  const [seguroAnual, setSeguroAnual] = useState(0);
  const [mantenimientoAnual, setMantenimientoAnual] = useState(0);
  const [gestionAdminPct, setGestionAdminPct] = useState(0);
  const [vacioEstimadoPct, setVacioEstimadoPct] = useState(5);
  const [comisionAlquilerPct, setComisionAlquilerPct] = useState(0);
  const [otrosGastosAnuales, setOtrosGastosAnuales] = useState(0);

  // Financiacion
  const [usaFinanciacion, setUsaFinanciacion] = useState(false);
  const [ltv, setLtv] = useState(70);
  const [tipoInteres, setTipoInteres] = useState(3.5);
  const [plazoAnos, setPlazoAnos] = useState(25);
  const [comisionApertura, setComisionApertura] = useState(0.5);

  // Rent Roll
  const [rentRoll, setRentRoll] = useState<RentRollEntry[]>([
    { tipo: 'vivienda', referencia: '', superficie: 0, rentaMensual: 0, estado: 'alquilado' },
  ]);

  const [notas, setNotas] = useState('');

  if (status === 'unauthenticated') { router.push('/login'); }

  const addUnit = (tipo: RentRollEntry['tipo'] = 'vivienda') => {
    setRentRoll([...rentRoll, { tipo, referencia: '', superficie: 0, rentaMensual: 0, estado: 'alquilado' }]);
  };

  const removeUnit = (idx: number) => {
    setRentRoll(rentRoll.filter((_, i) => i !== idx));
  };

  const updateUnit = (idx: number, field: keyof RentRollEntry, value: any) => {
    const updated = [...rentRoll];
    (updated[idx] as any)[field] = value;
    setRentRoll(updated);
  };

  const totalRentaMensual = rentRoll.reduce((s, u) => s + u.rentaMensual, 0);
  const totalRentaAnual = totalRentaMensual * 12;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const handleCalcular = async () => {
    if (!nombre || askingPrice <= 0 || rentRoll.length === 0) {
      toast.error('Completa nombre, precio y al menos 1 unidad');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/investment/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, direccion, askingPrice,
          gastosNotaria, gastosRegistro, impuestoCompra,
          comisionCompra, otrosGastosCompra,
          capexReforma, capexImprevistos, capexOtros,
          ibiAnual, comunidadMensual, seguroAnual, mantenimientoAnual,
          gestionAdminPct, vacioEstimadoPct, comisionAlquilerPct, otrosGastosAnuales,
          usaFinanciacion, ltv, tipoInteres, plazoAnos, comisionApertura,
          rentRoll, notas,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Error en el calculo');
        return;
      }

      const data = await res.json();
      setResults(data.data.results);
      toast.success('Analisis calculado y guardado');
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analisis de Inversion</h1>
          <p className="text-gray-500">Introduce el rent roll y datos del activo para calcular rentabilidad y sensibilidad</p>
        </div>

        <Tabs defaultValue="datos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="datos">Datos del Activo</TabsTrigger>
            <TabsTrigger value="rentroll">Rent Roll</TabsTrigger>
            <TabsTrigger value="gastos">OPEX / CAPEX</TabsTrigger>
            <TabsTrigger value="financiacion">Financiacion</TabsTrigger>
            {results && <TabsTrigger value="resultados">Resultados</TabsTrigger>}
            {results && <TabsTrigger value="sensibilidad">Sensibilidad</TabsTrigger>}
          </TabsList>

          {/* TAB: Datos del activo */}
          <TabsContent value="datos">
            <Card>
              <CardHeader>
                <CardTitle>Datos del Activo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre del analisis *</Label>
                    <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Edificio Calle Mayor 12" />
                  </div>
                  <div>
                    <Label>Direccion</Label>
                    <Input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle, numero, ciudad" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Precio que piden (asking price) *</Label>
                    <Input type="number" value={askingPrice || ''} onChange={e => setAskingPrice(Number(e.target.value))} placeholder="500000" />
                    <p className="text-xs text-gray-400 mt-1">Techo maximo para la tabla de sensibilidad</p>
                  </div>
                </div>
                <div>
                  <Label>Gastos de compra</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                    <div><Label className="text-xs">Notaria</Label><Input type="number" value={gastosNotaria} onChange={e => setGastosNotaria(Number(e.target.value))} /></div>
                    <div><Label className="text-xs">Registro</Label><Input type="number" value={gastosRegistro} onChange={e => setGastosRegistro(Number(e.target.value))} /></div>
                    <div><Label className="text-xs">ITP/IVA (%)</Label><Input type="number" value={impuestoCompra} onChange={e => setImpuestoCompra(Number(e.target.value))} /></div>
                    <div><Label className="text-xs">Comision compra (%)</Label><Input type="number" value={comisionCompra} onChange={e => setComisionCompra(Number(e.target.value))} /></div>
                    <div><Label className="text-xs">Otros gastos</Label><Input type="number" value={otrosGastosCompra} onChange={e => setOtrosGastosCompra(Number(e.target.value))} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Rent Roll */}
          <TabsContent value="rentroll">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Rent Roll</CardTitle>
                    <CardDescription>
                      {rentRoll.length} unidades | Renta mensual: {fmt(totalRentaMensual)} | Anual: {fmt(totalRentaAnual)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => addUnit('vivienda')}><Home className="h-3 w-3 mr-1" />Vivienda</Button>
                    <Button size="sm" variant="outline" onClick={() => addUnit('garaje')}><ParkingCircle className="h-3 w-3 mr-1" />Garaje</Button>
                    <Button size="sm" variant="outline" onClick={() => addUnit('local')}><Store className="h-3 w-3 mr-1" />Local</Button>
                    <Button size="sm" variant="outline" onClick={() => addUnit('trastero')}>Trastero</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-2">
                    <div className="col-span-2">Tipo</div>
                    <div className="col-span-2">Referencia</div>
                    <div className="col-span-2">m2</div>
                    <div className="col-span-2">Renta/mes</div>
                    <div className="col-span-2">Estado</div>
                    <div className="col-span-2"></div>
                  </div>
                  {rentRoll.map((unit, idx) => {
                    const Icon = TIPO_ICONS[unit.tipo] || Building2;
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2">
                        <div className="col-span-2">
                          <Select value={unit.tipo} onValueChange={v => updateUnit(idx, 'tipo', v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(TIPO_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input className="h-8 text-sm" placeholder="1A" value={unit.referencia}
                            onChange={e => updateUnit(idx, 'referencia', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <Input className="h-8 text-sm" type="number" placeholder="75" value={unit.superficie || ''}
                            onChange={e => updateUnit(idx, 'superficie', Number(e.target.value))} />
                        </div>
                        <div className="col-span-2">
                          <Input className="h-8 text-sm" type="number" placeholder="800" value={unit.rentaMensual || ''}
                            onChange={e => updateUnit(idx, 'rentaMensual', Number(e.target.value))} />
                        </div>
                        <div className="col-span-2">
                          <Select value={unit.estado} onValueChange={v => updateUnit(idx, 'estado', v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alquilado">Alquilado</SelectItem>
                              <SelectItem value="vacio">Vacio</SelectItem>
                              <SelectItem value="reforma">En reforma</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          {rentRoll.length > 1 && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => removeUnit(idx)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resumen por tipo */}
                <div className="flex gap-3 mt-4 pt-4 border-t">
                  {(['vivienda', 'garaje', 'local', 'trastero'] as const).map(tipo => {
                    const count = rentRoll.filter(u => u.tipo === tipo).length;
                    const renta = rentRoll.filter(u => u.tipo === tipo).reduce((s, u) => s + u.rentaMensual, 0);
                    if (count === 0) return null;
                    return (
                      <Badge key={tipo} variant="outline" className="text-xs">
                        {TIPO_LABELS[tipo]}: {count} ud. | {fmt(renta)}/mes
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: OPEX / CAPEX */}
          <TabsContent value="gastos">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">OPEX (Gastos recurrentes anuales)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label className="text-sm">IBI anual</Label><Input type="number" value={ibiAnual} onChange={e => setIbiAnual(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Comunidad mensual</Label><Input type="number" value={comunidadMensual} onChange={e => setComunidadMensual(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Seguro anual</Label><Input type="number" value={seguroAnual} onChange={e => setSeguroAnual(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Mantenimiento anual</Label><Input type="number" value={mantenimientoAnual} onChange={e => setMantenimientoAnual(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Gestion/Admin (% renta bruta)</Label><Input type="number" value={gestionAdminPct} onChange={e => setGestionAdminPct(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Vacio estimado (%)</Label><Input type="number" value={vacioEstimadoPct} onChange={e => setVacioEstimadoPct(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Comision alquiler (% nueva contratacion)</Label><Input type="number" value={comisionAlquilerPct} onChange={e => setComisionAlquilerPct(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Otros gastos anuales</Label><Input type="number" value={otrosGastosAnuales} onChange={e => setOtrosGastosAnuales(Number(e.target.value))} /></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">CAPEX (Inversiones)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label className="text-sm">Reforma/Rehabilitacion</Label><Input type="number" value={capexReforma} onChange={e => setCapexReforma(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Imprevistos (% sobre CAPEX)</Label><Input type="number" value={capexImprevistos} onChange={e => setCapexImprevistos(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Otros CAPEX</Label><Input type="number" value={capexOtros} onChange={e => setCapexOtros(Number(e.target.value))} /></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: Financiacion */}
          <TabsContent value="financiacion">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Landmark className="h-5 w-5" /> Financiacion</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Usar financiacion</Label>
                    <Switch checked={usaFinanciacion} onCheckedChange={setUsaFinanciacion} />
                  </div>
                </div>
              </CardHeader>
              {usaFinanciacion && (
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><Label className="text-sm">LTV (% financiado)</Label><Input type="number" value={ltv} onChange={e => setLtv(Number(e.target.value))} /></div>
                    <div><Label className="text-sm">Tipo interes anual (%)</Label><Input type="number" step="0.1" value={tipoInteres} onChange={e => setTipoInteres(Number(e.target.value))} /></div>
                    <div><Label className="text-sm">Plazo (anos)</Label><Input type="number" value={plazoAnos} onChange={e => setPlazoAnos(Number(e.target.value))} /></div>
                    <div><Label className="text-sm">Comision apertura (%)</Label><Input type="number" step="0.1" value={comisionApertura} onChange={e => setComisionApertura(Number(e.target.value))} /></div>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* TAB: Resultados */}
          {results && (
            <TabsContent value="resultados">
              <div className="space-y-4">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card><CardContent className="p-4">
                    <div className="text-sm text-gray-500">Yield Bruto</div>
                    <div className="text-2xl font-bold">{results.yieldBruto}%</div>
                  </CardContent></Card>
                  <Card><CardContent className="p-4">
                    <div className="text-sm text-gray-500">Yield Neto</div>
                    <div className="text-2xl font-bold text-blue-600">{results.yieldNeto}%</div>
                  </CardContent></Card>
                  <Card><CardContent className="p-4">
                    <div className="text-sm text-gray-500">Cash-on-Cash</div>
                    <div className="text-2xl font-bold text-green-600">{results.cashOnCash}%</div>
                  </CardContent></Card>
                  <Card><CardContent className="p-4">
                    <div className="text-sm text-gray-500">Payback</div>
                    <div className="text-2xl font-bold">{results.paybackAnos < 100 ? `${results.paybackAnos} anos` : 'N/A'}</div>
                  </CardContent></Card>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Ingresos */}
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Ingresos</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Renta bruta mensual</span><span className="font-medium">{fmt(results.rentaBrutaMensual)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Renta bruta anual</span><span className="font-medium">{fmt(results.rentaBrutaAnual)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">(-) Ajuste vacio ({vacioEstimadoPct}%)</span><span className="text-red-600">-{fmt(results.ajusteVacio)}</span></div>
                      <div className="flex justify-between border-t pt-2 font-bold"><span>Renta efectiva anual</span><span>{fmt(results.rentaEfectivaAnual)}</span></div>
                    </CardContent>
                  </Card>

                  {/* Inversion */}
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Inversion</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Precio compra</span><span className="font-medium">{fmt(askingPrice)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Gastos compra</span><span>{fmt(results.totalGastosCompra)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">CAPEX</span><span>{fmt(results.totalCapex)}</span></div>
                      <div className="flex justify-between border-t pt-2 font-bold"><span>Inversion total</span><span>{fmt(results.inversionTotal)}</span></div>
                      {usaFinanciacion && <>
                        <div className="flex justify-between"><span className="text-gray-500">Hipoteca ({ltv}%)</span><span>-{fmt(results.importeHipoteca)}</span></div>
                        <div className="flex justify-between font-bold"><span>Capital propio</span><span className="text-blue-600">{fmt(results.capitalPropio)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Cuota mensual</span><span>{fmt(results.cuotaMensual)}</span></div>
                      </>}
                    </CardContent>
                  </Card>

                  {/* OPEX */}
                  <Card>
                    <CardHeader><CardTitle className="text-lg">OPEX Anual</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">IBI</span><span>{fmt(results.detalleOpex.ibi)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Comunidad</span><span>{fmt(results.detalleOpex.comunidad)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Seguro</span><span>{fmt(results.detalleOpex.seguro)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Mantenimiento</span><span>{fmt(results.detalleOpex.mantenimiento)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Gestion admin</span><span>{fmt(results.detalleOpex.gestionAdmin)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Comisiones alquiler</span><span>{fmt(results.detalleOpex.comisionAlquiler)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Otros</span><span>{fmt(results.detalleOpex.otros)}</span></div>
                      <div className="flex justify-between border-t pt-2 font-bold"><span>Total OPEX</span><span className="text-red-600">{fmt(results.opexAnual)}</span></div>
                    </CardContent>
                  </Card>

                  {/* Cash-flow */}
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Cash-Flow Anual</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-green-500" />Renta efectiva</span><span className="text-green-600">+{fmt(results.rentaEfectivaAnual)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><ArrowDownRight className="h-3 w-3 text-red-500" />OPEX</span><span className="text-red-600">-{fmt(results.opexAnual)}</span></div>
                      <div className="flex justify-between font-medium"><span>NOI</span><span>{fmt(results.noiAnual)}</span></div>
                      {usaFinanciacion && (
                        <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><Landmark className="h-3 w-3" />Hipoteca anual</span><span className="text-red-600">-{fmt(results.cuotaAnual)}</span></div>
                      )}
                      <div className="flex justify-between border-t pt-2 font-bold text-lg">
                        <span>Cash-Flow pre-tax</span>
                        <span className={results.cashFlowAnualPreTax >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(results.cashFlowAnualPreTax)}</span>
                      </div>
                      <div className="text-xs text-gray-400 text-right">= {fmt(results.cashFlowAnualPreTax / 12)}/mes</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rent Roll Summary */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">Resumen Rent Roll</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="outline">{results.rentRollSummary.totalUnidades} unidades</Badge>
                      {results.rentRollSummary.viviendas > 0 && <Badge variant="outline">{results.rentRollSummary.viviendas} viviendas</Badge>}
                      {results.rentRollSummary.garajes > 0 && <Badge variant="outline">{results.rentRollSummary.garajes} garajes</Badge>}
                      {results.rentRollSummary.locales > 0 && <Badge variant="outline">{results.rentRollSummary.locales} locales</Badge>}
                      {results.rentRollSummary.trasteros > 0 && <Badge variant="outline">{results.rentRollSummary.trasteros} trasteros</Badge>}
                      <Badge variant="outline">Ocupacion actual: {results.rentRollSummary.ocupacionActual}%</Badge>
                      <Badge variant="outline">{results.rentRollSummary.superficieTotal} m2</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* TAB: Sensibilidad */}
          {results && (
            <TabsContent value="sensibilidad">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Table2 className="h-5 w-5" /> Tabla de Sensibilidad</CardTitle>
                  <CardDescription>Partiendo del asking price ({fmt(askingPrice)}) como maximo, bajando en escalones del 5%</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium">Precio</th>
                          <th className="text-right p-3 font-medium">Dto.</th>
                          <th className="text-right p-3 font-medium">Inversion</th>
                          <th className="text-right p-3 font-medium">Capital propio</th>
                          {usaFinanciacion && <th className="text-right p-3 font-medium">Cuota/mes</th>}
                          <th className="text-right p-3 font-medium">Yield bruto</th>
                          <th className="text-right p-3 font-medium">Yield neto</th>
                          <th className="text-right p-3 font-medium">Cash-on-Cash</th>
                          <th className="text-right p-3 font-medium">CF mensual</th>
                          <th className="text-right p-3 font-medium">CF anual</th>
                          <th className="text-right p-3 font-medium">Payback</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {results.tablaSensibilidad.map((row: any, idx: number) => (
                          <tr key={idx} className={idx === 0 ? 'bg-red-50/50' : row.descuentoPct >= 15 ? 'bg-green-50/50' : ''}>
                            <td className="p-3 font-medium">{fmt(row.precio)}</td>
                            <td className="p-3 text-right">
                              {row.descuentoPct === 0
                                ? <Badge className="bg-red-100 text-red-700 text-xs">Asking</Badge>
                                : <span className="text-green-600">-{row.descuentoPct}%</span>
                              }
                            </td>
                            <td className="p-3 text-right">{fmt(row.inversionTotal)}</td>
                            <td className="p-3 text-right">{fmt(row.capitalPropio)}</td>
                            {usaFinanciacion && <td className="p-3 text-right">{fmt(row.cuotaMensual)}</td>}
                            <td className="p-3 text-right font-medium">{row.yieldBruto}%</td>
                            <td className="p-3 text-right font-medium text-blue-600">{row.yieldNeto}%</td>
                            <td className="p-3 text-right font-medium text-green-600">{row.cashOnCash}%</td>
                            <td className={`p-3 text-right font-medium ${row.cashFlowMensual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {fmt(row.cashFlowMensual)}
                            </td>
                            <td className={`p-3 text-right font-medium ${row.cashFlowAnual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {fmt(row.cashFlowAnual)}
                            </td>
                            <td className="p-3 text-right">{row.paybackAnos < 100 ? `${row.paybackAnos}a` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Rojo = asking price (techo). Verde = zona de descuento favorable. El cash-flow incluye hipoteca si se usa financiacion.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Boton calcular */}
        <div className="flex gap-3">
          <Button onClick={handleCalcular} disabled={saving} size="lg">
            <Calculator className="h-4 w-4 mr-2" />
            {saving ? 'Calculando...' : 'Calcular y Guardar'}
          </Button>
          {results && (
            <Button variant="outline" onClick={() => setResults(null)}>
              Nuevo analisis
            </Button>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
