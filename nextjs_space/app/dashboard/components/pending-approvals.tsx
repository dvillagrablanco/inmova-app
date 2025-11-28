'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Clock, Euro, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';

interface Approval {
  id: string;
  tipo: 'gasto' | 'mantenimiento';
  entityId: string;
  solicitadoPor: string;
  monto?: number;
  motivo?: string;
  fechaSolicitud: string;
  expense?: any;
  maintenance?: any;
}

export function PendingApprovals() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comentarioRechazo, setComentarioRechazo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/approvals?estado=pendiente');
      if (!res.ok) throw new Error('Error al cargar aprobaciones');
      const data = await res.json();
      setApprovals(data);
    } catch (error) {
      console.error('Error:', error);
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
      fetchApprovals();
    } catch (error) {
      console.error('Error:', error);
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
      fetchApprovals();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al rechazar solicitud');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    return tipo === 'gasto' ? 'Gasto' : 'Mantenimiento';
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aprobaciones Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (approvals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aprobaciones Pendientes</CardTitle>
          <CardDescription>
            No hay solicitudes de aprobación pendientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Todo al día</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Aprobaciones Pendientes</CardTitle>
              <CardDescription>
                {approvals.length} solicitud{approvals.length !== 1 ? 'es' : ''} esperando revisión
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/aprobaciones')}
            >
              Ver Historial
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div
                key={approval.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2 rounded-full bg-yellow-100">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">
                        {getDescription(approval)}
                      </p>
                      <Badge variant="secondary">
                        {getTipoLabel(approval.tipo)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Euro className="h-3 w-3" />
                      {approval.monto?.toFixed(2) || '0.00'} €
                    </div>
                    {approval.motivo && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {approval.motivo}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Solicitado el{' '}
                      {format(
                        new Date(approval.fechaSolicitud),
                        'dd MMM yyyy',
                        { locale: es }
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}
