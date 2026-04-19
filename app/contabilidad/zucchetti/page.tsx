'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Database, FileText, Banknote, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardData {
  success: boolean;
  currentYear: number;
  companies: Array<{
    id: string;
    nombre: string;
    zucchettiEnabled: boolean;
    zucchettiLastSync: string | null;
    snapshot: {
      ultimaSync: string;
      duracionMs: number;
      apuntes: number;
      iva: number;
      terceros: number;
      balances: number;
      treasury: number;
      errores: number;
      ultimoError: string | null;
    } | null;
    contabilidad: {
      ingresosAnual: number;
      gastosAnual: number;
      beneficio: number;
      transaccionesIngreso: number;
      transaccionesGasto: number;
    };
    iva: {
      trimestres: Record<string, { ivaRepercutido: number; ivaSoportado: number; baseV: number; baseC: number }>;
      anualRepercutido: number;
      anualSoportado: number;
      modelo303Total: number;
    };
    tesoreria: Array<{ subcuenta: string; saldo: number; movimientos: number }>;
    terceros: Record<string, number>;
  }>;
  topProveedores: Array<{
    empresa: string;
    nombre: string;
    nif: string;
    totalFacturado: number;
  }>;
}

function formatEuro(n: number): string {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export default function ZucchettiDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/accounting/zucchetti/dashboard', { credentials: 'include' });
      if (!r.ok) throw new Error('Error cargando');
      const json = await r.json();
      setData(json);
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFullSync = async (allGroup: boolean) => {
    setSyncing(true);
    try {
      const r = await fetch('/api/accounting/zucchetti/full-sync', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allGroup }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Error sincronizando');
      toast.success('Sincronización completada');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setSyncing(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Database className="h-7 w-7 text-primary" />
            Contabilidad Zucchetti — Grupo Vidaro
          </h1>
          <p className="text-muted-foreground text-sm">
            Datos sincronizados desde Zucchetti SQL Server (CONT_RSQ / CONT_VID / DAT_VIR)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleFullSync(false)} disabled={syncing} variant="outline">
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sincronizar sociedad activa
          </Button>
          <Button onClick={() => handleFullSync(true)} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sincronizar todo el grupo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="iva">IVA / Modelo 303</TabsTrigger>
          <TabsTrigger value="treasury">Tesorería</TabsTrigger>
          <TabsTrigger value="providers">Top Proveedores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {data.companies.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{c.nombre}</CardTitle>
                    {c.snapshot ? (
                      c.snapshot.errores > 0 ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {c.snapshot.errores} err
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline">Sin sync</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {c.zucchettiLastSync
                      ? `Última sync: ${new Date(c.zucchettiLastSync).toLocaleString('es-ES')}`
                      : 'No sincronizado'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Ingresos {data.currentYear}</p>
                      <p className="text-base font-semibold text-green-600">
                        {formatEuro(c.contabilidad.ingresosAnual)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gastos {data.currentYear}</p>
                      <p className="text-base font-semibold text-red-600">
                        {formatEuro(c.contabilidad.gastosAnual)}
                      </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Beneficio</p>
                      <p
                        className={`text-lg font-bold ${
                          c.contabilidad.beneficio >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {formatEuro(c.contabilidad.beneficio)}
                      </p>
                    </div>
                  </div>
                  {c.snapshot && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {c.snapshot.apuntes} apuntes
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {c.snapshot.iva} IVA
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {c.snapshot.terceros} terceros
                      </div>
                      <div className="flex items-center gap-1">
                        <Banknote className="h-3 w-3" /> {c.snapshot.treasury} tesorería
                      </div>
                    </div>
                  )}
                  {c.snapshot?.ultimoError && (
                    <div className="text-xs bg-destructive/10 text-destructive rounded p-2">
                      {c.snapshot.ultimoError.substring(0, 200)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="iva" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IVA {data.currentYear} por sociedad</CardTitle>
              <CardDescription>
                Modelo 303 acumulado (IVA repercutido − IVA soportado) por trimestre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Sociedad</th>
                      <th className="text-right p-2">T1</th>
                      <th className="text-right p-2">T2</th>
                      <th className="text-right p-2">T3</th>
                      <th className="text-right p-2">T4</th>
                      <th className="text-right p-2 font-bold">Total Modelo 303</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.companies.map((c) => (
                      <tr key={c.id} className="border-b">
                        <td className="p-2 font-medium">{c.nombre}</td>
                        {(['T1', 'T2', 'T3', 'T4'] as const).map((tr) => {
                          const t = c.iva.trimestres[tr];
                          const neto = t ? t.ivaRepercutido - t.ivaSoportado : 0;
                          return (
                            <td key={tr} className="p-2 text-right">
                              {t ? formatEuro(neto) : '—'}
                            </td>
                          );
                        })}
                        <td
                          className={`p-2 text-right font-bold ${
                            c.iva.modelo303Total >= 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {formatEuro(c.iva.modelo303Total)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted font-bold">
                      <td className="p-2">TOTAL GRUPO</td>
                      {(['T1', 'T2', 'T3', 'T4'] as const).map((tr) => {
                        const total = data.companies.reduce(
                          (s, c) =>
                            s + ((c.iva.trimestres[tr]?.ivaRepercutido || 0) - (c.iva.trimestres[tr]?.ivaSoportado || 0)),
                          0
                        );
                        return (
                          <td key={tr} className="p-2 text-right">
                            {formatEuro(total)}
                          </td>
                        );
                      })}
                      <td className="p-2 text-right">
                        {formatEuro(
                          data.companies.reduce((s, c) => s + c.iva.modelo303Total, 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treasury" className="space-y-4">
          {data.companies.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{c.nombre} — Tesorería (cuenta 57x)</CardTitle>
              </CardHeader>
              <CardContent>
                {c.tesoreria.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No hay datos de tesorería sincronizados.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Subcuenta</th>
                        <th className="text-right p-2">Saldo neto</th>
                        <th className="text-right p-2">Movimientos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.tesoreria.map((t) => (
                        <tr key={t.subcuenta} className="border-b">
                          <td className="p-2 font-mono">{t.subcuenta}</td>
                          <td
                            className={`p-2 text-right font-semibold ${
                              t.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatEuro(t.saldo)}
                          </td>
                          <td className="p-2 text-right text-muted-foreground">{t.movimientos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Proveedores {data.currentYear}</CardTitle>
              <CardDescription>Por importe facturado (compras registradas en IVA)</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Sociedad</th>
                    <th className="text-left p-2">Proveedor</th>
                    <th className="text-left p-2">NIF</th>
                    <th className="text-right p-2">Total facturado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProveedores.map((p, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{p.empresa}</td>
                      <td className="p-2 font-medium">{p.nombre || '—'}</td>
                      <td className="p-2 font-mono text-xs">{p.nif || '—'}</td>
                      <td className="p-2 text-right font-semibold">
                        {formatEuro(p.totalFacturado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
