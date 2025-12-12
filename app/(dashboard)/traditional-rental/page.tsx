'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  TrendingUp,
  FileText,
  RefreshCw,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';


export default function TraditionalRentalDashboard() {
  const modules = [
    {
      title: 'Gestión de Comunidades',
      description: 'Actas digitales, cuotas, fondos y votaciones telemáticas',
      icon: Building2,
      href: '/traditional-rental/communities',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      stats: [
        { label: 'Actas pendientes', value: '3' },
        { label: 'Cuotas este mes', value: '€12,500' },
      ],
    },
    {
      title: 'Tesorería Avanzada',
      description: 'Cash flow, fianzas, provisiones y alertas financieras',
      icon: TrendingUp,
      href: '/traditional-rental/treasury',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      stats: [
        { label: 'Provisiones impagos', value: '€2,340' },
        { label: 'Alertas activas', value: '5' },
      ],
    },
    {
      title: 'Cumplimiento Legal',
      description: 'CEE, ITE, Cédulas de habitabilidad, Modelo 347/180',
      icon: FileText,
      href: '/traditional-rental/compliance',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      stats: [
        { label: 'Certificados vigentes', value: '24' },
        { label: 'Próximos a vencer', value: '4' },
      ],
    },
    {
      title: 'Renovaciones Inteligentes',
      description: 'Análisis predictivo, IPC automático y propuestas',
      icon: RefreshCw,
      href: '/traditional-rental/renewals',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      stats: [
        { label: 'Próximos a vencer', value: '8' },
        { label: 'Probabilidad media', value: '72%' },
      ],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Alquiler Tradicional - Módulos Avanzados
              </h1>
              <p className="text-gray-600">
                Gestión profesional e integral de alquileres tradicionales con IA
              </p>
            </div>

            {/* Módulos principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Card key={module.title} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${module.bgColor}`}>
                        <Icon className={`h-6 w-6 ${module.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{module.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">{module.description}</p>

                        {/* Estadísticas rápidas */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {module.stats.map((stat) => (
                            <div key={stat.label} className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-500">{stat.label}</p>
                              <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
                            </div>
                          ))}
                        </div>

                        <Link href={module.href}>
                          <Button className="w-full" variant="outline">
                            Acceder al módulo
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Alertas recientes */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Alertas Recientes
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">4 certificados CEE vencen en 60 días</p>
                    <p className="text-xs text-gray-600">Renovar antes del 15/02/2025</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Ver
                  </Button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Cash flow negativo proyectado en Marzo 2025
                    </p>
                    <p className="text-xs text-gray-600">Déficit estimado: €3,200</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Ver
                  </Button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">8 renovaciones pendientes de respuesta</p>
                    <p className="text-xs text-gray-600">Probabilidad media de aceptación: 72%</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Ver
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
