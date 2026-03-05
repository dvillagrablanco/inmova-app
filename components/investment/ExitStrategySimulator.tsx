'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ExitProps {
  price: number;
  estimatedYield: number;
  location: string;
}

export function ExitStrategySimulator({ price, estimatedYield, location }: ExitProps) {
  const [holdYears, setHoldYears] = useState(5);
  const [appreciation, setAppreciation] = useState(3); // % annual
  const [exitCosts, setExitCosts] = useState(8); // % of sale price (agency + taxes)

  const monthlyRent = price > 0 && estimatedYield ? (price * (estimatedYield / 100)) / 12 : 0;
  const annualExpenses = price * 0.015;
  const annualCashFlow = monthlyRent * 12 - annualExpenses;
  const totalCashFlow = annualCashFlow * holdYears;
  const futureValue = price * Math.pow(1 + appreciation / 100, holdYears);
  const capitalGain = futureValue - price;
  const exitCost = futureValue * (exitCosts / 100);
  const netCapitalGain = capitalGain - exitCost;
  const totalReturn = totalCashFlow + netCapitalGain;
  const totalROI = price > 0 ? (totalReturn / price) * 100 : 0;
  const annualizedROI = holdYears > 0 ? (Math.pow(1 + totalROI / 100, 1 / holdYears) - 1) * 100 : 0;

  // Scenarios
  const scenarios = [
    { name: '🔒 Mantener alquiler', totalReturn: totalCashFlow, roi: price > 0 ? (totalCashFlow / price) * 100 : 0, desc: `${holdYears} años de renta` },
    { name: '💰 Venta', totalReturn: totalReturn, roi: totalROI, desc: `Renta + revalorización ${appreciation}%/año` },
    { name: '🔄 Refinanciar', totalReturn: totalCashFlow + capitalGain * 0.7, roi: price > 0 ? ((totalCashFlow + capitalGain * 0.7) / price) * 100 : 0, desc: 'Cash-out 70% de la revalorización' },
  ];

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div><Label className="text-[10px]">Años</Label><Input type="number" className="h-7 text-xs" value={holdYears} onChange={e => setHoldYears(parseInt(e.target.value) || 5)} /></div>
        <div><Label className="text-[10px]">Revalorización %/año</Label><Input type="number" step="0.5" className="h-7 text-xs" value={appreciation} onChange={e => setAppreciation(parseFloat(e.target.value) || 3)} /></div>
        <div><Label className="text-[10px]">Costes salida %</Label><Input type="number" className="h-7 text-xs" value={exitCosts} onChange={e => setExitCosts(parseFloat(e.target.value) || 8)} /></div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <p className="text-muted-foreground">Valor futuro ({holdYears}a)</p>
          <p className="font-bold">{fmt(futureValue)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <p className="text-muted-foreground">Cash-flow acumulado</p>
          <p className="font-bold text-green-600">{fmt(totalCashFlow)}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {scenarios.map(s => (
          <div key={s.name} className="flex items-center justify-between p-2 border rounded text-[10px]">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-muted-foreground">{s.desc}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{fmt(s.totalReturn)}</p>
              <Badge variant="outline" className={`text-[9px] ${s.roi > 50 ? 'text-green-600' : s.roi > 20 ? 'text-blue-600' : 'text-amber-600'}`}>
                ROI {s.roi.toFixed(0)}%
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded text-[10px]">
        <p className="font-medium">📊 TIR estimada (venta): <strong className="text-blue-600">{annualizedROI.toFixed(1)}%</strong> anualizada</p>
      </div>
    </div>
  );
}
