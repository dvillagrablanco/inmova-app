'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar } from 'lucide-react';

type RentUpdateItem = {
  id: string;
  buildingName: string;
  unitNumber: string;
  tenantName: string;
  currentRent: number;
  newRent: number;
  incrementoPct: number;
  incrementoType: string;
  anniversaryDate: string;
};

export function RentUpdateWidget() {
  const [data, setData] = useState<RentUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contracts/rent-updates')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Actualizaciones IPC
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Actualizaciones IPC
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <p className="text-muted-foreground text-sm">
            No hay contratos con próximas actualizaciones de renta.
          </p>
        </CardContent>
      </Card>
    );
  }

  const badgeLabel = (item: RentUpdateItem) =>
    item.incrementoType === 'ipc'
      ? `IPC ${item.incrementoPct}%`
      : `Fijo ${item.incrementoPct.toFixed(1)}%`;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Actualizaciones IPC
          <Badge variant="outline" className="text-[10px] ml-auto">
            {data.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <ul className="space-y-3">
          {data.slice(0, 5).map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-1 p-2 rounded border border-border/50 bg-muted/30"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium truncate">
                  {item.buildingName} · {item.unitNumber}
                </span>
                <Badge variant="secondary" className="text-[9px] shrink-0">
                  {badgeLabel(item)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground line-through">
                  {item.currentRent.toLocaleString('es-ES')}€
                </span>
                <span className="text-foreground font-medium">
                  → {item.newRent.toLocaleString('es-ES')}€
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(item.anniversaryDate).toLocaleDateString('es-ES')}
              </div>
            </li>
          ))}
        </ul>
        {data.length > 5 && (
          <p className="text-[11px] text-muted-foreground mt-2">
            +{data.length - 5} más
          </p>
        )}
      </CardContent>
    </Card>
  );
}
