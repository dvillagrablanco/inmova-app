'use client';

/**
 * Partners - Marketing
 *
 * Herramientas y campañas de marketing para partners
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Link2,
  Copy,
  ExternalLink,
  BarChart3,
  Mail,
  Globe,
  Share2,
  Megaphone,
  QrCode,
  Eye,
  MousePointer,
  UserPlus,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

const PARTNER_LINK = 'https://inmovaapp.com/?ref=PARTNER123';
const REFERRAL_CODE = 'PARTNER123';

export default function PartnersMarketingPage() {
  const [activeTab, setActiveTab] = useState('links');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const stats = {
    totalClicks: null as number | null,
    conversiones: null as number | null,
    tasaConversion: null as number | null,
    ingresoGenerado: null as number | null,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Marketing</h1>
        <p className="text-muted-foreground">Herramientas y campañas para promocionar Inmova</p>
      </div>

      {/* Stats - empty state until partner API */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">
                  {stats.totalClicks != null ? stats.totalClicks.toLocaleString() : '—'}
                </p>
              </div>
              <MousePointer className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversiones</p>
                <p className="text-2xl font-bold">
                  {stats.conversiones != null ? stats.conversiones : '—'}
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa Conversión</p>
                <p className="text-2xl font-bold">
                  {stats.tasaConversion != null ? `${stats.tasaConversion}%` : '—'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comisiones</p>
                <p className="text-2xl font-bold">
                  {stats.ingresoGenerado != null
                    ? `€${stats.ingresoGenerado.toLocaleString()}`
                    : '—'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="links">
            <Link2 className="h-4 w-4 mr-2" />
            Links
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Megaphone className="h-4 w-4 mr-2" />
            Campañas
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Mail className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="landing">
            <Globe className="h-4 w-4 mr-2" />
            Landing
          </TabsTrigger>
        </TabsList>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Tu Link de Referido
              </CardTitle>
              <CardDescription>
                Comparte este link para que los nuevos clientes se registren con tu código
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL de Referido</label>
                <div className="flex gap-2">
                  <Input value={PARTNER_LINK} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={() => copyToClipboard(PARTNER_LINK, 'Link')}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Código de Referido</label>
                <div className="flex gap-2">
                  <Input value={REFERRAL_CODE} readOnly className="font-mono text-sm max-w-xs" />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(REFERRAL_CODE, 'Código')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir en Twitter
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir en LinkedIn
                </Button>
                <Button variant="outline" size="sm">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generar QR
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* UTM Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Constructor de UTM</CardTitle>
              <CardDescription>
                Crea links personalizados para trackear tus campañas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fuente (utm_source)</label>
                  <Input placeholder="ej: newsletter, facebook, google" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Medio (utm_medium)</label>
                  <Input placeholder="ej: email, cpc, social" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Campaña (utm_campaign)</label>
                  <Input placeholder="ej: promocion-enero" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contenido (utm_content)</label>
                  <Input placeholder="ej: banner-principal" />
                </div>
              </div>
              <Button>
                <Link2 className="h-4 w-4 mr-2" />
                Generar Link con UTM
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Mis Campañas
              </CardTitle>
              <CardDescription>
                Seguimiento del rendimiento de tus campañas de marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Datos no disponibles — Módulo en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Plantillas de Email
              </CardTitle>
              <CardDescription>Emails pre-diseñados para tus campañas de marketing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Datos no disponibles — Módulo en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Landing Tab */}
        <TabsContent value="landing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Tu Landing Page Personalizada
              </CardTitle>
              <CardDescription>Landing page con tu branding para captar leads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">landing.inmovaapp.com/partner123</p>
                    <p className="text-sm text-muted-foreground">
                      Tu landing page personalizada está activa
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={PARTNER_LINK} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver
                      </a>
                    </Button>
                    <Button size="sm">Personalizar</Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg text-center">
                  <Eye className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">—</p>
                  <p className="text-sm text-muted-foreground">Visitas totales</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <UserPlus className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">—</p>
                  <p className="text-sm text-muted-foreground">Registros</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <TrendingUp className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <p className="text-2xl font-bold">—</p>
                  <p className="text-sm text-muted-foreground">Tasa de conversión</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
