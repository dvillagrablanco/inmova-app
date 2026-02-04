'use client';

import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Report {
  id: string;
  tipo: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  totalIngresos: number;
  totalGastos: number;
  saldoFinal: number;
  generadoEn: string;
  community: {
    nombreComunidad: string;
  };
}

interface CommunityOption {
  id: string;
  nombreComunidad: string;
  direccion: string;
  ciudad?: string;
}

const tipoBadgeVariant = (tipo: string) => {
  switch (tipo) {
    case 'trimestral':
      return 'default';
    case 'anual':
      return 'secondary';
    default:
      return 'outline';
  }
};

export default function InformesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityIdParam = searchParams.get('communityId') || '';
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [formState, setFormState] = useState({
    communityId: '',
    tipo: 'trimestral',
    periodo: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchReports();
    }
  }, [status, router, communityIdParam]);

  const fetchReports = async () => {
    try {
      const query = communityIdParam ? `?communityId=${communityIdParam}` : '';
      const res = await fetch(`/api/admin-fincas/reports${query}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (error) {
      logger.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      setLoadingCommunities(true);
      const res = await fetch('/api/admin-fincas/communities');
      if (!res.ok) throw new Error('Error cargando comunidades');
      const data = await res.json();
      const normalized = Array.isArray(data)
        ? data.map((community: any) => ({
            id: community.id,
            nombreComunidad: community.nombreComunidad,
            direccion: community.direccion,
            ciudad: community.ciudad,
          }))
        : [];
      setCommunities(normalized);
    } catch (error) {
      logger.error('Error fetching communities:', error);
      toast.error('No se pudieron cargar las comunidades');
    } finally {
      setLoadingCommunities(false);
    }
  };

  const openGenerateDialog = () => {
    setShowGenerateDialog(true);
    if (communities.length === 0 && !loadingCommunities) {
      fetchCommunities();
    }
    if (communityIdParam && !formState.communityId) {
      setFormState((prev) => ({ ...prev, communityId: communityIdParam }));
    }
  };

  const handleGenerateReport = async () => {
    if (!formState.communityId || !formState.periodo.trim()) {
      toast.error('Selecciona una comunidad y un período');
      return;
    }

    try {
      setSavingReport(true);
      const response = await fetch('/api/admin-fincas/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId: formState.communityId,
          tipo: formState.tipo,
          periodo: formState.periodo.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Error generando informe');
      }

      const report = await response.json();
      setReports((prev) => [report, ...prev]);
      toast.success('Informe generado correctamente');
      setShowGenerateDialog(false);
      setFormState({
        communityId: '',
        tipo: 'trimestral',
        periodo: '',
      });
    } catch (error) {
      logger.error('Error generating report:', error);
      toast.error('No se pudo generar el informe');
    } finally {
      setSavingReport(false);
    }
  };

  const handleDownload = (report: Report) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `informe-${report.community.nombreComunidad}-${report.periodo}.json`
      .replace(/\s+/g, '-')
      .toLowerCase();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Informes Trimestrales/Anuales</h1>
                <p className="text-muted-foreground mt-1">
                  {reports.length}{' '}
                  {reports.length === 1 ? 'informe generado' : 'informes generados'}
                </p>
              </div>
              <Button onClick={openGenerateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Generar Informe
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Informes</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay informes generados</h3>
                    <p className="text-muted-foreground mb-4">
                      Comienza generando tu primer informe
                    </p>
                    <Button onClick={openGenerateDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Generar Informe
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <Card key={report.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">
                                  {report.community.nombreComunidad}
                                </h3>
                                <Badge
                                  variant={tipoBadgeVariant(report.tipo)}
                                  className="capitalize"
                                >
                                  {report.tipo}
                                </Badge>
                              </div>

                              <p className="text-sm text-muted-foreground">
                                Período: {report.periodo} (
                                {format(new Date(report.fechaInicio), 'dd/MM/yyyy', { locale: es })}{' '}
                                - {format(new Date(report.fechaFin), 'dd/MM/yyyy', { locale: es })})
                              </p>

                              <div className="grid grid-cols-3 gap-4 pt-3">
                                <div>
                                  <p className="text-sm text-muted-foreground">Ingresos</p>
                                  <p className="text-lg font-semibold text-green-600">
                                    {new Intl.NumberFormat('es-ES', {
                                      style: 'currency',
                                      currency: 'EUR',
                                    }).format(report.totalIngresos)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Gastos</p>
                                  <p className="text-lg font-semibold text-red-600">
                                    {new Intl.NumberFormat('es-ES', {
                                      style: 'currency',
                                      currency: 'EUR',
                                    }).format(report.totalGastos)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Saldo Final</p>
                                  <p className="text-lg font-semibold">
                                    {new Intl.NumberFormat('es-ES', {
                                      style: 'currency',
                                      currency: 'EUR',
                                    }).format(report.saldoFinal)}
                                  </p>
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground pt-2">
                                Generado el{' '}
                                {format(new Date(report.generadoEn), 'dd/MM/yyyy HH:mm', {
                                  locale: es,
                                })}
                              </p>
                            </div>

                            <Button variant="outline" size="sm" onClick={() => handleDownload(report)}>
                              <Download className="h-4 w-4 mr-2" />
                              Descargar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </AuthenticatedLayout>

        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generar Informe</DialogTitle>
              <DialogDescription>
                Crea un informe trimestral o anual con los movimientos de la comunidad.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Comunidad</Label>
                <Select
                  value={formState.communityId}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, communityId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCommunities ? 'Cargando...' : 'Selecciona comunidad'} />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map((community) => (
                      <SelectItem key={community.id} value={community.id}>
                        {community.nombreComunidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de informe</Label>
                <Select
                  value={formState.tipo}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, tipo: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodo">Período</Label>
                <Input
                  id="periodo"
                  placeholder="Ej: Q1 2026 / Año 2026"
                  value={formState.periodo}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, periodo: event.target.value }))
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerateReport} disabled={savingReport}>
                {savingReport ? 'Generando...' : 'Generar informe'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  );
}
