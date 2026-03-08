'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Euro, TrendingUp, Users, Loader2 } from 'lucide-react';

export default function OwnerMonthlyReportPage() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetch('/api/portal-propietario/monthly-report?ownerId=placeholder')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.report) setReport(d.report); })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  if (!report) return <div className="p-6 text-center text-gray-500">No hay datos disponibles</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Informe Mensual</h1>
        <p className="text-gray-500">{report.propietario} — {report.periodo}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{fmt(report.resumen.ingresos)}</div><div className="text-xs text-gray-500">Ingresos</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-red-500">{fmt(report.resumen.gastos)}</div><div className="text-xs text-gray-500">Gastos</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{fmt(report.resumen.neto)}</div><div className="text-xs text-gray-500">Neto</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{report.resumen.ocupacion}%</div><div className="text-xs text-gray-500">Ocupación</div></CardContent></Card>
      </div>

      {report.edificios?.map((b: any, i: number) => (
        <Card key={i}>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />{b.nombre} <Badge variant="outline">{b.porcentaje}%</Badge></CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div><span className="text-gray-500">Unidades</span><p className="font-bold">{b.ocupadas}/{b.unidades}</p></div>
              <div><span className="text-gray-500">Renta</span><p className="font-bold">{fmt(b.rentaMensual)}/mes</p></div>
              <div><span className="text-gray-500">Cobrado</span><p className="font-bold text-green-600">{fmt(b.ingresosCobrados)}</p></div>
              <div><span className="text-gray-500">Gastos</span><p className="font-bold text-red-500">{fmt(b.gastos)}</p></div>
              <div><span className="text-gray-500">Neto</span><p className={`font-bold ${b.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(b.neto)}</p></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
