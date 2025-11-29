'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, Leaf, TrendingDown, Target, Award, FileText, Building2 } from 'lucide-react';

export default function ESGPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>ESG y Sostenibilidad</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-3xl font-bold mt-2">ESG y Sostenibilidad 🌱</h1>
              <p className="text-muted-foreground">Gestión de huella de carbono y certificaciones ambientales</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Emisiones CO2 Total</p>
                  <h3 className="text-2xl font-bold">124.5 t</h3>
                  <Badge variant="secondary" className="mt-1">Este Año</Badge>
                </div>
                <TrendingDown className="h-8 w-8 text-green-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reducción Lograda</p>
                  <h3 className="text-2xl font-bold text-green-600">-18%</h3>
                  <Badge variant="secondary" className="mt-1">vs Año Anterior</Badge>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Certificaciones</p>
                  <h3 className="text-2xl font-bold">3</h3>
                  <Badge variant="secondary" className="mt-1">Activas</Badge>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reportes ESG</p>
                  <h3 className="text-2xl font-bold">12</h3>
                  <Badge variant="secondary" className="mt-1">Generados</Badge>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </Card>
          </div>

          {/* Módulos ESG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Leaf className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-semibold">Huella de Carbono</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Cálculo automático de emisiones Scope 1, 2 y 3 con metodología GHG Protocol
              </p>
              <Button className="w-full">Calcular Huella</Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold">Plan de Descarbonización</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Roadmap personalizado con actuaciones priorizadas y análisis de ROI
              </p>
              <Button className="w-full" variant="outline">Ver Planes</Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="h-6 w-6 text-yellow-600" />
                <h3 className="text-xl font-semibold">Certificaciones ESG</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Gestión de LEED, BREEAM, VERDE y otras certificaciones ambientales
              </p>
              <Button className="w-full" variant="outline">Gestionar</Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-semibold">Reportes ESG</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Generación automática conforme CSRD, GRI, SASB y Taxonomía UE
              </p>
              <Button className="w-full" variant="outline">Generar Reporte</Button>
            </Card>
          </div>

          {/* Beneficios */}
          <Card className="p-6 mt-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <h3 className="text-xl font-semibold mb-3">💡 Beneficios del Módulo ESG</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">✓</Badge>
                <p className="text-sm">Cumplimiento normativa CSRD (obligatoria UE 2024)</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">✓</Badge>
                <p className="text-sm">Valor de propiedades aumenta 10-20% con certificación verde</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">✓</Badge>
                <p className="text-sm">Acceso a financiación verde (green bonds)</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">✓</Badge>
                <p className="text-sm">Atracción inquilinos ESG-conscious (millennials/Gen-Z)</p>
              </div>
            </div>
          </Card>
                  </div>
        </main>
      </div>
    </div>
  );
}
