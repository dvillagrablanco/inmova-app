'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, Building2, Loader2 } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';

interface Company {
  id: string;
  nombre: string;
  cif: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  codigoPostal: string | null;
  pais: string | null;
  contactoPrincipal: string | null;
  emailContacto: string | null;
  telefonoContacto: string | null;
  dominioPersonalizado: string | null;
  estadoCliente: string;
  notasAdmin: string | null;
  activo: boolean;
  maxUsuarios: number;
  maxPropiedades: number;
  maxEdificios: number;
  subscriptionPlanId: string | null;
  subscriptionPlan: {
    id: string;
    nombre: string;
  } | null;
}

interface Plan {
  id: string;
  nombre: string;
  precioMensual: number;
}

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    cif: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    pais: 'España',
    contactoPrincipal: '',
    emailContacto: '',
    telefonoContacto: '',
    dominioPersonalizado: '',
    estadoCliente: 'activo',
    notasAdmin: '',
    activo: true,
    maxUsuarios: 5,
    maxPropiedades: 10,
    maxEdificios: 5,
    subscriptionPlanId: '',
  });

  // Fetch company data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch company
        const companyRes = await fetch(`/api/admin/companies/${companyId}`);
        if (!companyRes.ok) {
          throw new Error('Error al cargar empresa');
        }
        const companyData = await companyRes.json();
        setCompany(companyData);
        
        // Populate form
        setFormData({
          nombre: companyData.nombre || '',
          cif: companyData.cif || '',
          email: companyData.email || '',
          telefono: companyData.telefono || '',
          direccion: companyData.direccion || '',
          ciudad: companyData.ciudad || '',
          codigoPostal: companyData.codigoPostal || '',
          pais: companyData.pais || 'España',
          contactoPrincipal: companyData.contactoPrincipal || '',
          emailContacto: companyData.emailContacto || '',
          telefonoContacto: companyData.telefonoContacto || '',
          dominioPersonalizado: companyData.dominioPersonalizado || '',
          estadoCliente: companyData.estadoCliente || 'activo',
          notasAdmin: companyData.notasAdmin || '',
          activo: companyData.activo ?? true,
          maxUsuarios: companyData.maxUsuarios || 5,
          maxPropiedades: companyData.maxPropiedades || 10,
          maxEdificios: companyData.maxEdificios || 5,
          subscriptionPlanId: companyData.subscriptionPlanId || '',
        });

        // Fetch plans
        const plansRes = await fetch('/api/admin/subscription-plans');
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          setPlans(plansData.plans || []);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      setSaving(true);
      
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
      router.push('/admin/clientes');
    } catch (error) {
      console.error('Error:', error);
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!company) {
    return (
      <AuthenticatedLayout>
        <div className="p-6">
          <p className="text-red-500">Empresa no encontrada</p>
          <Button onClick={() => router.push('/admin/clientes')} className="mt-4">
            Volver a Clientes
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <BackButton href="/admin/clientes" />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-indigo-600" />
              Editar Empresa
            </h1>
            <p className="text-gray-500">{company.nombre}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre de la Empresa *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cif">CIF/NIF</Label>
                  <Input
                    id="cif"
                    value={formData.cif}
                    onChange={(e) => setFormData({ ...formData, cif: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dirección */}
            <Card>
              <CardHeader>
                <CardTitle>Dirección</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="codigoPostal">Código Postal</Label>
                  <Input
                    id="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contacto */}
            <Card>
              <CardHeader>
                <CardTitle>Persona de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactoPrincipal">Nombre del Contacto</Label>
                  <Input
                    id="contactoPrincipal"
                    value={formData.contactoPrincipal}
                    onChange={(e) => setFormData({ ...formData, contactoPrincipal: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="emailContacto">Email del Contacto</Label>
                  <Input
                    id="emailContacto"
                    type="email"
                    value={formData.emailContacto}
                    onChange={(e) => setFormData({ ...formData, emailContacto: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="telefonoContacto">Teléfono del Contacto</Label>
                  <Input
                    id="telefonoContacto"
                    value={formData.telefonoContacto}
                    onChange={(e) => setFormData({ ...formData, telefonoContacto: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Plan y Configuración */}
            <Card>
              <CardHeader>
                <CardTitle>Plan y Configuración</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subscriptionPlanId">Plan de Suscripción</Label>
                  <Select
                    value={formData.subscriptionPlanId}
                    onValueChange={(value) => setFormData({ ...formData, subscriptionPlanId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.nombre} - €{plan.precioMensual}/mes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estadoCliente">Estado</Label>
                  <Select
                    value={formData.estadoCliente}
                    onValueChange={(value) => setFormData({ ...formData, estadoCliente: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="prueba">En Prueba</SelectItem>
                      <SelectItem value="suspendido">Suspendido</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxUsuarios">Máx. Usuarios</Label>
                  <Input
                    id="maxUsuarios"
                    type="number"
                    min="1"
                    value={formData.maxUsuarios}
                    onChange={(e) => setFormData({ ...formData, maxUsuarios: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxPropiedades">Máx. Propiedades</Label>
                  <Input
                    id="maxPropiedades"
                    type="number"
                    min="1"
                    value={formData.maxPropiedades}
                    onChange={(e) => setFormData({ ...formData, maxPropiedades: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxEdificios">Máx. Edificios</Label>
                  <Input
                    id="maxEdificios"
                    type="number"
                    min="1"
                    value={formData.maxEdificios}
                    onChange={(e) => setFormData({ ...formData, maxEdificios: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div>
                  <Label htmlFor="dominioPersonalizado">Dominio Personalizado</Label>
                  <Input
                    id="dominioPersonalizado"
                    value={formData.dominioPersonalizado}
                    onChange={(e) => setFormData({ ...formData, dominioPersonalizado: e.target.value })}
                    placeholder="miempresa.inmovaapp.com"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                  <Label htmlFor="activo">Empresa Activa</Label>
                </div>
              </CardContent>
            </Card>

            {/* Notas */}
            <Card>
              <CardHeader>
                <CardTitle>Notas Internas</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notasAdmin}
                  onChange={(e) => setFormData({ ...formData, notasAdmin: e.target.value })}
                  placeholder="Notas internas sobre este cliente..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/clientes')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
