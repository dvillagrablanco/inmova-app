'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface RenovationProps {
  surface: number;
  currentPrice: number;
  location: string;
}

const RENOVATION_COSTS: { type: string; costPerM2: number; valueIncrease: number; rentIncrease: number }[] = [
  { type: 'Básica (pintura, suelos)', costPerM2: 200, valueIncrease: 8, rentIncrease: 5 },
  { type: 'Media (cocina, baños)', costPerM2: 500, valueIncrease: 15, rentIncrease: 12 },
  { type: 'Integral (todo)', costPerM2: 900, valueIncrease: 25, rentIncrease: 20 },
  { type: 'Premium (alta gama)', costPerM2: 1500, valueIncrease: 35, rentIncrease: 25 },
];

export function RenovationCalculator({ surface, currentPrice, location }: RenovationProps) {
  const [selectedType, setSelectedType] = useState(1); // Media by default
  const [customSurface, setCustomSurface] = useState(surface || 80);

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-end">
        <div><Label className="text-[10px]">Superficie m²</Label><Input type="number" className="h-7 text-xs w-20" value={customSurface} onChange={e => setCustomSurface(parseInt(e.target.value) || 80)} /></div>
      </div>
      <div className="space-y-1.5">
        {RENOVATION_COSTS.map((r, i) => {
          const cost = r.costPerM2 * customSurface;
          const newValue = currentPrice * (1 + r.valueIncrease / 100);
          const valueGain = newValue - currentPrice;
          const roi = cost > 0 ? ((valueGain - cost) / cost) * 100 : 0;
          const isSelected = i === selectedType;
          return (
            <div key={i} className={`p-2 border rounded text-[10px] cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setSelectedType(i)}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{r.type}</p>
                  <p className="text-muted-foreground">{r.costPerM2}€/m² · Valor +{r.valueIncrease}% · Renta +{r.rentIncrease}%</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{fmt(cost)}</p>
                  <Badge variant="outline" className={`text-[9px] ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ROI {roi > 0 ? '+' : ''}{roi.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded text-[10px]">
        <p>💡 En {location}, la reforma {RENOVATION_COSTS[selectedType].type.toLowerCase()} tiene un ROI positivo si el precio/m² post-reforma supera {fmt(Math.round((currentPrice + RENOVATION_COSTS[selectedType].costPerM2 * customSurface) / customSurface))}/m²</p>
      </div>
    </div>
  );
}
