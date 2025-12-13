'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  PlayCircle,
  StopCircle,
  CheckCircle2,
  MapPin,
  Clock,
  Building2,
  FileText,
  Camera,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';
import MobilePhotoCapture from '@/components/operador/MobilePhotoCapture';
import Image from 'next/image';

interface WorkOrder {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  fechaInicio: string;
  fechaFin?: string;
  checkInTime?: string;
  checkOutTime?: string;
  timeSpent?: number;
  completionNotes?: string;
  nextActions?: string;
  fotos?: string;
  building?: {
    id: string;
    nombre: string;
    direccion: string;
  };
  unit?: {
    id: string;
    numero: string;
  };
}

export default function WorkOrderDetail() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const workOrderId = params?.id as string;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [checkOutData, setCheckOutData] = useState({
    workCompleted: false,
    completionNotes: '',
    nextActions: '',
  });
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user && (session.user as any).role !== 'operador') {
      router.push('/unauthorized');
      return;
    }

    if (session && workOrderId) {
      loadWorkOrder();
    }
  }, [session, status, workOrderId, router]);

  const loadWorkOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ordenes-trabajo/${workOrderId}`);

      if (response.ok) {
        const data = await response.json();
        setWorkOrder(data);
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo cargar la orden de trabajo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar la orden de trabajo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/operador/work-orders/${workOrderId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: 'Check-in desde detalle de orden',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Check-in registrado correctamente',
        });
        loadWorkOrder();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error al hacer check-in');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al hacer check-in',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/operador/work-orders/${workOrderId}/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkOutData),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Check-out registrado correctamente',
        });
        setShowCheckOut(false);
        loadWorkOrder();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error al hacer check-out');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al hacer check-out',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'alta':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'baja':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'asignada':
        return <Badge className="bg-blue-100 text-blue-700">Asignada</Badge>;
      case 'en_progreso':
        return <Badge className="bg-yellow-100 text-yellow-700">En Progreso</Badge>;
      case 'completada':
        return <Badge className="bg-green-100 text-green-700">Completada</Badge>;
      case 'pausada':
        return <Badge className="bg-gray-100 text-gray-700">Pausada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg font-medium mb-2">Orden no encontrada</p>
          <Button onClick={() => router.back()}>Volver</Button>
        </Card>
      </div>
    );
  }

  const photos = workOrder.fotos ? JSON.parse(workOrder.fotos) : [];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{workOrder.titulo}</h1>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(workOrder.estado)}
                    <Badge className={getPriorityColor(workOrder.prioridad)}>
                      {workOrder.prioridad}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Información básica */}
            <Card className="p-4 mb-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
                  <p className="mt-1">{workOrder.descripcion}</p>
                </div>

                {workOrder.building && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{workOrder.building.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {workOrder.building.direccion}
                      </p>
                      {workOrder.unit && (
                        <p className="text-sm text-muted-foreground">
                          Unidad {workOrder.unit.numero}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {format(new Date(workOrder.fechaInicio), "d 'de' MMMM, HH:mm", {
                      locale: es,
                    })}
                    {workOrder.fechaFin &&
                      ` - ${format(new Date(workOrder.fechaFin), 'HH:mm', { locale: es })}`}
                  </span>
                </div>
              </div>
            </Card>

            {/* Acciones de Check-In/Check-Out */}
            {workOrder.estado !== 'completada' && (
              <div className="space-y-4 mb-4">
                {workOrder.estado === 'asignada' && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                  >
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Iniciar Trabajo (Check-In)
                  </Button>
                )}

                {workOrder.estado === 'en_progreso' && !showCheckOut && (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="secondary"
                    onClick={() => setShowCheckOut(true)}
                  >
                    <StopCircle className="h-5 w-5 mr-2" />
                    Finalizar / Pausar Trabajo (Check-Out)
                  </Button>
                )}

                {showCheckOut && (
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Check-Out</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="workCompleted"
                          checked={checkOutData.workCompleted}
                          onCheckedChange={(checked) =>
                            setCheckOutData({
                              ...checkOutData,
                              workCompleted: checked as boolean,
                            })
                          }
                        />
                        <Label htmlFor="workCompleted" className="cursor-pointer">
                          Trabajo completado
                        </Label>
                      </div>

                      <div>
                        <Label htmlFor="completionNotes">Notas de finalización</Label>
                        <Textarea
                          id="completionNotes"
                          placeholder="Describe el trabajo realizado..."
                          value={checkOutData.completionNotes}
                          onChange={(e) =>
                            setCheckOutData({
                              ...checkOutData,
                              completionNotes: e.target.value,
                            })
                          }
                          rows={4}
                        />
                      </div>

                      {!checkOutData.workCompleted && (
                        <div>
                          <Label htmlFor="nextActions">Próximas acciones</Label>
                          <Textarea
                            id="nextActions"
                            placeholder="¿Qué falta por hacer?"
                            value={checkOutData.nextActions}
                            onChange={(e) =>
                              setCheckOutData({
                                ...checkOutData,
                                nextActions: e.target.value,
                              })
                            }
                            rows={3}
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={handleCheckOut}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Confirmar Check-Out
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowCheckOut(false)}
                          disabled={actionLoading}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Captura de fotos */}
            {workOrder.estado !== 'completada' && (
              <div className="mb-4">
                {!showPhotoCapture ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPhotoCapture(true)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Añadir Fotos
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <MobilePhotoCapture
                      workOrderId={workOrderId}
                      onPhotosUploaded={() => {
                        setShowPhotoCapture(false);
                        loadWorkOrder();
                      }}
                    />
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setShowPhotoCapture(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Fotos existentes */}
            {photos.length > 0 && (
              <Card className="p-4 mb-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Fotos del Trabajo ({photos.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((photo: string, index: number) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                    >
                      <Image src={photo} alt={`Foto ${index + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Información de tiempo */}
            {(workOrder.checkInTime || workOrder.checkOutTime) && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Registro de Tiempo
                </h3>
                <div className="space-y-2">
                  {workOrder.checkInTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-In:</span>
                      <span className="font-medium">
                        {format(new Date(workOrder.checkInTime), "d 'de' MMMM, HH:mm", {
                          locale: es,
                        })}
                      </span>
                    </div>
                  )}
                  {workOrder.checkOutTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-Out:</span>
                      <span className="font-medium">
                        {format(new Date(workOrder.checkOutTime), "d 'de' MMMM, HH:mm", {
                          locale: es,
                        })}
                      </span>
                    </div>
                  )}
                  {workOrder.timeSpent && workOrder.timeSpent > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tiempo dedicado:</span>
                      <span className="font-medium">
                        {Math.floor(workOrder.timeSpent / 60)}h {workOrder.timeSpent % 60}m
                      </span>
                    </div>
                  )}
                </div>
                {workOrder.completionNotes && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Notas de finalización
                    </Label>
                    <p className="mt-1">{workOrder.completionNotes}</p>
                  </div>
                )}
                {workOrder.nextActions && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Próximas acciones
                    </Label>
                    <p className="mt-1">{workOrder.nextActions}</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
