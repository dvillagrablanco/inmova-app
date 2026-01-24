'use client';

/**
 * Crear Nuevo Usuario
 * 
 * Formulario para crear nuevos usuarios del sistema
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  UserPlus,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Shield,
  Building2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

// AI Components - Dynamic imports for client-side only
const FormAIAssistant = dynamic(
  () => import('@/components/ai/FormAIAssistant').then(mod => ({ default: mod.FormAIAssistant })),
  { ssr: false }
);

const ROLES = [
  { id: 'administrador', nombre: 'Administrador', description: 'Acceso completo a la empresa' },
  { id: 'gestor', nombre: 'Gestor', description: 'Gestión de propiedades e inquilinos' },
  { id: 'operador', nombre: 'Operador', description: 'Acceso limitado de solo lectura' },
];

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'gestor',
    sendInvitation: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        if (error.details) {
          const fieldErrors: Record<string, string> = {};
          error.details.forEach((err: { field: string; message: string }) => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
          throw new Error('Datos inválidos');
        }
        
        throw new Error(error.error || 'Error al crear usuario');
      }

      toast.success('Usuario creado correctamente');
      
      if (formData.sendInvitation) {
        toast.info('Se ha enviado una invitación por email');
      }

      router.push('/usuarios');
    } catch (error: any) {
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password, confirmPassword: password });
    setShowPassword(true);
  };

  // AI Form Assistant handler
  const handleAISuggestions = (suggestions: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      ...suggestions,
    }));
  };

  // Form fields definition for AI Assistant
  const formFields = [
    { name: 'name', label: 'Nombre Completo', type: 'text' as const, required: true },
    { name: 'email', label: 'Email', type: 'email' as const, required: true },
    { name: 'role', label: 'Rol', type: 'select' as const, options: ROLES.map(r => ({ value: r.id, label: r.nombre })) },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nuevo Usuario</h1>
            <p className="text-muted-foreground">
              Crea una nueva cuenta de usuario
            </p>
          </div>
        </div>
        <FormAIAssistant
          formContext="usuario"
          fields={formFields}
          currentValues={formData}
          onSuggestionsApply={handleAISuggestions}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Básica
              </CardTitle>
              <CardDescription>
                Datos personales del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  placeholder="Ej: Juan García"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="usuario@empresa.com"
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contraseña */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Contraseña
              </CardTitle>
              <CardDescription>
                Establece la contraseña inicial del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={generatePassword}
                  >
                    Generar contraseña
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    placeholder="Mínimo 8 caracteres"
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    }}
                    placeholder="Repite la contraseña"
                    className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rol y Permisos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rol y Permisos
              </CardTitle>
              <CardDescription>
                Define el nivel de acceso del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rol *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex flex-col">
                          <span>{role.nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="font-medium text-sm">Permisos del rol seleccionado:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {formData.role === 'administrador' && (
                    <>
                      <li>✓ Gestión completa de usuarios</li>
                      <li>✓ Configuración de la empresa</li>
                      <li>✓ Acceso a todos los módulos</li>
                      <li>✓ Reportes y analíticas</li>
                    </>
                  )}
                  {formData.role === 'gestor' && (
                    <>
                      <li>✓ Gestión de propiedades e inquilinos</li>
                      <li>✓ Contratos y pagos</li>
                      <li>✓ Mantenimiento</li>
                      <li>✗ Configuración de empresa</li>
                    </>
                  )}
                  {formData.role === 'operador' && (
                    <>
                      <li>✓ Ver propiedades e inquilinos</li>
                      <li>✓ Ver contratos y pagos</li>
                      <li>✗ Crear o modificar datos</li>
                      <li>✗ Configuración</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Opciones */}
          <Card>
            <CardHeader>
              <CardTitle>Opciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enviar invitación por email</Label>
                  <p className="text-sm text-muted-foreground">
                    El usuario recibirá un email con instrucciones de acceso
                  </p>
                </div>
                <Switch
                  checked={formData.sendInvitation}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sendInvitation: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <UserPlus className="h-4 w-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
