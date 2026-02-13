'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Users,
  Home,
  ArrowLeft,
  Save,
  Mail,
  Phone,
  FileText,
  Calendar,
  Briefcase,
  Euro,
  Globe,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Skeleton } from '@/components/ui/skeleton';

export default function EditarInquilinoPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const tenantId = params?.id as string;

  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    dni: '',
    fechaNacimiento: '',
    nacionalidad: '',
    estadoCivil: '',
    situacionLaboral: '',
    empresa: '',
    puesto: '',
    ingresosMensuales: '',
    scoring: '',
    nivelRiesgo: 'medio',
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchTenant = async () => {
      if (status !== 'authenticated' || !tenantId) return;

      try {
        const response = await fetch(`/api/tenants/${tenantId}`);
        if (response.ok) {
          const tenant = await response.json();

          setFormData({
            nombreCompleto: tenant.nombreCompleto || '',
            email: tenant.email || '',
            telefono: tenant.telefono || '',
            dni: tenant.dni || '',
            fechaNacimiento: tenant.fechaNacimiento
              ? new Date(tenant.fechaNacimiento).toISOString().split('T')[0]
              : '',
            nacionalidad: tenant.nacionalidad || '',
            estadoCivil: tenant.estadoCivil || '',
            situacionLaboral: tenant.situacionLaboral || '',
            empresa: tenant.empresa || '',
            puesto: tenant.puesto || '',
            ingresosMensuales: tenant.ingresosMensuales?.toString() || '',
            scoring: tenant.scoring?.toString() || '50',
            nivelRiesgo: tenant.nivelRiesgo || 'medio',
            notas: tenant.notas || '',
          });
        } else if (response.status === 404) {
          toast.error('Inquilino no encontrado');
          router.push('/inquilinos');
        } else {
          toast.error('Error al cargar el inquilino');
        }
      } catch (error) {
        console.error('Error fetching tenant:', error);
        toast.error('Error de conexión');
      } finally {
        setLoadingData(false);
      }
    };

    fetchTenant();
  }, [status, tenantId, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.nombreCompleto.trim()) {
      toast.error('El nombre completo es obligatorio');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('El email es obligatorio');
      return false;
    }
    if (!formData.telefono.trim()) {
      toast.error('El teléfono es obligatorio');
      return false;
    }
    if (!formData.dni.trim()) {
      toast.error('El DNI/NIE es obligatorio');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const payload: Record<string, any> = {
        nombreCompleto: formData.nombreCompleto.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim(),
        dni: formData.dni.trim(),
        nivelRiesgo: formData.nivelRiesgo,
      };

      if (formData.fechaNacimiento) {
        payload.fechaNacimiento = new Date(formData.fechaNacimiento).toISOString();
      }
      if (formData.nacionalidad.trim()) {
        payload.nacionalidad = formData.nacionalidad.trim();
      }
      if (formData.estadoCivil) {
        payload.estadoCivil = formData.estadoCivil;
      }
      if (formData.situacionLaboral) {
        payload.situacionLaboral = formData.situacionLaboral;
      }
      if (formData.empresa.trim()) {
        payload.empresa = formData.empresa.trim();
      }
      if (formData.puesto.trim()) {
        payload.puesto = formData.puesto.trim();
      }
      if (formData.ingresosMensuales) {
        payload.ingresosMensuales = parseFloat(formData.ingresosMensuales);
      }
      if (formData.scoring) {
        payload.scoring = parseInt(formData.scoring);
      }
      if (formData.notas.trim()) {
        payload.notas = formData.notas.trim();
      }

      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Inquilino actualizado correctamente');
        router.push(`/inquilinos/${tenantId}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar el inquilino');
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || loadingData) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/inquilinos/${tenantId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
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
                <BreadcrumbLink href="/inquilinos">Inquilinos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/inquilinos/${tenantId}`}>
                  Detalles
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Editar</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Inquilino</h1>
          <p className="text-muted-foreground">
            Actualiza la información del inquilino
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos Personales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Datos Personales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombreCompleto">
                    Nombre Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombreCompleto"
                    placeholder="Juan Pérez García"
                    value={formData.nombreCompleto}
                    onChange={(e) => handleInputChange('nombreCompleto', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dni">
                    DNI/NIE <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dni"
                      placeholder="12345678A"
                      value={formData.dni}
                      onChange={(e) => handleInputChange('dni', e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="juan@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">
                    Teléfono <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefono"
                      placeholder="+34 600 123 456"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento" className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Fecha de Nacimiento
                  </Label>
                  <Input
                    id="fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nacionalidad" className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    Nacionalidad
                  </Label>
                  <Input
                    id="nacionalidad"
                    placeholder="Española"
                    value={formData.nacionalidad}
                    onChange={(e) => handleInputChange('nacionalidad', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estadoCivil" className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    Estado Civil
                  </Label>
                  <Select
                    value={formData.estadoCivil}
                    onValueChange={(value) => handleInputChange('estadoCivil', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soltero">Soltero/a</SelectItem>
                      <SelectItem value="casado">Casado/a</SelectItem>
                      <SelectItem value="divorciado">Divorciado/a</SelectItem>
                      <SelectItem value="viudo">Viudo/a</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Laboral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Información Laboral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="situacionLaboral">Situación Laboral</Label>
                  <Select
                    value={formData.situacionLaboral}
                    onValueChange={(value) => handleInputChange('situacionLaboral', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empleado">Empleado/a</SelectItem>
                      <SelectItem value="autonomo">Autónomo/a</SelectItem>
                      <SelectItem value="estudiante">Estudiante</SelectItem>
                      <SelectItem value="jubilado">Jubilado/a</SelectItem>
                      <SelectItem value="desempleado">Desempleado/a</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    placeholder="Nombre de la empresa"
                    value={formData.empresa}
                    onChange={(e) => handleInputChange('empresa', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="puesto">Puesto</Label>
                  <Input
                    id="puesto"
                    placeholder="Cargo o puesto"
                    value={formData.puesto}
                    onChange={(e) => handleInputChange('puesto', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ingresosMensuales" className="flex items-center gap-1">
                    <Euro className="h-4 w-4" />
                    Ingresos Mensuales
                  </Label>
                  <Input
                    id="ingresosMensuales"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2500.00"
                    value={formData.ingresosMensuales}
                    onChange={(e) => handleInputChange('ingresosMensuales', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluación del Inquilino */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Evaluación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scoring">Scoring (0-100)</Label>
                  <Input
                    id="scoring"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="50"
                    value={formData.scoring}
                    onChange={(e) => handleInputChange('scoring', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nivelRiesgo">Nivel de Riesgo</Label>
                  <Select
                    value={formData.nivelRiesgo}
                    onValueChange={(value) => handleInputChange('nivelRiesgo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bajo">Bajo</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="critico">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  placeholder="Observaciones sobre el inquilino..."
                  value={formData.notas}
                  onChange={(e) => handleInputChange('notas', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/inquilinos/${tenantId}`)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
