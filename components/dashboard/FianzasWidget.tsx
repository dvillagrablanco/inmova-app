'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertCircle } from 'lucide-react';

type FianzaItem = {
  id: string;
  buildingName: string;
  unitNumber: string;
  tenantName: string;
  importe: number;
  depositada: boolean;
};

type FianzaSummary = {
  totalFianzas: number;
  totalContratos: number;
  depositadas: number;
  pendientes: number;
};

export function FianzasWidget() {
  const [summary, setSummary] = useState<FianzaSummary | null>(null);
  const [items, setItems] = useState<FianzaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contracts/fianzas')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setSummary(json.summary);
          setItems(json.items || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Fianzas
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  const pendientes = items.filter((i) => !i.depositada && i.importe > 0);

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Fianzas
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4 space-y-3">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold">
            {summary?.totalFianzas?.toLocaleString('es-ES') ?? 0}€
          </span>
          <span className="text-xs text-muted-foreground">
            Total en {summary?.totalContratos ?? 0} contratos
          </span>
        </div>
        <div className="flex gap-2">
          <Badge variant="default" className="text-[10px]">
            {summary?.depositadas ?? 0} depositadas
          </Badge>
          <Badge variant={pendientes.length ? 'destructive' : 'secondary'} className="text-[10px]">
            {summary?.pendientes ?? 0} pendientes
          </Badge>
        </div>
        {pendientes.length > 0 && (
          <div className="rounded border border-destructive/50 bg-destructive/5 p-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertCircle className="h-3.5 w-3 text-destructive" />
              <span className="text-xs font-medium text-destructive">
                Requieren depósito
              </span>
            </div>
            <ul className="space-y-1">
              {pendientes.slice(0, 3).map((item) => (
                <li key={item.id} className="text-[11px] text-muted-foreground">
                  {item.buildingName} · {item.unitNumber}: {item.importe.toLocaleString('es-ES')}€
                </li>
              ))}
              {pendientes.length > 3 && (
                <li className="text-[11px] text-muted-foreground">
                  +{pendientes.length - 3} más
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
