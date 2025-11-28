'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { FileBarChart, Download, Building2, TrendingUp, AlertTriangle } from 'lucide-react';

export default function ReportesPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!session) return null;

  const reports = [
    {
      id: 'ocupacion',
      title: 'Informe de Ocupación',
      description: 'Análisis detallado de las tasas de ocupación por edificio y tipo de unidad',
      icon: Building2,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'financiero',
      title: 'Informe Financiero Mensual',
      description: 'Resumen de ingresos, gastos y margen neto del mes actual',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-800',
    },
    {
      id: 'morosidad',
      title: 'Informe de Morosidad',
      description: 'Listado de pagos atrasados y análisis de riesgo por inquilino',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800',
    },
  ];

  const handleExport = async (reportType: string) => {
    setIsLoading(true);
    try {
      // Placeholder for actual export functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Exportando reporte de ${reportType}...`);
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
            <p className="text-gray-600 mt-1">
              Genera y exporta informes detallados de tu cartera inmobiliaria
            </p>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <div
                  key={report.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
                >
                  <div className={`inline-flex p-3 rounded-lg mb-4 ${report.color}`}>
                    <Icon size={24} />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-6">{report.description}</p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport(report.id)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      <Download size={16} />
                      <span>Exportar Excel</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Message */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <FileBarChart size={24} className="text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-1">Sobre los reportes</h3>
                <p className="text-sm text-blue-800">
                  Los reportes se generan con los datos más recientes de la base de datos. 
                  Puedes exportarlos en formato Excel para un análisis más detallado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}