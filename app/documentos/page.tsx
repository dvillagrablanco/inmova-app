'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Filter,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Home,
  File,
  Calendar as CalendarIcon,
  Building2,
  User,
  Search,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import logger, { logError } from '@/lib/logger';

interface Document {
  id: string;
  nombre: string;
  tipo: string;
  cloudStoragePath: string;
  fechaSubida: string;
  fechaVencimiento: string | null;
  tenant?: { nombreCompleto: string };
  unit?: { numero: string };
  building?: { nombre: string };
}

export default function DocumentosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { canCreate } = usePermissions();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadDocuments();
    }
  }, [session]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error loading documents'), {
        context: 'loadDocuments',
      });
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      setUploading(true);
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast.success('Documento subido correctamente');
        setShowUploadDialog(false);
        loadDocuments();
      } else {
        throw new Error('Error al subir documento');
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error uploading document'), {
        context: 'handleUpload',
      });
      toast.error('Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Documento eliminado');
        loadDocuments();
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesTipo = filterTipo === 'all' || doc.tipo === filterTipo;
      const matchesSearch =
        doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.tenant?.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      return matchesTipo && matchesSearch;
    });
  }, [documents, filterTipo, searchTerm]);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Cargando documentos..." />
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Documentos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Documentos</h1>
              <p className="text-muted-foreground">Gestiona archivos y documentación</p>
            </div>
            {canCreate && (
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Documento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Subir Nuevo Documento</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="file">Archivo*</Label>
                      <Input id="file" name="file" type="file" required />
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo*</Label>
                      <Select name="tipo" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contrato">Contrato</SelectItem>
                          <SelectItem value="dni">DNI</SelectItem>
                          <SelectItem value="nomina">Nómina</SelectItem>
                          <SelectItem value="factura">Factura</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? 'Subiendo...' : 'Subir'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-xs text-muted-foreground">documentos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Contratos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {documents.filter((d) => d.tipo === 'contrato').length}
                </div>
                <p className="text-xs text-muted-foreground">archivos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Facturas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {documents.filter((d) => d.tipo === 'factura').length}
                </div>
                <p className="text-xs text-muted-foreground">archivos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {
                    documents.filter((d) => {
                      if (!d.fechaVencimiento) return false;
                      const venc = new Date(d.fechaVencimiento);
                      const today = new Date();
                      const diffDays = Math.ceil(
                        (venc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return diffDays >= 0 && diffDays <= 30;
                    }).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">próximos 30 días</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="contrato">Contratos</SelectItem>
                <SelectItem value="dni">DNI</SelectItem>
                <SelectItem value="nomina">Nóminas</SelectItem>
                <SelectItem value="factura">Facturas</SelectItem>
                <SelectItem value="otro">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents List */}
          {filteredDocuments.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-16 w-16 text-gray-400" />}
              title="No hay documentos"
              description={searchTerm ? `Sin resultados para "${searchTerm}"` : 'Sube tu primer documento'}
            />
          ) : (
            <div className="grid gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <FileText className="h-10 w-10 text-blue-600" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{doc.nombre}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{doc.tipo}</Badge>
                            <span>{format(new Date(doc.fechaSubida), 'dd MMM yyyy', { locale: es })}</span>
                            {doc.tenant && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {doc.tenant.nombreCompleto}
                              </span>
                            )}
                            {doc.building && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {doc.building.nombre}
                              </span>
                            )}
                          </div>
                          {doc.fechaVencimiento && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Vence: {format(new Date(doc.fechaVencimiento), 'dd MMM yyyy', { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
