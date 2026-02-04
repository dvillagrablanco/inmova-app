'use client';

import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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

interface CommunityOption {
  id: string;
  nombreComunidad: string;
  direccion: string;
  ciudad?: string;
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
  const searchParams = useSearchParams();
  const communityIdParam = searchParams.get('communityId') || '';
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [formState, setFormState] = useState({
    communityId: '',
    periodo: '',
    honorarios: '',
    gastosGestion: '',
    iva: '21',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchInvoices();
    }
  }, [status, router, communityIdParam]);

  const fetchInvoices = async () => {
    try {
      const query = communityIdParam ? `?communityId=${communityIdParam}` : '';
      const res = await fetch(`/api/admin-fincas/invoices${query}`);
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

  const openNewInvoiceDialog = () => {
    setShowNewInvoiceDialog(true);
    if (communities.length === 0 && !loadingCommunities) {
      fetchCommunities();
    }
    if (communityIdParam && !formState.communityId) {
      setFormState((prev) => ({ ...prev, communityId: communityIdParam }));
    }
  };

  const handleCreateInvoice = async () => {
    if (!formState.communityId || !formState.periodo.trim()) {
      toast.error('Selecciona una comunidad y un período');
      return;
    }

    try {
      setSavingInvoice(true);
      const response = await fetch('/api/admin-fincas/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId: formState.communityId,
          periodo: formState.periodo.trim(),
          honorarios: parseFloat(formState.honorarios || '0'),
          gastosGestion: parseFloat(formState.gastosGestion || '0'),
          iva: parseFloat(formState.iva || '21'),
          otrosConceptos: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Error creando factura');
      }

      const invoice = await response.json();
      setInvoices((prev) => [invoice, ...prev]);
      toast.success('Factura creada correctamente');
      setShowNewInvoiceDialog(false);
      setFormState({
        communityId: '',
        periodo: '',
        honorarios: '',
        gastosGestion: '',
        iva: '21',
      });
    } catch (error) {
      logger.error('Error creating invoice:', error);
      toast.error('No se pudo crear la factura');
    } finally {
      setSavingInvoice(false);
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
              <Button onClick={openNewInvoiceDialog}>
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
                    <Button onClick={openNewInvoiceDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Factura
                    </Button>
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

        <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva Factura</DialogTitle>
              <DialogDescription>
                Genera una factura para la comunidad seleccionada.
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
                <Label htmlFor="periodo">Período</Label>
                <Input
                  id="periodo"
                  placeholder="Ej: Enero 2026"
                  value={formState.periodo}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, periodo: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="honorarios">Honorarios (€)</Label>
                  <Input
                    id="honorarios"
                    type="number"
                    value={formState.honorarios}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, honorarios: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gastosGestion">Gastos de gestión (€)</Label>
                  <Input
                    id="gastosGestion"
                    type="number"
                    value={formState.gastosGestion}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, gastosGestion: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="iva">IVA (%)</Label>
                <Input
                  id="iva"
                  type="number"
                  value={formState.iva}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, iva: event.target.value }))
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setShowNewInvoiceDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateInvoice} disabled={savingInvoice}>
                {savingInvoice ? 'Creando...' : 'Crear factura'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  );
}
