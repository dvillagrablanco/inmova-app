'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ nombreCompleto: '', email: '', telefono: '', password: '', confirmPassword: '', companyCode: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Las contraseñas no coinciden'); return; }
    if (form.password.length < 8) { toast.error('Mínimo 8 caracteres'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth-propietario/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err: any) { toast.error(err.message || 'Error en el registro'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">¡Cuenta creada!</h2>
            <p className="text-gray-600 mb-6">Revisa tu email para verificar tu cuenta.</p>
            <Link href="/auth-propietario/login"><Button>Ir al Login</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Portal Propietario</CardTitle>
          <CardDescription>Crea tu cuenta para acceder al portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Nombre completo *</Label><Input required value={form.nombreCompleto} onChange={e => setForm({...form, nombreCompleto: e.target.value})} /></div>
            <div><Label>Email *</Label><Input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} /></div>
            <div><Label>Código empresa (CIF o nombre)</Label><Input placeholder="Opcional" value={form.companyCode} onChange={e => setForm({...form, companyCode: e.target.value})} /></div>
            <div><Label>Contraseña * (mín. 8 caracteres)</Label><Input type="password" required minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
            <div><Label>Confirmar contraseña *</Label><Input type="password" required value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} /></div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Registrando...</> : <><UserPlus className="h-4 w-4 mr-2" /> Crear Cuenta</>}
            </Button>
            <p className="text-center text-sm text-gray-500">
              ¿Ya tienes cuenta? <Link href="/auth-propietario/login" className="text-blue-600 hover:underline">Inicia sesión</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
