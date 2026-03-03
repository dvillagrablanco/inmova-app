'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface CostCenterData {
  categories: Array<{
    code: string;
    name: string;
    ingresos: number;
    gastos: number;
    saldo: number;
    percentage: number;
    color: string;
  }>;
  total: { ingresos: number; gastos: number; saldo: number };
}

const CODE_BADGE_VARIANTS: Record<string, string> = {
  DIR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  CDI: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'DF-GEN': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'DI-COGE': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

function formatEur(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface CostCenterBreakdownProps {
  data?: CostCenterData;
}

export function CostCenterBreakdown({ data }: CostCenterBreakdownProps) {
  if (!data || !data.categories?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Desglose por centro de coste</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Importe el mapeo analítico para ver centros de coste
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(
    ...data.categories.map((c) => c.ingresos + c.gastos),
    1
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desglose por centro de coste</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.categories.map((cat) => {
          const total = cat.ingresos + cat.gastos;
          const barWidth = maxValue > 0 ? (total / maxValue) * 100 : 0;
          const ingresosPct = total > 0 ? (cat.ingresos / total) * 100 : 0;
          const gastosPct = total > 0 ? (cat.gastos / total) * 100 : 0;

          return (
            <div key={cat.code} className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge
                  className={CODE_BADGE_VARIANTS[cat.code] || 'bg-gray-100 text-gray-800'}
                >
                  {cat.code}
                </Badge>
                <span className="text-sm font-medium">{cat.name}</span>
              </div>
              <div className="relative h-6 w-full overflow-hidden rounded-md bg-muted">
                <div
                  className="absolute inset-y-0 left-0 flex"
                  style={{ width: `${barWidth}%` }}
                >
                  <div
                    className="h-full bg-green-500/80"
                    style={{ width: `${ingresosPct}%` }}
                  />
                  <div
                    className="h-full bg-red-500/80"
                    style={{ width: `${gastosPct}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Ingresos: {formatEur(cat.ingresos)}</span>
                <span>Gastos: {formatEur(cat.gastos)}</span>
                <span className="font-medium text-foreground">
                  Saldo: {formatEur(cat.saldo)}
                </span>
              </div>
            </div>
          );
        })}

        <div className="border-t pt-4">
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <div className="flex gap-4">
              <span>Ingresos: {formatEur(data.total.ingresos)}</span>
              <span>Gastos: {formatEur(data.total.gastos)}</span>
              <span>Saldo: {formatEur(data.total.saldo)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
