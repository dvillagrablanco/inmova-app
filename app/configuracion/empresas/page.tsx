'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Building2, Home, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface CompanyItem {
  id: string;
  nombre: string;
  logoUrl?: string | null;
  estadoCliente?: string | null;
  activo: boolean;
  roleInCompany?: string;
  isCurrent?: boolean;
  isPrimary?: boolean;
  tags?: string[];
  parentCompany?: { id: string; nombre: string } | null;
  parentCompanyId?: string | null;
  _count?: { childCompanies: number };
}

type CreateCompanyPayload = {
  nombre: string;
  cif?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  parentCompanyId?: string | null;
  tipo: 'empresa' | 'holding' | 'personal';
};

export default function ConfiguracionEmpresasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [holdingOpen, setHoldingOpen] = useState(false);
  const [holdingTarget, setHoldingTarget] = useState<CompanyItem | null>(null);
  const [selectedHoldingId, setSelectedHoldingId] = useState<string>('none');
  const [creating, setCreating] = useState(false);
  const [savingHolding, setSavingHolding] = useState(false);
  const [formData, setFormData] = useState<CreateCompanyPayload>({
    nombre: '',
    cif: '',
    email: '',
    telefono: '',
    ciudad: '',
    parentCompanyId: null,
    tipo: 'empresa',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/companies');
      if (!res.ok) {
        throw new Error('Error al cargar empresas');
      }
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (error) {
      toast.error('No se pudieron cargar las empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const holdings = useMemo(() => {
    return companies.filter((company) => {
      const childCount = company._count?.childCompanies || 0;
      return childCount > 0 || company.tags?.includes('holding');
    });
  }, [companies]);

  const canCreate = useMemo(() => {
    const role = session?.user?.role;
    return role === 'administrador' || role === 'gestor' || role === 'super_admin';
  }, [session?.user?.role]);

  const handleCreateCompany = async () => {
    setCreating(true);
    try {
      const payload: CreateCompanyPayload = {
        ...formData,
        parentCompanyId:
          formData.tipo === 'holding' ? null : formData.parentCompanyId || null,
      };

      const res = await fetch('/api/user/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || 'Error al crear la empresa');
      }

      toast.success('Empresa creada');
      setCreateOpen(false);
      setFormData({
        nombre: '',
        cif: '',
        email: '',
        telefono: '',
        ciudad: '',
        parentCompanyId: null,
        tipo: 'empresa',
      });
      fetchCompanies();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo crear la empresa');
    } finally {
      setCreating(false);
    }
  };

  const openHoldingDialog = (company: CompanyItem) => {
    setHoldingTarget(company);
    setSelectedHoldingId(company.parentCompany?.id || 'none');
    setHoldingOpen(true);
  };

  const handleUpdateHolding = async () => {
    if (!holdingTarget) return;
    setSavingHolding(true);
    try {
      const res = await fetch(
        `/api/user/companies/${holdingTarget.id}/holding`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentCompanyId:
              selectedHoldingId === 'none' ? null : selectedHoldingId,
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || 'Error al actualizar la holding');
      }

      toast.success('Holding actualizada');
      setHoldingOpen(false);
      fetchCompanies();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo actualizar la holding');
    } finally {
      setSavingHolding(false);
    }
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-6 px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/configuracion">Configuración</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Empresas y Holding</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Empresas y Holding</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona empresas del grupo, activos personales y consolidación
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchCompanies}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!canCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva empresa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear empresa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          tipo: value as CreateCompanyPayload['tipo'],
                          parentCompanyId: null,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="empresa">Empresa</SelectItem>
                        <SelectItem value="holding">Holding</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                      }
                      placeholder="Nombre de la empresa"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>CIF (opcional)</Label>
                      <Input
                        value={formData.cif || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, cif: e.target.value }))
                        }
                        placeholder="B-19774660"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email (opcional)</Label>
                      <Input
                        value={formData.email || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="empresa@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Teléfono (opcional)</Label>
                      <Input
                        value={formData.telefono || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, telefono: e.target.value }))
                        }
                        placeholder="+34 600 000 000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ciudad (opcional)</Label>
                      <Input
                        value={formData.ciudad || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ciudad: e.target.value }))
                        }
                        placeholder="Madrid"
                      />
                    </div>
                  </div>

                  {formData.tipo !== 'holding' && (
                    <div className="space-y-2">
                      <Label>Consolidar en holding (opcional)</Label>
                      <Select
                        value={formData.parentCompanyId || 'none'}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            parentCompanyId: value === 'none' ? null : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin holding" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin holding</SelectItem>
                          {holdings.map((holding) => (
                            <SelectItem key={holding.id} value={holding.id}>
                              {holding.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateCompany}
                    disabled={creating}
                  >
                    {creating ? 'Creando...' : 'Crear empresa'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!canCreate && (
          <Card>
            <CardContent className="py-4 text-sm text-muted-foreground">
              Solo administradores pueden crear y consolidar empresas.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Empresas con acceso</CardTitle>
            <CardDescription>
              Todas las empresas disponibles con tu usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : companies.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No hay empresas disponibles.
              </div>
            ) : (
              companies.map((company) => {
                const childCount = company._count?.childCompanies || 0;
                const isHolding = childCount > 0 || company.tags?.includes('holding');
                const isPersonal = company.tags?.includes('personal');

                return (
                  <div
                    key={company.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{company.nombre}</p>
                          {company.isCurrent && (
                            <Badge variant="secondary">Actual</Badge>
                          )}
                          {isHolding && (
                            <Badge variant="outline">Holding</Badge>
                          )}
                          {isPersonal && (
                            <Badge variant="outline">Personal</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {company.parentCompany ? (
                            <>Holding: {company.parentCompany.nombre}</>
                          ) : (
                            <>Sin holding</>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isHolding && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canCreate}
                          onClick={() => openHoldingDialog(company)}
                        >
                          Configurar holding
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Dialog open={holdingOpen} onOpenChange={setHoldingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar holding</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Holding</Label>
              <Select
                value={selectedHoldingId}
                onValueChange={setSelectedHoldingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin holding" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin holding</SelectItem>
                  {holdings.map((holding) => (
                    <SelectItem key={holding.id} value={holding.id}>
                      {holding.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {holdings.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No tienes holdings disponibles. Crea una holding primero.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateHolding} disabled={savingHolding}>
                {savingHolding ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
