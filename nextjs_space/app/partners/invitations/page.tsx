'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Plus, CheckCircle, Clock, XCircle, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PartnerInvitationsPage() {
  const router = useRouter();
  const [invitaciones, setInvitaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    telefono: '',
    mensaje: '',
  });

  useEffect(() => {
    fetchInvitaciones();
  }, []);

  const fetchInvitaciones = async () => {
    try {
      const token = localStorage.getItem('partnerToken');
      if (!token) {
        router.push('/partners/login');
        return;
      }

      const response = await fetch('/api/partners/invitations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Error al cargar invitaciones');
      }

      const data = await response.json();
      setInvitaciones(data.invitaciones);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const token = localStorage.getItem('partnerToken');
      const response = await fetch('/api/partners/invitations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar invitación');
      }

      // Resetear formulario y cerrar diálogo
      setFormData({ email: '', nombre: '', telefono: '', mensaje: '' });
      setShowDialog(false);

      // Recargar invitaciones
      await fetchInvitaciones();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-8">Cargando invitaciones...</div>;
  }

  const pendientes = invitaciones.filter((i) => i.estado === 'PENDING').length;
  const aceptadas = invitaciones.filter((i) => i.estado === 'ACCEPTED').length;
  const expiradas = invitaciones.filter((i) => i.estado === 'EXPIRED').length;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Invitaciones</h1>
                <p className="text-gray-600">Gestiona las invitaciones a tus clientes</p>
              </div>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Nueva Invitación
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Enviar Invitación</DialogTitle>
                    <DialogDescription>
                      Invita a un nuevo cliente a unirse a INMOVA a través de tu Partner
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSendInvitation} className="space-y-4 mt-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="cliente@empresa.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Nombre del contacto"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="+34 600 000 000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mensaje">Mensaje Personalizado</Label>
                      <Textarea
                        id="mensaje"
                        value={formData.mensaje}
                        onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                        placeholder="Añade un mensaje personalizado para tu invitación..."
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={sending}>
                      <Send className="h-4 w-4 mr-2" />
                      {sending ? 'Enviando...' : 'Enviar Invitación'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{invitaciones.length}</p>
                    </div>
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Pendientes</p>
                      <p className="text-2xl font-bold text-gray-900">{pendientes}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Aceptadas</p>
                      <p className="text-2xl font-bold text-gray-900">{aceptadas}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Tasa Conversión</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {invitaciones.length > 0
                          ? `${((aceptadas / invitaciones.length) * 100).toFixed(1)}%`
                          : '0%'}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invitaciones List */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Invitaciones</CardTitle>
                <CardDescription>Todas las invitaciones enviadas y su estado</CardDescription>
              </CardHeader>
              <CardContent>
                {invitaciones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Aún no has enviado invitaciones
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invitaciones.map((inv: any) => {
                      let statusIcon;
                      let statusColor;
                      let statusBg;
                      let statusText;

                      if (inv.estado === 'ACCEPTED') {
                        statusIcon = CheckCircle;
                        statusColor = 'text-green-800';
                        statusBg = 'bg-green-100';
                        statusText = 'Aceptada';
                      } else if (inv.estado === 'PENDING') {
                        statusIcon = Clock;
                        statusColor = 'text-yellow-800';
                        statusBg = 'bg-yellow-100';
                        statusText = 'Pendiente';
                      } else if (inv.estado === 'EXPIRED') {
                        statusIcon = XCircle;
                        statusColor = 'text-gray-800';
                        statusBg = 'bg-gray-100';
                        statusText = 'Expirada';
                      } else {
                        statusIcon = XCircle;
                        statusColor = 'text-red-800';
                        statusBg = 'bg-red-100';
                        statusText = 'Cancelada';
                      }

                      const StatusIcon = statusIcon;

                      return (
                        <div key={inv.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Mail className="h-5 w-5 text-gray-400" />
                                <h3 className="font-semibold text-gray-900">{inv.email}</h3>
                              </div>
                              {inv.nombre && (
                                <p className="text-sm text-gray-600 ml-7 mb-1">{inv.nombre}</p>
                              )}
                              <div className="ml-7 space-y-1 text-sm text-gray-500">
                                <p>
                                  Enviada: {new Date(inv.enviadoFecha).toLocaleDateString('es-ES')}
                                </p>
                                <p>
                                  Expira: {new Date(inv.expiraFecha).toLocaleDateString('es-ES')}
                                </p>
                                {inv.aceptadoFecha && (
                                  <p className="text-green-600">
                                    Aceptada:{' '}
                                    {new Date(inv.aceptadoFecha).toLocaleDateString('es-ES')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor} flex items-center space-x-1`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              <span>{statusText}</span>
                            </span>
                          </div>
                          {inv.mensaje && (
                            <div className="mt-3 ml-7 p-3 bg-gray-50 rounded text-sm text-gray-700">
                              {inv.mensaje}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
