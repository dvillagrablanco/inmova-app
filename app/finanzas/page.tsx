'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ArrowRightLeft,
  Building,
  TrendingUp,
  Euro,
  FileText,
  Home,
  CreditCard,
  PiggyBank,
  Wallet,
  Receipt,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  LineChart,
} from 'lucide-react';

interface FinanceModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  stats?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
  };
  available: boolean;
}

const financeModules: FinanceModule[] = [
  {
    id: 'conciliacion',
    title: 'Conciliación Bancaria',
    description: 'Vincula movimientos bancarios con facturas y recibos automáticamente',
    icon: <ArrowRightLeft className="h-6 w-6" />,
    href: '/finanzas/conciliacion',
    badge: 'IA',
    stats: {
      label: 'Pendientes',
      value: '5',
      trend: 'down',
    },
    available: true,
  },
  {
    id: 'open-banking',
    title: 'Open Banking',
    description: 'Conecta tus cuentas bancarias para sincronización automática',
    icon: <Building className="h-6 w-6" />,
    href: '/open-banking',
    stats: {
      label: 'Cuentas',
      value: '3',
    },
    available: true,
  },
  {
    id: 'cobros',
    title: 'Gestión de Cobros',
    description: 'Controla pagos de alquileres, cuotas y recibos pendientes',
    icon: <Euro className="h-6 w-6" />,
    href: '/pagos',
    stats: {
      label: 'Por cobrar',
      value: '€4,250',
    },
    available: true,
  },
  {
    id: 'facturas',
    title: 'Facturación',
    description: 'Emite y gestiona facturas, recibos y documentos fiscales',
    icon: <Receipt className="h-6 w-6" />,
    href: '/facturas',
    stats: {
      label: 'Este mes',
      value: '23',
      trend: 'up',
    },
    available: true,
  },
  {
    id: 'contabilidad',
    title: 'Integraciones Contables',
    description: 'Conecta con Contasimple, Holded, a3ERP y más herramientas contables',
    icon: <FileText className="h-6 w-6" />,
    href: '/contabilidad/integraciones',
    stats: {
      label: 'Conectadas',
      value: '1',
    },
    available: true,
  },
  {
    id: 'tesoreria',
    title: 'Tesorería',
    description: 'Previsión de flujo de caja y gestión de liquidez',
    icon: <Wallet className="h-6 w-6" />,
    href: '/finanzas/tesoreria',
    badge: 'Próximamente',
    available: false,
  },
  {
    id: 'presupuestos',
    title: 'Presupuestos',
    description: 'Crea y controla presupuestos anuales por propiedad',
    icon: <PiggyBank className="h-6 w-6" />,
    href: '/finanzas/presupuestos',
    badge: 'Próximamente',
    available: false,
  },
  {
    id: 'informes',
    title: 'Informes Financieros',
    description: 'Reportes de rentabilidad, P&L y balance por propiedad',
    icon: <BarChart3 className="h-6 w-6" />,
    href: '/analytics',
    stats: {
      label: 'Rentabilidad',
      value: '6.2%',
      trend: 'up',
    },
    available: true,
  },
];

export default function FinanzasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          Cargando...
        </div>
      </AuthenticatedLayout>
    );
  }

  // Resumen financiero (datos de ejemplo)
  const financialSummary = {
    totalBalance: 66661.25,
    monthlyIncome: 12450.00,
    monthlyExpenses: 3240.50,
    pendingPayments: 4250.00,
    overduePayments: 850.00,
    reconciliationRate: 87,
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Finanzas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Centro Financiero</h1>
              <p className="text-muted-foreground">
                Control completo de tus finanzas inmobiliarias
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/open-banking')}>
              <Building className="h-4 w-4 mr-2" />
              Conectar Banco
            </Button>
            <Button onClick={() => router.push('/finanzas/conciliacion')}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Conciliar
            </Button>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Wallet className="h-4 w-4" />
                <span className="text-xs">Saldo Total</span>
              </div>
              <p className="text-xl font-bold">
                {financialSummary.totalBalance.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Ingresos (mes)</span>
              </div>
              <p className="text-xl font-bold text-green-600">
                +{financialSummary.monthlyIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <LineChart className="h-4 w-4" />
                <span className="text-xs">Gastos (mes)</span>
              </div>
              <p className="text-xl font-bold text-red-600">
                -{financialSummary.monthlyExpenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Por Cobrar</span>
              </div>
              <p className="text-xl font-bold text-amber-600">
                {financialSummary.pendingPayments.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">Vencidos</span>
              </div>
              <p className="text-xl font-bold text-red-500">
                {financialSummary.overduePayments.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs">Conciliación</span>
              </div>
              <p className="text-xl font-bold">
                {financialSummary.reconciliationRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Módulos financieros */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Módulos Financieros</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {financeModules.map((module) => (
              <Card 
                key={module.id} 
                className={`hover:shadow-md transition-all cursor-pointer ${!module.available ? 'opacity-60' : ''}`}
                onClick={() => module.available && router.push(module.href)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      module.available 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {module.icon}
                    </div>
                    {module.badge && (
                      <Badge variant={module.badge === 'IA' ? 'default' : 'secondary'} className={module.badge === 'IA' ? 'bg-purple-500' : ''}>
                        {module.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-3">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {module.stats && module.available && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">{module.stats.label}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{module.stats.value}</span>
                        {module.stats.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {module.stats.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
                      </div>
                    </div>
                  )}
                  {module.available && (
                    <Button variant="ghost" className="w-full mt-2 justify-between" size="sm">
                      Acceder
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Accesos rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push('/finanzas/conciliacion')}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Conciliar movimientos
              </Button>
              <Button variant="outline" onClick={() => router.push('/facturas/nueva')}>
                <FileText className="h-4 w-4 mr-2" />
                Nueva factura
              </Button>
              <Button variant="outline" onClick={() => router.push('/pagos')}>
                <Euro className="h-4 w-4 mr-2" />
                Registrar cobro
              </Button>
              <Button variant="outline" onClick={() => router.push('/open-banking')}>
                <Building className="h-4 w-4 mr-2" />
                Ver cuentas bancarias
              </Button>
              <Button variant="outline" onClick={() => router.push('/contabilidad/integraciones')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Integraciones contables
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
