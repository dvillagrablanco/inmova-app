'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, FileText, AlertTriangle, CheckCircle2, XCircle, Info, Shield, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  title: string;
  detail: string;
  action?: string;
}

export default function DocumentHistoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [summary, setSummary] = useState({ total: 0, errors: 0, warnings: 0, info: 0 });

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') runValidation();
  }, [status, router]);

  const runValidation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding/documents/validate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
        setSummary(data.summary || { total: 0, errors: 0, warnings: 0, info: 0 });
      }
    } catch { toast.error('Error ejecutando validación'); }
    finally { setLoading(false); }
  };

  const typeConfig = {
    error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', badge: 'destructive' as const },
    warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', badge: 'secondary' as const },
    info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', badge: 'outline' as const },
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <Breadcrumb><BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-3.5 w-3.5" /></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/onboarding/documents">Documentos</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Validación de Datos</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList></Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Validación Cruzada de Datos</h1>
            <p className="text-gray-500">Detección automática de inconsistencias en los datos importados</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={runValidation} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Validar
            </Button>
            <Button onClick={() => router.push('/onboarding/documents')}>
              <FileText className="h-4 w-4 mr-2" />
              Importar Documentos
            </Button>
          </div>
        </div>

        {/* Summary */}
        {!loading && (
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-3xl font-bold">{summary.total}</div>
                <div className="text-xs text-gray-500">Issues Totales</div>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardContent className="pt-4 text-center">
                <div className="text-3xl font-bold text-red-600">{summary.errors}</div>
                <div className="text-xs text-red-500">Errores</div>
              </CardContent>
            </Card>
            <Card className="border-amber-200">
              <CardContent className="pt-4 text-center">
                <div className="text-3xl font-bold text-amber-600">{summary.warnings}</div>
                <div className="text-xs text-amber-500">Warnings</div>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="pt-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{summary.info}</div>
                <div className="text-xs text-blue-500">Informativos</div>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? (
          <Card><CardContent className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" /><p className="text-gray-500">Ejecutando validación cruzada...</p></CardContent></Card>
        ) : issues.length === 0 ? (
          <Card className="border-green-200 bg-green-50/30">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-800">¡Datos correctos!</h3>
              <p className="text-green-600">No se detectaron inconsistencias en los datos importados.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, i) => {
              const cfg = typeConfig[issue.type];
              const Icon = cfg.icon;
              return (
                <Card key={i} className={`border ${cfg.bg}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{issue.title}</span>
                          <Badge variant={cfg.badge} className="text-[10px]">{issue.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{issue.detail}</p>
                        {issue.action && (
                          <p className="text-xs text-gray-500 mt-1 font-medium">→ {issue.action}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
