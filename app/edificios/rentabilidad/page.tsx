'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Building2,
  ArrowRight,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface BuildingItem {
  id: string;
  nombre: string;
  direccion: string;
  gestorNombre: string;
  ocupacion: { totalUnits: number; occupied: number; pct: number };
  rentaContractual: { mensual: number; anual: number };
  valorInversion: number;
  contabilidad: {
    apuntes: number;
    ingresos: number;
    gastos: number;
    noi: number;
    margenNoiPct: number;
    variacionNoiPct: number;
  };
  rentabilidad: { yieldBrutoPct: number; yieldNetoPct: number };
}

interface Data {
  success: boolean;
  year: number;
  buildingsCount: number;
  totales: {
    ingresos: number;
    gastos: number;
    noi: number;
    margenNoiPct: number;
    rentaContractualAnual: number;
    valorInversion: number;
    ocupacionPct: number;
    totalUnits: number;
    occupiedUnits: number;
    apuntes: number;
  };
  buildings: BuildingItem[];
  top5: BuildingItem[];
  bottom5: BuildingItem[];
}

function formatEuro(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1_000_000) {
    return `€${(n / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(n) >= 1_000) {
    return `€${(n / 1_000).toFixed(0)}k`;
  }
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export default function PortfolioRentabilityPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/buildings/portfolio-rentability?year=${year}`, {
        credentials: 'include',
      });
      if (!r.ok) throw new Error('Error');
      setData(await r.json());
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [year]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            Rentabilidad del Portfolio
          </h1>
          <p className="text-muted-foreground text-sm">
            Datos contables consolidados Zucchetti — Grupo Vidaro · {data.year}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={() => setYear(year - 1)} size="sm">
            ←
          </Button>
          <span className="font-semibold text-lg">{year}</span>
          <Button
            variant="outline"
            onClick={() => setYear(year + 1)}
            size="sm"
            disabled={year >= new Date().getFullYear()}
          >
            →
          </Button>
        </div>
      </div>

      {/* KPIs del portfolio */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Edificios</CardDescription>
            <CardTitle className="text-2xl">{data.buildingsCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data.totales.totalUnits} unidades · {data.totales.ocupacionPct}% ocupación
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Ingresos {data.year}</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {formatEuro(data.totales.ingresos, true)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data.totales.apuntes} apuntes contables
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Gastos {data.year}</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {formatEuro(data.totales.gastos, true)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">NOI {data.year}</CardDescription>
            <CardTitle
              className={`text-2xl ${data.totales.noi >= 0 ? 'text-green-700' : 'text-red-700'}`}
            >
              {formatEuro(data.totales.noi, true)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            margen {data.totales.margenNoiPct}%
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Renta contractual</CardDescription>
            <CardTitle className="text-2xl">
              {formatEuro(data.totales.rentaContractualAnual, true)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">/año</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos los edificios</TabsTrigger>
          <TabsTrigger value="top">
            <Trophy className="h-3 w-3 mr-1" /> Top 5
          </TabsTrigger>
          <TabsTrigger value="bottom">
            <AlertTriangle className="h-3 w-3 mr-1" /> Pérdidas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Ranking por NOI</CardTitle>
              <CardDescription>
                Net Operating Income calculado desde apuntes contables Zucchetti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Edificio</th>
                      <th className="text-left p-2 hidden md:table-cell">Gestor</th>
                      <th className="text-center p-2">Ocup.</th>
                      <th className="text-right p-2">Ingresos</th>
                      <th className="text-right p-2">Gastos</th>
                      <th className="text-right p-2 font-bold">NOI</th>
                      <th className="text-right p-2 hidden lg:table-cell">Margen</th>
                      <th className="text-right p-2 hidden lg:table-cell">Yield neto</th>
                      <th className="text-right p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.buildings.map((b) => (
                      <tr key={b.id} className="border-b hover:bg-muted/30">
                        <td className="p-2">
                          <div className="font-medium">{b.nombre}</div>
                          <div className="text-xs text-muted-foreground">{b.direccion}</div>
                        </td>
                        <td className="p-2 hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {b.gestorNombre?.split(' ')[0]}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <span className="text-xs">
                            {b.ocupacion.occupied}/{b.ocupacion.totalUnits}
                          </span>
                        </td>
                        <td className="p-2 text-right text-green-700">
                          {formatEuro(b.contabilidad.ingresos, true)}
                        </td>
                        <td className="p-2 text-right text-red-700">
                          {formatEuro(b.contabilidad.gastos, true)}
                        </td>
                        <td
                          className={`p-2 text-right font-bold ${
                            b.contabilidad.noi >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {b.contabilidad.noi >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {formatEuro(b.contabilidad.noi, true)}
                          </div>
                        </td>
                        <td className="p-2 text-right hidden lg:table-cell">
                          {b.contabilidad.margenNoiPct.toFixed(1)}%
                        </td>
                        <td className="p-2 text-right hidden lg:table-cell">
                          {b.rentabilidad.yieldNetoPct > 0 ? (
                            <span className="text-green-700">
                              {b.rentabilidad.yieldNetoPct.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          <Link href={`/edificios/${b.id}`}>
                            <Button variant="ghost" size="sm">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted font-bold border-t-2">
                      <td className="p-2" colSpan={3}>
                        TOTAL GRUPO VIDARO ({data.year})
                      </td>
                      <td className="p-2 text-right text-green-800">
                        {formatEuro(data.totales.ingresos)}
                      </td>
                      <td className="p-2 text-right text-red-800">
                        {formatEuro(data.totales.gastos)}
                      </td>
                      <td
                        className={`p-2 text-right ${
                          data.totales.noi >= 0 ? 'text-green-800' : 'text-red-800'
                        }`}
                      >
                        {formatEuro(data.totales.noi)}
                      </td>
                      <td className="p-2 text-right hidden lg:table-cell">
                        {data.totales.margenNoiPct.toFixed(1)}%
                      </td>
                      <td className="p-2" colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 — Mayor NOI {data.year}</CardTitle>
              <CardDescription>Edificios más rentables del portfolio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.top5.map((b, i) => (
                <Link key={b.id} href={`/edificios/${b.id}`}>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{b.nombre}</div>
                        <div className="text-xs text-muted-foreground">{b.direccion}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-700">
                        {formatEuro(b.contabilidad.noi)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        margen {b.contabilidad.margenNoiPct.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottom">
          <Card>
            <CardHeader>
              <CardTitle>Edificios en Pérdidas</CardTitle>
              <CardDescription>NOI negativo — requieren atención</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.bottom5.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  ✅ Todos los edificios son rentables.
                </p>
              ) : (
                data.bottom5.map((b) => (
                  <Link key={b.id} href={`/edificios/${b.id}`}>
                    <div className="flex items-center justify-between p-3 border-2 border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <div className="font-semibold">{b.nombre}</div>
                          <div className="text-xs text-muted-foreground">{b.direccion}</div>
                          <div className="text-xs text-muted-foreground">
                            Ingresos {formatEuro(b.contabilidad.ingresos)} − Gastos{' '}
                            {formatEuro(b.contabilidad.gastos)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-700">
                          {formatEuro(b.contabilidad.noi)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
