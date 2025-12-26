'use client';

import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Invoice {
  id: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaVencimiento: string;
  periodo: string;
  totalFactura: number;
  estado: string;
  community: {
    nombreComunidad: string;
  };
}

const estadoBadgeVariant = (estado: string) => {
  switch (estado) {
    case 'pagada':
      return 'default';
    case 'emitida':
      return 'secondary';
    case 'vencida':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function FacturasPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchInvoices();
    }
  }, [status, router]);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/admin-fincas/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      logger.error('Error fetching invoices:', error);
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
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Facturación por Comunidad</h1>
                <p className="text-muted-foreground mt-1">
                  {invoices.length}{' '}
                  {invoices.length === 1 ? 'factura registrada' : 'facturas registradas'}
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Factura
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Facturas</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay facturas registradas</h3>
                    <p className="text-muted-foreground mb-4">
                      Comienza emitiendo tu primera factura
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Número</th>
                          <th className="text-left p-2">Comunidad</th>
                          <th className="text-left p-2">Período</th>
                          <th className="text-left p-2">Emisión</th>
                          <th className="text-left p-2">Vencimiento</th>
                          <th className="text-right p-2">Total</th>
                          <th className="text-center p-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{invoice.numeroFactura}</td>
                            <td className="p-2">{invoice.community.nombreComunidad}</td>
                            <td className="p-2">{invoice.periodo}</td>
                            <td className="p-2">
                              {format(new Date(invoice.fechaEmision), 'dd/MM/yyyy', { locale: es })}
                            </td>
                            <td className="p-2">
                              {format(new Date(invoice.fechaVencimiento), 'dd/MM/yyyy', {
                                locale: es,
                              })}
                            </td>
                            <td className="p-2 text-right font-semibold">
                              {new Intl.NumberFormat('es-ES', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(invoice.totalFactura)}
                            </td>
                            <td className="p-2 text-center">
                              <Badge variant={estadoBadgeVariant(invoice.estado)}>
                                {invoice.estado}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </AuthenticatedLayout>
  );
}
