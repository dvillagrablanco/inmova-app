'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Home, BedDouble, Palmtree, Hammer,
  Calculator, TrendingUp, TrendingDown, Euro, Plus, Trash2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import {
  calculateTraditionalRental,
  calculateRoomRental,
  calculateTouristRental,
  calculateFlip,
  type TraditionalRentalInput,
  type TraditionalRentalResult,
  type RoomRentalInput,
  type RoomRentalResult,
  type TouristRentalInput,
  type TouristRentalResult,
  type FlipInput,
  type FlipResult,
} from '@/lib/investment-calculators';

function fmt(n: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number): string {
  return n.toFixed(2) + '%';
}

function ResultBadge({ value, suffix = '€', positive = true }: { value: number; suffix?: string; positive?: boolean }) {
  const isGood = positive ? value > 0 : value < 0;
  return (
    <span className={`font-bold ${isGood ? 'text-green-600' : value === 0 ? 'text-gray-500' : 'text-red-600'}`}>
      {fmt(value)}{suffix}
    </span>
  );
}

function NumberInput({ label, value, onChange, suffix, hint, min = 0, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string; hint?: string; min?: number; step?: number;
}) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-1 mt-1">
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          step={step}
          className="h-9"
        />
        {suffix && <span className="text-xs text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function GastosTable({ gastos }: { gastos: { concepto: string; importe: number }[] }) {
  return (
    <div className="space-y-1">
      {gastos.map((g, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-muted-foreground">{g.concepto}</span>
          <span className="font-medium">{fmt(g.importe)} €</span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ============================================================================
// ALQUILER TRADICIONAL
// ============================================================================
function TraditionalCalc() {
  const [input, setInput] = useState<TraditionalRentalInput>({
    precioCompra: 120000,
    gastosCompra: 12000,
    reformaInicial: 15000,
    rentaMensual: 750,
    gastosComAnnual: 600,
    ibiAnual: 400,
    seguroHogar: 250,
    seguroImpago: 270,
    derramaAnual: 0,
    mesesVacioAnuales: 0.5,
    gastosMantenimiento: 500,
    gastosGestion: 0,
    hipotecaMensual: 0,
    incrementoIpcAnual: 3,
  });
  const [result, setResult] = useState<TraditionalRentalResult | null>(null);

  const calcular = () => setResult(calculateTraditionalRental(input));
  const upd = (k: keyof TraditionalRentalInput) => (v: number) => setInput(p => ({ ...p, [k]: v }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Datos de la operación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Precio compra" value={input.precioCompra} onChange={upd('precioCompra')} suffix="€" />
            <NumberInput label="Gastos compra" value={input.gastosCompra} onChange={upd('gastosCompra')} suffix="€" hint="ITP, notaría, registro" />
            <NumberInput label="Reforma inicial" value={input.reformaInicial} onChange={upd('reformaInicial')} suffix="€" />
            <NumberInput label="Renta mensual" value={input.rentaMensual} onChange={upd('rentaMensual')} suffix="€/mes" />
          </div>
          <h4 className="font-medium text-sm pt-2">Gastos anuales</h4>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Comunidad" value={input.gastosComAnnual} onChange={upd('gastosComAnnual')} suffix="€/año" />
            <NumberInput label="IBI" value={input.ibiAnual} onChange={upd('ibiAnual')} suffix="€/año" />
            <NumberInput label="Seguro hogar" value={input.seguroHogar} onChange={upd('seguroHogar')} suffix="€/año" />
            <NumberInput label="Seguro impago" value={input.seguroImpago} onChange={upd('seguroImpago')} suffix="€/año" hint="3-5% renta anual" />
            <NumberInput label="Derramas" value={input.derramaAnual} onChange={upd('derramaAnual')} suffix="€/año" />
            <NumberInput label="Mantenimiento" value={input.gastosMantenimiento} onChange={upd('gastosMantenimiento')} suffix="€/año" hint="1-2% valor inmueble" />
            <NumberInput label="Gestión" value={input.gastosGestion} onChange={upd('gastosGestion')} suffix="€/año" hint="0 si autogestión" />
            <NumberInput label="Vacío estimado" value={input.mesesVacioAnuales} onChange={upd('mesesVacioAnuales')} suffix="meses/año" step={0.5} />
          </div>
          <h4 className="font-medium text-sm pt-2">Financiación</h4>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Hipoteca mensual" value={input.hipotecaMensual} onChange={upd('hipotecaMensual')} suffix="€/mes" hint="0 si al contado" />
            <NumberInput label="Incremento IPC" value={input.incrementoIpcAnual} onChange={upd('incrementoIpcAnual')} suffix="%" />
          </div>
          <Button onClick={calcular} className="w-full mt-4"><Calculator className="h-4 w-4 mr-2" /> Calcular</Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Resultados</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <KpiCard label="Inversión total" value={`${fmt(result.inversionTotal)} €`} />
                <KpiCard label="Rent. bruta" value={fmtPct(result.rentBruta)} />
                <KpiCard label="Rent. neta" value={fmtPct(result.rentNeta)} />
                <KpiCard label="Cashflow/mes" value={`${fmt(result.cashFlowMensualNeto)} €`} />
                <KpiCard label="ROE (sobre capital)" value={fmtPct(result.rentNetaSobreCapital)} />
                <KpiCard label="Payback" value={`${result.paybackAnos} años`} />
              </div>
              <h4 className="font-medium text-sm mb-2">Desglose de gastos anuales</h4>
              <GastosTable gastos={result.detalleGastos} />
              <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t">
                <span>Total gastos</span>
                <span>{fmt(result.gastosAnuales)} €/año</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Proyección 5 años (IPC {input.incrementoIpcAnual}%)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-5 text-xs font-medium text-muted-foreground">
                  <span>Año</span><span>Renta</span><span>Gastos</span><span>CF</span><span>Acumulado</span>
                </div>
                {result.proyeccion5anos.map(p => (
                  <div key={p.ano} className="grid grid-cols-5 text-sm">
                    <span>{p.ano}</span>
                    <span>{fmt(p.renta)} €</span>
                    <span>{fmt(p.gastos)} €</span>
                    <span className={p.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(p.cashFlow)} €</span>
                    <span className="font-medium">{fmt(p.acumulado)} €</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ALQUILER POR HABITACIONES
// ============================================================================
function RoomCalc() {
  const [input, setInput] = useState<RoomRentalInput>({
    precioCompra: 100000,
    gastosCompra: 10000,
    reformaInicial: 20000,
    amueblamiento: 5000,
    habitaciones: [{ renta: 350 }, { renta: 350 }, { renta: 300 }, { renta: 300 }],
    ocupacionMedia: 90,
    suministrosMensuales: 180,
    limpiezaMensual: 120,
    gastosComAnnual: 600,
    ibiAnual: 350,
    seguroHogar: 250,
    seguroImpago: 200,
    mantenimientoAnual: 800,
    gastosGestionAnual: 0,
    hipotecaMensual: 0,
    rotacionAnual: 3,
    costeRotacionPorCambio: 150,
  });
  const [result, setResult] = useState<RoomRentalResult | null>(null);

  const calcular = () => setResult(calculateRoomRental(input));
  const upd = (k: keyof Omit<RoomRentalInput, 'habitaciones'>) => (v: number) => setInput(p => ({ ...p, [k]: v }));

  const addRoom = () => setInput(p => ({ ...p, habitaciones: [...p.habitaciones, { renta: 300 }] }));
  const removeRoom = (i: number) => setInput(p => ({ ...p, habitaciones: p.habitaciones.filter((_, idx) => idx !== i) }));
  const updRoom = (i: number, renta: number) => setInput(p => {
    const h = [...p.habitaciones];
    h[i] = { renta };
    return { ...p, habitaciones: h };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BedDouble className="h-5 w-5" /> Datos de la operación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Precio compra" value={input.precioCompra} onChange={upd('precioCompra')} suffix="€" />
            <NumberInput label="Gastos compra" value={input.gastosCompra} onChange={upd('gastosCompra')} suffix="€" />
            <NumberInput label="Reforma" value={input.reformaInicial} onChange={upd('reformaInicial')} suffix="€" />
            <NumberInput label="Amueblamiento" value={input.amueblamiento} onChange={upd('amueblamiento')} suffix="€" />
          </div>
          <h4 className="font-medium text-sm pt-2">Habitaciones</h4>
          {input.habitaciones.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-20">Hab. {i + 1}</span>
              <Input type="number" value={h.renta || ''} onChange={e => updRoom(i, parseFloat(e.target.value) || 0)} className="h-8" />
              <span className="text-xs text-muted-foreground">€/mes</span>
              {input.habitaciones.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeRoom(i)}><Trash2 className="h-3 w-3" /></Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addRoom}><Plus className="h-3 w-3 mr-1" /> Habitación</Button>

          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Ocupación media" value={input.ocupacionMedia} onChange={upd('ocupacionMedia')} suffix="%" hint="Ej: 90%" />
            <NumberInput label="Suministros" value={input.suministrosMensuales} onChange={upd('suministrosMensuales')} suffix="€/mes" hint="Luz, agua, internet" />
            <NumberInput label="Limpieza" value={input.limpiezaMensual} onChange={upd('limpiezaMensual')} suffix="€/mes" />
            <NumberInput label="Comunidad" value={input.gastosComAnnual} onChange={upd('gastosComAnnual')} suffix="€/año" />
            <NumberInput label="IBI" value={input.ibiAnual} onChange={upd('ibiAnual')} suffix="€/año" />
            <NumberInput label="Seguro hogar" value={input.seguroHogar} onChange={upd('seguroHogar')} suffix="€/año" />
            <NumberInput label="Rotación anual" value={input.rotacionAnual} onChange={upd('rotacionAnual')} suffix="cambios" />
            <NumberInput label="Coste/cambio" value={input.costeRotacionPorCambio} onChange={upd('costeRotacionPorCambio')} suffix="€" />
            <NumberInput label="Hipoteca" value={input.hipotecaMensual} onChange={upd('hipotecaMensual')} suffix="€/mes" />
          </div>
          <Button onClick={calcular} className="w-full mt-4"><Calculator className="h-4 w-4 mr-2" /> Calcular</Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Resultados — {result.numHabitaciones} habitaciones</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <KpiCard label="Inversión total" value={`${fmt(result.inversionTotal)} €`} />
                <KpiCard label="Renta total/mes" value={`${fmt(result.rentaTotalMensual)} €`} sub={`Efectiva: ${fmt(result.rentaEfectivaMensual)} €`} />
                <KpiCard label="Rent. bruta" value={fmtPct(result.rentBruta)} />
                <KpiCard label="Rent. neta" value={fmtPct(result.rentNeta)} />
                <KpiCard label="CF/mes" value={`${fmt(result.cashFlowMensualNeto)} €`} sub={`${fmt(result.cashFlowPorHabitacion)} €/hab`} />
                <KpiCard label="Payback" value={`${result.paybackAnos} años`} />
              </div>
              <h4 className="font-medium text-sm mb-2">Desglose gastos anuales</h4>
              <GastosTable gastos={result.detalleGastos} />
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <h4 className="font-medium text-sm mb-2">vs Alquiler Tradicional</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Renta tradicional estimada</span>
                  <span>{fmt(result.comparativaVsTradicional.rentaTradicionalEstimada)} €/mes</span>
                </div>
                <div className="flex justify-between font-bold text-green-600">
                  <span>Premium habitaciones</span>
                  <span>+{result.comparativaVsTradicional.premiumHabitaciones}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Diferencia anual</span>
                  <span className="font-bold text-green-600">+{fmt(result.comparativaVsTradicional.diferenciaAnual)} €</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ALQUILER TURÍSTICO
// ============================================================================
function TouristCalc() {
  const [input, setInput] = useState<TouristRentalInput>({
    precioCompra: 150000,
    gastosCompra: 15000,
    reformaInicial: 20000,
    amueblamiento: 8000,
    licenciaTuristica: 500,
    fotografiaProfesional: 300,
    tarifaAltaNoche: 120,
    tarifaMediaNoche: 80,
    tarifaBajaNoche: 50,
    ocupacionAlta: 85,
    ocupacionMedia: 60,
    ocupacionBaja: 35,
    mesesAlta: 3,
    mesesMedia: 5,
    mesesBaja: 4,
    comisionPlataforma: 3,
    limpiezaPorEstancia: 45,
    estanciaMediaNoches: 3,
    amenitiesMensual: 80,
    channelManagerMensual: 30,
    gastosComAnnual: 720,
    ibiAnual: 500,
    seguroHogar: 300,
    mantenimientoAnual: 1000,
    hipotecaMensual: 0,
  });
  const [result, setResult] = useState<TouristRentalResult | null>(null);

  const calcular = () => setResult(calculateTouristRental(input));
  const upd = (k: keyof TouristRentalInput) => (v: number) => setInput(p => ({ ...p, [k]: v }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palmtree className="h-5 w-5" /> Datos de la operación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Precio compra" value={input.precioCompra} onChange={upd('precioCompra')} suffix="€" />
            <NumberInput label="Gastos compra" value={input.gastosCompra} onChange={upd('gastosCompra')} suffix="€" />
            <NumberInput label="Reforma" value={input.reformaInicial} onChange={upd('reformaInicial')} suffix="€" />
            <NumberInput label="Amueblamiento" value={input.amueblamiento} onChange={upd('amueblamiento')} suffix="€" />
            <NumberInput label="Licencia turística" value={input.licenciaTuristica} onChange={upd('licenciaTuristica')} suffix="€" />
            <NumberInput label="Fotografía" value={input.fotografiaProfesional} onChange={upd('fotografiaProfesional')} suffix="€" />
          </div>
          <h4 className="font-medium text-sm pt-2">Tarifas por temporada</h4>
          <div className="grid grid-cols-3 gap-3">
            <NumberInput label="Alta/noche" value={input.tarifaAltaNoche} onChange={upd('tarifaAltaNoche')} suffix="€" />
            <NumberInput label="Media/noche" value={input.tarifaMediaNoche} onChange={upd('tarifaMediaNoche')} suffix="€" />
            <NumberInput label="Baja/noche" value={input.tarifaBajaNoche} onChange={upd('tarifaBajaNoche')} suffix="€" />
            <NumberInput label="Ocup. alta" value={input.ocupacionAlta} onChange={upd('ocupacionAlta')} suffix="%" />
            <NumberInput label="Ocup. media" value={input.ocupacionMedia} onChange={upd('ocupacionMedia')} suffix="%" />
            <NumberInput label="Ocup. baja" value={input.ocupacionBaja} onChange={upd('ocupacionBaja')} suffix="%" />
            <NumberInput label="Meses alta" value={input.mesesAlta} onChange={upd('mesesAlta')} />
            <NumberInput label="Meses media" value={input.mesesMedia} onChange={upd('mesesMedia')} />
            <NumberInput label="Meses baja" value={input.mesesBaja} onChange={upd('mesesBaja')} />
          </div>
          <h4 className="font-medium text-sm pt-2">Gastos operativos</h4>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Comisión plataforma" value={input.comisionPlataforma} onChange={upd('comisionPlataforma')} suffix="%" hint="Airbnb 3%, Booking 15%" />
            <NumberInput label="Limpieza/estancia" value={input.limpiezaPorEstancia} onChange={upd('limpiezaPorEstancia')} suffix="€" />
            <NumberInput label="Estancia media" value={input.estanciaMediaNoches} onChange={upd('estanciaMediaNoches')} suffix="noches" />
            <NumberInput label="Amenities" value={input.amenitiesMensual} onChange={upd('amenitiesMensual')} suffix="€/mes" />
            <NumberInput label="Channel Manager" value={input.channelManagerMensual} onChange={upd('channelManagerMensual')} suffix="€/mes" />
            <NumberInput label="Comunidad" value={input.gastosComAnnual} onChange={upd('gastosComAnnual')} suffix="€/año" />
            <NumberInput label="IBI" value={input.ibiAnual} onChange={upd('ibiAnual')} suffix="€/año" />
            <NumberInput label="Hipoteca" value={input.hipotecaMensual} onChange={upd('hipotecaMensual')} suffix="€/mes" />
          </div>
          <Button onClick={calcular} className="w-full mt-4"><Calculator className="h-4 w-4 mr-2" /> Calcular</Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Resultados</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <KpiCard label="Inversión total" value={`${fmt(result.inversionTotal)} €`} />
                <KpiCard label="Ingresos brutos" value={`${fmt(result.ingresosAnualesBrutos)} €/año`} />
                <KpiCard label="Ingresos netos" value={`${fmt(result.ingresosAnualesNetos)} €/año`} sub={`-${fmt(result.comisionesPlataforma)} € comisiones`} />
                <KpiCard label="Rent. bruta" value={fmtPct(result.rentBruta)} />
                <KpiCard label="Rent. neta" value={fmtPct(result.rentNeta)} />
                <KpiCard label="CF/mes" value={`${fmt(result.cashFlowMensualNeto)} €`} />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <KpiCard label="RevPAR" value={`${result.revPAR} €`} sub="Revenue/noche disponible" />
                <KpiCard label="ADR" value={`${result.adr} €`} sub="Tarifa media/noche" />
                <KpiCard label="Ocupación anual" value={`${result.ocupacionMediaAnual}%`} sub={`${result.nochesOcupadasAnuales} noches`} />
              </div>
              <h4 className="font-medium text-sm mb-2">Gastos anuales</h4>
              <GastosTable gastos={result.detalleGastos} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Desglose mensual</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground">
                  <span>Mes</span><span>Ingresos</span><span>Gastos</span><span>CF</span>
                </div>
                {result.desgloseMensual.map(m => (
                  <div key={m.mes} className="grid grid-cols-4 text-sm">
                    <span>{m.mes}</span>
                    <span>{fmt(m.ingresos)} €</span>
                    <span>{fmt(m.gastos)} €</span>
                    <span className={m.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(m.cashFlow)} €</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FLIPPING (CRV)
// ============================================================================
function FlipCalc() {
  const [input, setInput] = useState<FlipInput>({
    precioCompra: 80000,
    gastosCompra: 8000,
    costeReforma: 30000,
    tiempoReformaMeses: 3,
    costeTenenciaMensual: 200,
    costeFincMensual: 300,
    precioVenta: 160000,
    tiempoVentaMeses: 2,
    comisionInmobiliaria: 3,
    plusvaliaMunicipal: 500,
    irpfGanancia: 19,
  });
  const [result, setResult] = useState<FlipResult | null>(null);

  const calcular = () => setResult(calculateFlip(input));
  const upd = (k: keyof FlipInput) => (v: number) => setInput(p => ({ ...p, [k]: v }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Hammer className="h-5 w-5" /> Datos de la operación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-medium text-sm">Compra</h4>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Precio compra" value={input.precioCompra} onChange={upd('precioCompra')} suffix="€" />
            <NumberInput label="Gastos compra" value={input.gastosCompra} onChange={upd('gastosCompra')} suffix="€" hint="ITP, notaría, etc." />
          </div>
          <h4 className="font-medium text-sm pt-2">Reforma</h4>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Coste reforma" value={input.costeReforma} onChange={upd('costeReforma')} suffix="€" />
            <NumberInput label="Duración reforma" value={input.tiempoReformaMeses} onChange={upd('tiempoReformaMeses')} suffix="meses" />
            <NumberInput label="Coste tenencia/mes" value={input.costeTenenciaMensual} onChange={upd('costeTenenciaMensual')} suffix="€/mes" hint="IBI+comunidad+suministros" />
            <NumberInput label="Coste financ./mes" value={input.costeFincMensual} onChange={upd('costeFincMensual')} suffix="€/mes" hint="Intereses préstamo" />
          </div>
          <h4 className="font-medium text-sm pt-2">Venta</h4>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Precio venta" value={input.precioVenta} onChange={upd('precioVenta')} suffix="€" />
            <NumberInput label="Tiempo venta" value={input.tiempoVentaMeses} onChange={upd('tiempoVentaMeses')} suffix="meses" />
            <NumberInput label="Comisión inmobiliaria" value={input.comisionInmobiliaria} onChange={upd('comisionInmobiliaria')} suffix="%" />
            <NumberInput label="Plusvalía municipal" value={input.plusvaliaMunicipal} onChange={upd('plusvaliaMunicipal')} suffix="€" />
            <NumberInput label="IRPF ganancia" value={input.irpfGanancia} onChange={upd('irpfGanancia')} suffix="%" hint="19-23% persona física" />
          </div>
          <Button onClick={calcular} className="w-full mt-4"><Calculator className="h-4 w-4 mr-2" /> Calcular</Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Resultados</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <KpiCard label="Inversión total" value={`${fmt(result.inversionTotal)} €`} />
                <KpiCard label="Beneficio neto" value={`${fmt(result.beneficioNeto)} €`} />
                <KpiCard label="ROI" value={fmtPct(result.roiSobreCapital)} />
                <KpiCard label="ROI anualizado" value={fmtPct(result.roiAnualizado)} />
                <KpiCard label="Duración" value={`${result.duracionTotalMeses} meses`} />
                <KpiCard label="Margen/venta" value={fmtPct(result.margenSobreVenta)} />
              </div>
              <h4 className="font-medium text-sm mb-2">Desglose inversión</h4>
              <GastosTable gastos={result.detalleInversion} />
              <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t">
                <span>Total inversión</span><span>{fmt(result.inversionTotal)} €</span>
              </div>
              <h4 className="font-medium text-sm mb-2 mt-4">Gastos de venta</h4>
              <GastosTable gastos={result.detalleGastosVenta} />
              <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t">
                <span>Total gastos venta</span><span>{fmt(result.gastosVenta)} €</span>
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Venta bruta</span><span>{fmt(result.precioVentaBruto)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>- Inversión</span><span>-{fmt(result.inversionTotal)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>- Gastos venta</span><span>-{fmt(result.gastosVenta)} €</span>
                </div>
                <div className={`flex justify-between font-bold text-lg mt-1 pt-1 border-t ${result.beneficioNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <span>Beneficio neto</span><span>{fmt(result.beneficioNeto)} €</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Precio mínimo de venta para no perder: <strong>{fmt(result.precioMinVentaBreakEven)} €</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================
export default function CalculadorasPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/herramientas">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Herramientas</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Calculadoras de Inversión</h1>
          <p className="text-muted-foreground text-sm">Analiza la rentabilidad real de cada modalidad de inversión</p>
        </div>
      </div>

      <Tabs defaultValue="tradicional" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tradicional" className="text-xs sm:text-sm">
            <Home className="h-4 w-4 mr-1 hidden sm:inline" /> Alq. Tradicional
          </TabsTrigger>
          <TabsTrigger value="habitaciones" className="text-xs sm:text-sm">
            <BedDouble className="h-4 w-4 mr-1 hidden sm:inline" /> Habitaciones
          </TabsTrigger>
          <TabsTrigger value="turistico" className="text-xs sm:text-sm">
            <Palmtree className="h-4 w-4 mr-1 hidden sm:inline" /> Turístico
          </TabsTrigger>
          <TabsTrigger value="flipping" className="text-xs sm:text-sm">
            <Hammer className="h-4 w-4 mr-1 hidden sm:inline" /> Flipping (CRV)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tradicional"><TraditionalCalc /></TabsContent>
        <TabsContent value="habitaciones"><RoomCalc /></TabsContent>
        <TabsContent value="turistico"><TouristCalc /></TabsContent>
        <TabsContent value="flipping"><FlipCalc /></TabsContent>
      </Tabs>
    </div>
  );
}
