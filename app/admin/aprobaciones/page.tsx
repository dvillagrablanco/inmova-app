'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, CheckCircle2, Clock, Euro, Home, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import logger, { logError } from '@/lib/logger';

interface Approval {
  id: string;
  tipo: 'gasto' | 'mantenimiento';
  entityId: string;
  solicitadoPor: string;
  revisadoPor?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  monto?: number;
  motivo?: string;
  comentarioRechazo?: string;
  fechaSolicitud: string;
  fechaRevision?: string;
  expense?: any;
  maintenance?: any;
}

export default function AprobacionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pendiente');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comentarioRechazo, setComentarioRechazo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'administrador' && session?.user?.role !== 'super_admin') {
        router.push('/unauthorized');
      } else {
        fetchApprovals(selectedTab);
      }
    }
  }, [status, session, router, selectedTab]);

  const fetchApprovals = async (estado: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/approvals?estado=${estado}`);
      if (!res.ok) throw new Error('Error al cargar aprobaciones');
      const data = await res.json();
      setApprovals(data);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar aprobaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'aprobar' }),
      });

      if (!res.ok) throw new Error('Error al aprobar');

      toast.success('Solicitud aprobada correctamente');
      fetchApprovals(selectedTab);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al aprobar solicitud');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;

    try {
      setIsProcessing(true);
      const res = await fetch(`/api/approvals/${selectedApproval.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'rechazar',
          comentarioRechazo,
        }),
      });

      if (!res.ok) throw new Error('Error al rechazar');

      toast.success('Solicitud rechazada');
      setShowRejectDialog(false);
      setComentarioRechazo('');
      setSelectedApproval(null);
      fetchApprovals(selectedTab);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al rechazar solicitud');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    return tipo === 'gasto' ? 'Gasto' : 'Mantenimiento';
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'aprobado':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aprobado
          </Badge>
        );
      case 'rechazado':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const getDescription = (approval: Approval) => {
    if (approval.tipo === 'gasto' && approval.expense) {
      return approval.expense.concepto;
    }
    if (approval.tipo === 'mantenimiento' && approval.maintenance) {
      return approval.maintenance.titulo;
    }
    return 'Sin descripción';
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          {/* Header con Breadcrumbs */}
          <div className="mb-6 space-y-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Inicio
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Aprobaciones</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Historial de Aprobaciones</h1>
                <p className="text-muted-foreground mt-2">
                  Gestiona y revisa solicitudes de aprobación
                </p>
              </div>
              <BackButton href="/dashboard" label="Volver al Dashboard" variant="outline" />
            </div>
          </div>

          {/* Tabs para filtrar por estado */}
          <Tabs
            value={selectedTab}
            onValueChange={(value) => setSelectedTab(value)}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
              <TabsTrigger value="aprobado">Aprobadas</TabsTrigger>
              <TabsTrigger value="rechazado">Rechazadas</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="space-y-4">
              {approvals.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No hay solicitudes{' '}
                      {selectedTab === 'pendiente'
                        ? 'pendientes'
                        : selectedTab === 'aprobado'
                          ? 'aprobadas'
                          : 'rechazadas'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                approvals.map((approval) => (
                  <Card key={approval.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{getDescription(approval)}</CardTitle>
                            <Badge variant="secondary">{getTipoLabel(approval.tipo)}</Badge>
                            {getEstadoBadge(approval.estado)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Euro className="h-4 w-4" />
                              {approval.monto?.toFixed(2) || '0.00'} €
                            </div>
                            <span>•</span>
                            <span>
                              Solicitado el{' '}
                              {format(new Date(approval.fechaSolicitud), 'dd MMM yyyy', {
                                locale: es,
                              })}
                            </span>
                            {approval.fechaRevision && (
                              <>
                                <span>•</span>
                                <span>
                                  Revisado el{' '}
                                  {format(new Date(approval.fechaRevision), 'dd MMM yyyy', {
                                    locale: es,
                                  })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {approval.estado === 'pendiente' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(approval.id)}
                              disabled={isProcessing}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedApproval(approval);
                                setShowRejectDialog(true);
                              }}
                              disabled={isProcessing}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    {(approval.motivo || approval.comentarioRechazo) && (
                      <CardContent>
                        {approval.motivo && (
                          <div className="mb-2">
                            <p className="text-sm font-medium mb-1">Motivo de la solicitud:</p>
                            <p className="text-sm text-muted-foreground">{approval.motivo}</p>
                          </div>
                        )}
                        {approval.comentarioRechazo && (
                          <div className="p-3 bg-destructive/10 rounded-md">
                            <p className="text-sm font-medium text-destructive mb-1">
                              Motivo del rechazo:
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {approval.comentarioRechazo}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Dialog para rechazar */}
          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rechazar Solicitud</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de rechazar esta solicitud? Por favor, proporciona un motivo.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="comentario">Motivo del rechazo</Label>
                  <Textarea
                    id="comentario"
                    value={comentarioRechazo}
                    onChange={(e) => setComentarioRechazo(e.target.value)}
                    placeholder="Explica por qué se rechaza esta solicitud..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setComentarioRechazo('');
                    setSelectedApproval(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isProcessing || !comentarioRechazo.trim()}
                >
                  Rechazar Solicitud
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </AuthenticatedLayout>
  );
}
