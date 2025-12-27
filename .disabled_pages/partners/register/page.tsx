'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Mail,
  Lock,
  User,
  Building,
  Phone,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

const tiposPartner = [
  { value: 'BANCO', label: 'Banco / Entidad Financiera' },
  { value: 'MULTIFAMILY_OFFICE', label: 'Multifamily Office' },
  { value: 'PLATAFORMA_MEMBRESIA', label: 'Plataforma de Membresía' },
  { value: 'ASOCIACION', label: 'Asociación de Propietarios' },
  { value: 'CONSULTORA', label: 'Consultora Inmobiliaria' },
  { value: 'INMOBILIARIA', label: 'Agencia Inmobiliaria' },
  { value: 'OTRO', label: 'Otro' },
];

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    razonSocial: '',
    cif: '',
    tipo: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/partners/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar Partner');
      }

      setSuccess(true);

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/partners/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar Partner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-4 rounded-2xl">
              <Building2 className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conviértete en Partner</h1>
          <p className="text-gray-600">
            Ofrece INMOVA a tus clientes y genera ingresos recurrentes
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Registro exitoso! Tu solicitud está pendiente de aprobación. Te redirigiremos al
                login...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Información de la Empresa */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información de la Empresa</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Comercial *</Label>
                    <Input
                      id="nombre"
                      placeholder="Banco Ejemplo"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="razonSocial">Razón Social *</Label>
                    <Input
                      id="razonSocial"
                      placeholder="Banco Ejemplo S.A."
                      value={formData.razonSocial}
                      onChange={(e) => handleChange('razonSocial', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cif">CIF / NIF *</Label>
                    <Input
                      id="cif"
                      placeholder="A12345678"
                      value={formData.cif}
                      onChange={(e) => handleChange('cif', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Partner *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => handleChange('tipo', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposPartner.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contacto Principal</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactoNombre">Nombre Completo *</Label>
                    <Input
                      id="contactoNombre"
                      placeholder="Juan Pérez"
                      value={formData.contactoNombre}
                      onChange={(e) => handleChange('contactoNombre', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactoTelefono">Teléfono</Label>
                    <Input
                      id="contactoTelefono"
                      type="tel"
                      placeholder="+34 600 000 000"
                      value={formData.contactoTelefono}
                      onChange={(e) => handleChange('contactoTelefono', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactoEmail">Email de Contacto *</Label>
                  <Input
                    id="contactoEmail"
                    type="email"
                    placeholder="juan.perez@empresa.com"
                    value={formData.contactoEmail}
                    onChange={(e) => handleChange('contactoEmail', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Credenciales de Acceso */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Credenciales de Acceso</h3>

                <div className="space-y-2">
                  <Label htmlFor="email">Email de Acceso *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="acceso@empresa.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repite la contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar Partner'}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Al registrarte, aceptas nuestros términos y condiciones del Programa de Partners.
              </p>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/partners/login" className="text-primary font-semibold hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
