'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Users, ArrowLeft, Mail, Phone, CreditCard } from 'lucide-react';

export default function InquilinoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession() || {};
  const [tenant, setTenant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/tenants/${params?.id}`);
        if (response.ok) {
          const data = await response.json();
          setTenant(data);
        }
      } catch (error) {
        console.error('Error fetching tenant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && params?.id) {
      fetchTenant();
    }
  }, [status, params]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!session || !tenant) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
          >
            <ArrowLeft size={20} />
            Volver
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-black text-white rounded-lg">
                  <Users size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{tenant?.nombreCompleto}</h1>
                  <p className="text-gray-600 mt-1">DNI: {tenant?.dni}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                tenant?.nivelRiesgo === 'bajo' ? 'bg-green-100 text-green-800' :
                tenant?.nivelRiesgo === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                Riesgo: {tenant?.nivelRiesgo}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </p>
                <p className="text-gray-900 font-medium">{tenant?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                  <Phone size={16} />
                  Teléfono
                </p>
                <p className="text-gray-900 font-medium">{tenant?.telefono}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                  <CreditCard size={16} />
                  Scoring
                </p>
                <p className="text-2xl font-bold text-gray-900">{tenant?.scoring}/100</p>
              </div>
            </div>

            {tenant?.notas && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Notas</p>
                <p className="text-gray-900">{tenant.notas}</p>
              </div>
            )}
          </div>

          {tenant?.contracts && tenant.contracts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contratos</h2>
              <div className="space-y-4">
                {tenant.contracts.map((contract: any) => (
                  <div key={contract?.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">
                        {contract?.unit?.building?.nombre} - {contract?.unit?.numero}
                      </p>
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">{contract?.estado}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(contract?.fechaInicio).toLocaleDateString('es-ES')} -{' '}
                      {new Date(contract?.fechaFin).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-2">
                      €{contract?.rentaMensual?.toLocaleString('es-ES')}/mes
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}