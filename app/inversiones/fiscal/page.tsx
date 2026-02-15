'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Receipt, Euro, TrendingDown, Building2, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface FiscalData {
  companyId: string;
  companyName: string;
  year: number;
  ingresosBrutos: number;
  gastosDeducibles: number;
  amortizaciones: number;
  interesesHipoteca: number;
  baseImponible: number;
  cuotaIS: number;
  tipoEfectivo: number;
  pagosFraccionados: { trimestre: number; importe: number }[];
}

export default function FiscalGrupoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [fiscalData, setFiscalData] = useState<FiscalData[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') loadData();
  }, [status, router, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Obtener lista de sociedades
      const consolidatedRes = await fetch('/api/investment/consolidated');
      if (!consolidatedRes.ok) { setLoading(false); return; }
      const consolidated = await consolidatedRes.json();
      const comps = consolidated.data?.companies || [];
      setCompanies(comps);

      // Obtener fiscal de cada sociedad
      const fiscals = await Promise.all(
        comps.map(async (c: any) => {
          const res = await fetch(`/api/investment/fiscal?year=${year}&companyId=${c.companyId}`);
          if (res.ok) {
            const data = await res.json();
            return data.data;
          }
          return null;
        })
      );
      setFiscalData(fiscals.filter(Boolean));
    } catch { toast.error('Error cargando datos fiscales'); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const totalIS = fiscalData.reduce((s, f) => s + f.cuotaIS, 0);
  const totalIngresos = fiscalData.reduce((s, f) => s + f.ingresosBrutos, 0);
  const totalBase = fiscalData.reduce((s, f) => s + f.baseImponible, 0);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fiscal del Grupo</h1>
            <p className="text-gray-500">Impuesto de Sociedades consolidado</p>
          </div>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resumen consolidado */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Ingresos brutos grupo</div>
              <div className="text-xl font-bold">{fmt(totalIngresos)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Base imponible total</div>
              <div className="text-xl font-bold">{fmt(totalBase)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 flex items-center gap-1"><Receipt className="h-4 w-4" /> IS Total (25%)</div>
              <div className="text-xl font-bold text-red-600">{fmt(totalIS)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Tipo efectivo grupo</div>
              <div className="text-xl font-bold">
                {totalIngresos > 0 ? Math.round((totalIS / totalIngresos) * 10000) / 100 : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desglose por sociedad */}
        <div className="space-y-4">
          {fiscalData.map((f) => (
            <Card key={f.companyId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {f.companyName}
                  </CardTitle>
                  <Badge className="bg-red-100 text-red-700">IS: {fmt(f.cuotaIS)}</Badge>
                </div>
                <CardDescription>Ejercicio {f.year} - Tipo efectivo: {f.tipoEfectivo}%</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ingresos brutos</span>
                      <span className="font-medium">{fmt(f.ingresosBrutos)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">(-) Gastos deducibles</span>
                      <span className="text-red-600">-{fmt(f.gastosDeducibles)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">(-) Amortizaciones</span>
                      <span className="text-red-600">-{fmt(f.amortizaciones)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">(-) Intereses hipoteca</span>
                      <span className="text-red-600">-{fmt(f.interesesHipoteca)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Base imponible</span>
                      <span>{fmt(f.baseImponible)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium mb-2">Pagos fraccionados (Mod. 202)</div>
                    {f.pagosFraccionados.map(pf => (
                      <div key={pf.trimestre} className="flex justify-between">
                        <span className="text-gray-500">
                          {pf.trimestre === 1 ? '1T - Abril' : pf.trimestre === 2 ? '2T - Octubre' : '3T - Diciembre'}
                        </span>
                        <span>{fmt(pf.importe)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Cuota IS anual</span>
                      <span className="text-red-600">{fmt(f.cuotaIS)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {fiscalData.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Sin datos fiscales para {year}. Registra ingresos y gastos para ver la simulacion.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
