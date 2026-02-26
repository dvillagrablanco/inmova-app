'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Building2, ArrowLeft, Home, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const INSURANCE_TYPE_OPTIONS = [
  { value: 'incendio', label: 'Incendio' },
  { value: 'robo', label: 'Robo' },
  { value: 'responsabilidad_civil', label: 'Responsabilidad Civil' },
  { value: 'hogar', label: 'Hogar' },
  { value: 'comunidad', label: 'Comunidad' },
  { value: 'vida', label: 'Vida' },
  { value: 'accidentes', label: 'Accidentes' },
  { value: 'impago_alquiler', label: 'Impago Alquiler' },
  { value: 'otro', label: 'Otro' },
];

interface ProviderFormData {
  nombre: string;
  cif: string;
  email: string;
  telefono: string;
  web: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  contactoCargo: string;
  tiposSeguro: string[];
  notas: string;
  activo: boolean;
}

const EMPTY_FORM: ProviderFormData = {
  nombre: '',
  cif: '',
  email: '',
  telefono: '',
  web: '',
  direccion: '',
  ciudad: '',
  codigoPostal: '',
  contactoNombre: '',
  contactoEmail: '',
  contactoTelefono: '',
  contactoCargo: '',
  tiposSeguro: [],
  notas: '',
  activo: true,
};

export default function NuevoProveedorPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const [formData, setFormData] = useState<ProviderFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const dashboardHref = pathname?.startsWith('/admin') ? '/admin/dashboard' : '/dashboard';

  const handleFormChange = (field: keyof ProviderFormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTipoSeguro = (tipo: string) => {
    setFormData((prev) => ({
      ...prev,
      tiposSeguro: prev.tiposSeguro.includes(tipo)
        ? prev.tiposSeguro.filter((t) => t !== tipo)
        : [...prev.tiposSeguro, tipo],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        cif: formData.cif || null,
        email: formData.email || null,
        telefono: formData.telefono || null,
        web: formData.web || null,
        direccion: formData.direccion || null,
        ciudad: formData.ciudad || null,
        codigoPostal: formData.codigoPostal || null,
        contactoNombre: formData.contactoNombre || null,
        contactoEmail: formData.contactoEmail || null,
        contactoTelefono: formData.contactoTelefono || null,
        contactoCargo: formData.contactoCargo || null,
        notas: formData.notas || null,
      };

      const response = await fetch('/api/seguros/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Error al crear proveedor');
      }

      toast.success('Proveedor creado correctamente');
      router.push('/seguros/proveedores');
    } catch (error: any) {
      console.error('Error creating provider:', error);
      toast.error(error?.message || 'Error al crear proveedor');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-[600px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={dashboardHref}>
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/seguros">Seguros</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/seguros/proveedores">Proveedores</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Nuevo</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Nuevo Proveedor</h1>
                <p className="text-sm text-muted-foreground">
                  Registra un nuevo proveedor de seguros
                </p>
              </div>
            </div>

            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Datos Generales</CardTitle>
                  <CardDescription>Información principal del proveedor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleFormChange('nombre', e.target.value)}
                      placeholder="Nombre de la aseguradora"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cif">CIF</Label>
                    <Input
                      id="cif"
                      value={formData.cif}
                      onChange={(e) => handleFormChange('cif', e.target.value)}
                      placeholder="B12345678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => handleFormChange('direccion', e.target.value)}
                      placeholder="Calle, número, piso"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ciudad">Ciudad</Label>
                      <Input
                        id="ciudad"
                        value={formData.ciudad}
                        onChange={(e) => handleFormChange('ciudad', e.target.value)}
                        placeholder="Madrid"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigoPostal">Código Postal</Label>
                      <Input
                        id="codigoPostal"
                        value={formData.codigoPostal}
                        onChange={(e) => handleFormChange('codigoPostal', e.target.value)}
                        placeholder="28001"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleFormChange('telefono', e.target.value)}
                      placeholder="+34 900 000 000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="contacto@aseguradora.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="web">Web</Label>
                    <Input
                      id="web"
                      value={formData.web}
                      onChange={(e) => handleFormChange('web', e.target.value)}
                      placeholder="https://www.aseguradora.com"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Persona de Contacto</CardTitle>
                  <CardDescription>Datos del contacto principal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactoNombre">Nombre</Label>
                    <Input
                      id="contactoNombre"
                      value={formData.contactoNombre}
                      onChange={(e) => handleFormChange('contactoNombre', e.target.value)}
                      placeholder="Juan García"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactoEmail">Email de contacto</Label>
                    <Input
                      id="contactoEmail"
                      type="email"
                      value={formData.contactoEmail}
                      onChange={(e) => handleFormChange('contactoEmail', e.target.value)}
                      placeholder="juan@aseguradora.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactoTelefono">Teléfono de contacto</Label>
                    <Input
                      id="contactoTelefono"
                      value={formData.contactoTelefono}
                      onChange={(e) => handleFormChange('contactoTelefono', e.target.value)}
                      placeholder="+34 600 000 000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactoCargo">Cargo</Label>
                    <Input
                      id="contactoCargo"
                      value={formData.contactoCargo}
                      onChange={(e) => handleFormChange('contactoCargo', e.target.value)}
                      placeholder="Director Comercial"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Seguro</CardTitle>
                  <CardDescription>Selecciona los tipos de seguro que ofrece</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {INSURANCE_TYPE_OPTIONS.map((tipo) => (
                      <div key={tipo.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`new-tipo-${tipo.value}`}
                          checked={formData.tiposSeguro.includes(tipo.value)}
                          onCheckedChange={() => toggleTipoSeguro(tipo.value)}
                        />
                        <Label
                          htmlFor={`new-tipo-${tipo.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {tipo.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notas</CardTitle>
                  <CardDescription>Observaciones adicionales</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => handleFormChange('notas', e.target.value)}
                    placeholder="Observaciones adicionales sobre el proveedor..."
                    rows={4}
                  />

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="new-activo"
                      checked={formData.activo}
                      onCheckedChange={(checked) => handleFormChange('activo', !!checked)}
                    />
                    <Label htmlFor="new-activo" className="cursor-pointer">
                      Proveedor activo
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/seguros/proveedores')}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                'Guardando...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Proveedor
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
