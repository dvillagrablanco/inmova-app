/**
 * Portal del Inquilino - Centro de Documentos
 * Incluye acceso a documentos personales y recibos de pago
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Calendar,
  AlertCircle,
  Receipt,
  CheckCircle,
  Search,
  Home,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface Document {
  id: string;
  nombre: string;
  tipo: string;
  cloudStoragePath: string;
  fechaSubida: Date;
  fechaVencimiento?: Date;
}

interface Payment {
  id: string;
  periodo: string;
  monto: number;
  fechaPago?: Date;
  fechaVencimiento: Date;
  estado: string;
  reciboPdfPath?: string;
}

interface SharedDocument {
  id: string;
  puedeDescargar: boolean;
  visto: boolean;
  createdAt: string;
  document: {
    id: string;
    nombre: string;
    tipo: string;
    descripcion?: string;
    fechaSubida: Date;
    tenant?: { nombreCompleto: string };
    unit?: { numero: string; building: { nombre: string } };
    building?: { nombre: string };
  };
}

export default function DocumentosPortalPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [documents, setDocuments] = useState<Document[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('documentos');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/portal-inquilino/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch documentos
      const docsResponse = await fetch('/api/portal-inquilino/documents');
      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setDocuments(docsData);
      }

      // Fetch pagos con recibos
      const paymentsResponse = await fetch('/api/portal-inquilino/payments');
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData);
      }

      // Fetch documentos compartidos
      const sharedResponse = await fetch('/api/portal-inquilino/documents/shared');
      if (sharedResponse.ok) {
        const sharedData = await sharedResponse.json();
        setSharedDocuments(sharedData.shares || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (cloudStoragePath: string, filename: string) => {
    try {
      const response = await fetch(
        `/api/documents/download?path=${encodeURIComponent(cloudStoragePath)}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Documento descargado');
      } else {
        toast.error('Error al descargar documento');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error al descargar documento');
    }
  };

  const handleDownloadReceipt = async (paymentId: string, periodo: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/receipt`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recibo_${periodo.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Recibo descargado');
      } else {
        toast.error('El recibo aún no está disponible');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Error al descargar recibo');
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = payments.filter((payment) =>
    payment.periodo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDocumentTypeColor = (tipo: string) => {
    const typeColors: Record<string, string> = {
      contrato: 'bg-purple-100 text-purple-800',
      dni: 'bg-blue-100 text-blue-800',
      nomina: 'bg-green-100 text-green-800',
      certificado_energetico: 'bg-yellow-100 text-yellow-800',
      ite: 'bg-orange-100 text-orange-800',
      seguro: 'bg-red-100 text-red-800',
      factura: 'bg-gray-100 text-gray-800',
      otro: 'bg-gray-100 text-gray-800',
    };
    return typeColors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const isDocumentExpiring = (fechaVencimiento?: Date) => {
    if (!fechaVencimiento) return false;
    const today = new Date();
    const expDate = new Date(fechaVencimiento);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const isDocumentExpired = (fechaVencimiento?: Date) => {
    if (!fechaVencimiento) return false;
    const today = new Date();
    const expDate = new Date(fechaVencimiento);
    return expDate < today;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/portal-inquilino/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/portal-inquilino/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Documentos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-3xl font-bold mt-4">Centro de Documentos</h1>
          <p className="text-gray-600 mt-2">
            Accede a todos tus documentos y recibos de pago
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar documentos o recibos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documentos">
              <FileText className="h-4 w-4 mr-2" />
              Documentos ({filteredDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="compartidos">
              <Eye className="h-4 w-4 mr-2" />
              Compartidos ({sharedDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="recibos">
              <Receipt className="h-4 w-4 mr-2" />
              Recibos ({filteredPayments.filter(p => p.estado === 'pagado').length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Documentos */}
          <TabsContent value="documentos" className="mt-6">
            {filteredDocuments.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay documentos disponibles</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((doc) => {
                  const isExpiring = isDocumentExpiring(doc.fechaVencimiento);
                  const isExpired = isDocumentExpired(doc.fechaVencimiento);

                  return (
                    <Card key={doc.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <FileText className="h-8 w-8 text-gray-600" />
                        <Badge className={getDocumentTypeColor(doc.tipo)}>
                          {doc.tipo.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-lg mb-2">{doc.nombre}</h3>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Subido: {format(new Date(doc.fechaSubida), 'dd/MM/yyyy', { locale: es })}
                        </div>

                        {doc.fechaVencimiento && (
                          <div className="flex items-center">
                            {isExpired ? (
                              <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                            ) : isExpiring ? (
                              <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            )}
                            <span className={isExpired ? 'text-red-600 font-semibold' : isExpiring ? 'text-yellow-600' : ''}>
                              {isExpired ? 'Vencido' : 'Vence'}: {format(new Date(doc.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => handleDownload(doc.cloudStoragePath, doc.nombre)}
                        className="w-full"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab: Documentos Compartidos */}
          <TabsContent value="compartidos" className="mt-6">
            {sharedDocuments.length === 0 ? (
              <Card className="p-12 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay documentos compartidos</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sharedDocuments.map((share) => {
                  const doc = share.document;
                  const isNew = !share.visto;

                  return (
                    <Card key={share.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          {isNew && (
                            <Badge variant="destructive" className="text-xs">
                              Nuevo
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline">{doc.tipo}</Badge>
                      </div>
                      
                      <h3 className="font-semibold mb-2 line-clamp-1">
                        {doc.nombre}
                      </h3>

                      {doc.descripcion && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {doc.descripcion}
                        </p>
                      )}

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        {doc.unit && (
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            <span>{doc.unit.building.nombre} - Unidad {doc.unit.numero}</span>
                          </div>
                        )}
                        {doc.building && !doc.unit && (
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            <span>{doc.building.nombre}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Compartido: {format(new Date(share.createdAt), 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                        disabled={!share.puedeDescargar}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {share.puedeDescargar ? 'Descargar' : 'Sin permiso de descarga'}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab: Recibos */}
          <TabsContent value="recibos" className="mt-6">
            {filteredPayments.filter(p => p.estado === 'pagado').length === 0 ? (
              <Card className="p-12 text-center">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay recibos disponibles aún</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPayments
                  .filter(p => p.estado === 'pagado')
                  .sort((a, b) => (b.fechaPago ? new Date(b.fechaPago).getTime() : 0) - (a.fechaPago ? new Date(a.fechaPago).getTime() : 0))
                  .map((payment) => (
                    <Card key={payment.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <Receipt className="h-8 w-8 text-green-600" />
                        <Badge className="bg-green-100 text-green-800">
                          Pagado
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-lg mb-2">Recibo - {payment.periodo}</h3>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Pagado: {payment.fechaPago ? format(new Date(payment.fechaPago), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                        </div>

                        <div className="flex items-center font-semibold text-base">
                          Monto: {payment.monto.toFixed(2)}€
                        </div>
                      </div>

                      <Button
                        onClick={() => handleDownloadReceipt(payment.id, payment.periodo)}
                        className="w-full"
                        size="sm"
                        disabled={!payment.reciboPdfPath}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {payment.reciboPdfPath ? 'Descargar Recibo' : 'Recibo en Proceso'}
                      </Button>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
