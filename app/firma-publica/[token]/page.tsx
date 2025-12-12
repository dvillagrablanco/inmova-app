'use client';

export const dynamic = 'force-dynamic';

/**
 * Página pública de firma
 * Accesible mediante token único generado para firmantes externos
 */


import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FileSignature,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
  User,
  Mail,
  Download
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
import { LoadingState } from '@/components/ui/loading-state';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';
import Image from 'next/image';

interface FirmanteInfo {
  nombre: string;
  email: string;
  rol: string;
  orden: number;
  estado: string;
}

interface DocumentoInfo {
  titulo: string;
  descripcion?: string;
  estado: string;
  proveedor: string;
  proveedorUrl?: string;
  createdAt: string;
  enviadoEn?: string;
  completadoEn?: string;
  requiereOrden: boolean;
  firmante: FirmanteInfo;
  todosFirmantes: FirmanteInfo[];
}

export default function FirmaPublicaPage() {
  const params = useParams();
  const [documento, setDocumento] = useState<DocumentoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = params?.token as string;

  useEffect(() => {
    if (token) {
      cargarDocumento();
    }
  }, [token]);

  const cargarDocumento = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/firma-publica/${token}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Documento no encontrado o enlace inválido');
        } else if (response.status === 410) {
          setError('Este enlace ha expirado');
        } else {
          setError('Error al cargar el documento');
        }
        return;
      }

      const data = await response.json();
      setDocumento(data);
    } catch (error: any) {
      logError(error, { message: 'Error al cargar documento público' });
      setError('Error de conexión. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { label: string; className: string }> = {
      pendiente: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      visto: { label: 'Visto', className: 'bg-blue-100 text-blue-800' },
      firmado: { label: 'Firmado', className: 'bg-green-100 text-green-800' },
      rechazado: { label: 'Rechazado', className: 'bg-red-100 text-red-800' },
      expirado: { label: 'Expirado', className: 'bg-gray-100 text-gray-800' },
      completado: { label: 'Completado', className: 'bg-green-100 text-green-800' },
    };

    const config = estados[estado] || { label: estado, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getEstadoIcon = (estado: string) => {
    const icons: Record<string, JSX.Element> = {
      pendiente: <Clock className="h-12 w-12 text-yellow-500" />,
      visto: <Mail className="h-12 w-12 text-blue-500" />,
      firmado: <CheckCircle2 className="h-12 w-12 text-green-500" />,
      rechazado: <XCircle className="h-12 w-12 text-red-500" />,
      expirado: <AlertCircle className="h-12 w-12 text-gray-500" />,
      completado: <CheckCircle2 className="h-12 w-12 text-green-500" />,
    };

    return icons[estado] || <Clock className="h-12 w-12" />;
  };

  const getMensajePorEstado = (estado: string) => {
    const mensajes: Record<string, { titulo: string; descripcion: string }> = {
      pendiente: {
        titulo: 'Documento pendiente de firma',
        descripcion: 'Haga clic en el botón "Ir a firmar" para acceder al documento y firmar electrónicamente.'
      },
      visto: {
        titulo: 'Documento visualizado',
        descripcion: 'Ya ha visto el documento. Por favor, complete el proceso de firma.'
      },
      firmado: {
        titulo: '¡Gracias por firmar!',
        descripcion: 'Su firma ha sido registrada exitosamente. Espere a que todos los firmantes completen el proceso.'
      },
      completado: {
        titulo: '¡Documento completado!',
        descripcion: 'Todos los firmantes han completado el proceso. Puede descargar el documento firmado.'
      },
      rechazado: {
        titulo: 'Documento rechazado',
        descripcion: 'Este documento ha sido rechazado.'
      },
      expirado: {
        titulo: 'Documento expirado',
        descripcion: 'Este documento ha expirado y ya no es posible firmarlo.'
      },
    };

    return mensajes[estado] || { titulo: 'Documento', descripcion: '' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <LoadingState message="Cargando documento..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12">
            <div className="text-center">
              <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Error
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {error}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!documento) {
    return null;
  }

  const mensaje = getMensajePorEstado(documento.firmante.estado);
  const firmadosCount = documento.todosFirmantes.filter(f => f.estado === 'firmado').length;
  const totalFirmantes = documento.todosFirmantes.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/inmova-logo-icon.jpg"
                alt="INMOVA"
                width={40}
                height={40}
                className="rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                INMOVA
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Firma Digital Segura
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-6">
          {/* Estado Principal */}
          <Card className="border-2">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {getEstadoIcon(documento.firmante.estado)}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {mensaje.titulo}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  {mensaje.descripcion}
                </p>
                <div className="flex justify-center">
                  {getEstadoBadge(documento.firmante.estado)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Documento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Información del Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Título</div>
                <div className="text-lg font-medium">{documento.titulo}</div>
              </div>
              {documento.descripcion && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Descripción</div>
                  <div className="text-base">{documento.descripcion}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Fecha de envío</div>
                  <div className="font-medium">
                    {documento.enviadoEn
                      ? format(new Date(documento.enviadoEn), 'dd MMM yyyy HH:mm', { locale: es })
                      : 'No enviado'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Progreso</div>
                  <div className="font-medium">
                    {firmadosCount} de {totalFirmantes} firmados
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Firmante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Su Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <span className="font-medium">{documento.firmante.nombre}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span>{documento.firmante.email}</span>
              </div>
              {documento.firmante.rol && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Rol: {documento.firmante.rol}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Todos los Firmantes */}
          {documento.todosFirmantes.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Firmantes</CardTitle>
                <CardDescription>
                  {documento.requiereOrden
                    ? 'Los firmantes deben firmar en orden secuencial'
                    : 'Los firmantes pueden firmar en cualquier orden'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documento.todosFirmantes
                    .sort((a, b) => a.orden - b.orden)
                    .map((firmante, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-semibold">
                            {firmante.orden}
                          </div>
                          <div>
                            <div className="font-medium">{firmante.nombre}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {firmante.email}
                            </div>
                          </div>
                        </div>
                        {getEstadoBadge(firmante.estado)}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          <div className="flex gap-4">
            {(documento.firmante.estado === 'pendiente' || documento.firmante.estado === 'visto') &&
              documento.proveedorUrl && (
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => window.open(documento.proveedorUrl, '_blank')}
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Ir a Firmar
                </Button>
              )}
            {documento.estado === 'completado' && (
              <Button variant="outline" size="lg" className="flex-1">
                <Download className="h-5 w-5 mr-2" />
                Descargar Documento
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          Documento gestionado por <strong>INMOVA</strong>
        </p>
        <p className="mt-2">
          Firma digital segura con {documento.proveedor === 'docusign' ? 'DocuSign' : documento.proveedor}
        </p>
      </footer>
    </div>
  );
}
