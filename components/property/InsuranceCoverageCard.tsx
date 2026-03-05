'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, ShieldAlert, ExternalLink, Building2, FileText } from 'lucide-react';
import Link from 'next/link';

interface Policy {
  id: string;
  tipo: string;
  aseguradora: string;
  numeroPoliza: string;
  sumaAsegurada: number | null;
  primaAnual: number | null;
  fechaVencimiento: string;
  estado: string;
  documentoPath: string | null;
  buildingName?: string;
  unidadesCubiertas?: number;
}

interface CoverageData {
  hasCoverage: boolean;
  coverageSource: 'direct' | 'building' | 'both' | 'none';
  directPolicies: Policy[];
  buildingPolicies: Policy[];
  summary: {
    totalPolicies: number;
    activePolicies: number;
    totalCoverage: number;
  };
}

export function InsuranceCoverageCard({ unitId }: { unitId: string }) {
  const [data, setData] = useState<CoverageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/units/${unitId}/insurance-coverage`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Silently fail - insurance is supplementary info
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [unitId]);

  if (loading) return null;
  if (!data) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const allPolicies = [...data.directPolicies, ...data.buildingPolicies];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {data.hasCoverage ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-500" />
          )}
          Seguro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.hasCoverage ? (
          <>
            {/* Coverage badge */}
            <div className={`p-3 rounded-lg ${
              data.coverageSource === 'building' ? 'bg-blue-50 dark:bg-blue-950' :
              data.coverageSource === 'direct' ? 'bg-green-50 dark:bg-green-950' :
              'bg-emerald-50 dark:bg-emerald-950'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-green-600 text-white text-xs">Asegurado</Badge>
                {data.coverageSource === 'building' && (
                  <Badge variant="outline" className="text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    Póliza de edificio
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.summary.activePolicies} póliza{data.summary.activePolicies !== 1 ? 's' : ''} activa{data.summary.activePolicies !== 1 ? 's' : ''}
                {data.summary.totalCoverage > 0 && ` · Cobertura: ${fmt(data.summary.totalCoverage)}`}
              </p>
            </div>

            {/* Policy details */}
            {allPolicies.map((policy) => (
              <div key={policy.id} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{policy.tipo.replace('_', ' ')}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      policy.estado === 'activa' ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'
                    }`}
                  >
                    {policy.estado}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{policy.aseguradora}</p>
                <p className="text-xs font-mono text-muted-foreground">Póliza: {policy.numeroPoliza}</p>
                {policy.buildingName && (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Cubre todo {policy.buildingName}
                    {policy.unidadesCubiertas ? ` (${policy.unidadesCubiertas} unidades)` : ''}
                  </p>
                )}
                {policy.sumaAsegurada && (
                  <p className="text-xs">Suma asegurada: <strong>{fmt(policy.sumaAsegurada)}</strong></p>
                )}
                <div className="flex gap-2 pt-1">
                  <Link href={`/seguros/${policy.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      <FileText className="h-3 w-3 mr-1" />
                      Ver póliza
                    </Button>
                  </Link>
                  {policy.documentoPath && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => window.open(policy.documentoPath!, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Documento
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-4">
            <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-amber-400" />
            <p className="text-sm font-medium text-amber-700">Sin seguro activo</p>
            <p className="text-xs text-muted-foreground mb-3">
              Esta unidad no tiene póliza de seguro activa, ni directa ni a través del edificio.
            </p>
            <Link href="/seguros/nuevo">
              <Button variant="outline" size="sm" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Contratar seguro
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
