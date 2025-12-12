'use client';
export const dynamic = 'force-dynamic';


import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ArrowLeft, CheckCircle, Clock, XCircle, Play, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export default function ProveedorOrdenesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [proveedor, setProveedor] = useState<any>(null);
  const [filterEstado, setFilterEstado] = useState('todas');
  const [rechazarDialogOpen, setRechazarDialogOpen] = useState(false);
  const [ordenARechazar, setOrdenARechazar] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadOrdenes();
  }, [router]);

  const checkAuthAndLoadOrdenes = async () => {
    try {
      const res = await fetch('/api/auth-proveedor/me', {
        credentials: 'include',
      });

      if (!res.ok) {
        router.push('/portal-proveedor/login');
        return;
      }

      const { proveedor: p } = await res.json();
      setProveedor(p);
      loadOrdenes(p.id);
    } catch (error) {
      router.push('/portal-proveedor/login');
    }
  };

  const loadOrdenes = async (providerId: string) => {
    try {
      const res = await fetch(`/api/ordenes-trabajo?providerId=${providerId}`);
      if (res.ok) {
        const data = await res.json();
        setOrdenes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      toast.error('Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleAceptar = async (ordenId: string) => {
    setProcessingAction(ordenId);
    try {
      const res = await fetch(`/api/portal-proveedor/work-orders/${ordenId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Orden aceptada exitosamente');
        loadOrdenes(proveedor.id);
      } else {
        toast.error(data.error || 'Error al aceptar orden');
      }
    } catch (error) {
      toast.error('Error al aceptar orden');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRechazarClick = (ordenId: string) => {
    setOrdenARechazar(ordenId);
    setMotivoRechazo('');
    setRechazarDialogOpen(true);
  };

  const handleRechazarConfirm = async () => {
    if (!ordenARechazar) return;

    if (!motivoRechazo.trim()) {
      toast.error('Debes proporcionar un motivo para el rechazo');
      return;
    }

    setProcessingAction(ordenARechazar);
    try {
      const res = await fetch(`/api/portal-proveedor/work-orders/${ordenARechazar}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ motivo: motivoRechazo }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Orden rechazada exitosamente');
        setRechazarDialogOpen(false);
        loadOrdenes(proveedor.id);
      } else {
        toast.error(data.error || 'Error al rechazar orden');
      }
    } catch (error) {
      toast.error('Error al rechazar orden');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleIniciar = async (ordenId: string) => {
    setProcessingAction(ordenId);
    try {
      const res = await fetch(`/api/portal-proveedor/work-orders/${ordenId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Trabajo iniciado exitosamente');
        loadOrdenes(proveedor.id);
      } else {
        toast.error(data.error || 'Error al iniciar trabajo');
      }
    } catch (error) {
      toast.error('Error al iniciar trabajo');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCompletar = async (ordenId: string) => {
    setProcessingAction(ordenId);
    try {
      const res = await fetch(`/api/ordenes-trabajo/${ordenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'completada' }),
      });
      if (res.ok) {
        toast.success('Orden completada');
        loadOrdenes(proveedor.id);
      } else {
        toast.error('Error al completar orden');
      }
    } catch (error) {
      toast.error('Error al completar orden');
    } finally {
      setProcessingAction(null);
    }
  };

  const ordenesFiltradas =
    filterEstado === 'todas' ? ordenes : ordenes.filter((o) => o.estado === filterEstado);

  const getEstadoBadge = (estado: string) => {
    const variants: { [key: string]: any } = {
      pendiente: 'outline',
      asignada: 'outline',
      aceptada: 'default',
      en_progreso: 'default',
      completada: 'secondary',
      rechazada: 'destructive',
    };
    const labels: { [key: string]: string } = {
      pendiente: 'Pendiente',
      asignada: 'Asignada',
      aceptada: 'Aceptada',
      en_progreso: 'En Progreso',
      completada: 'Completada',
      rechazada: 'Rechazada',
    };
    return <Badge variant={variants[estado] || 'outline'}>{labels[estado] || estado}</Badge>;
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-7xl mx-auto">
              <Button
                variant="ghost"
                onClick={() => router.push('/portal-proveedor/dashboard')}
                className="mb-4 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>

              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Mis Órdenes de Trabajo</h1>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="asignada">Asignadas</SelectItem>
                    <SelectItem value="aceptada">Aceptadas</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="completada">Completadas</SelectItem>
                    <SelectItem value="rechazada">Rechazadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4">
                {ordenesFiltradas.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No hay órdenes
                    </CardContent>
                  </Card>
                ) : (
                  ordenesFiltradas.map((orden) => (
                    <Card key={orden.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{orden.titulo}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {orden.descripcion}
                            </p>
                          </div>
                          {getEstadoBadge(orden.estado)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-muted-foreground">Edificio:</span>
                            <p className="font-medium">{orden.building?.nombre}</p>
                          </div>
                          {orden.unit && (
                            <div>
                              <span className="text-muted-foreground">Unidad:</span>
                              <p className="font-medium">{orden.unit.numero}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Fecha:</span>
                            <p className="font-medium">
                              {format(new Date(orden.createdAt), 'dd/MM/yyyy', { locale: es })}
                            </p>
                          </div>
                          {orden.costoTotal && (
                            <div>
                              <span className="text-muted-foreground">Costo:</span>
                              <p className="font-medium">€{orden.costoTotal}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {(orden.estado === 'pendiente' || orden.estado === 'asignada') && (
                            <>
                              <Button
                                onClick={() => handleAceptar(orden.id)}
                                size="sm"
                                disabled={processingAction === orden.id}
                              >
                                {processingAction === orden.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Aceptar
                              </Button>
                              <Button
                                onClick={() => handleRechazarClick(orden.id)}
                                size="sm"
                                variant="destructive"
                                disabled={processingAction === orden.id}
                              >
                                {processingAction === orden.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Rechazar
                              </Button>
                            </>
                          )}
                          {orden.estado === 'aceptada' && (
                            <Button
                              onClick={() => handleIniciar(orden.id)}
                              size="sm"
                              disabled={processingAction === orden.id}
                            >
                              {processingAction === orden.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4 mr-2" />
                              )}
                              Iniciar Trabajo
                            </Button>
                          )}
                          {orden.estado === 'en_progreso' && (
                            <Button
                              onClick={() => handleCompletar(orden.id)}
                              size="sm"
                              disabled={processingAction === orden.id}
                            >
                              {processingAction === orden.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Completar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Di\u00e1logo para rechazar orden */}
            <Dialog open={rechazarDialogOpen} onOpenChange={setRechazarDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rechazar Orden de Trabajo</DialogTitle>
                  <DialogDescription>
                    Por favor, indica el motivo por el cual rechazas esta orden.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="motivo">Motivo del rechazo *</Label>
                    <Textarea
                      id="motivo"
                      placeholder="Explica por qu\u00e9 no puedes realizar este trabajo..."
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRechazarDialogOpen(false);
                      setMotivoRechazo('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRechazarConfirm}
                    disabled={!motivoRechazo.trim() || processingAction !== null}
                  >
                    {processingAction ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rechazando...
                      </>
                    ) : (
                      'Confirmar Rechazo'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
