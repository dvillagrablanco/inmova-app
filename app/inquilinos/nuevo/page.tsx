'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import dynamic from 'next/dynamic';

import {
  Users,
  Home,
  ArrowLeft,
  Save,
  Upload,
  FileText,
  X,
  Loader2,
  Brain,
  Sparkles,
} from 'lucide-react';

// Cargar el asistente de IA de forma dinámica para evitar problemas de SSR
const TenantFormAIAssistant = dynamic(
  () => import('@/components/inquilinos/TenantFormAIAssistant'),
  { ssr: false }
);
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';
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
import { BackButton } from '@/components/ui/back-button';
import { MobileFormWizard, FormStep } from '@/components/ui/mobile-form-wizard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { z } from 'zod';

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  url?: string;
  uploading?: boolean;
  progress?: number;
}

interface TenantRequestBody {
  nombreCompleto: string;
  email: string;
  telefono: string;
  dni?: string;
  fechaNacimiento?: string;
  nacionalidad?: string;
  estadoCivil?: string;
  profesion?: string;
  ingresosMensuales?: number;
}

const tenantFormSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email invalido'),
  telefono: z.string().min(1, 'Telefono requerido'),
  tipoDocumento: z.enum(['dni', 'nie', 'pasaporte']),
  documentoIdentidad: z.string().min(1, 'Documento requerido'),
  fechaNacimiento: z.string().optional(),
  nacionalidad: z.string().optional(),
  estadoCivil: z.string().optional(),
  profesion: z.string().optional(),
  ingresosMensuales: z.string().optional(),
});

