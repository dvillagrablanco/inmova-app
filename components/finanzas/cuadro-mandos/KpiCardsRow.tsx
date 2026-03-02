'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  BarChart3,
  Percent,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCompact, formatPct } from '@/lib/finanzas/pyg-config';
import type { CarteraKpis, EjercicioComparativo } from '@/types/finanzas';

interface KpiCardsRowProps {
  kpis: CarteraKpis;
  ejerciciosComparativos: EjercicioComparativo[];
  ejercicioActual: number;
}

interface KpiCardData {
  title: string;
  value: string;
  icon: typeof DollarSign;
  color: string;
  bgColor: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
}

export function KpiCardsRow({ kpis, ejerciciosComparativos, ejercicioActual }: KpiCardsRowProps) {
  // Buscar el ejercicio anterior para calcular tendencia
  const prevYear = ejerciciosComparativos.find((e) => e.ejercicio === ejercicioActual - 1);

  function calcTrend(current: number, previous: number | undefined): KpiCardData['trend'] {
    if (previous === undefined || previous === 0) return undefined;
    const pctChange = ((current - previous) / Math.abs(previous)) * 100;
    const direction = pctChange >= 0 ? 'up' : 'down';
    return {
      value: `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}%`,
      direction: pctChange === 0 ? 'neutral' : direction,
    };
  }

  const cards: KpiCardData[] = [
    {
      title: 'Valor Inversión',
      value: formatCompact(kpis.valorInversion),
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: calcTrend(kpis.valorInversion, prevYear?.valorInversion),
    },
    {
      title: 'Valor de Mercado',
      value: formatCompact(kpis.valorMercado),
      icon: BarChart3,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: calcTrend(kpis.valorMercado, prevYear?.valorMercado),
    },
    {
      title: 'Plusvalía Latente',
      value: formatCompact(kpis.plusvaliaLatente),
      icon: kpis.plusvaliaLatente >= 0 ? TrendingUp : TrendingDown,
      color: kpis.plusvaliaLatente >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: kpis.plusvaliaLatente >= 0 ? 'bg-green-50' : 'bg-red-50',
      trend: calcTrend(kpis.plusvaliaLatente, prevYear?.plusvaliaLatente),
    },
    {
      title: 'Tasa Disponibilidad',
      value: formatPct(kpis.tasaDisponibilidad),
      icon: Percent,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      trend: calcTrend(kpis.tasaDisponibilidad, prevYear?.tasaDisponibilidad),
    },
    {
      title: 'Tasa Ocupación',
      value: formatPct(kpis.tasaOcupacion),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: calcTrend(kpis.tasaOcupacion, prevYear?.tasaOcupacion),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 truncate">{card.title}</p>
                  <p className="text-xl font-bold mt-1 truncate">{card.value}</p>
                  {card.trend && (
                    <div
                      className={`flex items-center mt-1 text-xs ${
                        card.trend.direction === 'up'
                          ? 'text-green-600'
                          : card.trend.direction === 'down'
                            ? 'text-red-600'
                            : 'text-gray-500'
                      }`}
                    >
                      {card.trend.direction === 'up' ? (
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      ) : card.trend.direction === 'down' ? (
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      ) : null}
                      <span>{card.trend.value}</span>
                      <span className="text-gray-400 ml-1">vs {ejercicioActual - 1}</span>
                    </div>
                  )}
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor} ml-2 shrink-0`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
