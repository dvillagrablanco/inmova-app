'use client';

/**
 * Página de Sistema de Referidos eWoorker
 *
 * Sprint 3: Invitar empresas y ganar recompensas
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Gift,
  Copy,
  Share2,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  ArrowLeft,
} from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  registeredReferrals: number;
  verifiedReferrals: number;
  totalPointsEarned: number;
  referralCodes: {
    code: string;
    status: string;
    referredEmail?: string;
    createdAt: Date;
    usedAt?: Date;
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pendiente',
    color: 'bg-gray-100 text-gray-800',
    icon: <Clock className="h-4 w-4" />,
  },
  registered: {
    label: 'Registrado',
    color: 'bg-blue-100 text-blue-800',
    icon: <Users className="h-4 w-4" />,
  },
  verified: {
    label: 'Verificado',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  expired: {
    label: 'Expirado',
    color: 'bg-red-100 text-red-800',
    icon: <XCircle className="h-4 w-4" />,
  },
};

export default function ReferidosPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/ewoorker/referrals');
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setStats(data.stats);
    } catch {
      toast.error('Error cargando estadísticas de referidos');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/ewoorker/referrals', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setGeneratedCode(data.code);
        toast.success('Código generado correctamente');
        fetchStats();
      } else {
        toast.error(data.error || 'Error generando código');
      }
    } catch {
      toast.error('Error generando código');
    } finally {
      setGenerating(false);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail) {
      toast.error('Introduce un email válido');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/ewoorker/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, message: inviteMessage }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Invitación enviada correctamente');
        setDialogOpen(false);
        setInviteEmail('');
        setInviteMessage('');
        fetchStats();
      } else {
        toast.error(data.error || 'Error enviando invitación');
      }
    } catch {
      toast.error('Error enviando invitación');
    } finally {
      setSending(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
  };

  const shareCode = (code: string) => {
    const url = `${window.location.origin}/ewoorker/registro?ref=${code}`;
    const text = `¡Únete a eWoorker con mi código ${code} y obtén 20% descuento en verificación!`;

    if (navigator.share) {
      navigator.share({ title: 'Únete a eWoorker', text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Gift className="h-10 w-10 text-amber-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sistema de Referidos</h1>
              <p className="text-gray-600">Invita empresas y gana recompensas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{stats?.totalReferrals || 0}</div>
            <p className="text-sm text-gray-500">Total enviados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {stats?.registeredReferrals || 0}
            </div>
            <p className="text-sm text-gray-500">Registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats?.verifiedReferrals || 0}</div>
            <p className="text-sm text-gray-500">Verificados</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6" />
              <span className="text-2xl font-bold">
                {stats?.totalPointsEarned?.toLocaleString() || 0}
              </span>
            </div>
            <p className="text-sm opacity-80">Puntos ganados</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Invitar Empresa</CardTitle>
          <CardDescription>
            Gana 500 puntos cuando tu referido se verifique, más 10% descuento en tu próxima factura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={generateCode} disabled={generating}>
              <Copy className="h-4 w-4 mr-2" />
              {generating ? 'Generando...' : 'Generar Código'}
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Invitación por Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar Invitación</DialogTitle>
                  <DialogDescription>
                    Enviaremos un email con tu código de referido
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="email">Email de la empresa</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="empresa@ejemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Mensaje personalizado (opcional)</Label>
                    <Textarea
                      id="message"
                      placeholder="¡Hola! Te invito a unirte a eWoorker..."
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={sendInvitation} disabled={sending} className="w-full">
                    {sending ? 'Enviando...' : 'Enviar Invitación'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {generatedCode && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 mb-2">Tu nuevo código de referido:</p>
              <div className="flex items-center gap-2">
                <code className="text-2xl font-bold tracking-wider text-amber-900 bg-white px-4 py-2 rounded">
                  {generatedCode}
                </code>
                <Button variant="ghost" size="icon" onClick={() => copyCode(generatedCode)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => shareCode(generatedCode)}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de referidos */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Códigos de Referido</CardTitle>
          <CardDescription>Historial de códigos generados</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.referralCodes && stats.referralCodes.length > 0 ? (
            <div className="space-y-3">
              {stats.referralCodes.map((referral) => {
                const statusConfig = STATUS_CONFIG[referral.status] || STATUS_CONFIG.pending;
                return (
                  <div
                    key={referral.code}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <code className="font-mono font-bold text-lg">{referral.code}</code>
                      <Badge className={statusConfig.color}>
                        {statusConfig.icon}
                        <span className="ml-1">{statusConfig.label}</span>
                      </Badge>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {referral.referredEmail && (
                        <p className="font-medium text-gray-700">{referral.referredEmail}</p>
                      )}
                      <p>
                        Creado:{' '}
                        {new Date(referral.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No has generado ningún código aún</p>
              <p className="text-sm">Genera un código para empezar a referir empresas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información de recompensas */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recompensas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">🎁 Para ti (quien refiere)</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• 500 puntos cuando tu referido se verifique</li>
                <li>• 10% descuento en tu próxima factura</li>
                <li>• Progreso hacia logro "Constructor de Red"</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🎁 Para el referido</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• 200 puntos de bonificación al registrarse</li>
                <li>• 20% descuento en verificación exprés</li>
                <li>• Acceso prioritario a soporte</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
