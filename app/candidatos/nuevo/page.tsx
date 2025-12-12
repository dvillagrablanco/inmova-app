'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { UserPlus, Home, ArrowLeft, Save, Scan } from 'lucide-react';
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
import { DocumentUploaderOCR } from '@/components/ui/document-uploader-ocr';


interface Unit {
  id: string;
  numero: string;
  building: { nombre: string };
}

export default function NuevoCandidatoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
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

  // Handler para cuando se completa el OCR del CV
  const handleOCRComplete = (result: any) => {
    try {
      const extractedData = result.extractedData;
      
      // Auto-rellenar campos del formulario con datos del CV
      const updates: any = {};
      let infoExtra: string[] = [];
      
      if (extractedData.nombre) {
        updates.nombreCompleto = extractedData.nombre;
        toast.success(`Nombre detectado: ${extractedData.nombre}`);
      }
      
      // Construir sección de notas con información del CV
      if (extractedData.educacion && extractedData.educacion.length > 0) {
        infoExtra.push('📚 EDUCACIÓN:');
        extractedData.educacion.forEach((edu: string) => {
          infoExtra.push(`  • ${edu}`);
        });
        toast.info(`Educación: ${extractedData.educacion.length} registros`, { duration: 3000 });
      }
      
      if (extractedData.experienciaLaboral && extractedData.experienciaLaboral.length > 0) {
        if (infoExtra.length > 0) infoExtra.push('');
        infoExtra.push('💼 EXPERIENCIA LABORAL:');
        extractedData.experienciaLaboral.forEach((exp: string) => {
          infoExtra.push(`  • ${exp}`);
        });
        
        // Detectar última profesión mencionada
        const ultimaExp = extractedData.experienciaLaboral[0];
        if (ultimaExp && !updates.profesion) {
          // Intentar extraer el puesto de trabajo
          const match = ultimaExp.match(/como\s+(.+?)\s+en|puesto\s+de\s+(.+?)\s+en|^(.+?)\s+en/i);
          if (match) {
            const profesion = match[1] || match[2] || match[3];
            if (profesion) {
              updates.profesion = profesion.trim();
              toast.success(`Profesión detectada: ${updates.profesion}`);
            }
          }
        }
        
        toast.info(`Experiencia: ${extractedData.experienciaLaboral.length} registros`, { duration: 3000 });
      }
      
      if (extractedData.habilidades && extractedData.habilidades.length > 0) {
        if (infoExtra.length > 0) infoExtra.push('');
        infoExtra.push('🔧 HABILIDADES:');
        infoExtra.push(`  ${extractedData.habilidades.join(', ')}`);
        toast.info(`Habilidades: ${extractedData.habilidades.length} detectadas`, { duration: 3000 });
      }
      
      if (extractedData.idiomas && extractedData.idiomas.length > 0) {
        if (infoExtra.length > 0) infoExtra.push('');
        infoExtra.push('🌍 IDIOMAS:');
        infoExtra.push(`  ${extractedData.idiomas.join(', ')}`);
      }
      
      // Agregar información extraída a las notas
      if (infoExtra.length > 0) {
        const notasCV = infoExtra.join('\n');
        updates.notas = formData.notas 
          ? `${formData.notas}\n\n--- DATOS DEL CV ---\n${notasCV}`
          : `--- DATOS DEL CV ---\n${notasCV}`;
      }
      
      // Actualizar formData con todos los campos detectados
      setFormData(prev => ({ ...prev, ...updates }));
      
      toast.success('Datos del CV extraídos correctamente. Revisa y completa la información restante.');
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
                  {/* OCR Scanner para CV */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Scan className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100">Escanear Curriculum Vitae</h3>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                      Sube el CV del candidato para extraer automáticamente su información profesional
                    </p>
                    <DocumentUploaderOCR
                      documentType="curriculum"
                      onUploadComplete={handleOCRComplete}
                      title="Subir CV del Candidato"
                      description="Sube el CV en PDF o imagen para auto-completar educación, experiencia y habilidades"
                      allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']}
                      maxSizeMB={10}
                    />
                  </div>

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
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4 w-full sm:w-auto">
                    <Button 
                      type="submit" 
                      disabled={isLoading || !formData.unitId}
                      className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                      className="flex-1 sm:flex-initial border-2 hover:bg-accent"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
