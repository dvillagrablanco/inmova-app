'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2, TrendingUp, Euro, Percent, ArrowUpRight, ArrowDownRight, Landmark,
} from 'lucide-react';
import { toast } from 'sonner';

interface CompanySummary {
  companyId: string;
  companyName: string;
  cif: string;
  portfolio: {
    totalAssets: number;
    totalInvestment: number;
    totalMarketValue: number;
    totalMortgageDebt: number;
    totalEquity: number;
    totalMonthlyIncome: number;
    totalMonthlyExpenses: number;
    totalMortgagePayments: number;
    monthlyCashFlow: number;
    grossYield: number;
    netYield: number;
    averageOccupancy: number;
    ltv: number;
  };
}

export default function ComparativaPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/investment/consolidated');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.data?.companies || []);
      }
    } catch { toast.error('Error cargando comparativa'); }
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

  // Encontrar mejores/peores para destacar
  const bestYield = Math.max(...companies.map(c => c.portfolio.netYield));
  const bestOccupancy = Math.max(...companies.map(c => c.portfolio.averageOccupancy));

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comparativa de Sociedades</h1>
          <p className="text-gray-500">Rendimiento lado a lado de cada sociedad del grupo</p>
        </div>

        {/* Tabla comparativa */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-500">Metrica</th>
                    {companies.map(c => (
                      <th key={c.companyId} className="text-right p-4 font-medium text-gray-900">
                        <div>{c.companyName}</div>
                        <div className="text-xs text-gray-400 font-normal">{c.cif}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-4 text-gray-500 flex items-center gap-2"><Building2 className="h-4 w-4" /> Activos</td>
                    {companies.map(c => (
                      <td key={c.companyId} className="p-4 text-right font-medium">{c.portfolio.totalAssets}</td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="p-4 text-gray-500">Inversion total</td>
                    {companies.map(c => (
                      <td key={c.companyId} className="p-4 text-right font-medium">{fmt(c.portfolio.totalInvestment)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-500">Valor de mercado</td>
                    {companies.map(c => (
                      <td key={c.companyId} className="p-4 text-right font-medium">{fmt(c.portfolio.totalMarketValue)}</td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="p-4 text-gray-500 flex items-center gap-2"><Landmark className="h-4 w-4" /> Deuda hipotecaria</td>
                    {companies.map(c => (
                      <td key={c.companyId} className="p-4 text-right font-medium text-red-600">{fmt(c.portfolio.totalMortgageDebt)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-500 font-medium">Patrimonio neto</td>
                    {companies.map(c => (
                      <td key={c.companyId} className="p-4 text-right font-bold text-green-600">{fmt(c.portfolio.totalEquity)}</td>
                    ))}
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="p-4 text-gray-500 flex items-center gap-2"><Euro className="h-4 w-4" /> Cash-flow mensual</td>
                    {companies.map(c => (
                      <td key={c.companyId} className={`p-4 text-right font-bold ${c.portfolio.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(c.portfolio.monthlyCashFlow)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-500 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Rentabilidad neta</td>
                    {companies.map(c => (
                      <td key={c.companyId} className="p-4 text-right font-medium">
                        {c.portfolio.netYield}%
                        {c.portfolio.netYield === bestYield && companies.length > 1 && (
                          <Badge className="ml-2 text-xs" variant="default">Mejor</Badge>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="p-4 text-gray-500 flex items-center gap-2"><Percent className="h-4 w-4" /> Ocupacion</td>
                    {companies.map(c => (
                      <td key={c.companyId} className="p-4 text-right font-medium">
                        {c.portfolio.averageOccupancy}%
                        {c.portfolio.averageOccupancy === bestOccupancy && companies.length > 1 && (
                          <Badge className="ml-2 text-xs" variant="default">Mejor</Badge>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-500">LTV</td>
                    {companies.map(c => (
                      <td key={c.companyId} className={`p-4 text-right font-medium ${c.portfolio.ltv > 70 ? 'text-red-600' : c.portfolio.ltv > 50 ? 'text-orange-600' : 'text-green-600'}`}>
                        {c.portfolio.ltv}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {companies.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No hay sociedades filiales. Configura Viroda y Rovida como filiales de Vidaro en Configuracion &gt; Empresas.
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
