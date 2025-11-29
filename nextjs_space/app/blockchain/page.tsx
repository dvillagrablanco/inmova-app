'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, Link as LinkIcon, Coins, TrendingUp, Shield, Zap } from 'lucide-react';

export default function BlockchainPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Blockchain y Tokenización</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="mt-2 text-3xl font-bold">Blockchain y Tokenización</h1>
              <p className="text-muted-foreground">
                Tokenización de activos inmobiliarios e inversión fraccionada
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </div>

          {/* KPIs */}
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Propiedades Tokenizadas</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">En fase demo</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invertido</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€0</div>
                <p className="text-xs text-muted-foreground">Capital tokenizado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Holders Activos</CardTitle>
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Inversores registrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Smart Contracts</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Contratos desplegados</p>
              </CardContent>
            </Card>
          </div>

          {/* Módulos */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5" />
                      Tokenización de Propiedades
                    </CardTitle>
                    <CardDescription>
                      Crea tokens ERC-20 que representan fracciones de propiedades inmobiliarias
                    </CardDescription>
                  </div>
                  <Badge>DEMO</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    División de propiedad en fracciones (ej: 1000 tokens)
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Smart Contracts para distribución automática
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Registro inmutable en Polygon blockchain
                  </li>
                </ul>
                <Button className="mt-4 w-full" disabled>
                  Tokenizar Propiedad
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="h-5 w-5" />
                      Marketplace de Tokens
                    </CardTitle>
                    <CardDescription>
                      Compra y vende fracciones de propiedades con liquidez 24/7
                    </CardDescription>
                  </div>
                  <Badge>PRÓXIMAMENTE</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Mercado secundario con liquidez instant\u00e1nea
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Precio dinámico basado en oferta/demanda
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Wallet integrada con custodia segura
                  </li>
                </ul>
                <Button className="mt-4 w-full" variant="outline" disabled>
                  Ver Marketplace
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Distribución de Rentas
                    </CardTitle>
                    <CardDescription>
                      Pagos automáticos a holders según % de propiedad
                    </CardDescription>
                  </div>
                  <Badge>AUTOMÁTICO</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Distribución proporcional a tokens owned
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Ejecución automática mediante Smart Contract
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Transparencia total con blockchain público
                  </li>
                </ul>
                <Button className="mt-4 w-full" variant="outline" disabled>
                  Configurar Distribución
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      NFT Certificados
                    </CardTitle>
                    <CardDescription>
                      Certificados digitales únicos e inmutables
                    </CardDescription>
                  </div>
                  <Badge>BETA</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Certificados de propiedad únicos (NFT ERC-721)
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Historial inmutable de mantenimientos
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Autenticidad de documentos legales
                  </li>
                </ul>
                <Button className="mt-4 w-full" variant="outline" disabled>
                  Mint NFT Certificado
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Beneficios */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Ventajas Competitivas</CardTitle>
              <CardDescription>
                Democratización de la inversión inmobiliaria y liquidez instantánea
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h4 className="mb-2 font-semibold">💰 Democratización</h4>
                  <p className="text-sm text-muted-foreground">
                    Inversión desde €100 vs €50,000 tradicional
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">⚡ Liquidez</h4>
                  <p className="text-sm text-muted-foreground">
                    Venta instantánea vs 6-12 meses tradicional
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">🔒 Transparencia</h4>
                  <p className="text-sm text-muted-foreground">
                    Registro público e inmutable en blockchain
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
