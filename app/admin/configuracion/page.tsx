'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { useSelectedCompany } from '@/lib/hooks/admin/useSelectedCompany';

import {
  Building2,
  Home,
  ArrowLeft,
  Save,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonWithLoading } from '@/components/ui/button-with-loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';

interface Company {
  id: string;
  nombre: string;
  cif: string;
  direccion: string;
  telefono: string;
  email: string;
  ciudad?: string;
  codigoPostal?: string;
  parentCompanyId?: string | null;
  parentCompany?: {
    id: string;
    nombre: string;
  } | null;
  childCompanies?: Array<{
    id: string;
    nombre: string;
  }>;
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { isAdmin } = usePermissions();
  const { selectedCompany } = useSelectedCompany();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    cif: '',
    direccion: '',
    telefono: '',
    email: '',
    ciudad: '',
    codigoPostal: '',
  });

  const isSuperAdmin = (session?.user as any)?.role === 'super_admin';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && !isAdmin) {
      router.push('/dashboard');
      toast.error('No tienes permisos para acceder a esta página');
    }
  }, [status, router, isAdmin]);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        // Para super_admin: usar empresa seleccionada si existe
        const companyIdParam = isSuperAdmin && selectedCompany?.id 
          ? `?companyId=${selectedCompany.id}` 
          : '';
        
        const response = await fetch(`/api/company${companyIdParam}`);
        if (response.ok) {
          const data = await response.json();
          setCompany(data);
          setFormData({
            nombre: data.nombre || '',
            cif: data.cif || '',
            direccion: data.direccion || '',
            telefono: data.telefono || '',
            email: data.email || '',
            ciudad: data.ciudad || '',
            codigoPostal: data.codigoPostal || '',
          });
        }
      } catch (error) {
        logger.error('Error fetching company:', error);
        toast.error('Error al cargar la información de la empresa');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && isAdmin) {
      fetchCompany();
    }
  }, [status, isAdmin, isSuperAdmin, selectedCompany?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error('No tienes permisos para editar la configuración');
      return;
    }

    setIsSaving(true);

    try {
      // Para super_admin: usar empresa seleccionada si existe
      const companyIdParam = isSuperAdmin && selectedCompany?.id 
        ? `?companyId=${selectedCompany.id}` 
        : '';
      
      const response = await fetch(`/api/company${companyIdParam}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedCompany = await response.json();
        setCompany(updatedCompany);
        toast.success('Configuración actualizada correctamente');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar los cambios');
      }
    } catch (error) {
      logger.error('Error updating company:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session || !company) return null;

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
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
                    <BreadcrumbPage>Configuración de Empresa</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Indicador de empresa seleccionada para super_admin */}
            {isSuperAdmin && selectedCompany && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Configurando empresa: <strong>{selectedCompany.nombre}</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración de Empresa</h1>
                <p className="text-muted-foreground">
                  {isSuperAdmin && selectedCompany 
                    ? `Configurando: ${selectedCompany.nombre}`
                    : 'Gestiona la información de tu empresa'}
                </p>
              </div>
            </div>

            {/* Información Actual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información de la Empresa
                </CardTitle>
                <CardDescription>
                  {isAdmin
                    ? 'Actualiza los datos de tu empresa. Estos datos se usarán en documentos y comunicaciones.'
                    : 'Visualiza la información de tu empresa (solo administradores pueden editarla).'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Nombre */}
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre de la Empresa *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="nombre"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          disabled={!isAdmin}
                          required
                          className="pl-10"
                          placeholder="INMOVA S.L."
                        />
                      </div>
                    </div>

                    {/* CIF */}
                    <div className="space-y-2">
                      <Label htmlFor="cif">CIF / NIF *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="cif"
                          name="cif"
                          value={formData.cif}
                          onChange={handleChange}
                          disabled={!isAdmin}
                          required
                          className="pl-10"
                          placeholder="B12345678"
                        />
                      </div>
                    </div>

                    {/* Dirección */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="direccion">Dirección *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="direccion"
                          name="direccion"
                          value={formData.direccion}
                          onChange={handleChange}
                          disabled={!isAdmin}
                          required
                          className="pl-10"
                          placeholder="Calle Gran Vía 1, 28013 Madrid"
                        />
                      </div>
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="telefono"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          disabled={!isAdmin}
                          required
                          className="pl-10"
                          placeholder="+34 912 345 678"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={!isAdmin}
                          required
                          className="pl-10"
                          placeholder="info@inmova.com"
                        />
                      </div>
                    </div>

                    {/* Ciudad */}
                    <div className="space-y-2">
                      <Label htmlFor="ciudad">Ciudad</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="ciudad"
                          name="ciudad"
                          value={formData.ciudad}
                          onChange={handleChange}
                          disabled={!isAdmin}
                          className="pl-10"
                          placeholder="Madrid"
                        />
                      </div>
                    </div>

                    {/* Código Postal */}
                    <div className="space-y-2">
                      <Label htmlFor="codigoPostal">Código Postal</Label>
                      <Input
                        id="codigoPostal"
                        name="codigoPostal"
                        value={formData.codigoPostal}
                        onChange={handleChange}
                        disabled={!isAdmin}
                        placeholder="28013"
                      />
                    </div>
                  </div>

                  {/* Información de Jerarquía de Empresa */}
                  {(company.parentCompany ||
                    (company.childCompanies && company.childCompanies.length > 0)) && (
                    <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                      <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                        Jerarquía de Empresa
                      </h3>

                      {company.parentCompany && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Empresa Madre</Label>
                          <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-md border">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{company.parentCompany.nombre}</span>
                            <Badge variant="secondary" className="ml-auto">
                              Grupo
                            </Badge>
                          </div>
                        </div>
                      )}

                      {company.childCompanies && company.childCompanies.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            Empresas Hijas ({company.childCompanies.length})
                          </Label>
                          <div className="space-y-2">
                            {company.childCompanies.map((child) => (
                              <div
                                key={child.id}
                                className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md border text-sm"
                              >
                                <Building2 className="h-3 w-3 text-blue-600" />
                                <span>{child.nombre}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botones */}
                  {isAdmin && (
                    <div className="flex gap-3 pt-4">
                      <ButtonWithLoading
                        type="submit"
                        isLoading={isSaving}
                        loadingText="Guardando..."
                        icon={Save}
                      >
                        Guardar Cambios
                      </ButtonWithLoading>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setFormData({
                            nombre: company.nombre || '',
                            cif: company.cif || '',
                            direccion: company.direccion || '',
                            telefono: company.telefono || '',
                            email: company.email || '',
                            ciudad: company.ciudad || '',
                            codigoPostal: company.codigoPostal || '',
                          })
                        }
                        disabled={isSaving}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}

                  {!isAdmin && (
                    <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-200">
                      <FileText className="h-4 w-4" />
                      Solo los administradores pueden editar la configuración de la empresa.
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </AuthenticatedLayout>
  );
}
