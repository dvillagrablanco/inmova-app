'use client';

import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchReports();
    }
  }, [status, router]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin-fincas/reports');
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Informes Trimestrales/Anuales</h1>
          <p className="text-muted-foreground mt-1">
            {reports.length} {reports.length === 1 ? 'informe generado' : 'informes generados'}
          </p>
        </div>
        <Button>
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
              <p className="text-muted-foreground mb-4">Comienza generando tu primer informe</p>
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
                          <Badge variant={tipoBadgeVariant(report.tipo)} className="capitalize">
                            {report.tipo}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          Período: {report.periodo} ({format(new Date(report.fechaInicio), 'dd/MM/yyyy', { locale: es })} - {format(new Date(report.fechaFin), 'dd/MM/yyyy', { locale: es })})
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
                          Generado el {format(new Date(report.generadoEn), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </div>

                      <Button variant="outline" size="sm">
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
  );
}
