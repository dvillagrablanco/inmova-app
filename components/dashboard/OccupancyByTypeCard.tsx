'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Store,
  Car,
  Archive,
  Briefcase,
  Warehouse,
  Monitor,
} from 'lucide-react';

export interface OccupancyTypeData {
  tipo: string;
  label: string;
  ocupadas: number;
  disponibles: number;
  total: number;
  tasa: number;
}

interface OccupancyByTypeCardProps {
  data: OccupancyTypeData[];
  tasaTotal: number;
  tasaCore: number;
  className?: string;
  compact?: boolean;
}

const typeIcons: Record<string, any> = {
  vivienda: Home,
  local: Store,
  garaje: Car,
  trastero: Archive,
  oficina: Briefcase,
  nave_industrial: Warehouse,
  coworking_space: Monitor,
};

const typeColors: Record<string, { bar: string; bg: string; text: string }> = {
  vivienda: { bar: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  local: { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  garaje: { bar: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600' },
  trastero: { bar: 'bg-stone-400', bg: 'bg-stone-50', text: 'text-stone-600' },
  oficina: { bar: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
  nave_industrial: { bar: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  coworking_space: { bar: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700' },
};

function getStatusBadge(tasa: number) {
  if (tasa >= 90) return { label: 'Excelente', variant: 'default' as const, className: 'bg-green-600' };
  if (tasa >= 70) return { label: 'Buena', variant: 'default' as const, className: 'bg-blue-600' };
  if (tasa >= 50) return { label: 'Moderada', variant: 'default' as const, className: 'bg-amber-500' };
  if (tasa > 0) return { label: 'Baja', variant: 'destructive' as const, className: '' };
  return { label: 'Vacío', variant: 'secondary' as const, className: '' };
}

export function OccupancyByTypeCard({
  data,
  tasaTotal,
  tasaCore,
  className = '',
  compact = false,
}: OccupancyByTypeCardProps) {
  if (!data || data.length === 0) return null;

  const totalOcupadas = data.reduce((s, d) => s + d.ocupadas, 0);
  const totalUnidades = data.reduce((s, d) => s + d.total, 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Ocupación por Tipo de Activo</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              Total: {tasaTotal.toFixed(1)}%
            </Badge>
            {tasaCore !== tasaTotal && (
              <Badge className="text-xs bg-indigo-600">
                Sin garajes: {tasaCore.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary row */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total unidades</p>
            <p className="text-2xl font-bold">{totalUnidades}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Ocupadas</p>
            <p className="text-2xl font-bold text-green-600">{totalOcupadas}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Disponibles</p>
            <p className="text-2xl font-bold text-amber-600">{totalUnidades - totalOcupadas}</p>
          </div>
        </div>

        {/* Per-type breakdown */}
        <div className="space-y-3">
          {data.map((item) => {
            const Icon = typeIcons[item.tipo] || Home;
            const colors = typeColors[item.tipo] || typeColors.vivienda;
            const status = getStatusBadge(item.tasa);
            const isMinorType = ['garaje', 'trastero'].includes(item.tipo);

            return (
              <div
                key={item.tipo}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                  isMinorType ? 'bg-gray-50/50' : colors.bg
                }`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 p-1.5 rounded-md ${isMinorType ? 'bg-gray-100' : colors.bg}`}>
                  <Icon className={`h-4 w-4 ${isMinorType ? 'text-gray-500' : colors.text}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isMinorType ? 'text-gray-600' : 'text-gray-900'}`}>
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {item.ocupadas}/{item.total}
                      </span>
                      {!compact && (
                        <Badge variant={status.variant} className={`text-[10px] px-1.5 py-0 ${status.className}`}>
                          {status.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${colors.bar}`}
                      style={{ width: `${Math.max(item.tasa, 1)}%` }}
                    />
                  </div>
                </div>

                {/* Rate */}
                <div className="flex-shrink-0 w-14 text-right">
                  <span className={`text-sm font-bold ${
                    item.tasa >= 70 ? 'text-green-600' :
                    item.tasa >= 50 ? 'text-amber-600' :
                    item.tasa > 0 ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {item.tasa.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
