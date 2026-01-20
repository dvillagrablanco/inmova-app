'use client';

/**
 * Gestión de Permisos
 * 
 * Control de accesos y permisos por rol
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Shield,
  Users,
  Building2,
  FileText,
  CreditCard,
  Wrench,
  MessageSquare,
  BarChart3,
  Settings,
  Lock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Save,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

// Definición de roles y sus permisos
const ROLES = [
  {
    id: 'super_admin',
    nombre: 'Super Admin',
    description: 'Acceso completo al sistema',
    color: 'bg-red-500',
    icon: Shield,
    editable: false,
  },
  {
    id: 'administrador',
    nombre: 'Administrador',
    description: 'Acceso completo a la empresa',
    color: 'bg-purple-500',
    icon: Users,
    editable: true,
  },
  {
    id: 'gestor',
    nombre: 'Gestor',
    description: 'Gestión de propiedades e inquilinos',
    color: 'bg-blue-500',
    icon: Building2,
    editable: true,
  },
  {
    id: 'operador',
    nombre: 'Operador',
    description: 'Acceso limitado de solo lectura',
    color: 'bg-green-500',
    icon: Eye,
    editable: true,
  },
];

// Módulos y sus permisos
const MODULES = [
  {
    id: 'propiedades',
    nombre: 'Propiedades',
    icon: Building2,
    permisos: ['ver', 'crear', 'editar', 'eliminar'],
  },
  {
    id: 'inquilinos',
    nombre: 'Inquilinos',
    icon: Users,
    permisos: ['ver', 'crear', 'editar', 'eliminar'],
  },
  {
    id: 'contratos',
    nombre: 'Contratos',
    icon: FileText,
    permisos: ['ver', 'crear', 'editar', 'eliminar', 'firmar'],
  },
  {
    id: 'pagos',
    nombre: 'Pagos',
    icon: CreditCard,
    permisos: ['ver', 'crear', 'editar', 'eliminar', 'confirmar'],
  },
  {
    id: 'mantenimiento',
    nombre: 'Mantenimiento',
    icon: Wrench,
    permisos: ['ver', 'crear', 'editar', 'eliminar', 'asignar'],
  },
  {
    id: 'comunicaciones',
    nombre: 'Comunicaciones',
    icon: MessageSquare,
    permisos: ['ver', 'enviar', 'eliminar'],
  },
  {
    id: 'reportes',
    nombre: 'Reportes',
    icon: BarChart3,
    permisos: ['ver', 'exportar'],
  },
  {
    id: 'configuracion',
    nombre: 'Configuración',
    icon: Settings,
    permisos: ['ver', 'editar'],
  },
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    icon: Users,
    permisos: ['ver', 'crear', 'editar', 'eliminar', 'permisos'],
  },
];

// Permisos por defecto para cada rol
const DEFAULT_PERMISSIONS: Record<string, Record<string, string[]>> = {
  super_admin: Object.fromEntries(MODULES.map(m => [m.id, m.permisos])),
  administrador: {
    propiedades: ['ver', 'crear', 'editar', 'eliminar'],
    inquilinos: ['ver', 'crear', 'editar', 'eliminar'],
    contratos: ['ver', 'crear', 'editar', 'eliminar', 'firmar'],
    pagos: ['ver', 'crear', 'editar', 'eliminar', 'confirmar'],
    mantenimiento: ['ver', 'crear', 'editar', 'eliminar', 'asignar'],
    comunicaciones: ['ver', 'enviar', 'eliminar'],
    reportes: ['ver', 'exportar'],
    configuracion: ['ver', 'editar'],
    usuarios: ['ver', 'crear', 'editar', 'eliminar', 'permisos'],
  },
  gestor: {
    propiedades: ['ver', 'crear', 'editar'],
    inquilinos: ['ver', 'crear', 'editar'],
    contratos: ['ver', 'crear', 'editar'],
    pagos: ['ver', 'crear', 'editar', 'confirmar'],
    mantenimiento: ['ver', 'crear', 'editar', 'asignar'],
    comunicaciones: ['ver', 'enviar'],
    reportes: ['ver'],
    configuracion: [],
    usuarios: [],
  },
  operador: {
    propiedades: ['ver'],
    inquilinos: ['ver'],
    contratos: ['ver'],
    pagos: ['ver'],
    mantenimiento: ['ver'],
    comunicaciones: ['ver'],
    reportes: ['ver'],
    configuracion: [],
    usuarios: [],
  },
};

const PERMISSION_ICONS: Record<string, typeof Eye> = {
  ver: Eye,
  crear: Plus,
  editar: Edit,
  eliminar: Trash2,
  firmar: FileText,
  confirmar: CreditCard,
  asignar: Users,
  enviar: MessageSquare,
  exportar: BarChart3,
  permisos: Shield,
};

const PERMISSION_LABELS: Record<string, string> = {
  ver: 'Ver',
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
  firmar: 'Firmar',
  confirmar: 'Confirmar',
  asignar: 'Asignar',
  enviar: 'Enviar',
  exportar: 'Exportar',
  permisos: 'Gestionar permisos',
};

export default function PermisosPage() {
  const [selectedRole, setSelectedRole] = useState('administrador');
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentRole = ROLES.find(r => r.id === selectedRole)!;
  const currentPermissions = permissions[selectedRole] || {};

  const handlePermissionChange = (moduleId: string, permission: string, checked: boolean) => {
    if (!currentRole.editable) return;

    const newPermissions = { ...permissions };
    const modulePermissions = [...(currentPermissions[moduleId] || [])];
    
    if (checked) {
      modulePermissions.push(permission);
    } else {
      const index = modulePermissions.indexOf(permission);
      if (index > -1) modulePermissions.splice(index, 1);
    }

    newPermissions[selectedRole] = {
      ...currentPermissions,
      [moduleId]: modulePermissions,
    };

    setPermissions(newPermissions);
    setHasChanges(true);
  };

  const handleSelectAllModule = (moduleId: string, allPermisos: string[]) => {
    if (!currentRole.editable) return;

    const modulePermissions = currentPermissions[moduleId] || [];
    const allSelected = allPermisos.every(p => modulePermissions.includes(p));

    const newPermissions = { ...permissions };
    newPermissions[selectedRole] = {
      ...currentPermissions,
      [moduleId]: allSelected ? [] : [...allPermisos],
    };

    setPermissions(newPermissions);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // En producción, esto guardaría en la base de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Permisos guardados correctamente');
      setHasChanges(false);
    } catch (error) {
      toast.error('Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPermissions(DEFAULT_PERMISSIONS);
    setHasChanges(false);
    toast.info('Permisos restaurados a valores por defecto');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Permisos</h1>
          <p className="text-muted-foreground">
            Control de accesos y permisos por rol
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Restaurar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Role Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Selecciona un Rol</CardTitle>
          <CardDescription>
            Configura los permisos para cada rol del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedRole === role.id
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${role.color} flex items-center justify-center mb-3`}>
                  <role.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold">{role.nombre}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {role.description}
                </p>
                {!role.editable && (
                  <Badge variant="secondary" className="mt-2">
                    <Lock className="h-3 w-3 mr-1" />
                    No editable
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentRole.icon className={`h-5 w-5`} />
            Permisos de {currentRole.nombre}
          </CardTitle>
          <CardDescription>
            {currentRole.editable
              ? 'Marca los permisos que deseas asignar a este rol'
              : 'Este rol tiene permisos de sistema que no pueden modificarse'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={MODULES.map(m => m.id)}>
            {MODULES.map((module) => {
              const modulePerms = currentPermissions[module.id] || [];
              const allSelected = module.permisos.every(p => modulePerms.includes(p));
              const someSelected = module.permisos.some(p => modulePerms.includes(p)) && !allSelected;
              
              return (
                <AccordionItem key={module.id} value={module.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <module.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{module.nombre}</span>
                      <Badge variant="outline" className="ml-2">
                        {modulePerms.length}/{module.permisos.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {/* Select All */}
                      <div className="flex items-center space-x-2 pb-2 border-b">
                        <Checkbox
                          id={`${module.id}-all`}
                          checked={allSelected}
                          disabled={!currentRole.editable}
                          onCheckedChange={() => handleSelectAllModule(module.id, module.permisos)}
                          className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                        />
                        <Label
                          htmlFor={`${module.id}-all`}
                          className="font-medium cursor-pointer"
                        >
                          Seleccionar todos
                        </Label>
                      </div>

                      {/* Individual Permissions */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {module.permisos.map((permiso) => {
                          const Icon = PERMISSION_ICONS[permiso] || Eye;
                          const isChecked = modulePerms.includes(permiso);
                          
                          return (
                            <div key={permiso} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${module.id}-${permiso}`}
                                checked={isChecked}
                                disabled={!currentRole.editable}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(module.id, permiso, checked as boolean)
                                }
                              />
                              <Label
                                htmlFor={`${module.id}-${permiso}`}
                                className="flex items-center gap-1.5 cursor-pointer text-sm"
                              >
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                {PERMISSION_LABELS[permiso]}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Sobre los permisos</h3>
              <p className="text-sm text-muted-foreground">
                Los permisos controlan qué acciones puede realizar cada usuario según su rol.
                Los cambios en los permisos afectarán a todos los usuarios con el rol seleccionado.
                El rol Super Admin tiene todos los permisos del sistema y no puede modificarse.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
