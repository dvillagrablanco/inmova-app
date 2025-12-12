'use client';
export const dynamic = 'force-dynamic';


/**
 * Página principal de Firma Digital
 * Muestra lista de documentos y permite crear nuevos
 */


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FileSignature,
  Plus,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface DocumentoFirma {
  id: string;
  titulo: string;
  tipoDocumento: string;
  estado: string;
  proveedor: string;
  createdAt: string;
  enviadoEn?: string;
  firmantes: {
    id: string;
    nombre: string;
    email: string;
    estado: string;
  }[];
  template?: {
    nombre: string;
  };
}

export default function FirmaDigitalPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [documentos, setDocumentos] = useState<DocumentoFirma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      cargarDocumentos();
    }
  }, [status, router]);

  const cargarDocumentos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/signature-documents');
      
      if (!response.ok) {
        throw new Error('Error al cargar documentos');
      }

      const data = await response.json();
      setDocumentos(data);
    } catch (error: any) {
      logError(error, { message: 'Error al cargar documentos de firma' });
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; className?: string }> = {
      borrador: { label: 'Borrador', variant: 'secondary' },
      pendiente: { label: 'Pendiente', variant: 'default', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      parcialmente_firmado: { label: 'Parcial', variant: 'default', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      completado: { label: 'Completado', variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      cancelado: { label: 'Cancelado', variant: 'destructive' },
      expirado: { label: 'Expirado', variant: 'destructive' },
    };

    const config = estados[estado] || { label: estado, variant: 'default' as const };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getEstadoIcon = (estado: string) => {
    const icons: Record<string, JSX.Element> = {
      borrador: <FileText className="h-4 w-4" />,
      pendiente: <Clock className="h-4 w-4" />,
      parcialmente_firmado: <AlertCircle className="h-4 w-4" />,
      completado: <CheckCircle2 className="h-4 w-4" />,
      cancelado: <XCircle className="h-4 w-4" />,
      expirado: <XCircle className="h-4 w-4" />,
    };

    return icons[estado] || <FileText className="h-4 w-4" />;
  };

  const documentosFiltrados = documentos.filter((doc) => {
    const matchSearch = doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       doc.firmantes.some(f => f.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchEstado = estadoFiltro === 'todos' || doc.estado === estadoFiltro;
    return matchSearch && matchEstado;
  });

  if (loading || status === 'loading') {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <LoadingState message="Cargando documentos..." />
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileSignature className="h-8 w-8" />
                  Firma Digital
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gestiona documentos para firma electrónica con DocuSign
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/firma-digital/templates">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Templates
                  </Button>
                </Link>
                <Link href="/firma-digital/nuevo">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Documento
                  </Button>
                </Link>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="parcialmente_firmado">Parcialmente Firmado</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="expirado">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de documentos */}
          {documentosFiltrados.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileSignature className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay documentos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm || estadoFiltro !== 'todos'
                      ? 'No se encontraron documentos con los filtros aplicados.'
                      : 'Comienza creando tu primer documento para firma.'}
                  </p>
                  <Link href="/firma-digital/nuevo">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Documento
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {documentosFiltrados.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getEstadoIcon(doc.estado)}
                          <CardTitle className="text-lg">
                            <Link
                              href={`/firma-digital/${doc.id}`}
                              className="hover:underline"
                            >
                              {doc.titulo}
                            </Link>
                          </CardTitle>
                        </div>
                        <CardDescription>
                          {doc.template ? `Basado en: ${doc.template.nombre}` : doc.tipoDocumento}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getEstadoBadge(doc.estado)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Creado</div>
                        <div className="font-medium">
                          {format(new Date(doc.createdAt), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                      {doc.enviadoEn && (
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Enviado</div>
                          <div className="font-medium">
                            {format(new Date(doc.enviadoEn), 'dd MMM yyyy', { locale: es })}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Firmantes</div>
                        <div className="font-medium">
                          {doc.firmantes.filter(f => f.estado === 'firmado').length} de {doc.firmantes.length} firmados
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/firma-digital/${doc.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Ver Detalles
                        </Button>
                      </Link>
                      {doc.estado === 'borrador' && (
                        <Button variant="default">
                          <Send className="h-4 w-4 mr-2" />
                          Enviar
                        </Button>
                      )}
                      {doc.estado === 'completado' && (
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
