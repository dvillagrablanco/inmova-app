'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

export default function TreasuryPage() {
  const { data: session } = useSession();
  const companyId = (session?.user as { companyId?: string })?.companyId;

  const [cashFlow, setCashFlow] = useState<Array<{ mes: string; periodo: string; neto: number }>>(
    []
  );
  const [deposits, setDeposits] = useState<
    Array<{ id: string; contract?: { id: string }; importeFianza?: number }>
  >([]);
  const [provisions, setProvisions] = useState<
    Array<{ montoProvision: number; categoriaRiesgo?: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [cfRes, depRes, provRes] = await Promise.all([
          fetch('/api/finanzas/cashflow?months=6'),
          companyId
            ? fetch(`/api/treasury/deposits?companyId=${companyId}`)
            : Promise.resolve(null),
          companyId
            ? fetch(`/api/treasury/provisions?companyId=${companyId}`)
            : Promise.resolve(null),
        ]);

        if (cfRes?.ok) {
          const cfData = await cfRes.json();
          const list = Array.isArray(cfData) ? cfData : (cfData?.data ?? cfData?.monthlyData ?? []);
          setCashFlow(list.slice(0, 6));
        } else {
          setCashFlow([]);
        }

        if (depRes?.ok) {
          const depData = await depRes.json();
          setDeposits(Array.isArray(depData) ? depData : (depData?.data ?? []));
        } else {
          setDeposits([]);
        }

        if (provRes?.ok) {
          const provData = await provRes.json();
          const list = Array.isArray(provData) ? provData : (provData?.data ?? []);
          setProvisions(list);
        } else {
          setProvisions([]);
        }
      } catch {
        setCashFlow([]);
        setDeposits([]);
        setProvisions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [companyId]);

  const totalProvision = provisions.reduce((sum, p) => sum + (p.montoProvision ?? 0), 0);
  const negativeMonths = cashFlow.filter((m) => (m.neto ?? 0) < 0);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Tesorería Avanzada</h1>
          <p className="text-gray-600 mb-8">
            Cash flow, fianzas, provisiones y alertas financieras
          </p>
          <Skeleton className="h-48 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Tesorería Avanzada</h1>
        <p className="text-gray-600 mb-8">Cash flow, fianzas, provisiones y alertas financieras</p>

        {/* Cash Flow Forecast */}
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Previsión de Cash Flow (6 meses)</h3>
          <div className="grid grid-cols-6 gap-3">
            {cashFlow.length > 0
              ? cashFlow.slice(0, 6).map((m, i) => {
                  const value = m.neto ?? 0;
                  const label = m.mes || MONTH_LABELS[i] || `M${i + 1}`;
                  return (
                    <div
                      key={label}
                      className={`p-3 rounded-lg text-center ${value < 0 ? 'bg-red-50' : 'bg-green-50'}`}
                    >
                      <p className="text-xs text-gray-600">{label}</p>
                      <p
                        className={`text-lg font-bold ${value < 0 ? 'text-red-600' : 'text-green-600'}`}
                      >
                        €{value.toLocaleString()}
                      </p>
                      {value < 0 ? (
                        <TrendingDown className="h-4 w-4 mx-auto text-red-600 mt-1" />
                      ) : (
                        <TrendingUp className="h-4 w-4 mx-auto text-green-600 mt-1" />
                      )}
                    </div>
                  );
                })
              : MONTH_LABELS.map((mes) => (
                  <div key={mes} className="p-3 rounded-lg text-center bg-gray-50">
                    <p className="text-xs text-gray-600">{mes}</p>
                    <p className="text-lg font-bold text-gray-400">€0</p>
                  </div>
                ))}
          </div>
          <Button className="mt-4">Generar Nueva Previsión</Button>
        </Card>

        {/* Depósitos y Provisiones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Fianzas Gestionadas</h3>
            <div className="space-y-3">
              {deposits.length > 0 ? (
                deposits.map((d) => (
                  <div key={d.id} className="border-b pb-3">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        Contrato #{d.contract?.id?.slice(-4) ?? d.id?.slice(-4)}
                      </span>
                      <span className="text-green-600 font-semibold">
                        €{(d.importeFianza ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Estado: Depositado</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 py-4">Sin datos disponibles</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Provisiones de Impagos</h3>
            <div className="bg-red-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">Total Provisión</p>
              <p className="text-2xl font-bold text-red-600">€{totalProvision.toLocaleString()}</p>
            </div>
            {provisions.length > 0 ? (
              <div className="space-y-2">
                {provisions.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{p.categoriaRiesgo ?? `Provisión #${i + 1}`}</span>
                    <span className="font-medium">€{(p.montoProvision ?? 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin datos disponibles</p>
            )}
          </Card>
        </div>

        {/* Alertas Financieras */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Alertas Financieras Activas</h3>
          <div className="space-y-3">
            {negativeMonths.length > 0 ? (
              negativeMonths.map((m, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Cash flow negativo en {m.mes || m.periodo}</p>
                    <p className="text-sm text-gray-600">
                      Déficit proyectado: €{(m.neto ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Revisar
                  </Button>
                </div>
              ))
            ) : totalProvision > 0 ? (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Provisiones de impagos activas</p>
                  <p className="text-sm text-gray-600">Total: €{totalProvision.toLocaleString()}</p>
                </div>
                <Button size="sm" variant="outline">
                  Ver
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4">Sin alertas activas</p>
            )}
          </div>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
