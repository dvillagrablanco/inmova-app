'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { UserPlus, Home, ArrowLeft, Save, Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';
import { Badge } from '@/components/ui/badge';

interface Unit {
  id: string;
  numero: string;
  building: { nombre: string };
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  url?: string;
  uploading?: boolean;
  progress?: number;
}

export default function NuevoCandidatoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [formData, setFormData] = useState({
    unitId: '',
    nombreCompleto: '',
    dni: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    profesion: '',
    ingresosMensuales: '0',
    notas: '',
  });

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docId = `doc-${Date.now()}-${i}`;
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} es demasiado grande (máximo 10MB)`);
        continue;
      }

      setDocuments(prev => [...prev, {
        id: docId,
        name: file.name,
        type: file.type,
        uploading: true,
        progress: 0
      }]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'candidates');
        formData.append('entityType', 'candidate');

        const progressInterval = setInterval(() => {
          setDocuments(prev => prev.map(d => 
            d.id === docId ? { ...d, progress: Math.min((d.progress || 0) + 20, 90) } : d
          ));
        }, 200);

        const response = await fetch('/api/upload/private', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (response.ok) {
          const data = await response.json();
          setDocuments(prev => prev.map(d => 
            d.id === docId ? { ...d, uploading: false, progress: 100, url: data.url || data.key } : d
          ));
          toast.success(`${file.name} subido correctamente`);
        } else {
          throw new Error('Error al subir');
        }
      } catch (error) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
        toast.error(`Error al subir ${file.name}`);
      }
    }
    e.target.value = '';
  };

  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/units?estado=disponible');
        if (response.ok) {
          const data = await response.json();
          setUnits(data);
        }
      } catch (error) {
        logger.error('Error fetching units:', error);
      }
    };

    if (status === 'authenticated') {
      fetchUnits();
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: formData.unitId,
          nombreCompleto: formData.nombreCompleto,
          dni: formData.dni,
          email: formData.email,
          telefono: formData.telefono,
          fechaNacimiento: formData.fechaNacimiento
            ? new Date(formData.fechaNacimiento).toISOString()
            : undefined,
          profesion: formData.profesion || undefined,
          ingresosMensuales: parseFloat(formData.ingresosMensuales),
          notas: formData.notas || undefined,
        }),
      });

      if (response.ok) {
        toast.success('Candidato registrado correctamente');
        router.push('/candidatos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al registrar el candidato');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al registrar el candidato');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <AuthenticatedLayout>
          <div className="container mx-auto p-6 space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/candidatos')}
                className="gap-2 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Candidatos
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
                    <BreadcrumbLink href="/candidatos">Candidatos</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Nuevo Candidato</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nuevo Candidato</h1>
              <p className="text-muted-foreground">
                Registra un nuevo candidato interesado en alquilar
              </p>
            </div>

            {/* Formulario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Información del Candidato
                </CardTitle>
                <CardDescription>
                  Completa los datos del candidato y la unidad de interés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Unidad de Interés */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="unitId">Unidad de Interés *</Label>
                      <Select
                        value={formData.unitId}
                        onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una unidad disponible" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.building.nombre} - Unidad {unit.numero}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Nombre */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="nombreCompleto">Nombre Completo *</Label>
                      <Input
                        id="nombreCompleto"
                        name="nombreCompleto"
                        value={formData.nombreCompleto}
                        onChange={handleChange}
                        required
                        placeholder="María López Martínez"
                      />
                    </div>

                    {/* DNI */}
                    <div className="space-y-2">
                      <Label htmlFor="dni">DNI/NIE *</Label>
                      <Input
                        id="dni"
                        name="dni"
                        value={formData.dni}
                        onChange={handleChange}
                        required
                        placeholder="12345678A"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="maria.lopez@email.com"
                      />
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        required
                        placeholder="+34 600 123 456"
                      />
                    </div>

                    {/* Fecha de Nacimiento */}
                    <div className="space-y-2">
                      <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                      <Input
                        id="fechaNacimiento"
                        name="fechaNacimiento"
                        type="date"
                        value={formData.fechaNacimiento}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Profesión */}
                    <div className="space-y-2">
                      <Label htmlFor="profesion">Profesión</Label>
                      <Input
                        id="profesion"
                        name="profesion"
                        value={formData.profesion}
                        onChange={handleChange}
                        placeholder="Diseñador Gráfico"
                      />
                    </div>

                    {/* Ingresos Mensuales */}
                    <div className="space-y-2">
                      <Label htmlFor="ingresosMensuales">Ingresos Mensuales (€) *</Label>
                      <Input
                        id="ingresosMensuales"
                        name="ingresosMensuales"
                        type="number"
                        step="0.01"
                        value={formData.ingresosMensuales}
                        onChange={handleChange}
                        required
                        min="0"
                      />
                    </div>

                    {/* Notas */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notas">Notas Adicionales</Label>
                      <Textarea
                        id="notas"
                        name="notas"
                        value={formData.notas}
                        onChange={handleChange}
                        placeholder="Cualquier información adicional relevante sobre el candidato"
                        rows={4}
                      />
                    </div>

                    {/* Carga de Documentos */}
                    <div className="space-y-3 md:col-span-2 pt-4 border-t">
                      <Label className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos del Candidato
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Sube documentos como DNI, nóminas, referencias, contrato de trabajo, etc.
                      </p>
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <label htmlFor="candidate-doc-upload" className="cursor-pointer">
                          <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-primary">Click para subir</span> o arrastra archivos
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC (máx. 10MB)</p>
                          <input
                            id="candidate-doc-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            multiple
                            onChange={handleDocumentUpload}
                          />
                        </label>
                      </div>

                      {documents.length > 0 && (
                        <div className="space-y-2">
                          {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="text-sm truncate">{doc.name}</span>
                                {doc.uploading ? (
                                  <Badge variant="secondary" className="text-xs">
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    {doc.progress}%
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-green-600">✓ Subido</Badge>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDocument(doc.id)}
                                disabled={doc.uploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={isLoading || !formData.unitId}>
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Registrar Candidato
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/candidatos')}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </AuthenticatedLayout>
  );
}
