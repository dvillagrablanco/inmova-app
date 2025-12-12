/**
 * Página de detalle de documento de firma
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSignature,
  Send,
  Download,
  RefreshCw,
  XCircle,
  Clock,
  CheckCircle2,
  User,
  Mail,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import logger, { logError } from '@/lib/logger';
import { LoadingState } from '@/components/ui/loading-state';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface Firmante {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  orden: number;
  estado: string;
  enviadoEn?: string;
  firmadoEn?: string;
}

interface DocumentoFirma {
  id: string;
  titulo: string;
  tipoDocumento: string;
  estado: string;
  proveedor: string;
  proveedorId?: string;
  proveedorUrl?: string;
  createdAt: string;
  enviadoEn?: string;
  completadoEn?: string;
  requiereOrden: boolean;
  firmantes: Firmante[];
  template?: {
    nombre: string;
  };
  auditLog: {
    id: string;
    evento: string;
    descripcion: string;
    createdAt: string;
  }[];
}

export default function DocumentoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession() || {};
  const [documento, setDocumento] = useState<DocumentoFirma | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const documentoId = params?.id as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && documentoId) {
      cargarDocumento();
    }
  }, [status, documentoId, router]);

  const cargarDocumento = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/signature-documents/${documentoId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar documento');
      }

      const data = await response.json();
      setDocumento(data);
    } catch (error: any) {
      logError(error, { message: 'Error al cargar documento' });
      toast.error('Error al cargar el documento');
    } finally {
      setLoading(false);
    }
  };

  const enviarDocumento = async () => {
    try {
      setEnviando(true);
      const response = await fetch(`/api/signature-documents/${documentoId}/send`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Error al enviar documento');
      }

      toast.success('Documento enviado para firma');
      await cargarDocumento();
    } catch (error: any) {
      logError(error, { message: 'Error al enviar documento' });
      toast.error('Error al enviar el documento');
    } finally {
      setEnviando(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; className?: string }> = {
      borrador: { label: 'Borrador', variant: 'secondary' },
      pendiente: { label: 'Pendiente', variant: 'default', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      enviado: { label: 'Enviado', variant: 'default', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      visualizado: { label: 'Visualizado', variant: 'default', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      parcialmente_firmado: { label: 'Parcial', variant: 'default', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      firmado: { label: 'Firmado', variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      completado: { label: 'Completado', variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      rechazado: { label: 'Rechazado', variant: 'destructive' },
      cancelado: { label: 'Cancelado', variant: 'destructive' },
      expirado: { label: 'Expirado', variant: 'destructive' },
    };

    const config = estados[estado] || { label: estado, variant: 'default' as const };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getEstadoIcon = (estado: string) => {
    const icons: Record<string, JSX.Element> = {
      borrador: <Clock className="h-5 w-5 text-gray-400" />,
      pendiente: <Clock className="h-5 w-5 text-yellow-500" />,
      enviado: <Send className="h-5 w-5 text-blue-500" />,
      visualizado: <Mail className="h-5 w-5 text-blue-500" />,
      firmado: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      completado: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      rechazado: <XCircle className="h-5 w-5 text-red-500" />,
      cancelado: <XCircle className="h-5 w-5 text-red-500" />,
      expirado: <AlertCircle className="h-5 w-5 text-red-500" />,
    };

    return icons[estado] || <Clock className="h-5 w-5" />;
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <LoadingState message="Cargando documento..." />
          </main>
        </div>
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Documento no encontrado
                  </h3>
                  <Link href="/firma-digital">
                    <Button>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/firma-digital">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileSignature className="h-8 w-8" />
                  {documento.titulo}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {documento.template ? `Basado en: ${documento.template.nombre}` : documento.tipoDocumento}
                </p>
              </div>
              <div className="flex gap-2">
                {documento.estado === 'borrador' && (
                  <Button onClick={enviarDocumento} disabled={enviando}>
                    {enviando ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Enviar para Firma
                  </Button>
                )}
                {documento.estado === 'completado' && (
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                )}
                <Button variant="outline" onClick={cargarDocumento}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Información del documento */}
            <div className="lg:col-span-2 space-y-6">
              {/* Estado y detalles */}
              <Card>
                <CardHeader>
                  <CardTitle>Información del Documento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Estado</div>
                      <div className="mt-1">{getEstadoBadge(documento.estado)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Proveedor</div>
                      <div className="mt-1 font-medium">{documento.proveedor}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Fecha de creación</div>
                      <div className="mt-1 font-medium">
                        {format(new Date(documento.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
                      </div>
                    </div>
                    {documento.enviadoEn && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Fecha de envío</div>
                        <div className="mt-1 font-medium">
                          {format(new Date(documento.enviadoEn), 'dd MMM yyyy HH:mm', { locale: es })}
                        </div>
                      </div>
                    )}
                    {documento.completadoEn && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Fecha de completado</div>
                        <div className="mt-1 font-medium">
                          {format(new Date(documento.completadoEn), 'dd MMM yyyy HH:mm', { locale: es })}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Orden de firma</div>
                      <div className="mt-1 font-medium">
                        {documento.requiereOrden ? 'Secuencial' : 'Paralelo'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Firmantes */}
              <Card>
                <CardHeader>
                  <CardTitle>Firmantes</CardTitle>
                  <CardDescription>
                    {documento.firmantes.filter(f => f.estado === 'firmado').length} de {documento.firmantes.length} han firmado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documento.firmantes
                      .sort((a, b) => a.orden - b.orden)
                      .map((firmante) => (
                        <div
                          key={firmante.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-semibold">
                              {firmante.orden}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{firmante.nombre}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Mail className="h-3 w-3" />
                                {firmante.email}
                              </div>
                              {firmante.rol && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Rol: {firmante.rol}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getEstadoIcon(firmante.estado)}
                            {getEstadoBadge(firmante.estado)}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Historial */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documento.auditLog
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((log, index) => (
                        <div key={log.id} className="relative">
                          {index !== documento.auditLog.length - 1 && (
                            <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                          )}
                          <div className="flex gap-3">
                            <div className="relative flex items-center justify-center w-4 h-4 mt-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{log.evento}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {log.descripcion}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
