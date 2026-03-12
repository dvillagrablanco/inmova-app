'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Hammer, Clock, Euro, TrendingUp } from 'lucide-react';

interface Partida {
  id: string;
  nombre: string;
  costePorM2: number | null;
  costeFijo: number | null;
  unidad: 'por_m2' | 'fijo' | 'por_unidad';
  cantidad: number;
  incluida: boolean;
  semanas: number;
  dependeDe: string[];
  descripcion: string;
}

const PARTIDAS_BASE: Partida[] = [
  { id: 'demolicion', nombre: 'Demolición y retirada', costePorM2: 25, costeFijo: null, unidad: 'por_m2', cantidad: 1, incluida: true, semanas: 1, dependeDe: [], descripcion: 'Retirada de suelos, sanitarios, muebles cocina' },
  { id: 'albanileria', nombre: 'Albañilería', costePorM2: 40, costeFijo: null, unidad: 'por_m2', cantidad: 1, incluida: true, semanas: 2, dependeDe: ['demolicion'], descripcion: 'Tabiques, rozas, reparación de paredes' },
  { id: 'fontaneria', nombre: 'Fontanería', costePorM2: null, costeFijo: 2500, unidad: 'fijo', cantidad: 1, incluida: true, semanas: 1, dependeDe: ['albanileria'], descripcion: 'Tuberías, grifería, conexiones' },
  { id: 'electricidad', nombre: 'Electricidad', costePorM2: null, costeFijo: 3000, unidad: 'fijo', cantidad: 1, incluida: true, semanas: 1, dependeDe: ['albanileria'], descripcion: 'Cuadro, cableado, tomas, boletín' },
  { id: 'suelos', nombre: 'Suelos', costePorM2: 35, costeFijo: null, unidad: 'por_m2', cantidad: 1, incluida: true, semanas: 1, dependeDe: ['fontaneria', 'electricidad'], descripcion: 'Porcelánico o vinílico, rodapiés' },
  { id: 'pintura', nombre: 'Pintura', costePorM2: 8, costeFijo: null, unidad: 'por_m2', cantidad: 1, incluida: true, semanas: 1, dependeDe: ['suelos'], descripcion: 'Paredes y techos, 2 manos' },
  { id: 'cocina', nombre: 'Cocina completa', costePorM2: null, costeFijo: 4000, unidad: 'fijo', cantidad: 1, incluida: true, semanas: 2, dependeDe: ['fontaneria', 'electricidad'], descripcion: 'Muebles, encimera, electrodomésticos básicos' },
  { id: 'bano', nombre: 'Baño completo', costePorM2: null, costeFijo: 3500, unidad: 'por_unidad', cantidad: 1, incluida: true, semanas: 2, dependeDe: ['fontaneria'], descripcion: 'Sanitarios, mampara, alicatado, grifería' },
  { id: 'puertas', nombre: 'Puertas interiores', costePorM2: null, costeFijo: 250, unidad: 'por_unidad', cantidad: 4, incluida: false, semanas: 1, dependeDe: ['pintura'], descripcion: 'Puerta + marco + manilla' },
  { id: 'ventanas', nombre: 'Ventanas', costePorM2: null, costeFijo: 400, unidad: 'por_unidad', cantidad: 4, incluida: false, semanas: 1, dependeDe: [], descripcion: 'Aluminio RPT o PVC con doble vidrio' },
  { id: 'aireac', nombre: 'Aire acondicionado', costePorM2: null, costeFijo: 1200, unidad: 'fijo', cantidad: 1, incluida: false, semanas: 1, dependeDe: ['electricidad'], descripcion: 'Split inverter instalado' },
  { id: 'caldera', nombre: 'Caldera/Termo', costePorM2: null, costeFijo: 1500, unidad: 'fijo', cantidad: 1, incluida: false, semanas: 1, dependeDe: ['fontaneria'], descripcion: 'Caldera de condensación o termo eléctrico' },
];

function calcCostePartida(p: Partida, superficie: number): number {
  if (!p.incluida) return 0;
  if (p.unidad === 'por_m2' && p.costePorM2 !== null) return p.costePorM2 * superficie;
  if (p.unidad === 'fijo' && p.costeFijo !== null) return p.costeFijo;
  if (p.unidad === 'por_unidad' && p.costeFijo !== null) return p.costeFijo * p.cantidad;
  return 0;
}

