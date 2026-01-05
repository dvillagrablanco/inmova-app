'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { HardHat, Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EwoorkerRegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Datos empresa
    nombreEmpresa: '',
    cif: '',
    tipoEmpresa: '',
    // Contacto
    email: '',
    telefono: '',
    // Usuario
    nombreContacto: '',
    password: '',
    confirmPassword: '',
    // Legal
    aceptaTerminos: false,
    aceptaPrivacidad: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (!formData.aceptaTerminos || !formData.aceptaPrivacidad) {
      toast.error('Debes aceptar los términos y condiciones');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ewoorker/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error en el registro');
      }

      toast.success('¡Registro exitoso! Te hemos enviado un email de confirmación.');
      router.push('/login?registered=ewoorker');
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/ewoorker/landing" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a eWoorker
          </Link>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <HardHat className="w-10 h-10 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Registro en eWoorker</h1>
          </div>
          <p className="text-gray-600">
            Únete al marketplace B2B de subcontratación en construcción
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <div className={`w-12 h-1 ${step >= 2 ? 'bg-orange-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <div className={`w-12 h-1 ${step >= 3 ? 'bg-orange-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Datos de la empresa'}
              {step === 2 && 'Datos de contacto'}
              {step === 3 && 'Crear cuenta'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Información básica de tu empresa'}
              {step === 2 && 'Cómo podemos contactarte'}
              {step === 3 && 'Configura tu acceso a la plataforma'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nombreEmpresa">Nombre de la empresa *</Label>
                      <Input
                        id="nombreEmpresa"
                        value={formData.nombreEmpresa}
                        onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
                        placeholder="Construcciones Ejemplo S.L."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cif">CIF *</Label>
                      <Input
                        id="cif"
                        value={formData.cif}
                        onChange={(e) => setFormData({ ...formData, cif: e.target.value.toUpperCase() })}
                        placeholder="B12345678"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipoEmpresa">Tipo de empresa *</Label>
                      <Select
                        value={formData.tipoEmpresa}
                        onValueChange={(value) => setFormData({ ...formData, tipoEmpresa: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONSTRUCTORA">Constructora</SelectItem>
                          <SelectItem value="SUBCONTRATISTA">Subcontratista</SelectItem>
                          <SelectItem value="PROMOTORA">Promotora</SelectItem>
                          <SelectItem value="AUTONOMO">Autónomo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={!formData.nombreEmpresa || !formData.cif || !formData.tipoEmpresa}
                  >
                    Continuar
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email corporativo *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contacto@empresa.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <Input
                        id="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="+34 600 000 000"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="nombreContacto">Nombre del responsable *</Label>
                      <Input
                        id="nombreContacto"
                        value={formData.nombreContacto}
                        onChange={(e) => setFormData({ ...formData, nombreContacto: e.target.value })}
                        placeholder="Juan García"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Atrás
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      disabled={!formData.email || !formData.telefono || !formData.nombreContacto}
                    >
                      Continuar
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="password">Contraseña *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Mínimo 8 caracteres"
                        minLength={8}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Repite la contraseña"
                        required
                      />
                    </div>
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="terminos"
                          checked={formData.aceptaTerminos}
                          onCheckedChange={(checked) => setFormData({ ...formData, aceptaTerminos: checked as boolean })}
                        />
                        <Label htmlFor="terminos" className="text-sm text-gray-600 leading-tight">
                          Acepto los <Link href="/legal/terminos" className="text-orange-600 hover:underline">Términos y Condiciones</Link> de eWoorker
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="privacidad"
                          checked={formData.aceptaPrivacidad}
                          onCheckedChange={(checked) => setFormData({ ...formData, aceptaPrivacidad: checked as boolean })}
                        />
                        <Label htmlFor="privacidad" className="text-sm text-gray-600 leading-tight">
                          He leído y acepto la <Link href="/legal/privacidad" className="text-orange-600 hover:underline">Política de Privacidad</Link>
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                      Atrás
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      disabled={loading || !formData.password || !formData.aceptaTerminos || !formData.aceptaPrivacidad}
                    >
                      {loading ? 'Registrando...' : 'Crear cuenta'}
                    </Button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-orange-600 hover:underline font-medium">
                Inicia sesión
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <span className="text-sm text-gray-700">Cumplimiento Ley 32/2006</span>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <span className="text-sm text-gray-700">Pagos seguros con escrow</span>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <span className="text-sm text-gray-700">+2,500 empresas activas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
