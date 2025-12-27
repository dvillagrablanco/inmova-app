'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, ArrowLeft, Download } from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (params?.unitId && session) {
      fetch(`/api/units/${params.unitId}`)
        .then((res) => res.json())
        .then(setUnit)
        .catch(() => toast.error('Error al cargar unidad'))
        .finally(() => setLoading(false));
    }
  }, [params, session]);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">Cargando...</div>
        </main>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Reportes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Generación de reportes para {unit?.building?.nombre} - Unidad {unit?.numero}
              </p>
              <div className="mt-6 space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Reporte Mensual
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Reporte Anual
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
