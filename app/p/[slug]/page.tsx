'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle2, Loader2, Send, Shield, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

interface PartnerBranding {
  nombre: string;
  logo?: string;
  colores?: { primary?: string; secondary?: string };
  descripcion?: string;
}

export default function PartnerLandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [branding, setBranding] = useState<PartnerBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', empresa: '', mensaje: '' });

  useEffect(() => {
    fetch(`/api/partners/branding?slug=${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setBranding(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.email) { toast.error('Nombre y email requeridos'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/partners/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, partnerCode: slug }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setSubmitted(true);
    } catch (err: any) { toast.error(err.message || 'Error'); }
    finally { setSubmitting(false); }
  };

  const primaryColor = branding?.colores?.primary || '#4f46e5';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  if (!branding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md"><CardContent className="pt-8 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Partner no encontrado</h2>
          <p className="text-gray-500">El enlace no es válido.</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header co-branded */}
      <header className="py-6 px-4" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.logo ? (
              <img src={branding.logo} alt={branding.nombre} className="h-10 max-w-[160px] object-contain" />
            ) : (
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            )}
            <span className="text-white font-bold text-lg">{branding.nombre}</span>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">Partner Verificado</Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Value proposition */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión inmobiliaria profesional con {branding.nombre}
            </h1>
            <p className="text-gray-600 text-lg">
              {branding.descripcion || 'Accede a la plataforma líder en gestión inmobiliaria a través de tu asesor de confianza.'}
            </p>

            <div className="space-y-4">
              {[
                { icon: Building2, text: 'Gestión completa de propiedades y contratos' },
                { icon: TrendingUp, text: 'Dashboard financiero con P&L y cash-flow' },
                { icon: Shield, text: 'Seguros, certificaciones y cumplimiento legal' },
                { icon: Users, text: 'Portal para inquilinos y propietarios' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor + '15' }}>
                    <item.icon className="h-4 w-4" style={{ color: primaryColor }} />
                  </div>
                  <span className="text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Contact form */}
          {submitted ? (
            <Card className="border-green-200 bg-green-50/50 h-fit">
              <CardContent className="pt-8 pb-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">¡Solicitud enviada!</h3>
                <p className="text-gray-600">{branding.nombre} se pondrá en contacto contigo pronto.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Solicita información</CardTitle>
                <CardDescription>Te contactaremos a través de {branding.nombre}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><Label>Nombre *</Label><Input required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
                  <div><Label>Email *</Label><Input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                  <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} /></div>
                  <div><Label>Empresa</Label><Input value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} /></div>
                  <div><Label>Mensaje</Label><Textarea rows={3} value={form.mensaje} onChange={e => setForm({...form, mensaje: e.target.value})} placeholder="¿En qué podemos ayudarte?" /></div>
                  <Button type="submit" className="w-full" disabled={submitting} style={{ backgroundColor: primaryColor }}>
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : <><Send className="h-4 w-4 mr-2" /> Enviar solicitud</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 border-t mt-12">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-400">
          Powered by <span className="font-semibold">INMOVA</span> · Plataforma de gestión inmobiliaria
        </div>
      </footer>
    </div>
  );
}
