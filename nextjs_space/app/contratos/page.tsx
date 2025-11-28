'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { FileText, Plus, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ContratosPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch('/api/contracts');
        if (response.ok) {
          const data = await response.json();
          setContracts(data);
        }
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchContracts();
    }
  }, [status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!session) return null;

  const getExpirationAlert = (days: number) => {
    if (days < 0) return { color: 'bg-red-100 text-red-800', text: 'Vencido' };
    if (days <= 30) return { color: 'bg-red-100 text-red-800', text: `${days} días` };
    if (days <= 60) return { color: 'bg-yellow-100 text-yellow-800', text: `${days} días` };
    if (days <= 90) return { color: 'bg-blue-100 text-blue-800', text: `${days} días` };
    return { color: 'bg-green-100 text-green-800', text: `${days} días` };
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
              <p className="text-gray-600 mt-1">Gestiona todos los contratos</p>
            </div>
            <button
              onClick={() => router.push('/contratos/nuevo')}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              <Plus size={20} />
              Nuevo Contrato
            </button>
          </div>

          {/* Contracts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((contract) => {
              const alert = getExpirationAlert(contract?.diasHastaVencimiento || 0);
              return (
                <Link
                  key={contract?.id}
                  href={`/contratos/${contract?.id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                      <FileText size={24} />
                    </div>
                    {contract?.diasHastaVencimiento <= 90 && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${alert.color}`}>
                        {alert.text}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {contract?.unit?.building?.nombre} - {contract?.unit?.numero}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Inquilino:</span>
                      <span className="truncate">{contract?.tenant?.nombreCompleto}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>
                        {new Date(contract?.fechaInicio).toLocaleDateString('es-ES')} -{' '}
                        {new Date(contract?.fechaFin).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{contract?.tipo}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{contract?.estado}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Renta mensual</p>
                    <p className="text-lg font-bold text-gray-900">
                      €{contract?.rentaMensual?.toLocaleString('es-ES')}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {contracts.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay contratos registrados</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}