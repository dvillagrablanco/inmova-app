'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface CompanyData {
  id: string;
  nombre: string;
  cif: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  logoUrl: string | null;
  codigoPostal: string | null;
  ciudad: string | null;
  pais: string | null;
  dominioPersonalizado: string | null;
  estadoCliente: string | null;
  contactoPrincipal: string | null;
  emailContacto: string | null;
  telefonoContacto: string | null;
  notasAdmin: string | null;
  maxUsuarios: number | null;
  maxPropiedades: number | null;
  maxEdificios: number | null;
  subscriptionPlanId: string | null;
  activo: boolean;
  category: string | null;
}

interface SubscriptionPlan {
  id: string;
  nombre: string;
  precioMensual: number;
}

export default function EditarEmpresaPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [formData, setFormData] = useState<CompanyData>({
    id: '',
    nombre: '',
    cif: '',
    direccion: '',
    telefono: '',
    email: '',
    logoUrl: '',
    codigoPostal: '',
    ciudad: '',
    pais: 'España',
    dominioPersonalizado: '',
    estadoCliente: 'potencial',
    contactoPrincipal: '',
    emailContacto: '',
    telefonoContacto: '',
    notasAdmin: '',
    maxUsuarios: null,
    maxPropiedades: null,
    maxEdificios: null,
    subscriptionPlanId: null,
    activo: true,
    category: null,
  });

  useEffect(() => {
    fetchCompanyData();
    fetchPlans();
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`);
      if (!res.ok) throw new Error('Error al cargar empresa');
      const data = await res.json();
      setFormData(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los datos de la empresa');
      router.push('/admin/clientes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/subscription-plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar');
      }

      toast.success('Empresa actualizada correctamente');
      router.push(`/admin/clientes/${companyId}`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CompanyData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/home">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin/clientes">Clientes</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/admin/clientes/${companyId}`}>
                    {formData.nombre}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Editar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-8 w-8 text-indigo-600" />
                  Editar Empresa
                </h1>
                <p className="text-gray-600 mt-1">{formData.nombre}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>
                  Datos generales de la empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cif">CIF/NIF</Label>
                    <Input
                      id="cif"
                      value={formData.cif || ''}
                      onChange={(e) => handleChange('cif', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono || ''}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion || ''}
                    onChange={(e) => handleChange('direccion', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      value={formData.ciudad || ''}
                      onChange={(e) => handleChange('ciudad', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigoPostal">Código Postal</Label>
                    <Input
                      id="codigoPostal"
                      value={formData.codigoPostal || ''}
                      onChange={(e) => handleChange('codigoPostal', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pais">País</Label>
                    <Input
                      id="pais"
                      value={formData.pais || ''}
                      onChange={(e) => handleChange('pais', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información de Contacto */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
                <CardDescription>
                  Datos del contacto principal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactoPrincipal">Nombre Contacto</Label>
                    <Input
                      id="contactoPrincipal"
                      value={formData.contactoPrincipal || ''}
                      onChange={(e) => handleChange('contactoPrincipal', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailContacto">Email Contacto</Label>
                    <Input
                      id="emailContacto"
                      type="email"
                      value={formData.emailContacto || ''}
                      onChange={(e) => handleChange('emailContacto', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefonoContacto">Teléfono Contacto</Label>
                    <Input
                      id="telefonoContacto"
                      value={formData.telefonoContacto || ''}
                      onChange={(e) => handleChange('telefonoContacto', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración</CardTitle>
                <CardDescription>
                  Plan de suscripción y límites
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionPlanId">Plan de Suscripción</Label>
                    <Select
                      value={formData.subscriptionPlanId || ''}
                      onValueChange={(value) => handleChange('subscriptionPlanId', value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin plan</SelectItem>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.nombre} - €{plan.precioMensual}/mes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estadoCliente">Estado Cliente</Label>
                    <Select
                      value={formData.estadoCliente || ''}
                      onValueChange={(value) => handleChange('estadoCliente', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="potencial">Potencial</SelectItem>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                        <SelectItem value="prueba">Prueba</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxUsuarios">Máx. Usuarios</Label>
                    <Input
                      id="maxUsuarios"
                      type="number"
                      value={formData.maxUsuarios || ''}
                      onChange={(e) => handleChange('maxUsuarios', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPropiedades">Máx. Propiedades</Label>
                    <Input
                      id="maxPropiedades"
                      type="number"
                      value={formData.maxPropiedades || ''}
                      onChange={(e) => handleChange('maxPropiedades', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxEdificios">Máx. Edificios</Label>
                    <Input
                      id="maxEdificios"
                      type="number"
                      value={formData.maxEdificios || ''}
                      onChange={(e) => handleChange('maxEdificios', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => handleChange('activo', checked)}
                  />
                  <Label htmlFor="activo">Empresa Activa</Label>
                </div>
              </CardContent>
            </Card>

            {/* Notas Admin */}
            <Card>
              <CardHeader>
                <CardTitle>Notas Administrativas</CardTitle>
                <CardDescription>
                  Notas internas (no visibles para el cliente)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notasAdmin || ''}
                  onChange={(e) => handleChange('notasAdmin', e.target.value)}
                  placeholder="Agregar notas internas..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
