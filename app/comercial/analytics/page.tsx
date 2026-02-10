'use client';

import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, ChevronRight, TrendingUp, Euro, Building2, Users } from 'lucide-react';

export default function ComercialAnalyticsPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/comercial" className="hover:text-blue-600">Alquiler Comercial</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-900">Analiticas</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-red-600" />
            Analiticas Comerciales
          </h1>
          <p className="text-gray-600 mt-1">Metricas de rendimiento de tu cartera comercial</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Tasa Ocupacion</div><div className="text-2xl font-bold text-green-600">0%</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Rentabilidad</div><div className="text-2xl font-bold">0%</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Conversion leads</div><div className="text-2xl font-bold text-blue-600">0%</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Ingresos anuales</div><div className="text-2xl font-bold">0 EUR</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Evolucion de Ingresos</CardTitle></CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              Los graficos se mostraran cuando haya datos de pagos
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Ocupacion por Tipo</CardTitle></CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              Agrega espacios comerciales para ver estadisticas
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Funnel de Leads</CardTitle></CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              Los datos del funnel apareceran al registrar leads
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Euro className="h-5 w-5" />Comparativa Mensual</CardTitle></CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              Comparativa disponible con datos de al menos 2 meses
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
