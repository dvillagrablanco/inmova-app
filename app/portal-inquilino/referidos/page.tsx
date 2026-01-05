'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Gift,
  Copy,
  Share2,
  Mail,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  Sparkles,
  Send,
  Link,
  Trophy,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  verifiedReferrals: number;
  expiredReferrals: number;
  totalPointsEarned: number;
}

interface ReferralInvitation {
  code: string;
  referredEmail: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  verifiedAt?: string;
}

interface ReferralConfig {
  referrerRewardPoints: number;
  referredRewardPoints: number;
  verifiedBonusPoints: number;
  maxActiveReferrals: number;
  codeExpiryDays: number;
}

interface ReferralData {
  code: string;
  shareUrl: string;
  stats: ReferralStats;
  invitations: ReferralInvitation[];
  config: ReferralConfig;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  registered: { label: 'Registrado', color: 'bg-blue-100 text-blue-800', icon: Users },
  verified: { label: 'Verificado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  expired: { label: 'Expirado', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

export default function ReferidosPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portal-inquilino/referidos');
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error cargando datos de referidos');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (data?.code) {
      navigator.clipboard.writeText(data.code);
      toast.success('¡Código copiado!');
    }
  };

  const copyLink = () => {
    if (data?.shareUrl) {
      navigator.clipboard.writeText(data.shareUrl);
      toast.success('¡Enlace copiado!');
    }
  };

  const shareNative = async () => {
    if (!data?.shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '¡Únete a mi comunidad!',
          text: '¡Regístrate como inquilino y ambos ganaremos puntos!',
          url: data.shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      copyLink();
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail) {
      toast.error('Introduce un email válido');
      return;
    }

    try {
      setSending(true);
      const res = await fetch('/api/portal-inquilino/referidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(result.message);
      setInviteDialogOpen(false);
      setInviteEmail('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error enviando invitación');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error cargando datos de referidos</p>
            <Button onClick={fetchData} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8 text-pink-500" />
            Programa de Referidos
          </h1>
          <p className="text-muted-foreground mt-1">¡Invita amigos y gana puntos increíbles!</p>
        </div>
      </div>

      {/* Hero Card - Código de Referido */}
      <Card className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 text-white overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Tu Código de Referido</h2>
              <p className="text-white/80 max-w-md">
                Comparte tu código y gana {data.config.referrerRewardPoints} puntos cuando tu amigo
                se registre. ¡Además, tu amigo recibe {data.config.referredRewardPoints} puntos de
                bienvenida!
              </p>

              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-4">
                  <p className="text-3xl font-mono font-bold tracking-wider">{data.code}</p>
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-white/20 hover:bg-white/30"
                  onClick={copyCode}
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={copyLink} className="bg-white text-purple-600 hover:bg-white/90">
                  <Link className="h-4 w-4 mr-2" />
                  Copiar Enlace
                </Button>
                <Button
                  onClick={shareNative}
                  variant="outline"
                  className="border-white/30 hover:bg-white/10"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </Button>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-white/30 hover:bg-white/10">
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar por Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enviar Invitación</DialogTitle>
                      <DialogDescription>
                        Introduce el email de tu amigo para enviarle una invitación personalizada.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email del invitado</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="amigo@ejemplo.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={sendInvite} disabled={sending}>
                        {sending ? (
                          'Enviando...'
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Invitación
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
                  <p className="text-4xl font-bold">{data.stats.totalPointsEarned}</p>
                  <p className="text-white/80">Puntos Ganados</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.totalReferrals}</p>
                <p className="text-xs text-muted-foreground">Total Invitados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.pendingReferrals}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.verifiedReferrals}</p>
                <p className="text-xs text-muted-foreground">Verificados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-pink-100 text-pink-600 p-2 rounded-lg">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.totalPointsEarned}</p>
                <p className="text-xs text-muted-foreground">Puntos Ganados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            ¿Cómo Funciona?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">1. Comparte tu Código</h3>
              <p className="text-sm text-muted-foreground">
                Envía tu código único a amigos que busquen alquilar
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">2. Se Registran</h3>
              <p className="text-sm text-muted-foreground">
                Cuando usen tu código al registrarse, ambos ganáis puntos
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">3. ¡Bonus Extra!</h3>
              <p className="text-sm text-muted-foreground">
                Cuando paguen su primer mes, recibes +{data.config.verifiedBonusPoints} puntos extra
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tú ganas</p>
                <p className="text-2xl font-bold text-purple-600">
                  +{data.config.referrerRewardPoints} pts
                </p>
              </div>
              <ArrowRight className="h-6 w-6 text-purple-300" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tu amigo gana</p>
                <p className="text-2xl font-bold text-pink-600">
                  +{data.config.referredRewardPoints} pts
                </p>
              </div>
              <ArrowRight className="h-6 w-6 text-purple-300" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Bonus verificación</p>
                <p className="text-2xl font-bold text-green-600">
                  +{data.config.verifiedBonusPoints} pts
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Invitaciones Enviadas
          </CardTitle>
          <CardDescription>
            Tienes {data.invitations.filter((i) => i.status === 'pending').length} invitaciones
            pendientes de {data.config.maxActiveReferrals} máximo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.invitations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">Sin invitaciones</h3>
              <p className="text-muted-foreground mt-1">¡Empieza a invitar amigos y gana puntos!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.invitations.map((invitation, index) => {
                const statusInfo = statusConfig[invitation.status as keyof typeof statusConfig];
                const StatusIcon = statusInfo?.icon || Clock;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-100 text-purple-600 p-2 rounded-full">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {invitation.referredEmail || 'Sin email asignado'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Código: {invitation.code} •{' '}
                          {new Date(invitation.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusInfo?.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo?.label || invitation.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