export function DetailedRenovationEstimator({ superficie: surfProp, precioCompra }: { superficie?: number; precioCompra?: number }) {
  const [superficie, setSuperficie] = useState(surfProp || 70);
  const [precio, setPrecio] = useState(precioCompra || 100000);
  const [partidas, setPartidas] = useState<Partida[]>(PARTIDAS_BASE);
  const [imprevistos, setImprevistos] = useState(10);

  const togglePartida = (id: string) => {
    setPartidas(prev => prev.map(p => p.id === id ? { ...p, incluida: !p.incluida } : p));
  };

  const updatePartida = (id: string, field: string, value: number) => {
    setPartidas(prev => prev.map(p => {
      if (p.id !== id) return p;
      if (field === 'costePorM2') return { ...p, costePorM2: value };
      if (field === 'costeFijo') return { ...p, costeFijo: value };
      if (field === 'cantidad') return { ...p, cantidad: value };
      return p;
    }));
  };

  const results = useMemo(() => {
    const desglose = partidas.map(p => ({
      ...p,
      coste: calcCostePartida(p, superficie),
    }));

    const subtotal = desglose.reduce((s, p) => s + p.coste, 0);
    const imprevistosCoste = subtotal * (imprevistos / 100);
    const total = subtotal + imprevistosCoste;
    const costePorM2 = superficie > 0 ? total / superficie : 0;

    const incluidas = desglose.filter(p => p.incluida);
    let semanasTotal = 0;
    const timeline: { partida: string; inicio: number; fin: number }[] = [];

    incluidas.forEach(p => {
      let inicio = 0;
      if (p.dependeDe.length > 0) {
        const depFins = p.dependeDe
          .map(depId => timeline.find(t => t.partida === depId)?.fin || 0);
        inicio = Math.max(...depFins);
      }
      const fin = inicio + p.semanas;
      if (fin > semanasTotal) semanasTotal = fin;
      timeline.push({ partida: p.id, inicio, fin });
    });

    const valorPostReforma = precio + total * 1.5;
    const incrementoValor = total > 0 ? ((valorPostReforma - precio - total) / total) * 100 : 0;

    return { desglose, subtotal, imprevistosCoste, total, costePorM2, semanasTotal, timeline, valorPostReforma, incrementoValor };
  }, [partidas, superficie, imprevistos, precio]);

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Hammer className="h-5 w-5" /> Estimador de Reforma Detallado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-sm">Superficie</Label>
            <div className="flex items-center gap-1">
              <Input type="number" value={superficie} onChange={e => setSuperficie(parseFloat(e.target.value) || 0)} className="h-8" />
              <span className="text-xs text-muted-foreground">m²</span>
            </div>
          </div>
          <div>
            <Label className="text-sm">Precio compra</Label>
            <div className="flex items-center gap-1">
              <Input type="number" value={precio} onChange={e => setPrecio(parseFloat(e.target.value) || 0)} className="h-8" />
              <span className="text-xs text-muted-foreground">€</span>
            </div>
          </div>
          <div>
            <Label className="text-sm">Imprevistos</Label>
            <div className="flex items-center gap-1">
              <Input type="number" value={imprevistos} onChange={e => setImprevistos(parseFloat(e.target.value) || 0)} className="h-8" />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Partidas</h4>
          {results.desglose.map(p => (
            <div key={p.id} className={`flex items-center gap-2 p-2 rounded border ${p.incluida ? 'bg-white' : 'bg-muted/30 opacity-60'}`}>
              <Switch checked={p.incluida} onCheckedChange={() => togglePartida(p.id)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{p.nombre}</span>
                  <span className="text-xs text-muted-foreground">{p.descripcion}</span>
                </div>
                {p.incluida && (
                  <div className="flex items-center gap-2 mt-1">
                    {p.unidad === 'por_m2' && p.costePorM2 !== null && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={p.costePorM2}
                          onChange={e => updatePartida(p.id, 'costePorM2', parseFloat(e.target.value) || 0)}
                          className="h-6 w-20 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">€/m²</span>
                      </div>
                    )}
                    {(p.unidad === 'fijo' || p.unidad === 'por_unidad') && p.costeFijo !== null && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={p.costeFijo}
                          onChange={e => updatePartida(p.id, 'costeFijo', parseFloat(e.target.value) || 0)}
                          className="h-6 w-20 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">€{p.unidad === 'por_unidad' ? '/ud' : ''}</span>
                      </div>
                    )}
                    {p.unidad === 'por_unidad' && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">x</span>
                        <Input
                          type="number"
                          value={p.cantidad}
                          onChange={e => updatePartida(p.id, 'cantidad', parseFloat(e.target.value) || 0)}
                          className="h-6 w-14 text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-sm font-mono font-medium w-20 text-right">
                {p.incluida ? `${fmt(p.coste)} €` : '-'}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span><span>{fmt(results.subtotal)} €</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Imprevistos ({imprevistos}%)</span><span>{fmt(results.imprevistosCoste)} €</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-1 border-t">
            <span>Total reforma</span><span>{fmt(results.total)} €</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Coste por m²</span><span>{fmt(results.costePorM2)} €/m²</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{results.semanasTotal} sem</p>
            <p className="text-xs text-muted-foreground">Duración est.</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Euro className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{fmt(results.total)} €</p>
            <p className="text-xs text-muted-foreground">Inversión reforma</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{fmt(results.valorPostReforma)} €</p>
            <p className="text-xs text-muted-foreground">Valor post-reforma est.</p>
          </div>
        </div>

        {results.timeline.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Timeline estimado</h4>
            <div className="space-y-1">
              {results.timeline.map(t => {
                const p = partidas.find(pp => pp.id === t.partida);
                if (!p) return null;
                const widthPct = results.semanasTotal > 0 ? ((t.fin - t.inicio) / results.semanasTotal) * 100 : 0;
                const leftPct = results.semanasTotal > 0 ? (t.inicio / results.semanasTotal) * 100 : 0;
                return (
                  <div key={t.partida} className="flex items-center gap-2">
                    <span className="text-xs w-24 truncate">{p.nombre}</span>
                    <div className="flex-1 bg-muted rounded h-5 relative">
                      <div
                        className="bg-primary/70 rounded h-5 absolute flex items-center justify-center"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '20px' }}
                      >
                        <span className="text-[10px] text-white font-medium">{t.fin - t.inicio}s</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Sem 0</span>
                <span>Sem {Math.ceil(results.semanasTotal / 2)}</span>
                <span>Sem {results.semanasTotal}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