export default function NuevoInquilinoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    documentoIdentidad: '',
    tipoDocumento: 'dni',
    fechaNacimiento: '',
    nacionalidad: 'Española',
    estadoCivil: 'soltero',
    profesion: '',
    ingresosMensuales: '0',
  });

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docId = `doc-${Date.now()}-${i}`;

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} es demasiado grande (máximo 10MB)`);
        continue;
      }

      // Agregar documento en estado de carga
      setDocuments((prev) => [
        ...prev,
        {
          id: docId,
          name: file.name,
          type: file.type,
          uploading: true,
          progress: 0,
        },
      ]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'tenants');
        formData.append('entityType', 'tenant');

        // Simular progreso
        const progressInterval = setInterval(() => {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === docId ? { ...d, progress: Math.min((d.progress || 0) + 20, 90) } : d
            )
          );
        }, 200);

        const response = await fetch('/api/upload/private', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (response.ok) {
          const data = await response.json();
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === docId
                ? { ...d, uploading: false, progress: 100, url: data.url || data.key }
                : d
            )
          );
          toast.success(`${file.name} subido correctamente`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          let errorMessage = 'Error al subir el archivo';

          // Mostrar mensaje específico según el código de error
          if (errorData.code === 'S3_NOT_CONFIGURED') {
            errorMessage = 'El servicio de almacenamiento no está disponible';
          } else if (errorData.code === 'S3_ERROR') {
            errorMessage = 'Error de conexión con el almacenamiento';
          } else if (errorData.error === 'Tipo de archivo no permitido') {
            errorMessage = `Tipo de archivo no permitido: ${file.type}`;
          } else if (errorData.error === 'Archivo demasiado grande (máximo 10MB)') {
            errorMessage = 'El archivo es demasiado grande (máx. 10MB)';
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }

          throw new Error(errorMessage);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : `Error al subir ${file.name}`;
        console.error('Error uploading document:', errorMessage);
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        toast.error('Error de conexión');
      }
    }
    // Reset input
    e.target.value = '';
  };

  const removeDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const parsed = tenantFormSchema.safeParse({
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim(),
        tipoDocumento: formData.tipoDocumento,
        documentoIdentidad: formData.documentoIdentidad.trim(),
        fechaNacimiento: formData.fechaNacimiento || undefined,
        nacionalidad: formData.nacionalidad.trim() || undefined,
        estadoCivil: formData.estadoCivil || undefined,
        profesion: formData.profesion.trim() || undefined,
        ingresosMensuales: formData.ingresosMensuales,
      });

      if (!parsed.success) {
        toast.error(parsed.error.errors[0]?.message || 'Datos invalidos');
        setIsLoading(false);
        return;
      }

      const ingresosMensuales =
        parsed.data.ingresosMensuales && parsed.data.ingresosMensuales.trim()
          ? parseFloat(parsed.data.ingresosMensuales)
          : undefined;

      if (parsed.data.ingresosMensuales && Number.isNaN(ingresosMensuales)) {
        toast.error('Ingresos invalidos');
        setIsLoading(false);
        return;
      }

      const requestBody: TenantRequestBody = {
        nombreCompleto: parsed.data.nombre,
        email: parsed.data.email,
        telefono: parsed.data.telefono,
        fechaNacimiento: parsed.data.fechaNacimiento
          ? new Date(parsed.data.fechaNacimiento).toISOString()
          : undefined,
        nacionalidad: parsed.data.nacionalidad,
        estadoCivil: parsed.data.estadoCivil,
        profesion: parsed.data.profesion,
        ingresosMensuales,
      };

      if (parsed.data.tipoDocumento === 'dni') {
        requestBody.dni = parsed.data.documentoIdentidad;
      }

      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast.success('Inquilino creado correctamente');
        router.push('/inquilinos');
      } else {
        toast.error('Error de conexión');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            onClick={() => router.push('/inquilinos')}
            className="gap-2 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Inquilinos
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
                <BreadcrumbLink href="/inquilinos">Inquilinos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Nuevo Inquilino</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header Section */}
        <div className="space-y-4">
          <BackButton href="/inquilinos" label="Volver a Inquilinos" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Inquilino</h1>
            <p className="text-muted-foreground">Registra un nuevo inquilino en el sistema</p>
          </div>
        </div>

        {/* Formulario con Wizard para móvil */}
        <form onSubmit={handleSubmit}>
          <MobileFormWizard
            steps={[
              {
                id: 'personal',
                title: 'Información Personal',
                description: 'Datos básicos de contacto del inquilino',
                fields: (
                  <div className="space-y-4">
                    {/* Nombre */}
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre Completo *</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Juan Pérez García"
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
                        placeholder="juan.perez@email.com"
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
                  </div>
                ),
              },
              {
                id: 'documentation',
                title: 'Documentación',
                description: 'Información de identificación legal',
                fields: (
                  <div className="space-y-4">
                    {/* Tipo de Documento */}
                    <div className="space-y-2">
                      <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                      <Select
                        value={formData.tipoDocumento}
                        onValueChange={(value) =>
                          setFormData({ ...formData, tipoDocumento: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dni">DNI</SelectItem>
                          <SelectItem value="nie">NIE</SelectItem>
                          <SelectItem value="pasaporte">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Documento de Identidad */}
                    <div className="space-y-2">
                      <Label htmlFor="documentoIdentidad">Número de Documento *</Label>
                      <Input
                        id="documentoIdentidad"
                        name="documentoIdentidad"
                        value={formData.documentoIdentidad}
                        onChange={handleChange}
                        required
                        placeholder="12345678A"
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

                    {/* Nacionalidad */}
                    <div className="space-y-2">
                      <Label htmlFor="nacionalidad">Nacionalidad</Label>
                      <Input
                        id="nacionalidad"
                        name="nacionalidad"
                        value={formData.nacionalidad}
                        onChange={handleChange}
                        placeholder="Española"
                      />
                    </div>

                    {/* Carga de Documentos */}
                    <div className="space-y-3 pt-4 border-t">
                      <Label className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos del Inquilino
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Sube documentos como DNI, nóminas, contrato de trabajo, etc.
                      </p>

                      {/* Botón de Escaneo con IA - Visible en todas las pantallas incluyendo móvil */}
                      <AIDocumentAssistant
                        context="inquilinos"
                        variant="inline"
                        position="bottom-right"
                        entityType="tenant"
                        autoSaveDocument={true}
                        onApplyData={(data) => {
                          console.log(
                            '[Inquilino] Datos recibidos para aplicar:',
                            JSON.stringify(data, null, 2)
                          );

                          const updates: Partial<typeof formData> = {};

                          // Nombre completo
                          const nombre =
                            data.nombreCompleto || data.nombre || data.fullName || data.name;
                          if (nombre) {
                            updates.nombre = nombre;
                            console.log('[Inquilino] Nombre:', nombre);
                          }

                          // Documento de identidad
                          const docIdentidad =
                            data.dni ||
                            data.nie ||
                            data.numeroDocumento ||
                            data.documentoIdentidad ||
                            data.documentNumber;
                          if (docIdentidad) {
                            updates.documentoIdentidad = docIdentidad;
                            console.log('[Inquilino] DNI:', docIdentidad);
                          }

                          // Fecha de nacimiento
                          const fechaRaw =
                            data.fechaNacimiento || data.birthDate || data.dateOfBirth;
                          if (fechaRaw) {
                            let fechaFormateada = fechaRaw;

                            if (/^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) {
                              fechaFormateada = fechaRaw;
                            } else if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(fechaRaw)) {
                              const parts = fechaRaw.split(/[/-]/);
                              fechaFormateada = `${parts[2]}-${parts[1]}-${parts[0]}`;
                            } else {
                              const fecha = new Date(fechaRaw);
                              if (!isNaN(fecha.getTime())) {
                                fechaFormateada = fecha.toISOString().split('T')[0];
                              }
                            }
                            updates.fechaNacimiento = fechaFormateada;
                            console.log('[Inquilino] Fecha:', fechaFormateada);
                          }

                          // Nacionalidad
                          if (data.nacionalidad || data.nationality) {
                            updates.nacionalidad = data.nacionalidad || data.nationality;
                          }

                          // Tipo de documento
                          if (data.tipoDocumento || data.documentType) {
                            const tipo = (
                              data.tipoDocumento ||
                              data.documentType ||
                              ''
                            ).toLowerCase();
                            if (['dni', 'nie', 'pasaporte'].includes(tipo)) {
                              updates.tipoDocumento = tipo;
                            }
                          }

                          // Email
                          if (data.email || data.correo) {
                            updates.email = data.email || data.correo;
                          }

                          // Teléfono
                          if (data.telefono || data.phone) {
                            updates.telefono = data.telefono || data.phone;
                          }

                          console.log(
                            '[Inquilino] Updates a aplicar:',
                            JSON.stringify(updates, null, 2)
                          );

                          if (Object.keys(updates).length > 0) {
                            setFormData((prev) => {
                              const newData = { ...prev, ...updates };
                              console.log(
                                '[Inquilino] FormData actualizado:',
                                JSON.stringify(newData, null, 2)
                              );
                              return newData;
                            });
                            toast.success(
                              `${Object.keys(updates).length} campos aplicados al formulario`
                            );
                          } else {
                            toast.warning('No se encontraron campos para aplicar');
                          }
                        }}
                        onDocumentSaved={(documentId, file) => {
                          setDocuments((prev) => [
                            ...prev,
                            {
                              id: documentId,
                              name: file.name,
                              type: file.type,
                              url: `/api/documents/${documentId}/download`,
                              uploading: false,
                              progress: 100,
                            },
                          ]);
                        }}
                      />

                      {/* Área de upload manual */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                        <label htmlFor="doc-upload" className="cursor-pointer">
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-primary">Click para subir</span> o
                            arrastra archivos
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (máx. 10MB)</p>
                          <input
                            id="doc-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            multiple
                            onChange={handleDocumentUpload}
                          />
                        </label>
                      </div>

                      {/* Lista de documentos */}
                      {documents.length > 0 && (
                        <div className="space-y-2">
                          {documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="text-sm truncate">{doc.name}</span>
                                {doc.uploading ? (
                                  <Badge variant="secondary" className="text-xs">
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    {doc.progress}%
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    ✓
                                  </Badge>
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
                ),
              },
              {
                id: 'additional',
                title: 'Información Adicional',
                description: 'Datos complementarios del inquilino',
                fields: (
                  <div className="space-y-4">
                    {/* Estado Civil */}
                    <div className="space-y-2">
                      <Label htmlFor="estadoCivil">Estado Civil</Label>
                      <Select
                        value={formData.estadoCivil}
                        onValueChange={(value) => setFormData({ ...formData, estadoCivil: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soltero">Soltero/a</SelectItem>
                          <SelectItem value="casado">Casado/a</SelectItem>
                          <SelectItem value="divorciado">Divorciado/a</SelectItem>
                          <SelectItem value="viudo">Viudo/a</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Profesión */}
                    <div className="space-y-2">
                      <Label htmlFor="profesion">Profesión</Label>
                      <Input
                        id="profesion"
                        name="profesion"
                        value={formData.profesion}
                        onChange={handleChange}
                        placeholder="Ingeniero de Software"
                      />
                    </div>

                    {/* Ingresos Mensuales */}
                    <div className="space-y-2">
                      <Label htmlFor="ingresosMensuales">Ingresos Mensuales (€)</Label>
                      <Input
                        id="ingresosMensuales"
                        name="ingresosMensuales"
                        type="number"
                        step="0.01"
                        value={formData.ingresosMensuales}
                        onChange={handleChange}
                        min="0"
                        placeholder="2500.00"
                      />
                    </div>

                    {/* Resumen */}
                    {formData.nombre && formData.email && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2">
                        <h4 className="font-medium text-sm">Resumen del Inquilino</h4>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-muted-foreground">Nombre:</span> {formData.nombre}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Email:</span> {formData.email}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Teléfono:</span>{' '}
                            {formData.telefono}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Documento:</span>{' '}
                            {formData.tipoDocumento.toUpperCase()} - {formData.documentoIdentidad}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
            submitButton={
              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Crear Inquilino
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/inquilinos')}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            }
          />
        </form>

        {/* Asistente IA para el formulario - Oculto en móvil para evitar solapamiento */}
        <TenantFormAIAssistant formData={formData} />

        {/* Nota: AIDocumentAssistant ahora está integrado en la sección de Documentos del formulario (variant="inline") */}
      </div>
    </AuthenticatedLayout>
  );
}
