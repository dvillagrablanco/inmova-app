'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, FileText, Database, MessageSquare, Mail } from 'lucide-react';
import Link from 'next/link';

interface UsageData {
  period: string;
  signatures: {
    used: number;
    limit: number;
    percentage: number;
    cost: number;
  };
  storage: {
    used: number;
    limit: number;
    percentage: number;
    cost: number;
    unit: string;
  };
  aiTokens: {
    used: number;
    limit: number;
    percentage: number;
    cost: number;
  };
  sms: {
    used: number;
    limit: number;
    percentage: number;
    cost: number;
  };
  totalCost: number;
  overageCost: number;
  warnings: Array<{ service: string; percentage: number }>;
}

export function UsageDashboard() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/usage/current');
      const data = await res.json();
      
      if (data.success) {
        setUsage(data.usage);
      } else {
        setError(data.error || 'Error cargando uso');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !usage) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || 'No se pudo cargar el uso'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge variant="destructive">Crítico</Badge>;
    if (percentage >= 80) return <Badge variant="warning">Alerta</Badge>;
    return <Badge variant="success">Normal</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {usage.warnings.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Advertencias de uso:</div>
            <ul className="list-disc list-inside space-y-1">
              {usage.warnings.map((w: any, i) => (
                <li key={i}>
                  {w.service === 'signatures' && `Firmas digitales: ${w.percentage}% usado`}
                  {w.service === 'storage' && `Almacenamiento: ${w.percentage}% usado`}
                  {w.service === 'aiTokens' && `IA: ${w.percentage}% usado`}
                  {w.service === 'sms' && `SMS: ${w.percentage}% usado`}
                </li>
              ))}
            </ul>
            <Link href="/dashboard/billing">
              <Button size="sm" className="mt-3">
                Actualizar Plan
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Uso Mensual</CardTitle>
          <CardDescription>
            Período: {new Date(usage.period).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {usage.signatures.used}/{usage.signatures.limit}
              </div>
              <div className="text-sm text-gray-600">Firmas Digitales</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {usage.storage.used.toFixed(1)}/{usage.storage.limit} GB
              </div>
              <div className="text-sm text-gray-600">Almacenamiento</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {(usage.aiTokens.used / 1000).toFixed(1)}K/{(usage.aiTokens.limit / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-gray-600">Tokens IA</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                €{usage.totalCost.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Costo Actual</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Signatures */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Firmas Digitales</CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{usage.signatures.used}</span>
                <span className="text-sm text-gray-500">de {usage.signatures.limit} incluidas</span>
              </div>
              <Progress 
                value={usage.signatures.percentage} 
                className="h-2"
                indicatorClassName={getProgressColor(usage.signatures.percentage)}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{usage.signatures.percentage}% usado</span>
                {getStatusBadge(usage.signatures.percentage)}
              </div>
              {usage.signatures.percentage >= 100 && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">
                    Has alcanzado tu límite mensual. Actualiza tu plan para crear más firmas.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Almacenamiento</CardTitle>
            <Database className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{usage.storage.used.toFixed(2)} GB</span>
                <span className="text-sm text-gray-500">de {usage.storage.limit} GB</span>
              </div>
              <Progress 
                value={usage.storage.percentage} 
                className="h-2"
                indicatorClassName={getProgressColor(usage.storage.percentage)}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{usage.storage.percentage}% usado</span>
                {getStatusBadge(usage.storage.percentage)}
              </div>
              {usage.storage.percentage >= 100 && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">
                    Almacenamiento lleno. Actualiza tu plan o elimina archivos antiguos.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Tokens */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">IA (Valoraciones y Chat)</CardTitle>
            <MessageSquare className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{(usage.aiTokens.used / 1000).toFixed(1)}K</span>
                <span className="text-sm text-gray-500">de {(usage.aiTokens.limit / 1000).toFixed(0)}K tokens</span>
              </div>
              <Progress 
                value={usage.aiTokens.percentage} 
                className="h-2"
                indicatorClassName={getProgressColor(usage.aiTokens.percentage)}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{usage.aiTokens.percentage}% usado</span>
                {getStatusBadge(usage.aiTokens.percentage)}
              </div>
              {usage.aiTokens.percentage >= 100 && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">
                    Has alcanzado tu límite de IA. Actualiza tu plan para más valoraciones y chat.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SMS (if available) */}
        {usage.sms.limit > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">SMS</CardTitle>
              <Mail className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{usage.sms.used}</span>
                  <span className="text-sm text-gray-500">de {usage.sms.limit} SMS</span>
                </div>
                <Progress 
                  value={usage.sms.percentage} 
                  className="h-2"
                  indicatorClassName={getProgressColor(usage.sms.percentage)}
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{usage.sms.percentage}% usado</span>
                  {getStatusBadge(usage.sms.percentage)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overage Warning */}
      {usage.overageCost > 0 && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-1">Excesos detectados</div>
            <div className="text-sm">
              Has excedido los límites de tu plan. Se aplicará un cargo adicional de{' '}
              <span className="font-bold">€{usage.overageCost.toFixed(2)}</span> este mes.
            </div>
            <Link href="/dashboard/billing">
              <Button size="sm" variant="outline" className="mt-2">
                Ver Facturación
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Upgrade CTA */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                ¿Necesitas más recursos?
              </h3>
              <p className="text-sm text-gray-600">
                Actualiza tu plan para obtener más firmas, almacenamiento y funcionalidades IA.
              </p>
            </div>
            <Link href="/dashboard/billing">
              <Button>
                Ver Planes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
