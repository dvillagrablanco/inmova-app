'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FunnelProps {
  pipeline: Record<string, string>;
  totalOpps: number;
}

const STAGES = [
  { key: 'descubierta', label: 'Descubierta', icon: '🔍', color: 'bg-gray-200 dark:bg-gray-700' },
  { key: 'analizada', label: 'Analizada', icon: '📊', color: 'bg-blue-200 dark:bg-blue-800' },
  { key: 'negociacion', label: 'Negociación', icon: '🤝', color: 'bg-amber-200 dark:bg-amber-800' },
  { key: 'ofertada', label: 'Ofertada', icon: '📝', color: 'bg-purple-200 dark:bg-purple-800' },
  { key: 'adquirida', label: 'Adquirida', icon: '✅', color: 'bg-green-200 dark:bg-green-800' },
];

export function FunnelMetrics({ pipeline, totalOpps }: FunnelProps) {
  const counts = STAGES.map(s => ({
    ...s,
    count: s.key === 'descubierta'
      ? totalOpps - Object.values(pipeline).filter(v => v !== 'descubierta').length
      : Object.values(pipeline).filter(v => v === s.key).length,
  }));

  const maxCount = Math.max(...counts.map(c => c.count), 1);

  return (
    <div className="space-y-2">
      {counts.map((stage, i) => {
        const width = Math.max(20, (stage.count / maxCount) * 100);
        const conversionRate = i > 0 && counts[i - 1].count > 0
          ? ((stage.count / counts[i - 1].count) * 100).toFixed(0)
          : null;

        return (
          <div key={stage.key} className="flex items-center gap-2">
            <span className="text-[10px] w-24 text-right text-muted-foreground">{stage.icon} {stage.label}</span>
            <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full ${stage.color} rounded-full flex items-center justify-end pr-2 transition-all`} style={{ width: `${width}%` }}>
                <span className="text-[10px] font-bold">{stage.count}</span>
              </div>
            </div>
            {conversionRate && (
              <span className="text-[9px] text-muted-foreground w-12">→{conversionRate}%</span>
            )}
          </div>
        );
      })}
      <div className="flex justify-between text-[9px] text-muted-foreground pt-1">
        <span>Tasa global: {counts[4].count > 0 && totalOpps > 0 ? ((counts[4].count / totalOpps) * 100).toFixed(1) : '0'}%</span>
        <span>Descartadas: {Object.values(pipeline).filter(v => v === 'descartada').length}</span>
      </div>
    </div>
  );
}
