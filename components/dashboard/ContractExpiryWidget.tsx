'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, ChevronRight, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ContractItem = {
  id: string;
  buildingName: string;
  unitNumber: string;
  tenantName: string;
  fechaFin: string;
  rentaMensual: number;
  renovacionAutomatica: boolean;
  daysUntil: number;
};

type ExpiringData = {
  critico: ContractItem[];
  alerta: ContractItem[];
  info: ContractItem[];
};

export function ContractExpiryWidget() {
  const router = useRouter();
  const [data, setData] = useState<ExpiringData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contracts/expiring?days=90')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="compact">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contratos por vencer
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  const total =
    (data?.critico?.length || 0) +
    (data?.alerta?.length || 0) +
    (data?.info?.length || 0);

  if (!data || total === 0) {
    return (
      <Card className="compact">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contratos por vencer
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <p className="text-muted-foreground text-sm">Ningún contrato vence en los próximos 90 días.</p>
        </CardContent>
      </Card>
    );
  }

  const renderSection = (
    title: string,
    items: ContractItem[],
    badgeClass: string,
    icon: React.ReactNode
  ) => {
    if (!items?.length) return null;
    return (
      <div className="mb-3 last:mb-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          {icon}
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', badgeClass)}>
            {items.length}
          </Badge>
        </div>
        <ul className="space-y-1">
          {items.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => router.push(`/contratos/${c.id}`)}
                className="w-full text-left flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-muted/60 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">
                    {c.buildingName} · {c.unitNumber}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {c.tenantName} · {c.rentaMensual.toLocaleString('es-ES')}€/mes
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Fin: {new Date(c.fechaFin).toLocaleDateString('es-ES')} ({c.daysUntil}d)
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge
                    variant={c.renovacionAutomatica ? 'default' : 'destructive'}
                    className="text-[9px] px-1 py-0"
                  >
                    {c.renovacionAutomatica ? 'Auto-renovable' : 'Requiere acción'}
                  </Badge>
                  <ChevronRight className="h-3.5 w-3 text-muted-foreground group-hover:text-foreground" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card className="compact">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Contratos por vencer
          <Badge variant="outline" className="text-[10px] ml-auto">
            {total}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4 space-y-2">
        {renderSection(
          'Crítico (<30d)',
          data.critico || [],
          'border-destructive text-destructive',
          <AlertTriangle className="h-3.5 w-3 text-destructive" />
        )}
        {renderSection(
          'Alerta (<60d)',
          data.alerta || [],
          'border-amber-500 text-amber-600',
          <Clock className="h-3.5 w-3 text-amber-500" />
        )}
        {renderSection(
          'Info (<90d)',
          data.info || [],
          'border-blue-500 text-blue-600',
          <Clock className="h-3.5 w-3 text-blue-500" />
        )}
      </CardContent>
    </Card>
  );
}
