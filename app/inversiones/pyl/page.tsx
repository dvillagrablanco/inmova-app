'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight, ArrowDownRight, Euro, Landmark, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function PYLConsolidadoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const [consolidatedRes, fiscalRes] = await Promise.all([
        fetch('/api/investment/consolidated'),
        fetch(`/api/investment/fiscal?year=${new Date().getFullYear()}`),
      ]);
      const consolidated = consolidatedRes.ok ? (await consolidatedRes.json()).data : null;
      const fiscal = fiscalRes.ok ? (await fiscalRes.json()).data : null;
      setData({ consolidated, fiscal });
    } catch { toast.error('Error cargando P&L'); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const p = data?.consolidated?.consolidated;
  const f = data?.fiscal;
  if (!p) {
    return (
      <AuthenticatedLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">P&L Consolidado</h1>
          <Card><CardContent className="p-8 text-center text-gray-500">Sin datos disponibles.</CardContent></Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  const annualIncome = p.totalMonthlyIncome * 12;
  const annualExpenses = p.totalMonthlyExpenses * 12;
  const annualMortgage = p.totalMortgagePayments * 12;
  const amortizaciones = f?.amortizaciones || 0;
  const intereses = f?.interesesHipoteca || 0;
  const noi = annualIncome - annualExpenses;
  const ebitda = noi - amortizaciones;
  const beneficioNeto = noi - annualMortgage - (f?.cuotaIS || 0);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">P&L Consolidado</h1>
          <p className="text-gray-500">Cuenta de resultados anualizada del grupo - {new Date().getFullYear()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cuenta de Perdidas y Ganancias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-lg">
              {/* Ingresos */}
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center gap-2 text-gray-700">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  Ingresos por alquiler
                </span>
                <span className="font-medium text-green-600">+{fmt(annualIncome)}</span>
              </div>

              {/* Gastos operativos */}
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center gap-2 text-gray-700">
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                  Gastos operativos (IBI, comunidad, seguros, mantenim.)
                </span>
                <span className="font-medium text-red-600">-{fmt(annualExpenses)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-t font-bold">
                <span>NOI (Net Operating Income)</span>
                <span className={noi >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(noi)}</span>
              </div>

              {/* Amortizaciones */}
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center gap-2 text-gray-500">
                  <Minus className="h-4 w-4" />
                  Amortizaciones (3% construccion)
                </span>
                <span className="text-orange-600">-{fmt(amortizaciones)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-t font-bold">
                <span>EBITDA</span>
                <span className={ebitda >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(ebitda)}</span>
              </div>

              {/* Gastos financieros */}
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center gap-2 text-gray-500">
                  <Landmark className="h-4 w-4" />
                  Cuotas hipotecarias (capital + intereses)
                </span>
                <span className="text-red-600">-{fmt(annualMortgage)}</span>
              </div>

              {/* Impuestos */}
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center gap-2 text-gray-500">
                  <Euro className="h-4 w-4" />
                  Impuesto de Sociedades (25%)
                </span>
                <span className="text-red-600">-{fmt(f?.cuotaIS || 0)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 border-gray-900 font-bold text-lg">
                <span>Beneficio Neto</span>
                <span className={beneficioNeto >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(beneficioNeto)}</span>
              </div>

              {/* Metricas */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t mt-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Margen NOI</div>
                  <div className="font-bold">{annualIncome > 0 ? Math.round(noi / annualIncome * 100) : 0}%</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Margen neto</div>
                  <div className="font-bold">{annualIncome > 0 ? Math.round(beneficioNeto / annualIncome * 100) : 0}%</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Cash-flow anual</div>
                  <div className="font-bold">{fmt(p.monthlyCashFlow * 12)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
