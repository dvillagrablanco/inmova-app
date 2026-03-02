'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCompact, formatPct } from '@/lib/finanzas/pyg-config';
import type { EjercicioComparativo } from '@/types/finanzas';
import { cn } from '@/lib/utils';

interface ComparativoEjerciciosProps {
  ejercicios: EjercicioComparativo[];
  ejercicioActual: number;
}

interface MetricRow {
  label: string;
  getValue: (ej: EjercicioComparativo) => string;
  getRaw: (ej: EjercicioComparativo) => number;
  isPercentage?: boolean;
}

export function ComparativoEjercicios({
  ejercicios,
  ejercicioActual,
}: ComparativoEjerciciosProps) {
  if (ejercicios.length === 0) return null;

  const metrics: MetricRow[] = [
    {
      label: 'Valor Inversión',
      getValue: (ej) => formatCompact(ej.valorInversion),
      getRaw: (ej) => ej.valorInversion,
    },
    {
      label: 'Valor de Mercado',
      getValue: (ej) => formatCompact(ej.valorMercado),
      getRaw: (ej) => ej.valorMercado,
    },
    {
      label: 'Plusvalía Latente',
      getValue: (ej) => formatCompact(ej.plusvaliaLatente),
      getRaw: (ej) => ej.plusvaliaLatente,
    },
    {
      label: 'Tasa Disponibilidad',
      getValue: (ej) => formatPct(ej.tasaDisponibilidad),
      getRaw: (ej) => ej.tasaDisponibilidad,
      isPercentage: true,
    },
    {
      label: 'Tasa Ocupación',
      getValue: (ej) => formatPct(ej.tasaOcupacion),
      getRaw: (ej) => ej.tasaOcupacion,
      isPercentage: true,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Comparativo Multi-Ejercicio</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50/80">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 w-[180px]">
                  Indicador
                </th>
                {ejercicios.map((ej) => (
                  <th
                    key={ej.ejercicio}
                    className={cn(
                      'text-right px-3 py-2 text-xs font-semibold',
                      ej.ejercicio === ejercicioActual
                        ? 'text-blue-700 bg-blue-50/50'
                        : 'text-gray-600'
                    )}
                  >
                    {ej.ejercicio}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.label} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-2 text-xs font-medium text-gray-700">{metric.label}</td>
                  {ejercicios.map((ej, idx) => {
                    const raw = metric.getRaw(ej);
                    const prevRaw = idx > 0 ? metric.getRaw(ejercicios[idx - 1]) : null;
                    const isImproving =
                      prevRaw !== null && prevRaw !== 0
                        ? metric.isPercentage
                          ? raw > prevRaw
                          : raw > prevRaw
                        : null;

                    return (
                      <td
                        key={ej.ejercicio}
                        className={cn(
                          'text-right px-3 py-2 text-xs tabular-nums',
                          ej.ejercicio === ejercicioActual && 'bg-blue-50/30 font-medium',
                          raw < 0 && 'text-red-600'
                        )}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {metric.getValue(ej)}
                          {isImproving !== null && (
                            <span
                              className={cn(
                                'text-[10px]',
                                isImproving ? 'text-green-500' : 'text-red-400'
                              )}
                            >
                              {isImproving ? '▲' : '▼'}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
