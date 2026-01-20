'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Users, 
  Gift, 
  Copy,
  Share2,
  DollarSign,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Clock,
  Link as LinkIcon
} from 'lucide-react';

interface Referral {
  id: string;
  codigo: string;
  referidoEmail: string;
  referidoNombre?: string;
  estado: 'pendiente' | 'registrado' | 'activo' | 'recompensado';
  recompensa?: number;
  createdAt: string;
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('INMOVA-REF-' + Math.random().toString(36).substring(2, 8).toUpperCase());

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/referrals');
      if (response.ok) {
        const data = await response.json();
        setReferrals(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Código copiado al portapapeles');
  };

  const copyLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Enlace copiado al portapapeles');
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Únete a Inmova',
          text: `Usa mi código de referido ${referralCode} y obtén beneficios especiales`,
          url: `${window.location.origin}/register?ref=${referralCode}`,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      copyLink();
    }
  };

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.estado === 'activo' || r.estado === 'recompensado').length;
  const pendingReferrals = referrals.filter(r => r.estado === 'pendiente' || r.estado === 'registrado').length;
  const totalRewards = referrals.filter(r => r.estado === 'recompensado').reduce((sum, r) => sum + (r.recompensa || 0), 0);

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'registrado': return 'bg-blue-100 text-blue-800';
      case 'activo': return 'bg-green-100 text-green-800';
      case 'recompensado': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-40 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programa de Referidos</h1>
          <p className="text-gray-600 mt-1">Invita amigos y gana recompensas</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReferrals}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Referral Card */}
      <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tu código de referido</h2>
              <p className="text-blue-100 mb-4">
                Comparte este código y gana €50 por cada nuevo cliente que se registre
              </p>
              <div className="flex items-center gap-2">
                <code className="bg-white/20 px-4 py-2 rounded-lg text-xl font-mono">
                  {referralCode}
                </code>
                <Button variant="secondary" size="sm" onClick={copyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={copyLink}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Copiar Enlace
              </Button>
              <Button variant="secondary" onClick={shareReferral}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Referidos</p>
                <p className="text-2xl font-bold">{totalReferrals}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Activos</p>
                <p className="text-2xl font-bold text-green-600">{activeReferrals}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingReferrals}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ganado</p>
                <p className="text-2xl font-bold text-purple-600">€{totalRewards}</p>
              </div>
              <Gift className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">1. Comparte tu código</h3>
              <p className="text-sm text-gray-600">
                Comparte tu código único con amigos y colegas del sector inmobiliario
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">2. Se registran</h3>
              <p className="text-sm text-gray-600">
                Cuando usen tu código al registrarse, quedarán vinculados a ti
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">3. Gana recompensas</h3>
              <p className="text-sm text-gray-600">
                Recibe €50 por cada referido que active una suscripción
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Tus Referidos</CardTitle>
          <CardDescription>Historial de personas que has invitado</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin referidos aún</h3>
              <p className="text-gray-500 mb-4">
                Comparte tu código para empezar a ganar recompensas
              </p>
              <Button onClick={shareReferral}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartir Código
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {referrals.map((referral) => (
                <div key={referral.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{referral.referidoNombre || referral.referidoEmail}</p>
                    <p className="text-sm text-gray-500">{referral.referidoEmail}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={estadoBadge(referral.estado)}>
                      {referral.estado}
                    </Badge>
                    {referral.recompensa && (
                      <span className="font-semibold text-green-600">+€{referral.recompensa}</span>
                    )}
                    <span className="text-sm text-gray-400">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
