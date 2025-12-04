'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Plus, Edit, Trash2, Shield, CheckCircle, XCircle, ArrowLeft, Home, Users as UsersIcon, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';
import logger, { logError } from '@/lib/logger';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  activo: boolean;
  createdAt: string;
  company?: {
    id: string;
    nombre: string;
  };
}

export default function UsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { isAdmin } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; nombre: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'gestor',
    companyId: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'administrador' && userRole !== 'super_admin') {
        router.push('/dashboard');
        toast.error('No tienes permisos para acceder a esta página');
        return;
      }
      fetchUsers();
    }
  }, [status, session, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        toast.error('Error al cargar usuarios');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/admin/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.map((c: any) => ({ id: c.id, nombre: c.nombre })));
      }
    } catch (error) {
      logger.error('Error loading companies:', error);
    }
  };

  useEffect(() => {
    const userRole = (session?.user as any)?.role;
    if (status === 'authenticated' && userRole === 'super_admin') {
      fetchCompanies();
    }
  }, [status, session]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe contener al menos una mayúscula';
    }
    if (!/[a-z]/.test(password)) {
      return 'La contraseña debe contener al menos una minúscula';
    }
    if (!/[0-9]/.test(password)) {
      return 'La contraseña debe contener al menos un número';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'La contraseña debe contener al menos un carácter especial';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validar contraseña si se proporciona
      if (formData.password) {
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          toast.error(passwordError);
          return;
        }
      } else if (!editingUser) {
        toast.error('La contraseña es requerida para crear un usuario');
        return;
      }

      if (editingUser) {
        // Actualizar usuario
        const updateData: any = {
          name: formData.name,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        if (res.ok) {
          toast.success('Usuario actualizado correctamente');
          fetchUsers();
          setShowDialog(false);
          resetForm();
        } else {
          const error = await res.json();
          toast.error(error.error || 'Error al actualizar usuario');
        }
      } else {
        // Crear usuario
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          toast.success('Usuario creado correctamente');
          fetchUsers();
          setShowDialog(false);
          resetForm();
        } else {
          const error = await res.json();
          toast.error(error.error || 'Error al crear usuario');
        }
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al guardar usuario');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Usuario eliminado correctamente');
        fetchUsers();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !user.activo }),
      });

      if (res.ok) {
        toast.success(`Usuario ${!user.activo ? 'activado' : 'desactivado'} correctamente`);
        fetchUsers();
      } else {
        toast.error('Error al cambiar estado del usuario');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role,
      companyId: user.company?.id || '',
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'gestor',
      companyId: '',
    });
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      super_admin: { label: 'Super Admin', variant: 'destructive' },
      administrador: { label: 'Administrador', variant: 'destructive' },
      gestor: { label: 'Gestor', variant: 'default' },
      operador: { label: 'Operador', variant: 'secondary' },
    };
    return badges[role] || badges.gestor;
  };

  const isSuperAdmin = (session?.user as any)?.role === 'super_admin';

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      render: (user: User) => (
        <div className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      ),
    },
    ...(isSuperAdmin ? [{
      key: 'company',
      header: 'Empresa',
      sortable: true,
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{user.company?.nombre || 'Sin empresa'}</span>
        </div>
      ),
    }] : []),
    {
      key: 'role',
      header: 'Rol',
      sortable: true,
      render: (user: User) => {
        const badge = getRoleBadge(user.role);
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          {user.activo ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Activo</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">Inactivo</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Fecha Creación',
      sortable: true,
      render: (user: User) => new Date(user.createdAt).toLocaleDateString('es-ES'),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(user);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(user);
            }}
          >
            {user.activo ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(user.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

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
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
                    <BreadcrumbPage>Usuarios</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
                <p className="text-muted-foreground">Administra los usuarios de tu empresa</p>
              </div>
              <Button size="lg" onClick={() => setShowDialog(true)} className="shadow-md hover:shadow-lg transition-all">
                <Plus className="mr-2 h-5 w-5" />
                Nuevo Usuario
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.activo).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === 'administrador').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>Lista de todos los usuarios de la empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={users}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Actualiza la información del usuario'
                : 'Crea un nuevo usuario para tu empresa'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {!editingUser && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email">Email</Label>
                    <InfoTooltip content="El email será utilizado para iniciar sesión y recibir notificaciones del sistema." />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Nombre completo del usuario"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="password">
                    Contraseña {editingUser && '(dejar vacío para no cambiar)'}
                  </Label>
                  <InfoTooltip content="La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales." />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  minLength={8}
                  placeholder="Mín. 8 caracteres (Aa1!)"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="role">Rol</Label>
                  <InfoTooltip content="Define los permisos del usuario: Super Admin (acceso total), Administrador (gestión de empresa), Gestor (operaciones diarias), Operador (solo lectura)." />
                </div>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && <SelectItem value="super_admin">Super Administrador</SelectItem>}
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isSuperAdmin && !editingUser && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="companyId">Empresa</Label>
                    <InfoTooltip content="Asigna el usuario a una empresa específica. Solo usuarios Super Admin pueden no tener empresa asignada." />
                  </div>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) => setFormData({ ...formData, companyId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empresa (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin empresa (solo para Super Admin)</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    💡 Los usuarios de empresa solo verán los datos de su empresa asignada
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowDialog(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingUser ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
