'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, MapPin, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    mensaje: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tipo: 'landing',
          paginaOrigen: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el mensaje');
      }

      toast.success('Mensaje enviado correctamente', {
        description: 'Nos pondremos en contacto contigo en menos de 24 horas.',
      });

      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        empresa: '',
        mensaje: '',
      });
    } catch (error) {
      toast.error('Error al enviar el mensaje', {
        description: error instanceof Error ? error.message : 'Por favor, inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                INMOVA
              </span>
            </Link>
            <div className="flex gap-4">
              <Link href="/landing">
                <Button variant="ghost">Inicio</Button>
              </Link>
              <Link href="/login">
                <Button>Iniciar Sesión</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white text-gray-900 border-2 border-indigo-400 px-4 py-2 font-bold shadow-sm">
              <Mail className="h-4 w-4 mr-1 inline text-indigo-600" />
              Contacto
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                Hablemos
              </span>{' '}
              de tu Proyecto
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Nuestro equipo de expertos está listo para ayudarte a transformar tu negocio
              inmobiliario
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT FORM & INFO */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            {/* FORMULARIO */}
            <div className="md:col-span-2">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-2xl">Envíanos un Mensaje</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nombre">Nombre Completo *</Label>
                        <Input
                          id="nombre"
                          required
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          placeholder="Juan Pérez"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="juan@empresa.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          type="tel"
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          placeholder="+34 600 000 000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="empresa">Empresa</Label>
                        <Input
                          id="empresa"
                          value={formData.empresa}
                          onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                          placeholder="Mi Inmobiliaria SL"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mensaje">Mensaje *</Label>
                      <Textarea
                        id="mensaje"
                        required
                        value={formData.mensaje}
                        onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                        placeholder="Cuéntanos sobre tu proyecto o necesidades..."
                        rows={6}
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                      disabled={loading}
                    >
                      {loading ? (
                        'Enviando...'
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Enviar Mensaje
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* INFO DE CONTACTO */}
            <div className="space-y-6">
              <Card className="border-2 border-indigo-200">
                <CardHeader>
                  <CardTitle>Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Mail className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold">Email</div>
                      <a
                        href="mailto:inmovaapp@gmail.com"
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        inmovaapp@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Phone className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold">Teléfono</div>
                      <a
                        href="tel:+34900000000"
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        +34 900 000 000
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold">Dirección</div>
                      <p className="text-sm text-gray-600">Madrid, España</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-violet-200 bg-gradient-to-br from-indigo-50 to-violet-50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">Respuesta Rápida</h3>
                  <p className="text-sm text-gray-700">
                    Respondemos a todas las consultas en menos de 24 horas. Para solicitudes
                    urgentes, llámanos directamente.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">¿Prefieres una Demo en Vivo?</h2>
          <p className="text-gray-600 mb-6">
            Agenda una demostración personalizada de 30 minutos con nuestro equipo
          </p>
          <Link href="/register">
            <Button size="lg">Agendar Demo</Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">
            &copy; 2026 INMOVA. Powered by Enxames Investments SL. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
