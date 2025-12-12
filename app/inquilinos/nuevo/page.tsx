'use client';
export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Users, Home, ArrowLeft, Save, Scan } from 'lucide-react';
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
import { MobileFormWizard, FormStep } from '@/components/ui/mobile-form-wizard';
import logger, { logError } from '@/lib/logger';
import { DocumentUploaderOCR } from '@/components/ui/document-uploader-ocr';


export default function NuevoInquilinoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          documentoIdentidad: formData.documentoIdentidad,
          tipoDocumento: formData.tipoDocumento,
          fechaNacimiento: formData.fechaNacimiento
            ? new Date(formData.fechaNacimiento).toISOString()
            : undefined,
          nacionalidad: formData.nacionalidad,
          estadoCivil: formData.estadoCivil,
          profesion: formData.profesion,
          ingresosMensuales: parseFloat(formData.ingresosMensuales),
        }),
      });

      if (response.ok) {
        toast.success('Inquilino creado correctamente');
        router.push('/inquilinos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear el inquilino');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al crear el inquilino');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handler para cuando se completa el OCR del DNI
  const handleOCRComplete = (result: any) => {
    try {
      const extractedData = result.extractedData;
      
      // Auto-rellenar campos del formulario con datos del DNI
      const updates: any = {};
      
      if (extractedData.nombreCompleto) {
        updates.nombre = extractedData.nombreCompleto;
        toast.success(`Nombre detectado: ${extractedData.nombreCompleto}`);
      }
      
      if (extractedData.numeroDocumento) {
        updates.documentoIdentidad = extractedData.numeroDocumento;
        toast.success(`Documento detectado: ${extractedData.numeroDocumento}`);
      }
      
      if (extractedData.fechaNacimiento) {
        // Convertir formato de fecha si es necesario (DD/MM/YYYY -> YYYY-MM-DD)
        const fecha = extractedData.fechaNacimiento;
        if (fecha.includes('/')) {
          const partes = fecha.split('/');
          if (partes.length === 3) {
            updates.fechaNacimiento = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
          }
        } else {
          updates.fechaNacimiento = fecha;
        }
        toast.success(`Fecha de nacimiento detectada`);
      }
      
      if (extractedData.nacionalidad) {
        updates.nacionalidad = extractedData.nacionalidad;
      }
      
      // Actualizar formData con todos los campos detectados
      setFormData(prev => ({ ...prev, ...updates }));
      
      toast.success('Datos del DNI extraídos correctamente. Revisa y ajusta si es necesario.');
    } catch (error) {
      logError(new Error('Error al procesar datos del OCR'), { originalError: error });
      toast.error('Error al procesar los datos extraídos');
    }
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
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto">
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
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nuevo Inquilino</h1>
              <p className="text-muted-foreground">Registra un nuevo inquilino en el sistema</p>
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
                        {/* OCR Scanner para DNI */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-3">
                            <Scan className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Escanear DNI/NIE/Pasaporte</h3>
                          </div>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                            Sube una foto o PDF del documento para extraer automáticamente los datos
                          </p>
                          <DocumentUploaderOCR
                            documentType="dni"
                            onUploadComplete={handleOCRComplete}
                            title="Subir Documento de Identidad"
                            description="Sube DNI, NIE o Pasaporte para auto-completar los datos"
                            allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']}
                            maxSizeMB={10}
                          />
                        </div>

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
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                      className="flex-1 sm:flex-initial border-2 hover:bg-accent"
                    >
                      Cancelar
                    </Button>
                  </div>
                }
              />
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
